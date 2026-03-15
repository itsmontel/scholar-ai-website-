import { useState, useEffect, useCallback } from 'react';
import ScholarMascot from '../common/ScholarMascot';
import { trackFocusModeUnlock } from '../../data/achievements';

function getSearchParams() {
  if (typeof window === 'undefined') return { site: '', redirect: '', mode: '' };
  const sp = new URLSearchParams(window.location.search);
  const site = sp.get('site') || '';
  const mode = sp.get('mode') || '';
  let redirect = sp.get('redirect') || '';
  if (mode === 'all' && window.location.hash) {
    try {
      redirect = decodeURIComponent(window.location.hash.slice(1));
    } catch (_) {
      redirect = '';
    }
  }
  return { site, redirect, mode };
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

const DEFAULT_PASS_THRESHOLD = 4;
const DEFAULT_TOTAL_QUESTIONS = 5;

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
    'discord.com': 'Discord',
  };
  return names[domain] || domain;
}

export default function UnlockQuizPage() {
  const params = getSearchParams();
  const site = params.site;
  const redirect = params.redirect;
  const isBlockAll = params.mode === 'all' || site === '__ALL__';

  const [phase, setPhase] = useState<'blocked' | 'loading' | 'quiz' | 'results'>('blocked');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsMoreContent, setNeedsMoreContent] = useState(false);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showExtensionHint, setShowExtensionHint] = useState(false);
  const [passThreshold, setPassThreshold] = useState(DEFAULT_PASS_THRESHOLD);
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);

  const currentItem = questions[currentIndex];
  const isPassed = score >= passThreshold;

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

  const fetchQuiz = useCallback((token: string) => {
    setPhase('loading');
    setIsLoading(true);
    setError(null);
    fetch(`${API_URL}/focus-mode/unlock-quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || 'Failed to load quiz');
          setNeedsMoreContent(!!data.needsMoreContent);
          setPhase('results');
          setIsLoading(false);
          return;
        }
        setQuestions(data.data.questions || []);
        setPassThreshold(data.data.passThreshold ?? DEFAULT_PASS_THRESHOLD);
        setTotalQuestions(data.data.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS);
        setPhase('quiz');
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load quiz. Check your connection.');
        setPhase('results');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in to use Focus Mode.');
      setPhase('results');
      return;
    }
    if (!site && !isBlockAll) {
      setPhase('loading');
      fetchQuiz(token);
    }
  }, [site, isBlockAll, fetchQuiz]);

  const handleStartQuiz = () => {
    const token = localStorage.getItem('authToken');
    if (token) fetchQuiz(token);
  };

  const handleGoBack = () => {
    window.location.href = 'https://www.google.com';
  };

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

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source === window && e.data?.type === 'WRITESCHOLAR_UNLOCK_FAILED') {
        setIsRedirecting(false);
        setShowExtensionHint(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleUnlockAndContinue = () => {
    // Track achievement: first / repeated unlock
    trackFocusModeUnlock();

    const siteDomain = isBlockAll ? '__ALL__' : (site || (redirect ? new URL(redirect).hostname.replace(/^www\./, '') : ''));
    const finalRedirect = redirect || (siteDomain !== '__ALL__' ? `https://${siteDomain}` : FRONTEND_URL);
    console.log('[UnlockQuiz] Continue clicked. siteDomain:', siteDomain, 'redirect:', finalRedirect);
    setIsRedirecting(true);
    setShowExtensionHint(false);

    const payload = { site: siteDomain, redirect: finalRedirect };
    
    // Method 1: DOM-based communication (most reliable)
    console.log('[UnlockQuiz] Setting DOM unlock request');
    const unlockEl = document.createElement('div');
    unlockEl.id = 'writescholar-unlock-request';
    unlockEl.dataset.site = siteDomain;
    unlockEl.dataset.redirect = finalRedirect;
    unlockEl.style.display = 'none';
    document.body.appendChild(unlockEl);
    
    // Method 2: CustomEvent
    console.log('[UnlockQuiz] Dispatching CustomEvent focus-mode-unlock');
    document.dispatchEvent(new CustomEvent('focus-mode-unlock', { detail: payload, bubbles: true }));
    
    // Method 3: postMessage
    console.log('[UnlockQuiz] Posting message WRITESCHOLAR_FOCUS_UNLOCK');
    window.postMessage({ type: 'WRITESCHOLAR_FOCUS_UNLOCK', ...payload }, '*');
    
    // Method 4: Direct chrome API if available (won't work from page context, but try anyway)
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      console.log('[UnlockQuiz] Trying direct chrome.runtime.sendMessage');
      try {
        chrome.runtime.sendMessage({ type: 'UNLOCK_SITE', site: siteDomain, redirect: finalRedirect }, (response: { ok?: boolean } | undefined) => {
          const err = chrome.runtime?.lastError;
          console.log('[UnlockQuiz] Direct chrome response:', response, 'error:', err);
          if (response?.ok && finalRedirect) {
            console.log('[UnlockQuiz] Direct unlock succeeded, redirecting...');
            window.location.replace(finalRedirect);
          }
        });
      } catch (e) {
        console.log('[UnlockQuiz] Direct chrome.runtime.sendMessage failed:', e);
      }
    }

    setTimeout(() => {
      console.log('[UnlockQuiz] Timeout reached, showing hint');
      setIsRedirecting(false);
      setShowExtensionHint(true);
      // Clean up DOM element
      document.getElementById('writescholar-unlock-request')?.remove();
    }, 5000);
  };

  const handleGoToScholar = () => {
    window.location.href = FRONTEND_URL;
  };

  if (phase === 'blocked' && site) {
    const siteDisplay = formatSiteName(site);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-4">
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 sm:p-10 shadow-xl border border-stone-200/60 dark:border-stone-700 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <ScholarMascot size={100} animated />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 text-2xl">
            🔒
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3">
            {siteDisplay} is blocked
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
            Answer study questions from your own material to unlock access. Or go back to browse elsewhere.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleStartQuiz}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
            >
              Solve quiz to unlock
            </button>
            <button
              onClick={handleGoBack}
              className="w-full px-6 py-3 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium transition-colors"
            >
              Browse elsewhere
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30">
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 shadow-xl border border-stone-200/60 dark:border-stone-700">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400 font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (error || (phase === 'results' && questions.length < totalQuestions)) {
    if (needsMoreContent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 sm:p-10 shadow-xl border border-stone-200/60 dark:border-stone-700 max-w-lg w-full text-center">
            <div className="flex justify-center mb-6">
              <ScholarMascot size={100} animated />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-6 text-2xl">
              📚
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-3">
              You need study material first
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              Focus Mode blocks websites until you answer questions from <strong>your own</strong> study material. Right now you don&apos;t have any quizzes or flashcards to draw from.
            </p>
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 mb-6 text-left border border-violet-100 dark:border-violet-800/40">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">To use Focus Mode:</p>
              <ol className="text-sm text-stone-600 dark:text-stone-400 space-y-2 list-decimal list-inside">
                <li>Create a <strong>quiz</strong> or <strong>flashcards</strong> from your notes (Study Tools on WriteScholar)</li>
                <li>Come back and try unlocking again</li>
              </ol>
            </div>
            <button
              onClick={() => { window.location.href = `${FRONTEND_URL}/tools/quiz-generator`; }}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
            >
              Create quiz or flashcards →
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-4">
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 shadow-xl border border-stone-200/60 dark:border-stone-700 max-w-md text-center">
          <ScholarMascot size={100} animated />
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-6 mb-2">Focus Mode Unlock</h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{error || 'Something went wrong.'}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-4">
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 shadow-xl border border-stone-200/60 dark:border-stone-700 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <ScholarMascot size={120} animated pose={isPassed ? 'celebrating' : 'default'} />
          </div>
          <span className="text-5xl block mb-2">{isPassed ? '🎉' : '📚'}</span>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            {isPassed ? 'You did it!' : 'Almost there!'}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            {score} of {totalQuestions} correct. You need at least {passThreshold} to unlock.
          </p>
          {isPassed ? (
            <>
              <button
                onClick={handleUnlockAndContinue}
                disabled={isRedirecting}
                className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
              >
                {isRedirecting ? 'Redirecting...' : `Continue to ${site ? formatSiteName(site) : 'site'}`}
              </button>
              {showExtensionHint && (
                <p className="mt-3 text-sm text-stone-500">
                  If you weren&apos;t redirected, ensure the WriteScholar extension is installed and try again.
                </p>
              )}
            </>
          ) : (
            <button
              onClick={() => {
                const token = localStorage.getItem('authToken');
                if (token) {
                  setShowResults(false);
                  setCurrentIndex(0);
                  setScore(0);
                  setAnswered(false);
                  setSelectedAnswer(null);
                  fetchQuiz(token);
                }
              }}
              className="w-full px-6 py-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleGoToScholar}
            className="mt-4 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 border-b border-violet-100/80 dark:border-violet-900/40 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm">
        <ScholarMascot size={56} animated />
        <p className="text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100">
          Get {passThreshold}/{totalQuestions} or more to unlock {siteDisplay}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/60 dark:border-stone-700 overflow-hidden">
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
              ) : (() => {
                const ca = currentItem.data.correctAnswer?.toString().toLowerCase();
                const isTrueFalse = ca === 'true' || ca === 'false';
                if (isTrueFalse) {
                  return (
                    <div className="flex gap-3">
                      {['True', 'False'].map((opt) => {
                        const isSelected = selectedAnswer === opt || selectedAnswer?.toLowerCase() === opt.toLowerCase();
                        const isCorrect = isCorrectQuizAnswer(opt, currentItem);
                        const showCorrect = answered && isCorrect;
                        const showWrong = answered && isSelected && !isCorrect;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleQuizAnswer(opt)}
                            disabled={answered}
                            className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                              showCorrect
                                ? 'border-emerald-500 bg-emerald-50'
                                : showWrong
                                ? 'border-red-400 bg-red-50'
                                : isSelected
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-stone-200 hover:border-violet-300 hover:bg-violet-50/50'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                return (
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
                );
              })()}
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
