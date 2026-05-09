import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { pomodoroSeo } from '../../../data/toolSeoContent';

interface PomodoroTimerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const PomodoroTimerPage = ({ onNavigate, user, onLogout }: PomodoroTimerPageProps) => {
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    applyPageSeoTags({
      title: 'Free Pomodoro Timer - Study Timer & Focus Tool | WriteScholar',
      description: 'Free Pomodoro timer for focused studying. Boost productivity with timed work sessions and breaks. Customizable focus and break intervals. No signup required.',
    });
    injectToolProductSchema({
      name: 'Pomodoro Timer',
      description: 'Free Pomodoro timer for focused study sessions with customizable focus and break intervals.',
    });
    return () => removeJsonLd('tool-product');
  }, []);

  const playSound = useCallback(() => {
    if (soundEnabled) {
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
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [soundEnabled]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    switch (newMode) {
      case 'focus':
        setTimeLeft(focusDuration * 60);
        break;
      case 'shortBreak':
        setTimeLeft(shortBreakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(longBreakDuration * 60);
        break;
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound();

            if (mode === 'focus') {
              setCompletedPomodoros(p => p + 1);
              setTotalFocusTime(t => t + focusDuration);
              const newCompleted = completedPomodoros + 1;
              if (newCompleted % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              switchMode('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, completedPomodoros, focusDuration, playSound, switchMode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    switchMode(mode);
  };

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;

  const handleSetMinutes = (value: number) => {
    const mins = Math.min(99, Math.max(0, value));
    const newTotal = mins * 60 + displaySeconds;
    setTimeLeft(newTotal);
    if (mode === 'focus') setFocusDuration(mins);
    else if (mode === 'shortBreak') setShortBreakDuration(mins);
    else setLongBreakDuration(mins);
  };

  const handleSetSeconds = (value: number) => {
    const secs = Math.min(59, Math.max(0, value));
    const newTotal = displayMinutes * 60 + secs;
    setTimeLeft(newTotal);
  };

  const resetAll = () => {
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(focusDuration * 60);
    setCompletedPomodoros(0);
    setTotalFocusTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    let total: number;
    switch (mode) {
      case 'focus':
        total = focusDuration * 60;
        break;
      case 'shortBreak':
        total = shortBreakDuration * 60;
        break;
      case 'longBreak':
        total = longBreakDuration * 60;
        break;
    }
    return ((total - timeLeft) / total) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return {
          primary: '#FF4B4B',
          darker: '#E04343',
          tinted: '#FFE8E8',
          stroke: '#FF4B4B',
          tabActive: 'bg-[#FF4B4B] text-white border-2 border-b-4 border-[#E04343]',
          label: 'text-[#FF4B4B]',
        };
      case 'shortBreak':
        return {
          primary: '#1CB0F6',
          darker: '#1899D6',
          tinted: '#DDF4FF',
          stroke: '#1CB0F6',
          tabActive: 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6]',
          label: 'text-[#1CB0F6]',
        };
      case 'longBreak':
        return {
          primary: '#A560E8',
          darker: '#8A48C7',
          tinted: '#F3EAFF',
          stroke: '#A560E8',
          tabActive: 'bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7]',
          label: 'text-[#A560E8]',
        };
    }
  };

  const colors = getModeColor();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pomodoro-timer" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide mb-5 border-2 border-b-4 border-[#46A302]" style={{ backgroundColor: '#EAFFD6', color: '#58CC02' }}>
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 mb-5 leading-tight">
              Pomodoro Timer
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
              Stay focused and productive with timed study sessions. Work in focused bursts with scheduled breaks to maximize your learning.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timer Display */}
            <div className="lg:col-span-2">
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-8">
                {/* Mode Tabs */}
                <div className="flex justify-center gap-2 mb-8">
                  <button
                    onClick={() => switchMode('focus')}
                    className={`px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all ${
                      mode === 'focus'
                        ? 'bg-[#FF4B4B] text-white border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5'
                    }`}
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => switchMode('shortBreak')}
                    className={`px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all ${
                      mode === 'shortBreak'
                        ? 'bg-[#1CB0F6] text-white border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5'
                    }`}
                  >
                    Short Break
                  </button>
                  <button
                    onClick={() => switchMode('longBreak')}
                    className={`px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wide text-sm transition-all ${
                      mode === 'longBreak'
                        ? 'bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5'
                    }`}
                  >
                    Long Break
                  </button>
                </div>

                {/* Timer Circle */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-64 h-64">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        className="text-stone-200 dark:text-stone-700"
                        strokeWidth="8"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - getProgress() / 100)}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    {/* Timer Display - editable when paused */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {isRunning ? (
                        <span className="text-5xl font-extrabold text-stone-900 dark:text-stone-50 tabular-nums">
                          {formatTime(timeLeft)}
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-0.5">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={displayMinutes.toString().padStart(2, '0')}
                            onChange={(e) => handleSetMinutes(parseInt(e.target.value, 10) || 0)}
                            className="w-16 sm:w-20 text-5xl font-extrabold text-stone-900 dark:text-stone-50 bg-transparent border-b-2 border-stone-300 dark:border-stone-600 focus:border-[#1CB0F6] focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Minutes"
                          />
                          <span className="text-5xl font-extrabold text-stone-900 dark:text-stone-50">:</span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={displaySeconds.toString().padStart(2, '0')}
                            onChange={(e) => handleSetSeconds(parseInt(e.target.value, 10) || 0)}
                            className="w-14 sm:w-16 text-5xl font-extrabold text-stone-900 dark:text-stone-50 bg-transparent border-b-2 border-stone-300 dark:border-stone-600 focus:border-[#1CB0F6] focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Seconds"
                          />
                        </div>
                      )}
                      <span className={`text-sm font-extrabold uppercase tracking-wide mt-2 ${colors.label}`}>
                        {mode === 'focus' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={toggleTimer}
                    className="px-8 py-3 bg-[#58CC02] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-6 py-3 bg-[#FF4B4B] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    Reset
                  </button>
                </div>

                {/* Sound Toggle */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-0.5 ${
                      soundEnabled
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {soundEnabled ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    )}
                    <span className="text-sm font-extrabold">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Settings & Stats Panel */}
            <div className="space-y-6">
              {/* Session Stats */}
              <div className="border-2 border-b-4 rounded-2xl p-4 sm:p-6 text-white overflow-hidden" style={{ backgroundColor: colors.primary, borderColor: colors.darker }}>
                <h3 className="text-lg font-extrabold mb-4 opacity-90 uppercase tracking-wide">Today&apos;s Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate font-extrabold">Pomodoros</span>
                    <span className="text-2xl font-extrabold shrink-0 tabular-nums">{completedPomodoros}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate font-extrabold">Focus Time</span>
                    <span className="text-xl font-extrabold shrink-0 tabular-nums">{totalFocusTime} min</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate font-extrabold">Until Long Break</span>
                    <span className="text-xl font-extrabold shrink-0 tabular-nums">{4 - (completedPomodoros % 4)}</span>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  className="mt-4 w-full py-2.5 bg-white/20 text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-white/30 hover:bg-white/30 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Reset Stats
                </button>
              </div>

              {/* Timer Settings */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4">Timer Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-extrabold text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">Focus Duration (min)</label>
                    <select
                      value={focusDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFocusDuration(val);
                        if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:outline-none font-extrabold text-stone-900 dark:text-stone-50"
                      disabled={isRunning}
                    >
                      {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">Short Break (min)</label>
                    <select
                      value={shortBreakDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setShortBreakDuration(val);
                        if (mode === 'shortBreak' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:outline-none font-extrabold text-stone-900 dark:text-stone-50"
                      disabled={isRunning}
                    >
                      {[3, 5, 10, 15].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">Long Break (min)</label>
                    <select
                      value={longBreakDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setLongBreakDuration(val);
                        if (mode === 'longBreak' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 focus:outline-none font-extrabold text-stone-900 dark:text-stone-50"
                      disabled={isRunning}
                    >
                      {[10, 15, 20, 25, 30].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-3">How It Works</h3>
                <ol className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white border-2 border-b-4" style={{ backgroundColor: '#FF4B4B', borderColor: '#E04343' }}>1</span>
                    <span className="font-extrabold pt-0.5">Focus for 25 minutes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white border-2 border-b-4" style={{ backgroundColor: '#1CB0F6', borderColor: '#1899D6' }}>2</span>
                    <span className="font-extrabold pt-0.5">Take a 5-minute break</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white border-2 border-b-4" style={{ backgroundColor: '#A560E8', borderColor: '#8A48C7' }}>3</span>
                    <span className="font-extrabold pt-0.5">After 4 sessions, take a longer break</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 bg-stone-100 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-8 text-center">Why Use the Pomodoro Technique?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border-2 border-b-4" style={{ backgroundColor: '#FFE8E8', borderColor: '#E04343' }}>
                <svg className="w-6 h-6" style={{ color: '#FF4B4B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Boost Focus</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Short, timed sessions help you maintain intense focus without mental fatigue.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border-2 border-b-4" style={{ backgroundColor: '#EAFFD6', borderColor: '#46A302' }}>
                <svg className="w-6 h-6" style={{ color: '#58CC02' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Beat Procrastination</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Starting a 25-minute timer is easier than facing hours of work. Just begin.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border-2 border-b-4" style={{ backgroundColor: '#DDF4FF', borderColor: '#1899D6' }}>
                <svg className="w-6 h-6" style={{ color: '#1CB0F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Track Progress</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Count your completed pomodoros to see how much focused work you&apos;ve done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-stone-900 dark:bg-stone-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Ready to supercharge your studying?
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            WriteScholar helps you write better papers, generate study materials, and learn more effectively with AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-[#58CC02] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-[#58CC02] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-b-4 border-stone-600 text-white font-extrabold uppercase tracking-wide rounded-xl hover:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...pomodoroSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PomodoroTimerPage;
