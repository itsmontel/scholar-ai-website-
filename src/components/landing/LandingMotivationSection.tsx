import { Suspense, lazy } from 'react';
import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

const BadgeCreature = lazy(() => import('../common/BadgeCreature'));

interface LandingMotivationSectionProps {
  onNavigate: (page: string) => void;
}

const BADGE_PREVIEW = [
  { badgeId: 'first_login', unlocked: true },
  { badgeId: 'brain_spark', unlocked: true },
  { badgeId: 'citation_hunter', unlocked: true },
  { badgeId: 'streak_starter', unlocked: false },
  { badgeId: 'premium_pioneer', unlocked: true },
  { badgeId: 'streak_legend', unlocked: false },
  { badgeId: 'monthly_master', unlocked: true },
  { badgeId: 'night_owl', unlocked: false },
] as const;

export default function LandingMotivationSection({ onNavigate }: LandingMotivationSectionProps) {
  return (
    <section
      id="motivation"
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-20"
    >
      <LandingSectionBackdrop
        base="bg-[#FFF4E0] dark:bg-[#2A1800]"
        topFrom="from-[#FCFBF7]/80 dark:from-stone-950/80"
        bottomTo="from-[#FCFBF7]/80 dark:from-stone-950/80"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,150,0,0.10),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#FF9600]/45 bg-[#FFF4E0] dark:bg-[#FF9600]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(255,150,0,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9600] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9600]" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#9A5500] dark:text-[#FFCF70]">
                The habit loop that keeps grades up
              </span>
            </div>
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Studying that{' '}
              <span className="relative inline-block text-[#FF9600]">
                actually sticks.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#FF9600]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 6 Q50 1 100 5 T198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#777] dark:text-stone-300 leading-relaxed max-w-2xl mx-auto">
              Most students give up after week two. WriteScholar&apos;s streak + XP system makes studying the easy choice, so you actually show up the day before the test.
            </p>
          </div>

          <div className="relative rounded-3xl border-2 border-[#FFCF70]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(255,150,0,0.30)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#FF9600]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#58CC02]/12 blur-3xl" aria-hidden />

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Daily Review */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden shadow-[0_8px_28px_-10px_rgba(88,204,2,0.35)]">
                <span className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#58CC02] to-[#46A302]" aria-hidden />
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#58CC02]/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#58CC02] flex items-center justify-center mb-4 border-2 border-b-4 border-[#46A302]">
                    <span className="text-xl" aria-hidden>📚</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Daily Review
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    10 minutes a day beats 4 hours of cramming. Your personalised drill from saved notes, built around what you keep getting wrong.
                  </p>
                  <div className="hidden sm:block rounded-xl bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 border-2 border-[#58CC02]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#58CC02] flex items-center justify-center">
                        <span className="text-white text-[10px] font-extrabold">1</span>
                      </div>
                      <span className="text-xs font-bold text-[#3C3C3C] dark:text-stone-200">Today&apos;s Session</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#58CC02]/20 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-[#58CC02]" />
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 font-medium">3 of 5 questions done</p>
                  </div>
                </div>
              </div>

              {/* XP & Levels */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden shadow-[0_8px_28px_-10px_rgba(28,176,246,0.35)]">
                <span className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]" aria-hidden />
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#1CB0F6]/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] flex items-center justify-center mb-4 border-2 border-b-4 border-[#1899D6]">
                    <span className="text-xl" aria-hidden>⭐</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    XP & 100 Levels
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Every essay reviewed, every quiz aced, every streak day. They all stack into XP and levels you actually want to chase.
                  </p>
                  <div className="hidden sm:block rounded-xl bg-[#DDF4FF]/60 dark:bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1CB0F6] flex items-center justify-center border-b-2 border-[#1899D6]">
                        <span className="text-white text-[11px] font-extrabold">12</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#3C3C3C] dark:text-stone-200 truncate">Knowledge Keeper III</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-[#1CB0F6]/20 overflow-hidden">
                            <div className="h-full w-[42%] rounded-full bg-[#1CB0F6]" />
                          </div>
                          <span className="text-[8px] text-[#1CB0F6] font-bold tabular-nums">1,340 XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden shadow-[0_8px_28px_-10px_rgba(255,150,0,0.35)]">
                <span className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF9600] to-[#D97F00]" aria-hidden />
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#FF9600]/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF9600] flex items-center justify-center mb-4 border-2 border-b-4 border-[#D97F00]">
                    <span className="text-xl" aria-hidden>🔥</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Daily Streaks
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Your streak is your accountability. Miss a day and you&apos;ll feel it. That&apos;s how casual users become 4.0 students.
                  </p>
                  <div className="hidden sm:block rounded-xl bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 border-2 border-[#FF9600]/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>🔥</span>
                        <div>
                          <p className="text-lg font-extrabold text-[#FF9600]">14</p>
                          <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 -mt-0.5">day streak</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <div
                            key={`${d}-${i}`}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${
                              i < 6 ? 'bg-[#FF9600] text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-5 sm:p-6 hover:-translate-y-1 transition-all overflow-hidden shadow-[0_8px_28px_-10px_rgba(165,96,232,0.35)]">
                <span className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#A560E8] to-[#8A48C7]" aria-hidden />
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#A560E8] flex items-center justify-center mb-4 border-2 border-b-4 border-[#8A48C7]">
                    <span className="text-xl" aria-hidden>🏅</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    80+ Badges
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    Visible milestones turn &quot;I should study&quot; into &quot;I want my next badge.&quot; It works because it&apos;s stupid and you can&apos;t help it.
                  </p>
                  <div className="hidden sm:block rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 border-2 border-[#A560E8]/30 p-3">
                    <div className="grid grid-cols-4 gap-1.5">
                      {BADGE_PREVIEW.map((b) => (
                        <div
                          key={b.badgeId}
                          className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                            b.unlocked ? 'bg-[#A560E8]/20 dark:bg-[#A560E8]/25' : 'bg-stone-200/60 dark:bg-stone-700/40 opacity-40'
                          }`}
                        >
                          <Suspense fallback={<span className="text-sm">🏅</span>}>
                            <BadgeCreature badgeId={b.badgeId} unlocked={b.unlocked} size={36} />
                          </Suspense>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 text-center font-medium">5 of 80+ unlocked</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Review screenshot */}
            <div className="relative mt-10 sm:mt-12 max-w-4xl mx-auto">
              <div className="text-center mb-5 sm:mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-[#58CC02]/40 bg-[#E5F8D0] dark:bg-[#58CC02]/15 text-[#46A302] dark:text-[#58CC02] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
                  <span aria-hidden>📚</span>
                  Daily Review in action
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#58CC02]/20 to-[#46A302]/10 blur-3xl -z-10" aria-hidden />
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-b-4 border-[#46A302] shadow-[0_24px_50px_-18px_rgba(88,204,2,0.35)]">
                  <img
                    src="/daily-review-preview.png"
                    alt="WriteScholar Daily Review: personalised daily practice with multiple choice questions, progress tracking, and instant feedback"
                    className="w-full h-auto"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-[#777] dark:text-stone-400">
                Your daily practice session: questions pulled from your own study materials, with instant feedback and XP rewards.
              </p>
            </div>

            {/* Level-up preview */}
            <div className="mt-10 sm:mt-12 rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-5 sm:p-6 max-w-4xl mx-auto shadow-[0_8px_28px_-10px_rgba(28,176,246,0.30)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1CB0F6] flex items-center justify-center border-4 border-[#DDF4FF] dark:border-[#1CB0F6]/30 shadow-[0_0_20px_rgba(28,176,246,0.35)]">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">7</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1CB0F6] mb-0.5">Level up!</p>
                    <p className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      Curious Cat II
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Confetti, celebrations, and a new title every time you level up.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1CB0F6] text-white font-extrabold text-sm border-2 border-b-4 border-[#1899D6] hover:bg-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                >
                  Start earning XP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
