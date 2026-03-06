import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { isEndOfMonthUrgency, getEndOfMonthUrgencyText, getDaysUntilReset } from '../../utils/usageReset';

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

interface Friend {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  friend_code: string;
}

type FilterType = 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast';
type SortType = 'newest' | 'oldest' | 'name';

const typeConfig: Record<string, { gradient: string; bg: string; bgLight: string; text: string; border: string; icon: string; label: string; iconBg: string }> = {
  quiz: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '📝',
    label: 'Quiz',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  flashcards: {
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    icon: '🃏',
    label: 'Flashcards',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
  },
  crossword: {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: '🧩',
    label: 'Crossword',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  crater_blast: {
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: '💥',
    label: 'Crater Blast',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
  },
};

const getConfig = (quizType: string) => {
  if (quizType === 'flashcards') return typeConfig.flashcards;
  if (quizType === 'crossword') return typeConfig.crossword;
  if (quizType === 'crater_blast') return typeConfig.crater_blast;
  return typeConfig.quiz;
};

const QuizHistoryPage = ({ onNavigate, user, onLogout }: QuizHistoryProps) => {
  const [studyTools, setStudyTools] = useState<StudyTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStudyToolHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { onNavigate('login'); return; }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch study tool history');
      if (data.success) setStudyTools(data.data || []);
      else throw new Error('Failed to fetch study tool history');
    } catch (error) {
      console.error('Study tool history error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load study tool history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedTools = studyTools
    .filter(tool => {
      if (filter === 'all') return true;
      if (filter === 'quiz') return !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
      return tool.quiz_type === filter;
    })
    .filter(tool => {
      if (!searchQuery.trim()) return true;
      return tool.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.title.localeCompare(b.title);
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const handleDeleteClick = (quizId: string) => setDeleteConfirmId(quizId);
  const cancelDelete = () => setDeleteConfirmId(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch(`${API_URL}/friends`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) setFriends(data.data || []);
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
      if (!token) { onNavigate('login'); return; }
      const response = await fetch(`${API_URL}/friends/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: selectedFriendId, quizId: shareToolId, message: shareMessage || null })
      });
      const data = await response.json();
      if (data.success) {
        setShareSuccess('Shared successfully!');
        setTimeout(() => closeShareModal(), 1500);
      } else {
        setShareError(data.message || 'Failed to share');
      }
    } catch {
      setShareError('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getFriendName = (friend: Friend) => {
    const name = `${friend.first_name || ''} ${friend.last_name || ''}`.trim();
    return name || friend.email || 'Unknown';
  };

  const confirmDelete = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('authToken');
      if (!token) { onNavigate('login'); return; }
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete study tool');
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
      case 'easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-stone-100 text-stone-700';
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

  // ── Export helpers ──
  const exportQuizToPDF = (quiz: StudyTool) => {
    const qs = (quiz.questions as QuizQuestion[]) || [];
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(quiz.title || 'Quiz', 170);
    doc.text(titleText, margin, yPos); yPos += titleText.length * 8 + 5;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${quiz.quiz_type} | Difficulty: ${quiz.difficulty} | Questions: ${qs.length}`, margin, yPos); yPos += 15;
    qs.forEach((q, idx) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${q.question}`;
      const splitQ = doc.splitTextToSize(questionText, 170);
      doc.text(splitQ, margin, yPos); yPos += splitQ.length * lineHeight + 3;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      if (q.type === 'true_false') { doc.text('   [ ] True    [ ] False', margin, yPos); yPos += lineHeight; }
      else if (q.options) {
        q.options.forEach((opt) => {
          if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
          const optText = `   [ ] ${opt}`;
          const splitOpt = doc.splitTextToSize(optText, 165);
          doc.text(splitOpt, margin, yPos); yPos += splitOpt.length * lineHeight;
        });
      }
      yPos += 8;
    });
    doc.addPage(); yPos = 20;
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Answer Key', margin, yPos); yPos += 12;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    qs.forEach((q, idx) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos); yPos += lineHeight;
      if (q.explanation) {
        const exp = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(exp, margin, yPos); yPos += exp.length * lineHeight + 3;
      }
    });
    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async (quiz: StudyTool) => {
    const qs = (quiz.questions as QuizQuestion[]) || [];
    const children: any[] = [];
    children.push(new Paragraph({ text: quiz.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quiz.quiz_type} | Difficulty: ${quiz.difficulty} | Questions: ${qs.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));
    qs.forEach((q, idx) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
      if (q.type === 'true_false') children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
      else if (q.options) q.options.forEach((opt) => children.push(new Paragraph({ text: `   ☐ ${opt}` })));
      children.push(new Paragraph({ text: '' }));
    });
    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    qs.forEach((q, idx) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
    });
    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `quiz-${Date.now()}.docx`);
  };

  const exportFlashcardsToPDF = (tool: StudyTool) => {
    const cards = (tool.questions as FlashCard[]) || [];
    if (!cards.length) return;
    const doc = new jsPDF();
    const margin = 20; const pageHeight = doc.internal.pageSize.height; let yPos = 20;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(tool.title || 'Flashcards', 170);
    doc.text(titleLines, margin, yPos); yPos += titleLines.length * 8 + 4;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(`${cards.length} cards`, margin, yPos); doc.setTextColor(0, 0, 0); yPos += 12;
    cards.forEach((card, idx) => {
      if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 120, 0);
      doc.text(`Card ${idx + 1}`, margin, yPos); doc.setTextColor(0, 0, 0); yPos += 6;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text('Front:', margin, yPos); yPos += 6;
      doc.setFont('helvetica', 'normal');
      const frontLines = doc.splitTextToSize(card.front || '', 165);
      doc.text(frontLines, margin + 4, yPos); yPos += frontLines.length * 6 + 4;
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold'); doc.text('Back:', margin, yPos); yPos += 6;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(card.back || '', 165);
      doc.text(backLines, margin + 4, yPos); doc.setTextColor(0, 0, 0); yPos += backLines.length * 6 + 10;
      if (idx < cards.length - 1) { doc.setDrawColor(220, 220, 220); doc.line(margin, yPos - 4, 190, yPos - 4); }
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
    cards.forEach((card, idx) => {
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
    const margin = 20; const pageHeight = doc.internal.pageSize.height; let yPos = 20;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(tool.title || 'Crossword', 170);
    doc.text(titleLines, margin, yPos); yPos += titleLines.length * 8 + 4;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(`${placedWords.length} words`, margin, yPos); doc.setTextColor(0, 0, 0); yPos += 12;
    const grid = crosswordData.grid;
    if (grid?.length) {
      const cellSize = Math.min(8, Math.floor(160 / grid[0].length));
      const gridStartX = margin; const gridStartY = yPos;
      grid.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const x = gridStartX + ci * cellSize; const y = gridStartY + ri * cellSize;
          if (cell !== '') {
            doc.setDrawColor(100, 100, 100); doc.setFillColor(255, 255, 255); doc.rect(x, y, cellSize, cellSize, 'FD');
            const wordAtCell = placedWords.find((pw) => pw.row === ri && pw.col === ci);
            if (wordAtCell) { doc.setFontSize(4); doc.setTextColor(80, 80, 80); doc.text(String(wordAtCell.number), x + 0.5, y + 3.5); doc.setTextColor(0, 0, 0); }
          } else { doc.setFillColor(40, 40, 40); doc.rect(x, y, cellSize, cellSize, 'F'); }
        });
      });
      yPos = gridStartY + grid.length * cellSize + 14;
    }
    (['across', 'down'] as const).forEach(dir => {
      const words = placedWords.filter(pw => pw.direction === dir).sort((a, b) => a.number - b.number);
      if (!words.length) return;
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos); yPos += 8;
      words.forEach(pw => {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        const clueText = doc.splitTextToSize(`${pw.number}. ${pw.clue} (${pw.word.length} letters)`, 165);
        doc.text(clueText, margin + 2, yPos); yPos += clueText.length * 6 + 2;
      });
      yPos += 4;
    });
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Answer Key', margin, yPos); yPos += 8;
    [...placedWords].sort((a, b) => a.number - b.number).forEach(pw => {
      if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`${pw.number}. ${pw.word} (${pw.direction})`, margin + 2, yPos); yPos += 6;
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
    (['across', 'down'] as const).forEach(dir => {
      const words = placedWords.filter(pw => pw.direction === dir).sort((a, b) => a.number - b.number);
      if (!words.length) return;
      children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
      words.forEach(pw => children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] })));
      children.push(new Paragraph({ text: '' }));
    });
    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    [...placedWords].sort((a, b) => a.number - b.number).forEach(pw => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.word}`, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
    });
    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `crossword-${Date.now()}.docx`);
  };

  // ── Stats ──
  const quizCount = studyTools.filter(t => !['flashcards', 'crossword', 'crater_blast'].includes(t.quiz_type)).length;
  const flashcardCount = studyTools.filter(t => t.quiz_type === 'flashcards').length;
  const crosswordCount = studyTools.filter(t => t.quiz_type === 'crossword').length;
  const craterBlastCount = studyTools.filter(t => t.quiz_type === 'crater_blast').length;
  const totalItems = studyTools.reduce((sum, t) => sum + t.question_count, 0);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-violet-950/20">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl animate-bounce shadow-xl shadow-violet-500/30">
                🧠
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-violet-500/10 animate-ping" />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-6 font-medium">Loading your study tools...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-violet-950/20">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200/80 dark:border-stone-700 shadow-sm p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">Something went wrong</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{error}</p>
            <button onClick={fetchStudyToolHistory} className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-sm transition-all hover:shadow-lg hover:shadow-violet-500/25">
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const filterTabs: { key: FilterType; label: string; icon: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', icon: '📚', count: studyTools.length, color: 'from-stone-600 to-stone-700' },
    { key: 'quiz', label: 'Quizzes', icon: '📝', count: quizCount, color: 'from-blue-500 to-cyan-500' },
    { key: 'flashcards', label: 'Flashcards', icon: '🃏', count: flashcardCount, color: 'from-violet-500 to-purple-500' },
    { key: 'crossword', label: 'Crosswords', icon: '🧩', count: crosswordCount, color: 'from-emerald-500 to-teal-500' },
    { key: 'crater_blast', label: 'Crater Blast', icon: '💥', count: craterBlastCount, color: 'from-indigo-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-violet-950/20">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══════ HERO BANNER ═══════ */}
        <div className="relative overflow-hidden rounded-3xl mb-8" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 30%, #3b82f6 60%, #06b6d4 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <div className="relative px-6 sm:px-10 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
                    🧠
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Study Tools</h1>
                    <p className="text-white/70 text-sm mt-0.5">All your quizzes, flashcards, crosswords & games</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('quiz-generator')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-violet-700 bg-white hover:bg-white/90 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 shrink-0 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create New
              </button>
            </div>

            {/* Mini stat pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: 'Total', value: studyTools.length, icon: '📚' },
                { label: 'Items', value: totalItems, icon: '✏️' },
                { label: 'Quizzes', value: quizCount, icon: '📝' },
                { label: 'Flashcards', value: flashcardCount, icon: '🃏' },
                { label: 'Crosswords', value: crosswordCount, icon: '🧩' },
                ...(craterBlastCount > 0 ? [{ label: 'Games', value: craterBlastCount, icon: '💥' }] : []),
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm">
                  <span>{stat.icon}</span>
                  <span className="font-bold">{stat.value}</span>
                  <span className="text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* End-of-month urgency warning for free users */}
        {!isPaidUser && isEndOfMonthUrgency() && studyTools.length > 0 && (
          <div className={`mb-6 p-4 rounded-2xl border ${getDaysUntilReset() <= 3 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">{getDaysUntilReset() <= 3 ? '⚠️' : '⏰'}</span>
              <p className={`text-sm font-medium flex-1 ${getDaysUntilReset() <= 3 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {getEndOfMonthUrgencyText()}
              </p>
              <button onClick={() => onNavigate('pricing')} className={`shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${getDaysUntilReset() <= 3 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Storage notice */}
        <div className={`mb-8 px-5 py-3.5 rounded-2xl flex items-center gap-4 ${isPaidUser ? 'bg-violet-50/80 border border-violet-200/60 dark:bg-violet-900/20 dark:border-violet-700/40' : 'bg-amber-50/80 border border-amber-200/60 dark:bg-amber-900/20 dark:border-amber-700/40'}`}>
          {isPaidUser ? (
            <>
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm text-violet-800 dark:text-violet-200"><strong>Permanent storage</strong> — Your study tools never expire. Export to PDF or Word anytime.</p>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
                Free plan: tools expire in 7 days.{' '}
                <button onClick={() => onNavigate('pricing')} className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100">Upgrade</button>{' '}for permanent storage & export.
              </p>
            </>
          )}
        </div>

        {/* ═══════ SEARCH + FILTER BAR ═══════ */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study tools..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === tab.key
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 hover:border-stone-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${filter === tab.key ? 'bg-white/20' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Crater Blast CTA */}
        <button
          onClick={() => onNavigate('crater-blast')}
          className="w-full mb-8 group relative overflow-hidden rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #818cf8 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
          <div className="relative px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">💥</div>
              <div className="text-left">
                <div className="text-white font-bold text-base">Crater Blast</div>
                <div className="text-indigo-200 text-sm">AI quiz shooter — blast the correct crater before it lands</div>
              </div>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold group-hover:bg-white/30 transition-colors">Play Now →</div>
          </div>
        </button>

        {/* ═══════ CONTENT ═══════ */}
        {filteredAndSortedTools.length === 0 ? (
          <div className="bg-white dark:bg-stone-800/80 rounded-3xl border border-stone-200/80 dark:border-stone-700 shadow-sm p-12 sm:p-16 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
              {searchQuery ? '🔍' : '🧠'}
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {searchQuery
                ? 'No results found'
                : filter === 'all' ? 'No study tools yet' : `No ${getTypeLabel(filter === 'quiz' ? 'mixed' : filter)} yet`}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm mx-auto">
              {searchQuery
                ? `No study tools match "${searchQuery}". Try a different search.`
                : filter === 'all'
                  ? 'Create quizzes, flashcards, or crosswords from your notes to get started.'
                  : `Create your first ${filter === 'quiz' ? 'quiz' : filter} to see it here.`}
            </p>
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 transition-all">
                Clear Search
              </button>
            ) : (
              <button onClick={() => onNavigate('quiz-generator')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all hover:shadow-lg hover:shadow-violet-500/25">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Study Tool
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {filteredAndSortedTools.map((tool) => {
              const daysRemaining = getDaysRemaining(tool.expires_at);
              const isQuiz = !['flashcards', 'crossword', 'crater_blast'].includes(tool.quiz_type);
              const config = getConfig(tool.quiz_type);

              return (
                <div
                  key={tool.id}
                  className="group relative bg-white dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700 shadow-sm hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
                >
                  {/* Colored top accent bar */}
                  <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${config.iconBg}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 truncate leading-tight">
                          {tool.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span>{formatDate(tool.created_at)}</span>
                          <span className="text-stone-300 dark:text-stone-600">·</span>
                          <span>{formatTime(tool.created_at)}</span>
                        </div>
                      </div>

                      {/* 3-dot menu */}
                      <div className="relative" ref={activeDropdown === tool.id ? dropdownRef : undefined}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === tool.id ? null : tool.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>

                        {activeDropdown === tool.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button onClick={() => { openShareModal(tool.id); setActiveDropdown(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                              <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                              Share with Friend
                            </button>

                            {isPaidUser && tool.quiz_type !== 'crater_blast' ? (
                              <>
                                <button onClick={() => {
                                  if (tool.quiz_type === 'flashcards') exportFlashcardsToPDF(tool);
                                  else if (tool.quiz_type === 'crossword') exportCrosswordToPDF(tool);
                                  else exportQuizToPDF(tool);
                                  setActiveDropdown(null);
                                }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Export as PDF
                                </button>
                                <button onClick={() => {
                                  if (tool.quiz_type === 'flashcards') exportFlashcardsToDOCX(tool);
                                  else if (tool.quiz_type === 'crossword') exportCrosswordToDOCX(tool);
                                  else exportQuizToDOCX(tool);
                                  setActiveDropdown(null);
                                }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Export as Word
                                </button>
                              </>
                            ) : tool.quiz_type !== 'crater_blast' ? (
                              <button onClick={() => { setShowUpgradeModal(true); setActiveDropdown(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Export (Upgrade)
                              </button>
                            ) : null}

                            <div className="h-px bg-stone-100 dark:bg-stone-700 my-1" />
                            <button onClick={() => { handleDeleteClick(tool.id); setActiveDropdown(null); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${config.bgLight} ${config.text}`}>
                        {getTypeLabel(tool.quiz_type)}
                      </span>
                      {isQuiz && (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getDifficultyColor(tool.difficulty)}`}>
                          {tool.difficulty}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
                        {tool.question_count} {tool.quiz_type === 'flashcards' ? 'cards' : tool.quiz_type === 'crossword' ? 'words' : 'questions'}
                      </span>
                      {daysRemaining === null ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Permanent
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${daysRemaining <= 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                          {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining}d left`}
                        </span>
                      )}
                    </div>

                    {/* Preview */}
                    {isQuiz && Array.isArray(tool.questions) && (tool.questions as QuizQuestion[]).length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-700/50">
                        <p className="text-xs text-stone-400 dark:text-stone-500 font-medium mb-1.5">Preview</p>
                        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{(tool.questions as QuizQuestion[])[0]?.question}</p>
                      </div>
                    )}
                    {tool.quiz_type === 'flashcards' && Array.isArray(tool.questions) && (tool.questions as FlashCard[]).length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                        <p className="text-xs text-violet-400 dark:text-violet-500 font-medium mb-1.5">First Card</p>
                        <p className="text-sm text-violet-700 dark:text-violet-300 line-clamp-2">{(tool.questions as FlashCard[])[0]?.front}</p>
                      </div>
                    )}
                    {tool.quiz_type === 'crossword' && (
                      <div className="mb-4 flex gap-2">
                        <div className="flex-1 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-center">
                          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{((tool.questions as CrosswordData)?.clues?.across?.length || 0)}</div>
                          <div className="text-xs text-emerald-500 dark:text-emerald-400">Across</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/30 text-center">
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-300">{((tool.questions as CrosswordData)?.clues?.down?.length || 0)}</div>
                          <div className="text-xs text-teal-500 dark:text-teal-400">Down</div>
                        </div>
                      </div>
                    )}
                    {tool.quiz_type === 'crater_blast' && (tool.questions as any)?.questions?.length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                        <p className="text-xs text-indigo-400 dark:text-indigo-500 font-medium mb-1.5">Game</p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">{((tool.questions as any)?.questions?.length || 0)} questions to blast through</p>
                      </div>
                    )}

                    {/* Action button */}
                    <button
                      onClick={() => startStudyTool(tool)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${config.gradient} hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md`}
                    >
                      {tool.quiz_type === 'flashcards' ? 'Study' : tool.quiz_type === 'crossword' || tool.quiz_type === 'crater_blast' ? 'Play' : 'Take Quiz'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ═══════ MODALS ═══════ */}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200/80 dark:border-stone-700">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Delete study tool?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">This action can't be undone. The tool will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 font-medium text-sm">
                Cancel
              </button>
              <button onClick={() => confirmDelete(deleteConfirmId)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium text-sm">
                {isDeleting ? (<><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />Deleting...</>) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200/80 dark:border-stone-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">Unlock Export</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Export to PDF or Word with a paid plan.</p>
            </div>
            <ul className="space-y-3 mb-6">
              {['Export to PDF & Word', 'Permanent storage', 'Unlimited generations', 'All question types'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium text-sm">Later</button>
              <button onClick={() => { setShowUpgradeModal(false); onNavigate('pricing'); }} className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-medium text-sm transition-all">View Plans</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200/80 dark:border-stone-700">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Share with a Friend</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Send this study tool to a friend</p>
                </div>
              </div>
              <button onClick={closeShareModal} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {shareSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-lg font-medium text-stone-900 dark:text-stone-100">{shareSuccess}</p>
              </div>
            ) : (
              <>
                {shareError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">{shareError}</div>
                )}

                {loadingFriends ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-purple-600 rounded-full" />
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-2">No friends yet</h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Add friends to share study tools with them</p>
                    <button onClick={() => { closeShareModal(); onNavigate('friends'); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">Add Friends</button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Select a friend</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {friends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => setSelectedFriendId(friend.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedFriendId === friend.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedFriendId === friend.id ? 'bg-purple-200 dark:bg-purple-800' : 'bg-stone-200 dark:bg-stone-600'}`}>
                              <span className={`font-semibold ${selectedFriendId === friend.id ? 'text-purple-700 dark:text-purple-300' : 'text-stone-600 dark:text-stone-300'}`}>
                                {(friend.first_name?.[0] || friend.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-stone-900 dark:text-stone-100">{getFriendName(friend)}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">{friend.friend_code}</p>
                            </div>
                            {selectedFriendId === friend.id && (
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Add a message (optional)</label>
                      <input
                        type="text"
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="e.g. Check out these flashcards!"
                        className="w-full px-4 py-3 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-stone-900 dark:text-stone-100"
                        maxLength={200}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={closeShareModal} className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium text-sm">Cancel</button>
                      <button
                        onClick={handleShare}
                        disabled={!selectedFriendId || isSharing}
                        className="flex-1 px-4 py-2.5 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {isSharing ? (<><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sharing...</>) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Share</>
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
