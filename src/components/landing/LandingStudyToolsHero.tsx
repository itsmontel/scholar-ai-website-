import { useEffect, useRef, useState } from 'react';
import LandingScrollReveal from './LandingScrollReveal';

interface LandingStudyToolsHeroProps {
  onNavigate: (page: string) => void;
}

type Tone = 'violet' | 'emerald' | 'amber' | 'fuchsia' | 'rose' | 'sky';

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
    tone: 'violet',
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
    tone: 'emerald',
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
    tone: 'amber',
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
    tone: 'sky',
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
    tone: 'fuchsia',
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
    tone: 'rose',
    badge: 'Free',
    navTo: 'study-pack',
    span: 'lg:col-span-6',
    objectPos: 'object-top',
  },
];

const TONE_STYLES: Record<Tone, { glow: string; accent: string; badge: string; ring: string; numBg: string }> = {
  violet: {
    glow: 'from-violet-500/30 via-violet-400/15 to-fuchsia-500/20 dark:from-violet-500/40 dark:via-violet-400/20 dark:to-fuchsia-500/30',
    accent: 'from-violet-500 via-fuchsia-500 to-violet-500',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    ring: 'ring-violet-300/40 dark:ring-violet-500/30',
    numBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
  },
  emerald: {
    glow: 'from-emerald-500/25 via-teal-400/15 to-emerald-500/20 dark:from-emerald-500/35 dark:via-teal-400/20 dark:to-emerald-500/30',
    accent: 'from-emerald-400 via-teal-400 to-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    ring: 'ring-emerald-300/40 dark:ring-emerald-500/30',
    numBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  amber: {
    glow: 'from-amber-400/30 via-orange-400/15 to-amber-400/20 dark:from-amber-400/35 dark:via-orange-400/20 dark:to-amber-400/25',
    accent: 'from-amber-400 via-orange-400 to-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    ring: 'ring-amber-300/40 dark:ring-amber-500/30',
    numBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
  fuchsia: {
    glow: 'from-fuchsia-500/30 via-violet-500/20 to-fuchsia-500/30 dark:from-fuchsia-500/40 dark:via-violet-500/30 dark:to-fuchsia-500/40',
    accent: 'from-fuchsia-500 via-violet-500 to-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
    ring: 'ring-fuchsia-300/40 dark:ring-fuchsia-500/30',
    numBg: 'bg-gradient-to-br from-fuchsia-500 to-violet-600',
  },
  rose: {
    glow: 'from-rose-400/25 via-pink-400/15 to-rose-400/20 dark:from-rose-400/30 dark:via-pink-400/15 dark:to-rose-400/25',
    accent: 'from-rose-400 via-pink-400 to-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    ring: 'ring-rose-300/40 dark:ring-rose-500/30',
    numBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
  },
  sky: {
    glow: 'from-sky-400/25 via-blue-400/15 to-sky-400/20 dark:from-sky-400/30 dark:via-blue-400/15 dark:to-sky-400/25',
    accent: 'from-sky-400 via-blue-400 to-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    ring: 'ring-sky-300/40 dark:ring-sky-500/30',
    numBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
  },
};

export default function LandingStudyToolsHero({ onNavigate }: LandingStudyToolsHeroProps) {
  return (
    <section
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden border-t border-stone-200/90 dark:border-stone-800 scroll-mt-20"
      aria-labelledby="landing-study-tools-heading"
      id="study-tools"
    >
      {/* ─── Layered backgrounds ─── */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-violet-50/30 to-white dark:from-stone-950 dark:via-violet-950/20 dark:to-stone-950" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(124,58,237,0.10),transparent_60%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(139,92,246,0.18),transparent_62%)] pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_85%_60%,rgba(217,70,239,0.07),transparent_60%)] dark:bg-[radial-gradient(ellipse_55%_40%_at_85%_60%,rgba(217,70,239,0.12),transparent_60%)] pointer-events-none" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none bg-[length:42px_42px] bg-[linear-gradient(to_right,rgba(124,58,237,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(124,58,237,0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)] dark:bg-[linear-gradient(to_right,rgba(167,139,250,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(167,139,250,0.07)_1px,transparent_1px)]"
        aria-hidden
      />
      {/* Floating ambient orbs */}
      <div className="pointer-events-none absolute top-16 left-[8%] h-40 w-40 rounded-full bg-violet-400/20 dark:bg-violet-500/15 blur-3xl lsth-orb" aria-hidden />
      <div className="pointer-events-none absolute bottom-24 right-[6%] h-56 w-56 rounded-full bg-fuchsia-400/15 dark:bg-fuchsia-500/15 blur-3xl lsth-orb-delay" aria-hidden />
      <div className="pointer-events-none absolute top-1/2 left-[40%] h-72 w-72 rounded-full bg-violet-300/10 dark:bg-violet-400/10 blur-3xl lsth-orb" style={{ animationDelay: '1.4s' }} aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Headline ─── */}
        <LandingScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 lg:mb-16">
            <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-violet-200/80 dark:border-violet-700/60 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Study tools · live in dashboard
              </span>
            </div>
            <h2
              id="landing-study-tools-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.1] mb-5"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              <span className="block">Transform your notes into</span>
              <span className="relative inline-block mt-1 sm:mt-1.5 text-orange-600 dark:text-orange-400">
                6 powerful study tools
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2 text-orange-400/80 dark:text-orange-500/70"
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
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto font-sans font-normal">
              Flashcards, quizzes, crosswords, lessons and arcade games — all generated from your own notes in under 60
              seconds.
            </p>
          </div>
        </LandingScrollReveal>

        {/* ─── Pipeline: notes → AI → six tools ─── */}
        <LandingScrollReveal delayMs={120}>
          <div className="relative mb-14 sm:mb-20">
            {/* Study Pack–style input (tabs + textarea + actions) */}
            <div className="max-w-3xl mx-auto">
              <NotesPanel onNavigate={onNavigate} />
            </div>

            {/* "Becomes" connector */}
            <div className="my-8 sm:my-10 flex flex-col items-center gap-2 text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/70 dark:border-violet-700/50 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M10 2l1.8 5.4L17 9l-5.2 1.6L10 16l-1.8-5.4L3 9l5.2-1.6L10 2z" />
                </svg>
                Becomes
              </span>
              <svg className="w-5 h-5 text-violet-400 dark:text-violet-500 lsth-bounce" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>

            {/* The 6 outputs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto">
              {OUTPUT_ITEMS.map((item, i) => (
                <OutputTile key={item.label} item={item} delayMs={i * 70} />
              ))}
            </div>

            {/* Cue arrow into the bento grid below */}
            <div className="mt-8 sm:mt-12 flex flex-col items-center gap-2 text-stone-500 dark:text-stone-400">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">Each tool, in detail</span>
              <svg className="w-4 h-4 lsth-bounce" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </LandingScrollReveal>

        {/* ─── Bento grid wrapper with sticker annotations ─── */}
        <div className="relative">
          {/* Floating annotation stickers (decoration only) */}
          <Sticker className="hidden lg:flex -top-6 -left-3 rotate-[-4deg]" tone="emerald" emoji="✨">
            <span className="font-semibold">Free plan</span> included
          </Sticker>
          <Sticker className="hidden lg:flex -top-4 -right-2 rotate-[3deg]" tone="amber" emoji="⚡">
            Built in <span className="font-semibold">&lt;60s</span>
          </Sticker>
          <Sticker className="hidden xl:flex top-1/2 -left-10 -translate-y-1/2 rotate-[-6deg]" tone="violet" emoji="🎯">
            <span className="font-semibold">92%</span> recall rate
          </Sticker>
          <Sticker className="hidden xl:flex top-1/3 -right-8 rotate-[5deg]" tone="fuchsia" emoji="🎮">
            <span className="font-semibold">Boss-battle</span> revision
          </Sticker>
          <Sticker className="hidden lg:flex -bottom-3 left-1/4 rotate-[-3deg]" tone="rose" emoji="🔥">
            <span className="font-semibold">12-day</span> streaks
          </Sticker>

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
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 text-white font-bold text-base shadow-[0_20px_50px_-15px_rgba(124,58,237,0.55)] hover:shadow-[0_28px_70px_-15px_rgba(124,58,237,0.7)] transition-all duration-300 hover:-translate-y-0.5 ring-1 ring-white/15 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden />
                <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,0.25),transparent_60%)]" aria-hidden />
                <span className="relative">Try Study Pack free</span>
                <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('more-tools')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-stone-300 dark:border-stone-600 bg-white/80 dark:bg-stone-900/60 backdrop-blur text-stone-800 dark:text-stone-100 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800/70 hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-200"
              >
                Browse all tools
                <span className="text-stone-400">→</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free plan included
              </span>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span>No credit card</span>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span>Cancel anytime</span>
            </p>
          </div>
        </LandingScrollReveal>
      </div>

      <style>{`
        @keyframes lsthOrb { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-12px) scale(1.05); } }
        @keyframes lsthOrbDelay { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-12px,10px) scale(1.04); } }
        @keyframes lsthShineText { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
        @keyframes lsthShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(120%); } }
        @keyframes lsthFloatCard { 0%,100% { transform: translateY(0) rotate(var(--lsth-rot, 0deg)); } 50% { transform: translateY(-6px) rotate(var(--lsth-rot, 0deg)); } }
        @keyframes lsthCaret { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes lsthBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        @keyframes lsthTilePop { 0% { transform: translateY(8px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        .lsth-orb { animation: lsthOrb 14s ease-in-out infinite; }
        .lsth-orb-delay { animation: lsthOrbDelay 16s ease-in-out infinite; }
        .lsth-shine-text { animation: lsthShineText 6s linear infinite; }
        .lsth-shimmer { animation: lsthShimmer 1.4s ease-out 0.6s both; }
        .lsth-floatcard { display: inline-flex; animation: lsthFloatCard 5s ease-in-out infinite; }
        .lsth-floatcard:nth-child(2n) { animation-duration: 6s; animation-delay: -1.4s; }
        .lsth-floatcard:nth-child(3n) { animation-duration: 7s; animation-delay: -2.6s; }
        .lsth-caret { animation: lsthCaret 1.05s steps(1) infinite; }
        .lsth-bounce { animation: lsthBounce 1.6s ease-in-out infinite; }
        .lsth-tile-pop { animation: lsthTilePop 0.5s cubic-bezier(.22,1.2,.36,1) backwards; }
        @media (prefers-reduced-motion: reduce) {
          .lsth-orb, .lsth-orb-delay, .lsth-shine-text, .lsth-shimmer, .lsth-floatcard, .lsth-caret,
          .lsth-bounce, .lsth-tile-pop { animation: none; }
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
  const cardRef = useRef<HTMLButtonElement | null>(null);

  const mediaAspectClass =
    tool.video && tool.featured ? 'aspect-[21/9]' : tool.featured ? 'aspect-[2/1]' : 'aspect-[16/9]';

  // Mouse-follow spotlight (sets --mx / --my CSS vars in % so a radial gradient can track the cursor).
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

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
      ref={cardRef}
      type="button"
      onClick={() => onNavigate(tool.navTo)}
      onMouseMove={handleMouseMove}
      className={`group relative w-full h-full text-left rounded-3xl border border-stone-200/90 dark:border-stone-700/70 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-stone-300 dark:hover:border-stone-600 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)] hover:shadow-[0_30px_80px_-30px_rgba(91,33,182,0.35)] dark:shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] ${tool.minH ?? ''}`}
      style={{ ['--mx' as string]: '50%', ['--my' as string]: '50%' }}
    >
      {/* Mouse-follow spotlight (subtle radial highlight that tracks the cursor) */}
      <span
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_220px_at_var(--mx)_var(--my),rgba(124,58,237,0.10),transparent_70%)] dark:bg-[radial-gradient(circle_220px_at_var(--mx)_var(--my),rgba(167,139,250,0.14),transparent_70%)]"
        aria-hidden
      />

      {/* Animated halo behind card on hover */}
      <span
        className={`pointer-events-none absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br ${styles.glow} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10`}
        aria-hidden
      />

      {/* Top accent line */}
      <span
        className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${styles.accent} opacity-90`}
        aria-hidden
      />

      {/* Card chrome / header */}
      <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold tabular-nums shadow-md ${styles.numBg}`} aria-hidden>
              {tool.num}
            </span>
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              {tool.title}
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
            {tool.subtitle}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
          {tool.badge}
        </span>
      </div>

      {/* Description */}
      <p className="relative px-4 sm:px-5 pb-3 text-sm text-stone-600 dark:text-stone-300 leading-snug">
        {tool.desc}
      </p>

      {/* Image area */}
      <div
        ref={mediaWrapRef}
        className={`relative mx-2.5 sm:mx-3 mb-2.5 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden ring-1 ${styles.ring} ${
          tool.dark
            ? 'bg-gradient-to-br from-indigo-950 via-violet-950 to-stone-950'
            : 'bg-gradient-to-br from-stone-50 via-white to-stone-100/70 dark:from-stone-800/60 dark:via-stone-900 dark:to-stone-900'
        } ${mediaAspectClass}`}
      >
        {/* Skeleton shimmer until loaded */}
        {!loaded && (
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 bg-stone-100 dark:bg-stone-800/60" />
            <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent lsth-shimmer" />
          </div>
        )}

        {/* Browser chrome strip on top */}
        <div
          className={`relative z-10 flex ${MEDIA_CHROME_H} shrink-0 items-center gap-1 px-2.5 border-b border-stone-200/80 dark:border-stone-700/60 bg-white/85 dark:bg-stone-900/85 backdrop-blur-sm`}
        >
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[10px] text-stone-400 dark:text-stone-500 font-medium truncate">
            writescholar.app · {tool.title.toLowerCase()}
          </span>
          {tool.video && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-500/15 dark:bg-red-500/25 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-300 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden />
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
            className={`absolute inset-0 ${MEDIA_TOP} w-full h-[calc(100%-1.75rem)] object-cover ${tool.objectPos || 'object-center'} transition-all duration-700 group-hover:scale-[1.04] ${
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
            className={`absolute inset-0 ${MEDIA_TOP} w-full h-[calc(100%-1.75rem)] object-cover ${tool.objectPos || 'object-top'} transition-all duration-700 group-hover:scale-[1.04] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Soft edge fade so screenshots don't fight with the frame */}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-xl sm:rounded-2xl" aria-hidden />
        <div className={`pointer-events-none absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t ${tool.dark ? 'from-stone-950/60' : 'from-white/40 dark:from-stone-900/50'} to-transparent`} aria-hidden />

        {/* Hover overlay CTA */}
        <div className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-stone-900/95 border border-stone-200/80 dark:border-stone-700 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-stone-800 dark:text-stone-100 shadow-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Open {tool.title}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Featured ribbon */}
        {tool.featured && (
          <div className="absolute top-9 right-2.5 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-700/30">
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
  emerald: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/60',
  amber: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/60',
  violet: 'bg-violet-50 dark:bg-violet-950/70 text-violet-800 dark:text-violet-200 border-violet-200/80 dark:border-violet-800/60',
  fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-950/70 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-200/80 dark:border-fuchsia-800/60',
  rose: 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/60',
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
      className={`pointer-events-none absolute z-20 items-center gap-1.5 rounded-full border ${STICKER_TONES[tone]} px-2.5 py-1 text-[11px] font-medium shadow-md backdrop-blur lsth-floatcard ${className}`}
      aria-hidden
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span>{children}</span>
    </div>
  );
}

/* ─────────────────── Pipeline pieces ─────────────────── */

const DEMO_NOTES_TEXT = `Cell Biology · Lecture 4 — Mitochondria

The mitochondrion generates ATP through oxidative phosphorylation. Electrons pass down the electron transport chain, pumping H⁺ across the inner membrane.

Key terms: ATP synthase, cristae, matrix, proton gradient, chemiosmosis

Cristae fold the inner membrane to pack in more respiratory machinery for exam-heavy courses.`;

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

function NotesPanel({ onNavigate }: LandingStudyToolsHeroProps) {
  const [tab, setTab] = useState<NotesInputTab>('paste');
  const [pasteText, setPasteText] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const textForCount =
    tab === 'paste' ? pasteText : tab === 'notes' ? DEMO_NOTES_TEXT : '';
  const wc = landingStudyWordCount(textForCount);
  const MIN_WORDS = 50;
  const canGenerate = (tab === 'paste' || tab === 'notes') && wc >= MIN_WORDS;

  const stashDraftAndGo = () => {
    const payload = tab === 'paste' ? pasteText : DEMO_NOTES_TEXT;
    if (landingStudyWordCount(payload) < MIN_WORDS) return;
    try {
      sessionStorage.setItem('writescholar_dashboard_draft', payload);
    } catch {
      /* ignore quota / privacy mode */
    }
    onNavigate('study-pack');
  };

  return (
    <div className="w-full">
      {/* Segmented tabs — reference: calm, light chrome */}
      <div
        className="mb-4 flex flex-wrap items-center gap-1 rounded-2xl border border-amber-100/90 dark:border-stone-700/80 bg-[#faf8f5] dark:bg-stone-900/80 p-1.5 shadow-sm"
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
              onClick={() => setTab(id)}
              className={`relative flex-1 min-w-[4.5rem] sm:min-w-0 rounded-xl px-3 py-2 text-center text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-amber-200/80 dark:ring-stone-600'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main field — warm border, large radius (matches reference) */}
      <div className="rounded-[1.75rem] border border-amber-200/90 dark:border-amber-900/40 bg-[#fdfcfa] dark:bg-stone-950 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="relative">
          {tab === 'pdf' || tab === 'docx' ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <p className="text-sm sm:text-[15px] text-stone-600 dark:text-stone-400 max-w-sm leading-relaxed">
                Upload a {tab === 'pdf' ? 'PDF' : 'Word'} file on Study Pack — we&apos;ll extract the text and build your six tools.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('study-pack')}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-100 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
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
                value={tab === 'notes' ? DEMO_NOTES_TEXT : pasteText}
                onChange={tab === 'paste' ? (e) => setPasteText(e.target.value) : undefined}
                placeholder="Paste your study notes, textbook chapter, article, or any learning material here... (minimum 50 words)"
                rows={tab === 'notes' ? 8 : 9}
                className="block w-full min-h-[220px] resize-y rounded-[1.65rem] border-0 bg-transparent px-5 pt-5 pb-12 text-[15px] sm:text-[15px] leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-0"
              />
              <div className="pointer-events-none absolute bottom-4 left-5 text-[13px] text-stone-400 dark:text-stone-500 tabular-nums">
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
          className="inline-flex sm:flex-none items-center justify-center gap-2 rounded-2xl border border-stone-200/95 dark:border-stone-600 bg-white dark:bg-stone-900 px-5 py-3.5 text-sm font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 text-stone-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload file
        </button>
        <button
          type="button"
          disabled={!canGenerate}
          onClick={stashDraftAndGo}
          className={`inline-flex flex-1 items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-colors shadow-sm ${
            canGenerate
              ? 'bg-neutral-700 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-white'
              : 'bg-stone-400/85 dark:bg-stone-700 text-white/90 cursor-not-allowed'
          }`}
        >
          Generate Study Pack
        </button>
      </div>
    </div>
  );
}

const OUTPUT_TONES: Record<string, string> = {
  violet: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
  emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-600',
  sky: 'bg-gradient-to-br from-sky-500 to-blue-600',
  fuchsia: 'bg-gradient-to-br from-fuchsia-500 to-violet-600',
  rose: 'bg-gradient-to-br from-rose-500 to-pink-600',
};

type OutputItem = {
  icon: React.ReactNode;
  label: string;
  sub: string;
  tone: keyof typeof OUTPUT_TONES;
};

const OUTPUT_ITEMS: OutputItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v10h10V5H5z" />
        <path d="M7 8h6v1H7V8zm0 2.5h6v1H7v-1z" />
      </svg>
    ),
    label: 'Flashcards',
    sub: 'Adaptive recall',
    tone: 'violet',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Quizzes',
    sub: 'Auto-graded',
    tone: 'emerald',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M3 4h6v6H3V4zm8 0h6v3h-6V4zm0 5h6v6h-6V9zm-8 3h6v3H3v-3z" />
      </svg>
    ),
    label: 'Crosswords',
    sub: 'Vocab puzzles',
    tone: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M10 1l2.39 6.66H19l-5.31 4.07L15.78 19 10 14.93 4.22 19l2.09-7.27L1 7.66h6.61L10 1z" />
      </svg>
    ),
    label: 'Crater Blast',
    sub: 'Arcade quiz',
    tone: 'sky',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M5 14h10v3H5v-3zm-1-4h12v3H4v-3zm1-4h10v3H5V6zm1-4h8v3H6V2z" />
      </svg>
    ),
    label: 'Word Tower',
    sub: 'Vocab game',
    tone: 'fuchsia',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4h10v2H5V7zm0 4h10v2H5v-2z" />
      </svg>
    ),
    label: 'Lessons',
    sub: 'Walk-throughs',
    tone: 'rose',
  },
];

function OutputTile({ item, delayMs = 0 }: { item: OutputItem; delayMs?: number }) {
  return (
    <div
      className="relative rounded-2xl border border-stone-200/90 dark:border-stone-700/70 bg-white dark:bg-stone-900 p-3.5 sm:p-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)] hover:shadow-[0_18px_40px_-15px_rgba(91,33,182,0.30)] hover:border-violet-300 dark:hover:border-violet-600 hover:-translate-y-0.5 transition-all duration-300 lsth-tile-pop"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={`mb-2.5 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white shadow-md ${OUTPUT_TONES[item.tone]}`}>
        {item.icon}
      </div>
      <p className="text-[13px] sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
        {item.label}
      </p>
      <p className="mt-0.5 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
        {item.sub}
      </p>
    </div>
  );
}

