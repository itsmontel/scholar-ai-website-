import { useEffect, useState } from 'react';
import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingHowItWorksSectionProps {
  onNavigate: (page: string) => void;
}

const ROTATING_WORDS = [
  'study packs',
  'flashcards',
  'quizzes',
  'essay feedback',
  'lessons',
  'arcade games',
] as const;

const HERO_STUDY_GAMES_PLAYLIST = [
  '/hero-word-blitz.mp4',
  '/hero-word-tower.mp4',
  '/writescholar-crater-blast-demo.mp4',
] as const;

function StudySystemGamesVideo() {
  const [idx, setIdx] = useState(0);
  const src = HERO_STUDY_GAMES_PLAYLIST[idx];
  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      playsInline
      preload="metadata"
      onEnded={() => setIdx((i) => (i + 1) % HERO_STUDY_GAMES_PLAYLIST.length)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

type TileMedia =
  | { type: 'video'; src: string }
  | { type: 'image'; src: string }
  | { type: 'cycle' };

const SPOKES = [
  { angle: 0, label: 'Quizzes', color: '#FF4B82', icon: 'M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4M12 17.5h.01' },
  { angle: 60, label: 'Arcade', color: '#58CC02', icon: 'M7 8a4 4 0 00-4 4v2a3 3 0 003 3h.5L8 14h8l1.5 3H18a3 3 0 003-3v-2a4 4 0 00-4-4H7z' },
  { angle: 120, label: 'Editor', color: '#1CB0F6', icon: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z' },
  { angle: 180, label: 'Essay grade', color: '#FF9600', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 14l2 2 4-4' },
  { angle: 240, label: 'Flashcards', color: '#FFC800', icon: 'M4 6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm14 14H8v1a2 2 0 002 2h8a2 2 0 002-2V10h-1v10z' },
  { angle: 300, label: 'Daily review', color: '#A560E8', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5l3.5 2.1-.9 1.5L11 13V7h2z' },
] as const;

/** Large preview tiles — positioned at the six outer slots (red rectangles in mock). */
const TILE_WIDTH_DEFAULT = 'w-36 sm:w-40 lg:w-44 xl:w-48';

const OUTER_TILES: ReadonlyArray<{
  label: string;
  color: string;
  shadow: string;
  position: string;
  drift: string;
  delay?: string;
  width?: string;
  media: TileMedia;
}> = [
  {
    label: 'Daily review',
    color: '#A560E8',
    shadow: 'rgba(165,96,232,0.55)',
    position: 'top-[5%] left-[6%] lg:left-[8%]',
    drift: 'hero-tile-drift_8s_ease-in-out_infinite',
    media: { type: 'image', src: '/daily-review-preview.png' },
  },
  {
    label: 'Flashcards',
    color: '#FFC800',
    shadow: 'rgba(255,200,0,0.55)',
    position: 'top-[36%] left-[-3%] lg:left-[-2%]',
    drift: 'hero-tile-drift_8.6s_ease-in-out_infinite',
    delay: '0.8s',
    media: { type: 'video', src: '/hero-flashcards.mp4' },
  },
  {
    label: 'Essay grade',
    color: '#FF9600',
    shadow: 'rgba(255,150,0,0.55)',
    position: 'bottom-[7%] left-[6%] lg:left-[8%]',
    drift: 'hero-tile-drift_9s_ease-in-out_infinite',
    delay: '1.6s',
    media: { type: 'image', src: '/WriterPic.png' },
  },
  {
    label: 'Quizzes',
    color: '#FF4B82',
    shadow: 'rgba(255,75,130,0.55)',
    position: 'top-[5%] right-[6%] lg:right-[8%]',
    drift: 'hero-tile-drift_8.4s_ease-in-out_infinite',
    delay: '2.4s',
    media: { type: 'video', src: '/hero-quiz.mp4' },
  },
  {
    label: 'Arcade',
    color: '#58CC02',
    shadow: 'rgba(88,204,2,0.55)',
    position: 'top-[36%] right-[-3%] lg:right-[-2%]',
    drift: 'hero-tile-drift_8.6s_ease-in-out_infinite',
    delay: '3.2s',
    media: { type: 'cycle' },
  },
  {
    label: 'Editor',
    color: '#1CB0F6',
    shadow: 'rgba(28,176,246,0.55)',
    position: 'bottom-[7%] right-[6%] lg:right-[8%]',
    drift: 'hero-tile-drift_9.2s_ease-in-out_infinite',
    delay: '4s',
    media: { type: 'image', src: '/rubric-and-notes.png' },
  },
];

function TileMediaContent({ media }: { media: TileMedia }) {
  if (media.type === 'cycle') return <StudySystemGamesVideo />;
  if (media.type === 'image') {
    return (
      <img
        src={media.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
    );
  }
  return (
    <video
      src={media.src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function driftClass(drift: string) {
  switch (drift) {
    case 'hero-tile-drift-centered_9s_ease-in-out_infinite':
      return 'motion-safe:animate-[hero-tile-drift-centered_9s_ease-in-out_infinite]';
    case 'hero-tile-drift_8.4s_ease-in-out_infinite':
      return 'motion-safe:animate-[hero-tile-drift_8.4s_ease-in-out_infinite]';
    case 'hero-tile-drift_8.6s_ease-in-out_infinite':
      return 'motion-safe:animate-[hero-tile-drift_8.6s_ease-in-out_infinite]';
    case 'hero-tile-drift_9s_ease-in-out_infinite':
      return 'motion-safe:animate-[hero-tile-drift_9s_ease-in-out_infinite]';
    case 'hero-tile-drift_9.2s_ease-in-out_infinite':
      return 'motion-safe:animate-[hero-tile-drift_9.2s_ease-in-out_infinite]';
    default:
      return 'motion-safe:animate-[hero-tile-drift_8s_ease-in-out_infinite]';
  }
}

function OuterTile({ tile }: { tile: (typeof OUTER_TILES)[number] }) {
  const isVideo = tile.media.type === 'video' || tile.media.type === 'cycle';
  return (
    <div
      className={`absolute ${tile.position} ${driftClass(tile.drift)}`}
      style={tile.delay ? { animationDelay: tile.delay } : undefined}
    >
      <div className={tile.width ?? TILE_WIDTH_DEFAULT}>
        <div
          className="rounded-2xl overflow-hidden border-2 border-b-4 bg-white"
          style={{ borderColor: tile.color, boxShadow: `0 18px 42px -12px ${tile.shadow}` }}
        >
          <div className={`relative aspect-[16/10] w-full ${isVideo ? 'bg-stone-950' : 'bg-stone-100'}`}>
            <TileMediaContent media={tile.media} />
          </div>
          <p
            className="px-2 py-1 text-center text-[9px] lg:text-[10px] font-extrabold text-stone-800 bg-white border-t-2"
            style={{ borderColor: `${tile.color}66` }}
          >
            {tile.label}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingHowItWorksSection({ onNavigate }: LandingHowItWorksSectionProps) {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setWordIdx((i) => (i + 1) % ROTATING_WORDS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-24"
    >
      <LandingSectionBackdrop
        base="bg-[#FCFBF7] dark:bg-stone-950"
        topFrom="from-[#FCFBF7]/90 dark:from-stone-950/90"
        bottomTo="from-[#F3EAFF]/80 dark:from-[#1A0B2E]/80"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.08),transparent_60%)]"
      />

      <div className="relative z-10 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2
              id="how-it-works-heading"
              className="text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold text-stone-900 dark:text-white tracking-tight leading-[1.08]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              How your notes become a complete{' '}
              <span className="text-[#A560E8]">study system</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Into personalized, AI-powered{' '}
              <span
                key={ROTATING_WORDS[wordIdx]}
                className="inline-block font-extrabold text-stone-900 dark:text-white motion-safe:animate-fade-slide-in"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {ROTATING_WORDS[wordIdx]}
              </span>
              .
            </p>
          </div>
        </LandingScrollReveal>

        <LandingScrollReveal delayMs={120}>
          {/* Wide canvas: outer tiles flank the centre hub (md+). */}
          <div className="relative mx-auto w-full min-h-[560px] sm:min-h-[620px] lg:min-h-[680px] max-w-5xl lg:max-w-none">
            {/* ─── Outer preview tiles (red-rectangle slots) ─── */}
            <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden>
              {OUTER_TILES.map((tile) => (
                <OuterTile key={tile.label} tile={tile} />
              ))}
            </div>

            {/* ─── Centre hub — mascot + icon spokes (first edit) ─── */}
            <div className="relative mx-auto w-full max-w-[480px] aspect-square lg:absolute lg:inset-0 lg:max-w-none lg:aspect-auto lg:flex lg:items-center lg:justify-center">
              <div className="relative w-full max-w-[480px] aspect-square mx-auto">
                <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,96,232,0.16),transparent_70%)]" aria-hidden />
                <div className="absolute inset-[10%] rounded-full border-2 border-dashed border-[#D8B4FE]/70 dark:border-[#A560E8]/30 motion-safe:animate-[spin_50s_linear_infinite]" aria-hidden />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative rounded-full bg-white dark:bg-stone-900 shadow-[0_30px_60px_-30px_rgba(165,96,232,0.55)] ring-1 ring-stone-200/80 dark:ring-stone-700 p-2">
                    <img
                      src="/mascot-celebrating.webp"
                      alt="WriteScholar mascot"
                      loading="lazy"
                      decoding="async"
                      className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain motion-safe:animate-float"
                    />
                  </div>
                </div>

                {SPOKES.map((spoke, i) => {
                  const radians = ((spoke.angle - 90) * Math.PI) / 180;
                  const r = 42;
                  const left = 50 + r * Math.cos(radians);
                  const top = 50 + r * Math.sin(radians);
                  return (
                    <div
                      key={spoke.label}
                      className="absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-float"
                      style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${i * 0.4}s` }}
                    >
                      <span
                        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white shadow-[0_18px_36px_-12px_rgba(0,0,0,0.35)] ring-4 ring-white dark:ring-stone-950"
                        style={{ backgroundColor: spoke.color }}
                        aria-hidden
                      >
                        {spoke.label === 'Arcade' ? (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" aria-hidden>
                            <path d="M7 8a4 4 0 00-4 4v2a3 3 0 003 3h.5L8 14h8l1.5 3H18a3 3 0 003-3v-2a4 4 0 00-4-4H7z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d={spoke.icon} />
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] sm:text-xs font-extrabold text-stone-700 dark:text-stone-200 whitespace-nowrap">
                        {spoke.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: 2×3 grid of preview tiles below hub */}
            <div className="md:hidden mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
              {OUTER_TILES.map((tile) => {
                const isVideo = tile.media.type === 'video' || tile.media.type === 'cycle';
                return (
                  <div
                    key={tile.label}
                    className="rounded-xl overflow-hidden border-2 border-b-[3px] bg-white shadow-[0_10px_22px_-8px_rgba(0,0,0,0.25)]"
                    style={{ borderColor: tile.color }}
                  >
                    <div className={`relative aspect-[16/10] w-full ${isVideo ? 'bg-stone-950' : 'bg-stone-100'}`}>
                      <TileMediaContent media={tile.media} />
                    </div>
                    <p
                      className="px-1.5 py-1 text-center text-[10px] font-extrabold text-stone-800 bg-white border-t"
                      style={{ borderColor: `${tile.color}66` }}
                    >
                      {tile.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </LandingScrollReveal>

        <LandingScrollReveal delayMs={240}>
          <div className="mt-12 sm:mt-16 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold text-base border-2 border-b-4 border-[#7733B5] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_32px_-8px_rgba(165,96,232,0.55)]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Build my study system
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
