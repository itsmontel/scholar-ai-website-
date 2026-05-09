import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { SKIP_ONBOARDING_STRIPE } from '../../config/featureFlags';
import { trackEvent } from '../../utils/analytics';
import BadgeCreature from '../common/BadgeCreature';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TRIAL_DAYS = 7;

/* ═══════════════════════════════════════════════════════════════
   OnboardingPage — Duolingo-style interactive onboarding

   Flow:
     Profile → Survey (source + features)
     → Tour (4 slides) → Daily Review Demo (3 Qs)
     → Results → Paywall → Dashboard

   Uses animated mascot WEBPs (mascot-laptop, mascot-thinking,
   mascot-jumping-joy, mascot-celebrating, etc.) instead of the
   static React mascot — feels alive and rewarding.

   Survey responses POST to /api/users/onboarding-survey for SQL
   analytics: marketing channel attribution + feature interest signal.
   ═══════════════════════════════════════════════════════════════ */

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string; username?: string; plan?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: {
    name?: string;
    username?: string;
    plan?: string;
    subscription_status?: string;
  }) => void;
  onLogout?: () => void;
}

type Phase =
  | 'intro'
  | 'celebrate'
  | 'profile'
  | 'survey-source'
  | 'survey-goal'
  | 'survey-features'
  | 'tour-essays'
  | 'tour-review'
  | 'tour-study'
  | 'tour-motivation'
  | 'daily-review-intro'
  | 'daily-review-demo'
  | 'daily-review-results'
  | 'paywall'
  | 'checkout'
  | 'verifying'
  | 'transition'
  | 'done';

/* ─── Step ordering — used for the top progress bar ─── */
const PHASE_STEP: Record<string, number> = {
  profile: 1,
  'survey-source': 2,
  'survey-goal': 3,
  'survey-features': 4,
  'tour-essays': 5,
  'tour-review': 6,
  'tour-study': 7,
  'tour-motivation': 8,
  'daily-review-intro': 9,
  'daily-review-demo': 10,
  'daily-review-results': 11,
  paywall: 12,
};
const TOTAL_STEPS = 12;

/* ─── Survey: What are you using WriteScholar for? (single-select goal) ─── */
const GOAL_OPTIONS = [
  { id: 'essays',  emoji: '📝', label: 'Improve my essays',     color: '#A560E8', borderColor: '#8A48C7', bgColor: '#F3EAFF', mascotResponse: "Great choice! Our essay analyzer gives you professor-level feedback on every paragraph — students raise their grades by a full letter on average." },
  { id: 'exams',   emoji: '📚', label: 'Study for my exams',    color: '#58CC02', borderColor: '#46A302', bgColor: '#E5F8D0', mascotResponse: "Perfect! Daily Review turns your notes into 5-minute quizzes — proven to triple how much you remember on exam day." },
  { id: 'grades',  emoji: '🎯', label: 'Get better grades',     color: '#1CB0F6', borderColor: '#1899D6', bgColor: '#DDF4FF', mascotResponse: "Love it! Combine essay feedback, daily practice, and study packs and you'll see your grades climb week by week." },
  { id: 'learn',   emoji: '🧠', label: 'Learn more efficiently', color: '#FF9600', borderColor: '#D97F00', bgColor: '#FFF4E0', mascotResponse: "Smart move! Flashcards, summaries, and quizzes from your own notes — the science-backed way to learn 4x faster." },
  { id: 'curious', emoji: '🌱', label: 'Just exploring',         color: '#58CC02', borderColor: '#46A302', bgColor: '#E5F8D0', mascotResponse: "Welcome! Take a look around — every tool is built to feel like a game, not a chore." },
  { id: 'other',   emoji: '✨', label: 'Other',                  color: '#FF4B4B', borderColor: '#E04343', bgColor: '#FFE8E8', mascotResponse: "Got it! WriteScholar adapts to whatever you're working on — let's find the tools that fit you best." },
];

/* ─── Brand logos for the "how did you hear" cards. Inlined as SVG so
   they're crisp at any size and don't need extra HTTP requests. ─── */
const BRAND_LOGOS: Record<string, JSX.Element> = {
  tiktok: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden>
      <path d="M19.321 5.562a5.122 5.122 0 0 1-1.296-.99 4.832 4.832 0 0 1-1.06-1.785A5.092 5.092 0 0 1 16.643 0h-3.292v13.59c0 1.467-.793 2.755-1.978 3.456a3.967 3.967 0 0 1-2.024.555c-2.196 0-3.978-1.815-3.978-4.05s1.782-4.05 3.978-4.05c.42 0 .823.067 1.202.19V6.334a7.366 7.366 0 0 0-1.202-.099C5.029 6.235 1.97 9.34 1.97 13.55c0 4.21 3.06 7.314 7.379 7.314 4.319 0 7.378-3.105 7.378-7.314V8.6a8.401 8.401 0 0 0 4.598 1.378V6.673a4.928 4.928 0 0 1-2.004-1.111z" fill="#000" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden>
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FED576" />
          <stop offset="26%" stopColor="#F47133" />
          <stop offset="61%" stopColor="#BC3081" />
          <stop offset="100%" stopColor="#4C63D2" />
        </radialGradient>
      </defs>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.21-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.69.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07 3.26 0 3.67-.01 4.95-.07 4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" fill="url(#ig-grad)" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-10 sm:h-10" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-10 sm:h-10" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#FF4500" />
      <path d="M19.62 11.62c0-.97-.79-1.76-1.76-1.76-.47 0-.9.19-1.21.49-1.2-.86-2.86-1.42-4.7-1.49l.8-3.78 2.62.55c.03.67.58 1.21 1.26 1.21.7 0 1.27-.57 1.27-1.27 0-.7-.57-1.27-1.27-1.27-.5 0-.93.29-1.13.71l-2.93-.62a.319.319 0 0 0-.36.22l-.89 4.21c-1.86.06-3.54.62-4.75 1.49-.31-.31-.74-.5-1.21-.5-.97 0-1.76.79-1.76 1.76 0 .72.43 1.33 1.04 1.6-.03.18-.05.36-.05.55 0 2.81 3.26 5.08 7.29 5.08 4.03 0 7.29-2.27 7.29-5.08 0-.18-.02-.36-.05-.54.62-.27 1.05-.89 1.05-1.61zM8.25 12.91c0-.7.57-1.27 1.27-1.27.7 0 1.27.57 1.27 1.27 0 .7-.57 1.27-1.27 1.27-.7 0-1.27-.57-1.27-1.27zm6.85 3.43c-.83.83-2.42.89-2.89.89-.47 0-2.06-.06-2.89-.89a.319.319 0 1 1 .45-.45c.53.53 1.65.71 2.45.71.79 0 1.92-.18 2.45-.71.12-.12.32-.12.45 0 .12.13.12.33-.02.45zm-.21-2.16c-.7 0-1.27-.57-1.27-1.27 0-.7.57-1.27 1.27-1.27.7 0 1.27.57 1.27 1.27 0 .7-.57 1.27-1.27 1.27z" fill="#fff" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="#000" />
    </svg>
  ),
};

/* ─── Survey 1: How did you hear about us? ─── */
const REFERRAL_SOURCES = [
  { id: 'tiktok',    label: 'TikTok',      emoji: '🎵', color: '#FF4B4B', borderColor: '#E04343', bgColor: '#FFE8E8', mascotReply: "TikTok, nice! Glad our videos found you 🎵" },
  { id: 'instagram', label: 'Instagram',   emoji: '📸', color: '#A560E8', borderColor: '#8A48C7', bgColor: '#F3EAFF', mascotReply: "Insta! Glad our reels caught your eye 📸" },
  { id: 'youtube',   label: 'YouTube',     emoji: '▶️', color: '#FF4B4B', borderColor: '#E04343', bgColor: '#FFE8E8', mascotReply: "YouTube — love it! Hope our videos hooked you ▶️" },
  { id: 'google',    label: 'Google',      emoji: '🔍', color: '#1CB0F6', borderColor: '#1899D6', bgColor: '#DDF4FF', mascotReply: "You searched and found us — smart move! 🔍" },
  { id: 'friend',    label: 'A friend',    emoji: '👥', color: '#58CC02', borderColor: '#46A302', bgColor: '#E5F8D0', mascotReply: "Best kind of intro — thank your friend for me! 👥" },
  { id: 'reddit',    label: 'Reddit',      emoji: '🔥', color: '#FF9600', borderColor: '#D97F00', bgColor: '#FFF4E0', mascotReply: "Reddit fam, welcome! 🔥" },
  { id: 'twitter',   label: 'X / Twitter', emoji: '🐦', color: '#1CB0F6', borderColor: '#1899D6', bgColor: '#DDF4FF', mascotReply: "From the timeline — let's go! 🐦" },
  { id: 'other',     label: 'Other',       emoji: '✨', color: '#A560E8', borderColor: '#8A48C7', bgColor: '#F3EAFF', mascotReply: "Cool — glad you found us, however you did! ✨" },
];

/* ─── Survey 2: What features excite you most? (multi-select) ─── */
const FEATURE_INTERESTS = [
  { id: 'essays',       emoji: '📝', label: 'Essay analysis',      desc: 'Get instant feedback & rubric scores',  color: '#A560E8', borderColor: '#8A48C7', bgColor: '#F3EAFF' },
  { id: 'daily_review', emoji: '📚', label: 'Daily Review',        desc: 'Practice every day, like Duolingo',     color: '#58CC02', borderColor: '#46A302', bgColor: '#E5F8D0' },
  { id: 'study_packs',  emoji: '🧠', label: 'Flashcards & quizzes', desc: 'Turn notes into study tools',          color: '#1CB0F6', borderColor: '#1899D6', bgColor: '#DDF4FF' },
  { id: 'citations',    emoji: '📖', label: 'Citations finder',    desc: 'Real sources in APA, MLA, Chicago',     color: '#FF9600', borderColor: '#D97F00', bgColor: '#FFF4E0' },
  { id: 'games',        emoji: '🎮', label: 'Quiz games',          desc: 'Crater Blast, Word Tower & more',       color: '#FF4B4B', borderColor: '#E04343', bgColor: '#FFE8E8' },
  { id: 'motivation',   emoji: '🔥', label: 'XP, levels, streaks', desc: 'Stay motivated with badges & streaks',  color: '#FF9600', borderColor: '#D97F00', bgColor: '#FFF4E0' },
];

/* ─── Demo quiz questions — easy and universal ─── */
const DEMO_QUESTIONS = [
  {
    question: 'What is the capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctIndex: 1,
  },
  {
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Earth', 'Mercury', 'Mars'],
    correctIndex: 2,
  },
  {
    question: 'How many days are in 3 weeks?',
    options: ['14', '18', '21', '28'],
    correctIndex: 2,
  },
];

const XP_PER_QUESTION = 10;

const CONFETTI_COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#A560E8', '#FFD700'];

const EMBEDDED_CHECKOUT_FALLBACK =
  "We couldn't load secure checkout. Please refresh the page in a moment. If this keeps happening, contact support so we can help.";

class UserFacingCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingCheckoutError';
  }
}

function getInitialPhase(): Phase {
  if (typeof window === 'undefined') return 'intro';
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === 'aha') return 'paywall';
  if (params.get('preview') === 'profile') return 'profile';
  const sid = params.get('session_id');
  return sid ? 'verifying' : 'intro';
}

/* ─── Paywall: full 8-tool showcase ─── */
type ToolBadge = 'Free' | 'Pro' | 'Game';
const PAYWALL_TOOLS: { title: string; desc: string; video?: string; image?: string; badge: ToolBadge; color: string; borderColor: string }[] = [
  { title: 'Essay Analyzer', desc: 'Line-by-line feedback & rubric scores',  video: '/writescholar-essay-checker-demo.mp4',   badge: 'Pro',  color: '#A560E8', borderColor: '#8A48C7' },
  { title: 'Flashcards',     desc: 'AI-built decks from your notes',         video: '/writescholar-flashcards-demo.mp4',      badge: 'Free', color: '#58CC02', borderColor: '#46A302' },
  { title: 'Quizzes',        desc: 'MCQ, true/false & fill-in-the-blank',    video: '/writescholar-quiz-generator-demo.mp4',  badge: 'Free', color: '#1CB0F6', borderColor: '#1899D6' },
  { title: 'Citations',      desc: 'APA, MLA, Chicago — real sources',       video: '/writescholar-citation-finder-demo.mp4', badge: 'Pro',  color: '#1CB0F6', borderColor: '#1899D6' },
  { title: 'Crater Blast',   desc: 'Boss-battle quiz arcade',                video: '/writescholar-crater-blast-demo.mp4',    badge: 'Game', color: '#FF9600', borderColor: '#D97F00' },
  { title: 'Crosswords',     desc: 'Vocabulary puzzles from your terms',     video: '/writescholar-crossword-demo.mp4',       badge: 'Free', color: '#FF4B4B', borderColor: '#E04343' },
  { title: 'Summarizer',     desc: 'Compress chapters into key points',      video: '/writescholar-summarizer-demo.mp4',      badge: 'Pro',  color: '#A560E8', borderColor: '#8A48C7' },
  { title: 'Word Tower',     desc: 'Stack words, beat your streak',          image: '/study-pack-previews/word-tower.png',    badge: 'Game', color: '#FF9600', borderColor: '#D97F00' },
];

const TOOL_BADGE_STYLE: Record<ToolBadge, { bg: string; border: string }> = {
  Free: { bg: '#58CC02', border: '#46A302' },
  Pro:  { bg: '#A560E8', border: '#8A48C7' },
  Game: { bg: '#FF9600', border: '#D97F00' },
};

/* Tool mini demo for tour-study — autoplay-on-visible video tile */
function ToolMiniDemo({ name, video, color, borderColor, delayMs = 0 }: { name: string; video: string; color: string; borderColor: string; delayMs?: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    const w = wrapRef.current;
    if (!v || !w || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }),
      { threshold: 0.25 }
    );
    obs.observe(w);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="ob-card-pop relative rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 overflow-hidden hover:-translate-y-0.5 transition-all"
      style={{ borderColor, animationDelay: `${delayMs}ms` }}
    >
      <div className="relative aspect-[16/10] bg-stone-100 dark:bg-stone-800 overflow-hidden">
        {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900 animate-pulse" aria-hidden />}
        <video
          ref={videoRef}
          src={video}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${name} demo`}
          onLoadedData={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <div className="px-3 py-2 flex items-center justify-center">
        <span className="text-xs sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ color }}>{name}</span>
      </div>
    </div>
  );
}

/* Tool card with autoplay-on-visible video */
function ToolCard({ tool, delayMs = 0 }: { tool: typeof PAYWALL_TOOLS[number]; delayMs?: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tool.video) return;
    const v = videoRef.current;
    const w = wrapRef.current;
    if (!v || !w || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(w);
    return () => obs.disconnect();
  }, [tool.video]);

  const badge = TOOL_BADGE_STYLE[tool.badge];

  return (
    <div
      ref={wrapRef}
      className="ob-tool-pop relative rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 overflow-hidden hover:-translate-y-1 transition-all"
      style={{ borderColor: tool.borderColor, animationDelay: `${delayMs}ms` }}
    >
      <div className="relative aspect-[16/10] bg-stone-100 dark:bg-stone-800 overflow-hidden">
        {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900 animate-pulse" aria-hidden />}
        {tool.video ? (
          <video
            ref={videoRef}
            src={tool.video}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${tool.title} demo`}
            onLoadedData={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : tool.image ? (
          <img
            src={tool.image}
            alt={`${tool.title} preview`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
        <span
          className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white border-2 border-b-2"
          style={{ backgroundColor: badge.bg, borderColor: badge.border }}
        >
          {tool.badge}
        </span>
      </div>
      <div className="px-3 py-3">
        <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">{tool.title}</p>
        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-bold leading-snug line-clamp-2">{tool.desc}</p>
      </div>
    </div>
  );
}

/* ─── Reusable mascot image helper. WEBP files are animated and ~1-3MB. ─── */
function MascotGif({
  src,
  alt = '',
  size = 140,
  bordered = false,
  borderColor = '#58CC02',
  bgColor = '#E5F8D0',
  className = '',
}: {
  src: string;
  alt?: string;
  size?: number;
  bordered?: boolean;
  borderColor?: string;
  bgColor?: string;
  className?: string;
}) {
  const ringSize = size + 32;
  if (bordered) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full border-4 ${className}`}
        style={{
          width: ringSize,
          height: ringSize,
          borderColor,
          backgroundColor: bgColor,
          boxShadow: `0 0 30px ${borderColor}25`,
        }}
      >
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */
const OnboardingPage = ({ user, onComplete, onUserUpdate, onNavigate }: OnboardingPageProps) => {
  const [phase, setPhase] = useState<Phase>(getInitialPhase);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  /* Survey state */
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [useGoal, setUseGoal] = useState<string | null>(null);
  const [featureInterests, setFeatureInterests] = useState<string[]>([]);
  const [surveySaving, setSurveySaving] = useState(false);

  /* Quiz state */
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpFloat, setShowXpFloat] = useState(false);

  /* Interactive tour state — drives the per-feature live demos */
  const [essayAnalyzing, setEssayAnalyzing] = useState(false);
  const [essayAnalyzed, setEssayAnalyzed] = useState(false);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [studyDemoSelected, setStudyDemoSelected] = useState<string | null>(null);
  const [tourXp, setTourXp] = useState(0);
  const [tourXpFloat, setTourXpFloat] = useState(false);
  const [tourBadgeUnlocked, setTourBadgeUnlocked] = useState(false);

  /* Tour-motivation looped animations — counts the streak up in real time
     so the page feels alive instead of static. */
  const [streakDisplay, setStreakDisplay] = useState(1);
  const [xpDisplay, setXpDisplay] = useState(1240);
  const [feedIndex, setFeedIndex] = useState(0);
  useEffect(() => {
    if (phase !== 'tour-motivation') return;
    let s = 1;
    let x = 1240;
    const streakTimer = setInterval(() => {
      s = s >= 14 ? 1 : s + 1;
      setStreakDisplay(s);
    }, 250);
    const xpTimer = setInterval(() => {
      // Cycle XP up by 10 each tick, looping back to base after a stretch.
      x = x >= 1500 ? 1240 : x + 10;
      setXpDisplay(x);
    }, 400);
    // Cycle the activity feed message every 2.2s — only one message visible
    // at a time, so they never overlap.
    const feedTimer = setInterval(() => {
      setFeedIndex((i) => (i + 1) % 5);
    }, 2200);
    return () => { clearInterval(streakTimer); clearInterval(xpTimer); clearInterval(feedTimer); };
  }, [phase]);

  /* Stripe state */
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const [embeddedLoading, setEmbeddedLoading] = useState(true);
  const checkoutHostRef = useRef<HTMLDivElement>(null);
  const embeddedInstanceRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  /* Animation */
  const [phaseVisible, setPhaseVisible] = useState(true);

  const TRANSITION_MS = 2400;
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';

  /* ─── Smooth phase transition ─── */
  const goToPhase = (next: Phase) => {
    setPhaseVisible(false);
    setTimeout(() => {
      setPhase(next);
      setPhaseVisible(true);
      // Scroll to top in case content overflows on small viewports.
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    }, 220);
  };

  /* ─── Transition timer ─── */
  useEffect(() => {
    if (phase !== 'transition') return;
    trackEvent('onboarding_complete');
    const t = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  useEffect(() => {
    if (phase === 'profile') trackEvent('onboarding_profile_view');
  }, [phase]);

  /* ─── Return from Stripe Embedded Checkout ─── */
  useEffect(() => {
    if (phase !== 'verifying') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) { setPhase('profile'); return; }

    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setPhase('profile'); return; }
        const res = await fetch(`${API_URL}/subscriptions/sync-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data?.plan) {
          onUserUpdate?.({ plan: data.data.plan, subscription_status: data.data.subscriptionStatus });
          window.history.replaceState({}, '', '/onboarding');
          setPhase('transition');
        } else if (SKIP_ONBOARDING_STRIPE) {
          window.history.replaceState({}, '', '/onboarding');
          setProfileNotice(data.message || 'We could not confirm that checkout. You can upgrade anytime from Billing.');
          setPhase('profile');
        } else {
          setEmbeddedError(data.message || 'We could not confirm your subscription yet. Please try again.');
          setPhase('checkout');
        }
      } catch {
        if (!cancelled) {
          if (SKIP_ONBOARDING_STRIPE) {
            window.history.replaceState({}, '', '/onboarding');
            setProfileNotice('Something went wrong confirming payment. You can try again from Billing.');
            setPhase('profile');
          } else {
            setEmbeddedError('Something went wrong confirming payment.');
            setPhase('checkout');
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [phase, onUserUpdate]);

  /* ─── Checkout trial eligibility ─── */
  useEffect(() => {
    if (phase !== 'checkout') return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const trialRes = await fetch(`${API_URL}/subscriptions/trial-eligibility`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let eligible = false;
        if (trialRes.ok) { const t = await trialRes.json(); eligible = t.trialEligible === true; }
        if (!cancelled) setTrialEligible(eligible);
      } catch { if (!cancelled) setTrialEligible(false); }
    })();
    return () => { cancelled = true; };
  }, [phase]);

  /* ─── Stripe embedded checkout mount ─── */
  useEffect(() => {
    if (phase !== 'checkout') return;
    if (trialEligible === null) return;
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!publishableKey) {
      setEmbeddedError(EMBEDDED_CHECKOUT_FALLBACK);
      setEmbeddedLoading(false);
      return;
    }
    const mountEl = checkoutHostRef.current;
    if (!mountEl) return;

    let instance: StripeEmbeddedCheckout | null = null;
    let destroyed = false;

    (async () => {
      try {
        setEmbeddedError(null);
        setEmbeddedLoading(true);
        embeddedInstanceRef.current?.destroy();
        embeddedInstanceRef.current = null;
        mountEl.innerHTML = '';

        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Not signed in');
        const returnUrl = `${window.location.origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`;
        const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planType: 'pro', billingCycle: 'monthly', embedded: true, returnUrl, trialPeriodDays: trialEligible ? TRIAL_DAYS : 0 }),
        });
        const data = await res.json();
        if (!res.ok) throw new UserFacingCheckoutError((typeof data?.message === 'string' && data.message) || 'We could not start checkout.');
        const clientSecret = data?.data?.clientSecret as string | undefined;
        if (!clientSecret) throw new UserFacingCheckoutError('We could not start checkout.');
        const stripe = await loadStripe(publishableKey);
        if (!stripe || destroyed) return;
        instance = await stripe.initEmbeddedCheckout({ clientSecret });
        if (destroyed) { instance.destroy(); return; }
        embeddedInstanceRef.current = instance;
        instance.mount(mountEl);
      } catch (e) {
        if (!destroyed) setEmbeddedError(e instanceof UserFacingCheckoutError ? e.message : EMBEDDED_CHECKOUT_FALLBACK);
      } finally {
        if (!destroyed) setEmbeddedLoading(false);
      }
    })();

    return () => { destroyed = true; instance?.destroy(); if (embeddedInstanceRef.current === instance) embeddedInstanceRef.current = null; };
  }, [phase, trialEligible]);

  /* ─── Profile save ─── */
  const saveProfile = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const token = localStorage.getItem('authToken');
    try {
      if (displayName.trim()) {
        const profileRes = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: displayName.trim() }),
        });
        if (profileRes.ok) onUserUpdate?.({ name: displayName.trim() });
      }
      if (username.trim()) {
        const normalized = username.trim().toLowerCase().replace(/\s/g, '_');
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          setUsernameError('Username must be 3-30 characters, letters, numbers, and underscores only');
          return false;
        }
        setUsernameError(null);
        const usernameRes = await fetch(`${API_URL}/users/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: normalized }),
        });
        const usernameData = await usernameRes.json();
        if (usernameRes.ok) {
          onUserUpdate?.({ username: normalized });
        } else {
          setUsernameError(usernameData.message || 'Username is already taken');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to save profile:', e);
      return false;
    }
  };

  /* ─── Survey save (fire-and-forget; failures don't block onboarding) ─── */
  const saveSurvey = async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      await fetch(`${API_URL}/users/onboarding-survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralSource, useGoal, featureInterests }),
      });
    } catch (e) {
      // Survey is analytical — don't fail onboarding if the API is down.
      console.warn('Survey submission failed (non-blocking):', e);
    }
  };

  /* ─── Phase handlers ─── */
  const handleIntroContinue = () => {
    trackEvent('onboarding_intro_continue');
    goToPhase('celebrate');
  };

  const handleCelebrateContinue = () => {
    trackEvent('onboarding_celebrate_continue');
    goToPhase('profile');
  };

  const handleContinueFromProfile = async () => {
    setIsSaving(true);
    const ok = await saveProfile();
    setIsSaving(false);
    if (!ok) return;
    setProfileNotice(null);
    trackEvent('onboarding_profile_complete');

    const plan = (user?.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium' || plan === 'focus') {
      goToPhase('transition');
      return;
    }
    goToPhase('survey-source');
  };

  const handleSelectSource = (id: string) => {
    setReferralSource(id);
    trackEvent('onboarding_survey_source_select', { source: id });
    // Don't auto-advance — wait for the user to tap Continue (matches
    // the survey-goal pattern, gives time to read the mascot's reply).
  };

  const handleSourceContinue = () => {
    if (!referralSource) return;
    goToPhase('survey-goal');
  };

  const handleSelectGoal = (id: string) => {
    setUseGoal(id);
    trackEvent('onboarding_survey_goal_select', { goal: id });
    // Don't auto-advance — show the mascot's tailored reply, then let the
    // user click Continue when they're ready.
  };

  const handleGoalContinue = () => {
    if (!useGoal) return;
    goToPhase('survey-features');
  };

  const handleToggleFeature = (id: string) => {
    setFeatureInterests((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleSurveyContinue = async () => {
    setSurveySaving(true);
    await saveSurvey();
    setSurveySaving(false);
    trackEvent('onboarding_survey_complete', { source: referralSource, features: featureInterests.join(',') });
    goToPhase('tour-essays');
  };

  const handleTourContinue = () => {
    const nextMap: Record<string, Phase> = {
      'tour-essays': 'tour-review',
      'tour-review': 'tour-study',
      'tour-study': 'tour-motivation',
      'tour-motivation': 'daily-review-intro',
    };
    goToPhase(nextMap[phase] || 'daily-review-intro');
  };

  /* ─── Interactive tour handlers ─── */
  const handleAnalyzeEssay = () => {
    if (essayAnalyzing || essayAnalyzed) return;
    setEssayAnalyzing(true);
    trackEvent('onboarding_tour_essay_analyze');
    // Simulated analysis delay — feels real, not instant.
    setTimeout(() => {
      setEssayAnalyzing(false);
      setEssayAnalyzed(true);
    }, 1200);
  };

  const handleFlipFlashcard = () => {
    setFlashcardFlipped((f) => !f);
    trackEvent('onboarding_tour_flashcard_flip');
  };

  const handleEarnTourXp = () => {
    if (tourXp >= 50) return;
    setTourXp((x) => Math.min(50, x + 10));
    setTourXpFloat(true);
    setTimeout(() => setTourXpFloat(false), 1200);
    if (tourXp + 10 >= 30 && !tourBadgeUnlocked) {
      setTourBadgeUnlocked(true);
      trackEvent('onboarding_tour_badge_unlock');
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (answerChecked) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setAnswerChecked(true);
    const correct = selectedAnswer === DEMO_QUESTIONS[quizIndex].correctIndex;
    if (correct) {
      setCorrectCount((c) => c + 1);
      setXpEarned((x) => x + XP_PER_QUESTION);
      setShowXpFloat(true);
      setTimeout(() => setShowXpFloat(false), 1500);
    }
  };

  const handleQuizContinue = () => {
    if (quizIndex < DEMO_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswerChecked(false);
    } else {
      goToPhase('daily-review-results');
    }
  };

  const handleStartTrial = async () => {
    if (startingTrial) return;
    trackEvent('onboarding_choose_trial');
    trackEvent('paywall_view', { source: 'onboarding_paywall_hosted' });
    setTrialError(null);
    setStartingTrial(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { onNavigate('login'); return; }
      let eligibleForTrial = false;
      try {
        const eligRes = await fetch(`${API_URL}/subscriptions/trial-eligibility`, { headers: { Authorization: `Bearer ${token}` } });
        if (eligRes.ok) { const e = await eligRes.json(); eligibleForTrial = e.trialEligible === true; }
      } catch { /* assume not eligible */ }
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/onboarding?preview=aha`;
      const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planType: 'pro', billingCycle: 'monthly', successUrl, cancelUrl, trialPeriodDays: eligibleForTrial ? TRIAL_DAYS : 0 }),
      });
      const data = await res.json().catch(() => null);
      const url = data?.data?.checkoutUrl;
      if (!res.ok || !url) {
        setTrialError((data && typeof data.message === 'string' && data.message) || 'We could not start checkout. Please try again.');
        setStartingTrial(false);
        return;
      }
      window.location.href = url;
    } catch {
      setTrialError('We could not start checkout. Please try again.');
      setStartingTrial(false);
    }
  };

  const handleContinueFree = () => {
    trackEvent('onboarding_choose_free');
    goToPhase('transition');
  };

  /* ═══════════ RENDER ═══════════ */
  const progressStep = PHASE_STEP[phase] || 0;
  const progressPercent = progressStep > 0 ? (progressStep / TOTAL_STEPS) * 100 : 0;

  /* Reusable top bar with logo + progress bar */
  const TopBar = ({ showProgress = true, showBack = false, onBack }: { showProgress?: boolean; showBack?: boolean; onBack?: () => void }) => (
    <>
      <div className="bg-white dark:bg-stone-900 border-b-2 border-[#E5E5E5] dark:border-stone-800 px-5 py-3 flex items-center gap-4">
        {showBack && (
          <button type="button" onClick={onBack} className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300" aria-label="Back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
            <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
        </div>
      </div>
      {showProgress && (
        <div className="h-3 bg-[#E5E5E5] dark:bg-stone-800 overflow-hidden">
          <div className="h-full bg-[#58CC02] rounded-r-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      )}
    </>
  );

  /* ─── VERIFYING ─── */
  if (phase === 'verifying') {
    return (
      <div className="min-h-screen bg-[#F7F7F7] dark:bg-stone-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <MascotGif src="/mascot-thinking.webp" alt="" size={120} bordered borderColor="#1CB0F6" bgColor="#DDF4FF" />
          </div>
          <p className="text-xl font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Confirming your membership…
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 font-bold">
            One moment while we finish setting up.
          </p>
          <div className="mt-5 mx-auto w-32 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
            <div className="h-full bg-[#1CB0F6] ob-progress-fill rounded-full" />
          </div>
        </div>
        <style>{`
          @keyframes obProgressFill { from { width: 0%; } to { width: 100%; } }
          .ob-progress-fill { animation: obProgressFill 2s linear infinite; }
        `}</style>
      </div>
    );
  }

  /* ─── TRANSITION ─── */
  if (phase === 'transition' || phase === 'done') {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 flex items-center justify-center overflow-hidden relative">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className="absolute ob-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                style={{
                  width: 6 + Math.random() * 6,
                  height: 6 + Math.random() * 6,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  borderRadius: i % 3 === 0 ? '50%' : 2,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-md ob-scale-in">
          <div className="mb-6">
            <MascotGif src="/mascot-celebrating.webp" alt="Mascot celebrating" size={160} bordered borderColor="#58CC02" bgColor="#E5F8D0" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Welcome to WriteScholar!
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400 font-bold text-base">
            Your journey starts now, {firstName} 🎉
          </p>
          <div className="mt-8 w-52 mx-auto h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#58CC02] rounded-full ob-progress-fill" />
          </div>
        </div>

        <style>{`
          @keyframes obConfettiFall {
            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
          .ob-confetti-fall { animation: obConfettiFall var(--dur, 3s) ease-out forwards; }
          @keyframes obScaleIn {
            0% { transform: scale(0.7); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .ob-scale-in { animation: obScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          @keyframes obProgressFill { from { width: 0%; } to { width: 100%; } }
          .ob-progress-fill { animation: obProgressFill 2.4s linear forwards; }
        `}</style>
      </div>
    );
  }

  /* ─── EMBEDDED CHECKOUT ─── */
  if (phase === 'checkout') {
    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showProgress={false} />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-8 max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <MascotGif src="/mascot-laptop.webp" alt="" size={96} bordered borderColor="#A560E8" bgColor="#F3EAFF" />
            <h1 className="mt-4 text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              You&apos;re in, {firstName}!
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 text-sm font-bold">
              {trialEligible === true
                ? `Start your ${TRIAL_DAYS}-day free trial below — no charge today.`
                : 'Unlock Pro below for stronger drafts and higher limits.'}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden shadow-lg">
            <div className="h-1 w-full bg-[#58CC02]" aria-hidden />
            <div className="p-4 min-h-[420px] relative">
              {embeddedLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-stone-900/90 z-10 rounded-xl">
                  <span className="w-10 h-10 border-[5px] border-[#58CC02] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-bold">Loading secure checkout…</p>
                </div>
              )}
              {embeddedError && !embeddedLoading && (
                <div className="mb-3 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-4 py-3 text-sm text-[#FF4B4B] font-bold">
                  {embeddedError}
                </div>
              )}
              <div ref={checkoutHostRef} className="min-h-[400px]" id="onboarding-embedded-checkout" />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <img src="/mascot-paper.webp" alt="" width={56} height={56} className="object-contain" />
              <div className="relative flex-1 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
                <p className="text-sm text-[#3C3C3C] dark:text-stone-200 font-bold">
                  No rush — you can <span className="text-[#58CC02]">start free</span> and upgrade later. ✌️
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinueFree}
              className="w-full py-3.5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 bg-white dark:bg-stone-900 text-[#3C3C3C] dark:text-stone-100 font-extrabold text-base hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Maybe later — keep me on the free plan
            </button>
          </div>

          <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4 font-bold">
            Secured by Stripe. WriteScholar never stores your full card number.
          </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── INTRO — first screen the user sees, Duolingo-style "Hi! I'm Scholar!" ─── */
  if (phase === 'intro') {
    return (
      <div className="h-screen bg-[#FFFCF7] dark:bg-stone-950 flex flex-col overflow-hidden">
        {/* Top thin progress line — empty, intro is "step 0" */}
        <div className="h-1.5 bg-[#E5E5E5] dark:bg-stone-800" aria-hidden />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className={`flex flex-col items-center transition-all duration-500 ${phaseVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Speech bubble */}
            <div className="relative ob-bubble-pop">
              <div className="relative rounded-3xl bg-white dark:bg-stone-900 border-2 border-[#E5E5E5] dark:border-stone-700 px-6 py-3.5 shadow-md">
                <p className="text-base sm:text-lg font-extrabold text-[#3C3C3C] dark:text-stone-100 whitespace-nowrap" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Hi there! I&apos;m Scholar!
                </p>
                {/* Pointer triangle below bubble */}
                <div
                  aria-hidden
                  className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-stone-900 border-r-2 border-b-2 border-[#E5E5E5] dark:border-stone-700 rotate-45"
                />
              </div>
            </div>

            {/* Mascot — celebrating to match the welcome energy */}
            <div className="mt-8 ob-mascot-bob">
              <img
                src="/mascot-celebrating.webp"
                alt="Scholar mascot waving hello"
                width={240}
                height={240}
                className="object-contain w-48 h-48 sm:w-60 sm:h-60"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Bottom action bar — sticky-feel like Duolingo */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleIntroContinue}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Continue
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obBubblePop {
            0% { transform: scale(0.6) translateY(10px); opacity: 0; }
            60% { transform: scale(1.05) translateY(-2px); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          .ob-bubble-pop { animation: obBubblePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards; }
          @keyframes obMascotBob {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-6px) scale(1.02); }
          }
          .ob-mascot-bob { animation: obMascotBob 2.4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .ob-bubble-pop, .ob-mascot-bob { animation: none; opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    );
  }

  /* ─── CELEBRATE — second welcome screen, "Yay! Let me show you around!" ─── */
  if (phase === 'celebrate') {
    return (
      <div className="h-screen bg-[#FFFCF7] dark:bg-stone-950 flex flex-col relative overflow-hidden">
        <div className="h-1.5 bg-[#E5E5E5] dark:bg-stone-800" aria-hidden />

        {/* Mini confetti — light celebration, not full burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute ob-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2.5}s`,
              }}
            >
              <div
                style={{
                  width: 5 + Math.random() * 5,
                  height: 5 + Math.random() * 5,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  borderRadius: i % 3 === 0 ? '50%' : 2,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
          <div className={`flex flex-col items-center transition-all duration-500 ${phaseVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Speech bubble */}
            <div className="relative ob-bubble-pop max-w-[85vw] sm:max-w-md">
              <div className="relative rounded-3xl bg-white dark:bg-stone-900 border-2 border-[#E5E5E5] dark:border-stone-700 px-5 py-3.5 shadow-md">
                <p className="text-base sm:text-lg font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight text-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Let me show you how to get the <span className="text-[#58CC02]">best</span> out of WriteScholar
                </p>
                <div
                  aria-hidden
                  className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-stone-900 border-r-2 border-b-2 border-[#E5E5E5] dark:border-stone-700 rotate-45"
                />
              </div>
            </div>

            {/* Mascot — celebrating! */}
            <div className="mt-8 ob-mascot-bob">
              <img
                src="/mascot-celebrating.webp"
                alt="Scholar mascot celebrating"
                width={240}
                height={240}
                className="object-contain w-48 h-48 sm:w-60 sm:h-60"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5 relative z-10">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleCelebrateContinue}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Continue
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obConfettiFall {
            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
          .ob-confetti-fall { animation: obConfettiFall var(--dur, 3s) ease-out forwards; }
          @keyframes obBubblePop {
            0% { transform: scale(0.6) translateY(10px); opacity: 0; }
            60% { transform: scale(1.05) translateY(-2px); opacity: 1; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          .ob-bubble-pop { animation: obBubblePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards; }
          @keyframes obMascotBob {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-6px) scale(1.02); }
          }
          .ob-mascot-bob { animation: obMascotBob 2.4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .ob-confetti-fall, .ob-bubble-pop, .ob-mascot-bob { animation: none; opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    );
  }

  /* ─── PAYWALL — full 8-tool showcase, Duolingo-styled ─── */
  if (phase === 'paywall') {
    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-stone-900 border-b-2 border-[#E5E5E5] dark:border-stone-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
          </div>
          <button type="button" onClick={handleContinueFree} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-bold underline underline-offset-4">
            Skip
          </button>
        </div>
        <div className="h-3 bg-[#E5E5E5] dark:bg-stone-800">
          <div className="h-full bg-[#58CC02] rounded-r-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full ob-fade-in">
          {/* Hero header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-4">
              <MascotGif src="/mascot-dance.webp" alt="" size={130} bordered borderColor="#58CC02" bgColor="#E5F8D0" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#FF9600]/40 bg-[#FFF4E0] text-[#FF9600] text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <span aria-hidden>⚡</span>
              Last step, {firstName}!
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Unlock all 8 tools — <span className="text-[#58CC02]">free for {TRIAL_DAYS} days</span>
            </h1>
            <p className="mt-2 text-stone-500 dark:text-stone-400 font-bold text-sm sm:text-base">
              See every tool in action. No charge today.
            </p>
          </div>

          {/* Primary CTA — above the fold */}
          <div className="max-w-md mx-auto mb-8">
            <div className="rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/10 p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#58CC02]/20 blur-2xl" aria-hidden />
              <p className="relative text-lg font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Start your free {TRIAL_DAYS}-day trial
              </p>
              <p className="relative mt-1 text-sm font-bold text-stone-500 dark:text-stone-400">
                Then $19.99/mo. Cancel anytime.
              </p>
              <button
                type="button"
                onClick={SKIP_ONBOARDING_STRIPE ? handleContinueFree : handleStartTrial}
                disabled={startingTrial}
                className="relative mt-4 w-full py-4 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {startingTrial ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path fill="currentColor" className="opacity-90" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting…
                  </>
                ) : (
                  <>
                    {SKIP_ONBOARDING_STRIPE ? `Start my ${TRIAL_DAYS}-day trial` : `Start my ${TRIAL_DAYS}-day free trial`}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              {trialError && <p className="relative mt-3 text-sm text-[#FF4B4B] font-bold">{trialError}</p>}
              <div className="relative mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-extrabold text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> No charge today</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Cancel anytime</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Loved by 50k+ students</span>
              </div>
            </div>
          </div>

          {/* 8-tool feature grid */}
          <div className="mb-8">
            <div className="text-center mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A560E8] mb-2">EVERYTHING YOU GET</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Eight tools. One paste of your notes.
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {PAYWALL_TOOLS.map((tool, i) => (
                <ToolCard key={tool.title} tool={tool} delayMs={i * 60} />
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 font-bold pb-2">
            Secured by Stripe · Free plan available
          </p>
          </div>
        </div>

        {/* Sticky footer — "Maybe later" always visible exit ramp */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleContinueFree}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 bg-white dark:bg-stone-900 text-[#3C3C3C] dark:text-stone-100 font-extrabold text-base hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Maybe later
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obFadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ob-fade-in { animation: obFadeIn 0.4s ease-out; }
          @keyframes obToolPop {
            0% { transform: translateY(12px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .ob-tool-pop { animation: obToolPop 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
        `}</style>
      </div>
    );
  }

  /* ─── DAILY REVIEW RESULTS ─── */
  if (phase === 'daily-review-results') {
    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar />

        {/* Confetti — fixed-position so it covers the whole viewport */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute ob-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2.5}s`,
              }}
            >
              <div style={{ width: 6 + Math.random() * 5, height: 6 + Math.random() * 5, backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length], borderRadius: i % 2 === 0 ? '50%' : 2 }} />
            </div>
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="w-full max-w-sm mx-auto text-center px-4 py-6 ob-scale-in">
            {/* Big celebrating mascot in halo */}
            <div className="mb-4 relative inline-block">
              <div className="absolute inset-0 rounded-full bg-[#58CC02]/30 blur-2xl ob-halo-pulse" aria-hidden />
              <MascotGif src="/mascot-celebrating.webp" alt="" size={130} bordered borderColor="#58CC02" bgColor="#E5F8D0" />
            </div>

            {/* Achievement banner */}
            <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4E0] border-2 border-[#FF9600]/40 ob-banner-pop">
              <span className="text-base" aria-hidden>🏆</span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#FF9600]">FIRST LESSON UNLOCKED</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3C3C3C] dark:text-stone-50 ob-title-pop" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Lesson Complete!
            </h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-bold ob-subtitle-pop">
              You just finished your first WriteScholar lesson — let&apos;s make it a habit!
            </p>

            {/* Streak badge — the celebratory +1 day moment */}
            <div className="mt-4 mx-auto inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-b-4 border-[#D97F00] bg-gradient-to-br from-[#FFF4E0] to-white dark:from-[#FF9600]/15 dark:to-stone-900 ob-streak-banner">
              <span className="text-3xl ob-fire-pulse inline-block" aria-hidden>🔥</span>
              <div className="text-left">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#FF9600]">DAY STREAK</p>
                <p className="text-2xl font-extrabold text-[#FF9600] leading-none mt-0.5">+1 day!</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-3 ob-stat-pop" style={{ animationDelay: '300ms' }}>
                <p className="text-xl font-extrabold text-[#58CC02]">{correctCount}/{DEMO_QUESTIONS.length}</p>
                <p className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Correct</p>
              </div>
              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-3 ob-stat-pop" style={{ animationDelay: '420ms' }}>
                <p className="text-xl font-extrabold text-[#1CB0F6]">+{xpEarned}</p>
                <p className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider">XP</p>
              </div>
              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-3 ob-stat-pop" style={{ animationDelay: '540ms' }}>
                <p className="text-xl font-extrabold text-[#A560E8]">1</p>
                <p className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Badge</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/10 px-4 py-3">
              <p className="text-sm font-bold text-[#3C3C3C] dark:text-stone-200">
                In the real app, questions come from <span className="text-[#58CC02]">your own study materials</span> — so every session helps you remember what matters.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky footer Continue — always visible, matches every other onboarding page */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5 relative z-10">
          <div className="max-w-xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={() => goToPhase('paywall')}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Continue
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obConfettiFall {
            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
          .ob-confetti-fall { animation: obConfettiFall var(--dur, 3s) ease-out forwards; }
          @keyframes obScaleIn {
            0% { transform: scale(0.7); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .ob-scale-in { animation: obScaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          @keyframes obHaloPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
          .ob-halo-pulse { animation: obHaloPulse 2.4s ease-in-out infinite; }
          @keyframes obBannerPop { 0% { transform: translateY(-8px) scale(0.8); opacity: 0; } 60% { transform: translateY(0) scale(1.08); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-banner-pop { animation: obBannerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards; }
          @keyframes obTitlePop { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-title-pop { animation: obTitlePop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s backwards; }
          .ob-subtitle-pop { animation: obTitlePop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.5s backwards; }
          @keyframes obStreakBanner { 0% { transform: scale(0.6) rotate(-3deg); opacity: 0; } 60% { transform: scale(1.08) rotate(2deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
          .ob-streak-banner { animation: obStreakBanner 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s backwards; }
          @keyframes obFirePulse { 0%, 100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.2) rotate(5deg); } }
          .ob-fire-pulse { animation: obFirePulse 1.4s ease-in-out infinite; transform-origin: center bottom; }
          @keyframes obStatPop { 0% { transform: translateY(8px) scale(0.94); opacity: 0; } 60% { transform: translateY(0) scale(1.04); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-stat-pop { animation: obStatPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
        `}</style>
      </div>
    );
  }

  /* ─── DAILY REVIEW INTRO — eases the user into the demo ─── */
  if (phase === 'daily-review-intro') {
    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase('tour-motivation')} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 sm:px-6 py-5 max-w-xl mx-auto">
            {/* Mascot + speech bubble — top-left layout */}
            <div className="flex items-start gap-3 mb-5">
              <img src="/mascot-study.webp" alt="" width={88} height={88} className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0" loading="eager" />
              <div className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#46A302] px-4 py-3 mt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58CC02] mb-1">YOUR DAILY HABIT</p>
                <p className="text-[15px] sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Studying for exams can feel tedious — so we built WriteScholar to be <span className="text-[#58CC02]">fun and addictive</span>, while still raising your grades.
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#46A302] rotate-45" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Daily Review is our most loved feature
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-bold text-sm leading-relaxed mb-5">
              Students who use it stick around <span className="text-[#58CC02] font-extrabold">3x longer</span> and remember <span className="text-[#58CC02] font-extrabold">2x more</span> on exam day. Let me show you why.
            </p>

            {/* Animated 3-step flow diagram — Notes → AI → Quiz */}
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 sm:gap-2 mb-5">
              <div className="ob-flow-step rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-3 sm:p-4 text-center" style={{ animationDelay: '0ms' }}>
                <span className="text-2xl sm:text-3xl block" aria-hidden>📝</span>
                <p className="text-[9px] sm:text-[10px] font-extrabold text-[#1CB0F6] uppercase tracking-wider mt-1.5 leading-tight">Your<br />notes</p>
              </div>
              <span className="ob-flow-arrow text-[#FF9600] font-extrabold text-xl sm:text-2xl" style={{ animationDelay: '300ms' }}>→</span>
              <div className="ob-flow-step rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-3 sm:p-4 text-center" style={{ animationDelay: '500ms' }}>
                <span className="text-2xl sm:text-3xl block" aria-hidden>✨</span>
                <p className="text-[9px] sm:text-[10px] font-extrabold text-[#A560E8] uppercase tracking-wider mt-1.5 leading-tight">AI builds<br />a quiz</p>
              </div>
              <span className="ob-flow-arrow text-[#FF9600] font-extrabold text-xl sm:text-2xl" style={{ animationDelay: '800ms' }}>→</span>
              <div className="ob-flow-step rounded-2xl border-2 border-b-4 border-[#46A302] bg-white dark:bg-stone-900 p-3 sm:p-4 text-center" style={{ animationDelay: '1000ms' }}>
                <span className="text-2xl sm:text-3xl block" aria-hidden>📚</span>
                <p className="text-[9px] sm:text-[10px] font-extrabold text-[#58CC02] uppercase tracking-wider mt-1.5 leading-tight">Daily<br />review</p>
              </div>
            </div>

            {/* Demo expectation note */}
            <div className="rounded-2xl border-2 border-b-4 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-[#FF9600]/10 px-4 py-3 flex items-start gap-3 ob-flow-step" style={{ animationDelay: '1300ms' }}>
              <span className="text-2xl shrink-0" aria-hidden>💡</span>
              <p className="text-sm font-bold text-[#3C3C3C] dark:text-stone-200 leading-snug text-left">
                Let&apos;s show you how it works with <span className="font-extrabold text-[#FF9600]">3 super-easy general-knowledge questions</span> right now.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky footer — small right-aligned Continue */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={() => {
                trackEvent('onboarding_daily_review_intro_continue');
                goToPhase('daily-review-demo');
              }}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Try the demo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
          @keyframes obFlowStep { 0% { transform: scale(0.7) translateY(8px); opacity: 0; } 60% { transform: scale(1.06) translateY(-2px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
          .ob-flow-step { animation: obFlowStep 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
          @keyframes obFlowArrow { from { transform: translateX(-8px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .ob-flow-arrow { animation: obFlowArrow 0.4s ease-out backwards; display: inline-block; }
        `}</style>
      </div>
    );
  }

  /* ─── DAILY REVIEW DEMO ─── */
  if (phase === 'daily-review-demo') {
    const q = DEMO_QUESTIONS[quizIndex];
    const isCorrect = answerChecked && selectedAnswer === q.correctIndex;
    const isWrong = answerChecked && selectedAnswer !== q.correctIndex;

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-stone-900 border-b-2 border-[#E5E5E5] dark:border-stone-800 px-5 py-3 flex items-center gap-4">
          <button type="button" onClick={() => goToPhase('daily-review-intro')} className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300" aria-label="Back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 h-3 bg-[#E5E5E5] dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
              style={{ width: `${((quizIndex + (answerChecked ? 1 : 0)) / DEMO_QUESTIONS.length) * 100}%` }}
            />
          </div>
          <div className="relative flex items-center gap-1 text-sm font-extrabold text-[#FF9600]">
            <span aria-hidden>⭐</span>
            <span>{xpEarned}</span>
            {showXpFloat && (
              <span className="absolute -top-6 right-0 text-[#58CC02] font-extrabold text-sm ob-xp-float" aria-hidden>
                +{XP_PER_QUESTION}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-6 sm:pt-8 pb-4 max-w-lg mx-auto w-full">
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#58CC02]/30 bg-[#E5F8D0] dark:bg-[#58CC02]/10 text-[10px] font-extrabold uppercase tracking-wider text-[#58CC02]">
              <span aria-hidden>📚</span>
              Daily Review · Question {quizIndex + 1} of {DEMO_QUESTIONS.length}
            </span>
          </div>

          {/* Mascot speech bubble */}
          <div className="flex items-end gap-3 mb-5 sm:mb-7">
            <img src="/mascot-study.webp" alt="" width={72} height={72} className="object-contain shrink-0" />
            <div className="relative flex-1 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
              <p className="text-base sm:text-lg font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {q.question}
              </p>
              <div aria-hidden className="absolute -left-1.5 bottom-3 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#E5E5E5] dark:border-stone-700 transform rotate-45" />
            </div>
          </div>

          <div className="space-y-3 flex-1" key={`q-${quizIndex}`}>
            {q.options.map((option, idx) => {
              let borderColor = '#E5E5E5';
              let bgColor = 'white';

              if (answerChecked) {
                if (idx === q.correctIndex) {
                  borderColor = '#58CC02';
                  bgColor = '#E5F8D0';
                } else if (idx === selectedAnswer && idx !== q.correctIndex) {
                  borderColor = '#FF4B4B';
                  bgColor = '#FFE8E8';
                }
              } else if (idx === selectedAnswer) {
                borderColor = '#1CB0F6';
                bgColor = '#DDF4FF';
              }

              const badgeBg = answerChecked
                ? idx === q.correctIndex ? '#58CC02' : idx === selectedAnswer ? '#FF4B4B' : 'transparent'
                : idx === selectedAnswer ? '#1CB0F6' : 'transparent';
              const badgeBorder = answerChecked
                ? idx === q.correctIndex ? '#46A302' : idx === selectedAnswer ? '#E04343' : '#E5E5E5'
                : idx === selectedAnswer ? '#1899D6' : '#E5E5E5';
              const badgeText = (answerChecked && (idx === q.correctIndex || idx === selectedAnswer)) || (!answerChecked && idx === selectedAnswer) ? 'white' : '#AFAFAF';
              const badgeChar = answerChecked && idx === q.correctIndex ? '✓' : answerChecked && idx === selectedAnswer && idx !== q.correctIndex ? '✗' : String.fromCharCode(65 + idx);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={answerChecked}
                  className="ob-answer-pop w-full text-left px-5 py-4 rounded-2xl border-2 border-b-4 font-extrabold text-base transition-all active:border-b-2 active:translate-y-0.5 disabled:active:border-b-4 disabled:active:translate-y-0 flex items-center gap-3"
                  style={{
                    borderColor,
                    backgroundColor: bgColor,
                    color: '#3C3C3C',
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-extrabold shrink-0"
                    style={{ borderColor: badgeBorder, backgroundColor: badgeBg, color: badgeText }}
                  >
                    {badgeChar}
                  </span>
                  <span className="dark:text-stone-100">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {answerChecked ? (
          <div className="border-t-2 px-5 py-4 sm:py-5 ob-feedback-in" style={{ borderColor: isCorrect ? '#46A302' : '#E04343', backgroundColor: isCorrect ? '#D7FFB8' : '#FFE0E0' }}>
            <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-extrabold" style={{ backgroundColor: isCorrect ? '#58CC02' : '#FF4B4B' }}>
                  {isCorrect ? '✓' : '✗'}
                </div>
                <div>
                  <p className="font-extrabold text-base" style={{ color: isCorrect ? '#46A302' : '#E04343' }}>
                    {isCorrect ? 'Nicely done!' : 'Not quite!'}
                  </p>
                  {isWrong && (
                    <p className="text-sm font-bold" style={{ color: '#E04343' }}>
                      Correct answer: {q.options[q.correctIndex]}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuizContinue}
                className="px-6 py-3 rounded-2xl text-white font-extrabold text-sm uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all"
                style={{ backgroundColor: isCorrect ? '#58CC02' : '#FF4B4B', borderColor: isCorrect ? '#46A302' : '#E04343' }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 py-4 sm:py-5">
            <div className="max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="w-full py-3.5 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-[#E5E5E5] disabled:border-[#CECECE] disabled:text-stone-400 disabled:active:border-b-4 disabled:active:translate-y-0 transition-all"
              >
                Check
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes obXpFloat { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
          .ob-xp-float { animation: obXpFloat 1.2s ease-out forwards; }
          @keyframes obAnswerPop { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-answer-pop { animation: obAnswerPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          @keyframes obFeedbackIn { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
          .ob-feedback-in { animation: obFeedbackIn 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        `}</style>
      </div>
    );
  }

  /* ─── TOUR SLIDES ─── */
  if (phase === 'tour-essays' || phase === 'tour-review' || phase === 'tour-study' || phase === 'tour-motivation') {
    const slideData: Record<string, { mascot: string; color: string; borderColor: string; bgColor: string; eyebrow: string; title: string; speech: string; visual: 'essay' | 'screenshot' | 'tools' | 'motivation' }> = {
      'tour-essays': {
        mascot: '/mascot-paper.webp',
        color: '#A560E8',
        borderColor: '#8A48C7',
        bgColor: '#F3EAFF',
        eyebrow: 'TOOL 1 OF 4',
        title: 'Get professor-level feedback',
        speech: "Upload your essay and I'll give you professor style line-by-line feedback, rubric scores, and structure tips — see for yourself on the sample below!",
        visual: 'essay',
      },
      'tour-review': {
        mascot: '/mascot-study.webp',
        color: '#58CC02',
        borderColor: '#46A302',
        bgColor: '#E5F8D0',
        eyebrow: 'TOOL 2 OF 4',
        title: 'Practice daily. Remember everything.',
        speech: "Every day I'll build a quick quiz from your notes — flashcards and questions that lock in what you've learned.",
        visual: 'screenshot',
      },
      'tour-study': {
        mascot: '/mascot-juggling.webp',
        color: '#1CB0F6',
        borderColor: '#1899D6',
        bgColor: '#DDF4FF',
        eyebrow: 'TOOL 3 OF 4',
        title: 'Turn notes into study tools',
        speech: "One paste of your notes turns into flashcards, quizzes, crosswords, and summaries. Watch them in action below!",
        visual: 'tools',
      },
      'tour-motivation': {
        mascot: '/mascot-jumping-joy.webp',
        color: '#FF9600',
        borderColor: '#D97F00',
        bgColor: '#FFF4E0',
        eyebrow: 'TOOL 4 OF 4',
        title: 'Stay motivated with XP & levels',
        speech: "Earn XP for everything you do. Climb 100 levels, keep your streak alive, and collect 80+ badges along the way!",
        visual: 'motivation',
      },
    };

    const slide = slideData[phase];
    const prevMap: Record<string, Phase> = {
      'tour-essays': 'survey-features',
      'tour-review': 'tour-essays',
      'tour-study': 'tour-review',
      'tour-motivation': 'tour-study',
    };

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase(prevMap[phase])} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
            {/* Mascot + speech bubble — top-left layout */}
            <div className="flex items-start gap-3 mb-5">
              <img
                src={slide.mascot}
                alt=""
                width={88}
                height={88}
                className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                loading="eager"
              />
              <div className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 px-4 py-3 mt-3" style={{ borderColor: slide.color }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1" style={{ color: slide.color }}>
                  {slide.eyebrow}
                </p>
                <p className="text-[15px] sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {slide.speech}
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 rotate-45" style={{ borderColor: slide.color }} />
              </div>
            </div>

            {/* Title — left aligned, higher up */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight mb-5" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              {slide.title}
            </h1>

            {/* Visual preview */}
            <div>
              {slide.visual === 'essay' && (
                /* Real annotated essay screenshots — same images used on the
                   landing page so users immediately see what "professor-level
                   feedback" looks like. No interactive button — the value
                   is the image itself. */
                <div className="space-y-3">
                  {/* Caption above the screenshot */}
                  <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: slide.color }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: slide.color }} />
                    Real WriteScholar feedback · live demo
                  </div>

                  {/* Screenshot 1: rubric & notes */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${slide.color}40` }} aria-hidden />
                    <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor: slide.borderColor }}>
                      <img
                        src="/rubric-and-notes.png"
                        alt="Sample rubric and feedback notes from an analyzed essay"
                        className="w-full h-auto block"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  </div>

                  {/* Screenshot 2: full report */}
                  <div className="relative">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor: slide.borderColor }}>
                      <img
                        src="/full-report.png"
                        alt="Sample full written breakdown from an analyzed essay"
                        className="w-full h-auto block"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  </div>

                  {/* Annotation key — matches the green/amber/red dots in the screenshots */}
                  <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 mb-2">Annotation key</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#58CC02] shrink-0" aria-hidden />
                        <span className="text-[11px] font-extrabold text-[#3C3C3C] dark:text-stone-200">Strong</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#FF9600] shrink-0" aria-hidden />
                        <span className="text-[11px] font-extrabold text-[#3C3C3C] dark:text-stone-200">Improve</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#FF4B4B] shrink-0" aria-hidden />
                        <span className="text-[11px] font-extrabold text-[#3C3C3C] dark:text-stone-200">Concern</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {slide.visual === 'screenshot' && (
                <div className="relative">
                  <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-30" style={{ backgroundColor: `${slide.color}40` }} aria-hidden />
                  <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl" style={{ borderColor: slide.borderColor }}>
                    <img src="/daily-review-preview.png" alt="Daily Review preview" className="w-full h-auto" loading="eager" />
                  </div>
                </div>
              )}

              {slide.visual === 'tools' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Flashcards', video: '/writescholar-flashcards-demo.mp4', color: '#A560E8', borderColor: '#8A48C7' },
                    { name: 'Quizzes', video: '/writescholar-quiz-generator-demo.mp4', color: '#58CC02', borderColor: '#46A302' },
                    { name: 'Crosswords', video: '/writescholar-crossword-demo.mp4', color: '#FF9600', borderColor: '#D97F00' },
                    { name: 'Games', video: '/writescholar-crater-blast-demo.mp4', color: '#FF4B4B', borderColor: '#E04343' },
                  ].map((tool, i) => (
                    <ToolMiniDemo key={tool.name} name={tool.name} video={tool.video} color={tool.color} borderColor={tool.borderColor} delayMs={i * 80} />
                  ))}
                </div>
              )}

              {slide.visual === 'motivation' && (
                <div className="space-y-3">
                  {/* Animated XP / level card — continuously alive */}
                  <div className="ob-card-pop relative rounded-2xl border-2 border-b-4 border-[#1899D6] bg-white dark:bg-stone-900 p-4 overflow-hidden" style={{ animationDelay: '0ms' }}>
                    {/* Background gradient pulse */}
                    <div aria-hidden className="absolute -inset-1 bg-gradient-to-br from-[#1CB0F6]/10 via-transparent to-[#1CB0F6]/10 ob-bg-shimmer pointer-events-none" />

                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="relative w-14 h-14 rounded-full bg-[#1CB0F6] flex items-center justify-center border-2 border-[#1899D6] text-white font-extrabold text-xl ob-level-pulse">
                        12
                        <span aria-hidden className="absolute -top-1.5 -right-1.5 text-base ob-sparkle-spin">✨</span>
                        <span aria-hidden className="absolute -bottom-1 -left-1 text-xs ob-sparkle-spin" style={{ animationDelay: '0.6s' }}>⭐</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100">Knowledge Keeper III</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2.5 rounded-full bg-[#1CB0F6]/20 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#1CB0F6] to-[#58CC02] ob-xp-bar-loop" />
                          </div>
                          <span className="text-[11px] font-extrabold text-[#1CB0F6] tabular-nums">
                            {xpDisplay.toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Floating +XP particles — endless feed */}
                    <div aria-hidden className="relative h-5 overflow-hidden">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="absolute left-2 text-[11px] font-extrabold text-[#58CC02] ob-xp-particle"
                          style={{ animationDelay: `${i * 1.4}s` }}
                        >
                          +10 XP
                        </span>
                      ))}
                      <p className="text-[11px] font-extrabold text-[#58CC02] opacity-70">Daily review · keep going!</p>
                    </div>
                  </div>

                  {/* Streak + badges row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Streak — counter continuously climbs 1→14 in a loop */}
                    <div className="ob-card-pop relative rounded-2xl border-2 border-b-4 border-[#D97F00] bg-white dark:bg-stone-900 p-3 text-center overflow-hidden" style={{ animationDelay: '120ms' }}>
                      <div aria-hidden className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-[#FF9600]/20 blur-2xl ob-fire-glow" />
                      <span className="relative text-4xl ob-fire-pulse inline-block" aria-hidden>🔥</span>
                      <p key={streakDisplay} className="relative text-3xl font-extrabold text-[#FF9600] mt-1 ob-streak-bounce tabular-nums leading-none">
                        {streakDisplay}
                      </p>
                      <p className="relative text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mt-1">Day Streak</p>
                      {/* Mini week indicator */}
                      <div className="relative mt-2 flex justify-center gap-0.5">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <span
                            key={i}
                            className={`block w-1.5 h-1.5 rounded-full ${i < (streakDisplay % 7 || 7) ? 'bg-[#FF9600]' : 'bg-stone-200 dark:bg-stone-700'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Badges — real BadgeCreature SVGs from the app */}
                    <div className="ob-card-pop relative rounded-2xl border-2 border-b-4 border-[#8A48C7] bg-white dark:bg-stone-900 p-3 text-center overflow-hidden" style={{ animationDelay: '200ms' }}>
                      <div aria-hidden className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full bg-[#A560E8]/20 blur-2xl ob-fire-glow" />
                      <div className="relative grid grid-cols-3 gap-1 mb-1.5 place-items-center">
                        {['first_login', 'first_steps', 'brain_spark', 'streak_warrior', 'citation_hunter', 'streak_legend'].map((badgeId, i) => (
                          <div
                            key={badgeId}
                            className="ob-badge-shine"
                            style={{ animationDelay: `${i * 350}ms` }}
                          >
                            <BadgeCreature badgeId={badgeId} unlocked={true} size={28} />
                          </div>
                        ))}
                      </div>
                      <p className="relative text-xl font-extrabold text-[#A560E8]">80+</p>
                      <p className="relative text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Badges</p>
                    </div>
                  </div>

                  {/* Live activity feed — single message visible at a time,
                      driven by React state so messages never overlap. */}
                  {(() => {
                    const feedMessages = [
                      '✨ +50 XP — 7-day streak bonus!',
                      '🏅 New badge: Quick Learner',
                      '🔥 Daily review complete · +20 XP',
                      '👑 Level up — Knowledge Keeper III',
                      '⭐ +10 XP — perfect quiz score',
                    ];
                    return (
                      <div className="ob-card-pop rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 px-3.5 py-2.5 overflow-hidden h-11 relative" style={{ animationDelay: '280ms' }}>
                        <p
                          key={feedIndex}
                          className="ob-feed-msg absolute inset-x-3.5 inset-y-0 text-xs font-extrabold text-[#3C3C3C] dark:text-stone-200 flex items-center truncate"
                        >
                          {feedMessages[feedIndex]}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky footer — small right-aligned Continue */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleTourContinue}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              {phase === 'tour-motivation' ? 'Try it yourself!' : 'Continue'}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obBarFill { from { width: 0% !important; } }
          .ob-bar-fill { animation: obBarFill 0.8s ease-out forwards; }
          @keyframes obCardPop { 0% { transform: translateY(8px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-card-pop { animation: obCardPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
          @keyframes obFeedbackFade { 0% { transform: translateY(-4px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-feedback-fade { animation: obFeedbackFade 0.5s ease-out backwards; }
          @keyframes obResultsPop { 0% { transform: translateY(8px) scale(0.97); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-results-pop { animation: obResultsPop 0.4s cubic-bezier(0.22, 1, 0.36, 1); }

          /* Motivation animations — alive, looped, dramatic */
          @keyframes obLevelPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(28,176,246,0.6); } 50% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(28,176,246,0); } }
          .ob-level-pulse { animation: obLevelPulse 1.8s ease-in-out infinite; }
          @keyframes obSparkleSpin { 0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.9; } 50% { transform: rotate(180deg) scale(1.4); opacity: 1; } }
          .ob-sparkle-spin { animation: obSparkleSpin 2.2s ease-in-out infinite; display: inline-block; }
          @keyframes obBgShimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
          .ob-bg-shimmer { animation: obBgShimmer 3s ease-in-out infinite; }
          @keyframes obXpBarLoop {
            0%   { width: 35%; }
            45%  { width: 92%; }
            55%  { width: 92%; }
            60%  { width: 8%; }
            100% { width: 42%; }
          }
          .ob-xp-bar-loop { animation: obXpBarLoop 4.5s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
          @keyframes obXpParticle { 0% { opacity: 0; transform: translateY(8px) scale(0.7); } 25% { opacity: 1; transform: translateY(-2px) scale(1.05); } 75% { opacity: 1; transform: translateY(-14px) scale(1); } 100% { opacity: 0; transform: translateY(-22px) scale(0.85); } }
          .ob-xp-particle { animation: obXpParticle 4.2s ease-out infinite; }
          @keyframes obFirePulse { 0%, 100% { transform: scale(1) rotate(-4deg); filter: drop-shadow(0 0 0 rgba(255,150,0,0)); } 50% { transform: scale(1.22) rotate(5deg); filter: drop-shadow(0 0 12px rgba(255,150,0,0.7)); } }
          .ob-fire-pulse { animation: obFirePulse 1.2s ease-in-out infinite; transform-origin: center bottom; }
          @keyframes obFireGlow { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 0.7; } }
          .ob-fire-glow { animation: obFireGlow 1.6s ease-in-out infinite; }
          @keyframes obStreakBounce { 0% { transform: scale(0.5) translateY(8px); opacity: 0; } 60% { transform: scale(1.3) translateY(-2px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
          .ob-streak-bounce { animation: obStreakBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
          @keyframes obBadgeShine {
            0%, 70%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); box-shadow: 0 0 0 rgba(165,96,232,0); }
            85%           { transform: scale(1.25) rotate(8deg); filter: brightness(1.4); box-shadow: 0 0 14px rgba(165,96,232,0.7); }
          }
          .ob-badge-shine { animation: obBadgeShine 3.5s ease-in-out infinite; }
          @keyframes obFeedMsg {
            0%   { opacity: 0; transform: translateY(12px); }
            15%  { opacity: 1; transform: translateY(0); }
            85%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-12px); }
          }
          .ob-feed-msg { animation: obFeedMsg 2.2s ease-in-out forwards; }
        `}</style>
      </div>
    );
  }

  /* ─── SURVEY 1: REFERRAL SOURCE ─── */
  if (phase === 'survey-source') {
    const selectedSource = REFERRAL_SOURCES.find((s) => s.id === referralSource);
    const sourceSpeech = selectedSource ? selectedSource.mascotReply : "How did you hear about us? Pick the closest match!";

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase('profile')} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 sm:px-6 py-5 max-w-xl mx-auto">
            {/* Mascot + speech bubble — top-left layout */}
            <div className="flex items-start gap-3 mb-5">
              <img src="/mascot-thinking.webp" alt="" width={88} height={88} className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0" loading="eager" />
              <div key={referralSource || 'empty'} className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#A560E8] px-4 py-3 mt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A560E8] mb-1">QUICK QUESTION</p>
                <p className="text-[15px] sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {sourceSpeech}
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#A560E8] rotate-45" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight mb-5" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              How did you hear about us?
            </h1>

            {/* Source cards — 2 per row, real brand logos where we have them */}
            <div className="grid grid-cols-2 gap-3">
              {REFERRAL_SOURCES.map((src, i) => {
                const isSelected = referralSource === src.id;
                const brandLogo = BRAND_LOGOS[src.id];
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => handleSelectSource(src.id)}
                    className="ob-card-pop rounded-2xl border-2 border-b-4 px-3 py-3.5 sm:py-4 flex flex-col items-center gap-2 transition-all active:border-b-2 active:translate-y-0.5 hover:scale-[1.02]"
                    style={{
                      borderColor: isSelected ? src.color : '#E5E5E5',
                      backgroundColor: isSelected ? src.bgColor : 'white',
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <span className="h-9 sm:h-10 flex items-center justify-center" aria-hidden>
                      {brandLogo ?? <span className="text-2xl sm:text-3xl">{src.emoji}</span>}
                    </span>
                    <span className="text-sm font-extrabold" style={{ color: isSelected ? src.color : '#3C3C3C' }}>
                      {src.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky footer — small right-aligned Continue, matches intro/celebrate */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleSourceContinue}
              disabled={!referralSource}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-[#E5E5E5] disabled:border-[#CECECE] disabled:text-stone-400 disabled:active:border-b-4 disabled:active:translate-y-0 transition-all"
            >
              Continue
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obCardPop { 0% { transform: translateY(8px) scale(0.95); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-card-pop { animation: obCardPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  /* ─── SURVEY 2: USE-CASE GOAL — what they're using WriteScholar for ─── */
  if (phase === 'survey-goal') {
    const selectedGoal = GOAL_OPTIONS.find((g) => g.id === useGoal);
    const speechText = selectedGoal
      ? selectedGoal.mascotResponse
      : "Why are you here today? I'll tailor your tour based on your goal!";

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase('survey-source')} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 sm:px-6 py-6 max-w-xl mx-auto">
            {/* Mascot + dynamic speech bubble — top-left layout */}
            <div className="flex items-start gap-3 mb-6">
              <img
                src={selectedGoal ? '/mascot-celebrating.webp' : '/mascot-thinking.webp'}
                alt=""
                width={88}
                height={88}
                className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0"
                loading="eager"
              />
              <div key={useGoal || 'empty'} className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 px-4 py-3 mt-3">
                <p className="text-sm sm:text-[15px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {speechText}
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#E5E5E5] dark:border-stone-700 rotate-45" />
              </div>
            </div>

            {/* Eyebrow + title — left-aligned, higher up */}
            <div className="mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58CC02] mb-2">YOUR GOAL</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                What brings you to WriteScholar?
              </h1>
            </div>

            {/* Goal cards */}
            <div className="space-y-2.5">
              {GOAL_OPTIONS.map((goal, i) => {
                const isSelected = useGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleSelectGoal(goal.id)}
                    className="ob-card-pop w-full text-left rounded-2xl border-2 border-b-4 px-4 py-3 flex items-center gap-3 transition-all active:border-b-2 active:translate-y-0.5 hover:scale-[1.01]"
                    style={{
                      borderColor: isSelected ? goal.color : '#E5E5E5',
                      backgroundColor: isSelected ? goal.bgColor : 'white',
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border-2 border-b-4 shrink-0" style={{ borderColor: goal.color, backgroundColor: isSelected ? 'white' : `${goal.color}15` }}>
                      <span aria-hidden>{goal.emoji}</span>
                    </div>
                    <span className="flex-1 text-[15px] font-extrabold" style={{ color: isSelected ? goal.color : '#3C3C3C' }}>
                      {goal.label}
                    </span>
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? goal.color : '#E5E5E5',
                        backgroundColor: isSelected ? goal.color : 'transparent',
                      }}
                    >
                      {isSelected && <span className="text-white text-xs font-extrabold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky footer — small right-aligned Continue, matches intro/celebrate */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleGoalContinue}
              disabled={!useGoal}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-[#E5E5E5] disabled:border-[#CECECE] disabled:text-stone-400 disabled:active:border-b-4 disabled:active:translate-y-0 transition-all"
            >
              Continue
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obCardPop { 0% { transform: translateY(8px) scale(0.97); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
          .ob-card-pop { animation: obCardPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  /* ─── SURVEY 3: FEATURE INTERESTS ─── */
  if (phase === 'survey-features') {
    const featureCount = featureInterests.length;
    const featureSpeech = featureCount === 0
      ? "Pick anything that excites you — choose as many as you want!"
      : featureCount === 1
        ? "Nice pick! Add a few more if you'd like."
        : `${featureCount} picked — looking great! Add more or tap continue.`;

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase('survey-goal')} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
            {/* Mascot + speech bubble — top-left layout */}
            <div className="flex items-start gap-3 mb-5">
              <img src="/mascot-juggling.webp" alt="" width={88} height={88} className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0" loading="eager" />
              <div key={featureCount} className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#1CB0F6] px-4 py-3 mt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1CB0F6] mb-1">PICK ANY YOU LIKE</p>
                <p className="text-[15px] sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {featureSpeech}
                </p>
                <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#1CB0F6] rotate-45" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight mb-5" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              What are you most excited about?
            </h1>

            {/* Feature cards — 2 per row, larger for readability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FEATURE_INTERESTS.map((feat, i) => {
                const isSelected = featureInterests.includes(feat.id);
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleToggleFeature(feat.id)}
                    className="ob-card-pop relative w-full text-left rounded-2xl border-2 border-b-4 px-4 py-4 sm:py-5 flex items-center gap-3.5 transition-all active:border-b-2 active:translate-y-0.5"
                    style={{
                      borderColor: isSelected ? feat.color : '#E5E5E5',
                      backgroundColor: isSelected ? feat.bgColor : 'white',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-b-4 shrink-0" style={{ borderColor: feat.color, backgroundColor: isSelected ? 'white' : `${feat.color}15` }}>
                      <span aria-hidden>{feat.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight">{feat.label}</p>
                      <p className="text-[13px] text-stone-500 dark:text-stone-400 font-bold mt-1 leading-snug line-clamp-2">{feat.desc}</p>
                    </div>
                    <div
                      className="absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? feat.color : '#E5E5E5',
                        backgroundColor: isSelected ? feat.color : 'transparent',
                      }}
                    >
                      {isSelected && <span className="text-white text-sm font-extrabold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky footer — small right-aligned Continue */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={handleSurveyContinue}
              disabled={featureCount === 0 || surveySaving}
              className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-[#E5E5E5] disabled:border-[#CECECE] disabled:text-stone-400 disabled:active:border-b-4 disabled:active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              {surveySaving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving…
                </>
              ) : 'Continue'}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obCardPop { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-card-pop { animation: obCardPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
          @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
          .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  /* ─── PROFILE FORM (default) — interactive, mascot reacts as you type ─── */
  const profileNameValid = displayName.trim().length >= 1;
  const normalizedUsername = username.trim().toLowerCase().replace(/\s/g, '_');
  const profileUsernameValid = normalizedUsername.length >= 3 && /^[a-z0-9_]{3,30}$/.test(normalizedUsername) && !usernameError;
  const profileBothValid = profileNameValid && profileUsernameValid;
  const profileFirstName = displayName.trim().split(/\s+/)[0] || '';

  const profileSpeech = profileBothValid
    ? `Looking great, ${profileFirstName}! Tap continue and let's go.`
    : profileNameValid && username.trim().length > 0
      ? `Just ${profileUsernameValid ? 'one' : 'a tweak on your'} username and we're in!`
      : profileNameValid
        ? `Awesome to meet you, ${profileFirstName}! Now pick a username — that's how friends will find you.`
        : "Hey there! What should I call you?";

  return (
    /* h-screen + overflow-hidden — guarantees the sticky footer stays in view
       no matter how tall the content gets. Content scrolls inside its own
       container, footer never moves. */
    <div className="h-screen bg-gradient-to-b from-[#F7F7F7] to-white dark:from-stone-950 dark:to-stone-900 flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-xl mx-auto ob-fade-in">
          {/* Mascot + dynamic speech bubble */}
          <div className="flex items-start gap-3 mb-5 sm:mb-6">
            <img
              src="/mascot-paper.webp"
              alt=""
              width={88}
              height={88}
              className="object-contain w-20 h-20 sm:w-24 sm:h-24 shrink-0 ob-mascot-land"
              loading="eager"
            />
            <div key={profileSpeech} className="relative flex-1 ob-bubble-fade rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#A560E8] px-4 py-3 mt-3 shadow-sm">
              <p className="text-sm sm:text-[15px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {profileSpeech}
              </p>
              <div aria-hidden className="absolute -left-1.5 top-4 w-3 h-3 bg-white dark:bg-stone-900 border-l-2 border-b-2 border-[#A560E8] rotate-45" />
            </div>
          </div>

          {/* Title — left aligned, higher up */}
          <div className="mb-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A560E8] mb-2">YOUR PROFILE</p>
            <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Let&apos;s set up your profile!
            </h1>
          </div>

          {profileNotice && (
            <div className="mb-4 rounded-2xl bg-[#FFF4E0] border-2 border-b-4 border-[#FF9600]/40 px-4 py-3 text-sm text-[#D97F00] font-bold" role="status">
              {profileNotice}
            </div>
          )}

          {/* Polished input card — softer, more premium */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-extrabold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-[0.18em]">Your name</label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex or Jordan"
                  className={`w-full px-4 pr-12 py-3.5 rounded-xl border-2 border-b-4 bg-[#F7F7F7] dark:bg-stone-800 focus:ring-0 focus:outline-none transition-all text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
                    profileNameValid
                      ? 'border-[#58CC02] bg-[#E5F8D0]/40 focus:border-[#58CC02]'
                      : 'border-[#E5E5E5] dark:border-stone-600 focus:border-[#A560E8] dark:focus:border-[#A560E8]'
                  }`}
                  autoFocus
                  maxLength={40}
                />
                {profileNameValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#58CC02] border-2 border-[#46A302] flex items-center justify-center text-white text-sm font-extrabold ob-check-pop">
                    ✓
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div className={profileNameValid ? 'ob-field-reveal' : 'opacity-50 pointer-events-none'}>
              <label className="block text-[10px] font-extrabold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-[0.18em]">Pick a username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-stone-400 pointer-events-none select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                  placeholder="alex_student"
                  disabled={!profileNameValid}
                  className={`w-full pl-9 pr-12 py-3.5 rounded-xl border-2 border-b-4 bg-[#F7F7F7] dark:bg-stone-800 focus:ring-0 focus:outline-none transition-all text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
                    usernameError
                      ? 'border-[#FF4B4B] focus:border-[#FF4B4B]'
                      : profileUsernameValid
                        ? 'border-[#58CC02] bg-[#E5F8D0]/40 focus:border-[#58CC02]'
                        : 'border-[#E5E5E5] dark:border-stone-600 focus:border-[#A560E8] dark:focus:border-[#A560E8]'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && profileBothValid) void handleContinueFromProfile();
                  }}
                  maxLength={30}
                />
                {profileUsernameValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#58CC02] border-2 border-[#46A302] flex items-center justify-center text-white text-sm font-extrabold ob-check-pop">
                    ✓
                  </div>
                )}
              </div>
              {usernameError && <p className="mt-1.5 text-sm text-[#FF4B4B] font-bold">{usernameError}</p>}
              {!usernameError && username.trim().length > 0 && !profileUsernameValid && (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 font-bold">3+ characters · letters, numbers, underscores</p>
              )}
            </div>
          </div>

          {/* Live profile preview — appears when both valid */}
          {profileBothValid && (
            <div className="mt-4 ob-preview-pop">
              <div className="rounded-2xl border-2 border-b-4 border-[#46A302] bg-gradient-to-br from-[#E5F8D0] to-white dark:from-[#58CC02]/10 dark:to-stone-900 p-4">
                <p className="text-[10px] font-extrabold text-[#58CC02] uppercase tracking-[0.18em] mb-2">PROFILE PREVIEW</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#58CC02] border-2 border-b-2 border-[#46A302] flex items-center justify-center text-white text-xl font-extrabold shrink-0">
                    {profileFirstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 truncate" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      {displayName.trim()}
                    </p>
                    <p className="text-sm font-bold text-[#58CC02] truncate">@{normalizedUsername}</p>
                  </div>
                  <span className="text-2xl ob-sparkle" aria-hidden>✨</span>
                </div>
              </div>
            </div>
          )}

          <nav className="mt-5 text-center text-[11px] text-stone-400 dark:text-stone-500 font-bold pb-2" aria-label="Legal">
            <button type="button" onClick={() => onNavigate('terms')} className="text-[#A560E8] hover:underline font-extrabold">Terms of Service</button>
            <span className="mx-2" aria-hidden>·</span>
            <button type="button" onClick={() => onNavigate('privacy')} className="text-[#A560E8] hover:underline font-extrabold">Privacy Policy</button>
          </nav>
        </div>
      </div>

      {/* Sticky footer — small right-aligned Continue, matches every other onboarding page */}
      <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
        <div className="max-w-xl mx-auto flex justify-end">
          <button
            type="button"
            onClick={() => void handleContinueFromProfile()}
            disabled={!profileBothValid || isSaving}
            className="w-full sm:w-auto sm:min-w-[200px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:bg-[#E5E5E5] disabled:border-[#CECECE] disabled:text-stone-400 disabled:active:border-b-4 disabled:active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving…
              </>
            ) : 'Continue'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes obFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .ob-fade-in { animation: obFadeIn 0.4s ease-out; }
        @keyframes obBubbleFade { 0% { transform: translateY(-3px); opacity: 0.4; } 100% { transform: translateY(0); opacity: 1; } }
        .ob-bubble-fade { animation: obBubbleFade 0.3s ease-out; }
        @keyframes obCheckPop { 0% { transform: translateY(-50%) scale(0.4); opacity: 0; } 60% { transform: translateY(-50%) scale(1.15); opacity: 1; } 100% { transform: translateY(-50%) scale(1); opacity: 1; } }
        .ob-check-pop { animation: obCheckPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
        @keyframes obFieldReveal { 0% { transform: translateY(-6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .ob-field-reveal { animation: obFieldReveal 0.35s ease-out; }
        @keyframes obPreviewPop { 0% { transform: scale(0.92) translateY(8px); opacity: 0; } 60% { transform: scale(1.02); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .ob-preview-pop { animation: obPreviewPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes obSparkle { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.25) rotate(15deg); } }
        .ob-sparkle { animation: obSparkle 1.4s ease-in-out infinite; display: inline-block; }
        /* Mascot fly-in: scales down + glides in from upper-right area, simulating
           a smooth handoff from the celebrate page's centered mascot to its new
           top-left home. Slow + gentle easing for a graceful arrival. */
        @keyframes obMascotLand {
          0%   { transform: scale(2.4) translate(80px, 60px); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: scale(1) translate(0, 0); opacity: 1; }
        }
        .ob-mascot-land { animation: obMascotLand 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; transform-origin: top left; }
        @media (prefers-reduced-motion: reduce) { .ob-mascot-land { animation: none; } }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
