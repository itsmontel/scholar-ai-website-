import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import BadgeCreature from '../common/BadgeCreature';
import {
  BADGES, Badge, getUnlockedBadges, getTotalXP, getLevelInfo,
  getUnlockedCount, getCategoryLabel, getStats, trackBadgesVisit
} from '../../data/achievements';

/* ═══════════════════════════════════════════════════════════════
   BadgesPage — Duolingo-style achievements page
   100 levels, 50+ badges, XP tracking, level progression
   ═══════════════════════════════════════════════════════════════ */

interface BadgesPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const RARITY_STYLES: Record<string, { bg: string; text: string; border: string; cardBg: string; pillBg: string }> = {
  common: {
    bg: 'bg-stone-100 dark:bg-stone-700',
    text: 'text-stone-600 dark:text-stone-300',
    border: 'border-stone-300 dark:border-stone-600',
    cardBg: 'bg-white dark:bg-stone-900',
    pillBg: 'bg-stone-100 dark:bg-stone-700',
  },
  uncommon: {
    bg: 'bg-[#EAFFD6] dark:bg-[#58CC02]/10',
    text: 'text-[#58CC02]',
    border: 'border-[#58CC02]/30',
    cardBg: 'bg-white dark:bg-stone-900',
    pillBg: 'bg-[#EAFFD6] dark:bg-[#58CC02]/10',
  },
  rare: {
    bg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10',
    text: 'text-[#A560E8]',
    border: 'border-[#A560E8]/30',
    cardBg: 'bg-white dark:bg-stone-900',
    pillBg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10',
  },
  epic: {
    bg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10',
    text: 'text-[#1CB0F6]',
    border: 'border-[#1CB0F6]/30',
    cardBg: 'bg-white dark:bg-stone-900',
    pillBg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10',
  },
  legendary: {
    bg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10',
    text: 'text-[#FF9600]',
    border: 'border-[#FF9600]/30',
    cardBg: 'bg-white dark:bg-stone-900',
    pillBg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10',
  },
};

const CATEGORY_STYLES: Record<string, { emoji: string; color: string; borderColor: string; bg: string }> = {
  all: { emoji: '🏆', color: '#A560E8', borderColor: '#8A48C7', bg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10' },
  'getting-started': { emoji: '🌱', color: '#58CC02', borderColor: '#46A302', bg: 'bg-[#EAFFD6] dark:bg-[#58CC02]/10' },
  streak: { emoji: '🔥', color: '#FF9600', borderColor: '#D97F00', bg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10' },
  mastery: { emoji: '⭐', color: '#1CB0F6', borderColor: '#1899D6', bg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10' },
  subscription: { emoji: '👑', color: '#FF9600', borderColor: '#D97F00', bg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10' },
  special: { emoji: '✨', color: '#FF4B4B', borderColor: '#E04343', bg: 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/10' },
};

const getLevelColor = (level: number) => {
  if (level >= 80) return { primary: '#FF9600', border: '#D97F00', bg: '#FFF4E0' };
  if (level >= 60) return { primary: '#A560E8', border: '#8A48C7', bg: '#F3EAFF' };
  if (level >= 40) return { primary: '#FF4B4B', border: '#E04343', bg: '#FFE8E8' };
  if (level >= 20) return { primary: '#1CB0F6', border: '#1899D6', bg: '#DDF4FF' };
  return { primary: '#58CC02', border: '#46A302', bg: '#EAFFD6' };
};

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
  const levelColors = getLevelColor(levelInfo.level);

  const filteredBadges = filter === 'all' ? BADGES : BADGES.filter(b => b.category === filter);
  const categories: Array<'all' | 'getting-started' | 'streak' | 'mastery' | 'subscription' | 'special'> = ['all', 'getting-started', 'streak', 'mastery', 'subscription', 'special'];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-stone-950 font-sans">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="badges" />

      <style>{`
        @keyframes badgeFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes badgePop { 0% { transform: scale(0.85); } 60% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes xpShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .badge-fade { animation: badgeFadeUp 0.4s ease-out both; }
        .badge-pop { animation: badgePop 0.4s ease-out; }
        .badge-stagger > * { opacity: 0; animation: badgeFadeUp 0.35s ease-out forwards; }
        .badge-stagger > *:nth-child(1) { animation-delay: 0.03s; }
        .badge-stagger > *:nth-child(2) { animation-delay: 0.06s; }
        .badge-stagger > *:nth-child(3) { animation-delay: 0.09s; }
        .badge-stagger > *:nth-child(4) { animation-delay: 0.12s; }
        .badge-stagger > *:nth-child(5) { animation-delay: 0.15s; }
        .badge-stagger > *:nth-child(6) { animation-delay: 0.18s; }
        .badge-stagger > *:nth-child(7) { animation-delay: 0.21s; }
        .badge-stagger > *:nth-child(8) { animation-delay: 0.24s; }
        .badge-stagger > *:nth-child(9) { animation-delay: 0.27s; }
        .badge-stagger > *:nth-child(10) { animation-delay: 0.30s; }
        .badge-serif { font-family: 'Nunito', system-ui, sans-serif; }
        .xp-shine {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: xpShine 3s ease-in-out infinite;
        }
      `}</style>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16">
        {/* ── Back button ── */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold text-stone-500 dark:text-stone-400 hover:text-[#A560E8] bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/30 active:border-b-2 active:translate-y-0.5 transition-all mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Dashboard
        </button>

        {/* ═══════════════════════════════════════════════════════════════
            HERO — Level & XP overview
           ═══════════════════════════════════════════════════════════════ */}
        <section className="badge-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden mb-8">
          {/* Top band */}
          <div className="relative px-6 sm:px-8 pt-7 pb-6" style={{ backgroundColor: levelColors.bg }}>
            {/* Mascot */}
            <img
              src="/mascot-celebrating.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="hidden sm:block absolute -top-1 -right-1 w-20 lg:w-24 h-auto opacity-90 pointer-events-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Level circle */}
              <div
                className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-4 bg-white dark:bg-stone-900"
                style={{ borderColor: levelColors.primary, boxShadow: `0 0 20px ${levelColors.primary}30` }}
              >
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-extrabold leading-none" style={{ color: levelColors.primary }}>
                    {levelInfo.level}
                  </p>
                  <p className="text-[8px] font-extrabold uppercase tracking-wider text-stone-400 mt-0.5">Level</p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl" aria-hidden>🏆</span>
                  <h1 className="badge-serif text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight">
                    Achievements
                  </h1>
                </div>
                <p className="badge-serif text-base sm:text-lg font-extrabold leading-tight" style={{ color: levelColors.primary }}>
                  {levelInfo.name}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">
                  Collect badges, earn XP, and level up your scholar journey
                </p>

                {/* XP bar */}
                <div className="mt-3 max-w-md">
                  <div className="flex justify-between text-[10px] font-extrabold mb-1">
                    <span style={{ color: levelColors.primary }}>{totalXP} XP</span>
                    <span className="text-stone-400 dark:text-stone-500">
                      {levelInfo.progress < 1 ? `${levelInfo.nextLevelXP} XP to Level ${levelInfo.level + 1}` : 'Max level reached!'}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden border-2 border-stone-300/50 dark:border-stone-600/50">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(levelInfo.progress * 100, 3)}%`,
                        backgroundColor: levelColors.primary,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="px-6 sm:px-8 py-4 flex flex-wrap gap-3 sm:gap-4 border-t-2 border-stone-200 dark:border-stone-700">
            {[
              { label: 'Badges', value: unlockedCount, total: BADGES.length, emoji: '🏅', color: '#A560E8' },
              { label: 'Total XP', value: totalXP, emoji: '⚡', color: '#FF9600' },
              { label: 'Level', value: levelInfo.level, emoji: '📊', color: '#1CB0F6' },
              { label: 'Streak', value: stats.longest_streak, emoji: '🔥', color: '#FF4B4B' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 min-w-[100px] rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-3 py-2.5 text-center"
              >
                <span className="text-lg" aria-hidden>{stat.emoji}</span>
                <p className="badge-serif text-xl font-extrabold leading-none mt-1" style={{ color: stat.color }}>
                  {stat.value}
                  {'total' in stat && stat.total && (
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500">/{stat.total}</span>
                  )}
                </p>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORY FILTERS
           ═══════════════════════════════════════════════════════════════ */}
        <div className="badge-fade mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
          <div className="inline-flex gap-2 p-1">
            {categories.map((cat) => {
              const active = filter === cat;
              const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.all;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-extrabold whitespace-nowrap transition-all ${
                    active
                      ? `text-white border-2 border-b-4 active:border-b-2 active:translate-y-0.5`
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-stone-300 active:border-b-2 active:translate-y-0.5'
                  }`}
                  style={active ? { backgroundColor: style.color, borderColor: style.borderColor } : undefined}
                >
                  <span className="text-sm" aria-hidden>{style.emoji}</span>
                  <span className="badge-serif">{cat === 'all' ? 'All Badges' : getCategoryLabel(cat)}</span>
                  {active && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold">
                      {cat === 'all' ? BADGES.length : BADGES.filter(b => b.category === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BADGE GRID
           ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 badge-stagger">
          {filteredBadges.map((badge) => {
            const isUnlocked = !!unlocked[badge.id];
            const rs = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;

            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                className={`group relative rounded-2xl border-2 border-b-4 p-3.5 sm:p-4 text-center transition-all active:border-b-2 active:translate-y-0.5 ${
                  isUnlocked
                    ? `${rs.cardBg} ${rs.border} hover:shadow-lg`
                    : 'bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                {/* Rarity pill */}
                {isUnlocked && (
                  <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[7px] font-extrabold rounded-md uppercase tracking-wide ${rs.pillBg} ${rs.text} border ${rs.border}`}>
                    {badge.rarity}
                  </span>
                )}

                {/* Creature */}
                <div className={`flex justify-center mb-2.5 mt-1 ${isUnlocked ? 'group-hover:scale-110' : 'opacity-40'} transition-transform`}>
                  <BadgeCreature badgeId={badge.id} unlocked={isUnlocked} size={56} />
                </div>

                {/* Name */}
                <h3 className={`badge-serif font-extrabold text-[13px] leading-tight ${
                  isUnlocked ? 'text-stone-800 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {badge.name}
                </h3>

                {/* Creature name */}
                <p className={`text-[10px] mt-0.5 font-bold ${
                  isUnlocked ? rs.text : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {isUnlocked ? badge.creatureName : '???'}
                </p>

                {/* XP pill */}
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border ${
                  isUnlocked
                    ? `${rs.pillBg} ${rs.text} ${rs.border}`
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-600'
                }`}>
                  +{badge.xp} XP
                </div>

                {/* Hover tooltip for locked badges */}
                {!isUnlocked && (
                  <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="block px-2 py-1.5 bg-stone-800 dark:bg-stone-700 text-white text-[9px] font-bold rounded-lg shadow-lg leading-snug">
                      {badge.conditionText}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            YOUR PROGRESS — Stats breakdown
           ═══════════════════════════════════════════════════════════════ */}
        <section className="badge-fade mt-10 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b-2 border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1CB0F6] text-white text-sm border-b-2 border-[#1899D6]" aria-hidden>
                📊
              </span>
              <h2 className="badge-serif text-lg font-extrabold text-stone-800 dark:text-stone-100">Your Progress</h2>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-bold pl-0.5">
              Stats from your WriteScholar journey
            </p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Documents', value: stats.uploads_count, emoji: '📄', color: '#58CC02' },
              { label: 'Analyses', value: stats.analyses_count, emoji: '📝', color: '#FF4B4B' },
              { label: 'Study Packs', value: (stats as any).study_packs_count || 0, emoji: '📦', color: '#FF9600' },
              { label: 'Citations', value: stats.citations_count, emoji: '📚', color: '#1CB0F6' },
              { label: 'Summaries', value: stats.summaries_count, emoji: '📋', color: '#A560E8' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3 text-center"
              >
                <span className="text-xl" aria-hidden>{stat.emoji}</span>
                <p className="badge-serif text-2xl font-extrabold leading-none mt-1.5" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500 mt-1.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* ═══════════════════════════════════════════════════════════════
          BADGE DETAIL MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {selectedBadge && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="badge-pop bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 max-w-sm w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top band with rarity color */}
            {(() => {
              const rs = RARITY_STYLES[selectedBadge.rarity] || RARITY_STYLES.common;
              const isUnl = !!unlocked[selectedBadge.id];
              return (
                <>
                  <div className={`relative px-6 pt-7 pb-5 text-center ${isUnl ? rs.bg : 'bg-stone-100 dark:bg-stone-800'}`}>
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBadge(null)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border-2 border-b-4 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 flex items-center justify-center active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Creature */}
                    <div className="flex justify-center mb-3">
                      <div className={isUnl ? '' : 'opacity-40'}>
                        <BadgeCreature badgeId={selectedBadge.id} unlocked={isUnl} size={88} />
                      </div>
                    </div>

                    {/* Rarity pill */}
                    <span className={`inline-flex items-center px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${rs.pillBg} ${rs.text} border-2 ${rs.border}`}>
                      {selectedBadge.rarity}
                    </span>
                  </div>

                  <div className="px-6 py-5 text-center">
                    {/* Name */}
                    <h2 className="badge-serif text-2xl font-extrabold text-stone-800 dark:text-stone-100">
                      {selectedBadge.name}
                    </h2>
                    <p className={`text-sm font-bold mt-1 ${isUnl ? rs.text : 'text-stone-400 dark:text-stone-500'}`}>
                      {isUnl ? selectedBadge.creatureName : '???'}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-3 font-bold leading-relaxed">
                      {selectedBadge.description}
                    </p>

                    {/* XP reward */}
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4 ${rs.border} ${rs.pillBg}`}>
                      <span className="text-base" aria-hidden>⚡</span>
                      <span className={`text-sm font-extrabold ${rs.text}`}>+{selectedBadge.xp} XP</span>
                    </div>

                    {/* Status */}
                    <div className="mt-5">
                      {isUnl ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-[#58CC02]/30">
                          <svg className="w-5 h-5 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-extrabold text-[#58CC02]">
                            Unlocked {new Date(unlocked[selectedBadge.id]).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 px-4 py-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 mb-1">
                            How to unlock
                          </p>
                          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                            {selectedBadge.conditionText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBadge(null)}
                      className="mt-5 w-full rounded-xl py-3 text-sm font-extrabold uppercase tracking-wide text-white border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all"
                      style={{ backgroundColor: isUnl ? getLevelColor(levelInfo.level).primary : '#78716c', borderColor: isUnl ? getLevelColor(levelInfo.level).border : '#57534e' }}
                    >
                      {isUnl ? 'Awesome!' : 'Got it'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BadgesPage;
