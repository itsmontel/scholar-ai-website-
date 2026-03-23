import LandingSectionLayers from '../common/LandingSectionLayers';
import LandingScrollReveal from './LandingScrollReveal';
import InteractiveStudyPackDemo from './InteractiveStudyPackDemo';

interface LandingStudyPackSectionProps {
  onNavigate: (page: string) => void;
}

const FEATURES = [
  'Try the demo: paste notes and get three cards, a quiz, and a mini lesson',
  'Crossword and Crater Blast on Pro for exam-style practice',
  'Use alongside professor-style essay feedback when you revise drafts',
];

export default function LandingStudyPackSection({ onNavigate }: LandingStudyPackSectionProps) {
  return (
    <section
      className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800 scroll-mt-20"
      aria-labelledby="landing-study-pack-heading"
      id="study-pack"
    >
      <LandingSectionLayers variant="faq" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Study pack
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              id="landing-study-pack-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              From notes to flashcards, quizzes, and lessons
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Paste lecture notes or readings once. Get structured study tools you can use before the exam.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start lg:items-center">
            <div className="space-y-6">
              <ul className="space-y-4">
                {FEATURES.map((line) => (
                  <li key={line} className="flex gap-3 text-left">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 mt-0.5" aria-hidden>
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Free includes lesson and flashcards. Quiz, crossword, and Crater Blast unlock on Pro, same flow as your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('study-pack')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all text-base"
                >
                  Open Study Pack
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-stone-300/90 dark:border-stone-600 text-stone-800 dark:text-stone-200 font-semibold rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/50 transition-colors text-base"
                >
                  Create free account
                </button>
              </div>
            </div>
            <div className="min-w-0">
              <InteractiveStudyPackDemo variant="full" />
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
