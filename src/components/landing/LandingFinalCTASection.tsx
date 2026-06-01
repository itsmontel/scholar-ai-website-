import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingFinalCTASectionProps {
  onNavigate: (page: string) => void;
}

const STATS = [
  { value: '50K+', desc: 'Students worldwide' },
  { value: '92%', desc: 'of frequent active users reported better grades' },
] as const;

export default function LandingFinalCTASection({ onNavigate }: LandingFinalCTASectionProps) {
  return (
    <section
      id="final-cta"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-20"
      aria-labelledby="landing-final-cta-heading"
    >
      <LandingSectionBackdrop
        base="bg-[#F5F4F0] dark:bg-stone-900"
        topFrom="from-[#FCFBF7]/90 dark:from-stone-950/90"
        radial="bg-[radial-gradient(ellipse_80%_55%_at_50%_100%,rgba(165,96,232,0.08),transparent_65%)]"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <h2
            id="landing-final-cta-heading"
            className="max-w-2xl text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            The trusted{' '}
            <span className="relative inline-block text-[#A560E8]">
              AI learning platform
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M2 6 Q50 1 100 5 T198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>{' '}
            for students.
          </h2>

          <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-start sm:items-stretch gap-8 sm:gap-16 lg:gap-24">
            {STATS.map((stat, i) => (
              <div
                key={stat.value}
                className={`relative ${i > 0 ? 'sm:border-l sm:border-stone-300 sm:dark:border-stone-600 sm:pl-10 lg:pl-14' : ''}`}
              >
                <p
                  className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tabular-nums text-stone-900 dark:text-stone-50 tracking-tight leading-none"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {stat.value}
                </p>
                <p className="mt-3 max-w-[14rem] text-sm sm:text-[15px] font-medium text-stone-600 dark:text-stone-400 leading-snug">
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-14 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="inline-flex items-center justify-center rounded-full bg-[#A560E8] px-10 py-4 text-base font-bold text-white shadow-[0_12px_32px_-8px_rgba(165,96,232,0.5)] transition-all hover:bg-[#9450D8] hover:-translate-y-0.5 sm:text-lg"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Start for free
            </button>
          </div>

          <p className="mt-5 text-center sm:text-left text-xs text-stone-500 dark:text-stone-500">
            No payment today · Cancel anytime · Secure checkout via Stripe
          </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
