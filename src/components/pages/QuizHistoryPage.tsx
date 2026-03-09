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

interface LessonSlide {
  id?: number;
  type?: string;
  title?: string;
  content?: string;
  emoji?: string;
  bulletPoints?: string[];
  highlightedTerm?: string;
}

interface StudyTool {
  id: string;
  title: string;
  quiz_type: string;
  difficulty: string;
  question_count: number;
  questions: QuizQuestion[] | FlashCard[] | CrosswordData;
  quiz_bank?: QuizQuestion[];
  quiz_display_count?: number;
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

type FilterType = 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast' | 'lesson';
type TimePeriod = 'all' | '7days' | '30days' | '3months';

/** Sanitize text for jsPDF - replaces Unicode chars that cause garbled output (e.g. smart quotes, em dashes, emojis) */
function sanitizeForPDF(text: string): string {
  if (!text) return '';
  return String(text)
    // Strip emojis and other symbols jsPDF can't render (lesson plans are emoji-heavy)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{2705}\u{274C}\u{2714}\u{2716}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '')
    .replace(/\u2019/g, "'")   // right single quote '
    .replace(/\u2018/g, "'")   // left single quote '
    .replace(/\u201C/g, '"')   // left double quote "
    .replace(/\u201D/g, '"')   // right double quote "
    .replace(/\u2013/g, '-')   // en dash –
    .replace(/\u2014/g, '-')   // em dash —
    .replace(/\u2026/g, '...') // ellipsis …
    .replace(/\u2022/g, '-')   // bullet •
    .replace(/[^\x00-\x7F]/g, (c) => {  // any remaining non-ASCII -> safe ASCII or strip
      const fallback: Record<string, string> = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ñ': 'n', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o', 'œ': 'oe',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y', 'ß': 'ss',
        'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A', 'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
        'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Ñ': 'N', 'Ó': 'O', 'Ò': 'O', 'Ô': 'O',
        'Ö': 'O', 'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y',
      };
      return fallback[c] ?? '';  // strip unsupported chars instead of '?'
    })
    .replace(/\s{2,}/g, ' ');  // collapse multiple spaces from stripped emojis
}

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
  const [exportDropdownToolId, setExportDropdownToolId] = useState<string | null>(null);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

  const userPlan = user?.plan || user?.subscription_plan || 'free';
  const isPaidUser = userPlan === 'pro' || userPlan === 'premium';

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

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportDropdownToolId) return;
    const handleClick = () => setExportDropdownToolId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [exportDropdownToolId]);

  // Close create dropdown when clicking outside
  useEffect(() => {
    if (!createDropdownOpen) return;
    const handleClick = () => setCreateDropdownOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [createDropdownOpen]);

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
    if (filter === 'quiz') return !['flashcards', 'crossword', 'crater_blast', 'lesson'].includes(tool.quiz_type);
    if (filter === 'lesson') return tool.quiz_type === 'lesson';
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
    if (type === 'lesson') return '🎓';
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
    } else if (tool.quiz_type === 'lesson') {
      localStorage.setItem('savedLesson', JSON.stringify(tool));
      onNavigate('interactive-lesson');
    } else {
      localStorage.setItem('savedQuiz', JSON.stringify(tool));
      onNavigate('quiz-generator');
    }
  };

  const createOptions = [
    { id: 'quiz', label: 'Quiz', icon: '📝', page: 'quiz-generator' as const },
    { id: 'flashcards', label: 'Flashcards', icon: '🃏', page: 'flashcard-generator' as const },
    { id: 'crossword', label: 'Crosswords', icon: '🧩', page: 'crossword-generator' as const },
    { id: 'blast', label: 'Blast', icon: '💥', page: 'crater-blast' as const },
    { id: 'lessons', label: 'Lessons', icon: '🎓', page: 'interactive-lesson' as const },
  ];

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
      case 'lesson': return 'Lesson';
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
    const titleText = doc.splitTextToSize(sanitizeForPDF(quiz.title || 'Quiz'), 170);
    doc.text(titleText, margin, yPos);
    yPos += titleText.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeForPDF(`Type: ${qType} | Difficulty: ${quiz.difficulty} | Questions: ${qs.length}`), margin, yPos);
    yPos += 15;

    qs.forEach((q: QuizQuestion, idx: number) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${sanitizeForPDF(q.question)}`;
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
          const optText = `   [ ] ${sanitizeForPDF(opt)}`;
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
      doc.text(`${idx + 1}. ${sanitizeForPDF(q.correctAnswer)}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${sanitizeForPDF(q.explanation)}`, 165);
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
    const titleLines = doc.splitTextToSize(sanitizeForPDF(tool.title || 'Flashcards'), 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(sanitizeForPDF(`${cards.length} cards`), margin, yPos);
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
      const frontLines = doc.splitTextToSize(sanitizeForPDF(card.front || ''), 165);
      doc.text(frontLines, margin + 4, yPos);
      yPos += frontLines.length * 6 + 4;

      // Back
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Back:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(sanitizeForPDF(card.back || ''), 165);
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
    const titleLines = doc.splitTextToSize(sanitizeForPDF(tool.title || 'Crossword'), 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(sanitizeForPDF(`${placedWords.length} words`), margin, yPos);
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
        const clueText = doc.splitTextToSize(`${pw.number}. ${sanitizeForPDF(pw.clue)} (${pw.word.length} letters)`, 165);
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
      doc.text(`${pw.number}. ${sanitizeForPDF(pw.word)} (${pw.direction})`, margin + 2, yPos);
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

  const exportLessonToPDF = (tool: StudyTool) => {
    const slides = (tool.questions as LessonSlide[]) || [];
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const lineHeight = 5;
    const notesLineSpacing = 7;
    const notesLineCount = 10;

    // Lecture notes layout: top half = lecture, bottom half = notes
    const contentTop = 18;
    const dividerY = pageHeight / 2;
    const lectureBottom = dividerY - 6;
    const lectureHeight = lectureBottom - contentTop;
    const notesTop = dividerY + 4;
    const notesHeight = pageHeight - notesTop - 18;
    const contentWidth = pageWidth - margin * 2;

    const styleLabel = (tool.difficulty === 'stepByStep' || tool.difficulty === 'step_by_step') ? 'Step-by-Step' : tool.difficulty === 'story' ? 'Story Mode' : 'Visual';

    const getSlideTypeLabel = (type?: string) => {
      const t = (type || '').toLowerCase();
      if (t === 'intro') return 'INTRODUCTION';
      if (t === 'concept') return 'CONCEPT';
      if (t === 'example') return 'EXAMPLE';
      if (t === 'keypoint') return 'KEY POINT';
      if (t === 'funfact') return 'FUN FACT';
      if (t === 'summary') return 'SUMMARY';
      return 'SLIDE';
    };

    const getSlideColor = (type?: string): [number, number, number] => {
      const t = (type || '').toLowerCase();
      if (t === 'intro') return [124, 58, 237];
      if (t === 'concept') return [59, 130, 246];
      if (t === 'example') return [245, 158, 11];
      if (t === 'keypoint') return [16, 185, 129];
      if (t === 'funfact') return [236, 72, 153];
      if (t === 'summary') return [99, 102, 241];
      return [100, 116, 139];
    };

    const drawNotesArea = (topY: number, height: number) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('Notes', margin, topY + 4);
      doc.setDrawColor(225, 225, 230);
      doc.setLineWidth(0.25);
      for (let i = 0; i < notesLineCount; i++) {
        const y = topY + 10 + i * notesLineSpacing;
        if (y < topY + height - 8) doc.line(margin, y, pageWidth - margin, y);
      }
    };

    const safeFilename = (title: string) => {
      return (title || 'Lesson Plan')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50) || 'Lesson';
    };

    // ---- Cover page (title slide style) ----
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    const [coverR, coverG, coverB] = [124, 58, 237];
    doc.setFillColor(coverR, coverG, coverB);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const coverTitle = sanitizeForPDF(tool.title || 'Lesson Plan');
    doc.text(coverTitle, pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${styleLabel}  |  ${slides.length} slides`, pageWidth / 2, 38, { align: 'center' });

    let yPos = 70;
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Lecture Notes`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), pageWidth / 2, yPos, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 100, pageWidth - margin, 100);

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page 1 of ${slides.length + 1}`, pageWidth - margin, pageHeight - 10);

    // ---- Slide pages (lecture top, notes bottom) ----
    slides.forEach((slide: LessonSlide, idx: number) => {
      doc.addPage();
      const [r, g, b] = getSlideColor(slide.type);
      const typeLabel = getSlideTypeLabel(slide.type);

      // LECTURE AREA (top half)
      doc.setFillColor(252, 252, 254);
      doc.rect(margin, contentTop, contentWidth, lectureHeight, 'F');

      doc.setDrawColor(235, 235, 240);
      doc.setLineWidth(0.5);
      doc.rect(margin, contentTop, contentWidth, lectureHeight, 'S');

      // Colored header bar
      doc.setFillColor(r, g, b);
      doc.rect(margin, contentTop, contentWidth, 12, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(typeLabel, margin + 6, contentTop + 8);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`${idx + 1}`, pageWidth - margin - 10, contentTop + 8);

      let slideY = contentTop + 22;
      const slideContentWidth = contentWidth - 16;

      doc.setTextColor(30, 41, 59);

      // Slide title
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const slideTitle = sanitizeForPDF(slide.title || `Slide ${idx + 1}`);
      const titleLines = doc.splitTextToSize(slideTitle, slideContentWidth);
      titleLines.forEach((line: string) => {
        doc.text(line, margin + 8, slideY);
        slideY += lineHeight + 1;
      });
      slideY += 3;

      // Content
      const content = sanitizeForPDF(slide.content || '');
      if (content) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const contentLines = doc.splitTextToSize(content, slideContentWidth);
        contentLines.forEach((line: string) => {
          if (slideY < lectureBottom - 10) {
            doc.text(line, margin + 8, slideY);
            slideY += lineHeight;
          }
        });
        slideY += 3;
      }

      // Highlighted term
      if (slide.highlightedTerm && slideY < lectureBottom - 15) {
        const term = sanitizeForPDF(slide.highlightedTerm);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin + 8, slideY - 2, Math.min(doc.getTextWidth(term) + 8, slideContentWidth - 8), 6, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(r, g, b);
        doc.text(term, margin + 12, slideY + 2);
        doc.setTextColor(30, 41, 59);
        slideY += 10;
      }

      // Bullet points
      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        slide.bulletPoints.forEach((bp: string) => {
          if (slideY >= lectureBottom - 8) return;
          const sanitized = sanitizeForPDF(bp);
          doc.setFillColor(r, g, b);
          doc.rect(margin + 10, slideY, 2.5, 2.5, 'F');
          const bpLines = doc.splitTextToSize(sanitized, slideContentWidth - 14);
          bpLines.forEach((line: string) => {
            if (slideY < lectureBottom - 5) {
              doc.text(line, margin + 16, slideY + 2);
              slideY += lineHeight;
            }
          });
          slideY += 3;
        });
      }

      // HORIZONTAL DIVIDER
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, dividerY, pageWidth - margin, dividerY);

      // NOTES AREA (bottom half) - ruled lines for note-taking
      drawNotesArea(notesTop, notesHeight);

      // Page number
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${idx + 2}`, pageWidth - margin, pageHeight - 10);
    });

    doc.save(`${safeFilename(tool.title || '')} Lecture Notes.pdf`);
  };

  const exportLessonToDOCX = async (tool: StudyTool) => {
    const slides = (tool.questions as LessonSlide[]) || [];
    const children: any[] = [];

    children.push(new Paragraph({ text: tool.title || 'Lesson', heading: HeadingLevel.HEADING_1 }));
    const styleLabel = (tool.difficulty === 'stepByStep' || tool.difficulty === 'step_by_step') ? 'Step-by-Step' : tool.difficulty === 'story' ? 'Story Mode' : 'Visual';
    children.push(new Paragraph({ children: [new TextRun({ text: `Style: ${styleLabel} | Slides: ${slides.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    slides.forEach((slide: LessonSlide, idx: number) => {
      const slideTitle = slide.title || `Slide ${idx + 1}`;
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${slideTitle}`, bold: true })] }));
      if (slide.content) {
        children.push(new Paragraph({ text: slide.content }));
      }
      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        slide.bulletPoints.forEach((bp: string) => {
          children.push(new Paragraph({ text: `  • ${bp}` }));
        });
      }
      children.push(new Paragraph({ text: '' }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    const safeTitle = (tool.title || 'lesson').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50);
    saveAs(blob, `${safeTitle}-${Date.now()}.docx`);
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
    { key: 'quiz' as FilterType, label: 'Quizzes', icon: '📝', count: studyTools.filter(t => !['flashcards', 'crossword', 'crater_blast', 'lesson'].includes(t.quiz_type)).length, color: 'blue' },
    { key: 'flashcards' as FilterType, label: 'Flashcards', icon: '🃏', count: studyTools.filter(t => t.quiz_type === 'flashcards').length, color: 'fuchsia' },
    { key: 'crossword' as FilterType, label: 'Crosswords', icon: '🧩', count: studyTools.filter(t => t.quiz_type === 'crossword').length, color: 'emerald' },
    { key: 'crater_blast' as FilterType, label: 'Crater Blast', icon: '💥', count: studyTools.filter(t => t.quiz_type === 'crater_blast').length, color: 'orange' },
    { key: 'lesson' as FilterType, label: 'Lessons', icon: '🎓', count: studyTools.filter(t => t.quiz_type === 'lesson').length, color: 'violet' },
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
      case 'violet':
        return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-500/25';
      default:
        return 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25';
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-12 w-full min-w-0 overflow-x-hidden">
        {/* Hero - compact and sleek */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                🧠
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                  Saved Materials
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
          <div className="relative w-full sm:w-auto sm:shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New
              <svg className={`w-4 h-4 transition-transform ${createDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {createDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 py-1 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-600 z-[100]">
                {createOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setCreateDropdownOpen(false); onNavigate(opt.page); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 rounded-lg transition-colors"
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Crater Blast Banner */}
        <button
          onClick={() => onNavigate('crater-blast')}
          className="w-full mb-8 group relative overflow-hidden rounded-2xl border border-indigo-200/60 transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #818cf8 100%)' }}
        >
          <span className="absolute top-1.5 right-2 sm:top-2 sm:right-2 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-md bg-white/90 text-indigo-600 shadow-md z-10">NEW</span>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
          <div className="relative px-4 sm:px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl shrink-0">
                💥
              </div>
              <div className="text-left min-w-0">
                <div className="text-white font-bold text-base">Crater Blast</div>
                <div className="text-indigo-200 text-xs sm:text-sm truncate">AI quiz shooter — blast the correct crater before it lands</div>
              </div>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold group-hover:bg-white/30 transition-colors text-center">
              Play Now →
            </div>
          </div>
        </button>

        {/* Filter Controls - Type + Time Period */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-3 sm:p-4 mb-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Type Filter */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Filter by Type</div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${getFilterTabStyle(tab, filter === tab.key)}`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-md ${filter === tab.key ? 'bg-white/20' : 'bg-stone-100'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="lg:border-l lg:border-stone-200 lg:pl-4 min-w-0">
              <div className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Time Period</div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {timePeriodOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setTimePeriod(option.key)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
              {filter === 'all' ? 'tool' : filter === 'quiz' ? 'quiz' : filter === 'flashcards' ? 'flashcard set' : filter === 'crossword' ? 'crossword' : filter === 'lesson' ? 'lesson' : 'Crater Blast game'}
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
        <div className={`mb-8 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-3 sm:gap-4 min-w-0 ${isPaidUser ? 'bg-violet-50/80 border border-violet-200/60 dark:bg-violet-900/20 dark:border-violet-700/40' : 'bg-amber-50/80 border border-amber-200/60'}`}>
          {isPaidUser ? (
            <>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-violet-800 dark:text-violet-200 min-w-0">
                <strong>Permanent storage</strong> — <span className="hidden sm:inline">Your study tools never expire.</span> Export to PDF or Word anytime.
              </p>
            </>
          ) : (
            <>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 flex-1 min-w-0">
                Free plan: tools expire in 30 days.{' '}
                <button onClick={() => onNavigate('pricing')} className="font-semibold underline underline-offset-2 hover:text-amber-900">
                  Upgrade
                </button>{' '}
                <span className="hidden sm:inline">for permanent storage & export.</span>
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
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all hover:shadow-lg hover:shadow-violet-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New
                <svg className={`w-4 h-4 transition-transform ${createDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {createDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 py-1 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-600 z-[100]">
                  {createOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setCreateDropdownOpen(false); onNavigate(opt.page); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 rounded-lg transition-colors"
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
          <div className="grid gap-4 sm:gap-5 w-full min-w-0">
            {paginatedTools.map((tool) => {
              const daysRemaining = getDaysRemaining(tool.expires_at);
              const isQuiz = !['flashcards', 'crossword', 'crater_blast', 'lesson'].includes(tool.quiz_type);
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
                  case 'lesson':
                    return {
                      border: 'border-l-4 border-l-violet-500',
                      iconBg: 'bg-gradient-to-br from-violet-100 to-purple-100',
                      iconText: 'text-violet-600',
                      badge: 'bg-violet-100 text-violet-700',
                      preview: 'bg-violet-50 text-violet-700',
                      button: 'from-violet-500 to-purple-500 shadow-violet-500/25',
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
                  className={`bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-lg hover:border-stone-300/80 transition-all ${styles.border} ${exportDropdownToolId === tool.id ? 'relative z-20 overflow-visible' : 'overflow-hidden'}`}
                >
                  <div className="p-4 sm:p-6 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 min-w-0">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${styles.iconBg} ${styles.iconText}`}>
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
                              <div className="flex items-center gap-2 group/title min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 truncate min-w-0 flex-1">
                                  {tool.title}
                                </h3>
                                <button
                                  onClick={() => startRename(tool)}
                                  className="opacity-70 group-hover/title:opacity-100 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-lg text-stone-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 dark:text-stone-400 dark:hover:text-violet-400 transition-all shrink-0 text-xs sm:text-sm font-medium"
                                  title="Rename"
                                >
                                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  <span className="hidden sm:inline">Rename</span>
                                </button>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                              <span className="text-[10px] sm:text-xs text-stone-500 flex items-center gap-1">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(tool.created_at)}
                              </span>
                              {isQuiz && (
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${getDifficultyColor(tool.difficulty)}`}>
                                  {tool.difficulty}
                                </span>
                              )}
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${styles.badge}`}>
                                {getTypeLabel(tool.quiz_type)}
                              </span>
                              <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-stone-100 text-stone-600">
                                {tool.question_count} {tool.quiz_type === 'flashcards' ? 'cards' : tool.quiz_type === 'crossword' ? 'words' : tool.quiz_type === 'crater_blast' ? 'questions' : tool.quiz_type === 'lesson' ? 'slides' : 'questions'}
                              </span>
                              {tool.quiz_type === 'lesson' && tool.quiz_bank && tool.quiz_bank.length > 0 && (
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  🎯 Quiz
                                </span>
                              )}
                              {daysRemaining === null ? (
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700">
                                  Permanent
                                </span>
                              ) : (
                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${daysRemaining <= 2 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining}d left`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:justify-end">
                        <button
                          onClick={() => startStudyTool(tool)}
                          className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r ${styles.button} hover:opacity-90 transition-all flex items-center gap-1 sm:gap-2 shadow-md shrink-0`}
                        >
                          {tool.quiz_type === 'flashcards' ? 'Study' : tool.quiz_type === 'crossword' || tool.quiz_type === 'crater_blast' ? 'Play' : tool.quiz_type === 'lesson' ? 'Review' : 'Take Quiz'}
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>

                        {isPaidUser && tool.quiz_type !== 'crater_blast' ? (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setExportDropdownToolId(exportDropdownToolId === tool.id ? null : tool.id)}
                              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-colors text-xs sm:text-sm font-medium shrink-0"
                              title="Export"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Export
                              <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${exportDropdownToolId === tool.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {exportDropdownToolId === tool.id && (
                              <div className="absolute left-0 top-full mt-1.5 w-40 py-1 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-600 z-[100]">
                                <button
                                  onClick={() => {
                                    if (tool.quiz_type === 'flashcards') exportFlashcardsToPDF(tool);
                                    else if (tool.quiz_type === 'crossword') exportCrosswordToPDF(tool);
                                    else if (tool.quiz_type === 'lesson') exportLessonToPDF(tool);
                                    else exportQuizToPDF(tool);
                                    setExportDropdownToolId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 rounded-t-xl"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                  PDF
                                </button>
                                <button
                                  onClick={() => {
                                    if (tool.quiz_type === 'flashcards') exportFlashcardsToDOCX(tool);
                                    else if (tool.quiz_type === 'crossword') exportCrosswordToDOCX(tool);
                                    else if (tool.quiz_type === 'lesson') exportLessonToDOCX(tool);
                                    else exportQuizToDOCX(tool);
                                    setExportDropdownToolId(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-2 rounded-b-xl"
                                >
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Word
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 text-stone-400 hover:bg-stone-200 transition-colors text-xs sm:text-sm font-medium shrink-0"
                            title="Upgrade to export"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export
                          </button>
                        )}

                        <button
                          onClick={() => openShareModal(tool.id)}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-medium text-xs sm:text-sm shadow-sm hover:shadow transition-all shrink-0"
                          title="Share with friends"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClick(tool.id)}
                          className="p-2 sm:p-2.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Preview strip */}
                    {(isQuiz && Array.isArray(tool.questions) && tool.questions.length > 0) || (tool.quiz_type === 'flashcards' && Array.isArray(tool.questions) && tool.questions.length > 0) || tool.quiz_type === 'crossword' || (tool.quiz_type === 'crater_blast' && (tool.questions as any)?.questions?.length > 0) ? (
                      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-hidden">
                        {isQuiz && (
                          <>
                            <span className="text-[10px] sm:text-xs text-stone-500 font-medium shrink-0">Preview:</span>
                            {(tool.questions as QuizQuestion[]).slice(0, 2).map((q, i) => (
                              <span key={i} className={`px-1.5 sm:px-2 py-0.5 sm:py-1 ${styles.preview} rounded-lg text-[10px] sm:text-xs max-w-[120px] sm:max-w-[200px] truncate`}>
                                {q.question.length > 30 ? q.question.substring(0, 30) + '…' : q.question}
                              </span>
                            ))}
                            {(tool.questions as QuizQuestion[]).length > 2 && (
                              <span className="text-[10px] sm:text-xs text-stone-400 shrink-0">+{(tool.questions as QuizQuestion[]).length - 2} more</span>
                            )}
                          </>
                        )}
                        {tool.quiz_type === 'flashcards' && (
                          <>
                            <span className="text-[10px] sm:text-xs text-stone-500 font-medium shrink-0">Preview:</span>
                            {(tool.questions as FlashCard[]).slice(0, 2).map((card, i) => (
                              <span key={i} className={`px-1.5 sm:px-2 py-0.5 sm:py-1 ${styles.preview} rounded-lg text-[10px] sm:text-xs max-w-[120px] sm:max-w-[200px] truncate`}>
                                {card.front.length > 25 ? card.front.substring(0, 25) + '…' : card.front}
                              </span>
                            ))}
                            {(tool.questions as FlashCard[]).length > 2 && (
                              <span className="text-[10px] sm:text-xs text-stone-400 shrink-0">+{(tool.questions as FlashCard[]).length - 2} more</span>
                            )}
                          </>
                        )}
                        {tool.quiz_type === 'crossword' && (
                          <>
                            <span className="text-[10px] sm:text-xs text-stone-500 font-medium shrink-0">Puzzle:</span>
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 ${styles.preview} rounded-lg text-[10px] sm:text-xs`}>
                              {((tool.questions as CrosswordData)?.clues?.across?.length || 0)} across
                            </span>
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 ${styles.preview} rounded-lg text-[10px] sm:text-xs`}>
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
