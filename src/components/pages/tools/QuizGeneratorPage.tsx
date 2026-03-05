import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import AnalysisAnimation from '../../common/AnalysisAnimation';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface QuizGeneratorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
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
  sourceWordCount: number;
}

interface UserAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

const QuizGeneratorPage = ({ onNavigate, user, initialStudyToolMode = 'quiz' }: QuizGeneratorPageProps) => {
  const [inputText, setInputText] = useState('');
  const [studyToolMode, setStudyToolMode] = useState<'quiz' | 'flashcards' | 'crossword'>(initialStudyToolMode);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  
  // Quiz taking state
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Flashcard state
  const [flashcardResult, setFlashcardResult] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  
  // Crossword state
  const [crosswordResult, setCrosswordResult] = useState<any>(null);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<string, string>>({});
  const [crosswordChecked, setCrosswordChecked] = useState(false);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [hintsUsed, setHintsUsed] = useState(0);

  const isPremiumUser = user && (user.subscription_plan === 'premium' || user.plan === 'premium');
  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const isFreeUser = !user || userPlan === 'free';
  const isPaidUser = user && (userPlan === 'starter' || userPlan === 'premium');
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  
  // Export upgrade modal state
  const [showExportUpgradeModal, setShowExportUpgradeModal] = useState(false);
  
  // Quiz usage state for free users
  const [quizUsage, setQuizUsage] = useState({
    generationsUsed: 0,
    generationLimit: 3,
    generationsRemaining: 3,
    maxWordsPerGeneration: 5000,
    wordsUsed: 0,
    wordLimit: 15000,
    plan: 'free'
  });
  
  // Free users can use quiz with limits; paid users have unlimited
  const quizExhausted = isFreeUser && quizUsage.generationLimit !== -1 && quizUsage.generationsRemaining <= 0;

  useEffect(() => {
    document.title = 'AI Quiz Generator – Create Quizzes from Documents | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Turn any article, textbook, or research paper into interactive quizzes. Multiple choice, true/false, and fill-in-the-blank questions. Free plan: 3 quizzes/month.');
    }
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
        setCurrentQuestion(0);
        setUserAnswers([]);
        setSelectedAnswer('');
        setShowResult(false);
        setQuizCompleted(false);
        setError(null);
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
        setCurrentCard(0);
        setIsFlipped(false);
        setError(null);
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
      }
    } catch (e) {
      console.error('Failed to load saved crossword:', e);
    } finally {
      localStorage.removeItem('savedCrossword');
    }
  }, []);

  // Fetch quiz usage for logged-in users
  useEffect(() => {
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
              generationLimit: data.data.generationLimit ?? 3,
              generationsRemaining: data.data.generationsRemaining ?? 3,
              maxWordsPerGeneration: data.data.maxWordsPerGeneration || 5000,
              wordsUsed: data.data.wordsUsed || 0,
              wordLimit: data.data.wordLimit || 15000,
              plan: data.data.plan || 'free'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching quiz usage:', error);
      }
    };

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
      setError('You\'ve used all 3 quiz generations this month. Upgrade for unlimited quizzes.');
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim()) return;
    if (!user) { setShowFakeAnimation(true); setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 14000); return; }
    if (quizExhausted) { setError('You\'ve used all 3 study tool generations this month. Upgrade for unlimited access.'); return; }
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
      setCurrentCard(0);
      setIsFlipped(false);
      setKnownCards(new Set());
      if (isFreeUser) setQuizUsage(prev => ({ ...prev, generationsUsed: prev.generationsUsed + 1, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
    } catch (err: any) {
      setError(err.message || 'Flashcard generation failed.');
    } finally { setIsLoading(false); }
  };

  const handleGenerateCrossword = async () => {
    if (!inputText.trim()) return;
    if (!user) { setShowFakeAnimation(true); setTimeout(() => { setShowFakeAnimation(false); setShowSignupPrompt(true); }, 14000); return; }
    if (quizExhausted) { setError('You\'ve used all 3 study tool generations this month. Upgrade for unlimited access.'); return; }
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
      setCrosswordAnswers({});
      setCrosswordChecked(false);
      setSelectedClue(null);
      setSelectedCell(null);
      setHintsUsed(0);
      if (isFreeUser) setQuizUsage(prev => ({ ...prev, generationsUsed: prev.generationsUsed + 1, generationsRemaining: Math.max(0, prev.generationsRemaining - 1) }));
    } catch (err: any) {
      setError(err.message || 'Crossword generation failed.');
    } finally { setIsLoading(false); }
  };

  // Get the letter at a specific cell position based on user's answers
  const getCellLetter = (rowIdx: number, colIdx: number): string => {
    if (!crosswordResult?.placedWords) return '';
    
    for (const pw of crosswordResult.placedWords) {
      const answer = crosswordAnswers[`word-${pw.number}`] || '';
      let letterIndex = -1;
      
      if (pw.direction === 'across' && rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length) {
        letterIndex = colIdx - pw.col;
      } else if (pw.direction === 'down' && colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length) {
        letterIndex = rowIdx - pw.row;
      }
      
      if (letterIndex >= 0 && letterIndex < answer.length) {
        return answer[letterIndex];
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
      // Build new answer with the letter at the correct position
      let newAnswer = currentAnswer.split('');
      while (newAnswer.length <= letterIndex) newAnswer.push('');
      newAnswer[letterIndex] = e.key.toUpperCase();
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
        // Delete current cell
        newAnswer[letterIndex] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
      } else if (letterIndex > 0) {
        // Move back and delete
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
    if (!quiz) return;
    
    const question = quiz.questions[currentQuestion];
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
    if (!quiz) return;
    
    if (currentQuestion + 1 >= quiz.questions.length) {
      setQuizCompleted(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizCompleted(false);
  };

  const getScore = () => {
    const correct = userAnswers.filter(a => a.isCorrect).length;
    return { correct, total: userAnswers.length, percentage: Math.round((correct / userAnswers.length) * 100) };
  };

  const downloadQuiz = () => {
    if (!quiz) return;
    
    let content = `${quiz.title}\n${'='.repeat(quiz.title.length)}\n\n`;
    content += `Difficulty: ${quiz.difficulty} | Type: ${quiz.quizType}\n\n`;
    
    quiz.questions.forEach((q, idx) => {
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
    if (!quiz) return;
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
    doc.text(`Type: ${quiz.quizType} | Difficulty: ${quiz.difficulty} | Questions: ${quiz.questions.length}`, margin, yPos);
    yPos += 15;

    quiz.questions.forEach((q, idx) => {
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
    quiz.questions.forEach((q, idx) => {
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

  const exportQuizToDOCX = async () => {
    if (!quiz) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: quiz.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quiz.quizType} | Difficulty: ${quiz.difficulty} | Questions: ${quiz.questions.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    quiz.questions.forEach((q, idx) => {
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
    quiz.questions.forEach((q, idx) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
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
    saveAs(blob, `flashcards-${Date.now()}.docx`);
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
      const score = getScore();
      return (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-6 sm:p-10 text-center">
          <div className="mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 text-4xl ${
              score.percentage >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              score.percentage >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
              'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
              🏆
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">Here's how you did</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
              {score.percentage}%
            </div>
            <p className="text-gray-600 text-lg">
              {score.correct} out of {score.total} correct
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  score.percentage >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  score.percentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                  'bg-gradient-to-r from-red-500 to-rose-600'
                }`}
                style={{ width: `${score.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            {isPaidUser ? (
              <>
                <button
                  onClick={exportQuizToPDF}
                  className="px-4 py-2.5 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download PDF
                </button>
                <button
                  onClick={exportQuizToDOCX}
                  className="px-4 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download DOCX
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowExportUpgradeModal(true)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </button>
                <button
                  onClick={() => setShowExportUpgradeModal(true)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  DOCX
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </button>
              </>
            )}
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => { setQuiz(null); setIsQuizMode(false); }}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              ✨ New Quiz
            </button>
          </div>
        </div>
      );
    }

    const question = quiz.questions[currentQuestion];

    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-4 sm:p-8">
          {/* Question header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-500">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
              question.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
              'bg-green-100 text-green-700'
            }`}>
              {question.type === 'multiple_choice' ? 'Multiple Choice' :
               question.type === 'true_false' ? 'True/False' : 'Fill in the Blank'}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {question.question}
          </h3>

          {/* Answer options */}
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
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    isCorrect ? 'border-green-500 bg-green-50' :
                    isWrong ? 'border-red-500 bg-red-50' :
                    isSelected ? 'border-amber-500 bg-amber-50' :
                    'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCorrect ? 'bg-green-500 text-white' :
                    isWrong ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-amber-500 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1">{option.substring(3)}</span>
                  {isCorrect && <span className="text-green-500">✓</span>}
                  {isWrong && <span className="text-red-500">✗</span>}
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
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                        isCorrect ? 'border-green-500 bg-green-50' :
                        isWrong ? 'border-red-500 bg-red-50' :
                        isSelected ? 'border-amber-500 bg-amber-50' :
                        'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCorrect ? 'bg-green-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-amber-500 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {opt === 'true' ? '✓' : '✗'}
                      </span>
                      <span className="flex-1 capitalize font-medium">{opt}</span>
                      {isCorrect && <span className="text-green-500">✓</span>}
                      {isWrong && <span className="text-red-500">✗</span>}
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
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                        isCorrect ? 'border-green-500 bg-green-50' :
                        isWrong ? 'border-red-500 bg-red-50' :
                        isSelected ? 'border-amber-500 bg-amber-50' :
                        'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCorrect ? 'bg-green-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-amber-500 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1 font-medium">{opt.substring(3)}</span>
                      {isCorrect && <span className="text-green-500">✓</span>}
                      {isWrong && <span className="text-red-500">✗</span>}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Explanation (shown after answering) */}
          {showResult && (
            <div className="p-4 bg-blue-50 rounded-xl mb-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 flex-shrink-0 mt-0.5">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">Explanation</p>
                  <p className="text-sm text-blue-700">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              ← Previous
            </button>

            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                🎯 Submit Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                {currentQuestion + 1 >= quiz.questions.length ? (
                  <>🏆 See Results</>
                ) : (
                  <>Next Question →</>
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
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600 text-sm mt-1">
                {quiz.questions.length} questions • {quiz.difficulty} difficulty • {quiz.quizType} format
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                🧠 Start Quiz
              </button>
              {isPaidUser ? (
                <>
                  <button
                    onClick={exportQuizToPDF}
                    className="px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all font-medium text-sm flex items-center gap-1.5"
                    title="Download as PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                  </button>
                  <button
                    onClick={exportQuizToDOCX}
                    className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-medium text-sm flex items-center gap-1.5"
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
                    className="px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl transition-all font-medium text-sm flex items-center gap-1.5 cursor-pointer"
                    title="Upgrade to export as PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </button>
                  <button
                    onClick={() => setShowExportUpgradeModal(true)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl transition-all font-medium text-sm flex items-center gap-1.5 cursor-pointer"
                    title="Upgrade to export as Word"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    DOCX
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                      q.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
                      q.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {q.type.replace('_', ' ')}
                    </span>
                    <p className="text-gray-800 font-medium">{q.question}</p>
                    {q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-sm text-gray-600 pl-2">{opt}</p>
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
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} />
      
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Hero Section */}
        <div className="pt-6 sm:pt-10 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-200/50">
                👑 Premium Tool
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                🧠 AI-Powered
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              AI <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {studyToolMode === 'flashcards' ? 'Flashcard Generator' : studyToolMode === 'crossword' ? 'Crossword Generator' : 'Quiz Generator'}
              </span>
            </h1>
            
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              {studyToolMode === 'flashcards'
                ? 'Turn your notes into interactive flip-card study sets for effective memorization.'
                : studyToolMode === 'crossword'
                ? 'Transform key terms into an interactive crossword puzzle to test your vocabulary.'
                : 'Transform any article, textbook chapter, or research paper into interactive quizzes. Test your knowledge with multiple choice, true/false, and fill-in-the-blank questions.'}
            </p>

            {/* Study Tool Sub-Mode Tabs */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-2xl p-1.5">
                {([
                  { key: 'quiz' as const, label: 'Quiz', icon: '📝' },
                  { key: 'flashcards' as const, label: 'Flashcards', icon: '🃏' },
                  { key: 'crossword' as const, label: 'Crossword', icon: '🧩' },
                ]).map((tool) => (
                  <button
                    key={tool.key}
                    onClick={() => { setStudyToolMode(tool.key); setQuiz(null); setFlashcardResult(null); setCrosswordResult(null); setError(null); setIsQuizMode(false); }}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      studyToolMode === tool.key
                        ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                        : 'text-amber-600 hover:text-amber-800 hover:bg-amber-100/50'
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

        {/* Main Content */}
        <div className="pb-8 sm:pb-16 px-0 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* === QUIZ MODE === */}
            {studyToolMode === 'quiz' && (
              <>
                {quiz && isQuizMode ? (
                  renderQuizTaking()
                ) : !quiz && (
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-w-0">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 min-w-0 overflow-x-auto w-full sm:w-auto">
                          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Type:</span>
                          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                            {typeOptions.map((opt) => {
                              const locked = user != null && !isPremiumUser && opt.value !== 'mixed';
                              return (
                                <button key={opt.value} onClick={() => !locked && setQuizType(opt.value as any)} disabled={locked} title={locked ? 'Premium only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-gray-300 cursor-not-allowed' : quizType === opt.value ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Difficulty:</span>
                          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                            {difficultyOptions.map((opt) => {
                              const locked = user != null && !isPremiumUser && opt.value !== 'medium';
                              return (
                                <button key={opt.value} onClick={() => !locked && setDifficulty(opt.value as any)} disabled={locked} title={locked ? 'Premium only' : opt.description}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${locked ? 'text-gray-300 cursor-not-allowed' : difficulty === opt.value ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                                  {opt.label}{locked && <span className="ml-1 text-[9px]">🔒</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Questions:</span>
                          <select value={user != null && isFreeUser ? 10 : questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-gray-100 border-0 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-amber-200 ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={10}>10</option> : [5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 100 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<><span>✨</span><span>Generate Quiz</span><span>→</span></>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm font-semibold text-gray-700">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={handlePaste} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Paste from clipboard"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Clear text"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your quiz questions..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your article, textbook chapter, or research paper here... (minimum 100 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span className={`${wordCount < 100 ? 'text-amber-600' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>
                            {wordCount.toLocaleString()} words{wordCount >= 100 && wordCount <= quizUsage.maxWordsPerGeneration && ` / ${quizUsage.maxWordsPerGeneration.toLocaleString()} max`}
                          </span>
                          {wordCount < 100 && <span className="text-amber-600">Minimum 100 words</span>}
                          {wordCount > quizUsage.maxWordsPerGeneration && <span className="text-red-600">Exceeds {quizUsage.maxWordsPerGeneration.toLocaleString()} word limit{isFreeUser && ' (upgrade for 15,000)'}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {quiz && !isQuizMode && (
                  <div className="mt-4 mx-3 sm:mx-0">
                    <button onClick={() => setQuiz(null)} className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2">← Create New Quiz</button>
                  </div>
                )}
              </>
            )}

            {/* === FLASHCARD MODE === */}
            {studyToolMode === 'flashcards' && (
              <>
                {flashcardResult && flashcardResult.cards?.length > 0 ? (
                  <div className="mx-3 sm:mx-0">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{flashcardResult.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaidUser ? (
                          <>
                            <button onClick={exportFlashcardsToPDF} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportFlashcardsToDOCX} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        )}
                        <button onClick={() => { setFlashcardResult(null); setCurrentCard(0); setIsFlipped(false); setKnownCards(new Set()); }} className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 font-medium">New Deck</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${((currentCard + 1) / flashcardResult.cards.length) * 100}%` }}></div></div>
                      <span className="text-xs text-gray-500 font-medium">{currentCard + 1} / {flashcardResult.cards.length}</span>
                      {knownCards.size > 0 && <span className="text-xs text-green-600 font-medium">{knownCards.size} mastered</span>}
                    </div>
                    <div onClick={() => setIsFlipped(!isFlipped)} className="relative cursor-pointer select-none mx-auto max-w-2xl mb-6" style={{ perspective: '1000px' }}>
                      <div className="relative w-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        <div className="w-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Front</span>
                          <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed">{flashcardResult.cards[currentCard]?.front}</p>
                          <p className="text-xs text-amber-400 mt-6">Click to flip</p>
                        </div>
                        <div className="absolute inset-0 w-full min-h-[280px] sm:min-h-[320px] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Back</span>
                          <p className="text-lg sm:text-xl text-gray-800 leading-relaxed">{flashcardResult.cards[currentCard]?.back}</p>
                          <p className="text-xs text-blue-400 mt-6">Click to flip back</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setIsFlipped(false); }} disabled={currentCard === 0} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-all">← Previous</button>
                      <button onClick={() => { const newKnown = new Set(knownCards); if (newKnown.has(currentCard)) newKnown.delete(currentCard); else newKnown.add(currentCard); setKnownCards(newKnown); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${knownCards.has(currentCard) ? 'bg-green-500 text-white shadow-md' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
                        {knownCards.has(currentCard) ? '✓ Mastered' : 'Mark as Known'}
                      </button>
                      <button onClick={() => { setCurrentCard(Math.min(flashcardResult.cards.length - 1, currentCard + 1)); setIsFlipped(false); }} disabled={currentCard >= flashcardResult.cards.length - 1} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 disabled:opacity-30 transition-all">Next →</button>
                    </div>
                    {knownCards.size === flashcardResult.cards.length && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl text-center">
                        <span className="text-4xl mb-2 block">🎉</span>
                        <h3 className="text-xl font-bold text-green-800">All cards mastered!</h3>
                        <p className="text-green-600 text-sm mt-1">You've marked all {flashcardResult.cards.length} cards as known.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-w-0">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Cards:</span>
                          <select value={user != null && isFreeUser ? 15 : flashcardCount} onChange={(e) => setFlashcardCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-gray-100 border-0 rounded-lg text-xs font-medium text-gray-700 ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={15}>15</option> : [5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🃏 Generate Flashcards →</>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm font-semibold text-gray-700">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={handlePaste} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Creating your flashcard deck..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes, textbook content, or any material to turn into flashcards... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span className={`${wordCount < 50 ? 'text-amber-600' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-amber-600">Minimum 50 words</span>}
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
                  <div className="mx-3 sm:mx-0">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{crosswordResult.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaidUser ? (
                          <>
                            <button onClick={exportCrosswordToPDF} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportCrosswordToDOCX} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        )}
                        {!crosswordChecked && (
                          <>
                            <button
                              onClick={handleCrosswordHint}
                              className="px-4 py-2 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                              title="Reveal one letter from the selected word"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              Hint {hintsUsed > 0 && <span className="text-xs bg-purple-200 text-purple-800 rounded-full px-1.5 py-0.5 font-bold">{hintsUsed}</span>}
                            </button>
                            <button onClick={() => setCrosswordChecked(true)} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700">Check Answers</button>
                          </>
                        )}
                        <button onClick={() => { setCrosswordResult(null); setCrosswordAnswers({}); setCrosswordChecked(false); setSelectedClue(null); setSelectedCell(null); setSelectedDirection('across'); setHintsUsed(0); }} className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 font-medium">New Puzzle</button>
                      </div>
                    </div>
                    {crosswordChecked && (() => {
                      const attemptedWords = crosswordResult.placedWords.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').length > 0);
                      const total = attemptedWords.length;
                      const correct = attemptedWords.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() === pw.word).length;
                      const notAttempted = crosswordResult.placedWords.length - total;
                      return (
                        <div className={`mb-4 p-4 rounded-2xl text-center ${total === 0 ? 'bg-gray-50 border border-gray-200' : correct === total ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                          <span className="text-3xl mb-1 block">{total === 0 ? '✏️' : correct === total ? '🎉' : '📊'}</span>
                          {total === 0 ? (
                            <>
                              <p className="font-bold text-lg">No answers submitted</p>
                              <p className="text-sm text-gray-600">Type in some answers and try again!</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-lg">{correct} / {total} correct</p>
                              <p className="text-sm text-gray-600">
                                {correct === total ? 'Perfect score on attempted words!' : 'Check the highlighted answers below.'}
                                {notAttempted > 0 && ` (${notAttempted} word${notAttempted > 1 ? 's' : ''} not attempted)`}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Crossword Grid - Interactive */}
                      <div 
                        className="bg-white rounded-2xl border border-gray-200 p-4 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-amber-400"
                        tabIndex={0}
                        onKeyDown={handleCrosswordKeyDown}
                      >
                        <p className="text-xs text-gray-500 mb-3">Click a cell to type, or use the clue inputs below. Arrow keys to navigate.</p>
                        <div className="inline-block">
                          {crosswordResult.grid?.map((row: string[], rowIdx: number) => (
                            <div key={rowIdx} className="flex">
                              {row.map((cell: string, colIdx: number) => {
                                if (cell === '') return <div key={colIdx} className="w-8 h-8 sm:w-9 sm:h-9"></div>;
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
                                
                                let cellColor = 'bg-white border-gray-300 hover:border-amber-300';
                                if (isSelectedCell) cellColor = 'bg-amber-200 border-amber-500 ring-2 ring-amber-400';
                                else if (isHighlighted) cellColor = 'bg-amber-50 border-amber-400';
                                
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
                                    className={`w-8 h-8 sm:w-9 sm:h-9 border ${cellColor} flex items-center justify-center relative cursor-pointer transition-colors`}
                                  >
                                    {cellNumber && <span className="absolute top-0 left-0.5 text-[8px] font-bold text-gray-500 leading-none">{cellNumber}</span>}
                                    <span className="text-xs sm:text-sm font-bold text-gray-700">{crosswordChecked ? cell : typedLetter}</span>
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
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">{dir === 'across' ? 'Across →' : 'Down ↓'}</h4>
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
                                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedClue === pw.number ? 'border-amber-400 bg-amber-50 shadow-sm' : 
                                        isCorrectCW ? 'border-green-300 bg-green-50' : 
                                        isWrongCW ? 'border-red-300 bg-red-50' : 
                                        isNotAttempted ? 'border-gray-200 bg-gray-50 opacity-60' :
                                        'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{pw.number}</span>
                                        <p className="text-sm text-gray-700">{pw.clue} <span className="text-gray-400">({pw.word.length} letters)</span></p>
                                      </div>
                                      <input 
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
                                          'border-gray-200 bg-gray-50 text-gray-800'
                                        } ${crosswordChecked ? 'cursor-not-allowed' : ''}`} 
                                      />
                                      {isWrongCW && crosswordChecked && <p className="text-xs text-red-500 mt-1">Answer: <span className="font-mono font-bold">{pw.word}</span></p>}
                                      {isNotAttempted && <p className="text-xs text-gray-400 mt-1 italic">Not attempted</p>}
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
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-w-0">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Words:</span>
                          <select value={user != null && isFreeUser ? 10 : crosswordWordCount} onChange={(e) => setCrosswordWordCount(Number(e.target.value))} disabled={user != null && isFreeUser}
                            className={`px-2 py-1.5 bg-gray-100 border-0 rounded-lg text-xs font-medium text-gray-700 ${user != null && isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {user != null && isFreeUser ? <option value={10}>10</option> : [6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {user != null && isFreeUser && <span className="text-[9px]">🔒</span>}
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > quizUsage.maxWordsPerGeneration || quizExhausted}
                          className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 text-sm">
                          {isLoading ? (<><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generating...</span></>) : (<>🧩 Generate Crossword →</>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm font-semibold text-gray-700">Source Material</span></div>
                        <div className="flex items-center gap-1">
                          <button onClick={handlePaste} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Paste"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Clear"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      <div className="relative flex-1">
                        {isLoading ? (<div className="min-h-[350px] flex items-center justify-center"><AnalysisAnimation text="Building your crossword puzzle..." /></div>) : (
                          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword... (minimum 50 words)" className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words" />
                        )}
                      </div>
                      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span className={`${wordCount < 50 ? 'text-amber-600' : wordCount > quizUsage.maxWordsPerGeneration ? 'text-red-600' : ''}`}>{wordCount.toLocaleString()} words</span>
                          {wordCount < 50 && <span className="text-amber-600">Minimum 50 words</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 mx-3 sm:mx-0 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm">{error}</p>
                  {(quizExhausted || (error && error.includes('Upgrade'))) && user && (
                    <button
                      onClick={() => onNavigate('pricing')}
                      className="mt-2 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all inline-flex items-center gap-2"
                    >
                      👑 View Plans
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lock Overlay for Free Users who exhausted their limit */}
            {user && quizExhausted && !quiz && !flashcardResult && !crosswordResult && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white text-center">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <h3 className="text-xl font-bold mb-2">Monthly Limit Reached</h3>
                  <p className="text-amber-100 mb-4">You've used all 3 quiz generations this month. Upgrade for unlimited quizzes!</p>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-6 py-2.5 bg-white text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all inline-flex items-center gap-2"
                  >
                    👑 Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* Plan Info for free and starter users */}
            {user && !isPremiumUser && !quizExhausted && !quiz && !flashcardResult && !crosswordResult && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                      {isFreeUser ? (
                        <>
                          <p className="text-amber-800 font-medium text-sm">
                            Free plan: {quizUsage.generationsRemaining} of {quizUsage.generationLimit} quizzes remaining • Mixed type • Medium difficulty • 10 questions • Max {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words
                          </p>
                          <p className="text-amber-600 text-xs mt-0.5">Upgrade for unlimited quizzes, all options, and up to 15,000 words</p>
                        </>
                      ) : (
                        <>
                          <p className="text-amber-800 font-medium text-sm">Starter plan: Mixed type + Medium difficulty only</p>
                          <p className="text-amber-600 text-xs mt-0.5">Upgrade to Premium for all quiz types, difficulties, and our premium AI model</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => onNavigate('pricing')} className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-all">
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
              Why Use Our <span className="text-amber-600">Study Tools</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: '📝',
                  title: 'Interactive Quizzes',
                  description: 'Multiple choice, true/false, and fill-in-the-blank questions to test your understanding.'
                },
                {
                  icon: '🃏',
                  title: 'Flashcard Decks',
                  description: 'Flip-card study sets with mastery tracking to memorize key concepts efficiently.'
                },
                {
                  icon: '🧩',
                  title: 'Crossword Puzzles',
                  description: 'Fun vocabulary-building puzzles generated from your study material.'
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Export Upgrade Modal */}
      {showExportUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Export Feature</h3>
              <p className="text-gray-600">
                Export your quizzes, flashcards, and crosswords to PDF or Word documents with a paid plan.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-amber-900 mb-3">Paid Plan Benefits:</h4>
              <ul className="space-y-2 text-sm text-amber-800">
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
                  Permanent storage (no 7-day limit)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited study tool generations
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
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowExportUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
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
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <button type="button" onClick={() => setShowSignupPrompt(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{studyToolMode === 'flashcards' ? '🃏' : studyToolMode === 'crossword' ? '🧩' : '📝'}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {studyToolMode === 'flashcards' ? 'Flashcards Generated' : studyToolMode === 'crossword' ? 'Crossword Generated' : 'Quiz Generated'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-5">
              {studyToolMode === 'flashcards' ? 'We\'ve created flip cards from your content' : studyToolMode === 'crossword' ? 'We\'ve created a puzzle from your content' : 'We\'ve created questions from your content'}
            </p>
            <div className="space-y-3 mb-5">
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">
                    {studyToolMode === 'flashcards' ? 'Interactive flip cards' : studyToolMode === 'crossword' ? 'Interactive crossword puzzle' : 'Multiple choice & true/false'}
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {studyToolMode === 'flashcards' ? 'Perfect for memorization and quick review' : studyToolMode === 'crossword' ? 'Fun way to learn key vocabulary' : 'Mix question types for better retention'}
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">3 free generations per month</p>
                  <p className="text-amber-600 text-xs mt-0.5">Sign up to unlock Study Tools — upgrade for unlimited</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 mb-6">
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                <span className="font-semibold text-gray-800">
                  {studyToolMode === 'flashcards' ? 'Turn any notes into flashcards.' : studyToolMode === 'crossword' ? 'Turn key terms into puzzles.' : 'Turn any notes into a quiz.'}
                </span> Great for exam prep and study sessions.
              </p>
            </div>
            <button
              onClick={() => { setShowSignupPrompt(false); onNavigate('signup'); }}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center"
            >
              Sign up to unlock Study Tools — it&apos;s free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default QuizGeneratorPage;
