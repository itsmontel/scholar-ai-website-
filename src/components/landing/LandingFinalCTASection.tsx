import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingFinalCTASectionProps {
  onNavigate: (page: string) => void;
}

export default function LandingFinalCTASection({ onNavigate }: LandingFinalCTASectionProps) {
  return (
    <section
      id="final-cta"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-20"
      aria-labelledby="landing-final-cta-heading"
    >
      <LandingSectionBackdrop
        base="bg-[#F3EAFF] dark:bg-[#1A0B2E]"
        topFrom="from-[#FCFBF7]/90 dark:from-stone-950/90"
        radial="bg-[radial-gradient(ellipse_80%_55%_at_50%_100%,rgba(165,96,232,0.10),transparent_65%)]"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
              <span className="text-[#FFC800] text-sm" aria-hidden>
                ⚡
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                Ready when you are
              </span>
            </div>
            <h2
              id="landing-final-cta-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Better essays. Smarter studying.{' '}
              <span className="relative inline-block text-[#A560E8]">
                All in one app.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 6 Q50 1 100 5 T198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#777] dark:text-stone-300 leading-relaxed max-w-2xl mx-auto">
              Join <span className="font-extrabold text-[#58CC02]">50,000+ students</span> writing sharper essays and acing their coursework. Free to start, no payment today.
            </p>
          </div>

          <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#58CC02]/12 blur-3xl" aria-hidden />

            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-b-4 border-[#7733B5] bg-gradient-to-br from-[#A560E8] via-[#8A48C7] to-[#7733B5] px-6 py-10 sm:px-10 sm:py-12 text-center shadow-[0_16px_40px_-12px_rgba(165,96,232,0.55)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.14),transparent_70%)]" aria-hidden />
              <div className="pointer-events-none absolute -bottom-16 -right-12 w-56 h-56 rounded-full bg-[#7733B5]/40 blur-3xl" aria-hidden />

              <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-6">
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#7733B5] font-extrabold rounded-xl border-2 border-b-4 border-[#E5E5E5] hover:bg-[#FAF7FF] active:border-b-2 active:translate-y-0.5 transition-all text-base sm:text-[17px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.20)]"
                >
                  Get started free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="inline-flex items-center justify-center px-7 py-4 border-2 border-b-4 border-white/40 text-white font-extrabold rounded-xl hover:bg-white/10 active:border-b-2 active:translate-y-0.5 transition-all text-base"
                >
                  View pricing
                </button>
              </div>

              <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-white/90">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No payment today
                </span>
                <span className="text-white/35" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </span>
                <span className="text-white/35" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a3 3 0 00-6 0v4" />
                  </svg>
                  Secure checkout via Stripe
                </span>
              </div>
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
