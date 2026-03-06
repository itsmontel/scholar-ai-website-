import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActivityDays: number;
  hasActivityToday: boolean;
  weekActivities: string[];
}

interface StreakWidgetProps {
  compact?: boolean;
}

const StreakWidget = ({ compact = false }: StreakWidgetProps) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fetchStreak = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/streaks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreakData(data.data);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const getWeekDays = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayIndex = date.getDay();
      const isToday = i === 0;
      const hasActivity = data.weekActivities?.includes(dateStr) || false;
      
      result.push({
        label: days[dayIndex],
        date: dateStr,
        hasActivity,
        isToday
      });
    }
    
    return result;
  };

  const streakAction = { icon: '🔐', label: 'Log in to your account each day' };

  // Use fallback data when API fails or returns nothing - always show the UI
  const data = streakData ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalActivityDays: 0,
    hasActivityToday: false,
    weekActivities: []
  };

  if (loading && compact) {
    return (
      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 animate-pulse">
        <span className="w-4 h-4 bg-stone-200 rounded"></span>
        <span className="w-6 h-4 bg-stone-200 rounded"></span>
      </div>
    );
  }

  // Compact badge version (for mobile header or sidebar)
  if (compact) {
    return (
      <button
        onClick={() => setShowInfoModal(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-105 flex-shrink-0 self-stretch"
        style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
        title="View your streak"
      >
        <span className="text-base sm:text-lg">🔥</span>
        <span className="font-bold text-stone-800 dark:text-stone-100 text-sm sm:text-base">{data.currentStreak}</span>
      </button>
    );
  }

  // Full widget version - show loading skeleton when loading
  if (loading) {
    return (
      <div className="rounded-2xl p-5 border border-stone-200 bg-stone-50 animate-pulse">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-10 h-10 bg-stone-200 rounded-full"></span>
          <span className="w-10 h-10 bg-stone-200 rounded"></span>
        </div>
        <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto mb-5"></div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
          <div className="flex justify-between">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-stone-200"></div>
            ))}
          </div>
        </div>
        <div className="h-10 bg-stone-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-2xl p-4 border-2 shadow-lg min-w-0 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)',
          borderColor: 'rgba(139, 92, 246, 0.4)'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-400/20 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-400/20 rounded-full blur-lg" />
        {/* Header with streak count */}
        <div className="flex items-center justify-center gap-2 mb-3 relative z-10">
          <span className="text-4xl">🔥</span>
          <span className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{data.currentStreak}</span>
        </div>

        {/* Message */}
        <p className="text-center text-stone-600 font-medium mb-5 relative z-10">
          {data.currentStreak === 0 
            ? "Start your streak today!" 
            : data.hasActivityToday
              ? "Great job! Log in tomorrow to continue your streak!"
              : "Log in today to keep your streak going!"}
        </p>

        {/* Weekly calendar - compact for sidebar fit */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-violet-200/50 p-3 mb-4 min-w-0 relative z-10">
          <div className="grid grid-cols-7 gap-0.5">
            {getWeekDays().map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1 min-w-0">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm ${
                    day.hasActivity 
                      ? '' 
                      : 'bg-stone-100'
                  } ${day.isToday && !day.hasActivity ? 'ring-2 ring-violet-400 ring-offset-0' : ''}`}
                  style={day.hasActivity ? { backgroundColor: 'rgba(139, 92, 246, 0.2)' } : undefined}
                >
                  {day.hasActivity ? '🔥' : ''}
                </div>
                <span className={`text-[10px] font-semibold truncate w-full text-center ${day.isToday ? 'text-violet-600' : 'text-stone-500'}`}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-full py-2.5 px-4 rounded-full border border-violet-200 bg-white/80 text-stone-700 font-medium text-sm hover:bg-violet-50 hover:border-violet-300 transition-all relative z-10"
        >
          How to earn a streak
        </button>

        {/* Stats row */}
        {data.longestStreak > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-violet-200/50 relative z-10">
            <div className="text-center">
              <div className="text-lg font-bold text-violet-700">{data.longestStreak}</div>
              <div className="text-xs text-stone-500">Longest streak</div>
            </div>
            <div className="w-px h-8 bg-violet-200"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-violet-700">{data.totalActivityDays}</div>
              <div className="text-xs text-stone-500">Total days</div>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal - rendered via portal to avoid layout/z-index issues */}
      {showInfoModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            style={{ background: 'linear-gradient(180deg, #FEF9E7 0%, #FFFFFF 30%)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <span className="text-6xl mb-4 block">🔥</span>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">How to earn a streak</h3>
              <p className="text-stone-600 mb-6">Log in to your account each day. That&apos;s it!</p>
              <div className="flex items-center justify-center gap-3 bg-stone-100 rounded-xl py-4 px-6">
                <span className="text-3xl">🔐</span>
                <span className="text-stone-700 font-medium">{streakAction.label}</span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 py-3 rounded-full font-semibold text-white transition-all bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25"
            >
              Got it!
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default StreakWidget;
