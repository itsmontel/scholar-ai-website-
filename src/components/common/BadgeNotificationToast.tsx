import { useState, useEffect } from 'react';
import { BADGES } from '../../data/achievements';

interface BadgeNotificationToastProps {
  onNavigate: (page: string) => void;
}

const BadgeNotificationToast = ({ onNavigate }: BadgeNotificationToastProps) => {
  const [notification, setNotification] = useState<{ id: string; name: string; xp: number } | null>(null);

  useEffect(() => {
    const handleBadgeUnlocked = (e: CustomEvent<string[]>) => {
      const badgeIds = e.detail;
      if (badgeIds.length === 0) return;
      const badge = BADGES.find(b => b.id === badgeIds[0]);
      if (badge) {
        setNotification({ id: badge.id, name: badge.name, xp: badge.xp });
        setTimeout(() => setNotification(null), 4000);
      }
    };

    window.addEventListener('writescholar-badge-unlocked', handleBadgeUnlocked as EventListener);
    return () => window.removeEventListener('writescholar-badge-unlocked', handleBadgeUnlocked as EventListener);
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed left-3 right-3 sm:left-auto sm:right-6 z-[9999] animate-[badge-toast-in_0.5s_ease-out] bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      <button
        onClick={() => { setNotification(null); onNavigate('badges'); }}
        className="w-full sm:w-auto flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 min-h-[44px] sm:min-h-0 bg-white dark:bg-stone-800 rounded-xl sm:rounded-2xl shadow-2xl shadow-violet-500/20 border-2 border-violet-300 dark:border-violet-600 active:scale-[0.98] sm:hover:shadow-violet-500/30 sm:hover:scale-[1.02] transition-all touch-manipulation"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-[badge-icon-pop_0.6s_ease-out] flex-shrink-0">
          <span className="text-xl sm:text-2xl">🏆</span>
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-[10px] sm:text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider">Badge Unlocked!</div>
          <div className="font-bold text-stone-800 dark:text-stone-100 text-sm truncate">{notification.name}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">+{notification.xp} XP</div>
        </div>
        <svg className="w-4 h-4 text-stone-400 ml-1 sm:ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
      <style>{`
        @keyframes badge-toast-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); }
          60% { transform: translateY(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes badge-icon-pop {
          0% { transform: scale(0) rotate(-20deg); }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default BadgeNotificationToast;
