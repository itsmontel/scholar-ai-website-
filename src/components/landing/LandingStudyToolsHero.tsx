import { useCallback, useEffect, useRef, useState } from 'react';
import LandingScrollReveal from './LandingScrollReveal';

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
  featured?: boolean;
  dark?: boolean;
}

const TOOLS: ToolCard[] = [
  {
    num: '01',
    title: 'Flashcards',
    subtitle: 'Adaptive recall',
    desc: 'AI-built flashcards with click-to-flip, mark-as-known, and PDF/DOCX export.',
    image: '/flashcard pic.png',
    alt: 'WriteScholar flashcard interface showing a Piaget question card with flip and navigation controls',
    tone: 'blue',
    badge: 'Core',
    navTo: 'create-flashcards',
    span: 'lg:col-span-7',
    objectPos: 'object-center',
    featured: true,
  },
  {
    num: '02',
    title: 'Quizzes',
    subtitle: 'Mixed-format · auto-graded',
    desc: 'Multiple choice, true/false and fill-in-the-blank. Adjust difficulty and length.',
    image: '/quiz pic.png',
    alt: 'WriteScholar quiz showing question 3 of 10 with four multiple-choice options',
    tone: 'green',
    badge: 'Core',
    navTo: 'quiz-generator',
    span: 'lg:col-span-5',
    objectPos: 'object-top',
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
    title: 'Crater Blast',
    subtitle: 'AI quiz arcade game',
    desc: 'Blast the right answer before the asteroid lands. A boss-battle take on revision.',
    video: '/writescholar-crater-blast-demo.mp4',
    alt: 'WriteScholar Crater Blast game demo — answer asteroids fall toward a planet and you blast the correct one',
    tone: 'duoBlue',
    badge: 'Game',
    navTo: 'crater-blast',
    span: 'lg:col-span-6',
    dark: true,
  },
  {
    num: '05',
    title: 'Word Tower',
    subtitle: 'Arcade vocab game',
    desc: 'Stack the right words, beat your streak, climb the daily leaderboard.',
    image: '/study-pack-previews/word-tower.png',
    alt: 'WriteScholar Word Tower arcade game with starfield background and word blocks',
    tone: 'purple',
    badge: 'Game',
    navTo: 'word-tower',
    span: 'lg:col-span-6',
    objectPos: 'object-center',
    dark: true,
  },
  {
    num: '06',
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
  {
    num: '07',
    title: 'Word Blitz',
    subtitle: '60-second cloze speedrun',
    desc: 'Read the sentence, tap the missing word. Speed bonus rewards fast answers — beat the clock.',
    image: '/study-pack-previews/word-blitz.png',
    alt: 'WriteScholar Word Blitz fill-in-the-blank speedrun game with a 60-second timer and four answer choices',
    tone: 'orange',
    badge: 'Game',
    navTo: 'word-blitz',
    span: 'lg:col-span-12',
    objectPos: 'object-center',
    featured: true,
  },
];

const TONE_STYLES: Record<Tone, { border: string; accent: string; badge: string; ring: string; numBg: string; tint: string }> = {
  blue: {
    border: 'border-[#1899D6]',
    accent: 'bg-[#1CB0F6]',
    badge: 'bg-[#DDF4FF] text-[#1CB0F6]',
    ring: 'ring-[#1CB0F6]/30',
    numBg: 'bg-[#1CB0F6]',
    tint: 'bg-[#DDF4FF]',
  },
  green: {
    border: 'border-[#46A302]',
    accent: 'bg-[#58CC02]',
    badge: 'bg-[#E5F8D0] text-[#58CC02]',
    ring: 'ring-[#58CC02]/30',
    numBg: 'bg-[#58CC02]',
    tint: 'bg-[#E5F8D0]',
  },
  orange: {
    border: 'border-[#D97F00]',
    accent: 'bg-[#FF9600]',
    badge: 'bg-[#FFF4E0] text-[#FF9600]',
    ring: 'ring-[#FF9600]/30',
    numBg: 'bg-[#FF9600]',
    tint: 'bg-[#FFF4E0]',
  },
  purple: {
    border: 'border-[#8A48C7]',
    accent: 'bg-[#A560E8]',
    badge: 'bg-[#F3EAFF] text-[#A560E8]',
    ring: 'ring-[#A560E8]/30',
    numBg: 'bg-[#A560E8]',
    tint: 'bg-[#F3EAFF]',
  },
  red: {
    border: 'border-[#E04343]',
    accent: 'bg-[#FF4B4B]',
    badge: 'bg-[#FFE8E8] text-[#FF4B4B]',
    ring: 'ring-[#FF4B4B]/30',
    numBg: 'bg-[#FF4B4B]',
    tint: 'bg-[#FFE8E8]',
  },
  duoBlue: {
    border: 'border-[#1899D6]',
    accent: 'bg-[#1CB0F6]',
    badge: 'bg-[#DDF4FF] text-[#1CB0F6]',
    ring: 'ring-[#1CB0F6]/30',
    numBg: 'bg-[#1CB0F6]',
    tint: 'bg-[#DDF4FF]',
  },
};

export default function LandingStudyToolsHero({ onNavigate }: LandingStudyToolsHeroProps) {
  return (
    <section
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden border-t-2 border-[#E5E5E5] dark:border-[#4A4A4A] scroll-mt-20"
      aria-labelledby="landing-study-tools-heading"
      id="study-tools"
    >
      {/* ─── Clean background ─── */}
      <div className="absolute inset-0 bg-[#F7F7F7] dark:bg-[#3C3C3C]" aria-hidden />

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
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-b-4 border-[#E5E5E5] bg-white dark:bg-[#3C3C3C] dark:border-[#4A4A4A] px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58CC02] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58CC02]" />
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#3C3C3C] dark:text-white">
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
                7 powerful study tools
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
              Flashcards, quizzes, crosswords, lessons and arcade games — all generated from your own notes in under 60
              seconds.
            </p>
          </div>
        </LandingScrollReveal>

        {/* ─── Pipeline: notes → AI → seven tools ─── */}
        <LandingScrollReveal delayMs={120}>
          <div className="relative mb-14 sm:mb-20">
            {/* Study Pack–style input (tabs + textarea + actions) */}
            <div className="max-w-3xl mx-auto">
              <NotesPanel onNavigate={onNavigate} />
            </div>

            {/* Cue arrow into the bento grid below */}
            <div className="mt-8 sm:mt-12 flex flex-col items-center gap-2 text-[#AFAFAF] dark:text-stone-400">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em]">Each tool, in detail</span>
              <svg className="w-4 h-4 lsth-bounce" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </LandingScrollReveal>

        {/* ─── Bento grid wrapper ─── */}
        <div className="relative">
          {/* The four floating sticker annotations ("Free plan included",
              "Built in <60s", "92% recall rate", "Boss-battle revision")
              were removed per user feedback — they added visual noise and
              the trust signals are already covered by the CTA strip below
              ("Free plan included · No credit card · Cancel anytime"). */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 auto-rows-min">
            {TOOLS.map((tool, i) => (
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
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#58CC02] text-white font-extrabold text-base border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
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
                <svg className="w-3.5 h-3.5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
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

  return (
    <button
      type="button"
      onClick={() => onNavigate(tool.navTo)}
      className={`group relative w-full h-full text-left rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 ${tool.minH ?? ''}`}
    >
      {/* Top accent line */}
      <span
        className={`absolute top-0 inset-x-0 h-1 ${styles.accent}`}
        aria-hidden
      />

      {/* Card chrome / header */}
      <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-extrabold tabular-nums border-2 border-b-[3px] ${styles.border} ${styles.numBg}`} aria-hidden>
              {tool.num}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-white leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
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
      <p className="relative px-4 sm:px-5 pb-3 text-sm text-[#777] dark:text-stone-300 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        {tool.desc}
      </p>

      {/* Image area */}
      <div
        ref={mediaWrapRef}
        className={`relative mx-2.5 sm:mx-3 mb-2.5 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#E5E5E5] dark:border-[#4A4A4A] ${
          tool.dark
            ? 'bg-[#3C3C3C]'
            : 'bg-[#F7F7F7] dark:bg-[#2C2C2C]'
        } ${mediaAspectClass}`}
      >
        {/* Skeleton shimmer until loaded */}
        {!loaded && (
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 bg-[#F7F7F7] dark:bg-[#2C2C2C]" />
            <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent lsth-shimmer" />
          </div>
        )}

        {/* Browser chrome strip on top */}
        <div
          className={`relative z-10 flex ${MEDIA_CHROME_H} shrink-0 items-center gap-1 px-2.5 border-b-2 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C]`}
        >
          <span className="h-2 w-2 rounded-full bg-[#FF4B4B]" />
          <span className="h-2 w-2 rounded-full bg-[#FF9600]" />
          <span className="h-2 w-2 rounded-full bg-[#58CC02]" />
          <span className="ml-2 text-[10px] text-[#AFAFAF] dark:text-stone-500 font-bold truncate">
            writescholar.com · {tool.title.toLowerCase()}
          </span>
          {tool.video && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#FFE8E8] px-1.5 py-0.5 text-[9px] font-extrabold text-[#FF4B4B] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4B4B] motion-safe:animate-pulse" aria-hidden />
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
            preload="metadata"
            aria-label={tool.alt}
            onLoadedData={() => setLoaded(true)}
            className={`absolute inset-0 ${MEDIA_TOP} w-full h-[calc(100%-1.75rem)] object-cover ${tool.objectPos || 'object-center'} transition-all duration-500 group-hover:scale-[1.02] ${
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
          <div className="absolute top-9 right-2.5 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#FF9600] border-2 border-[#D97F00] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
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
  green: 'bg-[#E5F8D0] text-[#58CC02] border-2 border-b-[3px] border-[#58CC02]/30',
  orange: 'bg-[#FFF4E0] text-[#FF9600] border-2 border-b-[3px] border-[#FF9600]/30',
  blue: 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-b-[3px] border-[#1CB0F6]/30',
  purple: 'bg-[#F3EAFF] text-[#A560E8] border-2 border-b-[3px] border-[#A560E8]/30',
  red: 'bg-[#FFE8E8] text-[#FF4B4B] border-2 border-b-[3px] border-[#FF4B4B]/30',
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
                  ? 'bg-[#DDF4FF] text-[#1CB0F6] border-2 border-[#1CB0F6]/30'
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
                <svg className="w-4 h-4 text-[#1CB0F6]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
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
                <div className="pointer-events-none absolute top-4 right-5 inline-flex items-center gap-1.5 rounded-full bg-[#DDF4FF] border-2 border-[#1CB0F6]/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#1CB0F6]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1CB0F6] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1CB0F6]" />
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
          <svg className="w-4 h-4 text-[#1CB0F6] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
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
                ? 'bg-[#58CC02] border-[#46A302] text-white'
                : canGenerate || demoPulsing
                  ? 'bg-[#3C3C3C] border-[#2C2C2C] text-white'
                  : 'bg-[#E5E5E5] border-[#CCCCCC] text-white/90 cursor-not-allowed'
          } ${
            demoPulsing
              ? 'ring-2 ring-[#1CB0F6]/60 ring-offset-2 ring-offset-white dark:ring-offset-[#3C3C3C]'
              : ''
          }`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {demoPulsing && (
            <span className="absolute inset-0 bg-[#1CB0F6]/20 motion-safe:animate-ping rounded-xl opacity-50" aria-hidden />
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

