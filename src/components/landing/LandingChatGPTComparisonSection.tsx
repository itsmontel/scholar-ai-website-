import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingChatGPTComparisonSectionProps {
  onNavigate: (page: string) => void;
}

const WRITESCHOLAR_POINTS = [
  'Graded to a real rubric: /100, letter band, every category scored',
  'Line-by-line feedback mapped to your exact sentences in a real editor',
  'One-click apply fixes into your draft, then export clean Word when you\'re done',
  'Paste notes → flashcards, quizzes, lessons & study packs in under a minute',
  'Arcade mode (Word Blitz & Crater Blast) makes revision actually stick',
  'Daily review, XP, streaks & badges: the habit loop students love',
] as const;

const CHATGPT_POINTS = [
  'Generic praise with no consistent rubric, score, or grade',
  'One block of advice you hunt down in your draft yourself',
  'Copy-paste back and forth between a chat box and your doc',
  'Won\'t turn your notes into flashcards, quizzes, or study packs',
  'No Word Blitz, Crater Blast, or arcade mode to make revision fun',
  'No daily review, XP, streaks, or badges. Just another chat thread',
] as const;

export default function LandingChatGPTComparisonSection({ onNavigate }: LandingChatGPTComparisonSectionProps) {
  return (
    <section
      id="why-writescholar"
      aria-labelledby="why-writescholar-heading"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-24"
    >
      <LandingSectionBackdrop
        base="bg-[#FCFBF7] dark:bg-stone-950"
        topFrom="from-[#FFF4E0]/70 dark:from-[#2A1800]/70"
        bottomTo="from-[#FFF4E0]/70 dark:from-[#2A1800]/70"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.08),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
              <svg className="w-3.5 h-3.5 text-[#A560E8]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                Why WriteScholar
              </span>
            </div>
            <h2
              id="why-writescholar-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              <span className="relative inline-block text-[#A560E8]">
                Not another AI chatbot
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
              ChatGPT is a general chat box. WriteScholar is a full academic workspace: essay feedback, a real editor, study packs, arcade mode, and daily review in one place.
            </p>
          </div>

          <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#58CC02]/12 blur-3xl" aria-hidden />

            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-stone-900 border-2 border-b-4 border-[#A560E8] text-[#7733B5] dark:text-[#C9A0F0] text-sm font-extrabold shadow-[0_8px_22px_-8px_rgba(165,96,232,0.5)]">
                VS
              </span>
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <div className="relative rounded-2xl border-2 border-b-4 border-[#7733B5] bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white p-5 sm:p-8 shadow-[0_16px_40px_-12px_rgba(165,96,232,0.60)] overflow-hidden">
                <div aria-hidden className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-white/30" />
                <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 border-2 border-white/25 flex items-center justify-center">
                      <img src="/main-logo.png" alt="" aria-hidden className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      WriteScholar
                    </span>
                  </div>
                  <span className="hidden sm:inline-flex shrink-0 rounded-full bg-white/20 border-2 border-white/25 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider">
                    Full study workspace
                  </span>
                </div>
                <ul className="space-y-0">
                  {WRITESCHOLAR_POINTS.map((t, i) => (
                    <li key={t} className={`flex items-start gap-3 py-2.5 sm:py-3 ${i > 0 ? 'border-t border-white/15' : ''}`}>
                      <span className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 border border-white/25">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-[13px] sm:text-[14.5px] font-bold leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-8 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.12)]">
                <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border-2 border-[#E5E5E5] dark:border-stone-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-stone-500 dark:text-stone-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M22.28 9.82a5.99 5.99 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.9A6 6 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.99 5.99 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.9A6 6 0 0 0 19.02 19.8a5.99 5.99 0 0 0 4-2.9 6.05 6.05 0 0 0-.74-7.08Zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .4-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.5 4.49ZM3.6 18.2a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.07l-4.83 2.79a4.5 4.5 0 0 1-6.14-1.65ZM2.34 7.9a4.49 4.49 0 0 1 2.34-1.97v5.68a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L3.96 14a4.5 4.5 0 0 1-1.62-6.1Zm16.6 3.86-5.84-3.39 2.02-1.16a.07.07 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.67a.78.78 0 0 0-.4-.67Zm2.01-3.03-.14-.08-4.77-2.78a.78.78 0 0 0-.79 0L9.43 9.24V6.91a.07.07 0 0 1 .03-.07l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66ZM8.33 12.86 6.3 11.7a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.72 5.46a.78.78 0 0 0-.4.68ZM9.43 10.5 12.03 9l2.6 1.5v3l-2.6 1.5-2.6-1.5Z" />
                    </svg>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-stone-700 dark:text-stone-200" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    ChatGPT
                  </span>
                </div>
                <ul className="space-y-0">
                  {CHATGPT_POINTS.map((t, i) => (
                    <li key={t} className={`flex items-start gap-3 py-2.5 sm:py-3 ${i > 0 ? 'border-t border-stone-200 dark:border-stone-800' : ''}`}>
                      <span className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-200/70 dark:bg-stone-800">
                        <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <span className="text-[13px] sm:text-[14.5px] font-semibold leading-snug text-stone-500 dark:text-stone-400">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-base sm:text-lg font-extrabold uppercase tracking-wide px-8 py-4 border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_24px_-8px_rgba(165,96,232,0.50)]"
            >
              Try WriteScholar free
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="text-[12px] sm:text-xs font-bold text-[#AFAFAF] dark:text-stone-500">No credit card · Free plan included</p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
