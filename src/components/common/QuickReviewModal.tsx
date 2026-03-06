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

const QuickReviewModal = ({ userName, userId, onComplete, onSkip }: QuickReviewModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [noContent, setNoContent] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

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

  const handleQuizAnswer = (answer: string) => {
    if (answered) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    
    const currentItem = reviewItems[currentIndex];
    if (currentItem.type === 'quiz') {
      const isCorrect = isCorrectQuizAnswer(answer, currentItem);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className="p-8 text-center">
            <div className="mb-4">
              <ScholarMascot size={120} animated={true} />
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

  // Results screen
  if (showResults) {
    const emoji = scorePercentage >= 80 ? '🎉' : scorePercentage >= 60 ? '👏' : scorePercentage >= 40 ? '💪' : '📚';
    const message = scorePercentage >= 80 ? 'Amazing!' : scorePercentage >= 60 ? 'Great job!' : scorePercentage >= 40 ? 'Good effort!' : 'Keep practicing!';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl overflow-hidden overflow-y-auto my-auto">
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
          
          <div className="p-8 text-center">
            <div className="mb-6">
              <ScholarMascot size={140} animated={true} pose={scorePercentage >= 60 ? 'celebrating' : 'default'} />
            </div>
            
            <span className="text-5xl mb-4 block">{emoji}</span>
            <h2 className="text-3xl font-bold text-stone-800 mb-2">{message}</h2>
            
            {/* Score display */}
            <div className="my-6">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {score}/{reviewItems.length}
                  </div>
                  <div className="text-xs text-stone-500 font-medium">CORRECT</div>
                </div>
                <div className="w-px h-12 bg-violet-200" />
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {scorePercentage}%
                  </div>
                  <div className="text-xs text-stone-500 font-medium">SCORE</div>
                </div>
                {maxStreak > 1 && (
                  <>
                    <div className="w-px h-12 bg-violet-200" />
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        {maxStreak}
                      </div>
                      <div className="text-xs text-stone-500 font-medium">STREAK 🔥</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-stone-500 mb-8">
              {scorePercentage >= 80 
                ? "Your retention is excellent! Keep it up!" 
                : scorePercentage >= 60 
                  ? "You're remembering well. A few more reviews will solidify it!"
                  : "Review these topics again to boost your retention."}
            </p>
            
            <button
              onClick={handleClose}
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main review interface
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div 
          className="relative px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)' }}
        >
          {/* Decorative elements */}
          <div className="absolute top-2 left-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-2 right-8 w-12 h-12 rounded-full bg-white/10 blur-lg" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <ScholarMascot size={50} animated={true} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quick Review</h2>
                <p className="text-violet-200 text-sm">
                  {currentIndex === 0 ? `Welcome back${userName ? `, ${userName}` : ''}!` : `Question ${currentIndex + 1} of ${reviewItems.length}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Streak indicator */}
              {streak > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full">
                  <span className="text-lg">🔥</span>
                  <span className="text-white font-bold">{streak}</span>
                </div>
              )}
              
              {/* Score */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                <span className="text-white font-semibold">{score}/{currentIndex + (answered ? 1 : 0)}</span>
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
          <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content area - scrollable, constrained */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">
          {/* Source badge */}
          {currentItem && (
            <div className="flex items-center justify-center mb-4 flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-500">
                <span>{currentItem.type === 'quiz' ? '📝' : '🃏'}</span>
                {currentItem.data.sourceTitle || 'Study Material'}
              </span>
            </div>
          )}

          {/* Quiz question */}
          {currentItem?.type === 'quiz' && (
            <div className="space-y-4">
              <div className="text-center min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-stone-800 leading-relaxed line-clamp-6">
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
                      className={`w-full p-3 rounded-xl text-left font-medium transition-all border-2 min-w-0 ${
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
                  <div className="flex gap-3 flex-shrink-0">
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
                          className={`flex-1 p-4 rounded-xl font-semibold text-lg transition-all border-2 ${
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
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl max-h-32 overflow-y-auto flex-shrink-0">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Explanation:</span> {currentItem.data.explanation}
                  </p>
                </div>
              )}
              
              {/* Next button */}
              {answered && (
                <div className="flex justify-center pt-2 flex-shrink-0">
                  <button
                    onClick={goToNext}
                    className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
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
                    className="w-full min-h-[160px] max-h-[200px] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-y-auto"
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
                    className="absolute inset-0 w-full min-h-[160px] max-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-y-auto"
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
                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={() => handleFlashcardKnew(false)}
                    className="px-6 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <span>😅</span> Still Learning
                  </button>
                  <button
                    onClick={() => handleFlashcardKnew(true)}
                    className="px-6 py-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition-all flex items-center gap-2"
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuickReviewModal;
