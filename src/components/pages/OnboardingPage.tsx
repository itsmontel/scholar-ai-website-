import { useState, useEffect, useRef, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, StripePaymentElement, StripeExpressCheckoutElement } from '@stripe/stripe-js';
import { SKIP_ONBOARDING_STRIPE } from '../../config/featureFlags';
import { trackEvent } from '../../utils/analytics';
// Static import: see CompleteAcademicAIApp.tsx for why we don't dynamic-
// import the gtag helper. Short version — ensures gtag.js starts loading
// on first paint so the conversion event isn't racing the script load.
import { trackTrialConversion } from '../../utils/gtag';
import BadgeCreature from '../common/BadgeCreature';
import { markSoftPaywallDismissedNow, SOFT_PAYWALL_OPEN_KEY } from '../../constants/paywallSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TRIAL_DAYS = 3;

/**
 * When true the onboarding tour ends on the `value-prop` screen
 * ("Eight tools. Designed for success.") — the `paywall` and
 * `paywall-hard` phases that used to follow are unreachable, and the
 * dashboard's soft paywall pops instead. The render blocks for those
 * phases are deliberately left in the file so the previous upsell
 * sequence can be restored in one step:
 *   • flip this flag to `false`
 *   • that's it — the existing button onClick + decline handlers fall
 *     back to the original `goToPhase('paywall' | 'paywall-hard')` paths.
 */
const HIDE_END_PAYWALLS = false;
/* Promo code silently pre-applied to checkout when the user clicks the
   trial CTA from the hard paywall.  Surfaces a 50% lifetime discount
   ($19.99/mo → $9.99/mo) so the on-page copy and the Stripe session
   stay in sync. */
const HARD_PAYWALL_PROMO_CODE = 'MAY2026';

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
  /** Preview-only mode (the /onboarding-test route) — skip every API
   *  call, never persist, never load Stripe; just walk the UI. */
  testMode?: boolean;
}

type Phase =
  | 'intro'
  | 'celebrate'
  | 'profile'
  | 'survey-source'
  | 'survey-goal'
  | 'survey-features'
  | 'tour-essays'
  | 'tour-essays-2'
  | 'tour-study'
  | 'tour-citations'
  | 'tour-games'
  | 'tour-motivation'
  | 'daily-review-intro'
  | 'daily-review-demo'
  | 'daily-review-results'
  | 'value-prop'
  | 'paywall'
  | 'paywall-hard'
  | 'checkout'
  | 'verifying'
  | 'transition'
  | 'done';

/* ─── Step ordering — used for the top progress bar.
   The daily-review-* phases (9, 10, 11) are still Phase types in case we
   route to them in the future, but the live tour skips them: tour-motivation
   goes straight to paywall. So progress shows 9 steps ending at paywall. */
const PHASE_STEP: Record<string, number> = {
  profile: 1,
  'survey-source': 2,
  'survey-goal': 3,
  'survey-features': 4,
  // All tour phases share the same step "5" — the progress bar holds
  // steady through the personalised tour. Only essays + final step bump.
  'tour-essays': 5,
  'tour-essays-2': 5,
  'tour-study': 5,
  'tour-citations': 5,
  'tour-games': 5,
  'tour-motivation': 5,
  // Kept for routing flexibility but skipped in the default flow:
  'daily-review-intro': 9,
  'daily-review-demo': 10,
  'daily-review-results': 11,
  // Value-prop page sits between the tour and the paywall.  It builds
  // up the "everything you get" pitch + social proof so the paywall
  // doesn't land cold.
  'value-prop': 9,
  paywall: 10,
  // Hard paywall is the "last chance" interception that fires when a
  // user declines the soft paywall. Same step index — the progress bar
  // stays at 100% so the page still reads as the final beat of the flow.
  'paywall-hard': 10,
};
const TOTAL_STEPS = 10;

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

/* ─── Tour priority order ─────────────────────────────────────────
   Maps each survey "feature interest" to its dedicated tour slide.
   The tour shows ONLY the slides whose feature the user picked, in
   THIS priority order — so essays (if selected) is always first, then
   the rest fall in the predefined cadence (review → study → citations
   → games → motivation). Used at runtime to derive `tourSequence`. */
type TourPhase = 'tour-essays' | 'tour-essays-2' | 'tour-study' | 'tour-citations' | 'tour-games' | 'tour-motivation';
const FEATURE_TOUR_ORDER: { id: string; phase: TourPhase }[] = [
  { id: 'essays',       phase: 'tour-essays' },
  { id: 'study_packs',  phase: 'tour-study' },
  { id: 'citations',    phase: 'tour-citations' },
  { id: 'games',        phase: 'tour-games' },
  { id: 'motivation',   phase: 'tour-motivation' },
];

/* ─── Survey 2: What features excite you most? (multi-select) ─── */
const FEATURE_INTERESTS = [
  { id: 'essays',       emoji: '📝', label: 'Essay analysis',       desc: 'Get instant feedback & rubric scores', color: '#A560E8', borderColor: '#8A48C7', bgColor: '#F3EAFF' },
  { id: 'daily_review', emoji: '📚', label: 'Daily Review',         desc: 'Practice every day, like Duolingo',    color: '#58CC02', borderColor: '#46A302', bgColor: '#E5F8D0' },
  { id: 'study_packs',  emoji: '🃏', label: 'Flashcards & quizzes', desc: 'Turn your notes into study tools',     color: '#1CB0F6', borderColor: '#1899D6', bgColor: '#DDF4FF' },
  { id: 'games',        emoji: '🎮', label: 'Quiz games',           desc: 'Crater Blast, Word Tower & more',      color: '#FF4B4B', borderColor: '#E04343', bgColor: '#FFE8E8' },
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
  { title: 'Flashcards',     desc: 'AI-built decks from your notes',         video: '/hero-flashcards.mp4',                   badge: 'Free', color: '#58CC02', borderColor: '#46A302' },
  { title: 'Quizzes',        desc: 'MCQ, true/false & fill-in-the-blank',    video: '/hero-quiz.mp4',                         badge: 'Free', color: '#1CB0F6', borderColor: '#1899D6' },
  { title: 'Citations',      desc: 'APA, MLA, Chicago — real sources',       video: '/writescholar-citation-finder-demo.mp4', badge: 'Pro',  color: '#1CB0F6', borderColor: '#1899D6' },
  { title: 'Crater Blast',   desc: 'Boss-battle quiz arcade',                video: '/writescholar-crater-blast-demo.mp4',    badge: 'Game', color: '#FF9600', borderColor: '#D97F00' },
  { title: 'Word Blitz',     desc: '60-second fill-the-blank speedrun',      video: '/hero-word-blitz.mp4',                   badge: 'Game', color: '#FF4B82', borderColor: '#D63672' },
  { title: 'Summarizer',     desc: 'Compress chapters into key points',      video: '/writescholar-summarizer-demo.mp4',      badge: 'Pro',  color: '#A560E8', borderColor: '#8A48C7' },
  { title: 'Word Tower',     desc: 'Stack words, beat your streak',          video: '/hero-word-tower.mp4',                   badge: 'Game', color: '#FF9600', borderColor: '#D97F00' },
];

const TOOL_BADGE_STYLE: Record<ToolBadge, { bg: string; border: string }> = {
  Free: { bg: '#58CC02', border: '#46A302' },
  Pro:  { bg: '#A560E8', border: '#8A48C7' },
  Game: { bg: '#FF9600', border: '#D97F00' },
};

/* Tool mini demo for tour-study — autoplay-on-visible video tile */
function ToolMiniDemo({ name, video, videos, image, color, borderColor, delayMs = 0 }: { name: string; video?: string; videos?: string[]; image?: string; color: string; borderColor: string; delayMs?: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Cycling playlist: when `videos` is provided we step through it on each
  // video's `ended` event (`loop` must be off so `ended` fires). Single
  // `video` falls back to the old single-clip + loop behaviour.
  const playlist = videos && videos.length > 0 ? videos : (video ? [video] : []);
  const [clipIdx, setClipIdx] = useState(0);
  const isCycle = playlist.length > 1;
  const currentSrc = playlist[clipIdx];

  // Track whether the wrapper is currently on-screen so the observer's
  // captured reference doesn't go stale when the playlist swaps the
  // <video> element (key={currentSrc} re-mounts it on every cycle).
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const w = wrapRef.current;
    if (!w || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold: 0.25 }
    );
    obs.observe(w);
    return () => obs.disconnect();
  }, []);
  // Re-run whenever `inView` or the source changes so a freshly-mounted
  // video element (on cycle / src change) picks up the right play/pause
  // state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) v.play().catch(() => {}); else v.pause();
  }, [inView, currentSrc]);

  return (
    <div
      ref={wrapRef}
      className="ob-card-pop relative rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 overflow-hidden hover:-translate-y-0.5 transition-all"
      style={{ borderColor, animationDelay: `${delayMs}ms` }}
    >
      <div className="relative aspect-[16/10] bg-stone-100 dark:bg-stone-800 overflow-hidden">
        {!loaded && <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900 animate-pulse" aria-hidden />}
        {image ? (
          <img
            src={image}
            alt={`${name} preview`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : currentSrc ? (
          <video
            ref={videoRef}
            key={currentSrc}
            src={currentSrc}
            muted
            loop={!isCycle}
            playsInline
            preload="metadata"
            aria-label={`${name} demo`}
            onLoadedData={() => setLoaded(true)}
            onEnded={() => {
              if (isCycle) setClipIdx((i) => (i + 1) % playlist.length);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
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
        {/* Badge pills (Free/Pro/Game) removed per user brief — the
            cards now read as a clean visual grid without small overlays. */}
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

/* ─── Annotated screenshot helper ─────────────────────────────────
   Renders an image with numbered hotspot badges overlaid at given
   percent coordinates. Each badge is tappable; the active one pulses,
   gets a coloured outline, and reveals a matching callout below.
   The visual link (matching number + colour + arrow icon in the
   callout) makes the badges function as "arrows" from the image to
   the explanation. */
function AnnotatedScreenshot({
  image,
  alt,
  color,
  borderColor,
  hotspots,
}: {
  image: string;
  alt: string;
  color: string;
  borderColor: string;
  hotspots: { x: number; y: number; title: string; desc: string }[];
}) {
  const [activeHotspot, setActiveHotspot] = useState<number>(0);
  return (
    <div className="space-y-3">
      {/* Image with overlaid hotspots */}
      <div className="relative">
        <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
        <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
          <img
            src={image}
            alt={alt}
            className="w-full h-auto block"
            loading="eager"
            decoding="async"
          />
          {/* Numbered badge dots — absolute over the image */}
          {hotspots.map((h, i) => {
            const isOn = activeHotspot === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveHotspot(i)}
                aria-label={`Show explanation ${i + 1}: ${h.title}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: isOn ? '34px' : '28px',
                  height: isOn ? '34px' : '28px',
                  backgroundColor: color,
                  color: 'white',
                  fontSize: isOn ? '15px' : '13px',
                  boxShadow: isOn
                    ? `0 0 0 4px white, 0 0 0 7px ${color}, 0 6px 16px rgba(0,0,0,0.25)`
                    : `0 0 0 3px white, 0 4px 10px rgba(0,0,0,0.25)`,
                }}
              >
                {/* Pulsing halo on the active hotspot */}
                {isOn && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full motion-safe:animate-ping"
                    style={{ backgroundColor: color, opacity: 0.45 }}
                  />
                )}
                <span className="relative">{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Callout list — each "arrow" from a numbered badge to its
          explanation. Tapping a card switches the active hotspot. */}
      <div className="space-y-2">
        {hotspots.map((h, i) => {
          const isOn = activeHotspot === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveHotspot(i)}
              className="w-full text-left rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 p-3.5 transition-all active:border-b-2 active:translate-y-0.5 flex items-start gap-3"
              style={{
                borderColor: isOn ? color : '#E5E5E5',
                boxShadow: isOn ? `0 8px 22px -10px ${color}55` : undefined,
              }}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span
                  className="flex items-center justify-center rounded-full text-white font-extrabold"
                  style={{ backgroundColor: color, width: '26px', height: '26px', fontSize: '13px' }}
                >
                  {i + 1}
                </span>
                {/* Small upward arrow indicator linking the card to the hotspot above */}
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 1 L6 11 M2 5 L6 1 L10 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {h.title}
                </p>
                <p className="text-[11px] sm:text-[12px] text-stone-600 dark:text-stone-400 leading-snug font-semibold mt-0.5">
                  {h.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Essay tour Page 1 — interactive PITCH ──────────────────────
   Two layouts:
     • Mobile/tablet (< lg): AnnotatedScreenshot — image with numbered
       badges + stacked callouts beneath.
     • Desktop (lg+): image centred, 4 callout cards in the corners,
       each connected to its matching numbered hotspot on the image
       via a curved SVG arrow. */
function EssayPitchVisual({ color, borderColor }: { color: string; borderColor: string }) {
  // Shared content — same numbers on both layouts.
  // Badge positions on the image: each one MUST sit on the same side
  // as its callout column so the arrow doesn't cross another arrow.
  //   #1  = top-RIGHT column → badge 1 on top-RIGHT of the image (score)
  //   #2  = top-LEFT  column → badge 2 on top-LEFT  of the image (rubric)
  //   #3  = bot-LEFT  column → badge 3 on bot-LEFT  of the image (essay text)
  //   #4  = bot-RIGHT column → badge 4 on bot-RIGHT of the image (revisions)
  const hotspots: { x: number; y: number; title: string; desc: string; sample?: { strong?: string; improve?: string; concern?: string; lead?: string } }[] = [
    {
      // #1 — RIGHT column, badge pinned HIGH on the big "80…B (80-89%)"
      // score in the green header. Talks about the grade + score system.
      x: 82, y: 6,
      title: 'Real /100 grade + score system',
      desc: 'Every essay is graded out of 100 with a letter grade — using the same rubric weights real professors mark with. You always know how close you are to an A.',
    },
    {
      // #2 — LEFT column, badge sits in the editor area where the
      // annotated essay text lives. Talks about line-by-line marks.
      x: 22, y: 22,
      title: 'Line-by-line annotations + revisions',
      desc: 'Every sentence gets a verdict plus a specific revise-to suggestion. Not "make it better" — actual rewritten lines you can copy straight in.',
    },
    {
      // #3 — bot-LEFT column, color-coded essay text.
      x: 22, y: 68,
      title: 'Color-coded essay text · hover for AI feedback',
      desc: 'Your essay text turns green (strong), amber (revise), or red (serious concern). Hover any highlight to read the AI\'s exact feedback for that line.',
      sample: {
        lead: 'Sample sentence:',
        strong: 'The film positions race as both personal and structural,',
        improve: 'showing a lot of stuff about identity,',
        concern: 'and hegemony means power.',
      },
    },
    {
      // #4 — bot-RIGHT column, badge sits on the rubric scores
      // section of the analyzer panel. Six full categories now.
      x: 78, y: 84,
      title: 'Six-category rubric breakdown',
      desc: 'Thesis · Response · Evidence · Analysis · Structure · Clarity — each scored individually. You see exactly which category is costing you marks instead of guessing.',
    },
  ];

  return (
    <>
      {/* MOBILE / TABLET — stacked annotated screenshot, no SVG arrows */}
      <div className="lg:hidden">
        <AnnotatedScreenshot
          image="/WriterPic.png"
          alt="WriteScholar rubric and feedback notes — annotated breakdown"
          color={color}
          borderColor={borderColor}
          hotspots={hotspots.map(({ x, y, title, desc }) => ({ x, y, title, desc }))}
        />
      </div>

      {/* DESKTOP — image in centre, callouts in corners, SVG arrows
          connecting each callout to its hotspot. The viewBox is a
          fixed 1000×640 frame that matches the container's
          aspect-[1000/640] so arrow coordinates line up consistently. */}
      <DesktopArrowCallouts image="/WriterPic.png" color={color} borderColor={borderColor} hotspots={hotspots} />
    </>
  );
}

/* ─── Desktop arrow-callout layout (lg+) ─────────────────────────
   Flexible 3-column CSS grid: callouts | image | callouts. The grid
   GROWS with content — no fixed aspect ratio — so longer callout
   text or a taller screenshot won't break the layout.

   Each callout has a small inline arrow icon on its INNER edge
   pointing toward the image. Combined with the matching numbered
   badge on the image itself, the eye reads it as "this callout is
   connected to that badge". */
function DesktopArrowCallouts({
  image,
  color,
  borderColor,
  hotspots,
}: {
  image: string;
  color: string;
  borderColor: string;
  hotspots: { x: number; y: number; title: string; desc: string; sample?: { lead?: string; strong?: string; improve?: string; concern?: string } }[];
}) {
  // Hotspot-array indexing for the column layout:
  //   LEFT column  → hotspots[1] (#2 top), hotspots[2] (#3 bottom)
  //   RIGHT column → hotspots[0] (#1 top), hotspots[3] (#4 bottom)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const calloutRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }>>([]);

  // Compute real connector geometry from each callout's inner edge to
  // its badge's ring on the screenshot. Re-runs on resize and on
  // image load so the dashed arcs actually meet the numbered circles
  // instead of dangling in the column gap.
  useEffect(() => {
    const compute = () => {
      const c = containerRef.current?.getBoundingClientRect();
      const img = imageRef.current?.getBoundingClientRect();
      if (!c || !img || img.width === 0 || img.height === 0) return;
      const BADGE_R = 16; // 32px badge → radius 16; +3px gap so the arrow doesn't tuck under
      const next: Array<{ x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }> = [];
      hotspots.forEach((h, i) => {
        const cb = calloutRefs.current[i]?.getBoundingClientRect();
        if (!cb) return;
        const isRight = h.x > 50;
        const x1 = isRight ? cb.left - c.left - 2 : cb.right - c.left + 2;
        const y1 = cb.top + cb.height / 2 - c.top;
        const bcx = img.left - c.left + (h.x / 100) * img.width;
        const bcy = img.top - c.top + (h.y / 100) * img.height;
        const dx = bcx - x1;
        const dy = bcy - y1;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;
        const x2 = bcx - ux * (BADGE_R + 3);
        const y2 = bcy - uy * (BADGE_R + 3);
        // Gentle bow toward the image side so the line reads as a soft
        // arc, not a straight diagonal that crosses other elements.
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const bow = Math.min(26, Math.abs(dy) * 0.16);
        const cx = mx + -uy * bow * (isRight ? 1 : -1);
        const cy = my + ux * bow * (isRight ? 1 : -1);
        next.push({ x1, y1, x2, y2, cx, cy });
      });
      setLines(next);
    };
    compute();
    const raf = requestAnimationFrame(compute);
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (imageRef.current) ro.observe(imageRef.current);
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [hotspots, image]);

  return (
    <div ref={containerRef} className="relative hidden lg:grid lg:grid-cols-[1fr_minmax(0,1.7fr)_1fr] gap-10 xl:gap-14 items-stretch">
      {/* Parent SVG overlay — real connector arcs that meet each badge */}
      <svg
        className="pointer-events-none absolute inset-0 z-20"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        {lines.map((ln, i) => (
          <path
            key={i}
            d={`M ${ln.x1} ${ln.y1} Q ${ln.cx} ${ln.cy} ${ln.x2} ${ln.y2}`}
            stroke={color}
            strokeWidth="2.25"
            strokeDasharray="4 4"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </svg>

      {/* LEFT column */}
      <div className="flex flex-col justify-between gap-6 py-2">
        <div className="mt-10 xl:mt-14" ref={(el) => { calloutRefs.current[1] = el; }}>
          <DesktopCallout n={2} hotspot={hotspots[1]} color={color} arrow="right" hideArrow />
        </div>
        <div ref={(el) => { calloutRefs.current[2] = el; }}>
          <DesktopCallout n={3} hotspot={hotspots[2]} color={color} arrow="right" hideArrow />
        </div>
      </div>

      {/* CENTRE — image with hotspot badges */}
      <div className="relative pt-2">
        <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
        <div ref={imageRef} className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
          <img
            src={image}
            alt="WriteScholar rubric and feedback notes — annotated breakdown"
            className="w-full h-auto block"
            loading="eager"
            decoding="async"
            onLoad={() => { window.dispatchEvent(new Event('resize')); }}
          />
          {hotspots.map((h, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold z-30"
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: '32px',
                height: '32px',
                backgroundColor: color,
                color: 'white',
                fontSize: '14px',
                boxShadow: `0 0 0 4px white, 0 0 0 6px ${color}, 0 6px 14px rgba(0,0,0,0.25)`,
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT column */}
      <div className="flex flex-col justify-between gap-6 py-2">
        <div className="-mt-3 xl:-mt-5" ref={(el) => { calloutRefs.current[0] = el; }}>
          <DesktopCallout n={1} hotspot={hotspots[0]} color={color} arrow="left" hideArrow />
        </div>
        <div ref={(el) => { calloutRefs.current[3] = el; }}>
          <DesktopCallout n={4} hotspot={hotspots[3]} color={color} arrow="left" hideArrow />
        </div>
      </div>
    </div>
  );
}

/* Single desktop callout card with a number badge, title, description,
   optional colour-coded sample, and a dashed arrow on its inner edge
   pointing toward the centre image. */
function DesktopCallout({
  n,
  hotspot,
  color,
  arrow,
  hideArrow = false,
}: {
  n: number;
  hotspot: { title: string; desc: string; sample?: { lead?: string; strong?: string; improve?: string; concern?: string } };
  color: string;
  arrow: 'left' | 'right';
  /** When true, suppress the inner stub arrow — the parent
   *  DesktopArrowCallouts draws full computed arcs to each badge. */
  hideArrow?: boolean;
}) {
  return (
    <div className="relative">
      {/* Inner stub arrow — only used when the parent isn't drawing
          its own computed connector overlay. */}
      {!hideArrow && (<>
      <svg
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          // Wider + reaches further into the gap so the arrow visually
          // "connects" to its badge instead of dangling halfway.
          width: '64px',
          height: '22px',
          ...(arrow === 'right' ? { right: '-66px' } : { left: '-66px' }),
        }}
        viewBox="0 0 64 22"
        aria-hidden
      >
        {arrow === 'right' ? (
          <>
            <path d="M 2 11 L 54 11" stroke={color} strokeWidth="2.25" strokeDasharray="4 4" strokeLinecap="round" fill="none" />
            <path d="M 50 4 L 60 11 L 50 18" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M 62 11 L 10 11" stroke={color} strokeWidth="2.25" strokeDasharray="4 4" strokeLinecap="round" fill="none" />
            <path d="M 14 4 L 4 11 L 14 18" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
      </svg>
      </>)}

      <div
        className="rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 p-4"
        style={{ borderColor: color, boxShadow: `0 10px 26px -12px ${color}55` }}
      >
        <div className="flex items-start gap-2.5 mb-2">
          <span
            className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
            style={{ backgroundColor: color, width: '28px', height: '28px', fontSize: '14px' }}
          >
            {n}
          </span>
          <p className="text-sm xl:text-[15px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {hotspot.title}
          </p>
        </div>
        <p className="text-[12px] xl:text-[13px] text-stone-600 dark:text-stone-400 leading-snug font-semibold">
          {hotspot.desc}
        </p>
        {hotspot.sample && (
          <div className="mt-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/70 px-2.5 py-2 text-[12px] leading-relaxed font-semibold">
            {hotspot.sample.lead && (
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">{hotspot.sample.lead}</p>
            )}
            <p className="leading-relaxed">
              {hotspot.sample.strong && (
                <span
                  className="px-1 rounded"
                  style={{ backgroundColor: '#E5F8D0', color: '#3C3C3C', borderBottom: '2px solid #58CC02' }}
                  title="Strong — solid thesis move"
                >
                  {hotspot.sample.strong}
                </span>
              )}{' '}
              {hotspot.sample.improve && (
                <span
                  className="px-1 rounded"
                  style={{ backgroundColor: '#FFF4E0', color: '#3C3C3C', borderBottom: '2px solid #FF9600' }}
                  title="Improve — too vague, try naming specific examples"
                >
                  {hotspot.sample.improve}
                </span>
              )}{' '}
              {hotspot.sample.concern && (
                <span
                  className="px-1 rounded"
                  style={{ backgroundColor: '#FFE8E8', color: '#3C3C3C', borderBottom: '2px solid #FF4B4B' }}
                  title="Concern — needs a citation"
                >
                  {hotspot.sample.concern}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Essay tour Page 2 — COMPREHENSIVE ANALYSIS ────────────────
   Annotated /full-report.png screenshot showing the five sections
   of WriteScholar's comprehensive analysis: overall assessment,
   top suggestions, strengths, areas for improvement, and serious
   concerns.  Mobile stacks the AnnotatedScreenshot; desktop uses
   a custom 2-left / 3-right arrow callout layout (since 5 doesn't
   split evenly into Page 1's 2/2 pattern). */
function EssayDeepDiveVisual({ color, borderColor }: { color: string; borderColor: string }) {
  // Refs + computed-arrow overlay — identical pattern to
  // DesktopArrowCallouts. The deep-dive layout has 5 callouts instead
  // of 4 so the overlay is wired here directly rather than going
  // through DesktopArrowCallouts.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const calloutRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null, null]);
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }>>([]);

  useEffect(() => {
    const compute = () => {
      const c = containerRef.current?.getBoundingClientRect();
      const img = imageRef.current?.getBoundingClientRect();
      if (!c || !img || img.width === 0 || img.height === 0) return;
      const BADGE_R = 16;
      const next: Array<{ x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }> = [];
      // The hotspots array is in scope below — we read it via closure
      // by deferring the actual coordinates until inside compute().
      // (Same pattern works because the hotspots constant doesn't move.)
      const arr = HOTSPOTS_REF.current;
      arr.forEach((h, i) => {
        const cb = calloutRefs.current[i]?.getBoundingClientRect();
        if (!cb) return;
        const isRight = h.x > 50;
        const x1 = isRight ? cb.left - c.left - 2 : cb.right - c.left + 2;
        const y1 = cb.top + cb.height / 2 - c.top;
        const bcx = img.left - c.left + (h.x / 100) * img.width;
        const bcy = img.top - c.top + (h.y / 100) * img.height;
        const dx = bcx - x1;
        const dy = bcy - y1;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;
        const x2 = bcx - ux * (BADGE_R + 3);
        const y2 = bcy - uy * (BADGE_R + 3);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const bow = Math.min(26, Math.abs(dy) * 0.16);
        const cx = mx + -uy * bow * (isRight ? 1 : -1);
        const cy = my + ux * bow * (isRight ? 1 : -1);
        next.push({ x1, y1, x2, y2, cx, cy });
      });
      setLines(next);
    };
    compute();
    const raf = requestAnimationFrame(compute);
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (imageRef.current) ro.observe(imageRef.current);
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  // Stable ref to the hotspots array so the effect can read it
  // without rerunning every render (the array literal below is a new
  // reference each render).
  const HOTSPOTS_REF = useRef<Array<{ x: number; y: number }>>([]);
  // Non-crossing badge convention, adapted for 5 hotspots:
  //   #1 = RIGHT column top    (y≈10) — overall assessment, top of report
  //   #2 = LEFT  column top    (y≈25) — top suggestions, just below
  //   #3 = RIGHT column middle (y≈50) — strengths, middle of report
  //   #4 = LEFT  column bottom (y≈74) — areas for improvement
  //   #5 = RIGHT column bottom (y≈88) — serious concerns, bottom
  // Right column has 3 callouts (justify-between → top/mid/bot);
  // left column has 2 (justify-around → ~25%/~75%) — those natural
  // distribution percentages roughly match the badge y-positions.
  const hotspots: { x: number; y: number; title: string; desc: string }[] = [
    {
      // #1 — RIGHT top — Overall assessment
      x: 80, y: 20,
      title: 'Overall assessment',
      desc: 'Letter grade, /100 score, and a plain-English verdict at the top. The high-level read on where this draft sits before you dive into the details.',
    },
    {
      // #2 — LEFT top — Top suggestions (sits lower to track the report layout)
      x: 22, y: 32,
      title: 'Top suggestions',
      desc: 'The handful of changes that move your grade the most, ranked by impact. Fix these first if you only have 20 minutes before the deadline.',
    },
    {
      // #3 — RIGHT middle — Strengths
      x: 80, y: 50,
      title: 'Strengths',
      desc: 'The specific moves already earning marks: thesis framing, evidence handling, transitions. Each one surfaced with the actual sentence. Keep what works.',
    },
    {
      // #4 — LEFT bottom — Areas for improvement
      x: 22, y: 74,
      title: 'Areas for improvement',
      desc: 'Vague claims, weak signposting, sentences doing too much. Each one comes with a concrete "revise to" suggestion. No guessing what to change.',
    },
    {
      // #5 — RIGHT bottom — Serious concerns
      x: 80, y: 90,
      title: 'Serious concerns',
      desc: 'Missing citations, logic gaps, factual slips. The things professors actually deduct points for. Surfaced before submit, not after the red pen.',
    },
  ];
  // Sync the latest hotspots array into the closure-ref the effect
  // reads from, so the connector geometry stays current without
  // re-running the effect on every render (the literal above is a new
  // array reference each render).
  HOTSPOTS_REF.current = hotspots;

  return (
    <div className="space-y-3">
      {/* MOBILE / TABLET — stacked annotated screenshot, no SVG arrows */}
      <div className="lg:hidden">
        <AnnotatedScreenshot
          image="/full-report.png"
          alt="WriteScholar comprehensive analysis — annotated walkthrough"
          color={color}
          borderColor={borderColor}
          hotspots={hotspots}
        />
      </div>

      {/* DESKTOP — image in centre, 2 callouts on the left, 3 on the
          right. A parent SVG overlay draws real connector arcs from
          each callout's inner edge to its badge ring (computed from
          live bounding rects in the effect above), so the arrows
          actually meet the numbered circles. */}
      <div ref={containerRef} className="relative hidden lg:grid lg:grid-cols-[1fr_minmax(0,1.7fr)_1fr] gap-10 xl:gap-14 items-stretch">
        <svg
          className="pointer-events-none absolute inset-0 z-20"
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
          aria-hidden
        >
          {lines.map((ln, i) => (
            <path
              key={i}
              d={`M ${ln.x1} ${ln.y1} Q ${ln.cx} ${ln.cy} ${ln.x2} ${ln.y2}`}
              stroke={color}
              strokeWidth="2.25"
              strokeDasharray="4 4"
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </svg>

        {/* LEFT — #2 top, #4 bottom */}
        <div className="flex flex-col justify-around gap-6 py-2">
          <div className="mt-16 xl:mt-24" ref={(el) => { calloutRefs.current[1] = el; }}>
            <DesktopCallout n={2} hotspot={hotspots[1]} color={color} arrow="right" hideArrow />
          </div>
          <div ref={(el) => { calloutRefs.current[3] = el; }}>
            <DesktopCallout n={4} hotspot={hotspots[3]} color={color} arrow="right" hideArrow />
          </div>
        </div>

        {/* CENTRE — image with 5 numbered badges */}
        <div className="relative pt-2">
          <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-25" style={{ backgroundColor: `${color}40` }} aria-hidden />
          <div ref={imageRef} className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl bg-white dark:bg-stone-900" style={{ borderColor }}>
            <img
              src="/full-report.png"
              alt="WriteScholar comprehensive analysis — annotated walkthrough"
              className="w-full h-auto block"
              loading="eager"
              decoding="async"
              onLoad={() => { window.dispatchEvent(new Event('resize')); }}
            />
            {hotspots.map((h, i) => (
              <span
                key={i}
                aria-hidden
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-extrabold z-30"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: '32px',
                  height: '32px',
                  backgroundColor: color,
                  color: 'white',
                  fontSize: '14px',
                  boxShadow: `0 0 0 4px white, 0 0 0 6px ${color}, 0 6px 14px rgba(0,0,0,0.25)`,
                }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — #1 top, #3 middle, #5 bottom */}
        <div className="flex flex-col justify-between gap-6 py-2">
          <div className="-mt-3 xl:-mt-5" ref={(el) => { calloutRefs.current[0] = el; }}>
            <DesktopCallout n={1} hotspot={hotspots[0]} color={color} arrow="left" hideArrow />
          </div>
          <div ref={(el) => { calloutRefs.current[2] = el; }}>
            <DesktopCallout n={3} hotspot={hotspots[2]} color={color} arrow="left" hideArrow />
          </div>
          <div ref={(el) => { calloutRefs.current[4] = el; }}>
            <DesktopCallout n={5} hotspot={hotspots[4]} color={color} arrow="left" hideArrow />
          </div>
        </div>
      </div>

      {/* B → A revision flip — outcome card that seals the pitch */}
      <div className="rounded-2xl border-2 border-b-4 px-4 py-4 relative overflow-hidden" style={{ borderColor: '#46A302', backgroundColor: '#E5F8D0' }}>
        <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#58CC02]/30 blur-2xl" aria-hidden />
        <p className="relative text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#46A302] mb-2">
          After one revision pass
        </p>
        <div className="relative flex items-center justify-center gap-3">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-stone-400 line-through decoration-2 decoration-[#FF4B4B]/70" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              82
            </p>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 mt-1">Original · B</p>
          </div>
          <svg className="w-6 h-6 text-[#46A302]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-extrabold tabular-nums text-[#46A302]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              91
            </p>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#46A302] mt-1">Revised · A</p>
          </div>
        </div>
        <p className="relative mt-3 text-center text-[11px] sm:text-[12px] font-bold text-[#3C3C3C] leading-snug">
          That's the difference between a B and the honor roll, built into every analysis you run.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */
const OnboardingPage = ({ user, onComplete, onUserUpdate, onNavigate, testMode = false }: OnboardingPageProps) => {
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
  // Express Checkout Element mount host — renders the Apple Pay,
  // Google Pay and Stripe Link one-click buttons above the regular
  // card form. The browser decides which wallets to show (Apple Pay
  // only appears in supported browsers, Google Pay only in Chrome
  // and Android, Link shows everywhere).
  const expressCheckoutHostRef = useRef<HTMLDivElement>(null);
  // Stripe Elements (PaymentElement) — fully themeable via appearance,
  // unlike the locked-down Stripe Embedded Checkout iframe.
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const expressCheckoutElementRef = useRef<StripeExpressCheckoutElement | null>(null);
  // Whether ECE rendered any wallet buttons. When false (e.g. an
  // older browser with no Apple Pay or Google Pay) we hide the
  // "Or pay with card" divider and the empty wallet slot.
  const [hasExpressWallets, setHasExpressWallets] = useState(false);
  const [submittingTrial, setSubmittingTrial] = useState(false);
  const [trialSubmitError, setTrialSubmitError] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  // Confirmation modal shown when the user clicks "Maybe later" on the
  // checkout page — gives them one chance to reconsider before we route
  // them away from the free trial offer. "I will miss the free
  // opportunity" calls the real decline handler (drops to dashboard /
  // paywall-hard); "You're right…" just closes the modal and leaves
  // them on the checkout form.
  const [showCheckoutDeclineConfirm, setShowCheckoutDeclineConfirm] = useState(false);

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
      // Reset scroll to the top. The onboarding screens use a
      // `h-screen overflow-hidden` shell with an INNER
      // `flex-1 overflow-y-auto` content area, so `window.scrollTo`
      // doesn't help — we need to scroll the inner container(s)
      // themselves. Defer one tick so the next phase's DOM is mounted
      // before we query for scrollables.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
        requestAnimationFrame(() => {
          document.querySelectorAll<HTMLElement>('.flex-1.overflow-y-auto').forEach((el) => {
            el.scrollTop = 0;
          });
        });
      }
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
          // Google Ads trial-started conversion. Plan price passed for
          // value-based bidding; sessionId acts as transaction_id so a
          // page reload after Stripe return can't double-count. Email
          // is SHA-256 hashed inside the helper for Enhanced Conversions,
          // recovering cross-device / cookie-cleared attribution.
          const planPrice = data.data.plan === 'premium' ? 39.99 : data.data.plan === 'pro' ? 19.99 : 0;
          void trackTrialConversion(planPrice, sessionId, user?.email);
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
    if (testMode) { setTrialEligible(true); return; }
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
  }, [phase, testMode]);

  /* ─── Stripe Elements (PaymentElement) — themed to WriteScholar ───
     We use PaymentElement instead of Stripe's Embedded Checkout
     iframe specifically because Embedded Checkout's form CSS is
     locked down. PaymentElement honours the `appearance` API, so the
     fields below match our brand (Nunito, #A560E8, the Duolingo
     border-2 border-b-4 inputs) instead of looking like Stripe. */
  useEffect(() => {
    if (phase !== 'checkout') return;
    if (testMode) {
      setEmbeddedError(null);
      setEmbeddedLoading(false);
      return;
    }
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!publishableKey) {
      setEmbeddedError(EMBEDDED_CHECKOUT_FALLBACK);
      setEmbeddedLoading(false);
      return;
    }
    const mountEl = checkoutHostRef.current;
    if (!mountEl) return;

    let destroyed = false;

    (async () => {
      try {
        setEmbeddedError(null);
        setEmbeddedLoading(true);
        paymentElementRef.current?.unmount();
        paymentElementRef.current = null;
        expressCheckoutElementRef.current?.unmount();
        expressCheckoutElementRef.current = null;
        elementsRef.current = null;
        stripeRef.current = null;
        mountEl.innerHTML = '';
        if (expressCheckoutHostRef.current) expressCheckoutHostRef.current.innerHTML = '';
        setHasExpressWallets(false);

        const token = localStorage.getItem('authToken');
        if (!token) throw new UserFacingCheckoutError('Sign in again to continue.');

        const res = await fetch(`${API_URL}/subscriptions/create-elements-trial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ trialPeriodDays: TRIAL_DAYS }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new UserFacingCheckoutError(
            (typeof data?.message === 'string' && data.message) || 'We could not start your trial.',
          );
        }
        const clientSecret = data?.data?.clientSecret as string | undefined;
        if (!clientSecret) throw new UserFacingCheckoutError('We could not start your trial.');

        const stripe = await loadStripe(publishableKey);
        if (!stripe || destroyed) return;

        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#A560E8',
              colorBackground: '#FFFFFF',
              colorText: '#3C3C3C',
              colorTextSecondary: '#737373',
              colorTextPlaceholder: '#A8A8A8',
              colorDanger: '#FF4B4B',
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontSizeBase: '15px',
              fontWeightNormal: '600',
              fontWeightMedium: '700',
              fontWeightBold: '800',
              borderRadius: '12px',
              spacingUnit: '5px',
            },
            rules: {
              '.Input': {
                border: '2px solid #E5E5E5',
                borderBottomWidth: '4px',
                padding: '12px 14px',
                fontWeight: '700',
                boxShadow: 'none',
                backgroundColor: '#FAFAFA',
                transition: 'border-color 120ms ease, background-color 120ms ease',
              },
              '.Input:hover': { borderColor: '#A560E8' },
              '.Input:focus': {
                borderColor: '#A560E8',
                boxShadow: '0 0 0 3px rgba(165,96,232,0.20)',
                backgroundColor: '#FFFFFF',
              },
              '.Input--invalid': { borderColor: '#FF4B4B' },
              '.Label': {
                fontWeight: '800',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#737373',
                marginBottom: '6px',
              },
              '.Tab': {
                border: '2px solid #E5E5E5',
                borderBottomWidth: '4px',
                borderRadius: '12px',
                padding: '10px',
                fontWeight: '800',
                color: '#737373',
              },
              '.Tab:hover': { borderColor: '#A560E8', color: '#7733B5' },
              '.Tab--selected': {
                borderColor: '#A560E8',
                backgroundColor: '#F3EAFF',
                color: '#7733B5',
              },
              '.TabIcon--selected': { fill: '#A560E8' },
              '.Error': { fontWeight: '700', color: '#FF4B4B' },
            },
          },
        });

        // ─── Express Checkout — Apple Pay / Google Pay / Link ───
        // Renders the one-click wallet buttons above the card form
        // (mobile: Apple Pay on iOS Safari, Google Pay on Android
        // Chrome; desktop: Link everywhere, plus the wallet buttons
        // the browser supports). The `wallets` config uses 'auto'
        // so Stripe decides what to show based on the browser, the
        // user's signed-in state and the connected Stripe account.
        // On `confirm` we hand off to the same confirmSetup flow
        // the card form uses so success goes to the same return_url.
        const expressMount = expressCheckoutHostRef.current;
        if (expressMount && !destroyed) {
          try {
            const expressEl = elements.create('expressCheckout', {
              wallets: { applePay: 'auto', googlePay: 'auto' },
              buttonHeight: 48,
              buttonTheme: { applePay: 'black', googlePay: 'black' },
              buttonType: { applePay: 'plain', googlePay: 'plain' },
            });
            // `ready` fires once Stripe knows which (if any) wallets
            // the browser supports. `availablePaymentMethods` lists
            // the wallets that actually rendered; if empty we hide
            // the "Or pay with card" divider so the layout doesn't
            // look broken in browsers that show none.
            expressEl.on('ready', (event: { availablePaymentMethods?: Record<string, boolean> | undefined }) => {
              const available = event?.availablePaymentMethods || {};
              const anyWallet =
                !!available.applePay || !!available.googlePay || !!available.link;
              setHasExpressWallets(anyWallet);
            });
            expressEl.on('confirm', async () => {
              if (submittingTrial) return;
              setTrialSubmitError(null);
              setSubmittingTrial(true);
              try {
                trackEvent('onboarding_choose_trial', { variant: 'elements_express' });
                const { error } = await stripe.confirmSetup({
                  elements,
                  confirmParams: {
                    return_url: `${window.location.origin}/dashboard?payment=success`,
                  },
                });
                if (error) {
                  setTrialSubmitError(error.message || 'Something went wrong. Please try again.');
                  setSubmittingTrial(false);
                }
              } catch (err) {
                setTrialSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
                setSubmittingTrial(false);
              }
            });
            expressEl.mount(expressMount);
            expressCheckoutElementRef.current = expressEl;
          } catch {
            // ECE failed to initialise (e.g. publishable key in test
            // mode without wallets configured) — silently fall back
            // to the card-only flow. The card PaymentElement below
            // still works on its own.
            setHasExpressWallets(false);
          }
        }

        const paymentEl = elements.create('payment', {
          layout: { type: 'tabs', defaultCollapsed: false },
        });
        if (destroyed) return;
        paymentEl.mount(mountEl);

        stripeRef.current = stripe;
        elementsRef.current = elements;
        paymentElementRef.current = paymentEl;
      } catch (e) {
        // Log the real error so production failures are debuggable
        // from the browser console. The user-facing message stays
        // generic so we don't leak Stripe / API internals.
        // eslint-disable-next-line no-console
        console.error('[checkout] failed to initialise Stripe Elements:', e);
        if (!destroyed) {
          setEmbeddedError(e instanceof UserFacingCheckoutError ? e.message : EMBEDDED_CHECKOUT_FALLBACK);
        }
      } finally {
        if (!destroyed) setEmbeddedLoading(false);
      }
    })();

    return () => {
      destroyed = true;
      paymentElementRef.current?.unmount();
      paymentElementRef.current = null;
      expressCheckoutElementRef.current?.unmount();
      expressCheckoutElementRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
    };
  }, [phase, testMode]);

  /* ─── Confirm the trial — submits the PaymentElement and starts
     the 3-day trial. Stripe redirects to return_url on success. */
  const handleSubmitTrial = async () => {
    if (submittingTrial) return;
    setTrialSubmitError(null);
    if (testMode) { handleStartTrial(); return; }
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) {
      setTrialSubmitError('Checkout isn’t ready yet. Give it a second and try again.');
      return;
    }
    setSubmittingTrial(true);
    try {
      trackEvent('onboarding_choose_trial', { variant: 'elements' });
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });
      if (error) {
        setTrialSubmitError(error.message || 'Something went wrong. Please try again.');
        setSubmittingTrial(false);
      }
      // On success Stripe redirects to return_url — no further action.
    } catch (e) {
      setTrialSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setSubmittingTrial(false);
    }
  };

  /* ─── Profile save ─── */
  const saveProfile = async (): Promise<boolean> => {
    if (testMode) return true; // preview: never persist
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
    if (testMode) return; // preview: never persist
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/onboarding-survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralSource, useGoal, featureInterests }),
      });
      // Surface non-OK responses (HTTP 4xx/5xx) so silent backend failures
      // don't disappear into the void. fetch() only rejects on network errors,
      // so without this check, a 500 from a foreign-key violation or schema
      // mismatch would look identical to a successful insert from the caller's
      // perspective. Survey save is still non-blocking — we just log loudly.
      if (!res.ok) {
        let detail = '';
        try {
          const json = await res.json();
          detail = json?.message || '';
        } catch {
          /* response body wasn't JSON — ignore */
        }
        console.error(`[onboarding-survey] Save failed with HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
      }
    } catch (e) {
      // Survey is analytical — don't fail onboarding if the API is down.
      console.warn('[onboarding-survey] Network error (non-blocking):', e);
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

  // Personalised tour sequence with a baseline floor so every user
  // sees AT LEAST 2 slides (essays + study):
  //   1. Their selected features come FIRST, in canonical priority
  //      order (essays → study → citations → games → motivation).
  //   2. `tour-essays` and `tour-study` are then appended if not
  //      already present — they're our two "must-show" flagship
  //      tools and the only enforced floor.
  // Examples:
  //   • picks: [games]               → [games, essays, study]
  //   • picks: [essays]              → [essays, study]
  //   • picks: [study_packs]         → [study, essays]
  //   • picks: [essays, study_packs] → [essays, study]
  //   • picks: [games, motivation]   → [games, motivation, essays, study]
  const tourSequence = useMemo<TourPhase[]>(() => {
    const userPicks = FEATURE_TOUR_ORDER
      .filter((f) => featureInterests.includes(f.id))
      .map((f) => f.phase);
    const result: TourPhase[] = [...userPicks];
    // Step 2 — append the two must-show flagship slides if missing.
    // Previously a third slide (Daily Review, then citations) was
    // force-added as a "minimum 3" floor; both were removed per user
    // brief so the tour is now lean: essays + study, plus whatever
    // the user opted into.
    if (!result.includes('tour-essays')) result.push('tour-essays');
    if (!result.includes('tour-study')) result.push('tour-study');
    // Step 4 — Essay Analyzer is our flagship, so it gets a 2-page
    // deep dive: page 1 pitches WHY ours is the best, page 2 walks
    // through rubric + annotations + revision interactively. Splice
    // tour-essays-2 in right after tour-essays whenever it appears.
    const essaysIdx = result.indexOf('tour-essays');
    if (essaysIdx !== -1 && !result.includes('tour-essays-2')) {
      result.splice(essaysIdx + 1, 0, 'tour-essays-2');
    }
    return result;
  }, [featureInterests]);

  const handleSurveyContinue = async () => {
    setSurveySaving(true);
    await saveSurvey();
    setSurveySaving(false);
    trackEvent('onboarding_survey_complete', { source: referralSource, features: featureInterests.join(',') });
    // Jump to the FIRST slide in their personalised tour (essays if
    // selected, otherwise the highest-priority feature they picked).
    goToPhase(tourSequence[0] ?? 'value-prop');
  };

  const handleTourContinue = () => {
    // Find current position in the personalised sequence and advance.
    // When we run off the end of the sequence, we route to the
    // "value-prop" page (everything-you-get + testimonials) which then
    // hands the user off to the paywall.
    const idx = tourSequence.indexOf(phase as TourPhase);
    if (idx === -1 || idx >= tourSequence.length - 1) {
      goToPhase('value-prop');
    } else {
      goToPhase(tourSequence[idx + 1]);
    }
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
    if (testMode) {
      // Preview-only — pretend the trial worked and complete onboarding.
      setStartingTrial(false);
      onComplete?.();
      return;
    }
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
      // Users coming from the hard paywall ("last chance" screen)
      // get the 50%-off promo silently pre-applied to their checkout
      // session.  The visible copy on that page implies the code is
      // already on the order, so the Stripe page must match.
      const promoCode = phase === 'paywall-hard' ? HARD_PAYWALL_PROMO_CODE : undefined;
      const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planType: 'pro',
          billingCycle: 'monthly',
          successUrl,
          cancelUrl,
          trialPeriodDays: TRIAL_DAYS,
          ...(promoCode ? { promoCode } : {}),
        }),
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

  // Called when the user clicks "Skip" / "Maybe later" on the SOFT
  // paywall. We route to the `paywall-hard` last-chance screen which
  // surfaces the 50%-off promo. If they decline THAT too, the hard
  // paywall's own "No thanks, maybe later" hands them off to the
  // dashboard via 'transition'.
  //
  // When HIDE_END_PAYWALLS is on, paywall-hard is hidden and we drop
  // straight to the dashboard transition. The dashboard's own soft
  // paywall surfaces from there (see handleFinishOnboarding below for
  // the SOFT_PAYWALL_OPEN_KEY trigger details).
  const handleSoftPaywallDecline = () => {
    trackEvent('onboarding_paywall_decline_soft');
    if (HIDE_END_PAYWALLS) {
      goToPhase('transition');
      return;
    }
    goToPhase('paywall-hard');
  };

  // Exit onboarding from the value-prop screen via the "I'm ready to
  // begin" button. Sets SOFT_PAYWALL_OPEN_KEY in sessionStorage so the
  // dashboard's `Restore soft paywall after refresh` effect (see
  // CompleteAcademicAIApp.tsx ~line 712) reopens the soft paywall the
  // moment the user lands on the dashboard. This is the post-
  // onboarding nudge that replaces the old `paywall` + `paywall-hard`
  // upsell screens.
  const handleFinishOnboarding = () => {
    trackEvent('onboarding_complete_via_value_prop');
    try { sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1'); } catch { /* ignore */ }
    goToPhase('transition');
  };

  // Hard paywall decline — user picked "No thanks, maybe later".
  // We still drop them into the dashboard (the hard paywall is now a
  // soft last-chance offer, not a wall).  Critical UX detail: we mark
  // the soft paywall as dismissed RIGHT NOW so the dashboard's
  // "Let's level up your grades" soft paywall doesn't pop the second
  // they land. The 7-day cooldown then keeps it quiet for a week
  // before the next nudge.
  const handleHardPaywallDecline = () => {
    try { trackEvent('onboarding_paywall_decline_hard'); } catch { /* ignore */ }
    try { markSoftPaywallDismissedNow(); } catch { /* ignore */ }
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

  /* ─── TRANSITION ───────────────────────────────────────────────
     "Welcome to WriteScholar!" celebration screen — gamified
     achievement-unlock moment:
       • Animated radial gradient background that hue-cycles between
         the 5 brand colours (purple / green / orange / blue / red)
         — kept subtle (low opacity) so it doesn't feel rainbow-y.
       • Two concentric pulsing rings around the mascot (Duolingo
         "achievement earned" treatment) + soft green glow.
       • Mascot bounces gently while the rings animate.
       • H1 cascades in word by word — "WriteScholar" in brand purple.
       • Confetti uses 4 shape variants (square, circle, sparkle
         star, triangle) in 6 brand colours.
       • Progress bar has a shimmer pass while it fills. */
  if (phase === 'transition' || phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-white dark:bg-stone-950">
        {/* Animated radial gradient background — slow hue cycle */}
        <div className="absolute inset-0 ob-bg-cycle" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white dark:from-stone-950/70 dark:via-stone-950/40 dark:to-stone-950 pointer-events-none" aria-hidden />

        {/* Confetti — 4 shape variants in 6 colours */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {Array.from({ length: 90 }, (_, i) => {
            const shape = i % 4; // 0=square, 1=circle, 2=sparkle, 3=triangle
            const size = 6 + Math.random() * 10;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            return (
              <div
                key={i}
                className="absolute ob-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2.5 + Math.random() * 3}s`,
                }}
              >
                {shape === 2 ? (
                  /* Sparkle / 4-point star */
                  <svg width={size + 4} height={size + 4} viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 4px ${color}aa)` }}>
                    <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={color} />
                  </svg>
                ) : shape === 3 ? (
                  /* Triangle */
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `${size / 2}px solid transparent`,
                      borderRight: `${size / 2}px solid transparent`,
                      borderBottom: `${size}px solid ${color}`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ) : (
                  /* Square or circle */
                  <div
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: color,
                      borderRadius: shape === 1 ? '50%' : 2,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      boxShadow: `0 0 6px ${color}55`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* CENTRE — mascot in halo + heading + progress */}
        <div className="relative z-10 text-center px-6 max-w-md">
          {/* Mascot wrapped in pulsing halo + concentric rings */}
          <div className="relative mb-6 ob-scale-in">
            {/* Outer pulsing ring */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <div className="w-56 h-56 rounded-full border-4 border-[#58CC02]/50 ob-ring-pulse" />
            </div>
            {/* Inner pulsing ring (offset delay) */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <div className="w-44 h-44 rounded-full border-4 border-[#A560E8]/50 ob-ring-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            {/* Soft glow behind mascot */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
              <div className="w-40 h-40 rounded-full bg-[#58CC02]/30 blur-2xl ob-glow-pulse" />
            </div>
            {/* The mascot — bounces */}
            <div className="relative ob-mascot-bounce flex justify-center">
              <MascotGif src="/mascot-celebrating.webp" alt="Mascot celebrating" size={160} bordered borderColor="#58CC02" bgColor="#E5F8D0" />
            </div>
          </div>

          {/* Cascading H1 — each word fades in on its own delay */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            <span className="inline-block ob-word" style={{ animationDelay: '0.15s' }}>Welcome</span>{' '}
            <span className="inline-block ob-word" style={{ animationDelay: '0.30s' }}>to</span>{' '}
            <span className="inline-block ob-word text-[#A560E8]" style={{ animationDelay: '0.45s' }}>
              WriteScholar
            </span>
            <span className="inline-block ob-word" style={{ animationDelay: '0.60s' }}>!</span>
          </h1>
          <p className="mt-3 text-stone-500 dark:text-stone-400 font-bold text-base ob-subtitle">
            Your journey starts now, {firstName} 🎉
          </p>

          {/* Progress bar with shimmer pass */}
          <div className="mt-8 w-60 mx-auto relative">
            <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden border-2 border-stone-300 dark:border-stone-600">
              <div className="h-full bg-gradient-to-r from-[#58CC02] via-[#46A302] to-[#58CC02] rounded-full ob-progress-fill relative overflow-hidden">
                <div className="absolute inset-0 ob-shimmer" aria-hidden />
              </div>
            </div>
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              Loading your dashboard…
            </p>
          </div>
        </div>

        <style>{`
          /* Animated brand-colour radial gradient background */
          @keyframes obBgCycle {
            0%, 100% { background: radial-gradient(ellipse at 30% 30%, rgba(165,96,232,0.18), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(88,204,2,0.18), transparent 60%); }
            33%      { background: radial-gradient(ellipse at 70% 30%, rgba(255,150,0,0.18), transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(28,176,246,0.18), transparent 60%); }
            66%      { background: radial-gradient(ellipse at 50% 80%, rgba(255,75,75,0.16), transparent 60%), radial-gradient(ellipse at 50% 20%, rgba(255,215,0,0.18), transparent 60%); }
          }
          .ob-bg-cycle { animation: obBgCycle 6s ease-in-out infinite; }

          /* Confetti — varied shapes, longer fall, gentle spin */
          @keyframes obConfettiFall {
            0%   { transform: translateY(-10vh) rotate(0deg) scale(1);  opacity: 1; }
            50%  { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
          .ob-confetti-fall { animation: obConfettiFall var(--dur, 3s) ease-out forwards; }

          /* Scale-in card entrance */
          @keyframes obScaleIn {
            0%   { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1);   opacity: 1; }
          }
          .ob-scale-in { animation: obScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

          /* Pulsing concentric rings around the mascot */
          @keyframes obRingPulse {
            0%   { transform: scale(0.8);  opacity: 0.9; }
            70%  { transform: scale(1.25); opacity: 0; }
            100% { transform: scale(1.25); opacity: 0; }
          }
          .ob-ring-pulse { animation: obRingPulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }

          /* Soft glow behind mascot pulses with the rings */
          @keyframes obGlowPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%      { opacity: 0.85; transform: scale(1.08); }
          }
          .ob-glow-pulse { animation: obGlowPulse 2.4s ease-in-out infinite; }

          /* Mascot gentle bounce */
          @keyframes obMascotBounce {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-8px); }
          }
          .ob-mascot-bounce { animation: obMascotBounce 1.6s ease-in-out infinite; }

          /* Heading words cascade in */
          @keyframes obWordIn {
            0%   { transform: translateY(18px); opacity: 0; }
            100% { transform: translateY(0);    opacity: 1; }
          }
          .ob-word { animation: obWordIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

          /* Subtitle fades in after the H1 finishes */
          @keyframes obSubtitleIn {
            0%   { transform: translateY(8px); opacity: 0; }
            100% { transform: translateY(0);   opacity: 1; }
          }
          .ob-subtitle { animation: obSubtitleIn 0.5s ease-out 0.95s both; opacity: 0; }

          /* Progress bar fill + shimmer pass */
          @keyframes obProgressFill { from { width: 0%; } to { width: 100%; } }
          .ob-progress-fill { animation: obProgressFill 2.4s linear forwards; }
          @keyframes obShimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .ob-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
            animation: obShimmer 1.4s ease-in-out infinite;
          }

          /* Respect reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .ob-bg-cycle, .ob-ring-pulse, .ob-glow-pulse,
            .ob-mascot-bounce, .ob-shimmer { animation: none !important; }
          }
        `}</style>
      </div>
    );
  }

  /* ─── EMBEDDED CHECKOUT ─── */
  if (phase === 'checkout') {
    return (
      <div className="min-h-screen h-screen bg-gradient-to-br from-[#FAF7FF] via-[#F7F0FF] to-[#F0E8FF] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 flex flex-col overflow-hidden">
        {/* Ambient brand glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[44rem] max-w-full rounded-full bg-[#A560E8]/14 dark:bg-[#A560E8]/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-[#FFC800]/18 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-[#58CC02]/10 blur-3xl" aria-hidden />
        <TopBar showProgress={false} />
        <div className="relative flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-6xl mx-auto w-full">
            {/* TWO-COLUMN layout — pitch (mascot, headline, preview tiles,
                bullets) on the LEFT, payment (price summary + Stripe form +
                Maybe later) on the RIGHT. On desktop both columns fit in
                the viewport so users can pay without scrolling. On mobile
                it stacks: pitch first, then payment. */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-6 lg:gap-10 xl:gap-14 items-start">

              {/* ─── LEFT — pitch column ─── */}
              <div className="space-y-4 lg:space-y-5">
                {/* Mascot + trial chip + headline (horizontal to save vertical space) */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <MascotGif src="/mascot-laptop.webp" alt="" size={84} bordered borderColor="#A560E8" bgColor="#F3EAFF" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC800]/15 border-2 border-[#FFC800]/45 text-[#7A5C00] text-[10px] font-extrabold uppercase tracking-[0.18em] mb-2 shadow-[0_4px_14px_-4px_rgba(255,200,0,0.5)]">
                      <span aria-hidden>✨</span> 3-day free trial
                    </span>
                    <h1 className="text-[1.6rem] sm:text-[1.85rem] lg:text-[2rem] xl:text-[2.2rem] font-extrabold leading-[1.05] tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      Try Pro free for 3 days on us{firstName ? `, ${firstName}` : ''}
                    </h1>
                    <p className="mt-2 text-stone-600 dark:text-stone-400 text-[13px] sm:text-sm font-bold">
                      $0 today · Cancel anytime · No charge until day 4
                    </p>
                  </div>
                </div>

                {/* 6 preview tiles — two rows: editor trio on top
                    (writer / grade / report), study-and-games trio below
                    (flashcards / word games / daily review). Gives the
                    user a quick mosaic of what Pro actually unlocks. */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { src: '/WriterPic.png',             label: 'Smart editor',         tint: '#A560E8' },
                    { src: '/rubric-and-notes.png',      label: 'Live grade + rubric',  tint: '#58CC02' },
                    { src: '/full-report.png',           label: 'Full report + fixes',  tint: '#FF9600' },
                    { src: '/flashcard pic.png',         label: 'Flashcards + quizzes', tint: '#1CB0F6' },
                    { src: '/crosssword pic.png',        label: 'Word games',           tint: '#FF4B4B' },
                    { src: '/daily-review-preview.png',  label: 'Daily review',         tint: '#FFC800' },
                  ].map((tile) => (
                    <div
                      key={tile.label}
                      className="group relative overflow-hidden rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 shadow-[0_10px_30px_-14px_rgba(40,30,60,0.30)]"
                      style={{ borderColor: `${tile.tint}55` }}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-stone-50 dark:bg-stone-900">
                        <img
                          src={tile.src}
                          alt={tile.label}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="px-2 py-1.5 text-center bg-white dark:bg-stone-900 border-t" style={{ borderColor: `${tile.tint}33` }}>
                        <p className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-700 dark:text-stone-200 leading-tight">
                          {tile.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Value bullets — moved out of pricing card so the right
                    column stays compact and the form stays above the fold. */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 pt-1">
                  {['Full annotations on every paper', 'One-click apply revisions', 'Estimated grade + full rubric', '99 analyses · 100MB uploads'].map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-[12.5px] font-bold text-stone-700 dark:text-stone-300">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#58CC02]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ─── RIGHT — payment column ─── */}
              <div className="space-y-3">
                {/* Compact pricing summary — one horizontal row */}
                <div className="rounded-2xl border-2 border-b-4 border-[#A560E8]/40 bg-gradient-to-br from-white via-white to-[#FAF5FF] dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_18px_42px_-22px_rgba(165,96,232,0.45)] relative overflow-hidden">
                  <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[#A560E8]/12 blur-2xl" aria-hidden />
                  <div className="relative">
                    <p className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-[#A560E8]">
                      <span aria-hidden>⭐</span> WriteScholar Pro
                    </p>
                    <p className="mt-0.5 text-[1.5rem] font-extrabold leading-none text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      $0<span className="ml-1 text-xs font-bold text-stone-400">/today</span>
                    </p>
                  </div>
                  <div className="relative text-right text-[11px] font-bold text-stone-500 dark:text-stone-400 leading-tight">
                    Then <span className="font-extrabold text-stone-800 dark:text-stone-100">$19.99/mo</span><br />
                    Cancel anytime
                  </div>
                </div>

                {/* Stripe form card — green secure header + themed PaymentElement */}
                <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden shadow-[0_22px_56px_-22px_rgba(0,0,0,0.20)]">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#58CC02] to-[#46A302] text-white">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path fillRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 17 10.5v6A1.5 1.5 0 0 1 15.5 18h-11A1.5 1.5 0 0 1 3 16.5v-6A1.5 1.5 0 0 1 4.5 9H5Zm2 0V7a3 3 0 1 1 6 0v2H7Z" clipRule="evenodd" /></svg>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em]">Secure checkout · Powered by Stripe</p>
                  </div>
                  <div className="p-4 sm:p-5 relative">
                    {testMode ? (
                      /* Friendly preview placeholder — mock Stripe-style form */
                      <div className="rounded-2xl border-2 border-dashed border-[#A560E8]/40 bg-[#F3EAFF]/40 dark:bg-[#A560E8]/10 p-4 flex flex-col">
                        <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] text-[10px] font-extrabold uppercase tracking-[0.16em] border border-[#A560E8]/30">
                          <span aria-hidden>👀</span> Preview mode
                        </span>
                        <p className="mt-2.5 text-[12.5px] font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                          In production, Stripe&apos;s secure card form renders here — number, expiry, CVC and the 3-day trial summary.
                        </p>
                        <div className="mt-3 space-y-2.5">
                          {[
                            { label: 'Email', w: 'w-2/3' },
                            { label: 'Card number', w: 'w-3/4' },
                            { label: 'Expiry  ·  CVC', w: 'w-1/2' },
                            { label: 'Country', w: 'w-1/3' },
                          ].map((f) => (
                            <div key={f.label} className="rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/60 px-3.5 py-2">
                              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-stone-400 mb-1">{f.label}</p>
                              <div className={`h-2.5 ${f.w} rounded-full bg-stone-100 dark:bg-stone-800`} />
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleStartTrial}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white text-base font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                        >
                          Start for free (preview)
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        {embeddedLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 dark:bg-stone-900/95 z-10 rounded-2xl">
                            <span className="w-10 h-10 border-[5px] border-[#A560E8] border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-bold">Loading secure checkout…</p>
                          </div>
                        )}
                        {embeddedError && !embeddedLoading && (
                          <div className="mb-3 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-4 py-3 text-sm text-[#FF4B4B] font-bold">
                            {embeddedError}
                          </div>
                        )}
                        {/* Express Checkout — Apple Pay / Google Pay /
                            Link buttons. Hidden when the browser shows
                            zero wallets so the divider below doesn't
                            float over empty space. */}
                        <div
                          ref={expressCheckoutHostRef}
                          id="onboarding-express-checkout"
                          className={hasExpressWallets ? 'mb-3' : 'hidden'}
                        />
                        {hasExpressWallets && (
                          <div className="relative flex items-center my-3" aria-hidden>
                            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                            <span className="px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                              Or pay with card
                            </span>
                            <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                          </div>
                        )}
                        {/* PaymentElement mounts here. Themed via the
                            appearance config in the effect above so it
                            renders in WriteScholar's brand language. */}
                        <div ref={checkoutHostRef} className="min-h-[240px]" id="onboarding-payment-element" />

                        {trialSubmitError && (
                          <div className="mt-3 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-4 py-3 text-sm text-[#FF4B4B] font-bold">
                            {trialSubmitError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleSubmitTrial}
                          disabled={submittingTrial || embeddedLoading || !!embeddedError}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-base font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                        >
                          {submittingTrial ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path fill="currentColor" className="opacity-90" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Starting your trial…
                            </>
                          ) : (
                            <>
                              Start for free
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-center text-[11px] font-bold text-stone-400 dark:text-stone-500">
                  🔒 Encrypted by Stripe · WriteScholar never sees your card number
                </p>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('onboarding_paywall_decline_intent');
                      setShowCheckoutDeclineConfirm(true);
                    }}
                    className="px-4 py-2 text-sm font-extrabold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-[#A560E8] transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ─── "Are you sure?" confirmation modal ───
            Shown only after the user clicks "Maybe later" on the
            checkout form. Last-chance friction before the user walks
            away from the free trial. Red CTA = continue declining;
            green CTA = stay on the checkout form. */}
        {showCheckoutDeclineConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-decline-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 py-6 bg-black/55 backdrop-blur-sm animate-[fadeIn_0.18s_ease-out]"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCheckoutDeclineConfirm(false); }}
          >
            <div className="relative w-full max-w-md rounded-3xl border-2 border-b-4 border-[#A560E8]/45 bg-white dark:bg-stone-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Soft brand glows */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#A560E8]/18 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#FFC800]/18 blur-3xl" aria-hidden />

              <div className="relative px-6 sm:px-7 pt-7 pb-6 text-center">
                {/* Sad mascot — softens the "are you sure" moment */}
                <div className="flex justify-center mb-4">
                  <MascotGif src="/mascot-sad.webp" alt="" size={92} bordered borderColor="#A560E8" bgColor="#F3EAFF" />
                </div>

                <h2
                  id="checkout-decline-title"
                  className="text-[1.4rem] sm:text-[1.55rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  Are you sure?
                </h2>
                <p className="mt-2.5 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                  Once you&apos;ve passed onboarding you will miss out on our <span className="text-[#A560E8]">free Pro features</span>.
                </p>

                {/* CTAs — green (stay on trial) primary, red (leave) secondary */}
                <div className="mt-6 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('onboarding_paywall_decline_reconsider');
                      setShowCheckoutDeclineConfirm(false);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    You&apos;re right, I want my free Pro trial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('onboarding_paywall_decline_soft', { source: 'checkout_confirm_modal' });
                      setShowCheckoutDeclineConfirm(false);
                      // Skip the paywall-hard "50% off" upsell entirely
                      // — finish onboarding and drop straight to the
                      // dashboard via the transition screen.
                      handleContinueFree();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10 text-[#FF4B4B] text-[12px] sm:text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#FF4B4B]/50 hover:border-[#FF4B4B] active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    I will miss the free opportunity
                  </button>
                </div>
              </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          </div>
        )}
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

  /* ─── VALUE-PROP — pre-paywall page that builds value: the full
     8-tool grid, social proof, and student testimonials. Routes
     to the paywall on Continue. ─── */
  if (phase === 'value-prop') {
    const testimonials: { quote: string; name: string; meta: string; emoji: string; accent: string; border: string; bg: string }[] = [
      {
        quote: "Went from a B to an A on two back-to-back essays. The line-by-line feedback reads like a TA actually marked my draft.",
        name: 'Maya K.',
        meta: 'College sophomore · Pre-law',
        emoji: '📝',
        accent: '#A560E8', border: '#8A48C7', bg: '#F3EAFF',
      },
      {
        quote: "I used to spend hours making flashcards. Now my notes turn into a full deck in 30 seconds and I actually study them.",
        name: 'Daniel R.',
        meta: 'High school junior · AP Bio',
        emoji: '🎴',
        accent: '#58CC02', border: '#46A302', bg: '#E5F8D0',
      },
      {
        quote: "Crater Blast made me look forward to reviewing for finals. My friends thought I was joking when I said studying was fun.",
        name: 'Olivia M.',
        meta: 'College freshman · Pre-med',
        emoji: '🎮',
        accent: '#FF9600', border: '#D97F00', bg: '#FFF4E0',
      },
      {
        quote: "The citation finder saved me three all-nighters this semester. Real sources, formatted correctly, in seconds.",
        name: 'Aiden T.',
        meta: 'College senior · English',
        emoji: '📚',
        accent: '#1CB0F6', border: '#1899D6', bg: '#DDF4FF',
      },
    ];

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        {/* Header — matches paywall page so the transition feels seamless */}
        <div className="bg-white dark:bg-stone-900 border-b-2 border-[#E5E5E5] dark:border-stone-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
          </div>
          <button type="button" onClick={handleSoftPaywallDecline} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-bold underline underline-offset-4">
            Skip
          </button>
        </div>
        <div className="h-3 bg-[#E5E5E5] dark:bg-stone-800">
          <div className="h-full bg-[#58CC02] rounded-r-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto w-full ob-fade-in">
            {/* Hero */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="mb-4">
                <MascotGif src="/mascot-dance.webp" alt="" size={130} bordered borderColor="#A560E8" bgColor="#F3EAFF" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] text-[#A560E8] text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <span aria-hidden>✨</span>
                Everything you get
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Eight tools. <span className="text-[#A560E8]">Designed for success.</span>
              </h1>
              <p className="mt-2 text-stone-500 dark:text-stone-400 font-bold text-sm sm:text-base max-w-xl mx-auto">
                From our flagship essay feedback to study games, your full academic toolkit lives in one place.
              </p>
            </div>

            {/* Trust strip — quick credibility hit before the grid.
                "4.9 from 12k+ reviews" and "1.2M+ essays analyzed" are
                temporarily hidden via `{false && …}` so the metrics
                aren't surfaced before they're truly accurate. The
                "Loved by 50k+ students" item stays visible so the
                strip still does its credibility job. Flip the gates
                to `true` (or remove them) to bring the hidden items
                back. */}
            <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs font-extrabold text-stone-500 dark:text-stone-400">
              {false && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#FF9600] text-base leading-none">★</span>
                    <span className="text-[#3C3C3C] dark:text-stone-100">4.9</span>
                    <span>from 12k+ reviews</span>
                  </span>
                  <span aria-hidden className="text-stone-300 dark:text-stone-600">·</span>
                </>
              )}
              {/* "Loved by 50,000+ students" — Duolingo-style trust
                  pill. White rounded pill with a 2px border + 3px
                  bottom-border lip and a soft drop shadow. 5 yellow
                  stars sit above a bold headline with the count
                  accented in brand green. */}
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-b-[3px] border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-1.5 shadow-[0_6px_20px_-6px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col items-center leading-[1.15]">
                  <span aria-hidden className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="text-[#FF9600] text-xs">★</span>
                    ))}
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-extrabold text-[#3C3C3C] dark:text-stone-100 tracking-tight">
                    Loved by <span className="text-[#58CC02] tabular-nums">50,000+</span> students
                  </span>
                </div>
              </div>
              {false && (
                <>
                  <span aria-hidden className="text-stone-300 dark:text-stone-600">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden>📈</span>
                    <span>1.2M+ essays analyzed</span>
                  </span>
                </>
              )}
            </div>

            {/* 8-tool feature grid — reuse the paywall tool cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
              {PAYWALL_TOOLS.map((tool, i) => (
                <ToolCard key={tool.title} tool={tool} delayMs={i * 60} />
              ))}
            </div>

            {/* Testimonials — real students, specific outcomes */}
            <div className="mb-6">
              <div className="text-center mb-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#58CC02] mb-2">Real students, real results</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Students are getting their grades back.
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {testimonials.map((t, i) => (
                  <div
                    key={t.name}
                    className="rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 p-4 sm:p-5 ob-fade-in"
                    style={{ borderColor: t.border, animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      {[0,1,2,3,4].map((s) => (
                        <span key={s} className="text-[#FF9600] text-sm" aria-hidden>★</span>
                      ))}
                    </div>
                    <p className="text-[13px] sm:text-sm text-[#3C3C3C] dark:text-stone-200 font-semibold leading-snug mb-3">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0"
                        style={{ borderColor: t.border, backgroundColor: t.bg }}
                        aria-hidden
                      >
                        <span className="text-base">{t.emoji}</span>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-tight" style={{ color: t.accent }}>{t.name}</p>
                        <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 leading-tight">{t.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing reassurance — frames the next step without pressuring */}
            <div className="rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/10 px-4 sm:px-5 py-4 sm:py-5 text-center mb-2">
              <p className="text-sm sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Ready to unlock all 8 tools?
              </p>
              <p className="mt-1 text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-400">
                Unlock everything with Pro. Cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky footer Continue — moves the user to the paywall */}
        <div className="border-t-2 border-[#E5E5E5] dark:border-stone-800 bg-white dark:bg-stone-900 px-5 sm:px-8 py-4 sm:py-5">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              onClick={() => goToPhase('checkout')}
              className="w-full sm:w-auto sm:min-w-[220px] py-3.5 px-8 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              I&apos;m ready
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes obFadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ob-fade-in { animation: obFadeIn 0.4s ease-out backwards; }
        `}</style>
      </div>
    );
  }

  /* ─── PAYWALL — full 8-tool showcase, Duolingo-styled ─── */
  /* Hidden when HIDE_END_PAYWALLS is on. The render block below is
     intentionally preserved so flipping the flag to `false` brings
     this entire screen back without re-typing it. The defensive short-
     circuit handles the edge case where some other code path sets
     phase = 'paywall' while the flag is on — we just send the user
     straight to the dashboard transition. */
  if (phase === 'paywall' && HIDE_END_PAYWALLS) {
    queueMicrotask(() => goToPhase('transition'));
    return null;
  }
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
          <button type="button" onClick={handleSoftPaywallDecline} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-bold underline underline-offset-4">
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              You're now ready to <span className="text-[#58CC02]">ace school</span>.
            </h1>
            <p className="mt-3 text-stone-600 dark:text-stone-300 font-bold text-sm sm:text-base max-w-xl mx-auto">
              You showed up, you set your goal, you sat through the tour. You've showed you take school seriously. Now it's time to make those grades improve.
            </p>
          </div>

          {/* Primary CTA — above the fold */}
          <div className="max-w-md mx-auto mb-8">
            <div className="rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/10 p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#58CC02]/20 blur-2xl" aria-hidden />
              <p className="relative text-lg font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Upgrade to Pro
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
                    Start for free
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
              <p className="relative mt-2 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                Then $19.99/mo. Cancel anytime.
              </p>
            </div>
          </div>

          {/* 8-tool feature grid */}
          <div className="mb-8">
            <div className="text-center mb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#A560E8] mb-2">EVERYTHING YOU GET</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Eight tools. Designed for success.
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
              onClick={handleSoftPaywallDecline}
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

  /* ─── HARD PAYWALL — last-chance interception ────────────────────
     Fires when the user declines the soft paywall. NEW PRODUCT RULE
     (per user brief): no one reaches the dashboard without starting a
     trial. So this screen has only ONE forward button (start trial) and
     ONE way out (sign out). Visually it's a more emotional, "Wait —
     don't go!" beat with the begging mascot, big loss-aversion copy,
     and the same Duolingo Pro green CTA as the soft paywall.

     Conversion mechanics:
       1. Single decisive CTA — no choice paradox
       2. Loss-framing list — what they LOSE without the trial
       3. Risk reversal — "no payment today · cancel anytime"
       4. Social proof reminder — "50,000+ students already on Pro"
       5. The escape is a small low-contrast "Sign out instead" link
          so it's findable but not the obvious path. */
  /* Hidden when HIDE_END_PAYWALLS is on. Same pattern as the soft-
     paywall short-circuit above — render block stays intact for easy
     re-enable. */
  if (phase === 'paywall-hard' && HIDE_END_PAYWALLS) {
    queueMicrotask(() => goToPhase('transition'));
    return null;
  }
  if (phase === 'paywall-hard') {
    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        {/* Top bar — NO skip button, NO escape from the header */}
        <div className="bg-white dark:bg-stone-900 border-b-2 border-[#E5E5E5] dark:border-stone-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
          </div>
        </div>
        <div className="h-3 bg-[#E5E5E5] dark:bg-stone-800">
          <div className="h-full bg-[#58CC02] rounded-r-full transition-all duration-500" style={{ width: `100%` }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-6 sm:py-10 max-w-2xl mx-auto w-full ob-fade-in">
            {/* Pleading mascot + speech bubble */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <div className="relative mb-4 ob-mascot-bob">
                <img
                  src="/mascot-paper.webp"
                  alt=""
                  aria-hidden
                  width={180}
                  height={180}
                  className="w-32 h-32 sm:w-44 sm:h-44 object-contain drop-shadow-[0_12px_24px_rgba(165,96,232,0.30)]"
                />
                {/* Floating sparkles around the mascot */}
                <span aria-hidden className="absolute -top-1 -right-2 text-2xl ob-sparkle-spin">✨</span>
                <span aria-hidden className="absolute bottom-2 -left-3 text-xl ob-sparkle-spin" style={{ animationDelay: '0.7s' }}>⭐</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#FF4B4B]/40 bg-[#FFE8E8] text-[#FF4B4B] text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <span aria-hidden>⏰</span>
                Last chance, {firstName}!
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Don&apos;t miss out on{' '}
                <span className="text-[#58CC02]">50% off Pro</span>
              </h1>
              <p className="mt-3 text-base sm:text-lg text-stone-600 dark:text-stone-400 font-bold leading-snug max-w-md">
                An exclusive <em className="not-italic text-[#A560E8]">50% off</em> — only on this screen.
              </p>
            </div>

            {/* Loss-aversion list — emotional, outcome-driven copy
                that names specific pain points (B grades, 2 AM citation
                hunts) so the user feels what they're walking away from.
                Icons reuse the same brand SVGs designed for the landing
                hero feature row (Study Pack, Essay Analyzer, Games,
                Citations) — not generic emoji — so the visual identity
                stays consistent end-to-end. */}
            <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6 mb-6">
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FF4B4B] mb-3 text-center">
                Walk away and you&apos;ll miss:
              </p>
              <ul className="space-y-3">
                {[
                  {
                    // Study Pack icon (orange stacked books + gold star)
                    icon: (
                      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
                        <rect x="6" y="44" width="52" height="14" rx="3" fill="#FF9600" />
                        <rect x="14" y="44" width="3" height="14" fill="white" opacity="0.65" />
                        <rect x="10" y="28" width="44" height="14" rx="3" fill="#FF9600" />
                        <rect x="18" y="28" width="3" height="14" fill="white" opacity="0.65" />
                        <rect x="14" y="12" width="36" height="14" rx="3" fill="#FF9600" />
                        <rect x="22" y="12" width="3" height="14" fill="white" opacity="0.65" />
                        <path d="M44 8 L45 11 L48 12 L45 13 L44 16 L43 13 L40 12 L43 11 Z" fill="#FFC800" />
                      </svg>
                    ),
                    title: 'Better grades, guaranteed',
                    desc: 'Our flagship AI catches the structure, citation, and clarity slips that cost you marks every paper.',
                  },
                  {
                    // Essay Analyzer icon (red document + folded corner + white check)
                    icon: (
                      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
                        <path d="M14 6 Q12 6 12 8 L12 56 Q12 58 14 58 L50 58 Q52 58 52 56 L52 22 L36 6 Z" fill="#FF4B4B" />
                        <path d="M36 6 L52 22 L38 22 Q36 22 36 20 Z" fill="#C13030" />
                        <rect x="20" y="30" width="22" height="3" rx="1.5" fill="white" />
                        <rect x="20" y="37" width="18" height="3" rx="1.5" fill="white" opacity="0.7" />
                        <path d="M22 48 L28 54 L40 41" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ),
                    title: 'Pro-grade rubric scoring',
                    desc: 'Turn B drafts into honor-roll papers with line-by-line revision suggestions from our Essay Analyzer.',
                  },
                  {
                    // Games icon (green controller silhouette + white D-pad and buttons)
                    icon: (
                      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
                        <path d="M14 22 Q6 22 6 30 L6 44 Q6 56 18 56 Q23 56 26 50 L28 46 L36 46 L38 50 Q41 56 46 56 Q58 56 58 44 L58 30 Q58 22 50 22 Q46 17 40 21 Q36 24 32 24 Q28 24 24 21 Q18 17 14 22 Z" fill="#58CC02" />
                        <rect x="14" y="32" width="12" height="3.5" rx="1.5" fill="white" />
                        <rect x="18.25" y="27.75" width="3.5" height="12" rx="1.5" fill="white" />
                        <circle cx="46" cy="30" r="3.2" fill="white" />
                        <circle cx="52" cy="36" r="3.2" fill="white" />
                        <circle cx="40" cy="36" r="3.2" fill="white" />
                        <circle cx="46" cy="42" r="3.2" fill="white" />
                      </svg>
                    ),
                    title: 'Studying that’s actually fun',
                    desc: 'Crater Blast, Word Blitz & Word Tower turn cramming into a boss battle.',
                  },
                  {
                    // Citations icon (two blue quote-mark blobs)
                    icon: (
                      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
                        <path d="M10 18 Q10 12 16 12 L24 12 Q28 12 28 16 L28 32 Q28 44 16 50 Q12 50 12 46 Q12 44 14 42 Q20 38 20 32 L16 32 Q10 32 10 26 Z" fill="#1CB0F6" />
                        <path d="M36 18 Q36 12 42 12 L50 12 Q54 12 54 16 L54 32 Q54 44 42 50 Q38 50 38 46 Q38 44 40 42 Q46 38 46 32 L42 32 Q36 32 36 26 Z" fill="#1CB0F6" />
                      </svg>
                    ),
                    title: 'No more 2 AM citation panic',
                    desc: 'Real APA, MLA & Chicago sources pulled in seconds — no more Google Scholar rabbit holes.',
                  },
                ].map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span aria-hidden className="block w-10 h-10 sm:w-11 sm:h-11 shrink-0 mt-[1px] [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.18))]">
                      {b.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-[15px] font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                        {b.title}
                      </p>
                      <p className="text-[12px] sm:text-[13px] font-semibold text-stone-600 dark:text-stone-400 leading-snug mt-0.5">
                        {b.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* PROMO BANNER — 50%-off code is silently pre-applied to
                the checkout session via HARD_PAYWALL_PROMO_CODE. The
                copy below tells the user the code is already on their
                order so they don't have to type anything at Stripe. */}
            <div className="relative rounded-2xl border-2 border-b-4 border-[#D4A300] bg-[#FFF4C2] dark:bg-[#FFC800]/10 p-4 sm:p-5 mb-4 overflow-hidden">
              <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#FFC800]/30 blur-2xl" aria-hidden />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <span aria-hidden className="text-2xl sm:text-3xl shrink-0">🎟️</span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7A5C00]">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>✓</span> Code applied to your checkout
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm sm:text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                    Save <span className="text-[#46A302]">50%</span> on your first monthly plan after the trial
                  </p>
                  <p className="mt-1 text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-300">
                    Code{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white dark:bg-stone-900 border-2 border-b-[3px] border-[#D4A300] text-[#7A5C00] font-extrabold tabular-nums tracking-wider">
                      MAY2026
                    </span>{' '}
                    is already on your order. $19.99/mo becomes $9.99/mo at billing — nothing to type in.
                  </p>
                </div>
              </div>
            </div>

            {/* Big green CTA — the only forward door */}
            <div className="rounded-2xl border-2 border-b-4 border-[#46A302] bg-[#E5F8D0] dark:bg-[#58CC02]/10 p-5 sm:p-6 text-center relative overflow-hidden mb-4">
              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#58CC02]/20 blur-2xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-[#58CC02]/15 blur-2xl" aria-hidden />
              <p className="relative text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Upgrade to Pro
              </p>
              <p className="relative mt-1 text-sm font-bold text-stone-600 dark:text-stone-400">
                <span className="line-through decoration-2 decoration-[#FF4B4B] text-stone-400">$19.99/mo</span>{' '}
                <span className="text-[#46A302] font-extrabold">$9.99/mo</span>{' '}
                <span className="text-[#7A5C00] font-extrabold">(50% off applied)</span>
              </p>
              <button
                type="button"
                onClick={SKIP_ONBOARDING_STRIPE ? handleContinueFree : handleStartTrial}
                disabled={startingTrial}
                className="relative mt-4 w-full py-4 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base sm:text-lg uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_-6px_rgba(88,204,2,0.55)] hover:shadow-[0_12px_32px_-6px_rgba(88,204,2,0.75)]"
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
                    Yes! Upgrade to Pro
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              {trialError && <p className="relative mt-3 text-sm text-[#FF4B4B] font-bold">{trialError}</p>}
              <div className="relative mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-extrabold text-stone-600 dark:text-stone-400">
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> No charge today</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> Cancel anytime</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1"><span className="text-[#58CC02]">✓</span> 50k+ students</span>
              </div>
            </div>

            {/* Subtle, low-contrast escape hatch — routes the user
                into the dashboard (via the 'transition' phase). The
                hard paywall is no longer a wall; weekly-cooldown soft
                paywalls + free-tier API limits take over from here. */}
            <div className="text-center pb-4">
              <button
                type="button"
                onClick={handleHardPaywallDecline}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-bold underline underline-offset-4"
              >
                No thanks, maybe later
              </button>
            </div>

            <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 font-bold pb-2">
              Secured by Stripe · Never lose progress
            </p>
          </div>
        </div>

        <style>{`
          @keyframes obFadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ob-fade-in { animation: obFadeIn 0.4s ease-out; }
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
              onClick={() => goToPhase('value-prop')}
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
  if (phase === 'tour-essays' || phase === 'tour-essays-2' || phase === 'tour-study' || phase === 'tour-citations' || phase === 'tour-games' || phase === 'tour-motivation') {
    // Dynamic eyebrow: "TOOL X OF Y" — X is position in the user's
    // personalised tour, Y is total slides they'll see.
    const tourIdx = tourSequence.indexOf(phase as TourPhase);
    const totalTools = tourSequence.length;
    const eyebrowFor = (slot: TourPhase) => {
      const i = tourSequence.indexOf(slot);
      return i === -1 ? `TOOL ? OF ${totalTools}` : `TOOL ${i + 1} OF ${totalTools}`;
    };
    const slideData: Record<string, { mascot: string; color: string; borderColor: string; bgColor: string; eyebrow: string; title: string; speech: string; visual: 'essay' | 'essay-deep-dive' | 'screenshot' | 'tools' | 'motivation' | 'citations' | 'games' }> = {
      'tour-essays': {
        mascot: '/mascot-paper.webp',
        color: '#A560E8',
        borderColor: '#8A48C7',
        bgColor: '#F3EAFF',
        eyebrow: eyebrowFor('tour-essays'),
        title: 'Our premium essay analyzer',
        speech: "We're not your average AI grader. Trained on thousands of graded papers. The feedback you get reads like a TA marked up your draft, not a chatbot. Everything you need to get a perfect grade.",
        visual: 'essay',
      },
      'tour-essays-2': {
        mascot: '/mascot-laptop.webp',
        color: '#A560E8',
        borderColor: '#8A48C7',
        bgColor: '#F3EAFF',
        eyebrow: eyebrowFor('tour-essays-2'),
        title: 'Comprehensive analysis',
        speech: "Overall verdict, top suggestions, strengths, areas to improve, and serious concerns. Every angle of your draft covered in plain English so you know exactly what to fix next.",
        visual: 'essay-deep-dive',
      },
      'tour-study': {
        mascot: '/mascot-juggling.webp',
        color: '#1CB0F6',
        borderColor: '#1899D6',
        bgColor: '#DDF4FF',
        eyebrow: eyebrowFor('tour-study'),
        title: 'Turn notes into study tools',
        speech: "One paste of your notes turns into flashcards, quizzes, lessons, and summaries. Watch them in action below!",
        visual: 'tools',
      },
      'tour-citations': {
        mascot: '/mascot-laptop.webp',
        color: '#FF9600',
        borderColor: '#D97F00',
        bgColor: '#FFF4E0',
        eyebrow: eyebrowFor('tour-citations'),
        title: 'Find real citations in seconds',
        speech: "Paste your topic and I'll pull real, formatted sources in APA, MLA, or Chicago — no more hunting through Google Scholar.",
        visual: 'citations',
      },
      'tour-games': {
        mascot: '/mascot-celebrating.webp',
        color: '#FF4B4B',
        borderColor: '#E04343',
        bgColor: '#FFE8E8',
        eyebrow: eyebrowFor('tour-games'),
        title: 'Study with arcade games',
        speech: "Crater Blast, Word Blitz, and Word Tower turn your notes into quick boss-battles — learning that actually feels like play.",
        visual: 'games',
      },
      'tour-motivation': {
        mascot: '/mascot-jumping-joy.webp',
        color: '#FF9600',
        borderColor: '#D97F00',
        bgColor: '#FFF4E0',
        eyebrow: eyebrowFor('tour-motivation'),
        title: 'Stay motivated with XP & levels',
        speech: "Earn XP for everything you do. Climb 100 levels, keep your streak alive, and collect 80+ badges along the way!",
        visual: 'motivation',
      },
    };

    const slide = slideData[phase];
    // Dynamic prev: walk one step back in the personalised sequence;
    // if at the start, return to the feature-interests survey.
    const prevPhase: Phase = tourIdx <= 0 ? 'survey-features' : tourSequence[tourIdx - 1];
    const prevMap: Record<string, Phase> = {
      [phase]: prevPhase,
    };

    return (
      <div className="h-screen bg-[#F7F7F7] dark:bg-stone-950 flex flex-col overflow-hidden">
        <TopBar showBack onBack={() => goToPhase(prevMap[phase])} />

        <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${phaseVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Essay tour pages need MUCH more horizontal room for the
              4-callout arrow layout. The games slide also widens on
              lg+ so the three Crater Blast / Word Blitz / Word Tower
              videos can sit side-by-side. Speech bubble + title each
              keep their own max-w-2xl wrapper below, so the wider
              outer container only affects the visual area. Other tour
              slides stay narrow. */}
          <div className={`px-4 sm:px-6 py-5 mx-auto ${(phase === 'tour-essays' || phase === 'tour-essays-2' || phase === 'tour-games') ? 'max-w-2xl lg:max-w-6xl xl:max-w-7xl' : 'max-w-2xl'}`}>
            {/* Mascot + speech bubble — centered in the original narrow
                container so the chat header looks the same as on other
                tour slides, even when the visual below is wider. */}
            <div className="flex items-start gap-3 mb-5 max-w-2xl mx-auto">
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

            {/* Title — left aligned, also centred-block in the narrow
                container so it lines up with the speech bubble. */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight mb-5 max-w-2xl mx-auto" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              {slide.title}
            </h1>

            {/* Visual preview */}
            <div>
              {slide.visual === 'essay' && (
                /* PAGE 1 — pitch. Why our Essay Analyzer is the best
                   in the world: stat badges + 4 interactive pillar
                   cards + social proof. Heavy on outcome language,
                   light on screenshots (those live on page 2). */
                <EssayPitchVisual color={slide.color} borderColor={slide.borderColor} />
              )}

              {slide.visual === 'essay-deep-dive' && (
                /* PAGE 2 — comprehensive analysis walkthrough.
                   Annotated /full-report.png with 4 arrow callouts
                   on desktop (stacked on mobile), capped off with a
                   colour key + B → A revision outcome card. */
                <EssayDeepDiveVisual color={slide.color} borderColor={slide.borderColor} />
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
                    // Flashcards + Quizzes — reuse the same compressed
                    // hero videos so the onboarding deck visually matches
                    // what the visitor saw on the landing page.
                    { name: 'Flashcards', video: '/hero-flashcards.mp4', color: '#A560E8', borderColor: '#8A48C7' },
                    { name: 'Quizzes', video: '/hero-quiz.mp4', color: '#58CC02', borderColor: '#46A302' },
                    // Crosswords replaced by Lessons. Uses the existing
                    // study-pack lesson PNG since we don't have a Lessons
                    // video; ToolMiniDemo renders it as a still image.
                    { name: 'Lessons', image: '/study-pack-previews/lesson-plan.png', color: '#FF9600', borderColor: '#D97F00' },
                    // Games — cycles through the three arcade games
                    // (Crater Blast → Word Blitz → Word Tower) by switching
                    // src on each video's `ended` event.
                    { name: 'Games', videos: ['/writescholar-crater-blast-demo.mp4', '/hero-word-blitz.mp4', '/hero-word-tower.mp4'], color: '#FF4B4B', borderColor: '#E04343' },
                  ].map((tool, i) => (
                    <ToolMiniDemo
                      key={tool.name}
                      name={tool.name}
                      video={tool.video}
                      videos={tool.videos}
                      image={tool.image}
                      color={tool.color}
                      borderColor={tool.borderColor}
                      delayMs={i * 80}
                    />
                  ))}
                </div>
              )}

              {slide.visual === 'citations' && (
                <div className="relative">
                  <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-30" style={{ backgroundColor: `${slide.color}40` }} aria-hidden />
                  <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 shadow-xl" style={{ borderColor: slide.borderColor }}>
                    <img src="/citations-preview.png" alt="Citations finder preview" className="w-full h-auto" loading="eager" />
                  </div>
                </div>
              )}

              {slide.visual === 'games' && (
                <>
                  {/* MOBILE / TABLET — single cycling tile. 3 tiles
                      side-by-side would be too narrow on a phone; the
                      cycling playlist (Crater Blast → Word Blitz →
                      Word Tower → loop) lets the user see all three
                      games in the same vertical footprint. */}
                  <div className="lg:hidden grid grid-cols-1 gap-3">
                    <ToolMiniDemo
                      name="Crater Blast · Word Blitz · Word Tower"
                      videos={['/writescholar-crater-blast-demo.mp4', '/hero-word-blitz.mp4', '/hero-word-tower.mp4']}
                      color="#FF4B4B"
                      borderColor="#E04343"
                    />
                  </div>

                  {/* DESKTOP — 3 individual videos side-by-side, one
                      per game. Each tile uses its own brand colour so
                      the three games read as distinct titles. The
                      outer container is widened on lg+ via the
                      `phase === 'tour-games'` exception above so
                      these tiles get real horizontal room. Stagger
                      the pop-in animation by 80ms per tile (matches
                      the rhythm used in the `tools` 2×2 grid). */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-4 xl:gap-5">
                    <ToolMiniDemo
                      name="Crater Blast"
                      video="/writescholar-crater-blast-demo.mp4"
                      color="#FF4B4B"
                      borderColor="#E04343"
                      delayMs={0}
                    />
                    <ToolMiniDemo
                      name="Word Blitz"
                      video="/hero-word-blitz.mp4"
                      color="#FF4B82"
                      borderColor="#D63672"
                      delayMs={80}
                    />
                    <ToolMiniDemo
                      name="Word Tower"
                      video="/hero-word-tower.mp4"
                      color="#FF9600"
                      borderColor="#D97F00"
                      delayMs={160}
                    />
                  </div>
                </>
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
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                  placeholder="alex_student"
                  disabled={!profileNameValid}
                  className={`w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-b-4 bg-[#F7F7F7] dark:bg-stone-800 focus:ring-0 focus:outline-none transition-all text-base font-extrabold text-[#3C3C3C] dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 ${
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
