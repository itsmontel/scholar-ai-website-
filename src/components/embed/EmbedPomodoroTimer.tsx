import { useState, useEffect, useRef, useCallback } from 'react';
import EmbedFrame from './EmbedFrame';

/**
 * Embeddable Pomodoro Timer. Lightweight version for productivity-blog
 * embeds. Default 25/5/15 cycle, click the mode buttons to switch.
 */

type Mode = 'focus' | 'short' | 'long';

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABEL: Record<Mode, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

const MODE_COLOR: Record<Mode, string> = {
  focus: '#FF4B4B',
  short: '#58CC02',
  long: '#1CB0F6',
};

const EmbedPomodoroTimer = () => {
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when mode changes
  useEffect(() => {
    setSecondsLeft(DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  // Tick logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIsRunning(false);
          if (mode === 'focus') setCompletedFocus((c) => c + 1);
          // Try to play a beep — fall back silently if blocked
          try {
            const ctx = new (window.AudioContext || (window as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.start();
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.stop(ctx.currentTime + 0.4);
          } catch {
            // ignore
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  }, [mode]);

  const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const s = (secondsLeft % 60).toString().padStart(2, '0');
  const accent = MODE_COLOR[mode];
  const progress = 1 - secondsLeft / DURATIONS[mode];

  return (
    <EmbedFrame title="Pomodoro Timer" toolPath="/tools/pomodoro-timer" accent={accent}>
      <div className="max-w-md mx-auto">
        {/* Mode tabs */}
        <div className="flex gap-1.5 mb-5 rounded-xl p-1 bg-stone-100 dark:bg-stone-800">
          {(['focus', 'short', 'long'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[12px] font-extrabold uppercase tracking-wider transition-colors ${
                mode === m
                  ? 'text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50'
              }`}
              style={mode === m ? { backgroundColor: MODE_COLOR[m] } : undefined}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {/* Big timer display with circular progress ring */}
        <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 mb-5">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke={accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="text-5xl sm:text-6xl font-extrabold tabular-nums text-stone-900 dark:text-stone-50"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {m}:{s}
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider mt-1" style={{ color: accent }}>
              {MODE_LABEL[mode]}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setIsRunning((r) => !r)}
            className="flex-1 rounded-2xl py-3 text-white font-extrabold border-2 border-b-4 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
            style={{ backgroundColor: accent, borderColor: accent }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-5 rounded-2xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-extrabold border-2 border-b-4 border-stone-300 dark:border-stone-700 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
          >
            Reset
          </button>
        </div>

        {/* Counter */}
        <div className="text-center text-[12px] text-stone-600 dark:text-stone-400 font-bold">
          Completed today: <span className="text-stone-900 dark:text-stone-50 tabular-nums">{completedFocus}</span> {completedFocus === 1 ? 'pomodoro' : 'pomodoros'}
        </div>
      </div>
    </EmbedFrame>
  );
};

export default EmbedPomodoroTimer;
