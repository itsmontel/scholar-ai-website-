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
  const [showFullStreakModal, setShowFullStreakModal] = useState(false);

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

  // Longest streak = max of current and stored longest (current can be the new record)
  const longestStreakDisplay = Math.max(data.currentStreak, data.longestStreak);

  if (loading && compact) {
    return (
      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 animate-pulse">
        <span className="w-4 h-4 bg-stone-200 rounded"></span>
        <span className="w-6 h-4 bg-stone-200 rounded"></span>
      </div>
    );
  }

  // Full streak content (shared by full widget and modal) - compact, clickable to open "How to earn" popup
  const fullStreakContent = (onClick?: () => void) => (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? 'Click to learn how to earn a streak' : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      onClick={onClick}
      className={`rounded-xl p-3 border border-violet-200/60 dark:border-violet-700/40 min-w-0 relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.06) 100%)'
      }}
    >
      <div className="absolute -top-4 -right-4 w-10 h-10 bg-violet-400/15 rounded-full blur-md" />
      <div className="flex items-center justify-center gap-1.5 mb-2 relative z-10">
        <span className="text-2xl">🔥</span>
        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{data.currentStreak}</span>
      </div>
      <p className="text-center text-stone-600 dark:text-stone-400 text-xs font-medium mb-3 relative z-10">
        {data.currentStreak === 0
          ? "Start today!"
          : data.hasActivityToday
            ? "Log in tomorrow to continue!"
            : "Log in today to keep it going!"}
      </p>
      <div className="bg-white/70 dark:bg-stone-800/70 backdrop-blur-sm rounded-lg border border-violet-200/40 dark:border-violet-700/30 p-2 min-w-0 relative z-10">
        <div className="grid grid-cols-7 gap-0.5">
          {getWeekDays().map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-0.5 min-w-0">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-[10px] ${
                  day.hasActivity ? '' : 'bg-stone-100 dark:bg-stone-700'
                } ${day.isToday && !day.hasActivity ? 'ring-2 ring-violet-400 ring-offset-0' : ''}`}
                style={day.hasActivity ? { backgroundColor: 'rgba(139, 92, 246, 0.28)' } : undefined}
              >
                {day.hasActivity ? '🔥' : ''}
              </div>
              <span className={`text-[9px] font-semibold truncate w-full text-center ${day.isToday ? 'text-violet-600 dark:text-violet-400' : 'text-stone-500 dark:text-stone-400'}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {longestStreakDisplay > 0 && (
        <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-violet-200/40 dark:border-violet-700/30 relative z-10">
          <div className="text-center">
            <div className="text-sm font-bold text-violet-700 dark:text-violet-400">{longestStreakDisplay}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">Longest</div>
          </div>
          <div className="w-px h-5 bg-violet-200 dark:bg-violet-700"></div>
          <div className="text-center">
            <div className="text-sm font-bold text-violet-700 dark:text-violet-400">{data.totalActivityDays}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">Total days</div>
          </div>
        </div>
      )}
    </div>
  );

  // Compact badge version (for mobile header or sidebar)
  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowFullStreakModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-105 flex-shrink-0 self-stretch"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.18)' }}
          title="View your streak"
        >
          <span className="text-base sm:text-lg">🔥</span>
          <span className="font-bold text-violet-700 dark:text-violet-300 text-sm sm:text-base">{data.currentStreak}</span>
        </button>

        {/* Full streak modal - shown when compact button is clicked on mobile */}
        {showFullStreakModal && createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowFullStreakModal(false)}
          >
            <div
              className="bg-white dark:bg-stone-900 rounded-2xl p-4 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowFullStreakModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors z-20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {fullStreakContent(() => setShowInfoModal(true))}
            </div>
          </div>,
          document.body
        )}

        {/* Info modal - shown when "How to earn a streak" is clicked from within full streak */}
        {showInfoModal && createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
            onClick={() => setShowInfoModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
              style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #FFFFFF 32%)' }}
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
                className="w-full mt-6 py-3 rounded-full font-semibold text-white transition-all bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25"
              >
                Got it!
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Full widget version - show loading skeleton when loading (compact)
  if (loading) {
    return (
      <div className="rounded-xl p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 animate-pulse">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="w-6 h-6 bg-stone-200 dark:bg-stone-600 rounded-full"></span>
          <span className="w-6 h-6 bg-stone-200 dark:bg-stone-600 rounded"></span>
        </div>
        <div className="h-3 bg-stone-200 dark:bg-stone-600 rounded w-2/3 mx-auto mb-3"></div>
        <div className="bg-white dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 p-2">
          <div className="flex justify-between">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-4 h-4 rounded-full bg-stone-200 dark:bg-stone-600"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {fullStreakContent(() => setShowInfoModal(true))}

      {/* Info Modal - rendered via portal to avoid layout/z-index issues */}
      {showInfoModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #FFFFFF 32%)' }}
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
              className="w-full mt-6 py-3 rounded-full font-semibold text-white transition-all bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25"
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
