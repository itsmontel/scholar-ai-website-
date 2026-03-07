import { useState, useEffect, useCallback } from 'react';
import ScholarMascot from './ScholarMascot';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceTitle?: string;
}

interface FlashCard {
  id: number;
  front: string;
  back: string;
  sourceTitle?: string;
}

interface StudyTool {
  id: string;
  title: string;
  quiz_type: string;
  questions: QuizQuestion[] | FlashCard[] | any;
}

type ReviewItem = 
  | { type: 'quiz'; data: QuizQuestion }
  | { type: 'flashcard'; data: FlashCard };

interface QuickReviewModalProps {
  userName?: string;
  userId?: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Bank of varied welcome messages — randomly shown so it doesn't get repetitive
const WELCOME_MESSAGES: Array<{
  greeting: string;
  subtitle: string;
  detail: string;
}> = [
  {
    greeting: 'Welcome back',
    subtitle: 'Ready for a quick review session?',
    detail: "We've prepared {count} questions from your study materials to help keep your knowledge fresh.",
  },
  {
    greeting: "Hey there",
    subtitle: "Time for a quick brain boost?",
    detail: "We've pulled {count} questions from your study materials to keep you sharp.",
  },
  {
    greeting: "Let's go",
    subtitle: "Your brain's ready for a quick workout.",
    detail: "{count} questions from your materials are waiting — let's fire those neurons!",
  },
  {
    greeting: "Quick review time",
    subtitle: "Short session, big impact.",
    detail: "We've got {count} questions ready from your study materials.",
  },
  {
    greeting: "You've got this",
    subtitle: "A quick review will sharpen your skills.",
    detail: "{count} questions from your materials are lined up and ready.",
  },
  {
    greeting: "Knowledge check incoming",
    subtitle: "Let's strengthen your recall.",
    detail: "We've selected {count} questions from your study materials.",
  },
  {
    greeting: "Your brain's calling",
    subtitle: "Time to flex those memory muscles.",
    detail: "We've prepared {count} questions from your study materials for a quick review.",
  },
  {
    greeting: "Time to review",
    subtitle: "Keep that knowledge fresh.",
    detail: "{count} questions from your study materials to help you stay sharp.",
  },
  {
    greeting: "Ready to consolidate",
    subtitle: "A little review goes a long way.",
    detail: "We've prepared {count} questions from your study materials.",
  },
  {
    greeting: "Good to see you",
    subtitle: "Let's keep that knowledge fresh.",
    detail: "{count} questions from your study materials are ready when you are.",
  },
];

const QuickReviewModal = ({ userName, userId, onComplete, onSkip }: QuickReviewModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [questionResults, setQuestionResults] = useState<Array<{ item: ReviewItem; isCorrect: boolean; userAnswer?: string }>>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [noContent, setNoContent] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeMsg] = useState(() => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);

  useEffect(() => {
    fetchAndPrepareReview();
  }, []);

  const fetchAndPrepareReview = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setNoContent(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setNoContent(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const tools: StudyTool[] = data.data || [];

      // Quizzes: 'mixed', 'multiple_choice', 'true_false', 'fill_blank', and crater_blast (nested questions)
      // Flashcards: 'flashcards'
      // Exclude only: 'crossword' (different structure)
      const isQuiz = (t: StudyTool) => !['flashcards', 'crossword'].includes(t.quiz_type);
      const isFlashcards = (t: StudyTool) => t.quiz_type === 'flashcards';

      const recentTools = tools
        .filter(t => isQuiz(t) || isFlashcards(t))
        .slice(0, 15); // Pull from more tools to get a good mix

      if (recentTools.length === 0) {
        setNoContent(true);
        setIsLoading(false);
        return;
      }

      // Extract items from each tool
      const allItems: ReviewItem[] = [];

      recentTools.forEach(tool => {
        // Regular quizzes: questions array at tool.questions
        if (isQuiz(tool)) {
          let questions: QuizQuestion[] = [];
          if (Array.isArray(tool.questions)) {
            questions = (tool.questions as QuizQuestion[])
              .filter(q => q && q.question && (q.options?.length || q.correctAnswer))
              .slice(0, 4); // Up to 4 questions per quiz
          }
          // Crater blast has nested structure: tool.questions.questions
          else if (tool.questions && typeof tool.questions === 'object' && Array.isArray((tool.questions as any).questions)) {
            questions = ((tool.questions as any).questions as QuizQuestion[])
              .filter(q => q && q.question && (q.options?.length || q.correctAnswer))
              .slice(0, 4);
          }
          questions.forEach(q => {
            if (q.question && (q.options?.length || q.correctAnswer)) {
              allItems.push({
                type: 'quiz',
                data: { ...q, sourceTitle: tool.title }
              });
            }
          });
        }
        // Flashcards: questions array contains { front, back }
        else if (isFlashcards(tool) && Array.isArray(tool.questions)) {
          const cards = (tool.questions as FlashCard[])
            .filter(c => c && c.front && c.back)
            .slice(0, 4); // Up to 4 cards per deck
          cards.forEach(c => {
            allItems.push({
              type: 'flashcard',
              data: { ...c, sourceTitle: tool.title }
            });
          });
        }
      });

      // Shuffle and take a variable count: 8, 10, 12, or 15 (randomly chosen)
      const targetCounts = [8, 10, 12, 15];
      const targetCount = targetCounts[Math.floor(Math.random() * targetCounts.length)];
      const shuffled = allItems.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

      if (selected.length === 0) {
        setNoContent(true);
      } else {
        setReviewItems(selected);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch review items:', error);
      setNoContent(true);
      setIsLoading(false);
    }
  };

  const isCorrectQuizAnswer = (answer: string, item: ReviewItem): boolean => {
    if (item.type !== 'quiz') return false;
    const { correctAnswer, options } = item.data;
    // correctAnswer can be "A","B","C","D" (index) or the actual option text
    if (options && options.length > 0) {
      const letter = correctAnswer?.toString().toUpperCase();
      if (letter && letter >= 'A' && letter <= 'Z') {
        const idx = letter.charCodeAt(0) - 65;
        return answer === options[idx];
      }
    }
    // Direct match (e.g. "true"/"false" for true_false, or literal text)
    return answer === correctAnswer || answer?.toLowerCase() === correctAnswer?.toLowerCase();
  };

  const getCorrectAnswerText = (item: ReviewItem): string => {
    if (item.type !== 'quiz') return '';
    const { correctAnswer, options } = item.data;
    if (options && options.length > 0) {
      const letter = correctAnswer?.toString().toUpperCase();
      if (letter && letter >= 'A' && letter <= 'Z') {
        const idx = letter.charCodeAt(0) - 65;
        return options[idx] ?? correctAnswer ?? '';
      }
    }
    return correctAnswer ?? '';
  };

  const handleQuizAnswer = (answer: string) => {
    if (answered) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    
    const currentItem = reviewItems[currentIndex];
    if (currentItem.type === 'quiz') {
      const isCorrect = isCorrectQuizAnswer(answer, currentItem);
      setQuestionResults(prev => [...prev, { item: currentItem, isCorrect, userAnswer: answer }]);
      if (isCorrect) {
        setScore(s => s + 1);
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          return newStreak;
        });
      } else {
        setStreak(0);
      }
    }
  };

  const handleFlashcardKnew = (knew: boolean) => {
    const currentItem = reviewItems[currentIndex];
    if (currentItem?.type === 'flashcard') {
      setQuestionResults(prev => [...prev, { item: currentItem, isCorrect: knew }]);
    }
    if (knew) {
      setScore(s => s + 1);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    goToNext();
  };

  const goToNext = useCallback(() => {
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(i => i + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  }, [currentIndex, reviewItems.length]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  // Mark as shown for today
  useEffect(() => {
    if (userId && reviewItems.length > 0) {
      const today = new Date().toDateString();
      localStorage.setItem(`writescholar_quick_review_last_shown_${userId}`, today);
    }
  }, [userId, reviewItems.length]);

  if (!isVisible) return null;

  const progress = reviewItems.length > 0 ? ((currentIndex + 1) / reviewItems.length) * 100 : 0;
  const currentItem = reviewItems[currentIndex];
  const scorePercentage = reviewItems.length > 0 ? Math.round((score / reviewItems.length) * 100) : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-smoothSlideUp">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-stone-600 font-medium">Preparing your review...</p>
          </div>
        </div>
      </div>
    );
  }

  // No content state
  if (noContent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn">
        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-smoothSlideUp">
          <div className="h-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className="p-4 sm:p-8 text-center">
            <div className="mb-3 sm:mb-4">
              <ScholarMascot size={100} animated={true} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">
              Welcome back{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-stone-500 mb-6">
              Create some quizzes or flashcards first, then come back for a quick review session!
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Welcome intro screen - shows before quiz starts
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn">
        <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-smoothSlideUp">
          <div className="h-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className="p-6 sm:p-8 text-center">
            <div className="mb-4 sm:mb-6 flex justify-center">
              <ScholarMascot size={120} animated={true} pose="waving" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
              {welcomeMsg.greeting}{userName ? `, ${userName}` : ''}! 👋
            </h2>
            <p className="text-stone-600 mb-2 text-base sm:text-lg">
              {welcomeMsg.subtitle}
            </p>
            <p className="text-stone-500 mb-6 text-sm">
              {welcomeMsg.detail.split('{count}').map((part, i) => (
                i === 0 ? part : (
                  <span key={i}>
                    <span className="font-semibold text-violet-600">{reviewItems.length} questions</span>
                    {part}
                  </span>
                )
              ))}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Let's Go! 🚀
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-stone-500 hover:text-stone-700 font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    // Review Questions view
    if (showReview) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[min(calc(100vh-1rem),90vh)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden overflow-y-auto my-auto animate-smoothSlideUp">
            <div className="h-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-stone-800">Review Questions</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="px-4 py-2 rounded-lg bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors text-sm"
                >
                  Back to Score
                </button>
              </div>
              <div className="space-y-3 max-h-[calc(90vh-8rem)] overflow-y-auto">
                {questionResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      res.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          res.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {res.isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        {res.item.type === 'quiz' ? (
                          <>
                            <h4 className="font-semibold text-stone-900 mb-2">{res.item.data.question}</h4>
                            {res.item.data.options && res.item.data.options.length > 0 ? (
                              <div className="space-y-1.5">
                                {res.item.data.options.map((opt, i) => {
                                  const isCorrectOpt = opt === getCorrectAnswerText(res.item);
                                  const isUserWrong = !res.isCorrect && res.userAnswer === opt;
                                  return (
                                    <div
                                      key={i}
                                      className={`px-3 py-2 rounded-lg text-sm border ${
                                        isCorrectOpt
                                          ? 'bg-emerald-100 border-emerald-200 text-emerald-800 font-medium'
                                          : isUserWrong
                                            ? 'bg-red-100 border-red-200 text-red-800 font-medium'
                                            : 'bg-white border-stone-200 text-stone-600'
                                      }`}
                                    >
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="px-3 py-2 rounded-lg text-sm bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium">
                                  Correct: {getCorrectAnswerText(res.item)}
                                </div>
                                {!res.isCorrect && res.userAnswer && (
                                  <div className="px-3 py-2 rounded-lg text-sm bg-red-100 border border-red-200 text-red-800 font-medium">
                                    Your answer: {res.userAnswer}
                                  </div>
                                )}
                              </div>
                            )}
                            {res.item.data.explanation && (
                              <p className="mt-2 text-xs text-blue-700 bg-blue-50/70 border border-blue-100 rounded-lg px-2 py-1.5">
                                {res.item.data.explanation}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="font-semibold text-stone-900 mb-1">{res.item.data.front}</h4>
                            <p className="text-sm text-stone-600 mb-2">Answer: {res.item.data.back}</p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                res.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {res.isCorrect ? 'Got it!' : 'Still learning'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const emoji = scorePercentage >= 80 ? '🎉' : scorePercentage >= 60 ? '👏' : scorePercentage >= 40 ? '💪' : '📚';
    const message = scorePercentage >= 80 ? 'Amazing!' : scorePercentage >= 60 ? 'Great job!' : scorePercentage >= 40 ? 'Good effort!' : 'Keep practicing!';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn overflow-y-auto">
        <div className="relative w-full max-w-lg max-h-[min(calc(100vh-1rem),90vh)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden overflow-y-auto my-auto animate-smoothSlideUp">
          {/* Confetti-like decorations for good scores */}
          {scorePercentage >= 60 && (
            <>
              <div className="absolute top-10 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="absolute top-16 right-12 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="absolute top-8 right-24 w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="absolute top-20 left-20 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            </>
          )}
          
          <div className="h-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          
          <div className="p-4 sm:p-8 text-center overflow-y-auto">
            <div className="mb-3 sm:mb-6 flex justify-center">
              <div className="scale-75 sm:scale-100 origin-center">
                <ScholarMascot size={120} animated={true} pose={scorePercentage >= 60 ? 'celebrating' : 'default'} />
              </div>
            </div>
            
            <span className="text-4xl sm:text-5xl mb-2 sm:mb-4 block">{emoji}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">{message}</h2>
            
            {/* Score display */}
            <div className="my-4 sm:my-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl sm:rounded-2xl border border-violet-100">
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {score}/{reviewItems.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-stone-500 font-medium">CORRECT</div>
                </div>
                <div className="w-px h-8 sm:h-12 bg-violet-200 hidden sm:block" />
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {scorePercentage}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-stone-500 font-medium">SCORE</div>
                </div>
                {maxStreak > 1 && (
                  <>
                    <div className="w-px h-8 sm:h-12 bg-violet-200 hidden sm:block" />
                    <div className="text-center">
                      <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        {maxStreak}
                      </div>
                      <div className="text-[10px] sm:text-xs text-stone-500 font-medium">STREAK 🔥</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-stone-500 mb-4 sm:mb-6 text-sm sm:text-base">
              {scorePercentage >= 80 
                ? "Your retention is excellent! Keep it up!" 
                : scorePercentage >= 60 
                  ? "You're remembering well. A few more reviews will solidify it!"
                  : "Review these topics again to boost your retention."}
            </p>
            
            <div className="flex flex-col gap-3">
              {questionResults.length > 0 && (
                <button
                  onClick={() => setShowReview(true)}
                  className="w-full py-3 rounded-xl bg-white text-stone-700 font-semibold hover:bg-stone-50 active:scale-[0.98] transition-all border border-stone-200 shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Review Questions
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main review interface
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-smoothFadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[min(calc(100vh-1rem),90vh)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-smoothSlideUp">
        {/* Header */}
        <div 
          className="relative px-4 py-3 sm:px-6 sm:py-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)' }}
        >
          {/* Decorative elements */}
          <div className="absolute top-2 left-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-2 right-8 w-12 h-12 rounded-full bg-white/10 blur-lg" />
          
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="hidden sm:block flex-shrink-0">
                <ScholarMascot size={50} animated={true} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-white truncate">Quick Review</h2>
                <p className="text-violet-200 text-xs sm:text-sm truncate">
                  Question {currentIndex + 1} of {reviewItems.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Streak indicator */}
              {streak > 0 && (
                <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 rounded-full">
                  <span className="text-sm sm:text-lg">🔥</span>
                  <span className="text-white font-bold text-sm sm:text-base">{streak}</span>
                </div>
              )}
              
              {/* Score */}
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 rounded-full">
                <span className="text-white font-semibold text-sm sm:text-base">{score}/{currentIndex + (answered ? 1 : 0)}</span>
              </div>
              
              <button
                onClick={handleSkip}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 sm:mt-4 h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content area - scrollable, constrained */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 overscroll-contain">
          {/* Source badge */}
          {currentItem && (
            <div className="flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-stone-100 rounded-full text-[10px] sm:text-xs font-medium text-stone-500 truncate max-w-full">
                <span>{currentItem.type === 'quiz' ? '📝' : '🃏'}</span>
                {currentItem.data.sourceTitle || 'Study Material'}
              </span>
            </div>
          )}

          {/* Quiz question */}
          {currentItem?.type === 'quiz' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center min-w-0">
                <h3 className="text-base sm:text-xl font-semibold text-stone-800 leading-relaxed line-clamp-5 sm:line-clamp-6">
                  {currentItem.data.question}
                </h3>
              </div>
              
              <div className="space-y-2 min-w-0">
                {currentItem.data.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = isCorrectQuizAnswer(option, currentItem);
                  const showCorrect = answered && isCorrect;
                  const showWrong = answered && isSelected && !isCorrect;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={answered}
                      className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-left font-medium transition-all border-2 min-w-0 ${
                        showCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : showWrong
                            ? 'bg-red-50 border-red-400 text-red-800'
                            : isSelected
                              ? 'bg-violet-50 border-violet-400 text-violet-800'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-violet-300 hover:bg-violet-50/50'
                      } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                          showCorrect
                            ? 'bg-emerald-200 text-emerald-700'
                            : showWrong
                              ? 'bg-red-200 text-red-700'
                              : isSelected
                                ? 'bg-violet-200 text-violet-700'
                                : 'bg-stone-200 text-stone-600'
                        }`}>
                          {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 min-w-0 text-sm sm:text-base line-clamp-3">{option}</span>
                      </div>
                    </button>
                  );
                })}
                
                {/* True/False options - when no options array */}
                {currentItem.data.type === 'true_false' && (!currentItem.data.options || currentItem.data.options.length === 0) && (
                  <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                    {['True', 'False'].map(option => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = isCorrectQuizAnswer(option, currentItem);
                      const showCorrect = answered && isCorrect;
                      const showWrong = answered && isSelected && !isCorrect;
                      
                      return (
                        <button
                          key={option}
                          onClick={() => handleQuizAnswer(option)}
                          disabled={answered}
                          className={`flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all border-2 ${
                            showCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                              : showWrong
                                ? 'bg-red-50 border-red-400 text-red-800'
                                : isSelected
                                  ? 'bg-violet-50 border-violet-400 text-violet-800'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-violet-300 hover:bg-violet-50/50'
                          } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Explanation after answering - scrollable if long */}
              {answered && currentItem.data.explanation && (
                <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-xl max-h-24 sm:max-h-32 overflow-y-auto flex-shrink-0">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <span className="font-semibold">💡</span> {currentItem.data.explanation}
                  </p>
                </div>
              )}
              
              {/* Next button */}
              {answered && (
                <div className="flex justify-center pt-1 sm:pt-2 flex-shrink-0">
                  <button
                    onClick={goToNext}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {currentIndex === reviewItems.length - 1 ? 'See Results' : 'Next Question'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Flashcard */}
          {currentItem?.type === 'flashcard' && (
            <div className="space-y-4">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative cursor-pointer mx-auto max-w-lg"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="relative w-full transition-transform duration-500"
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                  }}
                >
                  {/* Front */}
                  <div
                    className="w-full min-h-[120px] sm:min-h-[160px] max-h-[160px] sm:max-h-[200px] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-y-auto"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 flex-shrink-0">Question</span>
                    <p className="text-base sm:text-lg font-semibold text-stone-800 leading-relaxed line-clamp-6 min-w-0">
                      {currentItem.data.front}
                    </p>
                    <p className="text-xs text-amber-500 mt-3 flex-shrink-0">Tap to reveal answer</p>
                  </div>
                  
                  {/* Back */}
                  <div
                    className="absolute inset-0 w-full min-h-[120px] sm:min-h-[160px] max-h-[160px] sm:max-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-y-auto"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 flex-shrink-0">Answer</span>
                    <p className="text-sm sm:text-base text-stone-700 leading-relaxed line-clamp-6 min-w-0">
                      {currentItem.data.back}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Did you know it? buttons */}
              {isFlipped && (
                <div className="flex justify-center gap-2 sm:gap-4 pt-2 flex-wrap">
                  <button
                    onClick={() => handleFlashcardKnew(false)}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl font-semibold text-sm sm:text-base hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <span>😅</span> Still Learning
                  </button>
                  <button
                    onClick={() => handleFlashcardKnew(true)}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold text-sm sm:text-base hover:bg-emerald-100 transition-all flex items-center gap-2"
                  >
                    <span>🎯</span> Got It!
                  </button>
                </div>
              )}
              
              {!isFlipped && (
                <p className="text-center text-stone-400 text-sm">
                  Click the card to flip it
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes smoothFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes smoothSlideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.98);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
        .animate-smoothFadeIn {
          animation: smoothFadeIn 0.5s ease-out;
        }
        .animate-smoothSlideUp {
          animation: smoothSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default QuickReviewModal;
