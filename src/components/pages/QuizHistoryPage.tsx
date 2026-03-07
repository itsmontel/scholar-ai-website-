import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { getExpiringSoonCount, getExpiringSoonUrgencyText } from '../../utils/usageReset';

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
  initialFilter?: FilterType;
}

interface Friend {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  friend_code: string;
  username?: string;
}

type FilterType = 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast';
type TimePeriod = 'all' | '7days' | '30days' | '3months';

const QuizHistoryPage = ({ onNavigate, user, onLogout, initialFilter: initialFilterProp }: QuizHistoryProps) => {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<FilterType>(initialFilterProp ?? 'all');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Rename functionality state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToolId, setShareToolId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const userPlan = user?.plan || user?.subscription_plan || 'free';
  const isPaidUser = userPlan === 'starter' || userPlan === 'premium';

  useEffect(() => {
    fetchStudyToolHistory();
  }, []);

  // Sync filter from URL on mount (e.g. when navigating via "Load Previous Deck" with ?filter=flashcards)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get('filter');
    if (f && (['all', 'quiz', 'flashcards', 'crossword', 'crater_blast'] as const).includes(f as any)) {
      setFilter(f as FilterType);
    }
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

  const getTimePeriodDate = (period: TimePeriod): Date | null => {
    const now = new Date();
    switch (period) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const filteredTools = studyTools.filter(tool => {
    const cutoffDate = getTimePeriodDate(timePeriod);
    if (cutoffDate && new Date(tool.created_at) < cutoffDate) {
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'quiz') return !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
    return tool.quiz_type === filter;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTools.length / PAGE_SIZE));
  const paginatedTools = filteredTools.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, timePeriod]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const getToolIcon = (type: string) => {
    if (type === 'flashcards') return '🃏';
    if (type === 'crossword') return '🧩';
    if (type === 'crater_blast') return '💥';
    return '📝';
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

  const startRename = (tool: StudyTool) => {
    setRenamingId(tool.id);
    setRenameValue(tool.title);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const saveRename = async (toolId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/analysis/quiz/${toolId}/rename`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: trimmed })
      });
      const data = await response.json();
      if (data.success) {
        setStudyTools(prev => prev.map(t => t.id === toolId ? { ...t, title: trimmed } : t));
      }
    } catch (e) {
      console.error('Failed to rename:', e);
    } finally {
      setIsRenaming(false);
      setRenamingId(null);
      setRenameValue('');
    }
  };

  // Share functionality
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const openShareModal = (toolId: string) => {
    setShareToolId(toolId);
    setShowShareModal(true);
    setSelectedFriendId(null);
    setShareMessage('');
    setShareError(null);
    setShareSuccess(null);
    fetchFriends();
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareToolId(null);
    setSelectedFriendId(null);
    setShareMessage('');
    setShareError(null);
    setShareSuccess(null);
  };

  const handleShare = async () => {
    if (!selectedFriendId || !shareToolId) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${API_URL}/friends/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          friendId: selectedFriendId,
          quizId: shareToolId,
          message: shareMessage || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setShareSuccess('Shared successfully!');
        setTimeout(() => {
          closeShareModal();
        }, 1500);
      } else {
        setShareError(data.message || 'Failed to share');
      }
    } catch (err) {
      setShareError('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getFriendName = (friend: Friend) => {
    if (friend.username) return `@${friend.username}`;
    const name = `${friend.first_name || ''} ${friend.last_name || ''}`.trim();
    return name || friend.email || 'Unknown';
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
    { key: 'all' as FilterType, label: 'All', icon: '📚', count: studyTools.length, color: 'stone' },
    { key: 'quiz' as FilterType, label: 'Quizzes', icon: '📝', count: studyTools.filter(t => !['flashcards', 'crossword', 'crater_blast'].includes(t.quiz_type)).length, color: 'blue' },
    { key: 'flashcards' as FilterType, label: 'Flashcards', icon: '🃏', count: studyTools.filter(t => t.quiz_type === 'flashcards').length, color: 'fuchsia' },
    { key: 'crossword' as FilterType, label: 'Crosswords', icon: '🧩', count: studyTools.filter(t => t.quiz_type === 'crossword').length, color: 'emerald' },
    { key: 'crater_blast' as FilterType, label: 'Crater Blast', icon: '💥', count: studyTools.filter(t => t.quiz_type === 'crater_blast').length, color: 'orange' },
  ];

  const timePeriodOptions = [
    { key: 'all' as TimePeriod, label: 'All Time' },
    { key: '7days' as TimePeriod, label: 'Last 7 Days' },
    { key: '30days' as TimePeriod, label: 'Last 30 Days' },
    { key: '3months' as TimePeriod, label: 'Last 3 Months' },
  ];

  const getFilterTabStyle = (tab: typeof filterTabs[0], isActive: boolean) => {
    if (!isActive) {
      return 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900 border border-stone-200/80';
    }
    switch (tab.color) {
      case 'blue':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25';
      case 'fuchsia':
        return 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/25';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25';
      case 'orange':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25';
      default:
        return 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25';
    }
  };

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

          {/* Urgency warning when items are expiring soon (≤7 days) */}
          {!isPaidUser && (() => {
            const expiringSoonCount = getExpiringSoonCount(studyTools, 7);
            const urgencyText = getExpiringSoonUrgencyText(expiringSoonCount);
            return expiringSoonCount > 0 && urgencyText && (
              <div className={`mb-6 p-4 rounded-xl border ${expiringSoonCount <= 2 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-xl flex-shrink-0">{expiringSoonCount <= 2 ? '⚠️' : '⏰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${expiringSoonCount <= 2 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                      {urgencyText}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${expiringSoonCount <= 2 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            );
          })()}
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

        {/* Filter Controls - Type + Time Period */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Type Filter */}
            <div className="flex-1">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Filter by Type</div>
              <div className="flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${getFilterTabStyle(tab, filter === tab.key)}`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === tab.key ? 'bg-white/20' : 'bg-stone-100'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="lg:border-l lg:border-stone-200 lg:pl-4">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Time Period</div>
              <div className="flex flex-wrap gap-1.5">
                {timePeriodOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setTimePeriod(option.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      timePeriod === option.key
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results count when filtering */}
        {(filter !== 'all' || timePeriod !== 'all') && (
          <div className="mb-4 flex items-center gap-2 text-sm text-stone-600">
            <span className="font-medium">{filteredTools.length}</span>
            <span>
              {filter === 'all' ? 'tool' : filter === 'quiz' ? 'quiz' : filter === 'flashcards' ? 'flashcard set' : filter === 'crossword' ? 'crossword' : 'Crater Blast game'}
              {filteredTools.length !== 1 ? (filter === 'flashcards' ? 's' : filter === 'quiz' ? 'zes' : 's') : ''}
            </span>
            {timePeriod !== 'all' && (
              <span className="text-stone-400">
                from {timePeriod === '7days' ? 'the last 7 days' : timePeriod === '30days' ? 'the last 30 days' : 'the last 3 months'}
              </span>
            )}
            {(filter !== 'all' || timePeriod !== 'all') && (
              <button
                onClick={() => { setFilter('all'); setTimePeriod('all'); }}
                className="ml-2 text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

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
                Free plan: tools expire in 30 days.{' '}
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
          <>
          <div className="grid gap-4 sm:gap-5">
            {paginatedTools.map((tool) => {
              const daysRemaining = getDaysRemaining(tool.expires_at);
              const isQuiz = !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
              const toolIcon = getToolIcon(tool.quiz_type);
              
              const getToolStyles = (type: string) => {
                switch (type) {
                  case 'flashcards':
                    return {
                      border: 'border-l-4 border-l-fuchsia-500',
                      iconBg: 'bg-gradient-to-br from-fuchsia-100 to-pink-100',
                      iconText: 'text-fuchsia-600',
                      badge: 'bg-fuchsia-100 text-fuchsia-700',
                      preview: 'bg-fuchsia-50 text-fuchsia-700',
                      button: 'from-fuchsia-500 to-pink-500 shadow-fuchsia-500/25',
                    };
                  case 'crossword':
                    return {
                      border: 'border-l-4 border-l-emerald-500',
                      iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
                      iconText: 'text-emerald-600',
                      badge: 'bg-emerald-100 text-emerald-700',
                      preview: 'bg-emerald-50 text-emerald-700',
                      button: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
                    };
                  case 'crater_blast':
                    return {
                      border: 'border-l-4 border-l-orange-500',
                      iconBg: 'bg-gradient-to-br from-orange-100 to-amber-100',
                      iconText: 'text-orange-600',
                      badge: 'bg-orange-100 text-orange-700',
                      preview: 'bg-orange-50 text-orange-700',
                      button: 'from-orange-500 to-amber-500 shadow-orange-500/25',
                    };
                  default:
                    return {
                      border: 'border-l-4 border-l-blue-500',
                      iconBg: 'bg-gradient-to-br from-blue-100 to-sky-100',
                      iconText: 'text-blue-600',
                      badge: 'bg-blue-100 text-blue-700',
                      preview: 'bg-blue-50 text-blue-700',
                      button: 'from-blue-500 to-sky-500 shadow-blue-500/25',
                    };
                }
              };
              
              const styles = getToolStyles(tool.quiz_type);
              
              return (
                <div
                  key={tool.id}
                  className={`bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-lg hover:border-stone-300/80 transition-all overflow-hidden ${styles.border}`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${styles.iconBg} ${styles.iconText}`}>
                            {toolIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            {renamingId === tool.id ? (
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  autoFocus
                                  type="text"
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveRename(tool.id);
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                                  maxLength={200}
                                />
                                <button
                                  onClick={() => saveRename(tool.id)}
                                  disabled={isRenaming || !renameValue.trim()}
                                  className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                                  title="Save"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button
                                  onClick={cancelRename}
                                  className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-500 transition-colors"
                                  title="Cancel"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group/title">
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 truncate">
                                  {tool.title}
                                </h3>
                                <button
                                  onClick={() => startRename(tool)}
                                  className="opacity-70 group-hover/title:opacity-100 flex items-center gap-1.5 px-2 py-1 rounded-lg text-stone-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-stone-400 dark:hover:text-violet-400 transition-all shrink-0 text-sm font-medium"
                                  title="Rename"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  Rename
                                </button>
                              </div>
                            )}
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
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${styles.badge}`}>
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
                          className={`px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r ${styles.button} hover:opacity-90 transition-all flex items-center gap-2 shadow-md`}
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
                          onClick={() => openShareModal(tool.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-medium text-sm shadow-sm hover:shadow transition-all"
                          title="Share with friends"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span>Share with Friends</span>
                        </button>

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
                              <span key={i} className={`px-2 py-1 ${styles.preview} rounded-lg text-xs max-w-[200px] truncate`}>
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
                              <span key={i} className={`px-2 py-1 ${styles.preview} rounded-lg text-xs max-w-[200px] truncate`}>
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
                            <span className={`px-2 py-1 ${styles.preview} rounded-lg text-xs`}>
                              {((tool.questions as CrosswordData)?.clues?.across?.length || 0)} across
                            </span>
                            <span className={`px-2 py-1 ${styles.preview} rounded-lg text-xs`}>
                              {((tool.questions as CrosswordData)?.clues?.down?.length || 0)} down
                            </span>
                          </>
                        )}
                        {tool.quiz_type === 'crater_blast' && (
                          <>
                            <span className="text-xs text-stone-500 font-medium">Game:</span>
                            <span className={`px-2 py-1 ${styles.preview} rounded-lg text-xs`}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          </>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200/80">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">Share with a Friend</h3>
                  <p className="text-sm text-stone-500">Send this study tool to a friend</p>
                </div>
              </div>
              <button
                onClick={closeShareModal}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {shareSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-stone-900">{shareSuccess}</p>
              </div>
            ) : (
              <>
                {shareError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {shareError}
                  </div>
                )}

                {loadingFriends ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-purple-600 rounded-full"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-stone-900 mb-2">No friends yet</h4>
                    <p className="text-sm text-stone-500 mb-4">Add friends to share study tools with them</p>
                    <button
                      onClick={() => { closeShareModal(); onNavigate('friends'); }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Add Friends
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-2">Select a friend</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {friends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => setSelectedFriendId(friend.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              selectedFriendId === friend.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedFriendId === friend.id ? 'bg-purple-200' : 'bg-stone-200'
                            }`}>
                              <span className={`font-semibold ${
                                selectedFriendId === friend.id ? 'text-purple-700' : 'text-stone-600'
                              }`}>
                                {(friend.username?.[0] || friend.first_name?.[0] || friend.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-stone-900">{getFriendName(friend)}</p>
                              <p className="text-xs text-stone-500">{friend.friend_code}</p>
                            </div>
                            {selectedFriendId === friend.id && (
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-stone-700 mb-2">Add a message (optional)</label>
                      <input
                        type="text"
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="e.g. Check out these flashcards!"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        maxLength={200}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={closeShareModal}
                        className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleShare}
                        disabled={!selectedFriendId || isSharing}
                        className="flex-1 px-4 py-2.5 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-stone-300 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {isSharing ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Sharing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Share
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default QuizHistoryPage;
