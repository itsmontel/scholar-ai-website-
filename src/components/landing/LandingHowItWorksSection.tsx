import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingHowItWorksSectionProps {
  onNavigate: (page: string) => void;
}

const STEPS = [
  {
    step: '1',
    title: 'Paste your work',
    desc: 'Drop in an essay draft for feedback, or paste any notes / textbook chapter for study tools.',
    mascot: '/mascot-paper.webp',
    border: 'border-[#A560E8]',
    borderInner: 'border-[#D8B4FE]',
    accent: 'bg-gradient-to-r from-[#A560E8] to-[#8A48C7]',
    badge: 'bg-[#A560E8]',
    badgeText: 'bg-[#F3EAFF] text-[#7733B5]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(165,96,232,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(165,96,232,0.60)]',
    glow: 'bg-[#A560E8]/15',
  },
  {
    step: '2',
    title: 'AI does the heavy lifting',
    desc: 'In under 60 seconds, get rubric-graded essay feedback or study tools generated from your notes.',
    mascot: '/mascot-laptop.webp',
    border: 'border-[#46A302]',
    borderInner: 'border-[#A8E06B]',
    accent: 'bg-gradient-to-r from-[#58CC02] to-[#46A302]',
    badge: 'bg-[#58CC02]',
    badgeText: 'bg-[#E5F8D0] text-[#2E7200]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(88,204,2,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(88,204,2,0.55)]',
    glow: 'bg-[#58CC02]/15',
  },
  {
    step: '3',
    title: 'Submit & ace it',
    desc: 'Hand in stronger essays. Walk into exams ready. Crush your next semester.',
    mascot: '/mascot-celebrating.webp',
    border: 'border-[#D97F00]',
    borderInner: 'border-[#FFCF70]',
    accent: 'bg-gradient-to-r from-[#FF9600] to-[#D97F00]',
    badge: 'bg-[#FF9600]',
    badgeText: 'bg-[#FFF4E0] text-[#9A5500]',
    shadow: 'shadow-[0_8px_28px_-10px_rgba(255,150,0,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(255,150,0,0.55)]',
    glow: 'bg-[#FF9600]/15',
  },
] as const;

export default function LandingHowItWorksSection({ onNavigate }: LandingHowItWorksSectionProps) {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-24"
    >
      <LandingSectionBackdrop
        base="bg-[#F3EAFF] dark:bg-[#1A0B2E]"
        topFrom="from-[#FCFBF7]/90 dark:from-stone-950/90"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.12),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A560E8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A560E8]" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                Here&apos;s how it works
              </span>
            </div>
            <h2
              id="how-it-works-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              <span className="block">Drop in your work.</span>
              <span className="relative inline-block mt-1 sm:mt-1.5 text-[#A560E8]">
                We do the rest.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 6 Q50 1 100 5 T198 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-base sm:text-xl text-[#777] dark:text-stone-300 leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              One paste. Three steps. Better grades.
            </p>
          </div>
        </LandingScrollReveal>

        <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#8A48C7]/12 blur-3xl" aria-hidden />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {STEPS.map((s, i) => (
              <LandingScrollReveal key={s.step} delayMs={i * 90}>
                <div
                  className={`group relative h-full rounded-2xl border-2 border-b-4 ${s.border} bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:-translate-y-1 active:border-b-2 active:translate-y-0.5 ${s.shadow}`}
                >
                  <span className={`absolute top-0 inset-x-0 h-1.5 ${s.accent}`} aria-hidden />
                  <div className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full ${s.glow} blur-2xl`} aria-hidden />

                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-sm font-extrabold ${s.badge}`}>
                        {s.step}
                      </span>
                      <div className="min-w-0">
                        <p className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${s.badgeText} mb-1.5`}>
                          Step {s.step}
                        </p>
                        <h3
                          className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-white leading-tight"
                          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                        >
                          {s.title}
                        </h3>
                      </div>
                    </div>

                    <div className={`relative rounded-2xl border-2 ${s.borderInner} bg-gradient-to-br from-[#FAF7FF] to-white dark:from-stone-800/60 dark:to-stone-900 aspect-[16/10] overflow-hidden flex items-center justify-center mb-4`}>
                      <img
                        src={s.mascot}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        decoding="async"
                        className="w-28 sm:w-36 h-auto drop-shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                      />
                    </div>

                    <p className="text-[14px] sm:text-[15px] text-[#777] dark:text-stone-400 leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </LandingScrollReveal>
            ))}
          </div>
        </div>

        <LandingScrollReveal delayMs={300}>
          <div className="mt-10 sm:mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold text-base border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_24px_-8px_rgba(165,96,232,0.50)]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Get started free
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
