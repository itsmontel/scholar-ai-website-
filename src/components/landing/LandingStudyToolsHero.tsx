import { useCallback, useEffect, useRef, useState } from 'react';
import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

interface LandingStudyToolsHeroProps {
  onNavigate: (page: string) => void;
}

type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'duoBlue';

interface ToolCard {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  image?: string;
  video?: string;
  poster?: string;
  alt: string;
  tone: Tone;
  badge: string;
  navTo: string;
  /** Bento grid placement on lg+. */
  span: string;
  /** Optional — only if the card needs a floor height. */
  minH?: string;
  /** Object position when image is cover-cropped. */
  objectPos?: string;
  /** How video fills the preview frame — contain avoids upscaling blur on low-res clips. */
  videoFit?: 'cover' | 'contain';
  featured?: boolean;
  dark?: boolean;
}

const STUDY_TOOLS: ToolCard[] = [
  {
    num: '01',
    title: 'Flashcards',
    subtitle: 'Adaptive recall',
    desc: 'AI-built flashcards with click-to-flip, mark-as-known, and PDF/DOCX export.',
    video: '/hero-flashcards-hq.mp4',
    alt: 'WriteScholar flashcard interface showing a Piaget question card with flip and navigation controls',
    tone: 'blue',
    badge: 'Core',
    navTo: 'create-flashcards',
    span: 'lg:col-span-7',
    objectPos: 'object-center',
    videoFit: 'contain',
    featured: true,
  },
  {
    num: '02',
    title: 'Quizzes',
    subtitle: 'Mixed-format · auto-graded',
    desc: 'Multiple choice, true/false and fill-in-the-blank. Adjust difficulty and length.',
    video: '/hero-quiz-hq.mp4',
    alt: 'WriteScholar quiz showing question 3 of 10 with four multiple-choice options',
    tone: 'green',
    badge: 'Core',
    navTo: 'quiz-generator',
    span: 'lg:col-span-5',
    objectPos: 'object-top',
    videoFit: 'contain',
  },
  {
    num: '03',
    title: 'Crosswords',
    subtitle: 'Vocabulary puzzles',
    desc: 'Generate themed crosswords from your notes — print, hint, or solve on-screen.',
    image: '/crosssword pic.png',
    alt: 'WriteScholar crossword puzzle generator with grid and across/down clues',
    tone: 'orange',
    badge: 'Pro',
    navTo: 'study-pack',
    span: 'lg:col-span-6',
    objectPos: 'object-top',
  },
  {
    num: '04',
    title: 'Lessons',
    subtitle: 'Interactive walk-throughs',
    desc: 'Notes turn into bite-size lessons with key terms, examples and check-points.',
    image: '/study-pack-previews/lesson-plan.png',
    alt: 'WriteScholar lesson plan view with key term, supporting bullets and progress indicator',
    tone: 'red',
    badge: 'Free',
    navTo: 'study-pack',
    span: 'lg:col-span-6',
    objectPos: 'object-top',
  },
];

const ARCADE_GAMES: ToolCard[] = [
  {
    num: '01',
    title: 'Crater Blast',
    subtitle: 'AI quiz arcade game',
    desc: 'Blast the right answer before the asteroid lands. A boss-battle take on revision.',
    video: '/writescholar-crater-blast-demo.mp4',
    alt: 'WriteScholar Crater Blast game demo — answer asteroids fall toward a planet and you blast the correct one',
    tone: 'duoBlue',
    badge: 'Game',
    navTo: 'crater-blast',
    span: 'lg:col-span-4',
    dark: true,
  },
  {
    num: '02',
    title: 'Word Tower',
    subtitle: 'Arcade vocab game',
    desc: 'Stack the right words, beat your streak before the tower collapses.',
    video: '/hero-word-tower-hq.mp4',
    alt: 'WriteScholar Word Tower arcade game with starfield background and word blocks',
    tone: 'duoBlue',
    badge: 'Game',
    navTo: 'word-tower',
    span: 'lg:col-span-4',
    objectPos: 'object-center',
    videoFit: 'contain',
    dark: true,
  },
  {
    num: '03',
    title: 'Word Blitz',
    subtitle: '60-second cloze speedrun',
    desc: 'Read the sentence, tap the missing word. Speed bonus rewards fast answers — beat the clock.',
    video: '/hero-word-blitz-hq.mp4',
    alt: 'WriteScholar Word Blitz fill-in-the-blank speedrun game with a 60-second timer and four answer choices',
    tone: 'duoBlue',
    badge: 'Game',
    navTo: 'word-blitz',
    span: 'lg:col-span-4',
    objectPos: 'object-center',
    videoFit: 'contain',
    dark: true,
  },
];

// Each tone now has a distinct colour so study-tool cards feel varied
// and game cards have a consistent hot-pink identity.
type ToneStyle = {
  border: string;       // card outer border
  borderInner: string;  // media-area inner border
  accent: string;       // top accent stripe
  badge: string;        // badge pill
  numBg: string;        // number badge bg
  cardBg: string;       // card background tint
  shadow: string;       // box shadow
  chromeDot: string;    // browser-chrome dot colour
  livePill: string;     // "Live" pill (video cards)
};

const TONE_STYLES: Record<Tone, ToneStyle> = {
  // Flashcards — purple
  blue: {
    border:      'border-[#A560E8]',
    borderInner: 'border-[#D8B4FE]',
    accent:      'bg-gradient-to-r from-[#A560E8] to-[#8A48C7]',
    badge:       'bg-[#F3EAFF] text-[#7733B5]',
    numBg:       'bg-[#A560E8]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(165,96,232,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(165,96,232,0.60)]',
    chromeDot:   'bg-[#A560E8]',
    livePill:    'bg-[#F3EAFF] text-[#A560E8]',
  },
  // Quizzes — green
  green: {
    border:      'border-[#46A302]',
    borderInner: 'border-[#A8E06B]',
    accent:      'bg-gradient-to-r from-[#58CC02] to-[#46A302]',
    badge:       'bg-[#E5F8D0] text-[#2E7200]',
    numBg:       'bg-[#58CC02]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(88,204,2,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(88,204,2,0.55)]',
    chromeDot:   'bg-[#58CC02]',
    livePill:    'bg-[#E5F8D0] text-[#46A302]',
  },
  // Crosswords — orange/amber
  orange: {
    border:      'border-[#D97F00]',
    borderInner: 'border-[#FFCF70]',
    accent:      'bg-gradient-to-r from-[#FF9600] to-[#D97F00]',
    badge:       'bg-[#FFF4E0] text-[#9A5500]',
    numBg:       'bg-[#FF9600]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(255,150,0,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(255,150,0,0.55)]',
    chromeDot:   'bg-[#FF9600]',
    livePill:    'bg-[#FFF4E0] text-[#D97F00]',
  },
  // Lessons — teal/cyan
  red: {
    border:      'border-[#0891B2]',
    borderInner: 'border-[#67E8F9]',
    accent:      'bg-gradient-to-r from-[#06B6D4] to-[#0891B2]',
    badge:       'bg-[#CFFAFE] text-[#0E7490]',
    numBg:       'bg-[#06B6D4]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(6,182,212,0.40)] hover:shadow-[0_16px_40px_-12px_rgba(6,182,212,0.55)]',
    chromeDot:   'bg-[#06B6D4]',
    livePill:    'bg-[#CFFAFE] text-[#0891B2]',
  },
  // (unused — kept for type safety)
  purple: {
    border:      'border-[#A560E8]',
    borderInner: 'border-[#D8B4FE]',
    accent:      'bg-gradient-to-r from-[#A560E8] to-[#8A48C7]',
    badge:       'bg-[#F3EAFF] text-[#7733B5]',
    numBg:       'bg-[#A560E8]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(165,96,232,0.45)] hover:shadow-[0_16px_40px_-12px_rgba(165,96,232,0.60)]',
    chromeDot:   'bg-[#A560E8]',
    livePill:    'bg-[#F3EAFF] text-[#A560E8]',
  },
  // Arcade / game cards — hot pink
  duoBlue: {
    border:      'border-[#FF4B82]',
    borderInner: 'border-[#FFB3CB]',
    accent:      'bg-gradient-to-r from-[#FF4B82] to-[#C73968]',
    badge:       'bg-[#FFE8EE] text-[#A82754]',
    numBg:       'bg-[#FF4B82]',
    cardBg:      'bg-white',
    shadow:      'shadow-[0_8px_28px_-10px_rgba(255,75,130,0.50)] hover:shadow-[0_16px_40px_-12px_rgba(255,75,130,0.70)]',
    chromeDot:   'bg-[#FF4B82]',
    livePill:    'bg-[#FFE8EE] text-[#A82754]',
  },
};

export default function LandingStudyToolsHero({ onNavigate }: LandingStudyToolsHeroProps) {
  return (
    <section
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden scroll-mt-20"
      aria-labelledby="landing-study-tools-heading"
      id="study-tools"
    >
      <LandingSectionBackdrop
        base="bg-[#FFF4E0] dark:bg-[#2A1800]"
        topFrom="from-[#F3EAFF]/80 dark:from-[#1A0B2E]/80"
        bottomTo="from-[#FCFBF7]/80 dark:from-stone-950/80"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,150,0,0.14),transparent_60%)]"
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(255,75,130,0.10),transparent_70%)]" aria-hidden />

      {/* Studying mascot — large, positioned in the top-right of the section
          so it draws the eye while the headline reads. */}
      <img
        src="/mascot-study.webp"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="hidden lg:block pointer-events-none absolute top-12 right-6 xl:right-12 w-44 xl:w-56 h-auto z-10 drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Headline ─── */}
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#FF9600]/40 bg-[#FFF4E0] dark:bg-[#FF9600]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(255,150,0,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9600] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9600]" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#B85F00] dark:text-[#FFBD5C]">
                Study tools · live in dashboard
              </span>
            </div>
            <h2
              id="landing-study-tools-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-5"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              <span className="block">Transform your notes into</span>
              <span className="relative inline-block mt-1 sm:mt-1.5 text-[#FF9600]">
                powerful study tools
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-[#FF9600]"
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
            <p className="text-base sm:text-xl text-[#777] dark:text-stone-300 leading-relaxed max-w-2xl mx-auto font-normal" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Flashcards, quizzes, crosswords, lessons <span className="font-bold text-[#FF9600]">plus three arcade games</span> — all generated from your own notes in under 60 seconds.
            </p>
          </div>
        </LandingScrollReveal>

        {/* The Study-Pack-style input mock + "Each tool, in detail"
            cue arrow that used to sit between the headline and the
            bento grid have been removed per user brief. The bento
            grid below is now the immediate follow-up to the section
            headline. (The `NotesPanel` component definition lower in
            this file is now dead code but kept in place in case the
            input mock is ever brought back.) */}

        {/* ─── Study tools bento (top half) — orange ambient panel ─── */}
        <div className="relative rounded-3xl border-2 border-[#FFCF70]/70 bg-white/70 dark:bg-[#2A1800]/40 shadow-[0_0_60px_-20px_rgba(255,150,0,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
          {/* Subtle corner glow */}
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#FF9600]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#D97F00]/12 blur-3xl" aria-hidden />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 auto-rows-min">
            {STUDY_TOOLS.map((tool, i) => (
              <LandingScrollReveal key={tool.title} className={tool.span} delayMs={i * 90}>
                <BentoCard tool={tool} onNavigate={onNavigate} />
              </LandingScrollReveal>
            ))}
          </div>
        </div>

        {/* ─── Bridge band — visually carries the eye from study tools
                 into the arcade games sub-section. Pink gradient ribbon
                 echoes the in-app GamesPanel banner. ─── */}
        <LandingScrollReveal delayMs={120}>
          <div className="relative mt-14 sm:mt-20 mb-8 sm:mb-10" id="landing-arcade">
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
                    Plus · Arcade mode
                  </p>
                  <h3
                    className="mt-1.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-[1.05] tracking-tight"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Make revision feel like a game
                  </h3>
                  <p className="mt-2 text-[13px] sm:text-base font-bold text-white/90 leading-snug max-w-2xl">
                    Every Study Pack also unlocks three arcade games — built from the same notes you just pasted in.
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
            {/* Down chevron — visually leads the eye to the games grid */}
            <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-[#A82754] shadow-[0_6px_14px_-4px_rgba(168,39,84,0.45)]">
              <svg className="w-4 h-4 text-[#A82754]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </LandingScrollReveal>

        {/* ─── Arcade games bento (bottom half) — pink ambient panel ─── */}
        <div className="relative rounded-3xl border-2 border-[#FF4B82]/50 bg-[#FFE8EE]/80 dark:bg-[#FF4B82]/10 shadow-[0_0_60px_-20px_rgba(255,75,130,0.40)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#FF4B82]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#A82754]/20 blur-3xl" aria-hidden />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 auto-rows-min">
            {ARCADE_GAMES.map((tool, i) => (
              <LandingScrollReveal key={tool.title} className={tool.span} delayMs={i * 90}>
                <BentoCard tool={tool} onNavigate={onNavigate} />
              </LandingScrollReveal>
            ))}
          </div>
        </div>

        {/* ─── CTA strip ─── */}
        <LandingScrollReveal delayMs={420}>
          <div className="mt-14 sm:mt-20 flex flex-col items-center gap-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigate('study-pack')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#FF9600] hover:bg-[#E88700] text-white font-extrabold text-base border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_24px_-8px_rgba(255,150,0,0.50)]"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Try Study Pack free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('more-tools')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-[#3C3C3C] text-[#3C3C3C] dark:text-white font-extrabold border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] active:border-b-2 active:translate-y-0.5 transition-all"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Browse all tools
                <span className="text-[#AFAFAF]">→</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#777] dark:text-stone-400 font-bold flex flex-wrap items-center justify-center gap-x-2 gap-y-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#FF9600]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free plan included
              </span>
              <span className="text-[#E5E5E5] dark:text-[#4A4A4A]">·</span>
              <span>No credit card</span>
              <span className="text-[#E5E5E5] dark:text-[#4A4A4A]">·</span>
              <span>Cancel anytime</span>
            </p>
          </div>
        </LandingScrollReveal>
      </div>

      <style>{`
        @keyframes lsthShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(120%); } }
        @keyframes lsthFloatCard { 0%,100% { transform: translateY(0) rotate(var(--lsth-rot, 0deg)); } 50% { transform: translateY(-6px) rotate(var(--lsth-rot, 0deg)); } }
        @keyframes lsthBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        @keyframes lsthTilePop { 0% { transform: translateY(8px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        .lsth-shimmer { animation: lsthShimmer 1.4s ease-out 0.6s both; }
        .lsth-floatcard { display: inline-flex; animation: lsthFloatCard 5s ease-in-out infinite; }
        .lsth-floatcard:nth-child(2n) { animation-duration: 6s; animation-delay: -1.4s; }
        .lsth-floatcard:nth-child(3n) { animation-duration: 7s; animation-delay: -2.6s; }
        .lsth-bounce { animation: lsthBounce 1.6s ease-in-out infinite; }
        .lsth-tile-pop { animation: lsthTilePop 0.5s cubic-bezier(.22,1.2,.36,1) backwards; }
        .lsth-no-cursor { caret-color: transparent; }
        @media (prefers-reduced-motion: reduce) {
          .lsth-shimmer, .lsth-floatcard, .lsth-bounce, .lsth-tile-pop { animation: none; }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────── Bento card ─────────────────── */

/** Browser chrome strip height — keep in sync with media `top-*` / `calc` below. */
const MEDIA_CHROME_H = 'h-7';
const MEDIA_TOP = 'top-7';

function BentoCard({ tool, onNavigate }: { tool: ToolCard; onNavigate: (page: string) => void }) {
  const styles = TONE_STYLES[tool.tone];
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaWrapRef = useRef<HTMLDivElement | null>(null);

  const mediaAspectClass =
    tool.video && tool.featured ? 'aspect-[21/9]' : tool.featured ? 'aspect-[2/1]' : 'aspect-[16/9]';

  // Auto-play the video when it scrolls into view; pause when it leaves.
  useEffect(() => {
    if (!tool.video) return;
    const video = videoRef.current;
    const wrap = mediaWrapRef.current;
    if (!video || !wrap || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            video.play().catch(() => {
              /* autoplay blocked — ignore */
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, [tool.video]);

  const isGame = tool.tone === 'duoBlue';

  return (
    <button
      type="button"
      onClick={() => onNavigate(tool.navTo)}
      className={`group relative w-full h-full text-left rounded-2xl border-2 border-b-4 ${styles.border} ${styles.cardBg} overflow-hidden transition-all duration-200 hover:-translate-y-1 active:border-b-2 active:translate-y-0.5 ${styles.shadow} ${tool.minH ?? ''}`}
    >
      {/* Top accent stripe — gradient per tone */}
      <span
        className={`absolute top-0 inset-x-0 h-1.5 ${styles.accent}`}
        aria-hidden
      />

      {/* Card header */}
      <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-extrabold tabular-nums ${styles.numBg}`} aria-hidden>
              {tool.num}
            </span>
            <h3
              className="text-lg sm:text-xl font-extrabold leading-tight text-[#3C3C3C] dark:text-white"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {tool.title}
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#AFAFAF] dark:text-stone-400">
            {tool.subtitle}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${styles.badge}`}>
          {tool.badge}
        </span>
      </div>

      {/* Description */}
      <p
        className="relative px-4 sm:px-5 pb-3 text-sm leading-snug text-[#777] dark:text-stone-300"
        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
      >
        {tool.desc}
      </p>

      {/* Media area */}
      <div
        ref={mediaWrapRef}
        className={`relative mx-2.5 sm:mx-3 mb-2.5 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden border-2 ${styles.borderInner} ${
          isGame ? 'bg-[#FFF0F4] dark:bg-[#2C2C2C]' : 'bg-[#FAF7FF] dark:bg-[#2C2C2C]'
        } ${mediaAspectClass}`}
      >
        {/* Skeleton shimmer */}
        {!loaded && (
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div className={`absolute inset-0 ${isGame ? 'bg-[#FFF0F4] dark:bg-[#2C2C2C]' : 'bg-[#FAF7FF] dark:bg-[#2C2C2C]'}`} />
            <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent lsth-shimmer" />
          </div>
        )}

        {/* Browser chrome strip */}
        <div
          className={`relative z-10 flex ${MEDIA_CHROME_H} shrink-0 items-center gap-1 px-2.5 border-b-2 ${styles.borderInner} bg-white dark:bg-[#3C3C3C]`}
        >
          <span className={`h-2 w-2 rounded-full ${styles.chromeDot}`} />
          <span className={`h-2 w-2 rounded-full ${styles.chromeDot} opacity-60`} />
          <span className={`h-2 w-2 rounded-full ${styles.chromeDot} opacity-30`} />
          <span className="ml-2 text-[10px] font-bold truncate text-[#AFAFAF] dark:text-stone-500">
            writescholar.com · {tool.title.toLowerCase()}
          </span>
          {tool.video && (
            <span className={`ml-auto inline-flex items-center gap-1 rounded-full ${styles.livePill} px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider`}>
              <span className={`h-1.5 w-1.5 rounded-full ${styles.chromeDot} motion-safe:animate-pulse`} aria-hidden />
              Live
            </span>
          )}
        </div>

        {/* The actual screenshot or video */}
        {tool.video ? (
          <video
            ref={videoRef}
            src={tool.video}
            poster={tool.poster}
            muted
            loop
            playsInline
            preload="auto"
            aria-label={tool.alt}
            onLoadedData={() => setLoaded(true)}
            className={`absolute inset-0 ${MEDIA_TOP} w-full h-[calc(100%-1.75rem)] ${
              tool.videoFit === 'contain' ? 'object-contain' : 'object-cover'
            } ${tool.objectPos || 'object-center'} transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <img
            src={tool.image}
            alt={tool.alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 ${MEDIA_TOP} w-full h-[calc(100%-1.75rem)] object-cover ${tool.objectPos || 'object-top'} transition-all duration-500 group-hover:scale-[1.02] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hover overlay CTA */}
        <div className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#3C3C3C] border-2 border-b-[3px] border-[#E5E5E5] dark:border-[#4A4A4A] px-3 py-1.5 text-[11px] font-extrabold text-[#3C3C3C] dark:text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Open {tool.title}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Featured ribbon */}
        {tool.featured && (
          <div className="absolute top-9 right-2.5 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#A560E8] border-2 border-[#8A48C7] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            Most loved
          </div>
        )}
      </div>
    </button>
  );
}

/* ─────────────────── Sticker annotation ─────────────────── */

const STICKER_TONES: Record<string, string> = {
  green: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
  orange: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
  blue: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
  purple: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
  red: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
};

function Sticker({
  className = '',
  tone,
  emoji,
  children,
}: {
  className?: string;
  tone: keyof typeof STICKER_TONES;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-20 items-center gap-1.5 rounded-full ${STICKER_TONES[tone]} px-2.5 py-1 text-[11px] font-extrabold lsth-floatcard ${className}`}
      aria-hidden
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span>{children}</span>
    </div>
  );
}

/* ─────────────────── Pipeline pieces ─────────────────── */

const DEMO_NOTES_TEXT = `Cell Biology · Lecture 4 — Mitochondria & Cellular Respiration

The mitochondrion is the cell's primary site of ATP synthesis, generating roughly 30–32 ATP molecules per glucose molecule via oxidative phosphorylation. This double-membraned organelle originated through endosymbiosis: an α-proteobacterium engulfed by an ancestral eukaryotic cell roughly 1.5 billion years ago.

The outer membrane is permeable to small molecules through porin channels, while the inner membrane is highly impermeable and folded into structures called cristae. These folds dramatically increase surface area, providing more space for the protein complexes of the electron transport chain.

Key terms: ATP synthase, cristae, matrix, proton gradient, chemiosmosis, electron transport chain, NADH, FADH₂, cytochrome c, ubiquinone, oxidative phosphorylation.

The electron transport chain consists of four complexes (I–IV) plus ATP synthase. Electrons from NADH enter at Complex I, while electrons from FADH₂ enter at Complex II. As electrons move through the complexes, protons are pumped from the matrix into the intermembrane space, creating an electrochemical gradient.

This proton motive force drives ATP synthesis through ATP synthase — a remarkable molecular machine that rotates as protons flow back into the matrix. Each rotation generates three ATP molecules, one of biology's most elegant examples of mechanical-chemical energy coupling.

Mitochondrial dysfunction is implicated in numerous diseases including diabetes, Parkinson's, Alzheimer's, and several cancers. Mutations in mitochondrial DNA can cause inherited disorders, and the organelle's central role in apoptosis (programmed cell death) makes it a key regulator of cellular fate.

For the exam: distinguish substrate-level phosphorylation (glycolysis, Krebs cycle) from oxidative phosphorylation (electron transport chain), understand how uncouplers like DNP affect ATP production, and review why brown adipose tissue uses controlled uncoupling to generate heat.`;

function landingStudyWordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

type NotesInputTab = 'notes' | 'paste' | 'pdf' | 'docx';

const INPUT_TABS: { id: NotesInputTab; label: string }[] = [
  { id: 'notes', label: 'Your notes' },
  { id: 'paste', label: 'Paste' },
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
];

type DemoPhase = 'idle' | 'typing' | 'pulsing' | 'generating' | 'done';

const TYPING_SPEED_MS = 14;
const PULSE_MS = 700;
const GENERATING_MS = 1500;
const DONE_MS = 2200;
const RESTART_DELAY_MS = 900;

function NotesPanel({ onNavigate }: LandingStudyToolsHeroProps) {
  const [tab, setTab] = useState<NotesInputTab>('notes');
  const [pasteText, setPasteText] = useState('');
  const [demoText, setDemoText] = useState('');
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [userInteracted, setUserInteracted] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);
  const typingIntervalRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<DemoPhase>('idle');
  const userInteractedRef = useRef(false);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    userInteractedRef.current = userInteracted;
  }, [userInteracted]);

  useEffect(() => {
    try {
      reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduceMotionRef.current = false;
    }
  }, []);

  const pushTimer = (id: number) => {
    timersRef.current.push(id);
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  const clearTypingInterval = () => {
    if (typingIntervalRef.current != null) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const stopDemo = () => {
    clearAllTimers();
    clearTypingInterval();
  };

  const runDemo = useCallback(() => {
    if (userInteractedRef.current || !inViewRef.current) return;
    stopDemo();
    setDemoText('');
    setPhase('typing');
    phaseRef.current = 'typing';

    if (reduceMotionRef.current) {
      // Skip animation, jump straight to filled
      setDemoText(DEMO_NOTES_TEXT);
      setPhase('done');
      phaseRef.current = 'done';
      pushTimer(
        window.setTimeout(() => {
          if (userInteractedRef.current || !inViewRef.current) return;
          runDemo();
        }, DONE_MS + RESTART_DELAY_MS)
      );
      return;
    }

    const chars = [...DEMO_NOTES_TEXT];
    let i = 0;
    typingIntervalRef.current = window.setInterval(() => {
      if (userInteractedRef.current || !inViewRef.current) {
        clearTypingInterval();
        return;
      }
      // Type 2 characters per tick to keep ~350-word demo within ~5s
      i = Math.min(i + 2, chars.length);
      setDemoText(chars.slice(0, i).join(''));
      if (i >= chars.length) {
        clearTypingInterval();
        pushTimer(
          window.setTimeout(() => {
            if (userInteractedRef.current || !inViewRef.current) return;
            setPhase('pulsing');
            phaseRef.current = 'pulsing';
            pushTimer(
              window.setTimeout(() => {
                if (userInteractedRef.current || !inViewRef.current) return;
                setPhase('generating');
                phaseRef.current = 'generating';
                pushTimer(
                  window.setTimeout(() => {
                    if (userInteractedRef.current || !inViewRef.current) return;
                    setPhase('done');
                    phaseRef.current = 'done';
                    pushTimer(
                      window.setTimeout(() => {
                        if (userInteractedRef.current || !inViewRef.current) return;
                        // Loop after a short pause
                        pushTimer(
                          window.setTimeout(() => {
                            if (userInteractedRef.current || !inViewRef.current) return;
                            runDemo();
                          }, RESTART_DELAY_MS)
                        );
                      }, DONE_MS)
                    );
                  }, GENERATING_MS)
                );
              }, PULSE_MS)
            );
          }, 450)
        );
      }
    }, TYPING_SPEED_MS);
  }, []);

  // Intersection observer — start demo when in view, halt when out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const wasIn = inViewRef.current;
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !wasIn && !userInteractedRef.current && phaseRef.current === 'idle') {
          runDemo();
        } else if (!entry.isIntersecting && wasIn) {
          stopDemo();
          if (!userInteractedRef.current) {
            setPhase('idle');
            phaseRef.current = 'idle';
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      stopDemo();
    };
  }, [runDemo]);

  const markInteracted = () => {
    if (userInteractedRef.current) return;
    userInteractedRef.current = true;
    setUserInteracted(true);
    stopDemo();
    setPhase('idle');
    phaseRef.current = 'idle';
  };

  const handleTabClick = (id: NotesInputTab) => {
    markInteracted();
    setTab(id);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    markInteracted();
    setPasteText(e.target.value);
  };

  // What text the user sees in the textarea
  const liveNotesText = userInteracted ? DEMO_NOTES_TEXT : demoText;
  const textForCount =
    tab === 'paste' ? pasteText : tab === 'notes' ? liveNotesText : '';
  const wc = landingStudyWordCount(textForCount);
  const MIN_WORDS = 50;
  const canGenerate = (tab === 'paste' || tab === 'notes') && wc >= MIN_WORDS;

  const stashDraftAndGo = () => {
    markInteracted();
    const payload = tab === 'paste' ? pasteText : DEMO_NOTES_TEXT;
    if (landingStudyWordCount(payload) < MIN_WORDS) return;
    try {
      sessionStorage.setItem('writescholar_dashboard_draft', payload);
    } catch {
      /* ignore quota / privacy mode */
    }
    onNavigate('study-pack');
  };

  // Demo-controlled button visuals (only when not user-interacted and on notes tab)
  const inDemoMode = !userInteracted && tab === 'notes' && phase !== 'idle';
  const demoPulsing = inDemoMode && phase === 'pulsing';
  const demoGenerating = inDemoMode && phase === 'generating';
  const demoDone = inDemoMode && phase === 'done';

  return (
    <div ref={containerRef} className="w-full">
      {/* Segmented tabs */}
      <div
        className="mb-4 flex flex-wrap items-center gap-1 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-1.5"
        role="tablist"
        aria-label="Input source"
      >
        {INPUT_TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabClick(id)}
              className={`relative flex-1 min-w-[4.5rem] sm:min-w-0 rounded-xl px-3 py-2 text-center text-[13px] font-extrabold transition-colors ${
                active
                  ? 'bg-[#F3EAFF] text-[#A560E8] border-2 border-[#A560E8]/30'
                  : 'text-[#AFAFAF] dark:text-stone-400 hover:text-[#3C3C3C] dark:hover:text-white'
              }`}
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main field */}
      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C]">
        <div className="relative">
          {tab === 'pdf' || tab === 'docx' ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <p className="text-sm sm:text-[15px] text-[#777] dark:text-stone-400 max-w-sm leading-relaxed font-bold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Upload a {tab === 'pdf' ? 'PDF' : 'Word'} file on Study Pack — we&apos;ll extract the text and build your seven tools.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('study-pack')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] px-5 py-2.5 text-sm font-extrabold text-[#3C3C3C] dark:text-white active:border-b-2 active:translate-y-0.5 transition-all"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                <svg className="w-4 h-4 text-[#A560E8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Go to upload
              </button>
            </div>
          ) : (
            <>
              <label htmlFor="landing-study-pack-textarea" className="sr-only">
                Paste your study material
              </label>
              <textarea
                id="landing-study-pack-textarea"
                readOnly={tab === 'notes'}
                value={tab === 'notes' ? liveNotesText : pasteText}
                onChange={tab === 'paste' ? handlePasteChange : undefined}
                placeholder="Paste your study notes, textbook chapter, article, or any learning material here... (minimum 50 words)"
                rows={tab === 'notes' ? 9 : 9}
                className={`block w-full min-h-[260px] resize-y rounded-2xl border-0 bg-transparent px-5 pt-5 pb-12 text-[15px] sm:text-[15px] leading-relaxed text-[#3C3C3C] dark:text-white placeholder:text-[#AFAFAF] dark:placeholder:text-stone-500 focus:outline-none focus:ring-0 ${
                  inDemoMode && phase === 'typing' ? 'lsth-no-cursor' : ''
                }`}
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              />
              {/* Live "is typing" indicator while demo is animating */}
              {inDemoMode && phase === 'typing' && (
                <div className="pointer-events-none absolute top-4 right-5 inline-flex items-center gap-1.5 rounded-full bg-[#F3EAFF] border-2 border-[#A560E8]/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#A560E8]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A560E8] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#A560E8]" />
                  </span>
                  Typing...
                </div>
              )}
              <div className="pointer-events-none absolute bottom-4 left-5 text-[13px] text-[#AFAFAF] dark:text-stone-500 tabular-nums font-bold">
                {wc.toLocaleString()} {wc === 1 ? 'word' : 'words'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions row below field (reference layout) */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-stretch">
        <input
          ref={uploadRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          tabIndex={-1}
          onChange={() => onNavigate('study-pack')}
        />
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="inline-flex sm:flex-none items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] px-5 py-3.5 text-sm font-extrabold text-[#3C3C3C] dark:text-white active:border-b-2 active:translate-y-0.5 transition-all"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          <svg className="w-4 h-4 text-[#A560E8] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload file
        </button>
        <button
          type="button"
          disabled={!canGenerate && !inDemoMode}
          onClick={stashDraftAndGo}
          className={`relative inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold transition-all duration-200 overflow-hidden border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
            demoGenerating
              ? 'bg-[#A560E8] border-[#8A48C7] text-white'
              : demoDone
                ? 'bg-[#A560E8] border-[#8A48C7] text-white'
                : canGenerate || demoPulsing
                  ? 'bg-[#3C3C3C] border-[#2C2C2C] text-white'
                  : 'bg-[#E5E5E5] border-[#CCCCCC] text-white/90 cursor-not-allowed'
          } ${
            demoPulsing
              ? 'ring-2 ring-[#A560E8]/60 ring-offset-2 ring-offset-white dark:ring-offset-[#3C3C3C]'
              : ''
          }`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {demoPulsing && (
            <span className="absolute inset-0 bg-[#A560E8]/20 motion-safe:animate-ping rounded-xl opacity-50" aria-hidden />
          )}
          {demoGenerating ? (
            <>
              <svg className="relative w-4 h-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path
                  fill="currentColor"
                  className="opacity-90"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="relative">Generating study pack...</span>
            </>
          ) : demoDone ? (
            <>
              <svg className="relative w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="relative">7 study tools ready</span>
            </>
          ) : (
            <span className="relative">Generate Study Pack</span>
          )}
        </button>
      </div>
    </div>
  );
}

