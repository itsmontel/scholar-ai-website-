import { useState, useEffect, useRef } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import AnalysisAnimation from '../../common/AnalysisAnimation';
import { trackAction } from '../../../data/achievements';
import { getResetsInText } from '../../../utils/usageReset';

interface InteractiveLessonPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface LessonSlide {
  id: number;
  type: 'intro' | 'concept' | 'example' | 'keypoint' | 'funfact' | 'summary';
  title: string;
  content: string;
  emoji?: string;
  bulletPoints?: string[];
  highlightedTerm?: string;
}

interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface LessonResult {
  title: string;
  slides: LessonSlide[];
  totalSlides: number;
  estimatedReadTime: number;
  style?: string;
  quizBank?: QuizQuestion[];
  quizDisplayCount?: number;
}

interface UsageData {
  wordsUsed: number;
  wordLimit: number;
  wordsRemaining: number;
  generationsUsed: number;
  generationLimit: number;
  generationsRemaining: number;
  plan: string;
}

const InteractiveLessonPage = ({ onNavigate, user, onLogout }: InteractiveLessonPageProps) => {
  const [inputText, setInputText] = useState('');
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFakeAnimation, setShowFakeAnimation] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [revealedItems, setRevealedItems] = useState<Set<string>>(new Set());
  const [lessonStyle, setLessonStyle] = useState<'visual' | 'stepByStep' | 'story'>('visual');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const isFreeUser = !user || (userPlan !== 'starter' && userPlan !== 'premium');
  const isPremiumUser = userPlan === 'premium';
  const maxWords = isFreeUser ? 5000 : 10000;
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    document.title = 'Interactive Lesson Generator – Turn Text into Fun Lessons | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform boring text into engaging, interactive lessons. Break down complex topics into digestible slides with key concepts, examples, and fun facts. Learn before you quiz!');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  // Scroll to top when slide changes (Next/Previous/dots)
  useEffect(() => {
    if (lessonResult) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSlide, lessonResult]);

  // Load saved lesson from localStorage (when coming from quiz-history)
  useEffect(() => {
    const savedLesson = localStorage.getItem('savedLesson');
    if (savedLesson) {
      try {
        const parsed = JSON.parse(savedLesson);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          const style = (parsed.difficulty === 'visual' || parsed.difficulty === 'stepByStep' || parsed.difficulty === 'story')
            ? parsed.difficulty
            : 'visual';
          setLessonResult({
            title: parsed.title || 'Saved Lesson',
            slides: parsed.questions,
            totalSlides: parsed.question_count || parsed.questions.length,
            estimatedReadTime: parsed.estimated_read_time || Math.ceil((parsed.question_count || parsed.questions.length) * 1.5),
            style,
            quizBank: parsed.quiz_bank || [],
            quizDisplayCount: parsed.quiz_display_count || 6
          });
          setLessonStyle(style);
          setSavedLessonId(parsed.id);
        }
        localStorage.removeItem('savedLesson');
      } catch (err) {
        console.error('Failed to load saved lesson:', err);
        localStorage.removeItem('savedLesson');
      }
    }
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/lesson-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsage(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const saveLesson = async (lesson: LessonResult) => {
    if (!user || savedLessonId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/save-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson: { ...lesson, style: lessonStyle },
          sourceText: inputText
        })
      });

      const data = await response.json();
      if (data.success && data.data?.id) {
        setSavedLessonId(data.data.id);
      }
    } catch (err) {
      console.error('Failed to save lesson:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateLesson = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowSignupPrompt(true);
      }, 2500);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentSlide(0);
    setRevealedItems(new Set());
    setSavedLessonId(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText,
          style: lessonStyle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate lesson');
      }

      const lesson = data.data;
      if (lesson.style && ['visual', 'stepByStep', 'story'].includes(lesson.style)) {
        setLessonStyle(lesson.style);
      }
      setLessonResult(lesson);
      trackAction('lessons_count');
      
      // Auto-save the lesson
      saveLesson(lesson);
      
      // Refresh usage
      fetchUsage();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
    setLessonResult(null);
    setError(null);
    setCurrentSlide(0);
    setRevealedItems(new Set());
    // Reset quiz state
    setShowQuiz(false);
    setQuizQuestions([]);
    setCurrentQuizQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizComplete(false);
    setAnsweredQuestions(new Set());
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
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) { onNavigate('signup'); return; }
    setIsParsing(true);
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
      setIsParsing(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const nextSlide = () => {
    if (lessonResult && currentSlide < lessonResult.slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Quiz functions
  const startQuiz = () => {
    if (!lessonResult?.quizBank || lessonResult.quizBank.length === 0) {
      onNavigate('quiz-generator');
      return;
    }
    
    const displayCount = lessonResult.quizDisplayCount || 6;
    const bank = [...lessonResult.quizBank];
    
    // Shuffle and pick random questions
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }
    
    const selected = bank.slice(0, Math.min(displayCount, bank.length));
    setQuizQuestions(selected);
    setCurrentQuizQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizComplete(false);
    setAnsweredQuestions(new Set());
    setShowQuiz(true);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !quizQuestions[currentQuizQuestion]) return;
    
    const isCorrect = selectedAnswer === quizQuestions[currentQuizQuestion].correctAnswer;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    setAnsweredQuestions(prev => new Set(prev).add(currentQuizQuestion));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuizQuestion < quizQuestions.length - 1) {
      setCurrentQuizQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const retakeQuiz = () => {
    startQuiz();
  };

  const backToLesson = () => {
    setShowQuiz(false);
    setCurrentSlide(0);
  };

  const getSlideIcon = (type: LessonSlide['type']) => {
    switch (type) {
      case 'intro': return '📖';
      case 'concept': return '💡';
      case 'example': return '🔍';
      case 'keypoint': return '⭐';
      case 'funfact': return '🎯';
      case 'summary': return '✅';
      default: return '📝';
    }
  };

  const getSlideColor = (type: LessonSlide['type']) => {
    switch (type) {
      case 'intro': return 'from-violet-500 to-purple-600';
      case 'concept': return 'from-blue-500 to-cyan-600';
      case 'example': return 'from-amber-500 to-orange-600';
      case 'keypoint': return 'from-emerald-500 to-teal-600';
      case 'funfact': return 'from-pink-500 to-rose-600';
      case 'summary': return 'from-indigo-500 to-violet-600';
      default: return 'from-stone-500 to-stone-600';
    }
  };

  const getSlideBackground = (type: LessonSlide['type']) => {
    switch (type) {
      case 'intro': return 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-700/50';
      case 'concept': return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700/50';
      case 'example': return 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700/50';
      case 'keypoint': return 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700/50';
      case 'funfact': return 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700/50';
      case 'summary': return 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-200 dark:border-indigo-700/50';
      default: return 'from-stone-50 to-stone-100 dark:from-stone-800/50 dark:to-stone-700/50 border-stone-200 dark:border-stone-600';
    }
  };

  const styleOptions = [
    { value: 'visual', label: 'Visual Cards', description: 'Colorful cards with icons', emoji: '🎨' },
    { value: 'stepByStep', label: 'Step-by-Step', description: 'Numbered learning path', emoji: '📋' },
    { value: 'story', label: 'Story Mode', description: 'Narrative-driven lessons', emoji: '📚' }
  ];

  if (showFakeAnimation) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="interactive-lesson" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AnalysisAnimation message="Creating your interactive lesson..." />
            <p className="text-stone-500 dark:text-stone-400 mt-4">Please wait...</p>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (showSignupPrompt) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="interactive-lesson" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-600 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-3xl">🎓</span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-2">Sign Up to Continue</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6">Create a free account to turn your notes into interactive lessons.</p>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-violet-500/25"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-3 px-4 bg-stone-100 text-stone-700 font-semibold rounded-full hover:bg-stone-200 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="text-stone-500 hover:text-stone-700 text-sm"
              >
                ← Back to Lesson Generator
              </button>
            </div>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-white dark:bg-stone-900 dark:from-stone-900 dark:to-stone-800 overflow-x-hidden">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="interactive-lesson" />
      
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Hero Section - only when no lesson loaded */}
        {!lessonResult && !showQuiz && (
          <div className="pt-6 sm:pt-10 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <ScholarMascot size={100} animated={false} pose="default" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-violet-500/30">
                      🎓 Learning Tool
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                      ✨ AI-Powered
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl text-stone-800 dark:text-stone-100 mb-3 sm:mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                    Interactive <span className="text-violet-600 dark:text-violet-400 italic">Lesson Generator</span>
                  </h1>
                  <p className="text-sm sm:text-lg text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
                    Transform boring text into engaging, slide-based lessons. 
                    Perfect for <span className="font-semibold text-violet-600 dark:text-violet-400">learning new material</span> before taking quizzes!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQuiz && lessonResult ? (
          /* Quiz Section */
          <div className="pt-6 sm:pt-10 pb-8 sm:pb-16 px-3 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {!quizComplete ? (
                <>
                  {/* Quiz Header */}
                  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          🎯 Lesson Quiz
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
                        Test Your Knowledge
                      </h2>
                      <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 truncate max-w-[200px] sm:max-w-none" title={lessonResult.title}>
                        Based on: {lessonResult.title}
                      </p>
                    </div>
                    <button
                      onClick={backToLesson}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 font-medium text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>←</span>
                      <span>Back to Lesson</span>
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Question Progress</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {currentQuizQuestion + 1} / {quizQuestions.length}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuizQuestion + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-stone-400">Score: {quizScore}/{answeredQuestions.size}</span>
                      <span className="text-xs text-stone-400">{Math.round((quizScore / Math.max(answeredQuestions.size, 1)) * 100)}% correct</span>
                    </div>
                  </div>

                  {/* Question Card */}
                  {quizQuestions[currentQuizQuestion] && (
                    <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-600 shadow-xl p-4 sm:p-8 min-w-0">
                      <div className="flex items-start gap-3 sm:gap-4 mb-6 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg text-xl font-black text-white flex-shrink-0">
                          {currentQuizQuestion + 1}
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-stone-800 dark:text-stone-100 leading-relaxed min-w-0 break-words">
                          {quizQuestions[currentQuizQuestion].question}
                        </p>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-3 mb-6">
                        {quizQuestions[currentQuizQuestion].options.map((option, idx) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect = option === quizQuestions[currentQuizQuestion].correctAnswer;
                          const showResult = showExplanation;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerSelect(option)}
                              disabled={showExplanation}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                showResult
                                  ? isCorrect
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : isSelected
                                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                      : 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50'
                                  : isSelected
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                                    : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                  showResult
                                    ? isCorrect
                                      ? 'bg-emerald-500 text-white'
                                      : isSelected
                                        ? 'bg-red-500 text-white'
                                        : 'bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                                    : isSelected
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                                }`}>
                                  {showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + idx)}
                                </div>
                                <span className={`text-base min-w-0 break-words ${
                                  showResult && isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-medium' :
                                  showResult && isSelected && !isCorrect ? 'text-red-700 dark:text-red-300' :
                                  'text-stone-700 dark:text-stone-300'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {showExplanation && quizQuestions[currentQuizQuestion].explanation && (
                        <div className={`p-4 rounded-xl mb-6 ${
                          selectedAnswer === quizQuestions[currentQuizQuestion].correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50'
                            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{selectedAnswer === quizQuestions[currentQuizQuestion].correctAnswer ? '✅' : '💡'}</span>
                            <div>
                              <p className={`font-semibold mb-1 ${
                                selectedAnswer === quizQuestions[currentQuizQuestion].correctAnswer
                                  ? 'text-emerald-800 dark:text-emerald-200'
                                  : 'text-amber-800 dark:text-amber-200'
                              }`}>
                                {selectedAnswer === quizQuestions[currentQuizQuestion].correctAnswer ? 'Correct!' : 'Not quite right'}
                              </p>
                              <p className="text-stone-600 dark:text-stone-400 text-sm">
                                {quizQuestions[currentQuizQuestion].explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap justify-end gap-3">
                        {!showExplanation ? (
                          <button
                            onClick={submitAnswer}
                            disabled={!selectedAnswer}
                            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                              selectedAnswer
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            <span>Check Answer</span>
                          </button>
                        ) : (
                          <button
                            onClick={nextQuestion}
                            className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                          >
                            <span>{currentQuizQuestion < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Quiz Complete */
                <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-600 shadow-xl p-6 sm:p-12 text-center min-w-0">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center text-4xl ${
                    quizScore >= quizQuestions.length * 0.8
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                      : quizScore >= quizQuestions.length * 0.5
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'bg-gradient-to-br from-rose-400 to-red-500'
                  } shadow-lg`}>
                    {quizScore >= quizQuestions.length * 0.8 ? '🏆' : quizScore >= quizQuestions.length * 0.5 ? '👍' : '📚'}
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                    {quizScore >= quizQuestions.length * 0.8
                      ? 'Excellent Work!'
                      : quizScore >= quizQuestions.length * 0.5
                        ? 'Good Effort!'
                        : 'Keep Learning!'}
                  </h2>
                  
                  <p className="text-stone-500 dark:text-stone-400 mb-6">
                    You scored <span className="font-bold text-stone-700 dark:text-stone-200">{quizScore}</span> out of <span className="font-bold text-stone-700 dark:text-stone-200">{quizQuestions.length}</span> ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                  </p>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                    <button
                      onClick={retakeQuiz}
                      className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>🔄</span>
                      <span>Try Different Questions</span>
                    </button>
                    <button
                      onClick={backToLesson}
                      className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>📖</span>
                      <span>Review Lesson</span>
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>✨</span>
                      <span>New Lesson</span>
                    </button>
                  </div>
                  
                  {quizScore < quizQuestions.length * 0.8 && (
                    <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
                      💡 Tip: Review the lesson again and try different questions. Each attempt gives you a fresh set!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : !lessonResult ? (
          /* Input Section */
          <div className="pb-8 sm:pb-16 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 dark:shadow-none border border-stone-200 dark:border-stone-600 overflow-hidden">
                {/* Toolbar */}
                <div className="border-b border-stone-200 dark:border-stone-600 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {styleOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setLessonStyle(opt.value as any)}
                            title={opt.description}
                            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                              lessonStyle === opt.value 
                                ? 'bg-violet-600 text-white shadow-sm' 
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                            }`}
                          >
                            <span>{opt.emoji}</span>
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateLesson}
                      disabled={isLoading || !inputText.trim() || wordCount < 50 || wordCount > maxWords}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm flex-shrink-0 ${
                        !isLoading && inputText.trim() && wordCount >= 50 && wordCount <= maxWords
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30 cursor-pointer'
                          : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating Lesson...</span>
                        </>
                      ) : (
                        <>
                          <span>🎓</span>
                          <span>Create Lesson</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600">
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">Paste Your Study Material</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-violet-200 dark:border-violet-700"
                        title="Upload PDF, Word, or TXT"
                      >
                        {isParsing ? (
                          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                        {isParsing ? 'Parsing...' : 'Upload'}
                      </button>
                      <button
                        onClick={handlePaste}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                        title="Paste from clipboard"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Paste
                      </button>
                      {inputText && (
                        <button
                          onClick={handleClear}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Clear text"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your textbook chapter, article, lecture notes, or any study material here... (minimum 50 words)

The AI will transform it into an engaging, interactive lesson with:
• Key concepts broken into digestible slides
• Visual highlights and fun facts
• Step-by-step learning progression
• Easy-to-remember summaries"
                      className="w-full min-h-[300px] sm:min-h-[400px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-none text-sm sm:text-base leading-relaxed bg-transparent"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                    <span className={`text-xs font-medium ${wordCount < 50 ? 'text-amber-600' : wordCount > maxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                      {wordCount.toLocaleString()} words / {maxWords.toLocaleString()} max
                      {wordCount < 50 && ' (min 50)'}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 truncate">
                      Tip: More detailed content = better lessons!
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                    {isFreeUser && user && (
                      <>
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{getResetsInText()}</p>
                        <button
                          onClick={() => onNavigate('pricing')}
                          className="mt-2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all inline-flex items-center gap-2"
                        >
                          Upgrade Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Info for logged-in users */}
              {user && usage && (
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎓</span>
                      <div>
                        <p className="text-violet-800 dark:text-violet-200 font-medium text-sm">
                          {isFreeUser 
                            ? `Free plan: ${usage.generationsRemaining}/${usage.generationLimit} lesson${usage.generationLimit === 1 ? '' : 's'} remaining this month`
                            : `${userPlan === 'premium' ? 'Premium' : 'Starter'}: ${usage.generationsRemaining.toLocaleString()}/${usage.generationLimit} lessons remaining`
                          }
                        </p>
                        <p className="text-violet-600 dark:text-violet-400 text-xs mt-0.5">
                          {isFreeUser 
                            ? `Lessons saved for 30 days • ${getResetsInText()}`
                            : 'Lessons saved permanently'
                          }
                        </p>
                      </div>
                    </div>
                    {isFreeUser && (
                      <button
                        onClick={() => onNavigate('pricing')}
                        className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="mt-6">
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-700/50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-xl sm:text-2xl flex-shrink-0">
                      💡
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-violet-800 dark:text-violet-200 font-semibold mb-1">Learn First, Then Test</h3>
                      <p className="text-violet-600 dark:text-violet-400 text-sm leading-relaxed">
                        This tool is perfect for when you need to <span className="font-semibold">understand material before taking quizzes</span>.
                        It breaks down complex text into bite-sized, memorable slides with key concepts, examples, and fun facts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Lesson Display Section */
          <div className="pt-6 sm:pt-10 pb-8 sm:pb-16 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Lesson Header */}
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 truncate" title={lessonResult.title}>
                      {lessonResult.title}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      lessonStyle === 'stepByStep' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      lessonStyle === 'story' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    }`}>
                      {lessonStyle === 'stepByStep' ? '📋 Step-by-Step' : lessonStyle === 'story' ? '📚 Story Mode' : '🎨 Visual Cards'}
                    </span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-sm">
                    {lessonResult.totalSlides} {lessonStyle === 'stepByStep' ? 'steps' : 'slides'} • ~{lessonResult.estimatedReadTime} min read
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {lessonResult.quizBank && lessonResult.quizBank.length > 0 && (
                    <button
                      onClick={startQuiz}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
                    >
                      <span>🎯</span>
                      <span>Take Quiz</span>
                    </button>
                  )}
                  <button
                    onClick={handleClear}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 font-medium text-sm transition-colors flex items-center gap-2 shrink-0"
                  >
                    <span>←</span>
                    <span>New Lesson</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {lessonStyle === 'stepByStep' ? 'Your progress' : 'Progress'}
                  </span>
                  <span className={`text-xs font-bold ${
                    lessonStyle === 'stepByStep' ? 'text-blue-600 dark:text-blue-400' :
                    lessonStyle === 'story' ? 'text-amber-600 dark:text-amber-400' :
                    'text-violet-600 dark:text-violet-400'
                  }`}>
                    {lessonStyle === 'stepByStep' ? `Step ${currentSlide + 1} of ${lessonResult.slides.length}` : `${currentSlide + 1} / ${lessonResult.slides.length}`}
                  </span>
                </div>
                <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      lessonStyle === 'stepByStep' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                      lessonStyle === 'story' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                      'bg-gradient-to-r from-violet-500 to-purple-600'
                    }`}
                    style={{ width: `${((currentSlide + 1) / lessonResult.slides.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Slide Dots Navigation */}
              <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                {lessonResult.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`transition-all ${
                      lessonStyle === 'stepByStep' 
                        ? `min-w-[28px] h-7 px-1.5 rounded-lg flex items-center justify-center text-xs font-bold ${
                            index === currentSlide 
                              ? 'bg-blue-500 text-white shadow-lg' 
                              : index < currentSlide
                                ? 'bg-blue-300 dark:bg-blue-600 text-blue-800 dark:text-blue-100'
                                : 'bg-stone-200 dark:bg-stone-600 text-stone-500 hover:bg-stone-300 dark:hover:bg-stone-500'
                          }`
                        : `w-3 h-3 rounded-full ${
                            index === currentSlide 
                              ? `bg-gradient-to-r ${getSlideColor(slide.type)} scale-125 shadow-lg` 
                              : index < currentSlide
                                ? lessonStyle === 'story' ? 'bg-amber-300 dark:bg-amber-600' : 'bg-violet-300 dark:bg-violet-600'
                                : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500'
                          }`
                    }`}
                    title={`Go to ${lessonStyle === 'stepByStep' ? 'step' : 'slide'} ${index + 1}: ${slide.title}`}
                  >
                    {lessonStyle === 'stepByStep' ? index + 1 : null}
                  </button>
                ))}
              </div>

              {/* Current Slide */}
              {lessonResult.slides[currentSlide] && (
                <div className={`rounded-3xl p-4 sm:p-8 shadow-xl transition-all duration-300 border min-w-0 overflow-hidden ${
                  lessonStyle === 'stepByStep' 
                    ? 'bg-white dark:bg-stone-800 border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                    : lessonStyle === 'story'
                      ? 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                      : `bg-gradient-to-br ${getSlideBackground(lessonResult.slides[currentSlide].type)} border`
                }`}>
                  {/* Slide Header */}
                  <div className="flex items-start gap-4 mb-6">
                    {lessonStyle === 'stepByStep' ? (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg text-xl font-black text-white flex-shrink-0">
                        {currentSlide + 1}
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getSlideColor(lessonResult.slides[currentSlide].type)} flex items-center justify-center shadow-lg text-2xl flex-shrink-0`}>
                        {lessonResult.slides[currentSlide].emoji || getSlideIcon(lessonResult.slides[currentSlide].type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lessonStyle === 'stepByStep' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                            : lessonStyle === 'story'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              : `bg-gradient-to-r ${getSlideColor(lessonResult.slides[currentSlide].type)} text-white`
                        }`}>
                          {lessonStyle === 'stepByStep' ? `Step ${currentSlide + 1}` : lessonResult.slides[currentSlide].type}
                        </span>
                        {lessonStyle !== 'stepByStep' && (
                          <span className="text-xs text-stone-400 dark:text-stone-500">
                            {lessonStyle === 'story' ? 'Chapter' : 'Slide'} {currentSlide + 1}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 ${
                        lessonStyle === 'story' ? 'font-serif italic' : ''
                      }`}>
                        {lessonResult.slides[currentSlide].title}
                      </h3>
                    </div>
                  </div>

                  {/* Slide Content */}
                  <div className={`prose prose-stone dark:prose-invert max-w-none mb-6 min-w-0 ${
                    lessonStyle === 'story' ? 'prose-lg' : ''
                  }`}>
                    <p className={`text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap break-words ${
                      lessonStyle === 'story' 
                        ? 'text-base sm:text-lg md:text-xl' 
                        : 'text-base sm:text-lg'
                    }`}>
                      {lessonResult.slides[currentSlide].content}
                    </p>
                  </div>

                  {/* Highlighted Term */}
                  {lessonResult.slides[currentSlide].highlightedTerm && (
                    <div className="mb-6 p-4 bg-white/50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-600">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔑</span>
                        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Key Term</span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200 font-semibold">
                        {lessonResult.slides[currentSlide].highlightedTerm}
                      </p>
                    </div>
                  )}

                  {/* Bullet Points */}
                  {lessonResult.slides[currentSlide].bulletPoints && lessonResult.slides[currentSlide].bulletPoints!.length > 0 && (
                    <div className="space-y-3">
                      {lessonResult.slides[currentSlide].bulletPoints!.map((point, idx) => {
                        const itemId = `${currentSlide}-${idx}`;
                        const isRevealed = revealedItems.has(itemId);
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleReveal(itemId)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              isRevealed 
                                ? 'bg-white dark:bg-stone-800 border-violet-300 dark:border-violet-600 shadow-md' 
                                : 'bg-stone-100/50 dark:bg-stone-700/50 border-stone-200 dark:border-stone-600 hover:bg-white dark:hover:bg-stone-700 hover:border-violet-200 dark:hover:border-violet-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isRevealed 
                                  ? 'bg-violet-500 text-white' 
                                  : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
                              }`}>
                                {isRevealed ? '✓' : idx + 1}
                              </div>
                              <div className="flex-1">
                                {isRevealed ? (
                                  <p className="text-stone-700 dark:text-stone-300">{point}</p>
                                ) : (
                                  <p className="text-stone-400 dark:text-stone-500 italic">Click to reveal...</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shrink-0 ${
                    currentSlide === 0
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                      : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 shadow-sm'
                  }`}
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
                
                {currentSlide === lessonResult.slides.length - 1 ? (
                  lessonResult.quizBank && lessonResult.quizBank.length > 0 ? (
                    <button
                      onClick={startQuiz}
                      className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0"
                    >
                      <span>Take the Quiz!</span>
                      <span>🎯</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate('quiz-generator')}
                      className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 shrink-0"
                    >
                      <span>Create a Quiz</span>
                      <span>🎯</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={nextSlide}
                    className="px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 shrink-0"
                  >
                    <span>Next</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!lessonResult && (
          <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-700">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-stone-800 dark:text-stone-100 mb-8 sm:mb-12">
                Why Use <span className="text-violet-600 dark:text-violet-400 italic">Interactive Lessons</span>?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {[
                  {
                    icon: '🧩',
                    title: 'Bite-Sized Learning',
                    description: 'Complex topics broken into digestible slides. No more overwhelming walls of text!'
                  },
                  {
                    icon: '🎨',
                    title: 'Visual & Engaging',
                    description: 'Colorful cards, icons, and highlights make learning actually enjoyable.'
                  },
                  {
                    icon: '🧠',
                    title: 'Better Retention',
                    description: 'Interactive reveals and structured progression help information stick in your memory.'
                  }
                ].map((feature, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-violet-200/70 dark:border-violet-700/40 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 text-2xl">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">{feature.title}</h3>
                    <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* How It Works */}
              <div className="mt-12 sm:mt-16">
                <h3 className="text-xl sm:text-2xl font-bold text-center text-stone-800 dark:text-stone-100 mb-8">
                  How It Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { step: '1', title: 'Paste Text', desc: 'Copy your study material', emoji: '📋' },
                    { step: '2', title: 'AI Analyzes', desc: 'Extracts key concepts', emoji: '🤖' },
                    { step: '3', title: 'Learn Slides', desc: 'Go through interactive lesson', emoji: '🎓' },
                    { step: '4', title: 'Take Quiz', desc: 'Test your knowledge!', emoji: '✅' }
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center text-3xl border border-violet-200 dark:border-violet-700/50">
                        {item.emoji}
                      </div>
                      <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">STEP {item.step}</div>
                      <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{item.title}</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default InteractiveLessonPage;
