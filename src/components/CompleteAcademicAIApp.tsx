import { useState, useEffect, Suspense } from 'react';
import { logger } from '../utils/logger';
import { persistOnboardingToServer } from '../utils/onboarding';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// Eager: landing, login, signup (critical for first paint)
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';

// Lazy with retry: recovers from chunk load failures (network/404), retries 3x before failing
const EmailVerificationPage = lazyWithRetry(() => import('./pages/EmailVerificationPage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));
const AuthCallbackPage = lazyWithRetry(() => import('./pages/AuthCallbackPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
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
const HumanizerPage = lazyWithRetry(() => import('./pages/tools/HumanizerPage'));
const SummarizerPage = lazyWithRetry(() => import('./pages/tools/SummarizerPage'));
const QuizGeneratorPage = lazyWithRetry(() => import('./pages/tools/QuizGeneratorPage'));
const GPACalculatorPage = lazyWithRetry(() => import('./pages/tools/GPACalculatorPage'));
const PomodoroTimerPage = lazyWithRetry(() => import('./pages/tools/PomodoroTimerPage'));
const CalculatorPage = lazyWithRetry(() => import('./pages/tools/CalculatorPage'));
const ConverterPage = lazyWithRetry(() => import('./pages/tools/ConverterPage'));
const LightningReflexQuizPage = lazyWithRetry(() => import('./pages/tools/LightningReflexQuizPage'));
const InteractiveLessonPage = lazyWithRetry(() => import('./pages/tools/InteractiveLessonPage'));
const CreateFlashcardsPage = lazyWithRetry(() => import('./pages/tools/CreateFlashcardsPage'));
const StudyPackViewerPage = lazyWithRetry(() => import('./pages/StudyPackViewerPage'));
const AnalyzeEssayPage = lazyWithRetry(() => import('./pages/AnalyzeEssayPage'));
const CitationsPage = lazyWithRetry(() => import('./pages/CitationsPage'));
const UnlockQuizPage = lazyWithRetry(() => import('./pages/UnlockQuizPage'));

// Import common components
import ErrorBoundary from './common/ErrorBoundary';
import PageErrorBoundary from './common/PageErrorBoundary';
import BadgeNotificationToast from './common/BadgeNotificationToast';
import StudyTimerWidget from './common/StudyTimerWidget';
import MobileGoogleSignInPopup from './common/MobileGoogleSignInPopup';

/** Derive page from pathname - used for initial state and URL sync */
function getPageFromPath(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/'; // normalize trailing slash
  if (p === '/email-verification') return 'email-verification';
  if (p === '/onboarding') return 'onboarding';
  if (p === '/auth/callback') return 'auth-callback';
  if (p === '/signup') return 'signup';
  if (p === '/login') return 'login';
  if (p === '/reset-password') return 'reset-password';
  if (p === '/dashboard') return 'dashboard';
  if (p === '/pricing') return 'pricing';
  if (p === '/features') return 'features';
  if (p === '/focus-mode' || p === '/focus') return 'focus-mode';
  if (p === '/why-students-choose' || p === '/compare') return 'why-students-choose';
  if (p === '/vs-quizlet-knowt' || p === '/study-tools-comparison' || p === '/compare-study-tools') return 'study-tools-comparison';
  if (p === '/contact') return 'contact';
  if (p === '/about') return 'about';
  if (p === '/analysis') return 'analysis';
  if (p === '/analysis-history') return 'analysis-history';
  if (p === '/citation-results') return 'citation-results';
  if (p === '/citation-history') return 'citation-history';
  if (p === '/quiz-history') return 'quiz-history';
  if (p === '/friends') return 'friends';
  if (p === '/upload') return 'upload';
  if (p === '/settings') return 'account';
  if (p === '/unlock-quiz' || p.startsWith('/unlock-quiz?')) return 'unlock-quiz';
  if (p === '/profile') return 'profile';
  if (p === '/library') return 'library';
  if (p === '/account') return 'account';
  if (p === '/billing') return 'billing';
  if (p === '/help' || p === '/help-center') return 'help';
  if (p === '/privacy' || p === '/privacy-policy') return 'privacy';
  if (p === '/terms' || p === '/terms-of-service') return 'terms';
  if (p === '/unsubscribe') return 'unsubscribe';
  if (p === '/blog' || p === '/blog') return 'blog';
  if (p.startsWith('/blog/')) {
    const slug = p.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '';
    return slug ? 'blog-post' : 'blog';
  }
  if (p === '/tools/word-counter' || p === '/word-counter') return 'word-counter';
  if (p === '/tools/citation-generator' || p === '/citation-generator-tool') return 'citation-generator-tool';
  if (p === '/tools/readability-score' || p === '/readability-score') return 'readability-score';
  if (p === '/tools/paraphrasing-tips' || p === '/paraphrasing-tips') return 'paraphrasing-tips';
  if (p === '/tools/essay-outline' || p === '/essay-outline') return 'essay-outline';
  if (p === '/tools/text-case-converter' || p === '/text-case-converter') return 'text-case-converter';
  if (p === '/tools/thesis-generator' || p === '/thesis-generator') return 'thesis-generator';
  if (p === '/tools/grammar-checker' || p === '/grammar-checker') return 'grammar-checker';
  if (p === '/tools/humanizer' || p === '/humanizer') return 'humanizer';
  if (p === '/tools/summarizer' || p === '/summarizer') return 'summarizer';
  if (p === '/tools/quiz-generator' || p === '/quiz-generator') return 'quiz-generator';
  if (p === '/tools/flashcard-generator' || p === '/flashcard-generator') return 'create-flashcards';
  if (p === '/tools/create-flashcards' || p === '/create-flashcards') return 'create-flashcards';
  if (p === '/tools/crossword-generator' || p === '/crossword-generator') {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('savedCrossword') : null;
      if (!s) return 'dashboard';
      const parsed = JSON.parse(s);
      const q = parsed?.questions || parsed;
      if (q?.grid && q?.placedWords) return 'crossword-generator';
    } catch (_) {}
    return 'dashboard';
  }
  if (p === '/tools/gpa-calculator' || p === '/gpa-calculator') return 'gpa-calculator';
  if (p === '/tools/pomodoro-timer' || p === '/pomodoro-timer') return 'pomodoro-timer';
  if (p === '/tools/calculator' || p === '/calculator') return 'calculator';
  if (p === '/tools/converter' || p === '/converter') return 'converter';
  if (p === '/tools/crater-blast' || p === '/crater-blast' || p === '/tools/lightning-reflex-quiz' || p === '/lightning-reflex-quiz') return 'crater-blast';
  if (p === '/tools/interactive-lesson' || p === '/interactive-lesson' || p === '/lesson-generator') return 'interactive-lesson';
  if (p === '/study-pack-viewer' || p === '/tools/study-pack-viewer') return 'study-pack-viewer';
  if (p === '/tools/more' || p === '/more-tools' || p === '/view-more-tools') return 'more-tools';
  if (p === '/badges' || p === '/achievements') return 'badges';
  if (p === '/tools/analyze' || p === '/analyze') return 'analyze';
  if (p === '/tools/citations' || p === '/citations') return 'citations';
  return 'landing';
}

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

// Main Application Component
const AcademicAIApp = () => {
  const [currentPage, setCurrentPage] = useState(() =>
    typeof window !== 'undefined' ? getPageFromPath(window.location.pathname) : 'landing'
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
  }, [currentPage]);

  // Route protection for authenticated pages
  const protectedRoutes = ['dashboard', 'analysis', 'analysis-history', 'citation-results', 'citation-history', 'quiz-history', 'friends', 'upload', 'profile', 'library', 'account', 'billing', 'badges'];

  // SEO: dynamic document title and meta description per page (SPA)
  const pageMeta: Record<string, { title: string; description: string }> = {
    landing: { title: 'WriteScholar — #1 Free AI Study Toolkit | Quizlet & Knowt Alternative', description: 'WriteScholar is the AI study tool trusted by 38k+ students. Create flashcards, quizzes, get essay feedback & humanize text in seconds. Try free today.' },
    features: { title: '#1 Free AI Study Tools — Quiz Generator, Flashcards, Humanizer | WriteScholar', description: 'AI quiz generator, flashcard maker, crossword builder, humanizer, summarizer, citation finder, essay checker — all free to start. The best Quizlet alternative for students.' },
    'focus-mode': { title: 'Focus Mode — Block Websites Until You Study | WriteScholar', description: 'Block distracting websites like YouTube, TikTok, Instagram until you answer study questions. Pro: 10 sites. Premium: unlimited. Earn your screen time. Chrome extension required.' },
    pricing: { title: 'Pricing — Free Plan, Pro & Premium | WriteScholar', description: 'Start free with AI quizzes, flashcards, humanizer, and 10+ writing tools. Upgrade for unlimited usage. Better value than Quizlet Plus or Knowt premium.' },
    about: { title: 'About WriteScholar — The #1 Free Quizlet & Knowt Alternative', description: 'WriteScholar is the #1 free alternative to Quizlet and Knowt. AI quizzes, flashcards, crosswords, humanizer, summarizer, citations — everything students need in one place.' },
    'why-students-choose': { title: 'WriteScholar vs Grammarly vs QuillBot: Honest Comparison 2026', description: 'See how WriteScholar compares to Grammarly and QuillBot. Built for academic writing, citation finder, AI humanizer, essay analysis, and more.' },
    'study-tools-comparison': { title: 'WriteScholar vs Quizlet vs Knowt — #1 Free Alternative 2026', description: 'Why students are switching from Quizlet and Knowt to WriteScholar. AI quizzes, flashcards, crosswords — plus humanizer, citations, and essay analysis. Compare features side by side.' },
    'share-friends': { title: 'Study Together — Add Friends & Share Study Tools | WriteScholar', description: 'Add friends with your unique code and share flashcards, quizzes, crosswords and notes instantly. Delivers straight to their device — they just tap accept.' },
    help: { title: 'Help & FAQ: AI Humanizer, Quiz Generator & More | WriteScholar', description: 'Get help with AI Humanizer, Quiz Generator, Paper Summarizer, Citation Finder. Supported citation styles: APA, Harvard, MLA, Chicago.' },
    contact: { title: 'Contact WriteScholar Support | Get Help Fast', description: 'Contact WriteScholar support for help with AI tools for students.' },
    privacy: { title: 'Privacy Policy | WriteScholar', description: 'WriteScholar privacy policy and data handling.' },
    terms: { title: 'Terms of Service | WriteScholar', description: 'WriteScholar terms of service.' },
    login: { title: 'Log In | WriteScholar', description: 'Log in to access AI Humanizer, Quiz Generator, Summarizer, and more.' },
    signup: { title: 'Sign Up Free | WriteScholar', description: 'Create your free account. Get AI Humanizer, Paper Summarizer, Essay Checker, and Citation Finder.' },
    blog: { title: 'Study Tips & Academic Writing Guides | WriteScholar Blog', description: 'Guides on humanizing AI text, creating study quizzes, summarizing research papers, APA/MLA citations, and academic writing tips.' },
    'word-counter': { title: 'Free Word Counter Tool – Count Words & Characters Instantly | WriteScholar', description: 'Count words, characters, sentences, and paragraphs instantly. Free online word counter for essays, academic papers, and assignments with word limits.' },
    'citation-generator-tool': { title: 'Free Citation Generator – APA, MLA, Chicago, Harvard | WriteScholar', description: 'Free online citation generator. Create APA, MLA, Chicago, Harvard citations for books, journals, websites. Generate citations instantly—no signup. Trusted by students.' },
    'readability-score': { title: 'Free Readability Score Calculator – Flesch-Kincaid & More | WriteScholar', description: 'Check your text readability with Flesch-Kincaid scores. Free readability checker shows grade level and reading ease for academic writing.' },
    'paraphrasing-tips': { title: 'Free Paraphrasing Tips Tool – Find Overused Words & Improve Writing | WriteScholar', description: 'Find overused words, passive voice, and wordy phrases in your writing. Free paraphrasing helper with synonym suggestions for better academic writing.' },
    'essay-outline': { title: 'Free Essay Outline Generator – Create Outlines in Seconds | WriteScholar', description: 'Generate structured essay outlines for argumentative, expository, narrative, compare-contrast, persuasive, and research papers. Free outline templates.' },
    'text-case-converter': { title: 'Free Text Case Converter – UPPERCASE, lowercase, Title Case | WriteScholar', description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, and more. Perfect for formatting titles, headings, and fixing caps lock mistakes.' },
    'thesis-generator': { title: 'Free Thesis Statement Generator – Create Strong Thesis Statements | WriteScholar', description: 'Create strong thesis statements for argumentative, expository, analytical, and compare-contrast essays. Template-based thesis builder.' },
    'grammar-checker': { title: 'Free Grammar Checker – Fix Spelling & Grammar Errors | WriteScholar', description: 'Check your writing for common spelling mistakes, grammar errors, punctuation issues, and style suggestions. Quick client-side grammar check.' },
    'humanizer': { title: 'AI Humanizer – Bypass AI Detection Free | WriteScholar', description: 'Transform AI-generated text from ChatGPT, Claude, Gemini into undetectable human writing. Bypass Turnitin, GPTZero, and other AI detectors. A tool Quizlet and Knowt don\'t offer. Free to try.' },
    'summarizer': { title: 'AI Summarizer – Condense Papers & Articles Free | WriteScholar', description: 'Summarize research papers, articles, and textbooks into key points. Bullet points or paragraphs. Better than Quizlet for literature reviews. Free to try.' },
    'quiz-generator': { title: 'AI Quiz Generator from Text – Pro Study Tool | WriteScholar', description: 'Generate quizzes from your notes or articles. Multiple-choice, true/false, fill-in-the-blank questions in seconds. Quiz generation is a Pro feature. Best Quizlet alternative.' },
    'create-flashcards': { title: 'Create Flashcards – Custom Deck Builder | WriteScholar', description: 'Build and customize your own flashcard deck, or use Study Pack to generate from notes. Themes, labels, font size. Edit, reorder, duplicate. Like Anki, but simpler.' },
    'crossword-generator': { title: 'AI Crossword Generator — Pro Study Tool | WriteScholar', description: 'Turn your notes into fun crossword puzzles with AI. A unique study mode you won\'t find on Quizlet or Knowt. Crossword generation is a Pro feature.' },
    'quiz-history': { title: 'Saved Materials | WriteScholar', description: 'View and retake your saved quizzes, flashcards, and crosswords. Study materials are stored for 30 days.' },
    'gpa-calculator': { title: 'Free GPA Calculator – Calculate Your Grade Point Average | WriteScholar', description: 'Free GPA calculator for college and high school students. Calculate semester or cumulative GPA instantly. Add courses, credits, and grades. No signup required.' },
    'pomodoro-timer': { title: 'Free Pomodoro Timer – Study Timer & Focus Tool | WriteScholar', description: 'Free Pomodoro timer for focused studying. Boost productivity with timed work sessions and breaks. Customizable focus and break intervals. No signup required.' },
    'calculator': { title: 'Free Scientific Calculator – Trig, Log, Powers | WriteScholar', description: 'Free online scientific calculator for students. Trigonometry (sin, cos, tan), logarithms, square root, powers, and more. Works in degrees or radians. No signup required.' },
    'converter': { title: 'Free Unit Converter – Length, Weight, Temperature & More | WriteScholar', description: 'Free online unit converter for students. Length, weight, temperature, volume, area, time, speed, energy. Meters to feet, m/s to mph & more. No signup required.' },
    'crater-blast': { title: 'Crater Blast – AI Quiz Shooter Game | WriteScholar', description: 'Blast the correct falling crater before it lands! AI generates quiz questions as craters. Aim your cannon, build streaks, and beat your high score.' },
    'more-tools': { title: 'More Tools – Lessons, Summarize, Humanize & Utilities | WriteScholar', description: 'Lessons, summarize, humanize, plus word counter, citation generator, calculator, converter, essay outline, thesis generator, grammar checker, and more.' },
    'interactive-lesson': { title: 'Interactive Lesson Generator – Turn Text into Fun Lessons | WriteScholar', description: 'Transform boring study material into engaging, interactive lessons. Break down complex topics into digestible slides with key concepts, examples, and fun facts. Learn before you quiz!' },
    'badges': { title: 'Achievements & Badges | WriteScholar', description: 'Collect badges, earn XP, and level up your scholar journey. Unlock cute monster companions by using WriteScholar tools.' },
    'friends': { title: 'Friends | WriteScholar', description: 'Connect with friends to share quizzes, flashcards, and crosswords. Add friends by code and collaborate on studying.' }
  };
  useEffect(() => {
    const meta = pageMeta[currentPage];
    if (meta) {
      document.title = meta.title;
      const setMeta = (selector: string, attr: string, value: string) => {
        let el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
        else {
          el = document.createElement('meta');
          const isProperty = selector.includes('property=');
          if (isProperty) {
            const prop = selector.match(/property="([^"]+)"/)?.[1];
            if (prop) el.setAttribute('property', prop);
          } else {
            const name = selector.match(/name="([^"]+)"/)?.[1];
            if (name) el.setAttribute('name', name);
          }
          el.setAttribute(attr, value);
          document.head.appendChild(el);
        }
      };
      setMeta('meta[name="description"]', 'content', meta.description);
      setMeta('meta[property="og:title"]', 'content', meta.title);
      setMeta('meta[property="og:description"]', 'content', meta.description);
      setMeta('meta[name="twitter:title"]', 'content', meta.title);
      setMeta('meta[name="twitter:description"]', 'content', meta.description);

      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute('href', `https://writescholar.com${window.location.pathname}`);
      setMeta('meta[property="og:url"]', 'content', `https://writescholar.com${window.location.pathname}`);
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

  // Clear payment params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // payment=cancelled: clear URL only; user stays on onboarding (hard paywall — must complete trial)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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

  // Global error handler for 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // If we get a 401 and we're logged in, try to refresh token (on any page)
      if (response.status === 401 && isLoggedIn) {
        try {
          const refreshResponse = await originalFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('authToken', refreshData.data.token);
            logger.log('Token refreshed automatically');
            
            // Retry the original request with new token
            const retryResponse = await originalFetch(...args);
            return retryResponse;
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
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [isLoggedIn, currentPage]);

  // Navigation function (slug optional for blog posts)
  // Canonical URL map – pages whose URL differs from /${page}
  const pageUrlMap: Record<string, string> = {
    landing: '/',
    humanizer: '/tools/humanizer',
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
    'study-pack-viewer': '/study-pack-viewer',
    'analyze': '/tools/analyze',
    'citations': '/tools/citations',
    'more-tools': '/more-tools',
    'badges': '/badges',
    'why-students-choose': '/why-students-choose',
    'study-tools-comparison': '/vs-quizlet-knowt',
  };

  const navigateTo = (page: string, slug?: string, options?: { quizHistoryFilter?: 'all' | 'quiz' | 'flashcards' | 'crossword' | 'crater_blast' }) => {
    setCurrentPage(page);
    // Update URL to canonical form
    if (page === 'blog-post' && slug) {
      window.history.pushState({}, '', `/blog/${slug}`);
    } else if (page === 'quiz-history' && options?.quizHistoryFilter) {
      window.history.pushState({}, '', `/quiz-history?filter=${options.quizHistoryFilter}`);
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
  };

  const handleLogin = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('landing');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const handleOnboardingComplete = async (destination: string) => {
    if (user?.id) {
      await persistOnboardingToServer();
      const updatedUser = { ...user, onboardingCompleted: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    try {
      sessionStorage.setItem('writescholar_show_interactive_tutorial', 'true');
    } catch (_) {}
    navigateTo(destination);
  };

  const renderOnboarding = (destination: string) => (
    <OnboardingPage
      onNavigate={navigateTo}
      user={user}
      onLogout={handleLogout}
      onUserUpdate={(updates) => {
        if (user && (updates.name !== undefined || updates.username !== undefined)) {
          const updatedUser = {
            ...user,
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.username !== undefined && { username: updates.username })
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }}
      onComplete={() => handleOnboardingComplete(destination)}
    />
  );

  const needsOnboarding = isLoggedIn && user?.id && !user.onboardingCompleted;

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
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="animate-pulse text-stone-500">Loading...</div>
        </div>
      );
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} user={user} />;
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
      case 'auth-callback':
        return <AuthCallbackPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'pricing':
        return <PricingPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'features':
        return <FeaturesPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'focus-mode': {
        const plan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
        const isPaidFocus = plan === 'pro' || plan === 'premium';
        if (isLoggedIn && user && isPaidFocus) {
          return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} onUserUpdate={handleDashboardUserUpdate} initialMode="focus_mode" />;
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
      case 'dashboard':
        if (needsOnboarding) return renderOnboarding('dashboard');
        return <DashboardPage onNavigate={navigateTo} user={user} onLogout={handleLogout} onUserUpdate={handleDashboardUserUpdate} />;
      case 'analyze':
        if (needsOnboarding) return renderOnboarding('analyze');
        return <AnalyzeEssayPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'citations':
        if (needsOnboarding) return renderOnboarding('citations');
        return <CitationsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'analysis':
        return <AnalysisPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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
        return <FriendsPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'upload':
        return <UploadPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'library':
        return <LibraryPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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
        return <BadgesPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'share-friends':
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
      case 'humanizer':
        return <HumanizerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
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
      case 'interactive-lesson':
        return <InteractiveLessonPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'study-pack-viewer':
        return <StudyPackViewerPage onNavigate={navigateTo} user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} user={user} />;
      case 'collaboration':
        return <CollaborationPage onNavigate={navigateTo} user={user} />;
      default:
        return <LandingPage onNavigate={navigateTo} user={user} />;
    }
  };

  const pageFallback = (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
      <div className="animate-pulse text-stone-500 text-sm">Loading...</div>
    </div>
  );

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
      <Suspense fallback={pageFallback}>
        <PageErrorBoundary key={currentPage} onGoBack={() => navigateTo('dashboard')}>
          {renderCurrentPage()}
        </PageErrorBoundary>
      </Suspense>
      {/* Global achievement popup */}
      {user && <BadgeNotificationToast onNavigate={navigateTo} />}
      {/* Global study timer - floating in corner when logged in */}
      {user && <StudyTimerWidget currentPage={currentPage} />}
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
  <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
          <div className="text-3xl font-bold text-blue-600">1,247</div>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents Analyzed</h3>
          <div className="text-3xl font-bold text-green-600">8,942</div>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Score</h3>
          <div className="text-3xl font-bold text-purple-600">84.2%</div>
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
  <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
    {/* Navigation */}
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Climate Research Collaboration</h3>
                <p className="text-sm text-gray-600">With Dr. Johnson, Emma Rodriguez • 3 documents</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              <button className="text-blue-600 hover:text-blue-500">Open</button>
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
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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