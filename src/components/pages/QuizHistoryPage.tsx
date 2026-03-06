import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface FlashCard {
  id: number;
  front: string;
  back: string;
}

interface PlacedWord {
  id: number;
  word: string;
  clue: string;
  number: number;
  direction: 'across' | 'down';
  row: number;
  col: number;
  length: number;
}

interface CrosswordData {
  grid: string[][];
  clues: {
    across: Array<{ number: number; clue: string; answer: string; row: number; col: number; }>;
    down: Array<{ number: number; clue: string; answer: string; row: number; col: number; }>;
  };
  gridSize: { width: number; height: number; };
  placedWords?: PlacedWord[];
}

interface StudyTool {
  id: string;
  title: string;
  quiz_type: string;
  difficulty: string;
  question_count: number;
  questions: QuizQuestion[] | FlashCard[] | CrosswordData;
  source_word_count: number;
  created_at: string;
  expires_at: string | null;
}

interface QuizHistoryProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

type FilterType = 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast';

const QuizHistoryPage = ({ onNavigate, user, onLogout }: QuizHistoryProps) => {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userPlan = user?.plan || user?.subscription_plan || 'free';
  const isPaidUser = userPlan === 'starter' || userPlan === 'premium';

  useEffect(() => {
    fetchStudyToolHistory();
  }, []);

  const fetchStudyToolHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch study tool history');
      }

      if (data.success) {
        setStudyTools(data.data || []);
      } else {
        throw new Error('Failed to fetch study tool history');
      }

    } catch (error) {
      console.error('Study tool history error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load study tool history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTools = studyTools.filter(tool => {
    if (filter === 'all') return true;
    if (filter === 'quiz') return !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
    return tool.quiz_type === filter;
  });

  const getToolIcon = (type: string) => {
    if (type === 'flashcards') return '🃏';
    if (type === 'crossword') return '🧩';
    if (type === 'crater_blast') return '💥';
    return '📝';
  };

  const getToolTypeName = (type: string) => {
    if (type === 'flashcards') return 'Flashcards';
    if (type === 'crossword') return 'Crossword';
    if (type === 'crater_blast') return 'Crater Blast';
    return 'Quiz';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null; // null means permanent (paid users)
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const startStudyTool = (tool: StudyTool) => {
    if (tool.quiz_type === 'flashcards') {
      localStorage.setItem('savedFlashcards', JSON.stringify(tool));
      onNavigate('flashcard-generator');
    } else if (tool.quiz_type === 'crossword') {
      localStorage.setItem('savedCrossword', JSON.stringify(tool));
      onNavigate('crossword-generator');
    } else if (tool.quiz_type === 'crater_blast') {
      localStorage.setItem('savedCraterBlast', JSON.stringify(tool));
      onNavigate('crater-blast');
    } else {
      localStorage.setItem('savedQuiz', JSON.stringify(tool));
      onNavigate('quiz-generator');
    }
  };

  const startNewStudyTool = () => {
    onNavigate('quiz-generator');
  };

  const handleDeleteClick = (quizId: string) => {
    setDeleteConfirmId(quizId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const confirmDelete = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete study tool');
      }

      setStudyTools(studyTools.filter(tool => tool.id !== quizId));
      setDeleteConfirmId(null);

    } catch (error) {
      console.error('Delete study tool error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete study tool');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
      case 'medium': return 'bg-amber-50 text-amber-700';
      case 'hard': return 'bg-red-50 text-red-700';
      default: return 'bg-stone-50 text-stone-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'fill_blank': return 'Fill in the Blank';
      case 'mixed': return 'Mixed';
      case 'flashcards': return 'Flashcards';
      case 'crossword': return 'Crossword';
      case 'crater_blast': return 'Crater Blast';
      default: return type;
    }
  };

  const exportQuizToPDF = (quiz: StudyTool) => {
    const qType = quiz.quiz_type || 'mixed';
    const qs = (quiz.questions as QuizQuestion[]) || [];
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(quiz.title || 'Quiz', 170);
    doc.text(titleText, margin, yPos);
    yPos += titleText.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${qType} | Difficulty: ${quiz.difficulty} | Questions: ${qs.length}`, margin, yPos);
    yPos += 15;

    qs.forEach((q: QuizQuestion, idx: number) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, margin, yPos);
      yPos += splitQuestion.length * lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (q.type === 'true_false') {
        doc.text('   [ ] True    [ ] False', margin, yPos);
        yPos += lineHeight;
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
          const optText = `   [ ] ${opt}`;
          const splitOpt = doc.splitTextToSize(optText, 165);
          doc.text(splitOpt, margin, yPos);
          yPos += splitOpt.length * lineHeight;
        });
      }
      yPos += 8;
    });

    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    qs.forEach((q: QuizQuestion, idx: number) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(expText, margin, yPos);
        yPos += expText.length * lineHeight + 3;
      }
    });

    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async (quiz: StudyTool) => {
    const qType = quiz.quiz_type || 'mixed';
    const qs = (quiz.questions as QuizQuestion[]) || [];
    const children: any[] = [];

    children.push(new Paragraph({ text: quiz.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${qType} | Difficulty: ${quiz.difficulty} | Questions: ${qs.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    qs.forEach((q: QuizQuestion, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
      if (q.type === 'true_false') {
        children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          children.push(new Paragraph({ text: `   ☐ ${opt}` }));
        });
      }
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    qs.forEach((q: QuizQuestion, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `quiz-${Date.now()}.docx`);
  };

  const exportFlashcardsToPDF = (tool: StudyTool) => {
    const cards = (tool.questions as FlashCard[]) || [];
    if (!cards.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(tool.title || 'Flashcards', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${cards.length} cards`, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    cards.forEach((card: FlashCard, idx: number) => {
      if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }

      // Card number
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 120, 0);
      doc.text(`Card ${idx + 1}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 6;

      // Front
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Front:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const frontLines = doc.splitTextToSize(card.front || '', 165);
      doc.text(frontLines, margin + 4, yPos);
      yPos += frontLines.length * 6 + 4;

      // Back
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Back:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(card.back || '', 165);
      doc.text(backLines, margin + 4, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += backLines.length * 6 + 10;

      // Divider
      if (idx < cards.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos - 4, 190, yPos - 4);
      }
    });

    doc.save(`flashcards-${Date.now()}.pdf`);
  };

  const exportFlashcardsToDOCX = async (tool: StudyTool) => {
    const cards = (tool.questions as FlashCard[]) || [];
    if (!cards.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: tool.title || 'Flashcards', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${cards.length} cards`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    cards.forEach((card: FlashCard, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Card ${idx + 1}`, bold: true, color: 'B47800', size: 20 })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Front: ', bold: true }), new TextRun({ text: card.front || '' })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Back: ', bold: true }), new TextRun({ text: card.back || '', color: '3C643C' })] }));
      children.push(new Paragraph({ text: '' }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `flashcards-${Date.now()}.docx`);
  };

  const exportCrosswordToPDF = (tool: StudyTool) => {
    const crosswordData = tool.questions as CrosswordData;
    const placedWords = crosswordData?.placedWords || [];
    if (!placedWords.length) return;
    
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(tool.title || 'Crossword', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${placedWords.length} words`, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 12;

    // Draw crossword grid
    const grid = crosswordData.grid;
    if (grid?.length) {
      const cellSize = Math.min(8, Math.floor(160 / grid[0].length));
      const gridStartX = margin;
      const gridStartY = yPos;

      grid.forEach((row: string[], ri: number) => {
        row.forEach((cell: string, ci: number) => {
          const x = gridStartX + ci * cellSize;
          const y = gridStartY + ri * cellSize;
          if (cell !== '') {
            doc.setDrawColor(100, 100, 100);
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, cellSize, cellSize, 'FD');
            // Cell number
            const wordAtCell = placedWords.find((pw: PlacedWord) => pw.row === ri && pw.col === ci);
            if (wordAtCell) {
              doc.setFontSize(4);
              doc.setTextColor(80, 80, 80);
              doc.text(String(wordAtCell.number), x + 0.5, y + 3.5);
              doc.setTextColor(0, 0, 0);
            }
          } else {
            doc.setFillColor(40, 40, 40);
            doc.rect(x, y, cellSize, cellSize, 'F');
          }
        });
      });

      yPos = gridStartY + grid.length * cellSize + 14;
    }

    // Clues
    ['across', 'down'].forEach(dir => {
      const words = placedWords
        .filter((pw: PlacedWord) => pw.direction === dir)
        .sort((a: PlacedWord, b: PlacedWord) => a.number - b.number);
      if (!words.length) return;

      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos);
      yPos += 8;

      words.forEach((pw: PlacedWord) => {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const clueText = doc.splitTextToSize(`${pw.number}. ${pw.clue} (${pw.word.length} letters)`, 165);
        doc.text(clueText, margin + 2, yPos);
        yPos += clueText.length * 6 + 2;
      });
      yPos += 4;
    });

    // Answer key
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 8;
    const allWords = [...placedWords].sort((a: PlacedWord, b: PlacedWord) => a.number - b.number);
    allWords.forEach((pw: PlacedWord) => {
      if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pw.number}. ${pw.word} (${pw.direction})`, margin + 2, yPos);
      yPos += 6;
    });

    doc.save(`crossword-${Date.now()}.pdf`);
  };

  const exportCrosswordToDOCX = async (tool: StudyTool) => {
    const crosswordData = tool.questions as CrosswordData;
    const placedWords = crosswordData?.placedWords || [];
    if (!placedWords.length) return;
    
    const children: any[] = [];

    children.push(new Paragraph({ text: tool.title || 'Crossword', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${placedWords.length} words`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    ['across', 'down'].forEach(dir => {
      const words = placedWords
        .filter((pw: PlacedWord) => pw.direction === dir)
        .sort((a: PlacedWord, b: PlacedWord) => a.number - b.number);
      if (!words.length) return;

      children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
      words.forEach((pw: PlacedWord) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] }));
      });
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    const allWords = [...placedWords].sort((a: PlacedWord, b: PlacedWord) => a.number - b.number);
    allWords.forEach((pw: PlacedWord) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.word}`, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `crossword-${Date.now()}.docx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-2 border-stone-300 border-t-violet-500 rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-stone-500">Loading study tools...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Couldn&apos;t load</h2>
            <p className="text-sm text-stone-500 mb-6">{error}</p>
            <button
              onClick={fetchStudyToolHistory}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-sm transition-all"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const filterTabs = [
    { key: 'all' as FilterType, label: 'All', icon: '📚', count: studyTools.length },
    { key: 'quiz' as FilterType, label: 'Quizzes', icon: '📝', count: studyTools.filter(t => !['flashcards', 'crossword', 'crater_blast'].includes(t.quiz_type)).length },
    { key: 'flashcards' as FilterType, label: 'Flashcards', icon: '🃏', count: studyTools.filter(t => t.quiz_type === 'flashcards').length },
    { key: 'crossword' as FilterType, label: 'Crosswords', icon: '🧩', count: studyTools.filter(t => t.quiz_type === 'crossword').length },
    { key: 'crater_blast' as FilterType, label: 'Crater Blast', icon: '💥', count: studyTools.filter(t => t.quiz_type === 'crater_blast').length },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero - compact and sleek */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                🧠
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                  My Study Tools
                </h1>
                <p className="text-sm text-stone-500 mt-0.5">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} saved
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={startNewStudyTool}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
        </div>

        {/* Crater Blast Banner */}
        <button
          onClick={() => onNavigate('crater-blast')}
          className="w-full mb-8 group relative overflow-hidden rounded-2xl border border-indigo-200/60 transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #818cf8 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
          <div className="relative px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
                💥
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-base">Crater Blast</div>
                <div className="text-indigo-200 text-sm">AI quiz shooter — blast the correct crater before it lands</div>
              </div>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold group-hover:bg-white/30 transition-colors">
              Play Now →
            </div>
          </div>
        </button>

        {/* Filter tabs - pill style */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                  : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900 border border-stone-200/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === tab.key ? 'bg-white/20' : 'bg-stone-100'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Storage notice - compact inline */}
        <div className={`mb-8 px-4 py-3 rounded-xl flex items-center gap-4 ${isPaidUser ? 'bg-violet-50/80 border border-violet-200/60 dark:bg-violet-900/20 dark:border-violet-700/40' : 'bg-amber-50/80 border border-amber-200/60'}`}>
          {isPaidUser ? (
            <>
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-violet-800 dark:text-violet-200">
                <strong>Permanent storage</strong> — Your study tools never expire. Export to PDF or Word anytime.
              </p>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-amber-800 flex-1">
                Free plan: tools expire in 7 days.{' '}
                <button onClick={() => onNavigate('pricing')} className="font-semibold underline underline-offset-2 hover:text-amber-900">
                  Upgrade
                </button>{' '}
                for permanent storage & export.
              </p>
            </>
          )}
        </div>

        {/* Study Tool Grid */}
        {filteredTools.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-12 sm:p-16 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl bg-violet-100 dark:bg-violet-900/30">
              🧠
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              {filter === 'all' ? 'No study tools yet' : `No ${getTypeLabel(filter === 'quiz' ? 'mixed' : filter)} yet`}
            </h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              {filter === 'all' 
                ? 'Create quizzes, flashcards, or crosswords from your notes to get started.'
                : `Create your first ${filter === 'quiz' ? 'quiz' : filter} to see it here.`}
            </p>
            <button
              onClick={startNewStudyTool}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all hover:shadow-lg hover:shadow-violet-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Study Tool
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const daysRemaining = getDaysRemaining(tool.expires_at);
              const isQuiz = !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
              const toolIcon = getToolIcon(tool.quiz_type);
              const typeColors = {
                quiz: { bg: 'bg-blue-50', text: 'text-blue-700' },
                flashcards: { bg: 'bg-violet-50', text: 'text-violet-700' },
                crossword: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
                crater_blast: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
              };
              const colors = tool.quiz_type === 'flashcards' ? typeColors.flashcards
                : tool.quiz_type === 'crossword' ? typeColors.crossword
                : tool.quiz_type === 'crater_blast' ? typeColors.crater_blast
                : typeColors.quiz;
              
              return (
                <div
                  key={tool.id}
                  className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300/80 transition-all overflow-hidden"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors.bg} ${colors.text}`}>
                            {toolIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-stone-900 truncate">
                              {tool.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(tool.created_at)}
                              </span>
                              {isQuiz && (
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getDifficultyColor(tool.difficulty)}`}>
                                  {tool.difficulty}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {getTypeLabel(tool.quiz_type)}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-600">
                                {tool.question_count} {tool.quiz_type === 'flashcards' ? 'cards' : tool.quiz_type === 'crossword' ? 'words' : tool.quiz_type === 'crater_blast' ? 'questions' : 'questions'}
                              </span>
                              {daysRemaining === null ? (
                                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                                  Permanent
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${daysRemaining <= 2 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining}d left`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                        <button
                          onClick={() => startStudyTool(tool)}
                          className="px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2"
                        >
                          {tool.quiz_type === 'flashcards' ? 'Study' : tool.quiz_type === 'crossword' || tool.quiz_type === 'crater_blast' ? 'Play' : 'Take Quiz'}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>

                        {isPaidUser && tool.quiz_type !== 'crater_blast' ? (
                          <>
                            <button
                              onClick={() => {
                                if (tool.quiz_type === 'flashcards') exportFlashcardsToPDF(tool);
                                else if (tool.quiz_type === 'crossword') exportCrosswordToPDF(tool);
                                else exportQuizToPDF(tool);
                              }}
                              className="p-2.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                              title="Export PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button
                              onClick={() => {
                                if (tool.quiz_type === 'flashcards') exportFlashcardsToDOCX(tool);
                                else if (tool.quiz_type === 'crossword') exportCrosswordToDOCX(tool);
                                else exportQuizToDOCX(tool);
                              }}
                              className="p-2.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                              title="Export Word"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="p-2.5 rounded-xl bg-stone-100 text-stone-400 hover:bg-stone-200 transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Upgrade to export"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteClick(tool.id)}
                          className="p-2.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Preview strip */}
                    {(isQuiz && Array.isArray(tool.questions) && tool.questions.length > 0) || (tool.quiz_type === 'flashcards' && Array.isArray(tool.questions) && tool.questions.length > 0) || tool.quiz_type === 'crossword' || (tool.quiz_type === 'crater_blast' && (tool.questions as any)?.questions?.length > 0) ? (
                      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
                        {isQuiz && (
                          <>
                            <span className="text-xs text-stone-500 font-medium">Preview:</span>
                            {(tool.questions as QuizQuestion[]).slice(0, 2).map((q, i) => (
                              <span key={i} className="px-2 py-1 bg-stone-50 text-stone-600 rounded-lg text-xs max-w-[200px] truncate">
                                {q.question.length > 45 ? q.question.substring(0, 45) + '…' : q.question}
                              </span>
                            ))}
                            {(tool.questions as QuizQuestion[]).length > 2 && (
                              <span className="text-xs text-stone-400">+{(tool.questions as QuizQuestion[]).length - 2} more</span>
                            )}
                          </>
                        )}
                        {tool.quiz_type === 'flashcards' && (
                          <>
                            <span className="text-xs text-stone-500 font-medium">Preview:</span>
                            {(tool.questions as FlashCard[]).slice(0, 2).map((card, i) => (
                              <span key={i} className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs max-w-[200px] truncate">
                                {card.front.length > 40 ? card.front.substring(0, 40) + '…' : card.front}
                              </span>
                            ))}
                            {(tool.questions as FlashCard[]).length > 2 && (
                              <span className="text-xs text-stone-400">+{(tool.questions as FlashCard[]).length - 2} more</span>
                            )}
                          </>
                        )}
                        {tool.quiz_type === 'crossword' && (
                          <>
                            <span className="text-xs text-stone-500 font-medium">Puzzle:</span>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                              {((tool.questions as CrosswordData)?.clues?.across?.length || 0)} across
                            </span>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                              {((tool.questions as CrosswordData)?.clues?.down?.length || 0)} down
                            </span>
                          </>
                        )}
                        {tool.quiz_type === 'crater_blast' && (
                          <>
                            <span className="text-xs text-stone-500 font-medium">Game:</span>
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs">
                              {((tool.questions as any)?.questions?.length || 0)} questions
                            </span>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200/80">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Delete study tool?</h3>
                <p className="text-sm text-stone-500 mt-1">This can&apos;t be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium text-sm"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Export Feature */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200/80">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-violet-100 dark:bg-violet-900/30">
                <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Unlock export</h3>
              <p className="text-sm text-stone-500">
                Export to PDF or Word with a paid plan.
              </p>
            </div>
            <ul className="space-y-3 mb-6">
              {['Export to PDF & Word', 'Permanent storage', 'Unlimited generations', 'All question types'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-stone-700">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
              >
                Later
              </button>
              <button
                onClick={() => { setShowUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-medium text-sm transition-all"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default QuizHistoryPage;
