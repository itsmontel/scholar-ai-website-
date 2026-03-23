import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'writescholar_study_timer';

interface StoredState {
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  startedAt: number | null;
}

const PRESETS = [15, 30, 45, 60];

const playCompletionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    // Audio not supported
  }
};

interface StudyTimerWidgetProps {
  currentPage?: string;
}

const HIDE_ON_PAGES = ['login', 'signup', 'auth-callback', 'reset-password', 'email-verification', 'onboarding', 'unlock-quiz'];

const StudyTimerWidget = ({ currentPage = '' }: StudyTimerWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [duration, setDuration] = useState(30 * 60); // 30 min default
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customMins, setCustomMins] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPreset = (mins: number) => duration === mins * 60;

  const saveState = useCallback((state: Partial<StoredState>) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      const next = { ...parsed, ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const loadState = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed.duration != null) {
        setDuration(parsed.duration);
        const mins = Math.floor(parsed.duration / 60);
        setIsCustom(!PRESETS.includes(mins));
        setCustomMins(mins.toString());
      }
      if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft);
      if (parsed.isRunning != null) setIsRunning(parsed.isRunning);
      if (parsed.startedAt != null) setStartedAt(parsed.startedAt);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Recompute timeLeft from startedAt when returning to tab (handles refresh/navigation, throttled background tabs)
  const syncFromStartedAt = useCallback(() => {
    if (!isRunning || !startedAt) return;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, duration - elapsed);
    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);
      setStartedAt(null);
      setShowCompleted(true);
      playCompletionSound();
      saveState({ timeLeft: 0, isRunning: false, startedAt: null });
    } else {
      setTimeLeft(remaining);
    }
  }, [isRunning, startedAt, duration, saveState]);

  useEffect(() => {
    syncFromStartedAt();
  }, [syncFromStartedAt]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncFromStartedAt();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [syncFromStartedAt]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setStartedAt(null);
            setShowCompleted(true);
            playCompletionSound();
            saveState({ timeLeft: 0, isRunning: false, startedAt: null });
            return 0;
          }
          const next = prev - 1;
          saveState({ timeLeft: next });
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, saveState]);

  const handleStart = () => {
    const effectiveTimeLeft = timeLeft > 0 ? timeLeft : duration;
    if (timeLeft <= 0) {
      setTimeLeft(duration);
      saveState({ timeLeft: duration });
    }
    setIsRunning(true);
    // When resuming: set startedAt so that duration - elapsed = timeLeft (avoids resetting to full duration)
    const elapsed = duration - effectiveTimeLeft;
    const now = Date.now() - elapsed * 1000;
    setStartedAt(now);
    saveState({ isRunning: true, startedAt: now, duration, timeLeft: effectiveTimeLeft });
  };

  const handlePause = () => {
    setIsRunning(false);
    setStartedAt(null);
    saveState({ isRunning: false, startedAt: null, timeLeft });
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setShowCompleted(false);
    setTimeLeft(duration);
    saveState({ timeLeft: duration, isRunning: false, startedAt: null });
  };

  const handlePreset = (mins: number) => {
    setIsCustom(false);
    setCustomMins('');
    const secs = mins * 60;
    setDuration(secs);
    if (!isRunning) {
      setTimeLeft(secs);
      saveState({ duration: secs, timeLeft: secs });
    } else {
      saveState({ duration: secs });
    }
  };

  const handleCustomApply = () => {
    const mins = parseInt(customMins, 10);
    if (isNaN(mins) || mins < 1 || mins > 240) return;
    const secs = mins * 60;
    setDuration(secs);
    if (!isRunning) {
      setTimeLeft(secs);
      saveState({ duration: secs, timeLeft: secs });
    } else {
      saveState({ duration: secs });
    }
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setCustomMins(Math.floor(duration / 60).toString());
  };

  const handleStartNew = () => {
    setShowCompleted(false);
    setTimeLeft(duration);
    saveState({ timeLeft: duration });
    setIsRunning(true);
    const now = Date.now();
    setStartedAt(now);
    saveState({ isRunning: true, startedAt: now });
  };

  if (HIDE_ON_PAGES.includes(currentPage)) return null;

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const formatTime = (m: number, s: number) => `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] hidden md:flex lg:hidden flex-col items-end gap-2">
      {isExpanded && (
        <div className="w-64 sm:w-80 bg-white dark:bg-stone-800 rounded-xl sm:rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          {showCompleted ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Session completed</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Great focus! Take a short break.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleStartNew}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start new session
                </button>
                <button
                  onClick={() => { setShowCompleted(false); setIsExpanded(false); }}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400">Study timer</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
                  aria-label="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-stone-900 dark:text-stone-100 mb-3 sm:mb-4 text-center tabular-nums">
                  {formatTime(displayMinutes, displaySeconds)}
                </div>
                <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                  {PRESETS.map(m => (
                    <button
                      key={m}
                      onClick={() => handlePreset(m)}
                      disabled={isRunning}
                      className={`flex-1 min-w-[2.75rem] sm:min-w-[3.5rem] py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        !isCustom && isPreset(m)
                          ? 'bg-violet-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
                      } ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {m}m
                    </button>
                  ))}
                  <button
                    onClick={handleCustomSelect}
                    disabled={isRunning}
                    className={`flex-1 min-w-[2.75rem] sm:min-w-[3.5rem] py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isCustom
                        ? 'bg-violet-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
                    } ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Custom
                  </button>
                </div>
                {isCustom && (
                  <div className="flex gap-2 mb-3 sm:mb-4">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={customMins}
                      onChange={(e) => setCustomMins(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      onBlur={handleCustomApply}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                      placeholder="Minutes"
                      disabled={isRunning}
                      className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCustomApply}
                      disabled={isRunning}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Set
                    </button>
                  </div>
                )}
                <div className="flex gap-1.5 sm:gap-2">
                  {isRunning ? (
                    <button
                      onClick={handlePause}
                      className="flex-1 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={handleStart}
                      className="flex-1 py-2 sm:py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {timeLeft > 0 && timeLeft < duration ? 'Resume' : 'Start'}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl shadow-lg border transition-all ${
          isRunning
            ? 'bg-violet-600 border-violet-500 text-white'
            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
        }`}
        aria-label={isExpanded ? 'Minimize study timer' : 'Open study timer'}
      >
        <span className="text-sm sm:text-lg">⏱</span>
        <span className="font-mono font-semibold tabular-nums text-xs sm:text-sm">
          {showCompleted
            ? 'Done'
            : isRunning
              ? formatTime(displayMinutes, displaySeconds)
              : 'Timer'}
        </span>
      </button>
    </div>
  );
};

export default StudyTimerWidget;
