import { useState, useEffect, useCallback } from 'react';
import ScholarMascot from '../common/ScholarMascot';

function getSearchParams() {
  const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return { site: sp.get('site') || '', redirect: sp.get('redirect') || '' };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://writescholar.com';

interface QuizItem {
  type: 'quiz' | 'flashcard';
  data: {
    question?: string;
    options?: string[];
    correctAnswer?: string;
    front?: string;
    back?: string;
    sourceTitle?: string;
  };
}

const UNLOCK_THRESHOLD = 4; // Must get at least 4 of 5 right
const TOTAL_QUESTIONS = 5;

function formatSiteName(domain: string): string {
  const names: Record<string, string> = {
    'youtube.com': 'YouTube',
    'tiktok.com': 'TikTok',
    'instagram.com': 'Instagram',
    'facebook.com': 'Facebook',
    'twitter.com': 'X',
    'reddit.com': 'Reddit',
    'netflix.com': 'Netflix',
    'twitch.tv': 'Twitch',
    'pinterest.com': 'Pinterest',
    'snapchat.com': 'Snapchat',
  };
  return names[domain] || domain;
}

export default function UnlockQuizPage() {
  const params = getSearchParams();
  const site = params.site;
  const redirect = params.redirect;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentItem = questions[currentIndex];
  const isPassed = score >= UNLOCK_THRESHOLD;

  const isCorrectQuizAnswer = useCallback((answer: string, item: QuizItem): boolean => {
    if (item.type !== 'quiz') return false;
    const { correctAnswer, options } = item.data;
    if (options?.length) {
      const letter = correctAnswer?.toString().toUpperCase();
      if (letter && letter >= 'A' && letter <= 'Z') {
        const idx = letter.charCodeAt(0) - 65;
        return answer === options[idx];
      }
    }
    return answer === correctAnswer || answer?.toLowerCase() === correctAnswer?.toLowerCase();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in to use Focus Mode.');
      setIsLoading(false);
      return;
    }
    fetch(`${API_URL}/focus-mode/unlock-quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || 'Failed to load quiz');
          setIsLoading(false);
          return;
        }
        setQuestions(data.data.questions || []);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load quiz. Check your connection.');
        setIsLoading(false);
      });
  }, []);

  const handleQuizAnswer = (answer: string) => {
    if (answered || !currentItem) return;
    setSelectedAnswer(answer);
    setAnswered(true);
    if (currentItem.type === 'quiz' && isCorrectQuizAnswer(answer, currentItem)) {
      setScore((s) => s + 1);
    }
  };

  const handleFlashcardKnew = (knew: boolean) => {
    if (!currentItem || currentItem.type !== 'flashcard') return;
    if (knew) setScore((s) => s + 1);
    goToNext();
  };

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  }, [currentIndex, questions.length]);

  const handleUnlockAndContinue = () => {
    const siteDomain = site || (redirect ? new URL(redirect).hostname.replace(/^www\./, '') : '');
    const finalRedirect = redirect || `https://${siteDomain}`;
    window.dispatchEvent(
      new CustomEvent('focus-mode-unlock', {
        detail: { site: siteDomain, redirect: finalRedirect },
      })
    );
    // Content script handles redirect after background confirms unlock (avoids race where
    // page navigates before unlock is saved, causing user to get blocked again).
    // Fallback: if extension doesn't respond in 2s, redirect anyway (e.g. no extension loaded).
    setTimeout(() => {
      window.location.href = finalRedirect;
    }, 2000);
  };

  const handleGoToScholar = () => {
    window.location.href = FRONTEND_URL;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length < TOTAL_QUESTIONS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
          <ScholarMascot size={100} animated />
          <h1 className="text-2xl font-bold text-stone-800 mt-6 mb-2">Focus Mode Unlock</h1>
          <p className="text-stone-600 mb-6">{error || 'You need at least 5 questions in your study tools.'}</p>
          <button
            onClick={handleGoToScholar}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-colors"
          >
            Go to WriteScholar
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
          <div className="flex justify-center mb-4">
            <ScholarMascot size={120} animated pose={isPassed ? 'celebrating' : 'default'} />
          </div>
          <span className="text-5xl block mb-2">{isPassed ? '🎉' : '📚'}</span>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {isPassed ? 'You did it!' : 'Almost there!'}
          </h1>
          <p className="text-stone-600 mb-4">
            {score} of {TOTAL_QUESTIONS} correct. You need at least {UNLOCK_THRESHOLD} to unlock.
          </p>
          {isPassed ? (
            <button
              onClick={handleUnlockAndContinue}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Continue to {site || 'site'}
            </button>
          ) : (
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
                setScore(0);
                setAnswered(false);
              }}
              className="w-full px-6 py-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleGoToScholar}
            className="mt-4 text-stone-500 hover:text-stone-700 text-sm"
          >
            Go to WriteScholar instead
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const siteDisplay = site ? formatSiteName(site) : 'this site';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 border-b border-violet-100/80 bg-white/60 backdrop-blur-sm">
        <ScholarMascot size={56} animated />
        <p className="text-base sm:text-lg font-semibold text-stone-800">
          Get {UNLOCK_THRESHOLD}/{TOTAL_QUESTIONS} or more to unlock {siteDisplay}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1 bg-stone-100">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm text-stone-500 mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>

          {currentItem?.type === 'quiz' && (
            <>
              <h2 className="text-xl font-bold text-stone-800 mb-6">{currentItem.data.question}</h2>
              {currentItem.data.options?.length ? (
                <div className="space-y-3">
                  {currentItem.data.options.map((opt, i) => {
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = isCorrectQuizAnswer(opt, currentItem);
                    const showCorrect = answered && isCorrect;
                    const showWrong = answered && isSelected && !isCorrect;
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(opt)}
                        disabled={answered}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          showCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : showWrong
                            ? 'border-red-400 bg-red-50'
                            : isSelected
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-stone-200 hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                      >
                        <span className="font-medium text-stone-800">{letters[i]}. {opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleQuizAnswer(e.currentTarget.value.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const inp = document.querySelector<HTMLInputElement>('input[placeholder="Type your answer..."]');
                      if (inp?.value.trim()) handleQuizAnswer(inp.value.trim());
                    }}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium"
                  >
                    Submit
                  </button>
                </div>
              )}
              {answered && (
                <button
                  onClick={goToNext}
                  className="mt-6 w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500"
                >
                  Next
                </button>
              )}
            </>
          )}

          {currentItem?.type === 'flashcard' && (
            <div>
              <div
                onClick={() => !answered && setIsFlipped((f) => !f)}
                className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200 cursor-pointer"
              >
                <p className="text-lg font-semibold text-stone-800 text-center">
                  {isFlipped ? currentItem.data.back : currentItem.data.front}
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  {isFlipped ? 'Tap for answer' : 'Tap to reveal'}
                </p>
              </div>
              {isFlipped && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleFlashcardKnew(false)}
                    className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200"
                  >
                    Didn't know
                  </button>
                  <button
                    onClick={() => handleFlashcardKnew(true)}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
                  >
                    Knew it
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
