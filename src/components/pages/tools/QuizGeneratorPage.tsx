import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import AnalysisAnimation from '../../common/AnalysisAnimation';

interface QuizGeneratorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
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

const QuizGeneratorPage = ({ onNavigate, user }: QuizGeneratorPageProps) => {
  const [inputText, setInputText] = useState('');
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

  const isPremiumUser = user && (user.subscription_plan === 'premium' || user.plan === 'premium');
  const userPlan = user?.subscription_plan || user?.plan || 'free';
  const isPaidUser = user && (userPlan === 'starter' || userPlan === 'premium');
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    document.title = 'AI Quiz Generator – Create Quizzes from Documents | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Turn any article, textbook, or research paper into interactive quizzes. Multiple choice, true/false, and fill-in-the-blank questions. Premium AI tool.');
    }
  }, []);

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      setShowFakeAnimation(true);
      setTimeout(() => {
        setShowFakeAnimation(false);
        setShowSignupPrompt(true);
      }, 2500);
      return;
    }

    if (!isPaidUser) {
      setError('Quiz Generator requires a paid subscription. Upgrade to Starter or Premium to access.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/analysis/generate-quiz', {
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
      setIsQuizMode(true);  // Go directly to quiz mode
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer('');
      setShowResult(false);
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
    setFillBlankAnswer('');
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

  if (showFakeAnimation) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header onNavigate={onNavigate} user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AnalysisAnimation message="Preparing your quiz..." />
            <p className="text-gray-500 mt-4">Please wait...</p>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (showSignupPrompt) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header onNavigate={onNavigate} user={user} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up to Continue</h2>
            <p className="text-gray-600 mb-6">Create a free account to access the AI Quiz Generator and other premium tools.</p>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to Quiz Generator
              </button>
            </div>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

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

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
            <div className="flex gap-2">
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                🧠 Start Quiz
              </button>
              <button
                onClick={downloadQuiz}
                className="p-2.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                title="Download quiz"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">
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
              AI <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Quiz Generator</span>
            </h1>
            
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Transform any article, textbook chapter, or research paper into interactive quizzes. 
              Test your knowledge with multiple choice, true/false, and fill-in-the-blank questions.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="pb-8 sm:pb-16 px-0 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {quiz && isQuizMode ? (
              renderQuizTaking()
            ) : !quiz && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-w-0">
                {/* Toolbar */}
                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Quiz Type Selector */}
                    <div className="flex items-center gap-2 min-w-0 overflow-x-auto w-full sm:w-auto">
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Type:</span>
                      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                        {typeOptions.map((opt) => {
                          const locked = !isPremiumUser && opt.value !== 'mixed';
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !locked && setQuizType(opt.value as any)}
                              disabled={locked}
                              title={locked ? 'Premium only' : opt.description}
                              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                quizType === opt.value
                                  ? 'bg-white text-amber-700 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {opt.label}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Difficulty Selector */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Difficulty:</span>
                      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                        {difficultyOptions.map((opt) => {
                          const locked = !isPremiumUser && opt.value !== 'medium';
                          return (
                            <button
                              key={opt.value}
                              onClick={() => !locked && setDifficulty(opt.value as any)}
                              disabled={locked}
                              title={locked ? 'Premium only' : opt.description}
                              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                difficulty === opt.value
                                  ? 'bg-white text-amber-700 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {opt.label}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Question Count */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Questions:</span>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="px-2 py-1.5 bg-gray-100 border-0 rounded-lg text-xs font-medium text-gray-700 focus:ring-2 focus:ring-amber-200"
                      >
                        {[5, 10, 15, 20, 25].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isLoading || !inputText.trim() || wordCount < 100}
                      className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Generate Quiz</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex flex-col">
                  <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-semibold text-gray-700">Source Material</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePaste}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Paste from clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClear}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Clear text"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    {isLoading ? (
                      <div className="min-h-[350px] flex items-center justify-center">
                        <AnalysisAnimation message="Creating your quiz questions..." />
                      </div>
                    ) : (
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your article, textbook chapter, or research paper here... (minimum 100 words)"
                        className="w-full h-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-sm sm:text-base leading-relaxed break-words"
                      />
                    )}
                  </div>
                  <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                      <span className={wordCount < 100 ? 'text-amber-600' : ''}>{wordCount.toLocaleString()} words</span>
                      {wordCount < 100 && <span className="text-amber-600">Minimum 100 words</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Input Button */}
            {quiz && !isQuizMode && (
              <div className="mt-4 mx-3 sm:mx-0">
                <button
                  onClick={() => setQuiz(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  ← Create New Quiz
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 mx-3 sm:mx-0 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 text-sm">{error}</p>
                  {!isPaidUser && user && (
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

            {/* Lock Overlay for Free Users */}
            {user && !isPaidUser && !quiz && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white text-center">
                  <span className="text-4xl mb-3 block">🔒</span>
                  <h3 className="text-xl font-bold mb-2">Paid Feature</h3>
                  <p className="text-amber-100 mb-4">Upgrade to Starter or Premium to unlock the AI Quiz Generator</p>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="px-6 py-2.5 bg-white text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all inline-flex items-center gap-2"
                  >
                    👑 View Plans
                  </button>
                </div>
              </div>
            )}

            {/* Plan Info for starter users */}
            {user && isPaidUser && !isPremiumUser && !quiz && (
              <div className="mt-6 mx-3 sm:mx-0">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                      <p className="text-amber-800 font-medium text-sm">Starter plan: Mixed type + Medium difficulty only</p>
                      <p className="text-amber-600 text-xs mt-0.5">Upgrade to Premium for all quiz types, difficulties, and GPT-4.1 Mini</p>
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
              Why Use Our <span className="text-amber-600">Quiz Generator</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: '🧠',
                  title: 'Active Learning',
                  description: 'Transform passive reading into active recall. Test yourself and strengthen memory retention.'
                },
                {
                  icon: '🎯',
                  title: 'Multiple Formats',
                  description: 'Multiple choice, true/false, and fill-in-the-blank questions keep studying engaging.'
                },
                {
                  icon: '🏆',
                  title: 'Track Progress',
                  description: 'Get instant feedback on your answers and understand where you need to focus.'
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

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default QuizGeneratorPage;
