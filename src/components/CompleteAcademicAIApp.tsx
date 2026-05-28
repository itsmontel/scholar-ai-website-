import { useState, useEffect, useLayoutEffect, Suspense, useRef, useCallback } from 'react';
import { WriteScholarEditorialBackgroundLayers } from './common/WriteScholarEditorialBackground';
import RandomMascotLoader from './common/RandomMascotLoader';
import { logger } from '../utils/logger';
// Static import: ensures gtag.ts loads at app mount so gtag.js script
// starts loading on first paint, not when a conversion fires. Eliminates
// the race condition where a conversion event could be queued in dataLayer
// but lost if the user navigated away before gtag.js finished loading.
import { trackSignupConversion, trackPaidConversion } from '../utils/gtag';
import { HIDE_FRIENDS, HIDE_STREAK_AND_BADGES } from '../config/featureFlags';
import { persistOnboardingToServer, persistTutorialToServer } from '../utils/onboarding';
import { trackEvent } from '../utils/analytics';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { LANDING_META_DESCRIPTION, LANDING_PAGE_TITLE } from '../constants/landingSeo';

// Eager: landing, login, signup (critical for first paint)
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';

// Lazy with retry: recovers from chunk load failures (idle tab / deploy), retries with backoff before failing
const ProgrammaticLandingPage = lazyWithRetry(() => import('./pages/ProgrammaticLandingPage'));
const EmbedPage = lazyWithRetry(() => import('./pages/EmbedPage'));
const PressKitPage = lazyWithRetry(() => import('./pages/PressKitPage'));
const EmailVerificationPage = lazyWithRetry(() => import('./pages/EmailVerificationPage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));
// Fullscreen "Welcome to WriteScholar!" celebration that replays the
// onboarding `transition` animation when the user lands on /dashboard
// after Stripe's hard redirect from the trial-checkout step.
const PostCheckoutWelcomeOverlay = lazyWithRetry(() => import('./common/PostCheckoutWelcomeOverlay'));
// Pre-signup Duolingo-style funnel — every "Sign up" CTA on the marketing
// pages now routes through this 6-screen flow before the signup form.
const AuthCallbackPage = lazyWithRetry(() => import('./pages/AuthCallbackPage'));
// DashboardPageNew (the old tool-grid dashboard) is retired — every
// tool now lives inside the Documents workspace. The file is kept on
// disk for reference/rollback but is no longer routed anywhere.
const DashboardPageLegacy = lazyWithRetry(() => import('./pages/DashboardPage'));
const AnalysisPage = lazyWithRetry(() => import('./pages/AnalysisPage'));
const AnalysisHistoryPage = lazyWithRetry(() => import('./pages/AnalysisHistoryPage'));
const CitationResultsPage = lazyWithRetry(() => import('./pages/CitationResultsPage'));
const CitationHistoryPage = lazyWithRetry(() => import('./pages/CitationHistoryPage'));
const QuizHistoryPage = lazyWithRetry(() => import('./pages/QuizHistoryPage'));
const FriendsPage = lazyWithRetry(() => import('./pages/FriendsPage'));
const UploadPage = lazyWithRetry(() => import('./pages/UploadPage'));
const AccountPage = lazyWithRetry(() => import('./pages/AccountPage'));
const PricingPage = lazyWithRetry(() => import('./pages/PricingPage'));
const FeaturesPage = lazyWithRetry(() => import('./pages/FeaturesPage'));
const AiEssayEditorPage = lazyWithRetry(() => import('./pages/AiEssayEditorPage'));
const FocusModePage = lazyWithRetry(() => import('./pages/FocusModePage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const LibraryPage = lazyWithRetry(() => import('./pages/LibraryPage'));
const FAQPage = lazyWithRetry(() => import('./pages/HelpCenterPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const WhyStudentsChoosePage = lazyWithRetry(() => import('./pages/WhyStudentsChoosePage'));
const StudyToolsComparisonPage = lazyWithRetry(() => import('./pages/StudyToolsComparisonPage'));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazyWithRetry(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazyWithRetry(() => import('./pages/TermsOfServicePage'));
const BillingPage = lazyWithRetry(() => import('./pages/BillingPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const UnsubscribePage = lazyWithRetry(() => import('./pages/UnsubscribePage'));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage'));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPostPage'));
const MoreToolsPage = lazyWithRetry(() => import('./pages/MoreToolsPage'));
const BadgesPage = lazyWithRetry(() => import('./pages/BadgesPage'));
const ShareFriendsPage = lazyWithRetry(() => import('./pages/ShareFriendsPage'));

const WordCounterPage = lazyWithRetry(() => import('./pages/tools/WordCounterPage'));
const CitationGeneratorToolPage = lazyWithRetry(() => import('./pages/tools/CitationGeneratorToolPage'));
const ReadabilityScorePage = lazyWithRetry(() => import('./pages/tools/ReadabilityScorePage'));
const ParaphrasingTipsPage = lazyWithRetry(() => import('./pages/tools/ParaphrasingTipsPage'));
const EssayOutlineGeneratorPage = lazyWithRetry(() => import('./pages/tools/EssayOutlineGeneratorPage'));
const TextCaseConverterPage = lazyWithRetry(() => import('./pages/tools/TextCaseConverterPage'));
const ThesisGeneratorPage = lazyWithRetry(() => import('./pages/tools/ThesisGeneratorPage'));
const GrammarCheckerPage = lazyWithRetry(() => import('./pages/tools/GrammarCheckerPage'));
const SummarizerPage = lazyWithRetry(() => import('./pages/tools/SummarizerPage'));
const QuizGeneratorPage = lazyWithRetry(() => import('./pages/tools/QuizGeneratorPage'));
const GPACalculatorPage = lazyWithRetry(() => import('./pages/tools/GPACalculatorPage'));
const PomodoroTimerPage = lazyWithRetry(() => import('./pages/tools/PomodoroTimerPage'));
const CalculatorPage = lazyWithRetry(() => import('./pages/tools/CalculatorPage'));
const ConverterPage = lazyWithRetry(() => import('./pages/tools/ConverterPage'));
const LightningReflexQuizPage = lazyWithRetry(() => import('./pages/tools/LightningReflexQuizPage'));
const WordTowerPage = lazyWithRetry(() => import('./pages/tools/WordTowerPage'));
const WordBlitzPage = lazyWithRetry(() => import('./games/word-blitz/WordBlitzPage'));
const GameLauncherPage = lazyWithRetry(() => import('./pages/GameLauncherPage'));
const CreateFlashcardsPage = lazyWithRetry(() => import('./pages/tools/CreateFlashcardsPage'));
const StudyPackViewerPage = lazyWithRetry(() => import('./pages/StudyPackViewerPage'));
const AnalyzeEssayPage = lazyWithRetry(() => import('./pages/AnalyzeEssayPage'));
const CitationsPage = lazyWithRetry(() => import('./pages/CitationsPage'));
const StudyPackPage = lazyWithRetry(() => import('./pages/StudyPackPage'));
const StudyPackHubPage = lazyWithRetry(() => import('./pages/StudyPackHubPage'));
const AnalyzeHubPage = lazyWithRetry(() => import('./pages/AnalyzeHubPage'));
const CitationsHubPage = lazyWithRetry(() => import('./pages/CitationsHubPage'));
const UnlockQuizPage = lazyWithRetry(() => import('./pages/UnlockQuizPage'));
// New "Write" tool — Word-style in-app editor (Phase 1: editor +
// autosave + DOCX import. Analyzer integration follows in Phase 2.)
const WritePage = lazyWithRetry(() => import('./write/WritePage'));
// Unified Documents hub — replaces Library + Upload + Write surfaces.
// Hub view lists every doc (uploaded OR written) with per-row Open /
// Analyze / Download / Delete actions; editor view reuses WriteEditor.
const DocumentsPage = lazyWithRetry(() => import('./documents/DocumentsPage'));

// Import common components
import ErrorBoundary from './common/ErrorBoundary';
import PageErrorBoundary from './common/PageErrorBoundary';
import Header from './common/Header';
import SoftPaywall from './common/SoftPaywall';
import StripeCancelTrialChoiceModal from './common/StripeCancelTrialChoiceModal';
import DashboardWelcomeToast from './common/DashboardWelcomeToast';
import DailyReviewReadyModal, {
  hasCompletedDailyReviewToday,
  markDailyReviewPromptShown,
  userHasStudyPacks,
  wasDailyReviewPromptShownToday,
} from './common/DailyReviewReadyModal';
import PaywallDebugPanel from './common/PaywallDebugPanel';
import {
  CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY,
  LAST_TUTORIAL_CHECKOUT_PLAN_KEY,
  MANDATORY_CHECKOUT_PENDING_KEY,
  ONBOARDING_COMPLETED_AT_KEY,
  POST_ACTIVATION_PAYWALL_PENDING_KEY,
  SOFT_PAYWALL_OPEN_KEY,
  SOFT_PAYWALL_DISMISSED_KEY,
  STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY,
  TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY,
  TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY,
  isTutorialCheckoutCancelModalResolved,
  isSoftPaywallOnCooldown,
  markSoftPaywallDismissedNow,
} from '../constants/paywallSession';
import BadgeNotificationToast from './common/BadgeNotificationToast';
import StudyTimerWidget from './common/StudyTimerWidget';
import MobileGoogleSignInPopup from './common/MobileGoogleSignInPopup';
import LoggedInWorkspaceLayout from './workspace/LoggedInWorkspaceLayout';
import { navigateWorkspaceView } from './workspace/workspaceNavigate';
import { shouldUseWorkspaceChromeApp } from './workspace/workspaceChrome';
import { getPageFromPath } from '../utils/appRouting';
import {
  absoluteCanonicalUrl,
  applyNoIndex,
  applyPageSeoTags,
  clearNoIndex,
  getCanonicalPathname,
  syncBrowserUrlToCanonical,
} from '../utils/seo';
import { ogImageUrlForPage } from '../utils/ogImageUrls';
import { getProgrammaticPageByPath } from '../data/programmaticPages';

/**
 * Pages that should never appear in Google's index — private user areas,
 * auth flows, history views, payment screens, embedded tool views.
 *
 * Mirrors the Disallow list in /public/robots.txt but applied per-route
 * via meta tags so the noindex sticks even if Google has already crawled
 * the URL through internal links.
 */
const NOINDEX_PAGES = new Set<string>([
  'embed', // /embed/* are iframe widgets; the host site's embedded version is what we want indexed
  'dashboard',
  'onboarding',
  'onboarding-test',
  'auth-callback',
  'email-verification',
  'reset-password',
  'login',
  'signup',
  'analysis',
  'analysis-history',
  'citation-results',
  'citation-history',
  'quiz-history',
  'upload',
  'account',
  'profile',
  'library',
  'billing',
  'badges',
  'study-pack-viewer',
  'unlock-quiz',
  'study-pack-hub',
  'analyze-hub',
  'citations-hub',
  'friends',
  'share-friends',
  'unsubscribe',
  'crossword-generator', // requires saved data — never an entry point
  'word-tower',          // game level launcher
  'word-blitz',
  'game-launcher-crater-blast',
  'game-launcher-word-tower',
]);

// Type definitions
interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: string;
  subscription_status?: string;
  email_verified?: boolean;
  onboardingCompleted?: boolean;
  welcomeTutorialCompleted?: boolean;
}

interface NavigationProps {
  onNavigate: (page: string) => void;
}


interface UserProps extends NavigationProps {
  user: User | null;
  onLogout?: () => void;
}

/** Sync session from localStorage on first paint so paywall / shell render match post-refresh state. */
function readCachedUserForSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed.id || !parsed.email) return null;
    return {
      ...parsed,
      plan: parsed.plan || 'free',
      onboardingCompleted: parsed?.onboardingCompleted === true,
      welcomeTutorialCompleted: parsed?.welcomeTutorialCompleted === true,
    } as User;
  } catch {
    return null;
  }
}

function readInitialAuthSession(): { isLoggedIn: boolean; user: User | null } {
  if (typeof window === 'undefined') return { isLoggedIn: false, user: null };
  const token = localStorage.getItem('authToken');
  if (!token) return { isLoggedIn: false, user: null };
  return { isLoggedIn: true, user: readCachedUserForSession() };
}

function readInitialSoftPaywallOpen(u: User | null): boolean {
  if (!u) return false;
  try {
    if (sessionStorage.getItem(SOFT_PAYWALL_OPEN_KEY) !== '1') return false;
    if (sessionStorage.getItem(SOFT_PAYWALL_DISMISSED_KEY) === '1') return false;
    // Weekly cooldown for free users — don't re-open if dismissed in
    // the last 7 days (persists across sessions / logins).
    if (isSoftPaywallOnCooldown()) return false;
    const plan = (u.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium') return false;
    return true;
  } catch {
    return false;
  }
}

const DAILY_REVIEW_PROMPT_EXCLUDED_PAGES = new Set([
  'login',
  'signup',
  'onboarding',
  'onboarding-test',
  'email-verification',
  'auth-callback',
  'reset-password',
  'embed',
  'unlock-quiz',
  'landing',
]);

// Main Application Component
const AcademicAIApp = () => {
  const initialAuth = readInitialAuthSession();
  const [currentPage, setCurrentPage] = useState(() =>
    typeof window !== 'undefined' ? getPageFromPath(window.location.pathname) : 'landing'
  );
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuth.isLoggedIn);
  const [user, setUser] = useState<User | null>(initialAuth.user);
  // True while the Documents workspace is in its full-screen editor.
  // Reported up by DocumentsPage; used to drop the global site header
  // so the editor gets the full viewport height. Initialised from the
  // path so a hard load of /documents/<id> hides the header with no
  // flash of the header on first paint.
  const [documentsEditorActive, setDocumentsEditorActive] = useState(
    () => typeof window !== 'undefined' && /^\/documents\/[\w-]+/.test(window.location.pathname)
  );
  const [studyPackInitialData, setStudyPackInitialData] = useState<{ data: any; title?: string } | null>(null);
  /** Opened when API returns upgrade/limit (403/429) so user can subscribe after canceling Stripe */
  const [apiLimitPaywallOpen, setApiLimitPaywallOpen] = useState(() => readInitialSoftPaywallOpen(initialAuth.user));
  /** After Stripe cancel from post-tutorial checkout: choice to retry trial or forfeit (restored after refresh until resolved) */
  const [stripeCancelTrialModalOpen, setStripeCancelTrialModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        sessionStorage.getItem(STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY) === '1' &&
        !isTutorialCheckoutCancelModalResolved()
      );
    } catch {
      return false;
    }
  });

  const resolveTutorialStripeCancelModal = useCallback(() => {
    setStripeCancelTrialModalOpen(false);
    try {
      sessionStorage.removeItem(STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY);
      localStorage.setItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY, '1');
      localStorage.removeItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Stale-while-revalidate: instant load from cache, then background fetch. Server overwrites when it arrives.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!token) return;
    setIsLoggedIn(true);
    // 1. Instant: hydrate from cache for immediate render
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser({
          ...parsed,
          onboardingCompleted: parsed?.onboardingCompleted === true,
          welcomeTutorialCompleted: parsed?.welcomeTutorialCompleted === true
        });
      } catch (_e) {}
    }
    // 2. Background: fetch /me, server overwrites cache
    (async () => {
      try {
        const { BulletproofAPI } = await import('../config/api');
        const res = await BulletproofAPI.get('/auth/me', token);
        if (res.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
          setCurrentPage('login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const u = data.data?.user;
          if (u?.email) {
            const fresh = {
              id: u.id,
              email: u.email,
              username: u.username,
              name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.email,
              plan: u.subscriptionPlan || 'free',
              subscription_status: u.subscriptionStatus,
              email_verified: u.emailVerified,
              onboardingCompleted: u.onboardingCompleted === true,
              welcomeTutorialCompleted: u.welcomeTutorialCompleted === true
            };
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
            // Path B paid-plan conversion firing — see backend SQL at
            // backend/sql/paid_conversion_tracking.sql for the design notes.
            // Backend computes paidConversionPending from
            // (paid plan) AND (active status) AND (no fired_at timestamp).
            // We fire the gtag event, then POST to mark the timestamp so
            // future /auth/me responses return false. Wrapped in a session
            // sentinel to prevent double-fires within the same browser tab
            // before the backend write round-trips.
            if (u.paidConversionPending && !sessionStorage.getItem('ws_paid_conversion_fired')) {
              sessionStorage.setItem('ws_paid_conversion_fired', '1');
              const planPrice = u.subscriptionPlan === 'premium' ? 39.99 : 19.99;
              // Pass the user email for Enhanced Conversions — recovers
              // attribution when the trial→paid event happens on a
              // different device or after cookies expired (trial→paid
              // sometimes happens a full week after the original ad
              // click, so cross-device is common here).
              void trackPaidConversion(planPrice, `${u.id}-paid`, u.email);
              void BulletproofAPI.post('/users/mark-paid-conversion-fired', token, {}).catch(() => {
                // Non-fatal — if the mark fails, paidConversionPending stays
                // true and we'll fire again on the next session, which is
                // dedup'd by Google Ads via the transaction_id we passed.
              });
            }
          }
        }
      } catch (_e) {
        // Network error: keep cached data if we had it; otherwise clear invalid session
        if (!userData) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
          setCurrentPage('login');
        }
      }
    })();
  }, []);

  // When crossword-generator redirects to dashboard (no saved data), update URL
  useEffect(() => {
    const path = window.location.pathname;
    if ((path === '/tools/crossword-generator' || path === '/crossword-generator') && currentPage === 'dashboard') {
      window.history.replaceState({}, '', '/dashboard');
    }
    // When friends are hidden, redirect /friends and /share-friends URLs to dashboard
    if (HIDE_FRIENDS && (path === '/friends' || path === '/share-friends') && currentPage === 'dashboard') {
      window.history.replaceState({}, '', '/dashboard');
    }
    if (HIDE_STREAK_AND_BADGES && (path === '/badges' || path === '/achievements') && currentPage === 'dashboard') {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [currentPage]);

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'documents', 'write', 'study-tools', 'analysis', 'analysis-history', 'citation-results', 'citation-history', 'quiz-history', 'friends', 'upload', 'profile', 'library', 'account', 'billing', 'badges'];

  // SEO: dynamic title, description, canonical, and OG/Twitter per page (SPA)
  const pageMeta: Record<
    string,
    { title: string; description: string; ogImage?: string; ogImageAlt?: string }
  > = {
    landing: { title: LANDING_PAGE_TITLE, description: LANDING_META_DESCRIPTION },
    analyze: { title: 'AI Essay Checker — Professor-Level Feedback in Seconds | WriteScholar', description: 'Paste or upload your paper for professor-level feedback on thesis, evidence, structure, and citations. Choose your education level for rubrics that match your course. Free to try.' },
    'ai-essay-editor': { title: 'AI Essay Grader & Editor — Grade & Fix Your Essay | WriteScholar', description: 'Write your essay in a real editor and get an estimated professor-style grade, a full rubric, and line-by-line fixes you apply in one click. Word in, Word out. Free to try.' },
    citations: { title: 'Citation Finder for College Papers — APA, MLA, Chicago | WriteScholar', description: 'Find peer-reviewed sources for research papers. Search by topic; export APA, MLA, Chicago, or Harvard citations. Built for bibliographies and lit reviews.' },
    'study-pack': { title: 'AI Study Pack — Lesson, Flashcards, Quiz, Crossword & More | WriteScholar', description: 'Turn notes into a lesson, flashcards, quiz, crossword, Crater Blast & Word Tower from one paste. Same study pack flow as the dashboard.' },
    features: { title: 'AI Essay Editor & Grader for College Students | WriteScholar', description: 'Write in a real editor and get a professor-style grade with a full rubric and one-click line-by-line fixes. Plus citations, summarizer, and study tools, one workspace.' },
    'focus-mode': { title: 'Focus Mode — Block Sites Until You Study (Chrome) | WriteScholar', description: 'Block TikTok, YouTube, and distracting sites until you answer questions from your own notes. Free: 3 sites; Pro: unlimited.' },
    pricing: { title: 'Pricing — Essay Analysis & Study Tools for Students | WriteScholar', description: 'Plans built for student budgets: free tier to try essay feedback and study packs, then Pro for heavier course loads. Compare to Quizlet Plus or textbook costs.' },
    about: { title: 'About WriteScholar | Study & Writing Help for Students', description: 'WriteScholar helps students improve drafts before deadlines: professor-style essay feedback, citations, quizzes, flashcards, and distraction blocking in one app.' },
    'why-students-choose': { title: 'WriteScholar vs Grammarly vs QuillBot for College Writing | 2026', description: 'Honest comparison: essay feedback and rubrics vs grammar-only tools. See which fits research papers and coursework.' },
    'study-tools-comparison': { title: 'WriteScholar vs Quizlet vs Knowt — College Study Tools | 2026', description: 'Why students add WriteScholar for essay feedback and rubrics, not just flashcards. Side-by-side features vs Quizlet and Knowt.' },
    'share-friends': { title: 'Study Together. Add Friends & Share Study Tools | WriteScholar', description: 'Add friends with your unique code and share flashcards, quizzes, crosswords and notes instantly. Delivers straight to their device, they just tap accept.' },
    help: { title: 'Help & FAQ — Essay Analyzer, Citations & Study Packs | WriteScholar', description: 'Help for essay analyzer, citation finder, study packs, and Focus Mode. Citation styles include APA, MLA, Chicago, Harvard.' },
    contact: { title: 'Contact WriteScholar | Support for Students', description: 'Reach WriteScholar for help with essay feedback, study tools, Focus Mode, or billing.' },
    privacy: { title: 'Privacy Policy | WriteScholar', description: 'WriteScholar privacy policy and data handling.' },
    terms: { title: 'Terms of Service | WriteScholar', description: 'WriteScholar terms of service.' },
    login: { title: 'Log In | WriteScholar', description: 'Log in for college essay feedback, study packs, summarizer, citations, and more.' },
    signup: { title: 'Sign Up Free | WriteScholar', description: 'Create a free account—essay feedback, summarizer, citations, and study tools for college coursework.' },
    blog: { title: 'College Study Tips & Writing Guides | WriteScholar Blog', description: 'Practical guides: essays, citations, study strategies, and academic writing—without the fluff.' },
    'word-counter': { title: 'Free Word Counter — Essays & College Papers | WriteScholar', description: 'Count words and characters for essays with page or word limits—syllabus-friendly. Free, instant, no signup.' },
    'citation-generator-tool': { title: 'Free Citation Generator — APA, MLA, Chicago (College) | WriteScholar', description: 'Format APA, MLA, Chicago, and Harvard citations for books, journals, and websites—ready for research papers.' },
    'readability-score': { title: 'Free Readability Checker — College-Level Writing | WriteScholar', description: 'Flesch-Kincaid and grade-level scores so you can tune essays for college audiences and assignment expectations.' },
    'paraphrasing-tips': { title: 'Paraphrasing Tips — Academic Writing for College | WriteScholar', description: 'Spot overused words and wordy sentences before you submit. Free writing helper.' },
    'essay-outline': { title: 'Free Essay Outline Generator — College Papers | WriteScholar', description: 'Structured outlines for argumentative, research, and compare-contrast papers—common undergraduate formats.' },
    'text-case-converter': { title: 'Free Text Case Converter – UPPERCASE, lowercase, Title Case | WriteScholar', description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, and more. Perfect for formatting titles, headings, and fixing caps lock mistakes.' },
    'thesis-generator': { title: 'Thesis Statement Generator — College Essays | WriteScholar', description: 'Draft strong thesis statements for argumentative and analytical essays—starter lines you can refine for your professor.' },
    'grammar-checker': { title: 'Free Grammar Checker — Papers & Assignments | WriteScholar', description: 'Catch spelling and grammar issues in drafts before submission. Quick check for assignments.' },
    'summarizer': { title: 'AI Summarizer — Research Papers & Textbook Chapters | WriteScholar', description: 'Turn long readings into key points for exams and discussion posts. Free to try.' },
    'quiz-generator': { title: 'AI Quiz Generator from Notes — College Exam Prep | WriteScholar', description: 'Build practice quizzes from lecture notes or readings—MCQ, true/false, and fill-in. Strong supplement to flashcards for exams.' },
    'create-flashcards': { title: 'Flashcards & Deck Builder — College Study | WriteScholar', description: 'Create decks or generate flashcards from notes with Study Pack. Fast exam prep.' },
    'crossword-generator': { title: 'AI Crossword Generator — Study Tool | WriteScholar', description: 'Turn notes into crossword puzzles for memorization. Unique mode beyond basic flashcards. Pro feature.' },
    'quiz-history': { title: 'Saved Materials | WriteScholar', description: 'View and retake your saved quizzes, flashcards, and crosswords. Study materials are stored for 30 days.' },
    'gpa-calculator': { title: 'Free GPA Calculator — College & University Grades | WriteScholar', description: 'Compute semester and cumulative GPA with credits and letter grades—including common 4.0-style scales. No signup.' },
    'pomodoro-timer': { title: 'Free Pomodoro Timer — Library & Dorm Study Sessions | WriteScholar', description: 'Focus blocks and breaks for long study sessions. Free, no signup.' },
    'calculator': { title: 'Free Scientific Calculator — STEM Homework | WriteScholar', description: 'Trig, logs, and powers for calculus, physics, and chemistry homework—free online scientific calculator.' },
    'converter': { title: 'Free Unit Converter — STEM & Lab Units | WriteScholar', description: 'Convert SI and imperial units for problem sets and labs—length, temperature, speed, and more.' },
    'crater-blast': { title: 'Crater Blast — AI Quiz Game | WriteScholar', description: 'Blast the correct answer before it lands! AI-powered quiz game to reinforce what you studied.' },
    'word-tower': { title: 'Word Tower — AI Stacking Study Game | WriteScholar', description: 'Word Tower — the AI-powered stacking study game. Catch correct answers, dodge wrong ones, and build the tallest tower before it falls.' },
    'word-blitz': { title: 'Word Blitz — 60-Second Fill-in-the-Blank Speedrun | WriteScholar', description: 'Word Blitz — the 60-second AI-powered fill-in-the-blank speedrun. Read the sentence, tap the right word. How many can you get in a minute?' },
    'game-launcher-crater-blast': { title: 'Crater Blast — Choose Study Packs | WriteScholar', description: 'Pick which study packs to combine into one Crater Blast game session.' },
    'game-launcher-word-tower': { title: 'Word Tower — Choose Study Packs | WriteScholar', description: 'Pick which study packs to combine into one Word Tower game session.' },
    'more-tools': { title: 'More Free Tools for College Students | WriteScholar', description: 'Summarizer, word counter, citation generator, GPA calculator, essay outline, thesis helper, grammar check, and more—all in one place.' },
    'badges': { title: 'Achievements & Badges | WriteScholar', description: 'Collect badges, earn XP, and level up your scholar journey. Unlock cute monster companions by using WriteScholar tools.' },
    'friends': { title: 'Friends | WriteScholar', description: 'Connect with friends to share quizzes, flashcards, and crosswords. Add friends by code and collaborate on studying.' },
    dashboard: { title: 'Dashboard — Essay Feedback & Study Tools | WriteScholar', description: 'Your home for college essay analysis, study packs, citations, and Focus Mode—built for students balancing multiple courses.' },
  };
  useLayoutEffect(() => {
    syncBrowserUrlToCanonical();
  }, []);

  useEffect(() => {
    const meta = pageMeta[currentPage];
    if (meta) {
      const canonicalUrl = absoluteCanonicalUrl(getCanonicalPathname(window.location.pathname));
      applyPageSeoTags({
        title: meta.title,
        description: meta.description,
        canonicalUrl,
        ogImage: meta.ogImage ?? ogImageUrlForPage(currentPage),
        ogImageAlt: meta.ogImageAlt,
      });
    }
    // Apply noindex on private routes; reset to indexable on every public route
    // so we never leak a stale noindex tag set by a previous private page.
    if (NOINDEX_PAGES.has(currentPage)) {
      applyNoIndex();
    } else {
      clearNoIndex();
    }
  }, [currentPage]);

  // Validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    try {
      logger.log('Validating token...');
      const token = localStorage.getItem('authToken');
      if (!token) {
        logger.log('No token found, skipping validation');
        return;
      }

      // Use bulletproof API for token validation
      const { BulletproofAPI } = await import('../config/api');
      const response = await BulletproofAPI.get('/auth/me', token);

      logger.log('Token validation response status:', response.status);
      if (response.status === 401) {
        // Token expired, try to refresh
        logger.log('Token expired, attempting refresh...');
        const refreshResponse = await BulletproofAPI.post('/auth/refresh', {}, token);

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('authToken', refreshData.data.token);
          window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
          logger.log('Token refreshed successfully');
          
          // After successful refresh, get updated user data
          const userResponse = await BulletproofAPI.get('/auth/me', refreshData.data.token);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.data?.achievements) {
              const { mergeFromServer } = await import('../data/achievements');
              mergeFromServer(
                userData.data.achievements.stats || {},
                userData.data.achievements.unlockedBadges || {}
              );
            }
            if (userData.data && userData.data.user && userData.data.user.email) {
              const u = userData.data.user;
              const updatedUser = {
                id: u.id,
                email: u.email,
                username: u.username,
                name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                plan: u.subscriptionPlan || 'free',
                subscription_status: u.subscriptionStatus,
                email_verified: u.emailVerified,
                onboardingCompleted: u.onboardingCompleted === true,
                welcomeTutorialCompleted: u.welcomeTutorialCompleted === true
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              logger.log('User data updated after token refresh:', updatedUser);
            } else {
              logger.log('Invalid user data after token refresh, keeping existing user data');
            }
          }
        } else {
          // Refresh failed - but DON'T clear auth state immediately
          // Keep user logged in with cached data for better UX
          logger.log('Token refresh failed, but keeping user logged in with cached data');
          
          // Only clear if we're on a protected route and have no cached user data
          const cachedUser = localStorage.getItem('user');
          if (!cachedUser && protectedRoutes.includes(currentPage)) {
            logger.log('No cached user data and on protected route, clearing auth state');
            setIsLoggedIn(false);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setCurrentPage('login');
          }
        }
      } else if (response.ok) {
        const userData = await response.json();
        // Sync achievements from server (cross-device)
        if (userData.data?.achievements) {
          const { mergeFromServer } = await import('../data/achievements');
          mergeFromServer(
            userData.data.achievements.stats || {},
            userData.data.achievements.unlockedBadges || {}
          );
        }
        // Update user data from server
        if (userData.data && userData.data.user && userData.data.user.email) {
          const u = userData.data.user;
          const updatedUser = {
            id: u.id,
            email: u.email,
            username: u.username,
            name: (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name) || u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            plan: u.subscriptionPlan || 'free',
            subscription_status: u.subscriptionStatus,
            email_verified: u.emailVerified,
            onboardingCompleted: u.onboardingCompleted === true,
            welcomeTutorialCompleted: u.welcomeTutorialCompleted === true
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          logger.log('User data updated from /auth/me:', updatedUser);
        } else {
          logger.log('Invalid user data from /auth/me, keeping existing user data');
        }
        logger.log('Token is valid, user data updated');
      } else {
        // Other error status - keep user logged in with cached data
        logger.log('Server error during validation, keeping user logged in with cached data');
      }
    } catch (error) {
      logger.error('Token validation error:', error);
      // On network error, always keep the user logged in locally
      // They can still browse with cached data
      logger.log('Network error during validation, keeping user logged in with cached data');
    }
  };

  const validateAndRefreshTokenRef = useRef(validateAndRefreshToken);
  validateAndRefreshTokenRef.current = validateAndRefreshToken;

  // Stripe return URLs: strip query; tutorial checkout cancel may open trial forfeit modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pay = params.get('payment');
    if (pay === 'success' || pay === 'cancelled') {
      if (pay === 'success') {
        try {
          sessionStorage.removeItem(MANDATORY_CHECKOUT_PENDING_KEY);
          sessionStorage.removeItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY);
          sessionStorage.removeItem(LAST_TUTORIAL_CHECKOUT_PLAN_KEY);
          sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
          sessionStorage.removeItem(POST_ACTIVATION_PAYWALL_PENDING_KEY);
          sessionStorage.removeItem(STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY);
        } catch {
          /* ignore */
        }
      }
      if (pay === 'cancelled') {
        try {
          const fromTutorialPaywall = sessionStorage.getItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY) === '1';
          sessionStorage.removeItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY);
          sessionStorage.removeItem(LAST_TUTORIAL_CHECKOUT_PLAN_KEY);
          if (fromTutorialPaywall && !isTutorialCheckoutCancelModalResolved()) {
            sessionStorage.setItem(STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY, '1');
            setStripeCancelTrialModalOpen(true);
          }
        } catch {
          /* ignore */
        }
      }
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const onOpenPaywall = () => {
      // [soft-paywall-debug] Temporary trace — see comment at
      // handleOnboardingComplete dispatch site.
      console.log('[soft-paywall] listener invoked');
      try {
        // If user already dismissed the soft paywall this session, don't re-open it
        if (sessionStorage.getItem(SOFT_PAYWALL_DISMISSED_KEY) === '1') {
          console.log('[soft-paywall] silent: SOFT_PAYWALL_DISMISSED_KEY=1 (dismissed this session)');
          return;
        }
        // Weekly cooldown — silent if dismissed within the last 7 days.
        if (isSoftPaywallOnCooldown()) {
          console.log('[soft-paywall] silent: weekly cooldown active (clear localStorage.writescholar_soft_paywall_dismissed_at to reset)');
          return;
        }
        sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1');
      } catch {
        /* ignore */
      }
      console.log('[soft-paywall] setApiLimitPaywallOpen(true) — paywall should now render');
      setApiLimitPaywallOpen(true);
      trackEvent('paywall_view', { trigger: 'api_limit_or_upgrade' });
    };
    window.addEventListener('writescholar-open-paywall', onOpenPaywall);
    return () => window.removeEventListener('writescholar-open-paywall', onOpenPaywall);
  }, []);

  /** Restore soft paywall after refresh if user is still on Free and did not dismiss */
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const plan = (user.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium') return;
    try {
      // Don't restore if user already dismissed the paywall this session
      if (sessionStorage.getItem(SOFT_PAYWALL_DISMISSED_KEY) === '1') return;
      // Weekly cooldown — quiet for 7 days after the last dismissal.
      if (isSoftPaywallOnCooldown()) return;
      if (sessionStorage.getItem(SOFT_PAYWALL_OPEN_KEY) === '1') {
        setApiLimitPaywallOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, user?.id, user?.plan]);

  // Paid plan — close API paywall prompt
  useEffect(() => {
    if (!user) return;
    const plan = (user.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium') {
      setApiLimitPaywallOpen(false);
      try {
        sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [user?.plan]);

  // Handle URL-based routing (sync on popstate, re-run when isLoggedIn/user changes for redirect)
  useEffect(() => {
    const path = window.location.pathname;
    const initialPage = getPageFromPath(path);
    
    // Only redirect landing → dashboard if user has completed onboarding.
    // Users who haven't completed onboarding can browse the landing page and other public pages.
    if (isLoggedIn && initialPage === 'landing' && user?.onboardingCompleted) {
      setCurrentPage('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    } else {
      setCurrentPage(initialPage);
    }
    
    // Listen for browser back/forward button
    const handlePopState = () => {
      syncBrowserUrlToCanonical();
      const newPath = window.location.pathname;
      const newPage = getPageFromPath(newPath);
      logger.log('Browser navigation detected, changing page to:', newPage);
      setCurrentPage(newPage);
      
      // Restore user data from localStorage when navigating back/forward
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('user');
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setIsLoggedIn(true);
          setUser(userData);
          logger.log('User data restored on navigation:', userData);
        } catch (error) {
          logger.error('Error restoring user data:', error);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn, user?.onboardingCompleted]);

  // Redirect landing → dashboard only when logged in AND onboarding is complete
  useEffect(() => {
    if (isLoggedIn && currentPage === 'landing' && user?.onboardingCompleted) {
      logger.log('User logged in with onboarding complete, redirecting from landing to dashboard');
      setCurrentPage('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [isLoggedIn, currentPage, user?.onboardingCompleted]);

  // Sync user data from localStorage when it changes (e.g., from another tab or after login)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          logger.log('Syncing user data from storage change:', parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
        } catch (error) {
          logger.error('Error syncing user data:', error);
        }
      } else if (!token) {
        // If token is removed, log out
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Run once on mount

  // Set up periodic token refresh for logged-in users
  useEffect(() => {
    if (isLoggedIn) {
      // Refresh token every 6 hours (6 * 60 * 60 * 1000 ms) when user is logged in on any page
      const refreshInterval = setInterval(() => {
        validateAndRefreshToken();
      }, 6 * 60 * 60 * 1000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [isLoggedIn]);

  // When the tab was in the background for a while, refresh the session as soon as the user returns
  useEffect(() => {
    if (!isLoggedIn) return;
    let debounce: ReturnType<typeof setTimeout>;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        logger.log('Tab visible again — validating / refreshing session');
        void validateAndRefreshTokenRef.current();
      }, 1200);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(debounce);
    };
  }, [isLoggedIn]);

  // Global: 401 refresh + 403/429 → paywall when API signals upgrade / limit
  useEffect(() => {
    const originalFetch = window.fetch;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const maybeDispatchPaywall = (response: Response) => {
      if (!isLoggedIn || (response.status !== 403 && response.status !== 429)) return;
      void response
        .clone()
        .json()
        .then((data: Record<string, unknown>) => {
          const open =
            data?.upgrade === true ||
            data?.upgradeRequired === true ||
            data?.showPaywall === true ||
            (response.status === 403 &&
              data?.usage &&
              typeof (data.usage as { limit?: unknown }).limit === 'number');
          if (open) {
            window.dispatchEvent(new CustomEvent('writescholar-open-paywall'));
          }
        })
        .catch(() => {
          /* not JSON */
        });
    };

    window.fetch = async (...args) => {
      let response = await originalFetch(...args);

      // If we get a 401 and we're logged in, try to refresh token (on any page)
      if (response.status === 401 && isLoggedIn) {
        try {
          const refreshResponse = await originalFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({}),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('authToken', refreshData.data.token);
            window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
            logger.log('Token refreshed automatically');

            // Retry the original request with new token
            response = await originalFetch(...args);
          } else {
            // Refresh failed - but DON'T clear auth state automatically
            // Let the user continue with cached data
            logger.log('Auto-refresh failed, but keeping user logged in with cached data');

            // Only clear auth if we're on a protected route and have no cached user
            const cachedUser = localStorage.getItem('user');
            if (!cachedUser && protectedRoutes.includes(currentPage)) {
              logger.log('No cached user data on protected route, clearing auth state');
              setIsLoggedIn(false);
              setUser(null);
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setCurrentPage('login');
            }
          }
        } catch (error) {
          logger.error('Auto-refresh failed:', error);
          // Don't logout on network errors - keep user logged in with cached data
          logger.log('Network error during auto-refresh, keeping user logged in');
        }
      }

      const reqUrl =
        typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      if (reqUrl.startsWith(apiBase) && !reqUrl.includes('/auth/')) {
        maybeDispatchPaywall(response);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isLoggedIn, currentPage]);

  // Navigation function (slug optional for blog posts)
  // Canonical URL map – pages whose URL differs from /${page}
  const pageUrlMap: Record<string, string> = {
    landing: '/',
    summarizer: '/tools/summarizer',
    'quiz-generator': '/tools/quiz-generator',
    'create-flashcards': '/tools/create-flashcards',
    'crossword-generator': '/tools/crossword-generator',
    'word-counter': '/tools/word-counter',
    'citation-generator-tool': '/tools/citation-generator',
    'readability-score': '/tools/readability-score',
    'paraphrasing-tips': '/tools/paraphrasing-tips',
    'essay-outline': '/tools/essay-outline',
    'text-case-converter': '/tools/text-case-converter',
    'thesis-generator': '/tools/thesis-generator',
    'grammar-checker': '/tools/grammar-checker',
    'gpa-calculator': '/tools/gpa-calculator',
    'pomodoro-timer': '/tools/pomodoro-timer',
    'crater-blast': '/tools/crater-blast',
    'word-tower': '/tools/word-tower',
    'word-blitz': '/word-blitz',
    'game-launcher-crater-blast': '/games/crater-blast-launcher',
    'game-launcher-word-tower': '/games/word-tower-launcher',
    'study-pack-viewer': '/study-pack-viewer',
    'analyze': '/tools/analyze',
    'citations': '/tools/citations',
    'study-pack': '/tools/study-pack',
    'study-pack-hub': '/study-packs',
    'analyze-hub': '/papers',
    'citations-hub': '/citations-hub',
    'more-tools': '/more-tools',
    'badges': '/badges',
    'why-students-choose': '/why-students-choose',
    'study-tools-comparison': '/vs-quizlet-knowt',
    'study-tools': '/study-tools',
    'ai-essay-editor': '/ai-essay-editor',
  };

  const navigateTo = (page: string, slug?: string, options?: { quizHistoryFilter?: 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast'; studyPack?: { data: any; title?: string }; unlockQuizQuery?: string }) => {
    // Programmatic SEO routes — caller passes a URL path like "/study/biology"
    // instead of a page name. Map it to the 'programmatic' page; the
    // ProgrammaticLandingPage component looks up the config by URL pathname.
    if (page.startsWith('/study/') || page.startsWith('/alternatives/') || page.startsWith('/guides/') || page.startsWith('/best/')) {
      setCurrentPage('programmatic');
      window.history.pushState({}, '', page);
      window.scrollTo(0, 0);
      return;
    }
    if (HIDE_STREAK_AND_BADGES && page === 'badges') {
      setCurrentPage('dashboard');
      window.history.pushState({}, '', '/dashboard');
      window.scrollTo(0, 0);
      return;
    }
    if (page !== 'study-pack-viewer') setStudyPackInitialData(null);
    if (page === 'study-pack-viewer' && options?.studyPack) setStudyPackInitialData(options.studyPack);
    setCurrentPage(page);
    // Update URL to canonical form
    if (page === 'blog-post' && slug) {
      window.history.pushState({}, '', `/blog/${slug}`);
    } else if (page === 'documents' && slug) {
      // Open a specific document straight into the editor view
      // (used when closing the full report — return to the paper).
      window.history.pushState({}, '', `/documents/${slug}`);
    } else if (page === 'quiz-history' && options?.quizHistoryFilter) {
      window.history.pushState({}, '', `/quiz-history?filter=${options.quizHistoryFilter}`);
    } else if (page === 'unlock-quiz' && options?.unlockQuizQuery) {
      window.history.pushState({}, '', `/unlock-quiz${options.unlockQuizQuery}`);
    } else if (pageUrlMap[page]) {
      window.history.pushState({}, '', pageUrlMap[page]);
    } else {
      window.history.pushState({}, '', `/${page}`);
    }
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
    
    // Ensure user data is restored on navigation
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData && !user) {
      try {
        const parsedUser = JSON.parse(userData);
        logger.log('Restoring user data on navigation:', parsedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
      } catch (error) {
        logger.error('Error restoring user on navigation:', error);
      }
    }
  };

  // Authentication handlers
  const handleSignUp = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
    void import('../utils/analytics').then((m) =>
      m.identifyUser(userData.id, { email: userData.email, signup: true })
    );
    // Google Ads signup conversion + Enhanced Conversions. Email is
    // SHA-256 hashed inside the helper before leaving the browser, so
    // Google can match this signup back to an ad click on a different
    // device / after cookie loss / on iOS Safari. Helper returns a
    // promise that resolves once the hash is computed — fire-and-forget
    // is fine since the gtag dataLayer queues the event regardless.
    void trackSignupConversion(userData.email);
  };

  const handleLogin = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
    void import('../utils/analytics').then((m) =>
      m.identifyUser(userData.id, { email: userData.email })
    );
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    void import('../utils/analytics').then((m) => m.resetAnalytics());
    setCurrentPage('landing');
    setApiLimitPaywallOpen(false);
    try {
      sessionStorage.removeItem(MANDATORY_CHECKOUT_PENDING_KEY);
      sessionStorage.removeItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY);
      sessionStorage.removeItem(LAST_TUTORIAL_CHECKOUT_PLAN_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_DISMISSED_KEY);
      sessionStorage.removeItem(POST_ACTIVATION_PAYWALL_PENDING_KEY);
      sessionStorage.removeItem(STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY);
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY);
      localStorage.removeItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
  };

  const handleOnboardingComplete = async (destination: string) => {
    trackEvent('onboarding_complete');
    if (user?.id) {
      await Promise.all([persistOnboardingToServer(), persistTutorialToServer()]);
      const updatedUser = { ...user, onboardingCompleted: true, welcomeTutorialCompleted: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    // Stamp the moment onboarding completed. The dashboard uses this to
    // decide when to fire the first soft paywall — either when the user
    // creates their first analysis / study pack, or, as a fallback, 7
    // days after this timestamp. No paywall dispatch here.
    try {
      if (!localStorage.getItem(ONBOARDING_COMPLETED_AT_KEY)) {
        localStorage.setItem(ONBOARDING_COMPLETED_AT_KEY, String(Date.now()));
      }
    } catch {
      /* ignore */
    }

    navigateTo(destination);
  };

  const handleOnboardingUserUpdate = useCallback(
    (updates: {
      name?: string;
      username?: string;
      plan?: string;
      subscription_status?: string;
    }) => {
      setUser((prev) => {
        if (!prev) return prev;
        if (
          updates.name === undefined &&
          updates.username === undefined &&
          updates.plan === undefined &&
          updates.subscription_status === undefined
        ) {
          return prev;
        }
        const updatedUser = {
          ...prev,
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.username !== undefined && { username: updates.username }),
          ...(updates.plan !== undefined && { plan: updates.plan }),
          ...(updates.subscription_status !== undefined && {
            subscription_status: updates.subscription_status,
          }),
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    },
    []
  );

  const renderOnboarding = (destination: string) => {
    return (
      <OnboardingPage
        onNavigate={navigateTo}
        user={user}
        onLogout={handleLogout}
        onUserUpdate={handleOnboardingUserUpdate}
        onComplete={() => handleOnboardingComplete(destination)}
      />
    );
  };

  // Stripe (and other checkout flows) redirect users to
  // `/dashboard?payment=success` after a successful trial start. At
  // that point the SPA hasn't yet learned that onboardingCompleted
  // flipped to true on the server, so the cached `user` object still
  // has it as false — which would normally re-trigger the
  // `needsOnboarding` bounce below and send the user straight back to
  // onboarding.
  //
  // Captured ONCE on mount as state — the URL-strip effect at ~line
  // 704 wipes `?payment=success` right after the first render, so
  // reading `window.location.search` on every render would flip this
  // back to false after the strip and re-arm the bounce. The state
  // flag stays true for the lifetime of the SPA so the routing layer
  // keeps treating them as onboarded until the effect below catches
  // up the cached user object.
  const [sawStripeSuccessOnLoad] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('payment') === 'success';
  });
  // Drives the fullscreen welcome-celebration overlay. Seeded from
  // sawStripeSuccessOnLoad and flipped off when the animation finishes.
  const [showPostCheckoutWelcome, setShowPostCheckoutWelcome] = useState<boolean>(sawStripeSuccessOnLoad);
  const [showDailyReviewPrompt, setShowDailyReviewPrompt] = useState(false);

  const needsOnboarding =
    isLoggedIn && user?.id && !user.onboardingCompleted && !sawStripeSuccessOnLoad;

  /* ─── Post-Stripe-success recovery ───
     When Stripe-hosted Checkout redirects to /dashboard?payment=success
     after the user enters their card, refresh /auth/me so the cached
     user picks up subscription_plan='pro' and subscription_status=
     'trialing' that the `customer.subscription.created` webhook just
     wrote to Supabase. The webhook also sets onboarding_completed=true
     in the same UPDATE, so the routing layer stops bouncing this user
     to /onboarding on the next render. */
  const syncStripeSubscriptionRanRef = useRef(false);
  useEffect(() => {
    if (!sawStripeSuccessOnLoad) return;
    if (!isLoggedIn || !user?.id) return;
    if (syncStripeSubscriptionRanRef.current) return;
    syncStripeSubscriptionRanRef.current = true;

    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const { BulletproofAPI } = await import('../config/api');
        const meRes = await BulletproofAPI.get('/auth/me', token);
        if (!meRes || !meRes.ok) return;
        const meData = await meRes.json().catch(() => null);
        const u = meData?.data?.user;
        if (!u || !u.email) return;
        const refreshed = {
          id: u.id,
          email: u.email,
          username: u.username,
          name: u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) || u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          plan: u.subscriptionPlan || 'free',
          subscription_status: u.subscriptionStatus,
          email_verified: u.emailVerified,
          onboardingCompleted: u.onboardingCompleted === true,
          welcomeTutorialCompleted: u.welcomeTutorialCompleted === true,
        };
        setUser(refreshed);
        try { localStorage.setItem('user', JSON.stringify(refreshed)); } catch { /* ignore */ }
        try {
          if (!localStorage.getItem(ONBOARDING_COMPLETED_AT_KEY)) {
            localStorage.setItem(ONBOARDING_COMPLETED_AT_KEY, String(Date.now()));
          }
        } catch { /* ignore */ }
      } catch (e) {
        console.warn('Post-Stripe /auth/me refresh failed (non-fatal):', e);
      }
    })();
  }, [sawStripeSuccessOnLoad, isLoggedIn, user?.id]);

  /** Once per day — nudge logged-in users that their daily review is ready. */
  useEffect(() => {
    if (!isLoggedIn || !user?.id || !user.onboardingCompleted) {
      setShowDailyReviewPrompt(false);
      return;
    }
    if (showPostCheckoutWelcome || apiLimitPaywallOpen || stripeCancelTrialModalOpen) {
      setShowDailyReviewPrompt(false);
      return;
    }
    if (DAILY_REVIEW_PROMPT_EXCLUDED_PAGES.has(currentPage)) {
      setShowDailyReviewPrompt(false);
      return;
    }
    if (hasCompletedDailyReviewToday(user.id) || wasDailyReviewPromptShownToday(user.id)) {
      setShowDailyReviewPrompt(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        if (cancelled || !user?.id || hasCompletedDailyReviewToday(user.id)) return;

        const hasPacks = await userHasStudyPacks();
        if (cancelled || !hasPacks) return;

        markDailyReviewPromptShown(user.id);
        setShowDailyReviewPrompt(true);
      })();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isLoggedIn,
    user?.id,
    user?.onboardingCompleted,
    showPostCheckoutWelcome,
    apiLimitPaywallOpen,
    stripeCancelTrialModalOpen,
    currentPage,
  ]);

  const handleDailyReviewPromptStart = useCallback(() => {
    setShowDailyReviewPrompt(false);
    navigateWorkspaceView(navigateTo, 'daily-review');
  }, [navigateTo]);

  const handleDailyReviewPromptDismiss = useCallback(() => {
    setShowDailyReviewPrompt(false);
  }, []);

  const handleDashboardUserUpdate = (u: { welcomeTutorialCompleted?: boolean }) => {
    if (user && u.welcomeTutorialCompleted) {
      const updated = { ...user, welcomeTutorialCompleted: true };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const renderCurrentPage = () => {
    if (protectedRoutes.includes(currentPage) && !isLoggedIn) {
      return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
    }
    // No cache + fetch in progress: brief loading (cache usually exists for instant render)
    if (isLoggedIn && !user && protectedRoutes.includes(currentPage)) {
      return (
        <div className="relative isolate min-h-screen min-h-[100dvh] flex items-center justify-center overflow-x-clip">
          <WriteScholarEditorialBackgroundLayers position="fixed" />
          <div className="relative z-10">
            <RandomMascotLoader size={140} />
          </div>
        </div>
      );
    }

    // The flagship workspace — "Documents IS the dashboard". Shared
    // by /dashboard, /documents(/:id), and the legacy library/upload/
    // write routes so there's one mental model + one render path.
    const renderDocumentsWorkspace = () => {
      const m = typeof window !== 'undefined' ? window.location.pathname.match(/^\/documents\/([\w-]+)/) : null;
      const initialDocumentId = m ? m[1] : undefined;
      return (
        <div className="min-h-screen bg-[#FAF7FF] dark:bg-stone-950">
          {/* The global site Header is intentionally NOT rendered for
              the Documents workspace. Logged-in users live in this
              page all day — the left workspace sidebar already covers
              navigation, and DocumentsPage renders its own slim
              top-right `DashboardTopBar` (Upgrade · Feedback ·
              Pomodoro · Avatar) so the workspace gets the full
              viewport height with no duplicate chrome. */}
          <DocumentsPage
            initialDocumentId={initialDocumentId}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            user={user}
            onEditorActiveChange={setDocumentsEditorActive}
          />
        </div>
      );
    };

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} user={user} />;
      case 'embed':
        // Standalone embed widget — no header/footer, noindex. Lookup happens
        // inside EmbedPage based on URL pathname.
        return <EmbedPage />;
      case 'press':
        return <PressKitPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'programmatic': {
        // Look up the matching programmatic page by current URL.
        // Falls back to landing if no match (e.g. /study/unknown-subject).
        const config = getProgrammaticPageByPath(window.location.pathname);
        if (!config) return <LandingPage onNavigate={navigateTo} user={user} />;
        return <ProgrammaticLandingPage config={config} onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      }
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleSignUp} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'reset-password':
        return <ResetPasswordPage onNavigate={navigateTo} />;
      case 'email-verification':
        return <EmailVerificationPage onNavigate={navigateTo} />;
      case 'onboarding':
        if (!isLoggedIn) {
          return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
        }
        return renderOnboarding('dashboard');
      case 'onboarding-test':
        // Preview the onboarding flow on demand. testMode skips every
        // API call; onComplete returns to the dashboard. Available to
        // anyone who knows the URL (linked from the Account page).
        return (
          <OnboardingPage
            onNavigate={navigateTo}
            user={user}
            onLogout={handleLogout}
            onUserUpdate={handleOnboardingUserUpdate}
            onComplete={() => navigateTo('dashboard')}
            testMode
          />
        );
      case 'auth-callback':
        return <AuthCallbackPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'pricing':
        return <PricingPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'features':
        return <FeaturesPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'ai-essay-editor':
        return <AiEssayEditorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'focus-mode': {
        const plan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
        const isPaidFocus = plan === 'pro' || plan === 'premium';
        if (isLoggedIn && user && isPaidFocus) {
          return <DashboardPageLegacy onNavigate={navigateTo} user={user} onLogout={handleLogout} onUserUpdate={handleDashboardUserUpdate} initialMode="focus_mode" />;
        }
        return <FocusModePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      }
      case 'about':
        return <AboutPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'why-students-choose':
        return <WhyStudentsChoosePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-tools-comparison':
        return <StudyToolsComparisonPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'terms':
        return <TermsOfServicePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'help':
        return <FAQPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'blog':
        return <BlogPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'blog-post':
        return <BlogPostPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'unsubscribe':
        return <UnsubscribePage onNavigate={navigateTo} />;
      case 'unlock-quiz':
        return <UnlockQuizPage />;
      case 'study-tools':
        // The old tool-grid dashboard is retired — every tool now
        // lives inside the Documents workspace (Analyze / Daily
        // Review / Study Packs / Citations / Games as in-page
        // panels). Any old /study-tools link lands in the workspace.
        if (needsOnboarding) return renderOnboarding('dashboard');
        return renderDocumentsWorkspace();
      case 'analyze':
        if (needsOnboarding) return renderOnboarding('analyze');
        return <AnalyzeEssayPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citations':
        if (needsOnboarding) return renderOnboarding('citations');
        return <CitationsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-pack':
        if (needsOnboarding) return renderOnboarding('dashboard');
        return <StudyPackPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-pack-hub':
        if (needsOnboarding) return renderOnboarding('dashboard');
        return <StudyPackHubPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analyze-hub':
        if (needsOnboarding) return renderOnboarding('dashboard');
        return <AnalyzeHubPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citations-hub':
        if (needsOnboarding) return renderOnboarding('dashboard');
        return <CitationsHubPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis':
        return (
          <AnalysisPage onNavigate={navigateTo} user={user} onLogout={handleLogout} onUserUpdate={handleDashboardUserUpdate} />
        );
      case 'analysis-history':
        return <AnalysisHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citation-results': {
        const citationResults = localStorage.getItem('citationSearchResults');
        if (citationResults) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(citationResults);
          } catch {
            localStorage.removeItem('citationSearchResults');
            navigateTo('citations');
            return <CitationsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
          }
          const ok = parsed && typeof parsed === 'object' && Array.isArray((parsed as { citations?: unknown }).citations);
          if (!ok) {
            localStorage.removeItem('citationSearchResults');
            navigateTo('citations');
            return <CitationsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
          }
          const searchResults = parsed as { citations: unknown[]; keywords?: string[]; searchStrategies?: string[]; researchTopic?: string; citationStyle?: string; yearRange?: string };
          return (
            <CitationResultsPage 
              onNavigate={navigateTo} 
              user={user} 
              onLogout={handleLogout}
              searchResults={{
                citations: searchResults.citations ?? [],
                keywords: searchResults.keywords ?? [],
                searchStrategies: searchResults.searchStrategies ?? [],
                researchTopic: searchResults.researchTopic ?? '',
                citationStyle: searchResults.citationStyle ?? 'APA',
                yearRange: searchResults.yearRange
              }}
              onNewSearch={() => navigateTo('citations')}
            />
          );
        }
        navigateTo('citations');
        return <CitationsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      }
      case 'citation-history':
        return <CitationHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'quiz-history': {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const urlFilter = params.get('filter');
        const validFilter = urlFilter && ['all', 'quiz', 'flashcards', 'crossword', 'crater_blast'].includes(urlFilter) ? urlFilter : undefined;
        return <QuizHistoryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} initialFilter={validFilter} />;
      }
      case 'friends':
        if (HIDE_FRIENDS) {
          if (needsOnboarding) return renderOnboarding('dashboard');
          return renderDocumentsWorkspace();
        }
        return <FriendsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      // ─── Documents workspace — the flagship dashboard ──────
      // "Documents IS the dashboard": /dashboard now lands here.
      // The legacy 'library', 'upload' and 'write' surfaces all
      // collapse into the single Documents page too. Their cases
      // fall through to keep stale callers (and any code paths
      // that still call navigateTo('library') etc.) working.
      // The old tool-grid dashboard moved to /study-tools; the
      // old <LibraryPage /> and <UploadPage /> are now dead code
      // reachable only by editing this switch — safe to delete in
      // a follow-up cleanup pass.
      case 'dashboard':
      case 'library':
      case 'upload':
      case 'write':
      case 'documents': {
        if (needsOnboarding) return renderOnboarding('dashboard');
        return renderDocumentsWorkspace();
      }
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'account':
        return (
          <AccountPage
            onNavigate={navigateTo}
            user={user}
            onLogout={handleLogout}
            onUserUpdate={(updates: { username?: string; name?: string }) => {
              if (user) {
                if (updates.username !== undefined) {
                  const updatedUser = { ...user, username: updates.username };
                  setUser(updatedUser);
                  try {
                    const stored = localStorage.getItem('user');
                    if (stored) {
                      const parsed = JSON.parse(stored);
                      localStorage.setItem('user', JSON.stringify({ ...parsed, username: updates.username }));
                    }
                  } catch (_) {}
                } else if (updates.name) {
                  const updatedUser = { ...user, name: updates.name };
                  setUser(updatedUser);
                  try {
                    const stored = localStorage.getItem('user');
                    if (stored) {
                      const parsed = JSON.parse(stored);
                      localStorage.setItem('user', JSON.stringify({ ...parsed, name: updates.name }));
                    }
                  } catch (_) {}
                }
              }
            }}
          />
        );
      case 'billing':
        return <BillingPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'more-tools':
        return <MoreToolsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'badges':
        if (HIDE_STREAK_AND_BADGES) {
          if (needsOnboarding) return renderOnboarding('dashboard');
          return renderDocumentsWorkspace();
        }
        return <BadgesPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'share-friends':
        if (HIDE_FRIENDS) {
          if (needsOnboarding) return renderOnboarding('dashboard');
          return renderDocumentsWorkspace();
        }
        return <ShareFriendsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      // Free Tools
      case 'word-counter':
        return <WordCounterPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citation-generator-tool':
        return <CitationGeneratorToolPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'readability-score':
        return <ReadabilityScorePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'paraphrasing-tips':
        return <ParaphrasingTipsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'essay-outline':
        return <EssayOutlineGeneratorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'text-case-converter':
        return <TextCaseConverterPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'thesis-generator':
        return <ThesisGeneratorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'grammar-checker':
        return <GrammarCheckerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'summarizer':
        return <SummarizerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'quiz-generator':
        return <QuizGeneratorPage key="quiz-generator" onNavigate={navigateTo} user={user} onLogout={handleLogout} initialStudyToolMode="quiz" />;
      case 'create-flashcards':
        return <CreateFlashcardsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'crossword-generator':
        return <QuizGeneratorPage key="crossword-generator" onNavigate={navigateTo} user={user} onLogout={handleLogout} initialStudyToolMode="crossword" />;
      case 'gpa-calculator':
        return <GPACalculatorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'pomodoro-timer':
        return <PomodoroTimerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'calculator':
        return <CalculatorPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'converter':
        return <ConverterPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'crater-blast':
        return <LightningReflexQuizPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'word-tower':
        return <WordTowerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'word-blitz':
        return <WordBlitzPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'game-launcher-crater-blast':
        return <GameLauncherPage gameType="crater_blast" onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'game-launcher-word-tower':
        return <GameLauncherPage gameType="word_tower" onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-pack-viewer':
        return <StudyPackViewerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} initialData={studyPackInitialData || undefined} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} user={user} />;
      case 'collaboration':
        return <CollaborationPage onNavigate={navigateTo} user={user} />;
      default:
        return <LandingPage onNavigate={navigateTo} user={user} />;
    }
  };

  const pageFallback = (
    <div className="relative isolate min-h-screen min-h-[100dvh] flex items-center justify-center overflow-x-clip">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div className="relative z-10">
        <RandomMascotLoader size={140} />
      </div>
    </div>
  );

  const pageContent = renderCurrentPage();
  const showWorkspaceChrome = shouldUseWorkspaceChromeApp(currentPage, isLoggedIn);

  return (
    <ErrorBoundary>
    {/* overflow-x-clip (not -hidden) is intentional: -hidden turns this div
        into a scroll container, which silently disables `position: sticky`
        on every descendant — including the public Header. `clip` clips
        horizontal overflow the same way visually but doesn't create a
        scroll context, so sticky behaviour works app-wide. */}
    <div className="relative min-h-screen overflow-x-clip transition-colors">
      {showWorkspaceChrome ? (
        <LoggedInWorkspaceLayout
          user={user ?? readCachedUserForSession()}
          onNavigate={navigateTo}
          onLogout={handleLogout}
          topBarVariant="compact"
        >
          <Suspense fallback={pageFallback}>
            <PageErrorBoundary key={currentPage} onGoBack={() => navigateTo('dashboard')}>
              {pageContent}
            </PageErrorBoundary>
          </Suspense>
        </LoggedInWorkspaceLayout>
      ) : (
        <Suspense fallback={pageFallback}>
          <PageErrorBoundary key={currentPage} onGoBack={() => navigateTo('dashboard')}>
            {pageContent}
          </PageErrorBoundary>
        </Suspense>
      )}
      {/* Post-Stripe-success welcome celebration — replays the
          onboarding `transition` animation as a fullscreen overlay
          when the user lands on /dashboard after Stripe's hard
          redirect from the trial-checkout step. Auto-dismisses when
          the animation finishes so the dashboard becomes interactive. */}
      {showPostCheckoutWelcome && (
        <Suspense fallback={null}>
          <PostCheckoutWelcomeOverlay
            firstName={
              user?.firstName?.trim() ||
              (user?.name?.trim() && !user.name.includes('@')
                ? user.name.trim().split(/\s+/)[0]
                : undefined)
            }
            onDone={() => setShowPostCheckoutWelcome(false)}
          />
        </Suspense>
      )}
      {showDailyReviewPrompt && user?.id && (
        <DailyReviewReadyModal
          userId={user.id}
          userName={
            user.firstName?.trim() ||
            (user.name?.trim() && !user.name.includes('@')
              ? user.name.trim().split(/\s+/)[0]
              : undefined)
          }
          onStart={handleDailyReviewPromptStart}
          onDismiss={handleDailyReviewPromptDismiss}
        />
      )}
      {/* Global achievement popup */}
      {user && !HIDE_STREAK_AND_BADGES && <BadgeNotificationToast onNavigate={navigateTo} />}
      {apiLimitPaywallOpen && isLoggedIn && user && (
        <SoftPaywall
          variant="postTutorial"
          userName={
            user.firstName?.trim() ||
            (user.name?.trim() && !user.name.includes('@') ? user.name.trim().split(/\s+/)[0] ?? '' : '') ||
            ''
          }
          onStartTrial={() => trackEvent('paywall_start_trial')}
          onDismiss={() => {
            setApiLimitPaywallOpen(false);
            try {
              sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
              // Mark as dismissed so subsequent API limit responses don't re-open it
              sessionStorage.setItem(SOFT_PAYWALL_DISMISSED_KEY, '1');
            } catch {
              /* ignore */
            }
            // Persist the dismissal timestamp in localStorage so the
            // paywall stays quiet for the next 7 days, even across
            // logouts and fresh sessions.
            markSoftPaywallDismissedNow();
          }}
          onNavigate={navigateTo}
        />
      )}
      {stripeCancelTrialModalOpen && user && (
        <StripeCancelTrialChoiceModal
          open={stripeCancelTrialModalOpen}
          userName={
            user.firstName?.trim() ||
            (user.name?.trim() && !user.name.includes('@') ? user.name.trim().split(/\s+/)[0] ?? '' : '') ||
            ''
          }
          onClose={resolveTutorialStripeCancelModal}
          onStartTrialRedirect={resolveTutorialStripeCancelModal}
          onForfeitComplete={() => {
            resolveTutorialStripeCancelModal();
            setApiLimitPaywallOpen(false);
            try {
              sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
              sessionStorage.setItem(SOFT_PAYWALL_DISMISSED_KEY, '1');
            } catch { /* ignore */ }
            // Weekly cooldown — quiet the paywall for 7 days across sessions.
            markSoftPaywallDismissedNow();
            void validateAndRefreshTokenRef.current();
          }}
        />
      )}
      {/* Global study timer - floating in corner when logged in */}
      {user && <StudyTimerWidget currentPage={currentPage} />}
      {/* Welcome toast — bottom-right Duolingo-style nudge after onboarding */}
      {user && (
        <DashboardWelcomeToast
          currentPage={currentPage}
          user={user}
          paywallOpen={apiLimitPaywallOpen}
          onNavigate={navigateTo}
        />
      )}
      {/* Dev-only paywall flow inspector — hidden by default. To bring
          it back, in DevTools run:
            localStorage.setItem('writescholar_dev_paywall_panel', '1')
          then refresh. Still gated on `import.meta.env.DEV` so it can
          never render in a prod build. */}
      {import.meta.env.DEV &&
        typeof window !== 'undefined' &&
        window.localStorage?.getItem('writescholar_dev_paywall_panel') === '1' && (
          <PaywallDebugPanel user={user} paywallOpen={apiLimitPaywallOpen} currentPage={currentPage} />
        )}
      {/* Mobile-only bottom Google sign-in popup (Quizlet-style) */}
      {!user && (
        <MobileGoogleSignInPopup
          currentPage={currentPage}
          hideOnPages={['login', 'signup', 'auth-callback', 'reset-password', 'email-verification']}
        />
      )}
    </div>
    </ErrorBoundary>
  );
};


// Admin Dashboard Component
const AdminDashboard = ({ onNavigate, user: _user }: UserProps) => (
  <div className="relative min-h-screen overflow-x-clip">
    <WriteScholarEditorialBackgroundLayers position="fixed" />
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Institution Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
          <div className="text-3xl font-bold text-violet-600">1,247</div>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents Analyzed</h3>
          <div className="text-3xl font-bold text-green-600">8,942</div>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Score</h3>
          <div className="text-3xl font-bold text-violet-600">84.2%</div>
          <p className="text-sm text-gray-500">Institution-wide</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Tickets</h3>
          <div className="text-3xl font-bold text-orange-600">23</div>
          <p className="text-sm text-gray-500">Open tickets</p>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Add New Users</h3>
              <p className="text-sm text-gray-600">Bulk invite students and faculty</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Manage Permissions</h3>
              <p className="text-sm text-gray-600">Set role-based access controls</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Usage Reports</h3>
              <p className="text-sm text-gray-600">View detailed usage analytics</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Settings</h2>
          <div className="space-y-4">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Citation Styles</h3>
              <p className="text-sm text-gray-600">Configure default citation formats</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Branding</h3>
              <p className="text-sm text-gray-600">Customize interface with your logo</p>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <h3 className="font-medium text-gray-900">Integrations</h3>
              <p className="text-sm text-gray-600">Connect with LMS and other systems</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Collaboration Page Component
const CollaborationPage = ({ onNavigate, user: _user }: UserProps) => (
  <div className="relative min-h-screen overflow-x-clip">
    <WriteScholarEditorialBackgroundLayers position="fixed" />
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </button>
          <button onClick={() => onNavigate('library')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Library
          </button>
        </div>
      </div>
    </nav>

    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Collaboration</h1>
      
      {/* Active Collaborations */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Climate Research Collaboration</h3>
                <p className="text-sm text-gray-600">With Dr. Johnson, Emma Rodriguez • 3 documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              <button className="text-violet-600 hover:text-violet-500">Open</button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DJ</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dr. Michael Johnson</p>
                  <p className="text-sm text-gray-500">Supervisor</p>
                </div>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dr. Johnson</span> commented on your methodology section
              <span className="text-gray-400 block">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AcademicAIApp;