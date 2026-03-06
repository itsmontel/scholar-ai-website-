import { useState, useEffect, useRef } from 'react';
import { getTotalXP, getLevelInfo, getUnlockedCount, BADGES, getUnlockedBadges } from '../../data/achievements';

interface BadgeWidgetProps {
  onNavigate: (page: string) => void;
}

const BadgeWidget = ({ onNavigate }: BadgeWidgetProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTotalXP(getTotalXP());
    setUnlockedCount(getUnlockedCount());
  }, []);

  const levelInfo = getLevelInfo(totalXP);

  const recentBadge = (() => {
    const unlocked = getUnlockedBadges();
    const entries = Object.entries(unlocked).sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime());
    if (entries.length === 0) return null;
    return BADGES.find(b => b.id === entries[0][0]) || null;
  })();

  return (
    <div className="relative" ref={tooltipRef}>
      <button
        onClick={() => onNavigate('badges')}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/60 dark:border-amber-700/40 hover:shadow-lg hover:shadow-amber-500/15 hover:border-amber-300 dark:hover:border-amber-600 hover:-translate-y-0.5 transition-all duration-300 group"
      >
        {/* Animated trophy icon */}
        <div className="relative">
          <span className="text-xl group-hover:animate-[badge-bounce_0.6s_ease-in-out]">🏆</span>
          {unlockedCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unlockedCount}
            </span>
          )}
        </div>

        {/* Level indicator */}
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Lv.{levelInfo.level}</span>
          <span className="text-[9px] text-stone-500 dark:text-stone-400 font-medium">{totalXP} XP</span>
        </div>

        {/* Mini XP progress */}
        <div className="hidden sm:block w-12 h-1.5 bg-amber-200/50 dark:bg-amber-800/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(levelInfo.progress * 100, 8)}%` }}
          />
        </div>
      </button>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl shadow-stone-900/10 dark:shadow-black/30 border border-stone-200/60 dark:border-stone-700/60 p-4 z-50 animate-[tooltip-in_0.2s_ease-out]">
          {/* Level */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/30">
              {levelInfo.level}
            </div>
            <div>
              <div className="font-bold text-sm text-stone-800 dark:text-stone-100">{levelInfo.name}</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">{totalXP} / {levelInfo.level < 7 ? levelInfo.nextLevelXP : totalXP} XP</div>
            </div>
          </div>

          {/* XP bar */}
          <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
              style={{ width: `${Math.max(levelInfo.progress * 100, 4)}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-3">
            <span>{unlockedCount}/{BADGES.length} badges</span>
            <span>{totalXP} XP earned</span>
          </div>

          {/* Recent badge */}
          {recentBadge && (
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
              <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Latest Badge</div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <div className="font-semibold text-xs text-stone-700 dark:text-stone-200">{recentBadge.name}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">+{recentBadge.xp} XP</div>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-3 text-center">
            <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400">Click to view all badges →</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes badge-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-4px) rotate(-8deg); }
          60% { transform: translateY(-2px) rotate(4deg); }
        }
        @keyframes tooltip-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BadgeWidget;
