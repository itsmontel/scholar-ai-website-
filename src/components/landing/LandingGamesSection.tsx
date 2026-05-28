/* ═══════════════════════════════════════════════════════════════
   LandingGamesSection — public-facing showcase for the three arcade
   study games (Crater Blast, Word Tower, Word Blitz). Mirrors the
   in-app `GamesPanel` styling so visitors get a faithful preview of
   what the logged-in workspace looks like: pink/magenta `#FF4B82`
   banner, mascot, and three video preview cards with chunky borders.
   ═══════════════════════════════════════════════════════════════ */

import ViewportAutoplayVideo from '../common/ViewportAutoplayVideo';
import LandingScrollReveal from './LandingScrollReveal';

type Game = {
  key: string;
  name: string;
  tagline: string;
  page: string;
  videoSrc: string;
  objectPos?: string;
};

const GAMES: Game[] = [
  {
    key: 'crater-blast',
    name: 'Crater Blast',
    tagline: 'Fast-fire recall. Blast the right answer before it lands.',
    page: 'game-launcher-crater-blast',
    videoSrc: '/writescholar-crater-blast-demo.mp4',
  },
  {
    key: 'word-tower',
    name: 'Word Tower',
    tagline: 'Stack correct answers and build the tallest tower you can.',
    page: 'game-launcher-word-tower',
    videoSrc: '/hero-word-tower.mp4',
  },
  {
    key: 'word-blitz',
    name: 'Word Blitz',
    tagline: 'Fill the blank against the clock. Recall under pressure.',
    page: 'word-blitz',
    videoSrc: '/hero-word-blitz.mp4',
  },
];

interface LandingGamesSectionProps {
  onNavigate: (page: string) => void;
}

export default function LandingGamesSection({ onNavigate }: LandingGamesSectionProps) {
  return (
    <section
      id="landing-games"
      aria-labelledby="landing-games-heading"
      className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800 bg-[#FAF7FF] dark:bg-stone-950 scroll-mt-20"
    >
      {/* Soft ambient orbs to match the documents-dashboard hero feel. */}
      <div
        className="pointer-events-none absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-[#FF4B82]/10 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-[#A560E8]/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Pink banner header (matches in-app GamesPanel) ─── */}
        <LandingScrollReveal>
          <div
            className="relative overflow-hidden rounded-3xl border-2 border-b-4 text-white p-6 sm:p-8 lg:p-9"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #FF4B82 0%, #FF4B82 50%, #C73968 100%)',
              borderColor: '#A82754',
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-white/85">
                  Arcade
                </p>
                <h2
                  id="landing-games-heading"
                  className="mt-1.5 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.05] tracking-tight"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  Arcade mode
                </h2>
                <p className="mt-2 text-[13px] sm:text-base font-bold text-white/90 leading-snug max-w-2xl">
                  Drill recall the fun way. Load them with your own notes via Study Packs.
                </p>
              </div>
              <img
                src="/mascot-jumping-joy.webp"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="hidden sm:block relative w-20 h-20 lg:w-28 lg:h-28 object-contain shrink-0 drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>
        </LandingScrollReveal>

        {/* ─── Three game cards (mirrors GamesPanel grid) ─── */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {GAMES.map((g, i) => (
            <LandingScrollReveal key={g.key} delayMs={i * 90}>
              <div className="group flex flex-col rounded-3xl overflow-hidden border-2 border-b-4 border-[#FF4B82] bg-white dark:bg-stone-900 hover:-translate-y-1 transition-all shadow-[0_12px_30px_-18px_rgba(255,75,130,0.5)] hover:shadow-[0_26px_50px_-20px_rgba(255,75,130,0.55)]">
                <div className="relative aspect-[16/11] w-full bg-stone-950">
                  <ViewportAutoplayVideo
                    src={g.videoSrc}
                    className={`absolute inset-0 h-full w-full object-cover ${g.objectPos ?? 'object-center'}`}
                    aria-label={`${g.name} gameplay preview`}
                  />
                </div>
                <div className="flex-1 flex flex-col p-5 border-t-2 border-[#FF4B82]/30">
                  <p
                    className="text-lg font-extrabold text-stone-900 dark:text-stone-50"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    {g.name}
                  </p>
                  <p className="mt-1 text-[13px] font-bold text-stone-500 dark:text-stone-400 leading-snug flex-1">
                    {g.tagline}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate(g.page)}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4B82] hover:bg-[#A82754] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#A82754] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    Play
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </LandingScrollReveal>
          ))}
        </div>

        {/* ─── "Play with your own material" call-out (matches dashboard) ─── */}
        <LandingScrollReveal delayMs={270}>
          <div className="mt-6 rounded-3xl border-2 border-[#FF4B82]/25 bg-[#FFE8EE] dark:bg-[#FF4B82]/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[#A82754] dark:text-[#FFA0BC]">
                Play with your own material
              </p>
              <p className="mt-1 text-[13px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
                Generate a study pack from your notes and every arcade title is automatically loaded with
                questions from your content.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('study-pack')}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4B82] hover:bg-[#A82754] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#A82754] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Make a study pack
            </button>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
