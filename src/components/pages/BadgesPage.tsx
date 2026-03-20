import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';
import BadgeCreature from '../common/BadgeCreature';
import {
  BADGES, Badge, getUnlockedBadges, getTotalXP, getLevelInfo,
  getUnlockedCount, getRarityColor, getCategoryLabel, getStats, trackBadgesVisit
} from '../../data/achievements';

interface BadgesPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const BadgesPage = ({ onNavigate, user, onLogout }: BadgesPageProps) => {
  const [filter, setFilter] = useState<'all' | 'getting-started' | 'streak' | 'mastery' | 'subscription' | 'special'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [totalXP, setTotalXP] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    trackBadgesVisit();
    setUnlocked(getUnlockedBadges());
    setTotalXP(getTotalXP());
    setUnlockedCount(getUnlockedCount());
  }, []);

  const levelInfo = getLevelInfo(totalXP);
  const stats = getStats();

  const filteredBadges = filter === 'all' ? BADGES : BADGES.filter(b => b.category === filter);
  const categories: Array<'all' | 'getting-started' | 'streak' | 'mastery' | 'subscription' | 'special'> = ['all', 'getting-started', 'streak', 'mastery', 'subscription', 'special'];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="badges" />

      <div className="h-1 bg-gradient-to-r from-amber-400 via-violet-500 to-purple-500" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Hero section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 sm:p-10 mb-10 shadow-2xl shadow-violet-500/20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-violet-300/10 rounded-full blur-3xl rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🏆</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Achievements</h1>
              </div>
              <p className="text-violet-200 text-base mt-1">Collect badges, earn XP, and level up your scholar journey</p>

              {/* Level & XP */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full backdrop-blur-sm">
                  <span className="text-amber-300 font-black text-lg">Lv.{levelInfo.level}</span>
                  <span className="text-white/80 text-sm font-medium">{levelInfo.name}</span>
                </div>
                <div className="text-white/70 text-sm font-medium">{totalXP} XP total</div>
              </div>

              {/* XP progress bar */}
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-xs text-violet-200 mb-1.5">
                  <span>Level {levelInfo.level}</span>
                  <span>{levelInfo.level < 7 ? `${levelInfo.nextLevelXP} XP to next level` : 'Max Level!'}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-1000 ease-out shadow-lg shadow-amber-400/30"
                    style={{ width: `${Math.max(levelInfo.progress * 100, 4)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats panel */}
            <div className="flex gap-4 sm:gap-6">
              <div className="text-center px-4 py-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="text-2xl font-black text-white">{unlockedCount}</div>
                <div className="text-xs text-violet-200">Unlocked</div>
              </div>
              <div className="text-center px-4 py-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="text-2xl font-black text-white">{BADGES.length}</div>
                <div className="text-xs text-violet-200">Total</div>
              </div>
              <div className="text-center px-4 py-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-300">{totalXP}</div>
                <div className="text-xs text-violet-200">XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === cat
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600'
              }`}
            >
              {cat === 'all' ? 'All Badges' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredBadges.map(badge => {
            const isUnlocked = !!unlocked[badge.id];
            const rarity = getRarityColor(badge.rarity);

            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                  isUnlocked
                    ? `bg-white dark:bg-stone-800 ${rarity.border} hover:shadow-xl hover:-translate-y-1 ${rarity.glow ? `shadow-lg ${rarity.glow}` : 'shadow-md'}`
                    : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                {/* Rarity badge */}
                {isUnlocked && (
                  <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase ${rarity.bg} ${rarity.text}`}>
                    {badge.rarity}
                  </span>
                )}

                {/* Creature */}
                <div className="flex justify-center mb-3 mt-1">
                  <BadgeCreature badgeId={badge.id} unlocked={isUnlocked} size={64} />
                </div>

                {/* Name */}
                <h3 className={`font-bold text-sm leading-tight ${
                  isUnlocked ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {badge.name}
                </h3>

                {/* Creature name */}
                <p className={`text-[11px] mt-0.5 font-medium ${
                  isUnlocked ? 'text-violet-500 dark:text-violet-400' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {isUnlocked ? badge.creatureName : '???'}
                </p>

                {/* XP */}
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isUnlocked
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                }`}>
                  +{badge.xp} XP
                </div>

                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-1 bg-stone-800/80 dark:bg-stone-900/90 text-white text-[10px] font-medium rounded-lg backdrop-blur-sm">
                      {badge.conditionText}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats breakdown */}
        <div className="mt-12 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: 'Documents', value: stats.uploads_count, icon: '📄' },
              { label: 'Analyses', value: stats.analyses_count, icon: '🔍' },
              { label: 'Study Packs', value: (stats as any).study_packs_count || 0, icon: '📚' },
              { label: 'Summaries', value: stats.summaries_count, icon: '📋' },
              { label: 'Citations', value: stats.citations_count, icon: '🔗' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-700/50">
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{stat.value}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* Badge detail modal */}
      {selectedBadge && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white dark:bg-stone-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Decorative background */}
            <div className={`absolute inset-0 opacity-10 ${unlocked[selectedBadge.id] ? 'bg-gradient-to-br from-violet-500 to-amber-500' : 'bg-stone-400'}`} />

            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="relative z-10 text-center">
              {/* Creature */}
              <div className="flex justify-center mb-4">
                <BadgeCreature badgeId={selectedBadge.id} unlocked={!!unlocked[selectedBadge.id]} size={100} />
              </div>

              {/* Rarity */}
              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${getRarityColor(selectedBadge.rarity).bg} ${getRarityColor(selectedBadge.rarity).text}`}>
                {selectedBadge.rarity}
              </span>

              {/* Name */}
              <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mt-3">{selectedBadge.name}</h2>
              <p className="text-violet-500 dark:text-violet-400 font-medium mt-1">
                {unlocked[selectedBadge.id] ? selectedBadge.creatureName : '???'}
              </p>

              {/* Description */}
              <p className="text-stone-600 dark:text-stone-400 mt-3">{selectedBadge.description}</p>

              {/* XP reward */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <span className="text-amber-600 dark:text-amber-400 font-bold">+{selectedBadge.xp} XP</span>
              </div>

              {/* Status */}
              <div className="mt-6">
                {unlocked[selectedBadge.id] ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Unlocked {new Date(unlocked[selectedBadge.id]).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-stone-100 dark:bg-stone-700 rounded-xl">
                    <p className="text-sm text-stone-600 dark:text-stone-300 font-medium">How to unlock:</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{selectedBadge.conditionText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes creature-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes creature-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes creature-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes creature-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>
    </div>
  );
};

export default BadgesPage;
