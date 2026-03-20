import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

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
    document.title = 'Free Pomodoro Timer - Study Timer & Focus Tool | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free Pomodoro timer for focused studying. Boost productivity with timed work sessions and breaks. Customizable focus and break intervals. No signup required.');
    }
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
        return { bg: 'from-red-500 to-rose-600', light: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-500' };
      case 'shortBreak':
        return { bg: 'from-rose-500 to-teal-600', light: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-500' };
      case 'longBreak':
        return { bg: 'from-rose-500 to-indigo-600', light: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-500' };
    }
  };

  const colors = getModeColor();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pomodoro-timer" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Pomodoro Timer
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
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
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                {/* Mode Tabs */}
                <div className="flex justify-center gap-2 mb-8">
                  <button
                    onClick={() => switchMode('focus')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      mode === 'focus' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => switchMode('shortBreak')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      mode === 'shortBreak' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Short Break
                  </button>
                  <button
                    onClick={() => switchMode('longBreak')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      mode === 'longBreak' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        stroke="#E5E7EB"
                        strokeWidth="8"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke={mode === 'focus' ? '#EF4444' : mode === 'shortBreak' ? '#10B981' : '#3B82F6'}
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
                        <span className="text-5xl font-bold text-gray-900 tabular-nums">
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
                            className="w-16 sm:w-20 text-5xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Minutes"
                          />
                          <span className="text-5xl font-bold text-gray-900">:</span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={displaySeconds.toString().padStart(2, '0')}
                            onChange={(e) => handleSetSeconds(parseInt(e.target.value, 10) || 0)}
                            className="w-14 sm:w-16 text-5xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label="Seconds"
                          />
                        </div>
                      )}
                      <span className={`text-sm font-medium ${colors.text} capitalize mt-2`}>
                        {mode === 'focus' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={toggleTimer}
                    className={`px-8 py-3 bg-gradient-to-r ${colors.bg} text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg`}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Reset
                  </button>
                </div>

                {/* Sound Toggle */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      soundEnabled ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
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
                    <span className="text-sm font-medium">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Settings & Stats Panel */}
            <div className="space-y-6">
              {/* Session Stats */}
              <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-4 sm:p-6 text-white overflow-hidden`}>
                <h3 className="text-lg font-semibold mb-4 opacity-90">Today&apos;s Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate">Pomodoros</span>
                    <span className="text-2xl font-bold shrink-0 tabular-nums">{completedPomodoros}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate">Focus Time</span>
                    <span className="text-xl font-bold shrink-0 tabular-nums">{totalFocusTime} min</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 min-w-0">
                    <span className="opacity-80 shrink min-w-0 truncate">Until Long Break</span>
                    <span className="text-xl font-bold shrink-0 tabular-nums">{4 - (completedPomodoros % 4)}</span>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  className="mt-4 w-full py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-all"
                >
                  Reset Stats
                </button>
              </div>

              {/* Timer Settings */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timer Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Focus Duration (min)</label>
                    <select
                      value={focusDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFocusDuration(val);
                        if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={isRunning}
                    >
                      {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Short Break (min)</label>
                    <select
                      value={shortBreakDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setShortBreakDuration(val);
                        if (mode === 'shortBreak' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      disabled={isRunning}
                    >
                      {[3, 5, 10, 15].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Long Break (min)</label>
                    <select
                      value={longBreakDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setLongBreakDuration(val);
                        if (mode === 'longBreak' && !isRunning) setTimeLeft(val * 60);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Focus for 25 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Take a 5-minute break</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>After 4 sessions, take a longer break</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Use the Pomodoro Technique?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Boost Focus</h3>
              <p className="text-gray-600 text-sm">Short, timed sessions help you maintain intense focus without mental fatigue.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Beat Procrastination</h3>
              <p className="text-gray-600 text-sm">Starting a 25-minute timer is easier than facing hours of work. Just begin.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">Count your completed pomodoros to see how much focused work you&apos;ve done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to supercharge your studying?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar helps you write better papers, generate study materials, and learn more effectively with AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PomodoroTimerPage;
