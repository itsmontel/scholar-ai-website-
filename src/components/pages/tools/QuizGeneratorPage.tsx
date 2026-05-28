import { useState, useEffect, useMemo, useRef } from 'react';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { quizGenSeo } from '../../../data/toolSeoContent';

function shuffleAndTake<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const opts = question.options || [];
  if (opts.length <= 1) return { ...question };
  const correctIdx = question.correctAnswer?.length === 1 && question.correctAnswer >= 'A' && question.correctAnswer <= 'Z'
    ? question.correctAnswer.charCodeAt(0) - 65
    : opts.findIndex(o => o.charAt(0) === question.correctAnswer?.charAt(0) || o === question.correctAnswer);
  const correctOption = opts[Math.max(0, correctIdx)];
  const shuffled = shuffleArray(opts);
  const newCorrectIdx = shuffled.indexOf(correctOption);
  const newCorrectLetter = String.fromCharCode(65 + Math.max(0, newCorrectIdx));
  const relabeled = shuffled.map((opt, i) => {
    const rest = opt.length > 3 ? opt.slice(3) : ''; // after "X. "
    return String.fromCharCode(65 + i) + '. ' + rest;
  });
  return { ...question, options: relabeled, correctAnswer: newCorrectLetter };
}
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import Footer from '../../common/Footer';
// ScholarMascot replaced with mascot GIFs
import AnalysisAnimation from '../../common/AnalysisAnimation';
import FlashcardViewer from '../../common/FlashcardViewer';
import QuizMascotReaction from '../../common/QuizMascotReaction';
import { trackAction, trackExport } from '../../../data/achievements';
import { getResetsInText } from '../../../utils/usageReset';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface QuizGeneratorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  initialStudyToolMode?: 'quiz' | 'flashcards' | 'crossword';
}

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
  quizType: string;
  difficulty: string;
  questionCount: number;
  displayCount?: number;
  sourceWordCount: number;
}

interface UserAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

const QuizGeneratorPage = ({ onNavigate, user, onLogout, initialStudyToolMode = 'quiz' }: QuizGeneratorPageProps) => {
  const [inputText, setInputText] = useState('');
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword'>(initialStudyToolMode);

  // Sync studyToolMode when navigating to this page with a specific mode (e.g. from footer links)
  useEffect(() => {
    setStudyToolMode(initialStudyToolMode);
  }, [initialStudyToolMode]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Quiz taking state
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showQuizReview, setShowQuizReview] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);

  // Flashcard state
  const [flashcardResult, setFlashcardResult] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(15);
  
  // Crossword state
  const [crosswordResult, setCrosswordResult] = useState<any>(null);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<string, string>>({});
  const [crosswordChecked, setCrosswordChecked] = useState(false);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [hintsUsed, setHintsUsed] = useState(0);
  const crosswordInputRef = useRef<HTMLInputElement | null>(null);

  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const isFreeUser = !user || userPlan === 'free';
  const isPaidUser = user && (userPlan === 'pro' || userPlan === 'premium' || userPlan === 'focus');
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  // Export upgrade modal state
  const [showExportUpgradeModal, setShowExportUpgradeModal] = useState(false);

  // Minimal UI when loaded from dashboard recents or study tools history (no header, footer, or features section)
  const [showMinimalUI, setShowMinimalUI] = useState(false);
  const [openedFromHistory, setOpenedFromHistory] = useState(false);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const [openedFromStudyPackViewer, setOpenedFromStudyPackViewer] = useState(false);
  useEffect(() => {
    const minimal = localStorage.getItem('writescholar_minimal_ui') === 'true';
    if (minimal) {
      localStorage.removeItem('writescholar_minimal_ui');
      setShowMinimalUI(true);
    }
  }, []);

  // Side-by-side layout when signed out (locked out): form left, video right
  const showLockedOutLayout = !user && !showMinimalUI && !quiz && !flashcardResult && !crosswordResult;
  
  // Quiz usage state for free users
  const [quizUsage, setQuizUsage] = useState<{
    generationsUsed: number;
    generationLimit: number;
    generationsRemaining: number;
    maxWordsPerGeneration: number;
    wordsUsed: number;
    wordLimit: number;
    plan: string;
    daysUntilReset?: number;
  }>({
    generationsUsed: 0,
    generationLimit: 2,
    generationsRemaining: 3,
    maxWordsPerGeneration: 5000,
    wordsUsed: 0,
    wordLimit: 15000,
    plan: 'free'
  });
  
  // Free users can use quiz with limits; paid users have unlimited
  const quizExhausted = isFreeUser && quizUsage.generationLimit !== -1 && quizUsage.generationsRemaining <= 0;

  // Random subset from question bank - different each retake; shuffle answer options on each load
  const displayedQuestions = useMemo(() => {
    if (!quiz?.questions?.length) return [];
    const displayCount = quiz.questionCount ?? quiz.displayCount ?? quiz.questions.length;
    const subset = shuffleAndTake(quiz.questions, Math.min(displayCount, quiz.questions.length));
    return subset.map(shuffleQuestionOptions);
  }, [quiz, retakeKey]);

  useEffect(() => {
    applyPageSeoTags({
      title: 'AI Quiz Generator from Notes — College Exam Prep | WriteScholar',
      description: 'Free quiz generator from text: paste notes or articles and get multiple-choice, true/false, fill-in-the-blank quizzes in seconds. Best free Quizlet alternative. No signup to start.',
    });
    injectToolProductSchema({
      name: 'AI Quiz Generator',
      description: 'AI-powered quiz generator — paste notes, lecture slides, or articles and get multiple-choice, true/false, and fill-in-the-blank quizzes in seconds.',
    });
    return () => removeJsonLd('tool-product');
  }, []);

  // Load saved quiz from Quiz History "Take Quiz" button
  useEffect(() => {
    const saved = localStorage.getItem('savedQuiz');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      // Normalize API shape (snake_case) to component shape (camelCase)
      const normalized: Quiz = {
        title: parsed.title || 'Quiz',
        questions: parsed.questions || [],
        quizType: parsed.quiz_type || parsed.quizType || 'mixed',
        difficulty: parsed.difficulty || 'medium',
        questionCount: parsed.question_count ?? parsed.questionCount ?? parsed.questions?.length ?? 10,
        sourceWordCount: parsed.source_word_count ?? parsed.sourceWordCount ?? 0
      };
      if (normalized.questions.length > 0) {
        setQuiz(normalized);
        setIsQuizMode(true);
        const initialIdx = parsed.initial_question_index;
        const startIdx = initialIdx != null && initialIdx >= 0 && initialIdx < normalized.questions.length ? initialIdx : 0;
        setCurrentQuestion(startIdx);
        setUserAnswers([]);
        setSelectedAnswer('');
        setShowResult(false);
        setQuizCompleted(false);
        setShowQuizReview(false);
        setError(null);
        setShowMinimalUI(true);
        const fromStudyPack = sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true';
        const fromDashboard = sessionStorage.getItem('writescholar_enlarge_from_dashboard') === 'quiz';
        setOpenedFromStudyPackViewer(fromStudyPack);
        setOpenedFromDashboard(!fromStudyPack && fromDashboard);
        setOpenedFromHistory(!fromStudyPack && !fromDashboard);
      }
    } catch (e) {
      console.error('Failed to load saved quiz:', e);
    } finally {
      localStorage.removeItem('savedQuiz');
    }
  }, []);

  // Load saved flashcards from Study Tools History "Study Cards" button
  useEffect(() => {
    const saved = localStorage.getItem('savedFlashcards');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      // questions field contains the cards array for flashcards
      const cards = parsed.questions || [];
      if (cards.length > 0) {
        setFlashcardResult({
          title: parsed.title || 'Flashcards',
          cards: cards,
          cardCount: cards.length,
          sourceWordCount: parsed.source_word_count ?? 0
        });
        setStudyToolMode('flashcards');
        setError(null);
        setShowMinimalUI(true);
        const fromStudyPack = sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true';
        const fromDashboard = sessionStorage.getItem('writescholar_enlarge_from_dashboard') === 'flashcards';
        setOpenedFromStudyPackViewer(fromStudyPack);
        setOpenedFromDashboard(!fromStudyPack && fromDashboard);
        setOpenedFromHistory(!fromStudyPack && !fromDashboard);
      }
    } catch (e) {
      console.error('Failed to load saved flashcards:', e);
    } finally {
      localStorage.removeItem('savedFlashcards');
    }
  }, []);

  // Load saved crossword from Study Tools History "Play Crossword" button
  useEffect(() => {
    const saved = localStorage.getItem('savedCrossword');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      // questions field contains { grid, clues, gridSize, placedWords } for crosswords
      const crosswordData = parsed.questions || {};
      if (crosswordData.grid && crosswordData.placedWords) {
        setCrosswordResult({
          title: parsed.title || 'Crossword',
          grid: crosswordData.grid,
          clues: crosswordData.clues,
          gridSize: crosswordData.gridSize,
          placedWords: crosswordData.placedWords,
          wordCount: crosswordData.placedWords.length,
          sourceWordCount: parsed.source_word_count ?? 0
        });
        setStudyToolMode('crossword');
        setCrosswordAnswers({});
        setCrosswordChecked(false);
        setSelectedCell(null);
        setSelectedDirection('across');
        setHintsUsed(0);
        setError(null);
        setShowMinimalUI(true);
        const fromStudyPack = sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true';
        const fromDashboard = sessionStorage.getItem('writescholar_enlarge_from_dashboard') === 'crossword';
        setOpenedFromStudyPackViewer(fromStudyPack);
        setOpenedFromDashboard(!fromStudyPack && fromDashboard);
        setOpenedFromHistory(!fromStudyPack && !fromDashboard);
      }
    } catch (e) {
      console.error('Failed to load saved crossword:', e);
    } finally {
      localStorage.removeItem('savedCrossword');
    }
  }, []);

  const fetchQuizUsage = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuizUsage({
            generationsUsed: data.data.generationsUsed || 0,
            generationLimit: data.data.generationLimit ?? 2,
            generationsRemaining: data.data.generationsRemaining ?? 3,
            maxWordsPerGeneration: data.data.maxWordsPerGeneration || 5000,
            wordsUsed: data.data.wordsUsed || 0,
            wordLimit: data.data.wordLimit || 15000,
            plan: data.data.plan || 'free',
            daysUntilReset: data.data.daysUntilReset
          });
        }
      }
    } catch (error) {
      console.error('Error fetching quiz usage:', error);
    }
  };

  useEffect(() => {
    fetchQuizUsage();
  }, [user]);

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowSignupPrompt(true);
      }, 14000);
      return;
    }

    if (quizExhausted) {
      setError('You\'ve used all your quiz generations this period. Upgrade to Pro for more quizzes.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText,
          quizType,
          difficulty,
          questionCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate quiz');
      }

      setQuiz(data.data);
      setIsQuizMode(true);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer('');
      setShowResult(false);
      trackAction('quizzes_count');
      
      // Refresh quiz usage after successful generation
      if (isFreeUser) {
        setQuizUsage(prev => ({
          ...prev,
          generationsUsed: prev.generationsUsed + 1,
          generationsRemaining: Math.max(0, prev.generationsRemaining - 1)
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      fetchQuizUsage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim()) return;
    if (!user) { setShowFakeAnimation(true); setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 14000); return; }
    if (quizExhausted) { setError('You\'ve used all your study pack generations this period. Upgrade to Pro for more access.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, cardCount: isFreeUser ? 15 : flashcardCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Flashcard generation failed');
      setFlashcardResult(data.data);
      trackAction('flashcards_count');
      if (isFreeUser) setQuizUsage(prev => ({ ...prev, generationsUsed: prev.generationsUsed + 1, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
    } catch (err: any) {
      setError(err.message || 'Flashcard generation failed.');
      fetchQuizUsage();
    } finally { setIsLoading(false); }
  };

  const handleGenerateCrossword = async () => {
    if (!inputText.trim()) return;
    if (!user) { setShowFakeAnimation(true); setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 14000); return; }
    if (quizExhausted) { setError('You\'ve used all your study pack generations this period. Upgrade to Pro for more access.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-crossword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, wordCount: isFreeUser ? 10 : crosswordWordCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Crossword generation failed');
      setCrosswordResult(data.data);
      trackAction('crosswords_count');
      setCrosswordAnswers({});
      setCrosswordChecked(false);
      setSelectedClue(null);
      setSelectedCell(null);
      setHintsUsed(0);
      if (isFreeUser) setQuizUsage(prev => ({ ...prev, generationsUsed: prev.generationsUsed + 1, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
    } catch (err: any) {
      setError(err.message || 'Crossword generation failed.');
      fetchQuizUsage();
    } finally { setIsLoading(false); }
  };

  // Get the letter at a specific cell position based on user's answers
  // Check ALL words at this cell (shared across/down) and return first non-empty letter
  const getCellLetter = (rowIdx: number, colIdx: number): string => {
    if (!crosswordResult?.placedWords) return '';
    const wordsAtCell = getWordsAtCell(rowIdx, colIdx);
    for (const pw of wordsAtCell) {
      const answer = crosswordAnswers[`word-${pw.number}`] || '';
      const letterIndex = pw.direction === 'across' ? colIdx - pw.col : rowIdx - pw.row;
      if (letterIndex >= 0 && letterIndex < answer.length) {
        const ch = answer[letterIndex];
        if (ch && /[A-Za-z]/.test(ch)) return ch.toUpperCase();
      }
    }
    return '';
  };

  // Get word(s) that pass through a specific cell
  const getWordsAtCell = (rowIdx: number, colIdx: number): any[] => {
    if (!crosswordResult?.placedWords) return [];
    return crosswordResult.placedWords.filter((pw: any) => {
      if (pw.direction === 'across') {
        return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
      }
      return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
    });
  };

  // Focus clue input when cell is tapped (mobile keyboard won't open for div focus)
  useEffect(() => {
    if (selectedClue !== null && !crosswordChecked) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Small delay so React has finished rendering the input with the ref
        const id = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            crosswordInputRef.current?.focus();
          });
        });
        return () => cancelAnimationFrame(id);
      }
    }
  }, [selectedClue, selectedDirection, crosswordChecked]);

  // Handle cell click in crossword
  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (crosswordChecked) return;
    
    const wordsAtCell = getWordsAtCell(rowIdx, colIdx);
    if (wordsAtCell.length === 0) return;
    
    // If clicking the same cell, toggle direction
    if (selectedCell?.row === rowIdx && selectedCell?.col === colIdx) {
      const hasAcross = wordsAtCell.some((pw: any) => pw.direction === 'across');
      const hasDown = wordsAtCell.some((pw: any) => pw.direction === 'down');
      if (hasAcross && hasDown) {
        setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
        const newWord = wordsAtCell.find((pw: any) => pw.direction === (selectedDirection === 'across' ? 'down' : 'across'));
        if (newWord) setSelectedClue(newWord.number);
      }
    } else {
      setSelectedCell({ row: rowIdx, col: colIdx });
      // Prefer the current direction if available, otherwise use whatever is available
      const preferredWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection);
      const word = preferredWord || wordsAtCell[0];
      if (word) {
        setSelectedDirection(word.direction);
        setSelectedClue(word.number);
      }
    }
  };

  // Handle keyboard input for crossword
  const handleCrosswordKeyDown = (e: React.KeyboardEvent) => {
    if (crosswordChecked || !selectedCell || !crosswordResult) return;
    
    const { row, col } = selectedCell;
    const wordsAtCell = getWordsAtCell(row, col);
    const currentWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection) || wordsAtCell[0];
    
    if (!currentWord) return;
    
    const answerKey = `word-${currentWord.number}`;
    const currentAnswer = crosswordAnswers[answerKey] || '';
    
    // Calculate position in the word
    const letterIndex = selectedDirection === 'across' 
      ? col - currentWord.col 
      : row - currentWord.row;
    
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      // Build new answer with the letter at the correct position
      let newAnswer = currentAnswer.split('');
      while (newAnswer.length <= letterIndex) newAnswer.push('');
      newAnswer[letterIndex] = letter;
      setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
      
      // Move to next cell
      if (letterIndex < currentWord.length - 1) {
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col + 1 });
        } else {
          setSelectedCell({ row: row + 1, col });
        }
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      let newAnswer = currentAnswer.split('');
      if (letterIndex < newAnswer.length && newAnswer[letterIndex]) {
        // Delete current cell – only update the current word
        newAnswer[letterIndex] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
      } else if (letterIndex > 0) {
        // Move back and delete
        const delRow = selectedDirection === 'across' ? row : row - 1;
        const delCol = selectedDirection === 'across' ? col - 1 : col;
        newAnswer[letterIndex - 1] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col - 1 });
        } else {
          setSelectedCell({ row: row - 1, col });
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = col + 1;
      if (crosswordResult.grid[row] && crosswordResult.grid[row][nextCol] !== '' && crosswordResult.grid[row][nextCol] !== undefined) {
        setSelectedCell({ row, col: nextCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, nextCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevCol = col - 1;
      if (prevCol >= 0 && crosswordResult.grid[row] && crosswordResult.grid[row][prevCol] !== '' && crosswordResult.grid[row][prevCol] !== undefined) {
        setSelectedCell({ row, col: prevCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, prevCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = row + 1;
      if (crosswordResult.grid[nextRow] && crosswordResult.grid[nextRow][col] !== '' && crosswordResult.grid[nextRow][col] !== undefined) {
        setSelectedCell({ row: nextRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(nextRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = row - 1;
      if (prevRow >= 0 && crosswordResult.grid[prevRow] && crosswordResult.grid[prevRow][col] !== '' && crosswordResult.grid[prevRow][col] !== undefined) {
        setSelectedCell({ row: prevRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(prevRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Move to next word
      const currentWordIndex = crosswordResult.placedWords.findIndex((pw: any) => pw.number === selectedClue);
      const nextWordIndex = (currentWordIndex + 1) % crosswordResult.placedWords.length;
      const nextWord = crosswordResult.placedWords[nextWordIndex];
      if (nextWord) {
        setSelectedClue(nextWord.number);
        setSelectedDirection(nextWord.direction);
        setSelectedCell({ row: nextWord.row, col: nextWord.col });
      }
    }
  };

  const handleGenerate = () => {
    if (studyToolMode === 'flashcards') handleGenerateFlashcards();
    else if (studyToolMode === 'crossword') handleGenerateCrossword();
    else handleGenerateQuiz();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 2500);
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) { onNavigate('signup'); return; }
    setIsParsingDoc(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      setError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setQuiz(null);
    setError(null);
    setIsQuizMode(false);
    setUserAnswers([]);
    setQuizCompleted(false);
  };

  const startQuiz = () => {
    setIsQuizMode(true);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizCompleted(false);
  };

  const submitAnswer = () => {
    if (!quiz || !displayedQuestions.length) return;
    
    const question = displayedQuestions[currentQuestion];
    const answer = selectedAnswer;
    const isCorrect = answer === question.correctAnswer;

    const newAnswer: UserAnswer = {
      questionId: question.id,
      answer,
      isCorrect
    };

    setUserAnswers([...userAnswers, newAnswer]);
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (!quiz || !displayedQuestions.length) return;
    
    if (currentQuestion + 1 >= displayedQuestions.length) {
      setQuizCompleted(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setRetakeKey(k => k + 1);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizCompleted(false);
    setShowQuizReview(false);
  };

  const getScore = () => {
    const correct = userAnswers.filter(a => a.isCorrect).length;
    return { correct, total: userAnswers.length, percentage: Math.round((correct / userAnswers.length) * 100) };
  };

  const downloadQuiz = () => {
    if (!quiz || !displayedQuestions.length) return;
    
    let content = `${quiz.title}\n${'='.repeat(quiz.title.length)}\n\n`;
    content += `Difficulty: ${quiz.difficulty} | Type: ${quiz.quizType}\n\n`;
    
    displayedQuestions.forEach((q, idx) => {
      content += `${idx + 1}. ${q.question}\n`;
      if (q.options) {
        q.options.forEach(opt => {
          content += `   ${opt}\n`;
        });
      }
      content += `   Answer: ${q.correctAnswer}\n`;
      content += `   Explanation: ${q.explanation}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportQuizToPDF = () => {
    if (!quiz || !displayedQuestions.length) return;
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
    doc.text(`Type: ${quiz.quizType} | Difficulty: ${quiz.difficulty} | Questions: ${displayedQuestions.length}`, margin, yPos);
    yPos += 15;

    displayedQuestions.forEach((q, idx) => {
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
    displayedQuestions.forEach((q, idx) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(expText, margin, yPos);
        yPos += expText.length * lineHeight + 3;
      }
    });

    trackExport();
    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async () => {
    if (!quiz || !displayedQuestions.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: quiz.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quiz.quizType} | Difficulty: ${quiz.difficulty} | Questions: ${displayedQuestions.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    displayedQuestions.forEach((q, idx) => {
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
    displayedQuestions.forEach((q, idx) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    trackExport();
    saveAs(blob, `quiz-${Date.now()}.docx`);
  };

  const handleCrosswordHint = () => {
    if (!crosswordResult?.placedWords || crosswordChecked) return;

    const candidateWords = selectedClue !== null
      ? crosswordResult.placedWords.filter((pw: any) => pw.number === selectedClue)
      : crosswordResult.placedWords;

    for (const pw of candidateWords) {
      const answerKey = `word-${pw.number}`;
      const currentAnswer = (crosswordAnswers[answerKey] || '').split('');
      let hintIndex = -1;
      for (let i = 0; i < pw.word.length; i++) {
        if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
          hintIndex = i;
          break;
        }
      }
      if (hintIndex >= 0) {
        const newAnswer = currentAnswer.slice();
        while (newAnswer.length <= hintIndex) newAnswer.push('');
        newAnswer[hintIndex] = pw.word[hintIndex];
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
        if (pw.direction === 'across') {
          setSelectedCell({ row: pw.row, col: pw.col + hintIndex });
        } else {
          setSelectedCell({ row: pw.row + hintIndex, col: pw.col });
        }
        setSelectedClue(pw.number);
        setSelectedDirection(pw.direction);
        setHintsUsed(h => h + 1);
        return;
      }
    }

    if (selectedClue !== null) {
      for (const pw of crosswordResult.placedWords) {
        const answerKey = `word-${pw.number}`;
        const currentAnswer = (crosswordAnswers[answerKey] || '').split('');
        for (let i = 0; i < pw.word.length; i++) {
          if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
            const newAnswer = currentAnswer.slice();
            while (newAnswer.length <= i) newAnswer.push('');
            newAnswer[i] = pw.word[i];
            setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
            if (pw.direction === 'across') {
              setSelectedCell({ row: pw.row, col: pw.col + i });
            } else {
              setSelectedCell({ row: pw.row + i, col: pw.col });
            }
            setSelectedClue(pw.number);
            setSelectedDirection(pw.direction);
            setHintsUsed(h => h + 1);
            return;
          }
        }
      }
    }
  };

  const exportFlashcardsToPDF = () => {
    if (!flashcardResult?.cards?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(flashcardResult.title || 'Flashcards', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${flashcardResult.cards.length} cards`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    flashcardResult.cards.forEach((card: any, idx: number) => {
      if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 120, 0);
      doc.text(`Card ${idx + 1}`, margin, yPos);
      doc.setTextColor(0);
      yPos += 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Front:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const frontLines = doc.splitTextToSize(card.front || '', 165);
      doc.text(frontLines, margin + 4, yPos);
      yPos += frontLines.length * 6 + 4;
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Back:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(card.back || '', 165);
      doc.text(backLines, margin + 4, yPos);
      doc.setTextColor(0);
      yPos += backLines.length * 6 + 10;
      if (idx < flashcardResult.cards.length - 1) {
        doc.setDrawColor(220);
        doc.line(margin, yPos - 4, 190, yPos - 4);
      }
    });

    trackExport();
    doc.save(`flashcards-${Date.now()}.pdf`);
  };

  const exportFlashcardsToDOCX = async () => {
    if (!flashcardResult?.cards?.length) return;
    const children: any[] = [];
    children.push(new Paragraph({ text: flashcardResult.title || 'Flashcards', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${flashcardResult.cards.length} cards`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));
    flashcardResult.cards.forEach((card: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Card ${idx + 1}`, bold: true, color: 'B47800', size: 20 })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Front: ', bold: true }), new TextRun({ text: card.front || '' })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Back: ', bold: true }), new TextRun({ text: card.back || '', color: '3C643C' })] }));
      children.push(new Paragraph({ text: '' }));
    });
    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    trackExport();
    saveAs(blob, `flashcards-${Date.now()}.docx`);
  };

  const exportFlashcardsToJSON = () => {
    if (!flashcardResult?.cards?.length) return;
    const data = {
      title: flashcardResult.title || 'Flashcards',
      cards: flashcardResult.cards.map((c: any) => ({ front: c.front || '', back: c.back || '' })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flashcards-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    trackExport();
  };

  const exportCrosswordToPDF = () => {
    if (!crosswordResult?.placedWords?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(crosswordResult.title || 'Crossword', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${crosswordResult.placedWords.length} words`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    const grid = crosswordResult.grid;
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
            const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === ri && pw.col === ci);
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

    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos);
      yPos += 8;
      words.forEach((pw: any) => {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const clueText = doc.splitTextToSize(`${pw.number}. ${pw.clue} (${pw.word.length} letters)`, 165);
        doc.text(clueText, margin + 2, yPos);
        yPos += clueText.length * 6 + 2;
      });
      yPos += 4;
    });

    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 8;
    [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number).forEach((pw: any) => {
      if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pw.number}. ${pw.word} (${pw.direction})`, margin + 2, yPos);
      yPos += 6;
    });

    trackExport();
    doc.save(`crossword-${Date.now()}.pdf`);
  };

  const exportCrosswordToDOCX = async () => {
    if (!crosswordResult?.placedWords?.length) return;
    const children: any[] = [];
    children.push(new Paragraph({ text: crosswordResult.title || 'Crossword', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${crosswordResult.placedWords.length} words`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));
    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;
      children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
      words.forEach((pw: any) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] }));
      });
      children.push(new Paragraph({ text: '' }));
    });
    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number).forEach((pw: any) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: pw.word, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
    });
    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    trackExport();
    saveAs(blob, `crossword-${Date.now()}.docx`);
  };

  const typeOptions = [
    { value: 'mixed', label: 'Mixed', description: 'Variety of question types' },
    { value: 'multiple_choice', label: 'MCQ', description: 'A, B, C, D options' },
    { value: 'true_false', label: 'T/F', description: 'True or false statements' },
    { value: 'fill_blank', label: 'Fill', description: 'Complete the sentence' }
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', description: 'Basic recall questions' },
    { value: 'medium', label: 'Medium', description: 'Understanding & application' },
    { value: 'hard', label: 'Hard', description: 'Analysis & synthesis' }
  ];

  const loggedOutAnimationText = studyToolMode === 'flashcards' ? 'Generating flashcards' : studyToolMode === 'crossword' ? 'Generating crossword puzzle' : 'Generating quiz questions';

  const renderQuizTaking = () => {
    if (!quiz || !isQuizMode) return null;

    if (quizCompleted) {
      if (showQuizReview) {
        return (
          <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="p-4 sm:p-6 border-b-2 border-stone-100 dark:border-stone-700 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">Quiz Review</h2>
              <button onClick={() => setShowQuizReview(false)} className="px-5 py-2.5 rounded-2xl bg-[#1CB0F6] hover:bg-[#1AA3E5] text-white font-extrabold border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all text-sm uppercase tracking-wide">
                Back to Score
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-700">
              {displayedQuestions.map((q, idx) => {
                const ua = userAnswers[idx];
                const isCorrect = ua?.isCorrect ?? false;
                const correctAns = q.correctAnswer;
                const options = q.options || [];
                const correctIdx = typeof correctAns === 'string' && correctAns.length === 1 && correctAns >= 'A' && correctAns <= 'Z'
                  ? correctAns.charCodeAt(0) - 65
                  : options.findIndex(o => o === correctAns);
                const userIdx = options.findIndex(o => o === ua?.answer);
                return (
                  <div key={idx} className={`p-4 sm:p-5 flex gap-4 ${isCorrect ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'bg-red-50/30 dark:bg-red-900/10'}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">{q.question}</h4>
                      {options.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {options.map((opt, i) => (
                            <div key={i} className={`px-3 py-2 rounded-lg text-sm border ${
                              i === correctIdx
                                ? 'bg-emerald-100 dark:bg-emerald-800/50 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-medium'
                                : i === userIdx && !isCorrect
                                ? 'bg-red-100 dark:bg-red-800/50 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 font-medium'
                                : 'bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300'
                            }`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                          Correct: <span className="font-medium text-emerald-700 dark:text-emerald-400">{correctAns}</span>
                          {!isCorrect && ua?.answer && (
                            <> · Your answer: <span className="font-medium text-red-700 dark:text-red-400">{ua.answer}</span></>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      const score = getScore();
      const tier = score.percentage >= 80 ? 'great' : score.percentage >= 50 ? 'good' : 'keep_going';
      const tierColor = tier === 'great' ? '#58CC02' : tier === 'good' ? '#FF9600' : '#FF4B4B';
      const tierBorder = tier === 'great' ? '#46A302' : tier === 'good' ? '#E08600' : '#E03C3C';
      const tierMsg = tier === 'great' ? 'Amazing work!' : tier === 'good' ? 'Nice effort!' : 'Keep practicing!';
      return (
        <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 overflow-hidden p-6 sm:p-10 text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <div className="mb-8">
            <img
              src="/mascot-celebrating.webp"
              alt="Celebrating mascot"
              className="w-28 h-28 mx-auto mb-4 object-contain rounded-2xl border-2 border-b-4 overflow-hidden"
              style={{ borderColor: tierColor }}
            />
            <h2 className="text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-1">{tierMsg}</h2>
            <p className="text-stone-500 dark:text-stone-400 font-bold">Quiz complete</p>
          </div>

          {/* Animated score ring */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-stone-100 dark:text-stone-700" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={tierColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - score.percentage / 100)}`}
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold" style={{ color: tierColor }}>{score.percentage}%</span>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-0.5">
                {score.correct}/{score.total}
              </span>
            </div>
          </div>

          {/* Action buttons — Duolingo 3D style */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap max-w-xl mx-auto">
            {/* Export buttons */}
            {isPaidUser ? (
              <>
                <button
                  onClick={exportQuizToPDF}
                  className="px-5 py-3 bg-[#FF4B4B] hover:bg-[#F04040] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border-b-4 border-[#E03C3C] active:border-b-2 active:translate-y-0.5 uppercase tracking-wide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </button>
                <button
                  onClick={exportQuizToDOCX}
                  className="px-5 py-3 bg-[#A560E8] hover:bg-[#9A55DD] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border-b-4 border-[#8B4EC8] active:border-b-2 active:translate-y-0.5 uppercase tracking-wide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  DOCX
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowExportUpgradeModal(true)}
                  className="px-5 py-3 bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 active:border-b-2 active:translate-y-0.5 uppercase tracking-wide"
                >
                  PDF
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </button>
                <button
                  onClick={() => setShowExportUpgradeModal(true)}
                  className="px-5 py-3 bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 active:border-b-2 active:translate-y-0.5 uppercase tracking-wide"
                >
                  DOCX
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </button>
              </>
            )}
            <button
              onClick={() => { setShowQuizReview(true); window.scrollTo(0, 0); }}
              className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-extrabold rounded-2xl transition-all border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 hover:bg-stone-50 dark:hover:bg-stone-600 flex items-center justify-center gap-2 active:border-b-2 active:translate-y-0.5 text-sm uppercase tracking-wide"
            >
              Review
            </button>
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-[#FF9600] hover:bg-[#F08E00] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 border-b-4 border-[#E08600] active:border-b-2 active:translate-y-0.5 text-sm uppercase tracking-wide"
            >
              Try Again
            </button>
            <button
              onClick={() => { setQuiz(null); setIsQuizMode(false); setShowQuizReview(false); }}
              className="px-6 py-3 bg-[#1CB0F6] hover:bg-[#1AA3E5] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 text-sm uppercase tracking-wide"
            >
              New Quiz
            </button>
          </div>
        </div>
      );
    }

    const question = displayedQuestions[currentQuestion];

    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 overflow-hidden min-w-0" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* Progress bar — thick Duolingo green */}
        <div className="h-3 bg-stone-100 dark:bg-stone-700">
          <div
            className="h-full bg-[#58CC02] rounded-r-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestion + 1) / displayedQuestions.length) * 100}%` }}
          />
        </div>

        <div className="p-4 sm:p-8">
          {/* Question header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Question {currentQuestion + 1} of {displayedQuestions.length}
            </span>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide border-b-2 ${
              question.type === 'multiple_choice' ? 'bg-[#A560E8] text-white border-[#8B4EC8]' :
              question.type === 'true_false' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' :
              'bg-[#58CC02] text-white border-[#46A302]'
            }`}>
              {question.type === 'multiple_choice' ? 'Multiple Choice' :
               question.type === 'true_false' ? 'True/False' : 'Fill in the Blank'}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 leading-relaxed break-words">
            {question.question}
          </h2>

          {/* Answer options — Duolingo 3D pill style */}
          <div className="space-y-3 mb-8">
            {question.type === 'multiple_choice' && question.options?.map((option, idx) => {
              const letter = option.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrect = showResult && letter === question.correctAnswer;
              const isWrong = showResult && isSelected && letter !== question.correctAnswer;

              return (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedAnswer(letter)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-2xl border-2 border-b-4 text-left transition-all flex items-center gap-3 font-bold active:border-b-2 active:translate-y-0.5 ${
                    isCorrect ? 'border-[#58CC02] border-b-[#46A302] bg-[#58CC02]/10' :
                    isWrong ? 'border-[#FF4B4B] border-b-[#E03C3C] bg-[#FF4B4B]/10' :
                    isSelected ? 'border-[#1CB0F6] border-b-[#1899D6] bg-[#1CB0F6]/10 dark:bg-[#1CB0F6]/15' :
                    'border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 hover:border-[#1CB0F6]/50 dark:hover:border-[#1CB0F6]/40 hover:bg-sky-50/50 dark:hover:bg-sky-900/15'
                  } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold border-b-2 ${
                    isCorrect ? 'bg-[#58CC02] text-white border-[#46A302]' :
                    isWrong ? 'bg-[#FF4B4B] text-white border-[#E03C3C]' :
                    isSelected ? 'bg-[#1CB0F6] text-white border-[#1899D6]' :
                    'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-600'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1 min-w-0 break-words text-left text-stone-800 dark:text-stone-100">{option.substring(3)}</span>
                  {isCorrect && <span className="text-[#58CC02] text-lg">✓</span>}
                  {isWrong && <span className="text-[#FF4B4B] text-lg">✗</span>}
                </button>
              );
            })}

            {question.type === 'true_false' && (
              <>
                {['true', 'false'].map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = showResult && opt === question.correctAnswer;
                  const isWrong = showResult && isSelected && opt !== question.correctAnswer;

                  return (
                    <button
                      key={opt}
                      onClick={() => !showResult && setSelectedAnswer(opt)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-2xl border-2 border-b-4 text-left transition-all flex items-center gap-3 font-bold active:border-b-2 active:translate-y-0.5 ${
                        isCorrect ? 'border-[#58CC02] border-b-[#46A302] bg-[#58CC02]/10' :
                        isWrong ? 'border-[#FF4B4B] border-b-[#E03C3C] bg-[#FF4B4B]/10' :
                        isSelected ? 'border-[#1CB0F6] border-b-[#1899D6] bg-[#1CB0F6]/10 dark:bg-[#1CB0F6]/15' :
                        'border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 hover:border-[#1CB0F6]/50 dark:hover:border-[#1CB0F6]/40 hover:bg-sky-50/50 dark:hover:bg-sky-900/15'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center border-b-2 ${
                        isCorrect ? 'bg-[#58CC02] text-white border-[#46A302]' :
                        isWrong ? 'bg-[#FF4B4B] text-white border-[#E03C3C]' :
                        isSelected ? 'bg-[#1CB0F6] text-white border-[#1899D6]' :
                        'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-600'
                      }`}>
                        {opt === 'true' ? '✓' : '✗'}
                      </span>
                      <span className="flex-1 min-w-0 break-words text-left capitalize font-extrabold text-stone-800 dark:text-stone-100">{opt}</span>
                      {isCorrect && <span className="text-[#58CC02] text-lg">✓</span>}
                      {isWrong && <span className="text-[#FF4B4B] text-lg">✗</span>}
                    </button>
                  );
                })}
              </>
            )}

            {question.type === 'fill_blank' && question.options && (
              <>
                {question.options.map((opt, idx) => {
                  const letter = opt.charAt(0);
                  const isSelected = selectedAnswer === letter;
                  const isCorrect = showResult && letter === question.correctAnswer;
                  const isWrong = showResult && isSelected && letter !== question.correctAnswer;

                  return (
                    <button
                      key={idx}
                      onClick={() => !showResult && setSelectedAnswer(letter)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-2xl border-2 border-b-4 text-left flex items-center gap-4 transition-all font-bold active:border-b-2 active:translate-y-0.5 ${
                        isCorrect ? 'border-[#58CC02] border-b-[#46A302] bg-[#58CC02]/10' :
                        isWrong ? 'border-[#FF4B4B] border-b-[#E03C3C] bg-[#FF4B4B]/10' :
                        isSelected ? 'border-[#1CB0F6] border-b-[#1899D6] bg-[#1CB0F6]/10 dark:bg-[#1CB0F6]/15' :
                        'border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 hover:border-[#1CB0F6]/50 dark:hover:border-[#1CB0F6]/40 hover:bg-sky-50/50 dark:hover:bg-sky-900/15'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold border-b-2 ${
                        isCorrect ? 'bg-[#58CC02] text-white border-[#46A302]' :
                        isWrong ? 'bg-[#FF4B4B] text-white border-[#E03C3C]' :
                        isSelected ? 'bg-[#1CB0F6] text-white border-[#1899D6]' :
                        'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-600'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1 min-w-0 break-words text-left font-extrabold text-stone-800 dark:text-stone-100">{opt.substring(3)}</span>
                      {isCorrect && <span className="text-[#58CC02] text-lg">✓</span>}
                      {isWrong && <span className="text-[#FF4B4B] text-lg">✗</span>}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Mascot reaction — Duolingo-style happy/sad pop-in right after Check */}
          {showResult && (() => {
            const correctNow = selectedAnswer === question.correctAnswer;
            return (
              <div className="mb-4">
                <QuizMascotReaction
                  variant="inline"
                  state={correctNow ? 'correct' : 'wrong'}
                  subMessage={correctNow ? undefined : `Correct answer: ${question.correctAnswer}`}
                />
              </div>
            );
          })()}

          {/* Explanation (shown after answering) */}
          {showResult && (
            <div className="p-4 bg-[#1CB0F6]/10 rounded-2xl mb-6 border-2 border-[#1CB0F6]/30">
              <div className="flex items-start gap-3">
                <span className="text-[#1CB0F6] flex-shrink-0 mt-0.5 text-lg">💡</span>
                <div>
                  <p className="text-sm font-extrabold text-[#1899D6] dark:text-[#1CB0F6] mb-1">Explanation</p>
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons — Duolingo 3D style */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentQuestion > 0) {
                  setCurrentQuestion(currentQuestion - 1);
                  setShowResult(false);
                  setSelectedAnswer('');
                }
              }}
              disabled={currentQuestion === 0}
              className="px-5 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 font-extrabold rounded-2xl border-2 border-b-4 border-stone-200 border-b-stone-300 dark:border-stone-600 dark:border-b-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700/50 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              ← Previous
            </button>

            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="px-8 py-3.5 bg-[#58CC02] hover:bg-[#4EBB02] text-white font-extrabold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 shadow-md uppercase tracking-wide text-sm"
              >
                Check
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-8 py-3.5 bg-[#1CB0F6] hover:bg-[#1AA3E5] text-white font-extrabold rounded-2xl transition-all flex items-center gap-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 shadow-md uppercase tracking-wide text-sm"
              >
                {currentQuestion + 1 >= displayedQuestions.length ? (
                  <>See Results</>
                ) : (
                  <>Continue</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuizPreview = () => {
    if (!quiz || isQuizMode) return null;

    return (
      <div className="mt-4 min-w-0 w-full">
        <button onClick={() => setQuiz(null)} className="mb-4 px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:text-stone-100 flex items-center gap-2 font-extrabold rounded-xl border-2 border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">← Create New Quiz</button>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          <div className="p-4 sm:p-6 border-b-2 border-stone-200 dark:border-stone-700 bg-[#FFF4E0] dark:bg-[#FF9600]/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100">{quiz.title}</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 font-bold">
                  {displayedQuestions.length} questions • {quiz.difficulty} difficulty • {quiz.quizType} format
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={startQuiz}
                  className="px-5 py-2.5 bg-[#58CC02] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2 text-sm"
                >
                  🧠 Start Quiz
                </button>
                <button
                  onClick={downloadQuiz}
                  className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-all font-medium text-sm flex items-center gap-1.5"
                  title="Download as TXT"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  TXT
                </button>
                {isPaidUser ? (
                  <>
                    <button
                      onClick={exportQuizToPDF}
                      className="px-4 py-2.5 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all font-medium text-sm flex items-center gap-1.5"
                      title="Download as PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      PDF
                    </button>
                    <button
                      onClick={exportQuizToDOCX}
                      className="px-4 py-2.5 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all font-medium text-sm flex items-center gap-1.5"
                      title="Download as Word"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      DOCX
                    </button>
                  </>
                ) : (
                <>
                  <button
                    onClick={() => setShowExportUpgradeModal(true)}
                    className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-xl transition-all font-medium text-sm flex items-center gap-1.5 cursor-pointer"
                    title="Upgrade to export as PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                    <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </button>
                  <button
                    onClick={() => setShowExportUpgradeModal(true)}
                    className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 rounded-xl transition-all font-medium text-sm flex items-center gap-1.5 cursor-pointer"
                    title="Upgrade to export as Word"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    DOCX
                    <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {displayedQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-white dark:bg-stone-800 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF9600] border-b-2 border-[#D97F00] flex items-center justify-center text-white font-extrabold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-extrabold mb-2 border-b-2 ${
                      q.type === 'multiple_choice' ? 'bg-[#A560E8] text-white border-[#8A48C7]' :
                      q.type === 'true_false' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' :
                      'bg-[#58CC02] text-white border-[#46A302]'
                    }`}>
                      {q.type.replace('_', ' ')}
                    </span>
                    <p className="text-stone-800 dark:text-stone-100 font-bold">{q.question}</p>
                    {q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-sm text-stone-600 dark:text-stone-400 pl-2">{opt}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-green-600 mt-2 font-medium">Answer: {q.correctAnswer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  };

  const quizCurrentPage =
    studyToolMode === 'quiz' ? 'quiz-generator' : studyToolMode === 'flashcards' ? 'quiz-generator' : 'crossword-generator';

  const pageContent = (
    <>
      <main className="flex-1 w-full min-w-0 overflow-x-clip relative max-w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileUpload}
          className="hidden"
        />
        {/* Hero Section - minimal bar when loaded from recents; hide when locked-out layout (hero in grid) */}
        {showMinimalUI ? (
          <>
            <h1 className="sr-only">
              AI{' '}
              {studyToolMode === 'flashcards'
                ? 'Flashcard Generator'
                : studyToolMode === 'crossword'
                  ? 'Crossword Generator'
                  : 'Quiz Generator'}
            </h1>
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-stone-800/95 backdrop-blur border-b-2 border-stone-200 dark:border-stone-700" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <button onClick={() => {
              if (openedFromStudyPackViewer) {
                sessionStorage.removeItem('writescholar_return_to_study_pack_viewer');
                if (studyToolMode === 'quiz') {
                  sessionStorage.setItem('writescholar_study_pack_return_state', JSON.stringify({ questionIndex: currentQuestion }));
                }
              }
              onNavigate(openedFromStudyPackViewer ? 'study-pack-viewer' : openedFromDashboard ? 'dashboard' : openedFromHistory ? 'quiz-history' : 'dashboard');
            }} className="p-2.5 -ml-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors border-2 border-stone-200 dark:border-stone-600" aria-label={openedFromStudyPackViewer ? 'Back to study pack' : openedFromDashboard ? 'Back to dashboard' : openedFromHistory ? 'Back to saved materials' : 'Back to dashboard'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              {studyToolMode === 'quiz' ? 'Quiz' : studyToolMode === 'flashcards' ? 'Flashcards' : 'Crossword'}
            </span>
          </div>
          </>
        ) : !showLockedOutLayout ? (
        <div className="pt-8 sm:pt-12 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
                <div className="flex-shrink-0">
                <img src="/mascot-study.webp" alt="WriteScholar mascot" className="w-[96px] h-[96px] object-contain rounded-2xl" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#FF9600] text-white text-xs font-extrabold border-b-2 border-[#D97F00]">
                    Pro tool
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] text-xs font-extrabold border border-[#FF9600]/30">
                    🧠 AI-Powered
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4 leading-tight">
                  AI <span className="text-[#FF9600]">
                    {studyToolMode === 'flashcards' ? 'Flashcard Generator' : studyToolMode === 'crossword' ? 'Crossword Generator' : 'Quiz Generator'}
                  </span>
                </h1>
                <p className="text-sm sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed font-bold">
                  {studyToolMode === 'flashcards'
                    ? 'Turn your notes into interactive flip-card study sets for effective memorization.'
                    : studyToolMode === 'crossword'
                    ? 'Transform key terms into an interactive crossword puzzle to test your vocabulary.'
                    : 'Transform any article, textbook chapter, or research paper into interactive quizzes. Test your knowledge with multiple choice, true/false, and fill-in-the-blank questions.'}
                </p>

                {/* Study Tool Sub-Mode Tabs */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-6">
                  <div className="inline-flex items-center bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-2xl p-1.5">
                    {([
                      { key: 'quiz' as const, label: 'Quiz', icon: '📝' },
                      { key: 'flashcards' as const, label: 'Flashcards', icon: '🃏' },
                      { key: 'crossword' as const, label: 'Crossword', icon: '🧩' },
                    ]).map((tool) => (
                      <button
                        key={tool.key}
                        onClick={() => { setStudyToolMode(tool.key); setQuiz(null); setFlashcardResult(null); setCrosswordResult(null); setError(null); setIsQuizMode(false); }}
                        className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                          studyToolMode === tool.key
                            ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] border-2 border-[#FF9600]/30'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 border-2 border-transparent'
                        }`}
                      >
                        <span className="text-base">{tool.icon}</span>
                        <span className="hidden sm:inline">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {/* Main Content */}
        <div className={`pb-8 sm:pb-16 relative ${showMinimalUI ? 'pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8' : showLockedOutLayout ? 'pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8' : 'px-4 sm:px-6 lg:px-8'}`}>
          {/* Floating decorative elements removed for clean Duolingo style */}
          <div className="max-w-6xl mx-auto">
            {showLockedOutLayout ? (
              /* Stacked layout: generator on top, video below (locked-out scheme) */
              <div className="flex flex-col gap-8 lg:gap-10">
                {/* Top: Generator form */}
                <div className="order-1">
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
                    {/* Hero inside card */}
                    <div className="p-6 sm:p-8 pb-4 border-b-2 border-stone-100 dark:border-stone-700">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 hidden sm:block">
                          <img src="/mascot-laptop.webp" alt="WriteScholar mascot" className="w-[72px] h-[72px] object-contain rounded-2xl" />
                        </div>
                        <div>
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight tracking-tight">
                            AI <span className="text-[#FF9600]">
                              {studyToolMode === 'flashcards' ? 'Flashcard Generator' : studyToolMode === 'crossword' ? 'Crossword Generator' : 'Quiz Generator'}
                            </span>
                          </h1>
                          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed font-bold">
                            {studyToolMode === 'flashcards'
                              ? 'Turn your notes into interactive flip-card study sets.'
                              : studyToolMode === 'crossword'
                              ? 'Transform key terms into an interactive crossword puzzle.'
                              : 'Transform any article or textbook into interactive quizzes.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Form - quiz, flashcard, or crossword */}
                    {studyToolMode === 'quiz' && (
                  <div>
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 min-w-0 overflow-x-auto w-full sm:w-auto">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Type:</span>
                          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-xl">
                            {typeOptions.map((opt) => {
                              const locked = user != null && isFreeUser && opt.value !== 'mixed';
                              return (
                                <button key={opt.value} onClick={() => !locked && setQuizType(opt.value as any)} disabled={locked} title={locked ? 'Pro only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' : quizType === opt.value ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] font-extrabold border-b-2 border-[#FF9600]' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Difficulty:</span>
                          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-xl">
                            {difficultyOptions.map((opt) => {
                              const locked = user != null && isFreeUser && opt.value !== 'medium';
                              return (
                                <button key={opt.value} onClick={() => !locked && setDifficulty(opt.value as any)} disabled={locked} title={locked ? 'Pro only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' : difficulty === opt.value ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] font-extrabold border-b-2 border-[#FF9600]' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Questions:</span>
                          <select value={user != null && isFreeUser ? 10 : questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600 focus:border-[#FF9600] ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={10}>10</option> : [5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 100 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<><span>✨</span><span>Generate Quiz</span><span>→</span></>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste from clipboard"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear text"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your quiz questions..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your article, textbook chapter, or research paper here... (minimum 100 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 100 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>
                            {wordCount.toLocaleString()} words{wordCount >= 100 && wordCount <= quizUsage.maxWordsPerGeneration && ` / ${quizUsage.maxWordsPerGeneration.toLocaleString()} max`}
                          </span>
                          {wordCount < 100 && <span className="text-[#FF9600]">Minimum 100 words</span>}
                          {wordCount > quizUsage.maxWordsPerGeneration && <span className="text-red-600">Exceeds {quizUsage.maxWordsPerGeneration.toLocaleString()} word limit{isFreeUser && ' (upgrade for 15,000)'}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {studyToolMode === 'flashcards' && (
                  <div>
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Cards:</span>
                          <select value={flashcardCount} onChange={(e) => setFlashcardCount(Number(e.target.value))} className="px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600 focus:border-[#FF9600]">
                            {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                          <button onClick={() => setFlashcardResult({ title: 'My Flashcards', cards: [] })} className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 bg-[#A560E8] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm">✏️ Create from Scratch</button>
                          <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                            {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🃏 Generate with AI →</>)}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your flashcard deck..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes, textbook content, or any material to turn into flashcards... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 50 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-[#FF9600]">Minimum 50 words</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {studyToolMode === 'crossword' && (
                  <div>
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Words:</span>
                          <select value={crosswordWordCount} onChange={(e) => setCrosswordWordCount(Number(e.target.value))} className="px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600 focus:border-[#FF9600]">
                            {[6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted} className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🧩 Generate Crossword →</>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Building your crossword puzzle..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 50 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-[#FF9600]">Minimum 50 words</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  </div>
                </div>

                {/* Bottom: Video - See how it works */}
                <div className="order-2">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">See how it works</h2>
                      <span className="h-px flex-1 max-w-32 bg-[#FF9600]/30 rounded-full" />
                    </div>
                    <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border-2 border-b-4 border-stone-200 dark:border-stone-700 max-w-3xl mx-auto">
                      <div className="bg-[#FFF4E0] dark:bg-[#FF9600]/10 flex items-center justify-center aspect-video min-h-[200px] sm:min-h-[320px]">
                        <video key={studyToolMode} autoPlay loop muted playsInline className="w-full h-full object-contain" title={studyToolMode === 'quiz' ? 'WriteScholar AI Quiz Generator — Turn notes into practice tests' : studyToolMode === 'flashcards' ? 'WriteScholar Study Pack — AI flashcard generator from notes' : 'WriteScholar Crossword Generator — Create study puzzles from notes'} aria-label={studyToolMode === 'quiz' ? 'WriteScholar AI Quiz Generator — Turn notes into practice tests' : studyToolMode === 'flashcards' ? 'WriteScholar Study Pack — AI flashcard generator from notes' : 'WriteScholar Crossword Generator — Create study puzzles from notes'}>
                          <source src={studyToolMode === 'quiz' ? '/writescholar-quiz-generator-demo.mp4' : studyToolMode === 'flashcards' ? '/writescholar-flashcards-demo.mp4' : '/writescholar-crossword-demo.mp4'} type="video/mp4" />
                        </video>
                      </div>
                      <div className="px-4 py-3.5 border-t-2 border-stone-100 dark:border-stone-700">
                        <p className="text-sm font-extrabold text-stone-800 dark:text-stone-100">
                          {studyToolMode === 'quiz' ? 'Quiz generator' : studyToolMode === 'flashcards' ? 'Flashcard generator' : 'Crossword generator'}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-bold">
                          {studyToolMode === 'quiz' ? 'Transform notes into interactive quizzes with multiple choice, true/false & fill-in-the-blank' : studyToolMode === 'flashcards' ? 'Turn study material into flip-card decks for effective memorization' : 'Build vocabulary puzzles from your key terms'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {/* === QUIZ MODE === */}
            {studyToolMode === 'quiz' && (
              <>
                {quiz && isQuizMode ? (
                  renderQuizTaking()
                ) : !quiz && (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden min-w-0">
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 min-w-0 overflow-x-auto w-full sm:w-auto">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Type:</span>
                          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-xl">
                            {typeOptions.map((opt) => {
                              const locked = user != null && isFreeUser && opt.value !== 'mixed';
                              return (
                                <button key={opt.value} onClick={() => !locked && setQuizType(opt.value as any)} disabled={locked} title={locked ? 'Pro only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' : quizType === opt.value ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] font-extrabold border-b-2 border-[#FF9600]' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Difficulty:</span>
                          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-xl">
                            {difficultyOptions.map((opt) => {
                              const locked = user != null && isFreeUser && opt.value !== 'medium';
                              return (
                                <button key={opt.value} onClick={() => !locked && setDifficulty(opt.value as any)} disabled={locked} title={locked ? 'Pro only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' : difficulty === opt.value ? 'bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] font-extrabold border-b-2 border-[#FF9600]' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Questions:</span>
                          <select value={user != null && isFreeUser ? 10 : questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600 focus:border-[#FF9600] ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={10}>10</option> : [5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 100 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<><span>✨</span><span>Generate Quiz</span><span>→</span></>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste from clipboard"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear text"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your quiz questions..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your article, textbook chapter, or research paper here... (minimum 100 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 100 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>
                            {wordCount.toLocaleString()} words{wordCount >= 100 && wordCount <= quizUsage.maxWordsPerGeneration && ` / ${quizUsage.maxWordsPerGeneration.toLocaleString()} max`}
                          </span>
                          {wordCount < 100 && <span className="text-[#FF9600]">Minimum 100 words</span>}
                          {wordCount > quizUsage.maxWordsPerGeneration && <span className="text-red-600">Exceeds {quizUsage.maxWordsPerGeneration.toLocaleString()} word limit{isFreeUser && ' (upgrade for 15,000)'}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {quiz && !isQuizMode && renderQuizPreview()}
              </>
            )}

            {/* === FLASHCARD MODE === */}
            {studyToolMode === 'flashcards' && (
              <>
                {flashcardResult ? (
                  <div className="min-w-0 w-full overflow-x-clip">
                    <FlashcardViewer
                      initialCards={flashcardResult.cards ?? []}
                      title={flashcardResult.title || 'Flashcards'}
                      onExportPDF={isPaidUser ? exportFlashcardsToPDF : undefined}
                      onExportDOCX={isPaidUser ? exportFlashcardsToDOCX : undefined}
                      onExportJSON={exportFlashcardsToJSON}
                      onNewDeck={() => setFlashcardResult(null)}
                      canExport={isPaidUser}
                      onLoadPrevious={() => (onNavigate as (p: string, s?: string, o?: { quizHistoryFilter?: string }) => void)('quiz-history', undefined, { quizHistoryFilter: 'flashcards' })}
                      onSaveToStudyTools={user ? async (title, cards) => {
                        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                        if (!token) { onNavigate('signup'); return; }
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/save-flashcards`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ title, cards, sourceText: inputText })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Failed to save');
                        trackAction('flashcards_count');
                      } : undefined}
                    />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden min-w-0">
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Cards:</span>
                          <select value={user != null && isFreeUser ? 15 : flashcardCount} onChange={(e) => setFlashcardCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={15}>15</option> : [5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                          <button
                            onClick={() => setFlashcardResult({ title: 'My Flashcards', cards: [] })}
                            className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 bg-[#A560E8] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            ✏️ Create from Scratch
                          </button>
                          <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                            {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🃏 Generate with AI →</>)}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your flashcard deck..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes, textbook content, or any material to turn into flashcards... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 50 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-[#FF9600]">Minimum 50 words</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === CROSSWORD MODE === */}
            {studyToolMode === 'crossword' && (
              <>
                {crosswordResult && crosswordResult.placedWords?.length > 0 ? (
                  <div className="min-w-0 w-full overflow-x-clip">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{crosswordResult.title}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaidUser ? (
                          <>
                            <button onClick={exportCrosswordToPDF} className="px-3 py-1.5 bg-[#FF4B4B] text-white font-bold rounded-xl border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportCrosswordToDOCX} className="px-3 py-1.5 bg-[#A560E8] text-white font-bold rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 font-bold rounded-xl border-2 border-b-4 border-stone-300 dark:border-stone-500 flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 font-bold rounded-xl border-2 border-b-4 border-stone-300 dark:border-stone-500 flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        )}
                        {!crosswordChecked && (
                          <>
                            <button
                              onClick={handleCrosswordHint}
                              className="px-4 py-2 text-sm font-bold bg-[#A560E8] text-white rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                              title="Reveal one letter from the selected word"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              Hint {hintsUsed > 0 && <span className="text-xs bg-violet-200 text-violet-800 rounded-full px-1.5 py-0.5 font-bold">{hintsUsed}</span>}
                            </button>
                            <button onClick={() => setCrosswordChecked(true)} className="px-4 py-2 text-sm font-bold uppercase tracking-wide bg-[#58CC02] text-white rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all">Check Answers</button>
                          </>
                        )}
                        <button onClick={() => { setCrosswordResult(null); setCrosswordAnswers({}); setCrosswordChecked(false); setSelectedClue(null); setSelectedCell(null); setSelectedDirection('across'); setHintsUsed(0); }} className="px-4 py-2 text-sm text-white bg-[#FF9600] rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all font-bold">New Puzzle</button>
                      </div>
                    </div>
                    {crosswordChecked && (() => {
                      const attemptedWords = crosswordResult.placedWords.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').length > 0);
                      const total = attemptedWords.length;
                      const correct = attemptedWords.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() === pw.word).length;
                      const notAttempted = crosswordResult.placedWords.length - total;
                      return (
                        <div className={`mb-4 p-4 rounded-2xl text-center ${total === 0 ? 'bg-stone-50 dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-600' : correct === total ? 'bg-[#EAFFD6] border-2 border-b-4 border-[#58CC02]/30' : 'bg-[#FFF4E0] dark:bg-amber-900/20 border-2 border-b-4 border-[#FF9600]/30'}`}>
                          {total === 0 ? <span className="text-3xl mb-1 block">✏️</span> : correct === total ? (
                            <img src="/mascot-celebrating.webp" alt="Celebrating mascot" className="w-16 h-16 mx-auto mb-1 object-contain rounded-xl border-2 border-b-4 border-[#58CC02]/50 dark:border-[#58CC02]/40 overflow-hidden" />
                          ) : <span className="text-3xl mb-1 block">📊</span>}
                          {total === 0 ? (
                            <>
                              <p className="font-bold text-lg">No answers submitted</p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">Type in some answers and try again!</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-lg">{correct} / {total} correct</p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                {correct === total ? 'Perfect score on attempted words!' : 'Check the highlighted answers below.'}
                                {notAttempted > 0 && ` (${notAttempted} word${notAttempted > 1 ? 's' : ''} not attempted)`}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                      {/* Crossword Grid - Interactive */}
                      <div 
                        className="bg-white dark:bg-stone-600 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-600 p-3 sm:p-4 overflow-x-auto overflow-y-visible focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] dark:focus:ring-[#1CB0F6] min-w-0"
                        tabIndex={0}
                        onKeyDown={handleCrosswordKeyDown}
                      >
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">Click a cell to type, or use the clue inputs below. Arrow keys to navigate.</p>
                        <div className="inline-block min-w-0">
                          {crosswordResult.grid?.map((row: string[], rowIdx: number) => (
                            <div key={rowIdx} className="flex">
                              {row.map((cell: string, colIdx: number) => {
                                if (cell === '' || cell === '#') return <div key={colIdx} className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 flex-shrink-0 bg-stone-800 dark:bg-stone-700" />;
                                const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === rowIdx && pw.col === colIdx);
                                const cellNumber = wordAtCell?.number;
                                const typedLetter = getCellLetter(rowIdx, colIdx);
                                const isSelectedCell = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                                
                                let isHighlighted = false;
                                if (selectedClue !== null) {
                                  const sel = crosswordResult.placedWords.find((pw: any) => pw.number === selectedClue);
                                  if (sel) {
                                    if (sel.direction === 'across' && rowIdx === sel.row && colIdx >= sel.col && colIdx < sel.col + sel.length) isHighlighted = true;
                                    if (sel.direction === 'down' && colIdx === sel.col && rowIdx >= sel.row && rowIdx < sel.row + sel.length) isHighlighted = true;
                                  }
                                }
                                
                                let cellColor = 'bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-600 hover:border-[#1CB0F6]/50 dark:hover:border-[#1CB0F6]/50';
                                if (isSelectedCell) cellColor = 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 border-[#1CB0F6] ring-2 ring-[#1CB0F6]/40';
                                else if (isHighlighted) cellColor = 'bg-[#DDF4FF]/50 dark:bg-[#1CB0F6]/10 border-[#1CB0F6]/60 dark:border-[#1CB0F6]/50';
                                
                                if (crosswordChecked) {
                                  const wordsThrough = crosswordResult.placedWords.filter((pw: any) => {
                                    if (pw.direction === 'across') return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
                                    return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
                                  });
                                  const attemptedWords = wordsThrough.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').length > 0);
                                  const anyCorrect = attemptedWords.some((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() === pw.word);
                                  const anyWrong = attemptedWords.some((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() !== pw.word);
                                  if (attemptedWords.length > 0) {
                                    if (anyCorrect && !anyWrong) cellColor = 'bg-green-50 border-green-400';
                                    else if (anyWrong) cellColor = 'bg-red-50 border-red-400';
                                  }
                                }
                                return (
                                  <div 
                                    key={colIdx} 
                                    onClick={() => handleCellClick(rowIdx, colIdx)}
                                    className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 flex-shrink-0 border ${cellColor} flex items-center justify-center relative cursor-pointer transition-colors`}
                                  >
                                    {cellNumber && <span className="absolute top-0 left-0.5 text-[8px] font-bold text-stone-500 dark:text-stone-400 leading-none">{cellNumber}</span>}
                                    <span className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200">{crosswordChecked ? cell : typedLetter}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Clues List */}
                      <div className="space-y-4">
                        {['across', 'down'].map(dir => {
                          const words = crosswordResult.placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
                          if (words.length === 0) return null;
                          return (
                            <div key={dir}>
                              <h4 className="text-sm font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{dir === 'across' ? 'Across →' : 'Down ↓'}</h4>
                              <div className="space-y-2">
                                {words.map((pw: any) => {
                                  const answerKey = `word-${pw.number}`;
                                  const hasAnswer = (crosswordAnswers[answerKey] || '').length > 0;
                                  const isCorrectCW = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() === pw.word;
                                  const isWrongCW = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() !== pw.word;
                                  const isNotAttempted = crosswordChecked && !hasAnswer;
                                  return (
                                    <div key={pw.number} 
                                      onClick={() => {
                                        const newSelected = selectedClue === pw.number ? null : pw.number;
                                        setSelectedClue(newSelected);
                                        if (newSelected !== null) {
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                          setSelectedDirection(pw.direction);
                                        } else {
                                          setSelectedCell(null);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border-2 border-b-4 cursor-pointer transition-all ${
                                        selectedClue === pw.number ? 'border-[#1CB0F6] dark:border-[#1CB0F6] bg-[#DDF4FF] dark:bg-[#1CB0F6]/10' :
                                        isCorrectCW ? 'border-[#58CC02]/40 bg-[#EAFFD6]' :
                                        isWrongCW ? 'border-[#FF4B4B]/40 bg-[#FFE8E8]' :
                                        isNotAttempted ? 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 opacity-60' :
                                        'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 bg-white dark:bg-stone-700'
                                      }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-xs font-extrabold text-white bg-[#1CB0F6] rounded-lg w-6 h-6 flex items-center justify-center flex-shrink-0 border-b-2 border-[#1899D6]">{pw.number}</span>
                                        <p className="text-sm text-stone-700 dark:text-stone-300">{pw.clue} <span className="text-stone-400 dark:text-stone-500">({pw.word.length} letters)</span></p>
                                      </div>
                                      <input 
                                        ref={selectedClue === pw.number && selectedDirection === pw.direction ? crosswordInputRef : undefined}
                                        type="text" 
                                        maxLength={pw.word.length} 
                                        value={crosswordAnswers[answerKey] || ''} 
                                        onChange={(e) => {
                                          const newValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                          setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newValue });
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          const cellOffset = Math.min(newValue.length, pw.word.length - 1);
                                          if (pw.direction === 'across') {
                                            setSelectedCell({ row: pw.row, col: pw.col + cellOffset });
                                          } else {
                                            setSelectedCell({ row: pw.row + cellOffset, col: pw.col });
                                          }
                                        }}
                                        onFocus={() => {
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                        }}
                                        onClick={(e) => e.stopPropagation()} 
                                        disabled={crosswordChecked} 
                                        placeholder={'_'.repeat(pw.word.length)}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-[0.3em] uppercase ${
                                          isCorrectCW ? 'border-green-400 bg-green-50 text-green-700' : 
                                          isWrongCW ? 'border-red-400 bg-red-50 text-red-700' : 
                                          'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100'
                                        } ${crosswordChecked ? 'cursor-not-allowed' : ''}`} 
                                      />
                                      {isWrongCW && crosswordChecked && <p className="text-xs text-red-500 mt-1">Answer: <span className="font-mono font-bold">{pw.word}</span></p>}
                                      {isNotAttempted && <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">Not attempted</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden min-w-0">
                    <div className="border-b border-stone-200 dark:border-stone-600 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Words:</span>
                          <select value={user != null && isFreeUser ? 10 : crosswordWordCount} onChange={(e) => setCrosswordWordCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-stone-100 dark:bg-stone-700 border-0 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={10}>10</option> : [6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-[#58CC02] text-white font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🧩 Generate Crossword →</>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-stone-200 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9600]"></div><span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 text-[#FF9600] hover:bg-[#FF9600]/20 font-extrabold text-xs transition-colors disabled:opacity-50 border-2 border-[#FF9600]/30 rounded-xl" title="Upload PDF, Word, or TXT">
                            {isParsingDoc ? <span className="w-3.5 h-3.5 border-2 border-[#FF9600] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                            {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                          </button>
                          <button onClick={handlePaste} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-[#FF9600] dark:hover:text-[#FF9600] hover:bg-[#FFF4E0] dark:hover:bg-[#FF9600]/10 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Building your crossword puzzle..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-200 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                          <span className={`${wordCount < 50 ? 'text-[#FF9600]' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-[#FF9600]">Minimum 50 words</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 mx-3 sm:mx-0 p-3 sm:p-4 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#FF4B4B] flex items-center justify-center flex-shrink-0 border-b-2 border-[#E04343]">
                  <span className="text-white text-xs font-extrabold">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-stone-800 dark:text-stone-200 text-sm font-bold">{error}</p>
                  {(quizExhausted || (error && error.includes('Upgrade'))) && user && (
                    <>
                      <p className="text-[#FF4B4B] text-xs mt-1 font-bold">{getResetsInText(quizUsage.daysUntilReset)}</p>
                      <button
                        onClick={() => onNavigate('pricing')}
                        className="mt-2 px-4 py-2 bg-[#FF9600] text-white text-sm font-bold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all inline-flex items-center gap-2"
                      >
                        👑 View Plans
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Lock Overlay for Free Users who exhausted their limit */}
            {user && quizExhausted && !quiz && !flashcardResult && !crosswordResult && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-[#FF9600] rounded-2xl p-6 text-white text-center border-2 border-b-4 border-[#D97F00]">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <h3 className="text-xl font-extrabold mb-2">Monthly Limit Reached</h3>
                  <p className="text-white/90 mb-1 font-bold">You've used all your quiz generations this period. Upgrade to Pro for more!</p>
                  <p className="text-white/70 text-sm mb-4 font-bold">{getResetsInText(quizUsage.daysUntilReset)}</p>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-6 py-2.5 bg-white text-[#FF9600] font-extrabold rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all inline-flex items-center gap-2 uppercase tracking-wide"
                  >
                    👑 Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* See how it works - Video (when signed in, generator form visible) */}
            {!showLockedOutLayout && !quiz && !flashcardResult && !crosswordResult && (
              <div className="mt-8 sm:mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">See how it works</h2>
                  <span className="h-px flex-1 max-w-32 bg-[#FF9600]/30 rounded-full" />
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border-2 border-b-4 border-stone-200 dark:border-stone-700 max-w-3xl mx-auto">
                  <div className="bg-[#FFF4E0] dark:bg-[#FF9600]/10 flex items-center justify-center aspect-video min-h-[200px] sm:min-h-[320px]">
                    <video key={studyToolMode} autoPlay loop muted playsInline className="w-full h-full object-contain" title={studyToolMode === 'quiz' ? 'WriteScholar AI Quiz Generator — Turn notes into practice tests' : studyToolMode === 'flashcards' ? 'WriteScholar Study Pack — AI flashcard generator from notes' : 'WriteScholar Crossword Generator — Create study puzzles from notes'} aria-label={studyToolMode === 'quiz' ? 'WriteScholar AI Quiz Generator — Turn notes into practice tests' : studyToolMode === 'flashcards' ? 'WriteScholar Study Pack — AI flashcard generator from notes' : 'WriteScholar Crossword Generator — Create study puzzles from notes'}>
                      <source src={studyToolMode === 'quiz' ? '/writescholar-quiz-generator-demo.mp4' : studyToolMode === 'flashcards' ? '/writescholar-flashcards-demo.mp4' : '/writescholar-crossword-demo.mp4'} type="video/mp4" />
                    </video>
                  </div>
                  <div className="px-4 py-3.5 border-t-2 border-stone-100 dark:border-stone-700">
                    <p className="text-sm font-extrabold text-stone-800 dark:text-stone-100">
                      {studyToolMode === 'quiz' ? 'Quiz generator' : studyToolMode === 'flashcards' ? 'Flashcard generator' : 'Crossword generator'}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-bold">
                      {studyToolMode === 'quiz' ? 'Transform notes into interactive quizzes with multiple choice, true/false & fill-in-the-blank' : studyToolMode === 'flashcards' ? 'Turn study material into flip-card decks for effective memorization' : 'Build vocabulary puzzles from your key terms'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Info for free and Pro users */}
            {user && isFreeUser && !quizExhausted && !quiz && !flashcardResult && !crosswordResult && (
              <div className="mt-6 mx-3 sm:mx-0">
<div className="bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                      <>
                        <p className="text-stone-800 dark:text-stone-200 font-bold text-sm">
                          Free plan: {quizUsage.generationsRemaining} of {quizUsage.generationLimit} quizzes remaining • Mixed type • Medium difficulty • 10 questions • Max {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words
                        </p>
                        <p className="text-[#FF9600] text-xs mt-0.5 font-bold">Upgrade to Pro for all quiz types, difficulties, and up to 15,000 words • {getResetsInText(quizUsage.daysUntilReset)}</p>
                      </>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('pricing')} className="px-4 py-2 bg-[#FF9600] text-white text-xs font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all">
                    Upgrade
                  </button>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </div>

        {/* Features Section - hidden when loaded from recents */}
        {!showMinimalUI && (
        <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-stone-900 border-t-2 border-stone-200 dark:border-stone-700" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-stone-800 dark:text-stone-100 mb-8 sm:mb-12">
              Why Use Our <span className="text-[#FF9600]">Study Tools</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: '📝',
                  title: 'Interactive Quizzes',
                  description: 'Multiple choice, true/false, and fill-in-the-blank questions to test your understanding.',
                  color: 'bg-[#1CB0F6]',
                  border: 'border-[#1899D6]',
                },
                {
                  icon: '🃏',
                  title: 'Flashcard Decks',
                  description: 'Flip-card study sets with mastery tracking to memorize key concepts efficiently.',
                  color: 'bg-[#FF9600]',
                  border: 'border-[#D97F00]',
                },
                {
                  icon: '🧩',
                  title: 'Crossword Puzzles',
                  description: 'Fun vocabulary-building puzzles generated from your study material.',
                  color: 'bg-[#58CC02]',
                  border: 'border-[#46A302]',
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white dark:bg-stone-800 p-6 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} border-2 border-b-4 ${feature.border} flex items-center justify-center mb-4 text-2xl`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 mb-2">{feature.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed font-bold">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Export Upgrade Modal */}
      {showExportUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 max-w-md w-full p-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-2xl border-2 border-b-4 border-[#FF9600]/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#FF9600]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Unlock Export Feature</h3>
              <p className="text-stone-500 dark:text-stone-400 font-bold">
                Export your quizzes, flashcards, and crosswords to PDF or Word documents with a paid plan.
              </p>
            </div>

            <div className="bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-xl p-4 mb-6 border-2 border-[#FF9600]/30">
              <h4 className="font-extrabold text-stone-800 dark:text-stone-200 mb-3">Paid Plan Benefits:</h4>
              <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300 font-bold">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to PDF & Word documents
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Permanent storage (no 30-day limit)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited quiz & study pack generations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All difficulty & question types
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportUpgradeModal(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowExportUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-3 bg-[#58CC02] text-white rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logged-out: same popup animation as landing page */}
      {showFakeAnimation && (
        <AnalysisAnimation isPopup={true} text={loggedOutAnimationText} isComplete={false} />
      )}

      {/* Logged-out: sign-up modal (same as landing page Study Tools modal) */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 border-2 border-b-4 border-stone-200 dark:border-stone-700 animate-fade-in" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <button type="button" onClick={() => setShowSignupPrompt(false)} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#FFF4E0] dark:bg-[#FF9600]/10 rounded-2xl border-2 border-b-4 border-[#FF9600]/30 flex items-center justify-center">
                <span className="text-3xl">{studyToolMode === 'flashcards' ? '🃏' : studyToolMode === 'crossword' ? '🧩' : '📝'}</span>
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 text-center mb-2">
              {studyToolMode === 'flashcards' ? 'Flashcards Generated' : studyToolMode === 'crossword' ? 'Crossword Generated' : 'Quiz Generated'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-center text-sm mb-5 font-bold">
              {studyToolMode === 'flashcards' ? 'We\'ve created flip cards from your content' : studyToolMode === 'crossword' ? 'We\'ve created a puzzle from your content' : 'We\'ve created questions from your content'}
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-[#EAFFD6] dark:bg-[#58CC02]/10 rounded-xl border-2 border-[#58CC02]/30">
                <span className="w-8 h-8 bg-[#58CC02] rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 border-b-2 border-[#46A302]">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-stone-800 dark:text-stone-200 font-extrabold text-sm">
                    {studyToolMode === 'flashcards' ? 'Interactive flip cards' : studyToolMode === 'crossword' ? 'Interactive crossword puzzle' : 'Multiple choice & true/false'}
                  </p>
                  <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5 font-bold">
                    {studyToolMode === 'flashcards' ? 'Perfect for memorization and quick review' : studyToolMode === 'crossword' ? 'Fun way to learn key vocabulary' : 'Mix question types for better retention'}
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3.5 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 rounded-xl border-2 border-[#1CB0F6]/30">
                <span className="w-8 h-8 bg-[#1CB0F6] rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 border-b-2 border-[#1899D6]">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-stone-800 dark:text-stone-200 font-extrabold text-sm">Sign up to generate quizzes</p>
                  <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5 font-bold">Create a free account — upgrade to Pro for unlimited</p>
                </div>
              </div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3.5 mb-6 border-2 border-stone-200 dark:border-stone-700">
              <p className="text-stone-600 dark:text-stone-400 text-sm text-center leading-relaxed font-bold">
                <span className="font-extrabold text-stone-800 dark:text-stone-100">
                  {studyToolMode === 'flashcards' ? 'Turn any notes into flashcards.' : studyToolMode === 'crossword' ? 'Turn key terms into puzzles.' : 'Turn any notes into a quiz.'}
                </span> Great for exam prep and study sessions.
              </p>
            </div>
            <button
              onClick={() => { setShowSignupPrompt(false); onNavigate('signup'); }}
              className="w-full py-3.5 bg-[#58CC02] text-white font-extrabold rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center uppercase tracking-wide"
            >
              Sign up to unlock Study Tools — it&apos;s free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!showMinimalUI && <ToolPageSeoContent {...quizGenSeo} onNavigate={onNavigate} />}

      {!showMinimalUI && <Footer onNavigate={onNavigate} />}
    </>
  );

  if (showMinimalUI) {
    return <div className="relative min-h-screen flex flex-col overflow-x-clip">{pageContent}</div>;
  }

  return (
    <LoggedInPageShell className="relative min-h-screen flex flex-col overflow-x-clip" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage={quizCurrentPage}>
      {pageContent}
    </LoggedInPageShell>
  );
};

export default QuizGeneratorPage;
