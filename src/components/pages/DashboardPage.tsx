import { useState, useEffect, useRef, useMemo } from 'react';

function shuffleAndTake<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import ScholarMascot from '../common/ScholarMascot';
import StreakWidget from '../common/StreakWidget';
import BadgeWidget from '../common/BadgeWidget';
import FlashcardViewer from '../common/FlashcardViewer';
import InteractiveTutorial from '../common/InteractiveTutorial';
import SoftPaywall from '../common/SoftPaywall';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { trackAction, syncFromAPIData, trackExport, trackCopy, trackStudyPackGenerated, getStats } from '../../data/achievements';
import { getResetsInText, getExpiringSoonCount, getExpiringSoonUrgencyText, getDaysUntilExpiration } from '../../utils/usageReset';
import { persistTutorialToServer } from '../../utils/onboarding';
import { trackEvent } from '../../utils/analytics';
import FocusModeSettingsSection from '../common/FocusModeSettingsSection';
import { FOCUS_MODE_COMING_SOON, FOCUS_MODE_CHROME_EXTENSION_URL } from '../../constants/focusMode';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import HeroEssayPreviewCard from '../landing/HeroEssayPreviewCard';
import { FeatureTickRow } from '../common/FeatureTickRow';
import { DEMO_DASHBOARD_BEFORE_PAPER, DEMO_DASHBOARD_AFTER_PAPER } from '../../data/landingPageDemoAnalysis';
import InteractiveDocumentAnalysis from '../landing/InteractiveDocumentAnalysis';
import InteractiveCitationsDemo from '../landing/InteractiveCitationsDemo';
import InteractiveStudyPackDemo from '../landing/InteractiveStudyPackDemo';

interface DashboardProps {
  onNavigate: (page: string, slug?: string, options?: { studyPack?: { data: any; title?: string }; unlockQuizQuery?: string }) => void;
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updates: { welcomeTutorialCompleted?: boolean }) => void;
  initialMode?: 'analyze' | 'citations' | 'summarize' | 'quiz' | 'lesson' | 'focus_mode';
}

const getTimeGreeting = (): { greeting: string; emoji: string } => {
  const hour = new Date().getHours();
  const rand = Math.random();
  if (rand < 0.15) return { greeting: 'Welcome back', emoji: '👋' };
  // 4 AM - 11:59 AM = Good morning
  if (hour >= 4 && hour < 12) return { greeting: 'Good morning', emoji: '☀️' };
  // 12 PM - 4:59 PM = Good afternoon
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon', emoji: '👋' };
  // 5 PM - 3:59 AM = Good evening (late night counts as evening)
  return { greeting: 'Good evening', emoji: '🌙' };
};

/** Returns display name for greetings; never uses email — prefers firstName, then name (if not email) */
const getDisplayNameForGreeting = (u: { name?: string; firstName?: string; lastName?: string } | null | undefined): string => {
  if (!u) return '';
  if (u.firstName?.trim()) return u.firstName.trim().split(' ')[0] || '';
  if (u.name?.trim() && !u.name.includes('@')) return u.name.trim().split(' ')[0] || '';
  if (u.lastName?.trim()) return u.lastName.trim().split(' ')[0] || '';
  return '';
};

const relativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ActivityItem {
  id: string;
  type: 'document' | 'analysis' | 'quiz' | 'flashcard' | 'crossword' | 'lesson' | 'study_pack' | 'humanize' | 'summary' | 'citation';
  title: string;
  subtitle: string;
  date: Date;
  navigateTo: string;
  /** For quiz/flashcard/crossword: tool data to open directly */
  toolData?: any;
  /** For items that expire (study tools, citations) */
  expires_at?: string | null;
}

const activityMeta: Record<ActivityItem['type'], { emoji: string; bg: string; label: string; cardBg: string; border: string; accent: string; shape: 'circle' | 'square' | 'diamond' }> = {
  document: { emoji: '📄', bg: 'bg-violet-100 dark:bg-violet-900/35', label: 'Uploaded', cardBg: 'from-violet-50 to-stone-50 dark:from-violet-950/40 dark:to-stone-900/40', border: 'border-violet-200/80 dark:border-violet-700/45', accent: 'text-violet-800 dark:text-violet-200', shape: 'circle' },
  analysis: { emoji: '🔍', bg: 'bg-violet-100 dark:bg-violet-900/35', label: 'Analyzed', cardBg: 'from-violet-50 to-stone-50 dark:from-violet-950/40 dark:to-stone-900/40', border: 'border-violet-200/80 dark:border-violet-700/45', accent: 'text-violet-800 dark:text-violet-200', shape: 'square' },
  quiz: { emoji: '🎯', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Quiz', cardBg: 'from-amber-50 to-stone-50 dark:from-amber-900/20 dark:to-stone-900/30', border: 'border-amber-200/70 dark:border-amber-700/40', accent: 'text-amber-800 dark:text-amber-200', shape: 'circle' },
  study_pack: { emoji: '📦', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Study Pack', cardBg: 'from-amber-50 to-stone-50 dark:from-amber-900/20 dark:to-stone-900/30', border: 'border-amber-200/70 dark:border-amber-700/40', accent: 'text-amber-800 dark:text-amber-200', shape: 'diamond' },
  flashcard: { emoji: '🃏', bg: 'bg-violet-100 dark:bg-violet-900/35', label: 'Flashcards', cardBg: 'from-violet-50 to-stone-50 dark:from-violet-950/40 dark:to-stone-900/40', border: 'border-violet-200/80 dark:border-violet-700/45', accent: 'text-violet-800 dark:text-violet-200', shape: 'diamond' },
  crossword: { emoji: '🧩', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Crossword', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20', border: 'border-orange-200/70 dark:border-orange-700/40', accent: 'text-orange-800 dark:text-orange-200', shape: 'square' },
  lesson: { emoji: '🎓', bg: 'bg-violet-100 dark:bg-violet-900/35', label: 'Lesson', cardBg: 'from-violet-50 to-stone-50 dark:from-violet-950/40 dark:to-stone-900/40', border: 'border-violet-200/80 dark:border-violet-700/45', accent: 'text-violet-800 dark:text-violet-200', shape: 'circle' },
  humanize: { emoji: '✨', bg: 'bg-violet-100 dark:bg-violet-900/35', label: 'Humanized', cardBg: 'from-violet-50 to-stone-50 dark:from-violet-950/40 dark:to-stone-900/40', border: 'border-violet-200/80 dark:border-violet-700/45', accent: 'text-violet-800 dark:text-violet-200', shape: 'diamond' },
  summary: { emoji: '📋', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Summary', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20', border: 'border-teal-200/70 dark:border-teal-700/40', accent: 'text-teal-700 dark:text-teal-300', shape: 'square' },
  citation: { emoji: '📚', bg: 'bg-slate-200 dark:bg-slate-700/50', label: 'Citations', cardBg: 'from-slate-50 to-violet-50 dark:from-slate-900/40 dark:to-violet-950/30', border: 'border-slate-200/80 dark:border-slate-600/50', accent: 'text-slate-700 dark:text-slate-200', shape: 'diamond' },
};

const Dashboard = ({ onNavigate, user, onLogout, onUserUpdate, initialMode = 'analyze' }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting] = useState(getTimeGreeting);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  type DashboardMode = NonNullable<DashboardProps['initialMode']>;
  const [mode, setMode] = useState<DashboardMode>(initialMode);

  // Sync tab when navigating to dashboard via footer (e.g. "Analyze Essay" or "Citations")
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Restore input text when returning from a failed operation (text is preserved across errors/back-navigation)
  useEffect(() => {
    try {
      const fromAnalysis = localStorage.getItem('textAnalysisContent');
      const fromDraft = sessionStorage.getItem('writescholar_dashboard_draft');
      const saved = fromAnalysis || fromDraft;
      if (saved && saved.trim().length > 0) {
        setInputText(saved);
        if (fromAnalysis) localStorage.removeItem('textAnalysisContent');
        if (fromDraft) sessionStorage.removeItem('writescholar_dashboard_draft');
      }
    } catch (_) {}
  }, []);

  // Interactive tutorial — triggered from onboarding completion via sessionStorage flag
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false);
  useEffect(() => {
    try {
      const shouldShow = sessionStorage.getItem('writescholar_show_interactive_tutorial');
      if (shouldShow === 'true') {
        setShowInteractiveTutorial(true);
      }
    } catch (_) {}
  }, []);

  const [showSoftPaywall, setShowSoftPaywall] = useState(false);
  const [dismissedFirstAnalysisBanner, setDismissedFirstAnalysisBanner] = useState(false);
  const handleInteractiveTutorialComplete = async () => {
    setShowInteractiveTutorial(false);
    try {
      sessionStorage.removeItem('writescholar_show_interactive_tutorial');
      await persistTutorialToServer();
    } catch (_) {}
    onUserUpdate?.({ welcomeTutorialCompleted: true });
    trackEvent('tutorial_complete');
    try {
      if (user?.id) {
        localStorage.setItem(`writescholar_paywall_deferred_${user.id}`, 'true');
      }
    } catch (_) {}
    setMode('analyze');
    setTimeout(() => {
      document.querySelector('[data-tutorial="analyze-ready"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handlePaywallStartTrial = () => {
    trackEvent('paywall_start_trial');
  };
  const handlePaywallDismiss = () => {
    trackEvent('paywall_dismiss');
    setShowSoftPaywall(false);
  };
  const handlePaywallNavigatePricing = () => {
    setShowSoftPaywall(false);
    onNavigate('pricing');
  };

  // Detect desktop for Focus Mode (Chrome extension only works on desktop)
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const h = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);

  // Summarizer state
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{ summary: string; originalWordCount: number; summaryWordCount: number } | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);
  
  // Study Pack state (unified generation: quiz + flashcards + crossword + lesson + crater blast)
  const [, setStudyPackResult] = useState<any>(null);
  const [isGeneratingStudyPack, setIsGeneratingStudyPack] = useState(false);
  const [studyPackError, setStudyPackError] = useState('');
  // Quiz generator state (legacy, kept for viewing saved items)
  const [studyToolMode] = useState<'quiz' | 'flashcards' | 'crossword' | 'crater_blast'>('quiz');
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [isGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizError, setQuizError] = useState('');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number; answer: string; isCorrect: boolean}[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizRetakeKey, setQuizRetakeKey] = useState(0);

  const dashboardDisplayedQuestions = useMemo((): Array<{ id: number; type: string; question: string; options?: string[]; correctAnswer: string; explanation?: string }> => {
    if (!quizResult?.questions?.length) return [];
    const displayCount = quizResult.questionCount ?? quizResult.displayCount ?? quizResult.questions.length;
    return shuffleAndTake(quizResult.questions, Math.min(displayCount, quizResult.questions.length));
  }, [quizResult, quizRetakeKey]);

  // Flashcard state
  const [flashcardResult, setFlashcardResult] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [isGeneratingFlashcards] = useState(false);
  
  // Document upload for study tools (quiz, flashcards, crossword)
  const studyToolsFileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingStudyDoc, setIsParsingStudyDoc] = useState(false);

  // Inline analyze: parse file into essay textarea (same API as study pack)
  const analyzeFileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingAnalyzeDoc, setIsParsingAnalyzeDoc] = useState(false);
  const [analyzeDropActive, setAnalyzeDropActive] = useState(false);
  const [analyzeUploadError, setAnalyzeUploadError] = useState('');

  // Crossword state
  const [crosswordResult, setCrosswordResult] = useState<any>(null);
  const [crosswordWordCount, setCrosswordWordCount] = useState(10);
  const [isGeneratingCrossword] = useState(false);
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<string, string>>({});
  const [crosswordChecked, setCrosswordChecked] = useState(false);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [hintsUsed, setHintsUsed] = useState(0);
  
  // Upgrade modal state (for locked features like export)
  const [showExportUpgradeModal, setShowExportUpgradeModal] = useState(false);

  // Friends notification count (pending requests + incoming shares)
  const [friendNotificationCount, setFriendNotificationCount] = useState(0);

  // Fetch friend notifications count (skipped when HIDE_FRIENDS)
  useEffect(() => {
    if (HIDE_FRIENDS) return;
    const fetchFriendNotifications = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      try {
        const [requestsRes, sharesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/friends/requests/pending`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/friends/share-requests/incoming`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
        ]);
        
        let count = 0;
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          count += (requestsData.data || []).length;
        }
        if (sharesRes.ok) {
          const sharesData = await sharesRes.json();
          count += (sharesData.data || []).length;
        }
        setFriendNotificationCount(count);
      } catch (err) {
        console.error('Error fetching friend notifications:', err);
      }
    };
    
    fetchFriendNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchFriendNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge notifications now shown globally via BadgeNotificationToast (event from achievements.ts)

  // Ebook banner: show for 24 hours after first dashboard visit, or until user dismisses (per-user, never show again after X)
  const EBOOK_BANNER_MS = 24 * 60 * 60 * 1000;
  const [showEbookBanner, setShowEbookBanner] = useState(true);
  const [ebookBannerDismissed, setEbookBannerDismissed] = useState(() => {
    const uid = user?.id || 'anon';
    return localStorage.getItem(`writescholar_ebook_banner_dismissed_${uid}`) === '1';
  });
  useEffect(() => {
    const uid = user?.id || 'anon';
    const firstSeenKey = `writescholar_ebook_banner_first_seen_${uid}`;
    const dismissedKey = `writescholar_ebook_banner_dismissed_${uid}`;
    const dismissed = localStorage.getItem(dismissedKey) === '1';
    setEbookBannerDismissed(dismissed);
    if (dismissed) {
      setShowEbookBanner(false);
      return;
    }
    const raw = localStorage.getItem(firstSeenKey);
    const firstSeen = raw ? parseInt(raw, 10) : null;
    const now = Date.now();
    if (firstSeen == null) {
      localStorage.setItem(firstSeenKey, String(now));
      setShowEbookBanner(true);
    } else {
      setShowEbookBanner(now - firstSeen < EBOOK_BANNER_MS);
    }
  }, [user?.id]);
  const dismissEbookBanner = () => {
    const uid = user?.id || 'anon';
    const dismissedKey = `writescholar_ebook_banner_dismissed_${uid}`;
    localStorage.setItem(dismissedKey, '1');
    setEbookBannerDismissed(true);
    setShowEbookBanner(false);
  };
  
  const [quizUsage, setQuizUsage] = useState({
    generationsUsed: 0,
    generationLimit: 2,
    generationsRemaining: 2,
    maxWordsPerGeneration: 5000,
    wordsUsed: 0,
    wordLimit: 15000,
    plan: 'free',
    daysUntilReset: undefined as number | undefined
  });

  // Welcome tutorial — Supabase is source of truth. true = never show again.
  const showWelcomeTutorial = Boolean(
    user?.id &&
    (user as any).onboardingCompleted === true &&
    (user as any).welcomeTutorialCompleted !== true
  );

  // Deferred paywall: show after first success (recentActivity) or return visit — not immediately after tutorial
  useEffect(() => {
    if (!user?.id || showInteractiveTutorial || showWelcomeTutorial) return;
    try {
      const deferred = localStorage.getItem(`writescholar_paywall_deferred_${user.id}`) === 'true';
      const alreadyShown = localStorage.getItem(`writescholar_soft_paywall_shown_${user.id}`) === '1';
      if (!deferred || alreadyShown) return;

      const firstLoginDate = localStorage.getItem(`writescholar_first_login_${user.id}`);
      const today = new Date().toDateString();
      const isReturnVisit = Boolean(firstLoginDate && firstLoginDate !== today);
      const hasActivity = !isActivityLoading && recentActivity.length > 0;

      if (hasActivity || isReturnVisit) {
        localStorage.removeItem(`writescholar_paywall_deferred_${user.id}`);
        localStorage.setItem(`writescholar_soft_paywall_shown_${user.id}`, '1');
        trackEvent('paywall_view', { trigger: hasActivity ? 'first_success' : 'return_visit' });
        setShowSoftPaywall(true);
      }
    } catch (_) {}
  }, [user?.id, showInteractiveTutorial, showWelcomeTutorial, isActivityLoading, recentActivity.length]);

  const [usageStats, setUsageStats] = useState({
    documentsUploaded: 0,
    documentsAnalyzed: 0,
    citationSearchesUsed: 0,
    studyPacksGenerated: 0,
    storageUsed: 0,
    storageLimit: 0,
    uploadsRemaining: 0,
    analysesRemaining: 0,
    citationsRemaining: 0,
    studyPacksRemaining: 0,
    plan: 'free',
    daysUntilReset: 30,
    planLimits: {
      documentsPerMonth: 3,
      analysesPerMonth: 2,
      citationSearchesPerMonth: 2,
      studyPackGenerationsPerMonth: 2,
      maxDocumentSize: 1024 * 1024,
      name: 'Free'
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const hasCompletedFirstAnalysis =
    (usageStats.documentsAnalyzed ?? 0) > 0 ||
    recentActivity.some((a) => a.type === 'analysis');
  const showFirstAnalysisOnboarding =
    Boolean(user) && !hasCompletedFirstAnalysis && !loadingStats && !isActivityLoading;

  useEffect(() => {
    if (showFirstAnalysisOnboarding) trackEvent('first_action_prompt_view');
  }, [showFirstAnalysisOnboarding]);

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant AI feedback on your writing...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
  ];

  const summarizePlaceholders = [
    "Paste your article, paper, or document to summarize...",
    "Transform lengthy content into key points...",
    "Get concise summaries in seconds..."
  ];

  const quizPlaceholders = [
    "Paste content to generate quiz questions...",
    "Turn any text into an interactive quiz...",
    "Test your knowledge with AI-generated questions..."
  ];

  const placeholders = mode === 'summarize' ? summarizePlaceholders 
    : mode === 'quiz' ? quizPlaceholders 
    : mode === 'analyze' ? analyzePlaceholders 
    : citationPlaceholders;

  const hasDoneCitation = recentActivity.some((a) => a.type === 'citation');
  const hasDoneStudyPack = recentActivity.some((a) =>
    ['quiz', 'flashcard', 'crossword', 'lesson', 'study_pack'].includes(a.type)
  );
  const showFirstCitationPrompt = !!user && !hasDoneCitation;
  const showFirstStudyPackPrompt = !!user && !hasDoneStudyPack;

  const suggestedTopics = mode === 'analyze' ? [
    "Analyze my essay structure",
    "Check my thesis statement",
    "Review my argument flow",
    "Improve my conclusion"
  ] : [
    "Effects of social media on teenagers",
    "Climate change mitigation strategies",
    "AI in healthcare applications",
    "Remote work productivity research"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    fetchDocuments();
    fetchUsageStats();
    // Sync streak data for achievements
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/streaks`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            syncFromAPIData({
              currentStreak: data.data.currentStreak,
              longestStreak: data.data.longestStreak,
            });
          }
        }
      } catch { /* ignore */ }
    })();
    // Check time-based achievements on dashboard load
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 4) trackAction('used_after_10pm', true);
    if (hour >= 4 && hour < 7) trackAction('used_before_7am', true);
  }, []);

  // Fetch quiz usage when switching to quiz mode
  useEffect(() => {
    if (mode === 'quiz') {
      fetchQuizUsage();
    }
  }, [mode]);

  const fetchQuizUsage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/study-pack-usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuizUsage({
            generationsUsed: data.data.generationsUsed || 0,
            generationLimit: data.data.generationLimit ?? 2,
            generationsRemaining: data.data.generationsRemaining ?? 2,
            maxWordsPerGeneration: data.data.maxWordsPerGeneration || 5000,
            wordsUsed: 0,
            wordLimit: 999999,
            plan: data.data.plan || 'free',
            daysUntilReset: data.data.daysUntilReset
          });
        }
      }
    } catch (error) {
      console.error('Error fetching study pack usage:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
        syncFromAPIData({
          documentsUploaded: data.documentsUploaded,
          documentsAnalyzed: data.documentsAnalyzed,
          plan: data.plan,
        });
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const processDocuments = async (documents: any[]) => {
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        const analysisResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${doc.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        
        let hasAnalysis = false;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          hasAnalysis = analysisResult.data && analysisResult.data.length > 0;
        }
        
        return { ...doc, hasAnalysis };
      })
    );
    setDocuments(docsWithAnalysis);
  };

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        await processDocuments(result.data.documents || []);
      } else if (result.error?.includes('401')) {
          try {
            const refreshResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.post('/auth/refresh', {}, token),
              { token: null }
            );
            
            if (refreshResult.success && refreshResult.data?.token) {
            localStorage.setItem('authToken', refreshResult.data.token);
            window.dispatchEvent(new CustomEvent('writescholar-auth-changed'));
              const retryToken = refreshResult.data.token ?? undefined;
              const retryResult = await BulletproofAPI.safeRequest(
                () => BulletproofAPI.get('/documents', retryToken),
                { documents: [] }
              );
              if (retryResult.success) {
                await processDocuments(retryResult.data.documents || []);
              }
            } else {
            onLogout();
          }
        } catch {
          onLogout();
        }
      } else {
        await processDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      await processDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Build recent activity feed from documents + study tools + citations
  useEffect(() => {
    const buildActivity = async () => {
      try {
        setIsActivityLoading(true);
        const activities: ActivityItem[] = [];
        const token = localStorage.getItem('authToken');

        // Documents & analyses
        documents.forEach((doc: any) => {
          activities.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: doc.title,
            subtitle: `${(doc.fileType || 'doc').toUpperCase()} · ${doc.wordCount || 0} words`,
            date: new Date(doc.createdAt),
            navigateTo: 'library',
          });
          if (doc.hasAnalysis) {
            activities.push({
              id: `analysis-${doc.id}`,
              type: 'analysis',
              title: doc.title,
              subtitle: 'Essay feedback completed',
              date: new Date(new Date(doc.createdAt).getTime() + 60000),
              navigateTo: 'library',
            });
          }
        });

        if (token) {
          try {
            const quizRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              (quizData.data || []).forEach((tool: any) => {
                const typeMap: Record<string, ActivityItem['type']> = {
                  study_pack: 'study_pack',
                  flashcards: 'flashcard',
                  crossword: 'crossword',
                  lesson: 'lesson',
                };
                const activityType: ActivityItem['type'] = typeMap[tool.quiz_type] || 'quiz';
                const isStudyPack = tool.quiz_type === 'study_pack';
                const isLesson = tool.quiz_type === 'lesson';
                const countLabel = isStudyPack
                  ? '5 formats'
                  : isLesson
                    ? (tool.question_count ? `${tool.question_count} slides` : '')
                    : (tool.question_count ? `${tool.question_count} questions` : '');
                const diffLabel = isStudyPack ? '' : (tool.difficulty ? ` · ${tool.difficulty}` : '');
                const navMap: Record<string, string> = {
                  study_pack: 'study-pack-viewer',
                  flashcards: 'create-flashcards',
                  crossword: 'crossword-generator',
                  crater_blast: 'crater-blast',
                  lesson: 'study-pack-viewer',
                };
                const navigateTo = navMap[tool.quiz_type] || 'quiz-generator';
                activities.push({
                  id: `tool-${tool.id}`,
                  type: activityType,
                  title: tool.title || 'Study Tool',
                  subtitle: `${countLabel}${diffLabel}`.trim() || activityMeta[activityType].label,
                  date: new Date(tool.created_at),
                  navigateTo,
                  toolData: tool,
                  expires_at: tool.expires_at ?? null,
                });
              });
            }
          } catch { /* silently skip */ }

          try {
            const citeRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-history`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (citeRes.ok) {
              const citeData = await citeRes.json();
              (citeData.data || []).forEach((search: any) => {
                const citationCount = search.search_results?.citations?.length;
                activities.push({
                  id: `cite-${search.id}`,
                  type: 'citation',
                  title: search.research_topic,
                  subtitle: `${search.citation_style}${citationCount ? ` · ${citationCount} sources` : ''}`,
                  date: new Date(search.created_at),
                  navigateTo: 'citation-history',
                  expires_at: search.expires_at ?? null,
                });
              });
            }
          } catch { /* silently skip */ }
        }

        activities.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(activities);
      } finally {
        setIsActivityLoading(false);
      }
    };

    buildActivity();
  }, [documents]);

  const activityWithoutHumanize = recentActivity.filter(a => a.type !== 'humanize');
  const filteredActivity = searchQuery.trim()
    ? activityWithoutHumanize.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activityMeta[a.type]?.label ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activityWithoutHumanize;

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.toolData) {
      const t = activity.toolData;
      if (t.quiz_type === 'study_pack') {
        try {
          const packData = t.questions || t;
          const packTitle = t.title || packData?.quiz?.title || packData?.flashcards?.title || packData?.lesson?.title || 'Study Pack';
          sessionStorage.setItem('writescholar_study_pack_viewer', JSON.stringify({ data: packData, title: packTitle }));
          onNavigate('study-pack-viewer', undefined, { studyPack: { data: packData, title: packTitle } });
        } catch (_) {
          onNavigate('study-pack-viewer');
        }
      } else {
        localStorage.setItem('writescholar_minimal_ui', 'true');
        if (t.quiz_type === 'flashcards') {
          localStorage.setItem('savedFlashcards', JSON.stringify({
            title: t.title || 'Flashcards',
            questions: t.questions || [],
            source_word_count: t.source_word_count ?? 0,
          }));
          onNavigate('create-flashcards');
        } else if (t.quiz_type === 'crossword') {
          localStorage.setItem('savedCrossword', JSON.stringify(t));
          onNavigate('crossword-generator');
        } else if (t.quiz_type === 'crater_blast') {
          localStorage.setItem('savedCraterBlast', JSON.stringify(t));
          onNavigate('crater-blast');
        } else if (t.quiz_type === 'lesson') {
          try {
            const packData = { lesson: { slides: t.questions || [], title: t.title || 'Lesson', style: t.difficulty || 'visual' } };
            const packTitle = t.title || 'Lesson';
            sessionStorage.setItem('writescholar_study_pack_viewer', JSON.stringify({ data: packData, title: packTitle }));
            sessionStorage.setItem('writescholar_study_pack_return_tab', 'lesson');
            onNavigate('study-pack-viewer', undefined, { studyPack: { data: packData, title: packTitle } });
          } catch (_) {
            onNavigate('study-pack-viewer');
          }
        } else {
          localStorage.setItem('savedQuiz', JSON.stringify(t));
          onNavigate('quiz-generator');
        }
      }
    } else {
      onNavigate(activity.navigateTo);
    }
    setSearchQuery('');
  };

  const handleEnlargeQuiz = () => {
    if (!quizResult?.questions?.length) return;
    const payload = {
      title: quizResult.title || 'Quiz',
      questions: quizResult.questions,
      quiz_type: quizResult.quizType || quizResult.quiz_type || 'mixed',
      difficulty: quizResult.difficulty || 'medium',
      question_count: quizResult.questionCount ?? quizResult.questions?.length ?? 10,
      source_word_count: quizResult.sourceWordCount ?? 0
    };
    localStorage.setItem('savedQuiz', JSON.stringify(payload));
    onNavigate('quiz-generator');
  };

  const handleEnlargeFlashcards = () => {
    if (!flashcardResult?.cards?.length) return;
    const payload = {
      title: flashcardResult.title || 'Flashcards',
      questions: flashcardResult.cards,
      source_word_count: flashcardResult.sourceWordCount ?? 0
    };
    localStorage.setItem('savedFlashcards', JSON.stringify(payload));
    onNavigate('create-flashcards');
  };

  const handleEnlargeCrossword = () => {
    if (!crosswordResult?.placedWords?.length) return;
    const payload = {
      title: crosswordResult.title || 'Crossword',
      questions: {
        grid: crosswordResult.grid,
        clues: crosswordResult.clues,
        gridSize: crosswordResult.gridSize,
        placedWords: crosswordResult.placedWords
      },
      source_word_count: crosswordResult.sourceWordCount ?? 0
    };
    localStorage.setItem('savedCrossword', JSON.stringify(payload));
    onNavigate('crossword-generator');
  };

  const handleEnlargeSummarize = () => {
    if (!summaryResult) return;
    localStorage.setItem('summarizerOpenData', JSON.stringify({ inputText, summaryResult, summaryStyle, summaryLength }));
    onNavigate('summarizer');
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const isPaidUser = usageStats.plan === 'pro' || usageStats.plan === 'premium' || usageStats.plan === 'focus';
  const isFreeUser = usageStats.plan === 'free';
  const combinedActionsRemaining = (usageStats as { combinedActionsRemaining?: number }).combinedActionsRemaining;
  const combinedPoolExhausted =
    isPaidUser &&
    typeof combinedActionsRemaining === 'number' &&
    combinedActionsRemaining <= 0;
  const canUseQuiz = isPaidUser || (isFreeUser && (quizUsage.generationLimit === -1 || quizUsage.generationsRemaining > 0));
  const quizExhausted = isFreeUser && quizUsage.generationLimit !== -1 && quizUsage.generationsRemaining <= 0;
  /** Free: study-pack-only quota; Pro: shared 99/mo pool (analyses + citations + study packs) */
  const studyPackSectionExhausted = quizExhausted || combinedPoolExhausted;
  
  const humanizeSummarizeMaxWords = isFreeUser ? 5000 : 15000;

  const isTextValid = () => {
    if (mode === 'citations') return inputText.trim().length > 0;
    if (mode === 'summarize') return getWordCount(inputText) >= 50 && getWordCount(inputText) <= humanizeSummarizeMaxWords;
    if (mode === 'quiz') {
      const wordCount = getWordCount(inputText);
      const maxWords = quizUsage.maxWordsPerGeneration || 15000;
      return wordCount >= 50 && wordCount <= maxWords;
    }
    return getWordCount(inputText) >= 200;
  };

  const handleCitationSearch = async () => {
    if (inputText.trim().length === 0) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }

    try {
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);
      try { sessionStorage.setItem('writescholar_dashboard_draft', inputText); } catch (_) {}
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to search for citations');
        onNavigate('login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Calculate year filter
      const currentYear = new Date().getFullYear();
      let minYear = null;
      if (citationYearRange !== 'all') {
        minYear = currentYear - parseInt(citationYearRange);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          researchTopic: inputText,
          citationStyle: citationStyle,
          numberOfCitations: 10,
          minYear: minYear,
          yearRange: citationYearRange
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Citation search failed');
      }

      if (data.success && data.data) {
        try { sessionStorage.removeItem('writescholar_dashboard_draft'); } catch (_) {}
        localStorage.setItem('citationSearchResults', JSON.stringify(data.data));
        const wasFirst = (getStats().citations_count || 0) === 0;
        trackAction('citations_count');
        if (wasFirst) trackEvent('first_citation');
        onNavigate('citation-results');
      } else {
        throw new Error('No citation results received');
      }

    } catch (error) {
      console.error('Citation search error:', error);
      try { sessionStorage.setItem('writescholar_dashboard_draft', inputText); } catch (_) {}
      fetchUsageStats();
      alert(error instanceof Error ? error.message : 'Failed to search for citations. Please try again.');
    } finally {
      setIsSearchingCitations(false);
      setShowSearchAnimation(false);
    }
  };

  const handleAnalyze = () => {
    const wordCount = getWordCount(inputText);
    
    if (wordCount < 200) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }
    
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    localStorage.setItem('textAnalysisContent', inputText);
    trackAction('analyses_count');
    
    setTimeout(() => setAnalysisComplete(true), 2000);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      onNavigate('analysis');
    }, 4000);
  };

  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const parseFileInputRef = useRef<HTMLInputElement>(null);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, style: summaryStyle, length: summaryLength })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Summarization failed');
      setSummaryResult(data.data);
      trackAction('summaries_count');
    } catch (error: any) {
      setSummaryError(error.message || 'Summarization failed. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateStudyPack = async () => {
    if (studyPackSectionExhausted) {
      setStudyPackError(
        combinedPoolExhausted
          ? "You've used all 99 combined actions (analyses, study packs & citations) this billing period. Your limit resets when your plan renews."
          : "You've used all study pack generations this period. Upgrade for more."
      );
      return;
    }
    const wordCount = getWordCount(inputText);
    if (wordCount < 50) {
      setStudyPackError('Please enter at least 50 words to generate a study pack.');
      return;
    }
    setIsGeneratingStudyPack(true);
    setStudyPackError('');
    setStudyPackResult(null);
    try { sessionStorage.setItem('writescholar_dashboard_draft', inputText); } catch (_) {}
    // Prefetch StudyPackViewerPage chunk so it's ready when we navigate (reduces load failures)
    import('../pages/StudyPackViewerPage').catch(() => {});
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-study-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Study pack generation failed');
      setStudyPackResult(data.data);
      const wasFirst = (getStats().study_packs_count || 0) === 0;
      if (wasFirst) trackEvent('first_study_pack');
      const packTitle = data.data?.quiz?.title || data.data?.flashcards?.title || data.data?.lesson?.title || 'Study Pack';
      // Write to sessionStorage as fallback (e.g. refresh, recents)
      try {
        sessionStorage.setItem('writescholar_study_pack_viewer', JSON.stringify({ data: data.data, title: packTitle }));
      } catch (_) {}
      try { sessionStorage.removeItem('writescholar_dashboard_draft'); } catch (_) {}
      onNavigate('study-pack-viewer', undefined, { studyPack: { data: data.data, title: packTitle } });
      // Track study pack generation with word count for achievements
      const wordCount = inputText.trim().split(/\s+/).length;
      trackStudyPackGenerated(wordCount);
      fetchQuizUsage();
    } catch (error: any) {
      setStudyPackError(error.message || 'Study pack generation failed. Please try again.');
      try { sessionStorage.setItem('writescholar_dashboard_draft', inputText); } catch (_) {}
      fetchQuizUsage();
    } finally {
      setIsGeneratingStudyPack(false);
    }
  };

  const handleStudyToolsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate?.('signup');
      return;
    }
    setIsParsingStudyDoc(true);
    setQuizError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      setQuizError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingStudyDoc(false);
    }
  };

  const processAnalyzeFileForEssay = async (file: File) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate?.('signup');
      return;
    }
    setIsParsingAnalyzeDoc(true);
    setAnalyzeUploadError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/analysis/parse-document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
      setShowWordWarning(false);
    } catch (err: any) {
      setAnalyzeUploadError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingAnalyzeDoc(false);
    }
  };

  const handleAnalyzeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processAnalyzeFileForEssay(file);
  };

  const handleAnalyzeDropZoneDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setAnalyzeDropActive(true);
    } else if (e.type === 'dragleave') {
      setAnalyzeDropActive(false);
    }
  };

  const handleAnalyzeDropZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzeDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAnalyzeFileForEssay(file);
  };

  // Get the letter at a specific cell position based on user's answers
  // Check ALL words at this cell (shared across/down) and return first non-empty letter
  const getCellLetter = (rowIdx: number, colIdx: number): string => {
    if (!crosswordResult?.placedWords) return '';
    const wordsAtCell = getWordsAtCell(rowIdx, colIdx);
    for (const pw of wordsAtCell) {
      const answer = crosswordAnswers[`word-${pw.number}`] || '';
      const letterIndex = pw.direction === 'across' ? colIdx - pw.col : rowIdx - pw.row;
      if (letterIndex >= 0 && letterIndex < answer.length) {
        const ch = answer[letterIndex];
        if (ch && /[A-Za-z]/.test(ch)) return ch.toUpperCase();
      }
    }
    return '';
  };

  // Get word(s) that pass through a specific cell
  const getWordsAtCell = (rowIdx: number, colIdx: number): any[] => {
    if (!crosswordResult?.placedWords) return [];
    return crosswordResult.placedWords.filter((pw: any) => {
      if (pw.direction === 'across') {
        return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
      }
      return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
    });
  };

  // Handle cell click in crossword
  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (crosswordChecked) return;
    
    const wordsAtCell = getWordsAtCell(rowIdx, colIdx);
    if (wordsAtCell.length === 0) return;
    
    // If clicking the same cell, toggle direction
    if (selectedCell?.row === rowIdx && selectedCell?.col === colIdx) {
      const hasAcross = wordsAtCell.some((pw: any) => pw.direction === 'across');
      const hasDown = wordsAtCell.some((pw: any) => pw.direction === 'down');
      if (hasAcross && hasDown) {
        setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
        const newWord = wordsAtCell.find((pw: any) => pw.direction === (selectedDirection === 'across' ? 'down' : 'across'));
        if (newWord) setSelectedClue(newWord.number);
      }
    } else {
      setSelectedCell({ row: rowIdx, col: colIdx });
      // Prefer the current direction if available, otherwise use whatever is available
      const preferredWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection);
      const word = preferredWord || wordsAtCell[0];
      if (word) {
        setSelectedDirection(word.direction);
        setSelectedClue(word.number);
      }
    }
  };

  // Handle keyboard input for crossword
  const handleCrosswordKeyDown = (e: React.KeyboardEvent) => {
    if (crosswordChecked || !selectedCell || !crosswordResult) return;
    
    const { row, col } = selectedCell;
    const wordsAtCell = getWordsAtCell(row, col);
    const currentWord = wordsAtCell.find((pw: any) => pw.direction === selectedDirection) || wordsAtCell[0];
    
    if (!currentWord) return;
    
    const answerKey = `word-${currentWord.number}`;
    const currentAnswer = crosswordAnswers[answerKey] || '';
    
    // Calculate position in the word
    const letterIndex = selectedDirection === 'across' 
      ? col - currentWord.col 
      : row - currentWord.row;
    
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      // Build new answer with the letter at the correct position
      let newAnswer = currentAnswer.split('');
      while (newAnswer.length <= letterIndex) newAnswer.push('');
      newAnswer[letterIndex] = letter;
      setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
      
      // Move to next cell
      if (letterIndex < currentWord.length - 1) {
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col + 1 });
        } else {
          setSelectedCell({ row: row + 1, col });
        }
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      let newAnswer = currentAnswer.split('');
      if (letterIndex < newAnswer.length && newAnswer[letterIndex]) {
        // Delete current cell
        newAnswer[letterIndex] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
      } else if (letterIndex > 0) {
        // Move back and delete
        newAnswer[letterIndex - 1] = '';
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('').replace(/\s+$/, '') });
        if (selectedDirection === 'across') {
          setSelectedCell({ row, col: col - 1 });
        } else {
          setSelectedCell({ row: row - 1, col });
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = col + 1;
      if (crosswordResult.grid[row] && crosswordResult.grid[row][nextCol] !== '' && crosswordResult.grid[row][nextCol] !== undefined) {
        setSelectedCell({ row, col: nextCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, nextCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevCol = col - 1;
      if (prevCol >= 0 && crosswordResult.grid[row] && crosswordResult.grid[row][prevCol] !== '' && crosswordResult.grid[row][prevCol] !== undefined) {
        setSelectedCell({ row, col: prevCol });
        setSelectedDirection('across');
        const newWords = getWordsAtCell(row, prevCol);
        const newWord = newWords.find((pw: any) => pw.direction === 'across') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = row + 1;
      if (crosswordResult.grid[nextRow] && crosswordResult.grid[nextRow][col] !== '' && crosswordResult.grid[nextRow][col] !== undefined) {
        setSelectedCell({ row: nextRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(nextRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = row - 1;
      if (prevRow >= 0 && crosswordResult.grid[prevRow] && crosswordResult.grid[prevRow][col] !== '' && crosswordResult.grid[prevRow][col] !== undefined) {
        setSelectedCell({ row: prevRow, col });
        setSelectedDirection('down');
        const newWords = getWordsAtCell(prevRow, col);
        const newWord = newWords.find((pw: any) => pw.direction === 'down') || newWords[0];
        if (newWord) setSelectedClue(newWord.number);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Move to next word
      const currentWordIndex = crosswordResult.placedWords.findIndex((pw: any) => pw.number === selectedClue);
      const nextWordIndex = (currentWordIndex + 1) % crosswordResult.placedWords.length;
      const nextWord = crosswordResult.placedWords[nextWordIndex];
      if (nextWord) {
        setSelectedClue(nextWord.number);
        setSelectedDirection(nextWord.direction);
        setSelectedCell({ row: nextWord.row, col: nextWord.col });
      }
    }
  };

  // Reveal one unfilled letter from the selected word (or any word if none selected)
  const handleCrosswordHint = () => {
    if (!crosswordResult?.placedWords || crosswordChecked) return;

    // Prefer the currently selected word, otherwise pick first word with missing letters
    const candidateWords = selectedClue !== null
      ? crosswordResult.placedWords.filter((pw: any) => pw.number === selectedClue)
      : crosswordResult.placedWords;

    for (const pw of candidateWords) {
      const answerKey = `word-${pw.number}`;
      const currentAnswer = (crosswordAnswers[answerKey] || '').split('');

      // Find the first missing or wrong letter in this word
      let hintIndex = -1;
      for (let i = 0; i < pw.word.length; i++) {
        if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
          hintIndex = i;
          break;
        }
      }

      if (hintIndex >= 0) {
        // Fill in that letter
        const newAnswer = currentAnswer.slice();
        while (newAnswer.length <= hintIndex) newAnswer.push('');
        newAnswer[hintIndex] = pw.word[hintIndex];
        setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });

        // Move cell selection to the hinted position
        if (pw.direction === 'across') {
          setSelectedCell({ row: pw.row, col: pw.col + hintIndex });
        } else {
          setSelectedCell({ row: pw.row + hintIndex, col: pw.col });
        }
        setSelectedClue(pw.number);
        setSelectedDirection(pw.direction);
        setHintsUsed(h => h + 1);
        return;
      }
    }

    // If selected word is fully correct, fall back to any word with missing letters
    if (selectedClue !== null) {
      for (const pw of crosswordResult.placedWords) {
        const answerKey = `word-${pw.number}`;
        const currentAnswer = (crosswordAnswers[answerKey] || '').split('');
        for (let i = 0; i < pw.word.length; i++) {
          if (!currentAnswer[i] || currentAnswer[i] !== pw.word[i]) {
            const newAnswer = currentAnswer.slice();
            while (newAnswer.length <= i) newAnswer.push('');
            newAnswer[i] = pw.word[i];
            setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newAnswer.join('') });
            if (pw.direction === 'across') {
              setSelectedCell({ row: pw.row, col: pw.col + i });
            } else {
              setSelectedCell({ row: pw.row + i, col: pw.col });
            }
            setSelectedClue(pw.number);
            setSelectedDirection(pw.direction);
            setHintsUsed(h => h + 1);
            return;
          }
        }
      }
    }
  };

  const exportQuizToPDF = () => {
    if (!quizResult) return;
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(quizResult.title || 'Quiz', 170);
    doc.text(titleText, margin, yPos);
    yPos += titleText.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${dashboardDisplayedQuestions.length}`, margin, yPos);
    yPos += 15;

    dashboardDisplayedQuestions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, margin, yPos);
      yPos += splitQuestion.length * lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (q.type === 'true_false') {
        doc.text('   [ ] True    [ ] False', margin, yPos);
        yPos += lineHeight;
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
          const optText = `   [ ] ${opt}`;
          const splitOpt = doc.splitTextToSize(optText, 165);
          doc.text(splitOpt, margin, yPos);
          yPos += splitOpt.length * lineHeight;
        });
      }
      yPos += 8;
    });

    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    dashboardDisplayedQuestions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(expText, margin, yPos);
        yPos += expText.length * lineHeight + 3;
      }
    });

    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async () => {
    if (!quizResult) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: quizResult.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${dashboardDisplayedQuestions.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    dashboardDisplayedQuestions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
      if (q.type === 'true_false') {
        children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          children.push(new Paragraph({ text: `   ☐ ${opt}` }));
        });
      }
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    dashboardDisplayedQuestions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `quiz-${Date.now()}.docx`);
    trackExport();
  };

  const exportFlashcardsToPDF = () => {
    if (!flashcardResult?.cards?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(flashcardResult.title || 'Flashcards', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${flashcardResult.cards.length} cards`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    flashcardResult.cards.forEach((card: any, idx: number) => {
      if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }

      // Card number
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 120, 0);
      doc.text(`Card ${idx + 1}`, margin, yPos);
      doc.setTextColor(0);
      yPos += 6;

      // Front
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Front:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const frontLines = doc.splitTextToSize(card.front || '', 165);
      doc.text(frontLines, margin + 4, yPos);
      yPos += frontLines.length * 6 + 4;

      // Back
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('Back:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 100, 60);
      const backLines = doc.splitTextToSize(card.back || '', 165);
      doc.text(backLines, margin + 4, yPos);
      doc.setTextColor(0);
      yPos += backLines.length * 6 + 10;

      // Divider
      if (idx < flashcardResult.cards.length - 1) {
        doc.setDrawColor(220);
        doc.line(margin, yPos - 4, 190, yPos - 4);
      }
    });

    doc.save(`flashcards-${Date.now()}.pdf`);
  };

  const exportFlashcardsToDOCX = async () => {
    if (!flashcardResult?.cards?.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: flashcardResult.title || 'Flashcards', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${flashcardResult.cards.length} cards`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    flashcardResult.cards.forEach((card: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Card ${idx + 1}`, bold: true, color: 'B47800', size: 20 })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Front: ', bold: true }), new TextRun({ text: card.front || '' })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Back: ', bold: true }), new TextRun({ text: card.back || '', color: '3C643C' })] }));
      children.push(new Paragraph({ text: '' }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `flashcards-${Date.now()}.docx`);
    trackExport();
  };

  const exportFlashcardsToJSON = () => {
    if (!flashcardResult?.cards?.length) return;
    const data = {
      title: flashcardResult.title || 'Flashcards',
      cards: flashcardResult.cards.map((c: any) => ({ front: c.front || '', back: c.back || '' })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flashcards-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    trackExport();
  };

  const exportCrosswordToPDF = () => {
    if (!crosswordResult?.placedWords?.length) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(crosswordResult.title || 'Crossword', 170);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 8 + 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${crosswordResult.placedWords.length} words`, margin, yPos);
    doc.setTextColor(0);
    yPos += 12;

    // Draw crossword grid
    const grid = crosswordResult.grid;
    if (grid?.length) {
      const cellSize = Math.min(8, Math.floor(160 / grid[0].length));
      const gridStartX = margin;
      const gridStartY = yPos;

      grid.forEach((row: string[], ri: number) => {
        row.forEach((cell: string, ci: number) => {
          const x = gridStartX + ci * cellSize;
          const y = gridStartY + ri * cellSize;
          if (cell !== '') {
            doc.setDrawColor(100, 100, 100);
            doc.setFillColor(255, 255, 255);
            doc.rect(x, y, cellSize, cellSize, 'FD');
            // Cell number
            const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === ri && pw.col === ci);
            if (wordAtCell) {
              doc.setFontSize(4);
              doc.setTextColor(80, 80, 80);
              doc.text(String(wordAtCell.number), x + 0.5, y + 3.5);
              doc.setTextColor(0, 0, 0);
            }
          } else {
            doc.setFillColor(40, 40, 40);
            doc.rect(x, y, cellSize, cellSize, 'F');
          }
        });
      });

      yPos = gridStartY + grid.length * cellSize + 14;
    }

    // Clues
    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords
        .filter((pw: any) => pw.direction === dir)
        .sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;

      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(dir === 'across' ? 'Across' : 'Down', margin, yPos);
      yPos += 8;

      words.forEach((pw: any) => {
        if (yPos > pageHeight - 15) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const clueText = doc.splitTextToSize(`${pw.number}. ${pw.clue} (${pw.word.length} letters)`, 165);
        doc.text(clueText, margin + 2, yPos);
        yPos += clueText.length * 6 + 2;
      });
      yPos += 4;
    });

    // Answer key
    if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 8;
    const allWords = [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number);
    allWords.forEach((pw: any) => {
      if (yPos > pageHeight - 12) { doc.addPage(); yPos = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pw.number}. ${pw.word} (${pw.direction})`, margin + 2, yPos);
      yPos += 6;
    });

    doc.save(`crossword-${Date.now()}.pdf`);
  };

  const exportCrosswordToDOCX = async () => {
    if (!crosswordResult?.placedWords?.length) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: crosswordResult.title || 'Crossword', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${crosswordResult.placedWords.length} words`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    ['across', 'down'].forEach(dir => {
      const words = crosswordResult.placedWords
        .filter((pw: any) => pw.direction === dir)
        .sort((a: any, b: any) => a.number - b.number);
      if (!words.length) return;

      children.push(new Paragraph({ text: dir === 'across' ? 'Across' : 'Down', heading: HeadingLevel.HEADING_2 }));
      words.forEach((pw: any) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.clue} (${pw.word.length} letters)` })] }));
      });
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    const allWords = [...crosswordResult.placedWords].sort((a: any, b: any) => a.number - b.number);
    allWords.forEach((pw: any) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${pw.number}. `, bold: true }), new TextRun({ text: `${pw.word}`, color: '1A5C1A' }), new TextRun({ text: ` (${pw.direction})`, italics: true, color: '666666' })] }));
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `crossword-${Date.now()}.docx`);
    trackExport();
  };

  const handleParseDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setIsParsingDoc(true);
    setSummaryError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/parse-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to parse document');
      setInputText(data.data.content || '');
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to parse document');
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'citations') {
      handleCitationSearch();
    } else if (mode === 'summarize') {
      handleSummarize();
    } else if (mode === 'quiz') {
      handleGenerateStudyPack();
    } else {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen relative transition-colors font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Interactive Tutorial - comprehensive product tour after onboarding */}
      {(showInteractiveTutorial || showWelcomeTutorial) && (
        <InteractiveTutorial
          userName={getDisplayNameForGreeting(user)}
          onComplete={showInteractiveTutorial ? handleInteractiveTutorialComplete : async () => {
            onUserUpdate?.({ welcomeTutorialCompleted: true });
            trackEvent('tutorial_complete');
            try {
              if (user?.id) {
                localStorage.setItem(`writescholar_paywall_deferred_${user.id}`, 'true');
              }
            } catch (_) {}
            setMode('analyze');
            setTimeout(() => {
              document.querySelector('[data-tutorial="analyze-ready"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
          }}
        />
      )}

      {/* First analysis onboarding banner — dismissible; upload/library nudges use showFirstAnalysisOnboarding only */}
      {showFirstAnalysisOnboarding && !dismissedFirstAnalysisBanner && !showSoftPaywall && !showInteractiveTutorial && !showWelcomeTutorial && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:ml-24 lg:mr-auto mb-4">
          <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-900/70 p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-sm ring-1 ring-white/50 dark:ring-white/5">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-80" aria-hidden />
            <button
              type="button"
              onClick={() => {
                setDismissedFirstAnalysisBanner(true);
                trackEvent('first_action_prompt_dismiss');
              }}
              className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors z-10"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10 sm:pr-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50 mb-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Analyze your first essay</h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">Upload or paste 200+ words for professor-style feedback on structure, clarity, and tone—the fastest way to see what WriteScholar can do.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setMode('analyze');
                    trackEvent('first_action_prompt_cta_click', { cta: 'analyze' });
                    setTimeout(() => {
                      document.querySelector('[data-tutorial-target="essay-input-wrapper"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 150);
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-md text-base ring-1 ring-violet-900/10"
                >
                  Analyze essay
                </button>
                <button
                  onClick={() => {
                    setMode('quiz');
                    trackEvent('first_action_prompt_cta_click', { cta: 'study_pack' });
                    setTimeout(() => {
                      document.querySelector('[data-tutorial="study-pack-input"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 150);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-stone-700 dark:text-stone-300 font-medium rounded-xl border border-stone-300/90 dark:border-stone-600 bg-white/80 dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-sm shadow-sm"
                >
                  Study Pack
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soft Paywall - shown after first success or return visit (deferred from tutorial) */}
      {showSoftPaywall && (
        <SoftPaywall
          userName={getDisplayNameForGreeting(user)}
          onStartTrial={handlePaywallStartTrial}
          onDismiss={handlePaywallDismiss}
          onNavigatePricing={handlePaywallNavigatePricing}
          onNavigate={onNavigate}
        />
      )}

      {/* Study Pack generation animation - mascot overlay like essay analyzer */}
      {isGeneratingStudyPack && (
        <AnalysisAnimation
          isPopup={true}
          text="Creating your study pack"
          variant="studyPack"
          isComplete={false}
        />
      )}

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-24 sm:pb-16 w-full min-w-0 overflow-x-hidden lg:ml-24 lg:mr-auto">
        <div className="w-full min-w-0 space-y-4 sm:space-y-6">
          {/* Greeting strip */}
          <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-stone-800 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md bg-white/80 dark:bg-stone-900/55 p-4 sm:p-5 md:p-6 ring-1 ring-white/50 dark:ring-white/5 animate-card-bounce-in" data-tutorial="greeting-area">
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              {/* Greeting + tagline (left) · Search + streak/badges (right), no divider lines */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-3">
                <div className="flex gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="hidden sm:block flex-shrink-0 relative group">
                    <div className="absolute -inset-2 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 blur-xl group-hover:opacity-100 transition-opacity" />
                    <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900/50 p-1 shadow-sm overflow-hidden">
                      <ScholarMascot size={88} animated={false} pose="default" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-1 sm:gap-1.5">
                    <h1 className="text-2xl sm:text-3xl md:text-[2.15rem] font-semibold text-stone-900 dark:text-stone-50 leading-[1.15] tracking-tight text-center sm:text-left" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                      {greeting.greeting}
                      {getDisplayNameForGreeting(user)
                        ? (() => {
                            const first = getDisplayNameForGreeting(user);
                            return `, ${first.length > 12 ? first.slice(0, 12) + '…' : first}`;
                          })()
                        : ''}
                      ! <span className="inline-block text-lg sm:text-xl align-middle opacity-90" aria-hidden>{greeting.emoji}</span>
                    </h1>
                    <div className="flex flex-col gap-0.5 max-w-xl text-center sm:text-left">
                      {mode === 'focus_mode' ? (
                        <>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug font-bold text-rose-600 dark:text-rose-400">Solve a puzzle or answer study questions to unlock.</span>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug text-stone-500 dark:text-stone-400">Sudoku, Memory, Pattern & more.</span>
                        </>
                      ) : mode === 'quiz' ? (
                        <>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug font-bold text-amber-600 dark:text-amber-400">Quizzes, flashcards & crosswords from your notes.</span>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug text-stone-500 dark:text-stone-400">Plus essay feedback & citations.</span>
                        </>
                      ) : mode === 'citations' ? (
                        <>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug font-bold text-sky-600 dark:text-sky-400">Citations via academic sources in seconds.</span>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug text-stone-500 dark:text-stone-400">Plus essay feedback, study tools & focus mode.</span>
                        </>
                      ) : (
                        <>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug font-bold text-rose-600 dark:text-rose-400">Professor-style feedback on every essay.</span>
                          <span className="block text-sm sm:text-[0.9375rem] leading-snug text-stone-500 dark:text-stone-400">Plus study tools, citations & focus mode.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[280px] lg:max-w-lg flex-shrink-0 lg:items-end">
                  <div className="relative w-full">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500/80 dark:text-violet-400/90 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents, quizzes…"
                      className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-white dark:bg-stone-900/50 rounded-lg text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none border border-violet-400/75 dark:border-violet-500/55 ring-2 ring-violet-500/18 shadow-sm shadow-violet-500/10 transition-all focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/30 focus:shadow-md focus:shadow-violet-500/25"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-600/50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-row flex-wrap items-center justify-center lg:justify-end gap-2 w-full">
                    <div data-tutorial="streak-widget" className="flex-shrink-0">
                      <StreakWidget compact />
                    </div>
                    {!HIDE_FRIENDS && (
                      <button
                        onClick={() => onNavigate('friends')}
                        data-tutorial="friends-btn"
                        className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/80 dark:bg-stone-700/60 border border-stone-200/70 dark:border-stone-600/50 rounded-xl hover:border-emerald-300/80 dark:hover:border-emerald-600/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all shadow-sm flex-shrink-0"
                      >
                        <span className="text-base">👥</span>
                        <span className="font-semibold text-stone-700 dark:text-stone-200 text-xs sm:text-sm">Friends</span>
                        {friendNotificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{friendNotificationCount > 9 ? '9+' : friendNotificationCount}</span>
                        )}
                      </button>
                    )}
                    <div className="hidden sm:block flex-shrink-0"><BadgeWidget onNavigate={onNavigate} /></div>
                    <div className="sm:hidden flex-shrink-0"><BadgeWidget onNavigate={onNavigate} mobileExpanded /></div>
                  </div>
                </div>
              </div>

              {/* Ebook + upgrade — tight, no separator lines */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 sm:gap-3 pt-1">
                {showEbookBanner && !ebookBannerDismissed && (
                  <div className="hidden sm:flex items-center shrink-0 gap-0">
                    <div className="relative shrink-0">
                      <a
                        href="/downloads/writescholar-ultimate-study-tips-guide.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2.5 pr-8 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300/80 dark:hover:border-amber-600/50 transition-all shadow-sm group"
                      >
                        <span className="text-lg">📖</span>
                        <div className="hidden sm:block text-left">
                          <p className="font-semibold text-stone-700 dark:text-stone-200 text-xs leading-tight">Free Study Tips</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 group-hover:underline">Get PDF →</p>
                        </div>
                        <span className="sm:hidden font-semibold text-stone-700 dark:text-stone-200 text-xs">Free PDF</span>
                      </a>
                      <button
                        onClick={(e) => { e.preventDefault(); dismissEbookBanner(); }}
                        className="absolute top-1 right-1 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        aria-label="Dismiss"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {usageStats.plan === 'free' && !loadingStats && (
                  <>
                    <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span>Upgrade</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

            {/* Hero + More tools - only for Analyze & Citations modes (high on page) */}
            {(mode === 'analyze' || mode === 'citations') && (loadingStats ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 pt-1 sm:pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-2xl border border-stone-200/50 dark:border-stone-700/30 bg-stone-50 dark:bg-stone-800/50 animate-pulse">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-xl mb-2.5 sm:mb-3" />
                    <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-1.5 sm:mb-2" />
                    <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-full" />
                        </div>
                ))}
                      </div>
                    ) : (
            <div className="pt-1 sm:pt-2 pb-3 sm:pb-5 overflow-visible" data-tutorial="feature-cards">
              <div data-tutorial="analyze-ready" className="relative rounded-2xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-stone-200/90 dark:border-stone-700/90 bg-white/85 dark:bg-stone-900/55 shadow-[0_16px_50px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm ring-1 ring-white/40 dark:ring-white/5 scroll-mt-8">
                <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-75 dark:opacity-80" aria-hidden />
                <div className="relative rounded-b-2xl bg-white/95 dark:bg-stone-900/70 p-4 sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(91,33,182,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(109,40,217,0.08),transparent_55%)] pointer-events-none rounded-b-2xl" aria-hidden />

                  {mode === 'analyze' ? (
                    <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-start">
                      <div className="hidden lg:block relative self-start justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[15deg] origin-bottom-left drop-shadow-lg z-[5] lg:mt-5 xl:mt-6" aria-label="Sample before feedback">
                        <p className="text-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800/95 dark:text-amber-300/95">Before</span>
                          <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Draft · improve &amp; concern</span>
                        </p>
                        <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/35 bg-white/95 dark:bg-stone-900/60 p-2 ring-1 ring-amber-200/45 dark:ring-amber-900/30">
                          <HeroEssayPreviewCard
                            paper={DEMO_DASHBOARD_BEFORE_PAPER}
                            rotate="none"
                            variant="before"
                            legendPlacement="top"
                            maxExcerptChars={380}
                            paperMaxHeightClass="max-h-[272px]"
                          />
                  </div>
                      </div>
                      <div className="min-w-0">
                        <h1 className="relative text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.125rem] font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 sm:mb-2 tracking-tight leading-snug px-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                          <span className="text-emerald-700 dark:text-emerald-400">Paste</span>
                          {' '}or{' '}
                          <span className="text-sky-700 dark:text-sky-400">upload</span>
                          {' '}your essay, get <span className="text-violet-800 dark:text-violet-300">feedback</span> in seconds
                        </h1>
                        <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-2 sm:mb-2.5 max-w-xl mx-auto leading-relaxed">
                          Upload your essay, get <span className="text-red-600 dark:text-red-500">professor</span><span className="text-amber-600 dark:text-amber-500">-style</span> <span className="text-green-600 dark:text-green-500">feedback</span>
                        </p>
                        <div className="hidden sm:block">
                          <FeatureTickRow className="relative mb-1 sm:mb-1.5" items={['Structure', 'Annotations', 'Rubric', 'Suggestions']} />
                        </div>
                        <div className="relative flex rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-100/60 dark:bg-stone-800/50 p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto shadow-sm">
                    <button
                            type="button"
                            data-tutorial="analyze-feature-card"
                      onClick={() => { setMode('analyze'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-900 text-violet-800 dark:text-violet-300 shadow-sm border border-stone-200/80 dark:border-stone-600"
                    >
                            <span className="text-base" aria-hidden>📝</span> Analyze
                    </button>
                    <button
                      onClick={() => { setMode('citations'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                    >
                            <span className="text-base" aria-hidden>📚</span> Citations
                    </button>
                    <button
                      onClick={() => { setMode('quiz'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                    >
                            <span className="text-base" aria-hidden>📦</span> Study Pack
                    </button>
                  </div>
                        {showFirstAnalysisOnboarding && (
                          <div className="flex flex-col items-center gap-1 mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-sm font-medium shadow-sm">
                              Start your first analysis — paste text or upload below, then run Analyze
                      </span>
                            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                      </div>
                      <div className="hidden lg:block relative self-start justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[15deg] origin-bottom-right drop-shadow-lg z-[5] lg:mt-5 xl:mt-6" aria-label="Sample after feedback">
                        <p className="text-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/95 dark:text-emerald-300/95">After</span>
                          <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Revised · mostly strong</span>
                        </p>
                        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/35 bg-white/95 dark:bg-stone-900/60 p-2 ring-1 ring-emerald-200/45 dark:ring-emerald-900/30">
                          <HeroEssayPreviewCard
                            paper={DEMO_DASHBOARD_AFTER_PAPER}
                            rotate="none"
                            variant="after"
                            legendPlacement="top"
                            maxExcerptChars={380}
                            paperMaxHeightClass="max-h-[272px]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-stretch">
                        <div className="hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[11deg] origin-bottom-left drop-shadow-lg z-[5]" aria-label="Sample sources preview">
                          <p className="text-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-800/95 dark:text-sky-300/95">Sources</span>
                            <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Peer-reviewed picks</span>
                          </p>
                          <InteractiveCitationsDemo variant="side-left" />
                        </div>
                        <div className="min-w-0 self-start">
                          <h1 className="relative text-xl sm:text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 tracking-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                            Find <span className="text-sky-700 dark:text-sky-400">academic sources</span> in seconds
                          </h1>
                          <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-2 sm:mb-2.5 max-w-xl mx-auto leading-relaxed">
                            APA, MLA & Chicago. Peer-reviewed sources. Filter by year.
                          </p>
                          <div className="hidden sm:block">
                            <FeatureTickRow
                              className="relative mb-1 sm:mb-1.5"
                              items={['APA', 'MLA', 'Chicago', 'Peer-reviewed', 'Export-ready']}
                            />
                          </div>
                          <div className="relative flex rounded-xl border border-stone-200/90 dark:border-stone-700 bg-stone-100/60 dark:bg-stone-800/50 p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto shadow-sm">
                            <button
                              onClick={() => { setMode('analyze'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                            >
                              <span className="text-base" aria-hidden>📝</span> Analyze
                            </button>
                            <button
                              onClick={() => { setMode('citations'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); }}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${mode === 'citations' ? 'bg-white dark:bg-stone-900 text-violet-800 dark:text-violet-300 shadow-sm border border-stone-200/80 dark:border-stone-600' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                            >
                              <span className="text-base" aria-hidden>📚</span> Citations
                            </button>
                            <button
                              onClick={() => { setMode('quiz'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                            >
                              <span className="text-base" aria-hidden>📦</span> Study Pack
                            </button>
                          </div>
                  {showFirstCitationPrompt && mode === 'citations' && (
                            <div className="flex flex-col items-center gap-1 mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-sm font-medium shadow-sm">
                        Start your first citation
                      </span>
                              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                          )}
                        </div>
                        <div className="hidden lg:block relative self-end justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[11deg] origin-bottom-right drop-shadow-lg z-[5]" aria-label="Sample citation export preview">
                          <p className="text-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-800/95 dark:text-violet-300/95">Export</span>
                            <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">APA · MLA · Chicago</span>
                          </p>
                          <InteractiveCitationsDemo variant="side-right" />
                        </div>
                      </div>
                    </>
                  )}

                  {mode === 'citations' && (
                    <div className="relative mb-2 max-w-3xl mx-auto mt-2 sm:mt-0 lg:-mt-14 xl:-mt-16 z-20">
                      <div className="relative rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-violet-500/25 border-sky-200/90 dark:border-sky-800/60 bg-white dark:bg-stone-900/40 focus-within:border-sky-400/60">
                        <div className="relative rounded-[12px] sm:rounded-[18px] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm min-h-[120px] sm:min-h-[160px]">
                          <textarea
                            value={inputText}
                            onChange={(e) => {
                              setInputText(e.target.value);
                              setShowWordWarning(false);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                            placeholder="Enter your research topic to find academic sources..."
                            className="relative w-full min-h-[120px] sm:min-h-[160px] max-h-[220px] overflow-y-auto p-4 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.min(target.scrollHeight, 220) + 'px';
                            }}
                            data-tutorial-target="essay-input-wrapper"
                          />
                          <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500 font-medium">
                            {inputText.length} characters
                        </div>
                          {showWordWarning && (
                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                              <span className="text-sm font-medium text-red-500">Please enter a research topic</span>
                          </div>
                          )}
                      </div>
                      </div>
                      <div className="flex justify-center mt-6">
                        <button
                          data-tutorial-target="essay-analyze-btn"
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isSearchingCitations}
                          className={`px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base ${
                            isTextValid() && !isSearchingCitations
                              ? 'bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {isSearchingCitations ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          ) : (
                            <>Find Sources</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                      {mode === 'analyze' && (
                    <div className="relative w-full mb-2">
                      {/* Essay input — negative margin on lg+ only (desktop mockups); mobile stays flush */}
                      <div className="min-w-0 relative z-20 w-full max-w-3xl mx-auto space-y-3 sm:space-y-4 mt-0 lg:-mt-32 xl:-mt-36">
                          <div className="relative rounded-2xl border transition-all duration-300 bg-white dark:bg-stone-900/40 border-violet-400/75 dark:border-violet-500/55 ring-2 ring-violet-500/18 shadow-sm shadow-violet-500/10 focus-within:border-violet-500 dark:focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/30 focus-within:shadow-md focus-within:shadow-violet-500/25">
                            <div className="relative rounded-[14px] sm:rounded-[20px] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm min-h-[140px] sm:min-h-[200px]">
                              <textarea
                                value={inputText}
                                onChange={(e) => {
                                  setInputText(e.target.value);
                                  setShowWordWarning(false);
                                  setAnalyzeUploadError('');
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                                placeholder="Paste your essay or paper here (min 200 words)..."
                                className="relative w-full min-h-[140px] sm:min-h-[200px] max-h-[240px] overflow-y-auto p-5 sm:p-7 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-[1.65]"
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = Math.min(target.scrollHeight, 240) + 'px';
                                }}
                                data-tutorial-target="essay-input-wrapper"
                              />
                              <div className="absolute bottom-4 left-6 text-sm text-stone-400 dark:text-stone-500 font-medium">
                                {getWordCount(inputText)} words
                                {getWordCount(inputText) < 200 && <span className="text-amber-500"> (min 200)</span>}
                              </div>
                              {showWordWarning && (
                                <div className="absolute -bottom-6 left-0 right-0 text-center">
                                  <span className="text-sm font-medium text-red-500">Minimum 200 words required for analysis</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            ref={analyzeFileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleAnalyzeFileUpload}
                            className="hidden"
                            aria-hidden
                          />
                          {analyzeUploadError && (
                            <div className="px-1 text-center sm:text-left">
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">{analyzeUploadError}</p>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-5">
                            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                              <button
                                type="button"
                                onClick={() => analyzeFileInputRef.current?.click()}
                                disabled={isParsingAnalyzeDoc}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all border shadow-md disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0 ${
                                  showFirstAnalysisOnboarding
                                    ? 'bg-violet-600 dark:bg-violet-500 text-white border-violet-400/50 shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/40 hover:bg-violet-500 dark:hover:bg-violet-400 hover:-translate-y-0.5'
                                    : 'bg-violet-600 dark:bg-violet-500 text-white border-violet-400/40 shadow-lg shadow-violet-600/25 ring-1 ring-violet-400/30 hover:bg-violet-500 dark:hover:bg-violet-400 hover:shadow-xl hover:shadow-violet-600/20 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                              >
                                {isParsingAnalyzeDoc ? (
                                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-5 h-5 shrink-0 opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                )}
                                {isParsingAnalyzeDoc ? 'Uploading...' : 'Upload file'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigate('upload')}
                                className="text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline px-1"
                              >
                                Library upload →
                              </button>
                              {inputText.trim() && (
                                <button
                                  type="button"
                                  onClick={() => { setInputText(''); setAnalyzeUploadError(''); }}
                                  className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 text-xs font-medium transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              data-tutorial-target="essay-analyze-btn"
                              onClick={handleSubmit}
                              disabled={!isTextValid()}
                              className={`px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base shrink-0 ${
                                isTextValid()
                                  ? 'bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                              }`}
                            >
                              Analyze Text
                            </button>
                          </div>

                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (!isParsingAnalyzeDoc) analyzeFileInputRef.current?.click();
                              }
                            }}
                            onClick={() => { if (!isParsingAnalyzeDoc) analyzeFileInputRef.current?.click(); }}
                            onDragEnter={handleAnalyzeDropZoneDrag}
                            onDragLeave={handleAnalyzeDropZoneDrag}
                            onDragOver={handleAnalyzeDropZoneDrag}
                            onDrop={handleAnalyzeDropZoneDrop}
                            className={`group/dz rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-300 select-none ${
                              isParsingAnalyzeDoc
                                ? 'border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/30 opacity-70 cursor-wait'
                                : analyzeDropActive
                                  ? 'border-violet-500 bg-violet-100/90 dark:bg-violet-950/45 shadow-lg shadow-violet-500/15 ring-2 ring-violet-400/40 cursor-pointer'
                                  : 'border-violet-300/80 dark:border-violet-600/55 bg-violet-50/90 dark:bg-violet-950/25 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/35 hover:shadow-md hover:shadow-violet-500/10 cursor-pointer'
                            }`}
                            aria-label="Drop a document to load into the essay box, or click to browse"
                          >
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7">
                              <div
                                className={`flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover/dz:scale-105 bg-violet-600 text-white shadow-lg shadow-violet-600/35 ${
                                  analyzeDropActive ? 'ring-2 ring-violet-300/80 dark:ring-violet-500/50' : ''
                                }`}
                                aria-hidden
                              >
                                <svg className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <div className="text-left sm:text-left min-w-0 max-w-md">
                                <p className="text-lg sm:text-xl font-bold tracking-tight text-violet-800 dark:text-violet-200">
                                  Drop your document here
                                </p>
                                <p className="text-sm sm:text-[0.9375rem] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                                  Or click to browse — <span className="font-semibold text-violet-700 dark:text-violet-400">PDF</span>,{' '}
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Word</span>, or{' '}
                                  <span className="font-semibold text-sky-700 dark:text-sky-400">TXT</span>. We&apos;ll load the text into the box above (same as Upload file).
                                </p>
                              </div>
                            </div>
                          </div>

                          {isParsingAnalyzeDoc && (
                            <div className="absolute inset-0 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm flex items-center justify-center gap-3 z-30 pointer-events-auto" aria-live="polite" aria-busy="true">
                              <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                              <span className="font-semibold text-stone-700 dark:text-stone-200">Uploading...</span>
                      </div>
                          )}
                      </div>

                        <div className="hidden lg:block mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-stone-200/80 dark:border-stone-700/60">
                          <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                              See a real analysis in action
                            </h2>
                            <span className="h-px flex-1 max-w-32 bg-stone-300/80 dark:bg-stone-600/60 rounded-full" />
                    </div>
                          <InteractiveDocumentAnalysis onNavigate={onNavigate} />
                      </div>
                      </div>
                )}

                {mode === 'citations' && (
                    <>
                  <div className="relative space-y-4 pt-2">
                    <div className="flex justify-center gap-3 flex-wrap">
                      <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all">
                        <option value="APA">APA 7th</option>
                        <option value="MLA">MLA 9th</option>
                        <option value="Chicago">Chicago</option>
                      </select>
                      <select value={citationYearRange} onChange={(e) => setCitationYearRange(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-600/80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-sm font-semibold shadow-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all">
                        <option value="all">All years</option>
                        <option value="5">Last 5 years</option>
                        <option value="10">Last 10 years</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedTopics.map((topic, idx) => (
                            <button key={idx} onClick={() => setInputText(topic)} className="px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium hover:border-violet-300/70 dark:hover:border-violet-600/50 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 transition-all duration-200">
                          {topic}
                  </button>
                      ))}
                </div>
              </div>
                    </>
                  )}
            </div>
                  </div>
            </div>
            ))}

          {/* Search results & ebook - shown when typing */}
          <div className="space-y-4">
              {/* Inline search results — shown when typing in hero search */}
              {searchQuery.trim() && (
                <div className="mt-3 mb-6 bg-white/95 dark:bg-stone-800/95 backdrop-blur-xl border border-white/60 dark:border-stone-600/60 rounded-2xl sm:rounded-3xl shadow-2xl shadow-stone-900/10 overflow-hidden">
                  {filteredActivity.length > 0 ? (
                    <>
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{filteredActivity.length} result{filteredActivity.length !== 1 ? 's' : ''}</p>
                      </div>
                      {filteredActivity.slice(0, 6).map((activity) => {
                        const meta = activityMeta[activity.type];
                        return (
                          <button
                            key={activity.id}
                            onClick={() => handleActivityClick(activity)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-left group"
                          >
                            <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                              <span className="text-base">{meta.emoji}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm truncate group-hover:text-rose-700 dark:group-hover:text-rose-400">{activity.title}</p>
                              <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{activity.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500">{relativeTime(activity.date)}</span>
                              <span className={`px-2 py-0.5 ${meta.bg} text-[10px] font-bold rounded-md uppercase tracking-wide text-stone-600 dark:text-stone-300`}>{meta.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No results for <span className="font-semibold text-stone-700 dark:text-stone-200">"{searchQuery}"</span></p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Try searching by document name or activity type</p>
                    </div>
                  )}
                </div>
              )}
          </div>

        {/* FOCUS MODE - Settings section for paid users; on mobile show desktop-only info (or Coming Soon when extension pending) */}
        {mode === 'focus_mode' && (
          isDesktop ? (
            <FocusModeSettingsSection embedded onBack={() => setMode('analyze')} isPaidUser={isPaidUser} onNavigate={onNavigate} />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="p-6 sm:p-8 max-w-2xl">
                <button
                  onClick={() => setMode('analyze')}
                  className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium transition-colors"
                >
                  ← Back to Dashboard
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl overflow-hidden bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-700/60 shadow-md">
                    <p className="px-4 pt-4 pb-2 text-sm font-bold text-stone-700 dark:text-stone-300">See how it works</p>
                    <div className="aspect-video bg-stone-900">
                      <video autoPlay loop muted playsInline className="w-full h-full object-contain" title="WriteScholar Focus Mode">
                        <source src="/writescholar-focus-mode-demo.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200/90 dark:border-stone-700/60 bg-white/95 dark:bg-stone-900/50 shadow-md">
                    <div className="rounded-[inherit] p-6 sm:p-8 h-full flex flex-col justify-center">
                  {FOCUS_MODE_COMING_SOON ? (
                    <>
                          <span className="inline-flex items-center px-4 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full text-sm font-semibold mb-4 w-fit">Coming Soon</span>
                          <div className="w-16 h-16 rounded-xl bg-violet-700 dark:bg-violet-600 flex items-center justify-center mb-4 text-3xl shadow-md ring-1 ring-violet-900/10">🔒</div>
                          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Focus Mode is on its way</h2>
                          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                            Our Chrome extension is currently under review. Soon you&apos;ll be able to block distracting sites and earn your screen time by studying first.
                      </p>
                    </>
                  ) : (
                    <>
                          <div className="w-16 h-16 rounded-xl bg-violet-700 dark:bg-violet-600 flex items-center justify-center mb-4 text-3xl shadow-md ring-1 ring-violet-900/10">🔒</div>
                          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Desktop only</h2>
                          <p className="text-stone-600 dark:text-stone-400 text-sm mb-4 leading-relaxed">
                            Focus Mode works with our Chrome extension to block sites until you solve a puzzle or answer study questions. Extensions aren&apos;t supported on mobile — use a computer with Chrome.
                      </p>
                      <a
                        href={FOCUS_MODE_CHROME_EXTENSION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 text-white text-sm font-semibold shadow-md ring-1 ring-violet-900/10 transition-all hover:opacity-95 w-fit"
                      >
                        Get Chrome Extension (desktop) →
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
                </div>
                </div>
          )
        )}

        {/* SUMMARIZE MODE */}
        {mode === 'summarize' && (
          <>
            {/* Plan info banner - Mobile optimized */}
            {isFreeUser && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">📝</span>
                  <div className="min-w-0">
                    <p className="text-teal-800 dark:text-teal-200 font-medium text-xs sm:text-sm">
                      {`Free: 5,000 words/mo • ${getResetsInText((usageStats as any).daysUntilReset)}`}
                      {' • Bullet + Medium'}
                    </p>
                    <p className="text-teal-600 dark:text-teal-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">Upgrade to Pro for 999,999 words/mo, all styles & lengths, and unlimited Focus Mode sites</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-teal-600 active:bg-teal-700 sm:hover:bg-teal-500 text-white text-xs font-semibold rounded-lg sm:rounded-xl transition-all flex-shrink-0">
                  Upgrade
                </button>
              </div>
            )}
            
            <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-100/50 dark:shadow-none border border-stone-200 dark:border-stone-600 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-stone-200 dark:border-stone-600 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {(['bullet', 'paragraph', 'tldr', 'detailed'] as const).map((s) => {
                          const locked = isFreeUser && s !== 'bullet';
                          return (
                            <button
                              key={s}
                              onClick={() => !locked && setSummaryStyle(s)}
                              disabled={locked}
                              title={locked ? 'Upgrade to Pro for all styles' : ''}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                summaryStyle === s ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {s === 'bullet' ? 'Bullet' : s === 'paragraph' ? 'Paragraph' : s === 'tldr' ? 'TL;DR' : 'Detailed'}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Length:</span>
                      <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-stone-200 dark:border-stone-600">
                        {(['short', 'medium', 'long'] as const).map((l) => {
                          const locked = isFreeUser && l !== 'medium';
                          return (
                            <button
                              key={l}
                              onClick={() => !locked && setSummaryLength(l)}
                              disabled={locked}
                              title={locked ? 'Upgrade to Pro for all lengths' : ''}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed' :
                                summaryLength === l ? 'bg-teal-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-600'
                              }`}
                            >
                              {l.charAt(0).toUpperCase() + l.slice(1)}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isTextValid() || isSummarizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      isTextValid() && !isSummarizing
                        ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 cursor-pointer'
                        : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {isSummarizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </>
                    ) : (
                      <>✨ Summarize</>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-600 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500"></div>
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Original</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input ref={parseFileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleParseDocument} className="hidden" />
                      <button onClick={() => parseFileInputRef.current?.click()} disabled={isParsingDoc} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/50 font-semibold text-sm transition-colors disabled:opacity-50 border border-teal-200 dark:border-teal-700">
                        {isParsingDoc ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        {isParsingDoc ? 'Parsing...' : 'Upload Document'}
                      </button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors">Paste</button>
                      <button onClick={() => setInputText('')} className={`flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isSummarizing}
                    className="w-full min-h-[280px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-800/30 border-t border-stone-200 dark:border-stone-600">
                    <span className={`text-xs font-medium ${getWordCount(inputText) < 50 ? 'text-amber-600' : getWordCount(inputText) > humanizeSummarizeMaxWords ? 'text-red-600' : 'text-stone-500 dark:text-stone-400'}`}>
                      {getWordCount(inputText)} words / {humanizeSummarizeMaxWords.toLocaleString()} max
                      {getWordCount(inputText) < 50 && ' (min 50)'}
                      {getWordCount(inputText) > humanizeSummarizeMaxWords && isFreeUser && ' — Upgrade for 5,000'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-900/10 dark:to-cyan-900/10 min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/50 dark:bg-teal-900/20 border-b border-teal-100/50 dark:border-teal-800/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { navigator.clipboard.writeText(summaryResult.summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); trackCopy(); }}
                          className={`text-xs font-medium ${summaryCopied ? 'text-teal-600' : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300'}`}
                        >
                          {summaryCopied ? '✓ Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleEnlargeSummarize} className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="Open in full page">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-[280px] sm:min-h-[350px] max-h-[350px] overflow-y-auto">
                    {summaryResult ? (
                      <div className="p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {summaryResult.summary}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-400 dark:text-stone-500 p-5">
                        {isSummarizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-teal-200 dark:border-teal-800 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating your summary...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100/50 dark:bg-teal-900/30 flex items-center justify-center text-3xl">📝</div>
                            <p className="text-sm text-stone-500 dark:text-stone-400">Your summary will appear here</p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Paste text on the left and click Summarize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/30 dark:bg-teal-900/10 border-t border-teal-100/50 dark:border-teal-800/30">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{summaryResult ? `${summaryResult.summaryWordCount} words` : ''}</span>
                    {summaryResult && (
                      <button onClick={() => setSummaryResult(null)} className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">Clear</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {summaryError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{summaryError}</p>
                {usageStats.plan === 'free' && (
                  <>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-1">{getResetsInText((usageStats as any).daysUntilReset)}</p>
                    <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                      Upgrade Plan
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* STUDY TOOLS MODE — unified Study Pack generation (hero style like Analyze/Citations) */}
        {mode === 'quiz' && (loadingStats ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 pt-2 sm:pt-4 pb-2 sm:pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-2xl border border-stone-200/50 dark:border-stone-700/30 bg-stone-50 dark:bg-stone-800/50 animate-pulse">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-xl mb-2.5 sm:mb-3" />
                <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-1.5 sm:mb-2" />
                <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Hidden file input for document upload */}
            <input
              ref={studyToolsFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleStudyToolsFileUpload}
              className="hidden"
            />

            {/* Exhausted generations banner — above hero (free: study packs only; Pro: 99 combined pool) */}
            {studyPackSectionExhausted && (
              <div className="mb-4 sm:mb-6 bg-amber-600 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white text-center shadow-lg shadow-amber-500/25">
                <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block">🔒</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Monthly Limit Reached</h3>
                <p className="text-amber-100 dark:text-amber-100/90 mb-1 text-sm sm:text-base">
                  {combinedPoolExhausted
                    ? "You've used all 99 combined actions (analyses, study packs & citations) this billing period. Your limit resets when your plan renews."
                    : `You've used all ${quizUsage.generationLimit} study pack generations this period. Upgrade for more!`}
                </p>
                <p className="text-amber-200/90 text-xs sm:text-sm mb-3 sm:mb-4">{getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}</p>
                {!combinedPoolExhausted && (
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-semibold rounded-xl active:bg-stone-50 sm:hover:bg-stone-50 dark:sm:hover:bg-stone-700 transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    👑 Upgrade Now
                  </button>
                )}
              </div>
            )}

            {/* Plan info banner — above hero when not exhausted */}
            {!studyPackSectionExhausted && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">🧠</span>
                  <div className="min-w-0">
                    {isFreeUser ? (
                      <>
                        <p className="text-amber-800 dark:text-amber-200 font-medium text-xs sm:text-sm">
                          Free: {quizUsage.generationsRemaining}/{quizUsage.generationLimit} study packs • {(quizUsage.maxWordsPerGeneration || 5000).toLocaleString()} words max • {getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">Lesson, flashcards & quiz included • Crossword & Crater Blast unlock with Pro</p>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-800 dark:text-amber-200 font-medium text-xs sm:text-sm">
                          Pro:{' '}
                          {(usageStats as { combinedActionsRemaining?: number }).combinedActionsRemaining != null
                            ? (usageStats as { combinedActionsRemaining: number }).combinedActionsRemaining
                            : quizUsage.generationsRemaining}
                          /
                          {(usageStats as { planLimits?: { combinedActionsPerMonth?: number } }).planLimits?.combinedActionsPerMonth ?? quizUsage.generationLimit}{' '}
                          combined actions left this month
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs mt-0.5 line-clamp-2">
                          Analyses, study packs & citations share one pool (resets with your billing period).
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {isFreeUser && (
                <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto px-3 sm:px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg sm:rounded-xl active:bg-amber-700 sm:hover:bg-amber-500 transition-all flex-shrink-0">
                  Upgrade
                </button>
                )}
              </div>
            )}

            {/* Study pack error — above hero */}
            {studyPackError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{studyPackError}</p>
              </div>
            )}

            <div className="pt-2 sm:pt-4 pb-4 sm:pb-6 overflow-visible" data-tutorial="study-pack-input">
              {/* STUDY PACK HERO - same style as Analyze/Citations */}
              <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-8 border border-stone-200/90 dark:border-stone-700/80 bg-white/95 dark:bg-stone-900/60 shadow-md">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-90" aria-hidden />
                <div className="relative rounded-[inherit] p-4 sm:p-10">
                  <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-stretch">
                    <div className="hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto -rotate-[11deg] origin-bottom-left drop-shadow-lg z-[5]" aria-label="Sample flashcard preview">
                      <p className="text-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-800/95 dark:text-violet-300/95">Flashcards</span>
                        <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Tap to flip</span>
                      </p>
                      <InteractiveStudyPackDemo variant="side-left" />
                    </div>
                    <div className="min-w-0 self-start">
                      <h2 className="relative text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.125rem] font-semibold text-stone-900 dark:text-stone-50 text-center mb-1.5 sm:mb-2 tracking-tight leading-snug px-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                        Turn your notes into <span className="text-violet-800 dark:text-violet-300">5 study tools</span>
                  </h2>
                  <p className="relative text-stone-600 dark:text-stone-300 text-sm sm:text-base text-center mb-3 sm:mb-8 max-w-xl mx-auto leading-relaxed">
                    Lesson, flashcards, quiz, crossword & Crater Blast — all from one paste
                  </p>
                      <div className="hidden sm:block">
                        <FeatureTickRow
                          variant="prominent"
                          className="relative"
                          items={['Lesson', 'Flashcards', 'Quiz', 'Crossword', 'Crater Blast']}
                        />
                      </div>
                  {/* Tab switcher - same as Analyze/Citations (Study Pack section: Analyze/Citations inactive, Study Pack active) */}
                      <div className="relative flex rounded-xl bg-stone-100/90 dark:bg-stone-800/80 p-1 mb-2 sm:mb-3 max-w-lg mx-auto border border-stone-200/80 dark:border-stone-700/60">
                    <button
                      onClick={() => { setMode('analyze'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                    >
                      <span className="text-lg">📝</span> Analyze Text
                    </button>
                    <button
                      onClick={() => { setMode('citations'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                    >
                      <span className="text-lg">📚</span> Citations
                    </button>
                    <button
                      onClick={() => { setMode('quiz'); setShowWordWarning(false); setAnalyzeUploadError(''); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-700 text-violet-800 dark:text-violet-200 shadow-sm ring-1 ring-stone-200/80 dark:ring-stone-600/80"
                    >
                      <span className="text-lg">📦</span> Study Pack
                    </button>
                  </div>
                  {/* Create Cards button - inline */}
                  {!loadingStats && (
                        <div className="flex justify-center mb-4 sm:mb-5">
                      <button
                        onClick={() => onNavigate('create-flashcards')}
                        data-tutorial="create-cards-card"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-600/50 rounded-xl text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-semibold transition-all"
                      >
                        <span className="text-base">🃏</span>
                        Create Cards from scratch
                      </button>
                    </div>
                  )}
                  {/* "Start your first study pack or upload file below" callout - shown when user has never done a study pack */}
                  {showFirstStudyPackPrompt && (
                        <div className="flex flex-col items-center gap-1 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-sm font-medium shadow-sm">
                        Start your first study pack or upload file below
                      </span>
                          <svg className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                    </div>
                    <div className="hidden lg:block relative self-end justify-self-end w-[236px] xl:w-[248px] pointer-events-auto rotate-[11deg] origin-bottom-right drop-shadow-lg z-[5]" aria-label="Sample quiz preview">
                      <p className="text-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/95 dark:text-emerald-300/95">Quiz</span>
                        <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Check understanding</span>
                      </p>
                      <InteractiveStudyPackDemo variant="side-right" />
                    </div>
                  </div>
                  {/* Typing box - gradient border like Analyze (same width as analyze/citations) */}
                  <div className="relative mb-2 max-w-3xl mx-auto">
                    <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-600 bg-white dark:bg-stone-900/40 shadow-sm focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-300/50 dark:focus-within:border-violet-600/50 transition-shadow">
                      <div className="relative rounded-[inherit] min-h-[140px] sm:min-h-[180px]">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Paste your study notes, textbook chapter, article, or any learning material here... (minimum 50 words)"
                          className="relative w-full min-h-[140px] sm:min-h-[180px] p-5 sm:p-6 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-[1.65]"
                          disabled={isGeneratingStudyPack}
                        />
                        <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500 font-medium">
                          {getWordCount(inputText).toLocaleString()} words
                          {getWordCount(inputText) > 0 && getWordCount(inputText) < 50 && <span className="text-amber-500"> (min 50)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => studyToolsFileInputRef.current?.click()}
                          disabled={isParsingStudyDoc || isGeneratingStudyPack}
                          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 border ${showFirstStudyPackPrompt ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 border-violet-300/80 dark:border-violet-700/60 shadow-md ring-2 ring-violet-400/25' : 'bg-stone-50 dark:bg-stone-800/60 text-stone-800 dark:text-stone-200 border-stone-200/90 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700/60 shadow-sm'}`}
                        >
                          {isParsingStudyDoc ? (
                            <span className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          )}
                          {isParsingStudyDoc ? 'Uploading...' : 'Upload file'}
                        </button>
                        {inputText.trim() && (
                          <button onClick={() => setInputText('')} className="px-3 py-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 text-xs font-medium transition-colors">
                            Clear
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleGenerateStudyPack}
                        disabled={isGeneratingStudyPack || studyPackSectionExhausted || getWordCount(inputText) < 50}
                        className="px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold text-base bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 disabled:bg-stone-400 dark:disabled:bg-stone-600 text-white shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 hover:-translate-y-0.5 active:scale-[0.98] disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                      >
                        {isGeneratingStudyPack ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Generating...
                          </>
                        ) : (
                          <>Generate Study Pack</>
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Uploading overlay - hides card content during file parse to prevent flash/layout shift */}
                  {isParsingStudyDoc && (
                    <div className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-sm flex items-center justify-center gap-3 z-20 pointer-events-auto" aria-live="polite" aria-busy="true">
                      <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-stone-700 dark:text-stone-200">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legacy quiz sub-modes kept for backward compat (viewing saved items) - hidden */}
            {false && studyToolMode === 'quiz' && (
              <>
                {/* Quiz Taking View - Mobile optimized */}
                {quizResult && isQuizMode && (
                  <div className={`bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 dark:border-stone-700 overflow-hidden mb-6 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex justify-end p-2 sm:p-3 border-b border-stone-100 dark:border-stone-700">
                      <button onClick={handleEnlargeQuiz} className="p-2 text-stone-500 hover:text-sky-600 dark:text-stone-400 dark:hover:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors" title="Open in full page">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      </button>
                    </div>
                    {quizCompleted ? (
                      <div className="p-5 sm:p-8 text-center">
                        <video
                          src="/happymascot.mp4"
                          autoPlay
                          muted
                          playsInline
                          loop
                          className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 object-contain rounded-xl border-2 border-rose-300 dark:border-rose-500 shadow-lg overflow-hidden ring-2 ring-rose-400/30"
                        />
                        <h2 className="text-xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Quiz Complete!</h2>
                        <div className="text-4xl sm:text-5xl font-bold bg-amber-600 hover:bg-amber-500 bg-clip-text text-transparent my-3 sm:my-4">
                          {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length} correct</p>
                        <div className="flex justify-center gap-2 mt-4 sm:mt-6 mb-3 sm:mb-4">
                          {isPaidUser ? (
                            <>
                              <button onClick={exportQuizToPDF} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg active:bg-red-100 sm:hover:bg-red-100 dark:sm:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                <span className="hidden sm:inline">Download </span>PDF
                              </button>
                              <button onClick={exportQuizToDOCX} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium rounded-lg active:bg-blue-100 sm:hover:bg-blue-100 dark:sm:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                <span className="hidden sm:inline">Download </span>DOCX
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-stone-700 text-gray-400 dark:text-stone-500 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                PDF
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                              <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-stone-700 text-gray-400 dark:text-stone-500 font-medium rounded-lg transition-colors flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                DOCX
                                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-center gap-2 sm:gap-3">
                          <button onClick={() => { setQuizRetakeKey(k => k + 1); setCurrentQuestion(0); setUserAnswers([]); setQuizCompleted(false); setSelectedAnswer(''); setShowQuizResult(false); }} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 font-semibold rounded-xl text-sm sm:text-base">Try Again</button>
                          <button onClick={() => { setQuizResult(null); setIsQuizMode(false); }} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm sm:text-base">New Quiz</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="h-1.5 sm:h-2 bg-stone-200 dark:bg-stone-600"><div className="h-full bg-amber-600 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / dashboardDisplayedQuestions.length) * 100}%` }}></div></div>
                        <div className="p-4 sm:p-6">
                          <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Q{currentQuestion + 1}/{dashboardDisplayedQuestions.length}</span>
                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${dashboardDisplayedQuestions[currentQuestion]?.type === 'multiple_choice' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : dashboardDisplayedQuestions[currentQuestion]?.type === 'true_false' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>
                              {dashboardDisplayedQuestions[currentQuestion]?.type === 'multiple_choice' ? 'MCQ' : dashboardDisplayedQuestions[currentQuestion]?.type === 'true_false' ? 'T/F' : 'Fill'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 leading-relaxed">{dashboardDisplayedQuestions[currentQuestion]?.question}</h3>
                          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                            {dashboardDisplayedQuestions[currentQuestion]?.type === 'multiple_choice' && dashboardDisplayedQuestions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                              const letter = opt.charAt(0);
                              const isSelected = selectedAnswer === letter;
                              const isCorrect = showQuizResult && letter === dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && letter !== dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              return (
                                <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{letter}</span>
                                  <span className="text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                            {dashboardDisplayedQuestions[currentQuestion]?.type === 'true_false' && ['true', 'false'].map((opt) => {
                              const isSelected = selectedAnswer === opt;
                              const isCorrect = showQuizResult && opt === dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && opt !== dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              return (
                                <button key={opt} onClick={() => !showQuizResult && setSelectedAnswer(opt)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{opt === 'true' ? '✓' : '✗'}</span>
                                  <span className="capitalize font-medium text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt}</span>
                                </button>
                              );
                            })}
                            {dashboardDisplayedQuestions[currentQuestion]?.type === 'fill_blank' && dashboardDisplayedQuestions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                              const letter = opt.charAt(0);
                              const isSelected = selectedAnswer === letter;
                              const isCorrect = showQuizResult && letter === dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              const isWrong = showQuizResult && isSelected && letter !== dashboardDisplayedQuestions[currentQuestion].correctAnswer;
                              return (
                                <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                                  className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left flex items-center gap-2.5 sm:gap-3 transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-gray-200 dark:border-stone-600 active:border-amber-300 sm:hover:border-amber-300 dark:sm:hover:border-amber-600'}`}
                                >
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-stone-900' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>{letter}</span>
                                  <span className="text-sm sm:text-base text-stone-800 dark:text-stone-200">{opt.substring(3)}</span>
                                </button>
                              );
                            })}
                          </div>
                          {showQuizResult && dashboardDisplayedQuestions[currentQuestion]?.explanation && (
                            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-4 sm:mb-6 border border-blue-100 dark:border-blue-800/50">
                              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">💡 {dashboardDisplayedQuestions[currentQuestion].explanation}</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-2">
                            <button onClick={() => { if (currentQuestion > 0) { setCurrentQuestion(currentQuestion - 1); setShowQuizResult(false); setSelectedAnswer(''); } }} disabled={currentQuestion === 0} className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-30 text-sm sm:text-base">← <span className="hidden sm:inline">Previous</span></button>
                            {!showQuizResult ? (
                              <button onClick={() => {
                                const q = dashboardDisplayedQuestions[currentQuestion];
                                const ans = selectedAnswer;
                                const correct = ans === q.correctAnswer;
                                setUserAnswers([...userAnswers, { questionId: q.id, answer: ans, isCorrect: correct }]);
                                setShowQuizResult(true);
                              }} disabled={!selectedAnswer} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl disabled:opacity-50 text-sm sm:text-base active:scale-95 transition-transform">Submit</button>
                            ) : (
                              <button onClick={() => {
                                if (currentQuestion + 1 >= dashboardDisplayedQuestions.length) { setQuizCompleted(true); }
                                else { setCurrentQuestion(currentQuestion + 1); setSelectedAnswer(''); setShowQuizResult(false); }
                              }} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm sm:text-base active:scale-95 transition-transform">
                                {currentQuestion + 1 >= dashboardDisplayedQuestions.length ? '🏆 Results' : 'Next →'}
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Quiz Input Form */}
                {!quizResult && (
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Decorative shapes */}
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 pointer-events-none" />
                    <div className="absolute top-1/2 right-8 w-8 h-8 rounded-lg bg-amber-400/15 -rotate-12 hidden sm:block pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-amber-200/60 dark:border-amber-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200/60 dark:border-amber-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex-shrink-0">Type:</span>
                            <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-amber-200/60 dark:border-amber-700/40">
                              {(['mixed', 'multiple_choice', 'true_false', 'fill_blank'] as const).map((t) => {
                                const locked = isFreeUser && t !== 'mixed';
                                return (
                                  <button key={t} onClick={() => !locked && setQuizType(t)} disabled={locked} title={locked ? 'Pro only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-stone-400 cursor-not-allowed' :
                                      quizType === t ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-600'
                                    }`}
                                  >
                                    {t === 'mixed' ? 'Mixed' : t === 'multiple_choice' ? 'MCQ' : t === 'true_false' ? 'T/F' : 'Fill'}
                                    {locked && <span className="ml-1 text-[9px]">🔒</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Difficulty:</span>
                            <div className="flex items-center bg-white dark:bg-stone-700 rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-amber-200/60 dark:border-amber-700/40">
                              {(['easy', 'medium', 'hard'] as const).map((d) => {
                                const locked = isFreeUser && d !== 'medium';
                                return (
                                  <button key={d} onClick={() => !locked && setQuizDifficulty(d)} disabled={locked} title={locked ? 'Pro only' : ''}
                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                      locked ? 'text-stone-400 cursor-not-allowed' :
                                      quizDifficulty === d ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-600'
                                    }`}
                                  >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                    {locked && <span className="ml-1 text-[9px]">🔒</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500">Questions:</span>
                            <select
                              value={isFreeUser ? 10 : quizQuestionCount}
                              onChange={(e) => !isFreeUser && setQuizQuestionCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isFreeUser ? 'Free plan: 10 questions only' : ''}
                            >
                              {isFreeUser ? (
                                <option value={10}>10</option>
                              ) : (
                                [5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)
                              )}
                            </select>
                            {isFreeUser && <span className="text-[9px]">🔒</span>}
                          </div>
                        </div>
                        <button
                          data-tutorial-target="study-generate-btn"
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingQuiz || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingQuiz && canUseQuiz
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-200 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isGeneratingQuiz ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>✨ Generate Quiz</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0" data-tutorial-target="study-input">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-stone-200 dark:border-stone-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => studyToolsFileInputRef.current?.click()}
                            disabled={isParsingStudyDoc}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 font-semibold text-xs transition-colors disabled:opacity-50 border border-amber-200 dark:border-amber-700"
                            title="Upload PDF, Word, or TXT"
                          >
                            {isParsingStudyDoc ? (
                              <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                            {isParsingStudyDoc ? 'Uploading...' : 'Upload Document'}
                          </button>
                          <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingQuiz ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-amber-200 dark:border-amber-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating quiz questions...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={placeholders[placeholderIndex]}
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 100 ? 'text-amber-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-gray-400'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 100 && ' (min 100)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                          {isFreeUser && getWordCount(inputText) <= quizUsage.maxWordsPerGeneration && getWordCount(inputText) >= 100 && ` / ${quizUsage.maxWordsPerGeneration.toLocaleString()} max`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ FLASHCARD SUB-MODE ============ */}
            {false && studyToolMode === 'flashcards' && (
              <>
                {/* Flashcard Interactive View with Customization */}
                {flashcardResult ? (
                  <div className="mb-4 sm:mb-6">
                    <FlashcardViewer
                      initialCards={flashcardResult.cards ?? []}
                      title={flashcardResult.title || 'Flashcards'}
                      onExportPDF={isPaidUser ? exportFlashcardsToPDF : undefined}
                      onExportDOCX={isPaidUser ? exportFlashcardsToDOCX : undefined}
                      onExportJSON={exportFlashcardsToJSON}
                      onNewDeck={() => setFlashcardResult(null)}
                      canExport={isPaidUser}
                      onLoadPrevious={() => (onNavigate as (p: string, s?: string, o?: { quizHistoryFilter?: string }) => void)('quiz-history', undefined, { quizHistoryFilter: 'flashcards' })}
                      isCreateFromScratch={!flashcardResult.cards || flashcardResult.cards.length === 0}
                      onEnlarge={handleEnlargeFlashcards}
                      onSaveToStudyTools={user ? async (title, cards) => {
                        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                        if (!token) { onNavigate('signup'); return; }
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/save-flashcards`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ title, cards, sourceText: inputText })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Failed to save');
                        trackAction('flashcards_count');
                      } : undefined}
                    />
                  </div>
                ) : (
                  /* Flashcard Input Form */
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-emerald-400/10 pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-emerald-200/60 dark:border-emerald-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200/60 dark:border-emerald-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">Cards:</span>
                            <select value={isFreeUser ? 15 : flashcardCount}
                              onChange={(e) => !isFreeUser && setFlashcardCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white dark:bg-stone-700 border border-emerald-200/60 dark:border-emerald-700/40 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={15}>15</option> : [5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFlashcardResult({ title: 'My Flashcards', cards: [] })}
                            className="px-4 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                          >
                            ✏️ Create from Scratch
                          </button>
                          <button
                            data-tutorial-target="study-generate-btn"
                            onClick={handleSubmit}
                            disabled={!isTextValid() || isGeneratingFlashcards || !canUseQuiz}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                              isTextValid() && !isGeneratingFlashcards && canUseQuiz
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 cursor-pointer'
                                : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            {isGeneratingFlashcards ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>🃏 Generate with AI</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-200/50 dark:border-emerald-700/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => studyToolsFileInputRef.current?.click()}
                            disabled={isParsingStudyDoc}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 font-semibold text-xs transition-colors disabled:opacity-50 border border-emerald-200 dark:border-emerald-700"
                            title="Upload PDF, Word, or TXT"
                          >
                            {isParsingStudyDoc ? (
                              <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                            {isParsingStudyDoc ? 'Uploading...' : 'Upload Document'}
                          </button>
                          <button onClick={() => setInputText('')} className={`text-xs text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingFlashcards ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Creating your flashcard deck...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes, textbook content, or any material to turn into flashcards..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-emerald-50/30 dark:bg-emerald-900/5 border-t border-emerald-200/50 dark:border-emerald-700/30">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-emerald-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ CROSSWORD SUB-MODE ============ */}
            {false && studyToolMode === 'crossword' && (
              <>
                {/* Crossword Interactive View */}
                {crosswordResult && crosswordResult.placedWords?.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100">{crosswordResult.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={handleEnlargeCrossword} className="p-2 text-stone-500 hover:text-sky-600 dark:text-stone-400 dark:hover:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors" title="Open in full page">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                        {isPaidUser ? (
                          <>
                            <button onClick={exportCrosswordToPDF} className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={exportCrosswordToDOCX} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              PDF
                            </button>
                            <button onClick={() => setShowExportUpgradeModal(true)} className="px-3 py-1.5 bg-gray-100 text-gray-400 font-medium rounded-lg flex items-center gap-1.5 text-xs cursor-pointer">
                              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                              DOCX
                            </button>
                          </>
                        )}
                        {!crosswordChecked && (
                          <>
                            <button
                              onClick={handleCrosswordHint}
                              className="px-4 py-2 text-sm font-medium bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                              title="Reveal one letter from the selected word"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                              Hint {hintsUsed > 0 && <span className="text-xs bg-rose-200 text-rose-800 rounded-full px-1.5 py-0.5 font-bold">{hintsUsed}</span>}
                            </button>
                            <button onClick={() => setCrosswordChecked(true)}
                              className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg">
                              Check Answers
                            </button>
                          </>
                        )}
                        <button onClick={() => { setCrosswordResult(null); setCrosswordAnswers({}); setCrosswordChecked(false); setSelectedClue(null); setSelectedCell(null); setSelectedDirection('across'); setHintsUsed(0); }}
                          className="px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-lime-100 dark:hover:bg-lime-800/50 font-medium">
                          New Puzzle
                        </button>
                      </div>
                    </div>

                    {crosswordChecked && (() => {
                      // Only count words that were attempted (have some answer)
                      const attemptedWords = crosswordResult.placedWords.filter((pw: any) => 
                        (crosswordAnswers[`word-${pw.number}`] || '').length > 0
                      );
                      const total = attemptedWords.length;
                      const correct = attemptedWords.filter((pw: any) => {
                        const ans = (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase();
                        return ans === pw.word;
                      }).length;
                      const notAttempted = crosswordResult.placedWords.length - total;
                      
                      return (
                        <div className={`mb-4 p-4 rounded-2xl text-center ${total === 0 ? 'bg-gray-50 border border-gray-200' : correct === total ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-lime-200 dark:border-lime-700'}`}>
                          {total === 0 ? <span className="text-3xl mb-1 block">✏️</span> : correct === total ? (
                            <video src="/happymascot.mp4" autoPlay muted playsInline loop className="w-16 h-16 mx-auto mb-1 object-contain rounded-xl border-2 border-rose-300 dark:border-rose-500 shadow-lg overflow-hidden ring-2 ring-rose-400/30" />
                          ) : <span className="text-3xl mb-1 block">📊</span>}
                          {total === 0 ? (
                            <>
                              <p className="font-bold text-lg">No answers submitted</p>
                              <p className="text-sm text-gray-600">Type in some answers and try again!</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-lg">{correct} / {total} correct</p>
                              <p className="text-sm text-gray-600">
                                {correct === total ? 'Perfect score on attempted words!' : 'Check the highlighted answers below.'}
                                {notAttempted > 0 && ` (${notAttempted} word${notAttempted > 1 ? 's' : ''} not attempted)`}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Crossword Grid - Now Interactive */}
                      <div 
                        className="bg-white rounded-2xl border border-gray-200 p-4 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-rose-400"
                        tabIndex={0}
                        onKeyDown={handleCrosswordKeyDown}
                      >
                        <p className="text-xs text-gray-500 mb-3">Click a cell to type, or use the clue inputs below. Arrow keys to navigate.</p>
                        <div className="inline-block">
                          {crosswordResult.grid?.map((row: string[], rowIdx: number) => (
                            <div key={rowIdx} className="flex">
                              {row.map((cell: string, colIdx: number) => {
                                if (cell === '' || cell === '#') {
                                  return <div key={colIdx} className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-stone-800 dark:bg-stone-700" />;
                                }
                                const wordAtCell = crosswordResult.placedWords.find((pw: any) => pw.row === rowIdx && pw.col === colIdx);
                                const cellNumber = wordAtCell?.number;
                                const typedLetter = getCellLetter(rowIdx, colIdx);
                                const isSelectedCell = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                                
                                let isHighlighted = false;
                                if (selectedClue !== null) {
                                  const sel = crosswordResult.placedWords.find((pw: any) => pw.number === selectedClue);
                                  if (sel) {
                                    if (sel.direction === 'across' && rowIdx === sel.row && colIdx >= sel.col && colIdx < sel.col + sel.length) isHighlighted = true;
                                    if (sel.direction === 'down' && colIdx === sel.col && rowIdx >= sel.row && rowIdx < sel.row + sel.length) isHighlighted = true;
                                  }
                                }
                                
                                let cellColor = 'bg-white border-gray-300 hover:border-amber-300';
                                if (isSelectedCell) cellColor = 'bg-amber-200 border-amber-500 ring-2 ring-amber-400';
                                else if (isHighlighted) cellColor = 'bg-amber-50 border-amber-400';
                                
                                if (crosswordChecked) {
                                  const wordsThrough = crosswordResult.placedWords.filter((pw: any) => {
                                    if (pw.direction === 'across') return rowIdx === pw.row && colIdx >= pw.col && colIdx < pw.col + pw.length;
                                    return colIdx === pw.col && rowIdx >= pw.row && rowIdx < pw.row + pw.length;
                                  });
                                  // Only check words that have been attempted (have some answer)
                                  const attemptedWords = wordsThrough.filter((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').length > 0);
                                  const anyCorrect = attemptedWords.some((pw: any) => (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase() === pw.word);
                                  const anyWrong = attemptedWords.some((pw: any) => {
                                    const ans = (crosswordAnswers[`word-${pw.number}`] || '').toUpperCase();
                                    return ans !== pw.word;
                                  });
                                  if (attemptedWords.length > 0) {
                                    if (anyCorrect && !anyWrong) cellColor = 'bg-green-50 border-green-400';
                                    else if (anyWrong) cellColor = 'bg-red-50 border-red-400';
                                  }
                                }
                                return (
                                  <div 
                                    key={colIdx} 
                                    onClick={() => handleCellClick(rowIdx, colIdx)}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 border ${cellColor} flex items-center justify-center relative cursor-pointer transition-colors`}
                                  >
                                    {cellNumber && <span className="absolute top-0 left-0.5 text-[8px] font-bold text-gray-500 leading-none">{cellNumber}</span>}
                                    {/* Show typed letter or revealed answer */}
                                    <span className="text-xs sm:text-sm font-bold text-gray-700">
                                      {crosswordChecked ? cell : typedLetter}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clues List */}
                      <div className="space-y-4">
                        {['across', 'down'].map(dir => {
                          const words = crosswordResult.placedWords.filter((pw: any) => pw.direction === dir).sort((a: any, b: any) => a.number - b.number);
                          if (words.length === 0) return null;
                          return (
                            <div key={dir}>
                              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">{dir === 'across' ? 'Across →' : 'Down ↓'}</h4>
                              <div className="space-y-2">
                                {words.map((pw: any) => {
                                  const answerKey = `word-${pw.number}`;
                                  const hasAnswer = (crosswordAnswers[answerKey] || '').length > 0;
                                  const isCorrect = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() === pw.word;
                                  const isWrong = crosswordChecked && hasAnswer && (crosswordAnswers[answerKey] || '').toUpperCase() !== pw.word;
                                  const isNotAttempted = crosswordChecked && !hasAnswer;
                                  return (
                                    <div key={pw.number}
                                      onClick={() => {
                                        const newSelected = selectedClue === pw.number ? null : pw.number;
                                        setSelectedClue(newSelected);
                                        if (newSelected !== null) {
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                          setSelectedDirection(pw.direction);
                                        } else {
                                          setSelectedCell(null);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedClue === pw.number ? 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/30 shadow-sm' :
                                        isCorrect ? 'border-green-300 bg-green-50' :
                                        isWrong ? 'border-red-300 bg-red-50' :
                                        isNotAttempted ? 'border-gray-200 bg-gray-50 opacity-60' :
                                        'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{pw.number}</span>
                                        <p className="text-sm text-gray-700">{pw.clue} <span className="text-gray-400">({pw.word.length} letters)</span></p>
                                      </div>
                                      <input
                                        type="text"
                                        maxLength={pw.word.length}
                                        value={crosswordAnswers[answerKey] || ''}
                                        onChange={(e) => {
                                          const newValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                          setCrosswordAnswers({ ...crosswordAnswers, [answerKey]: newValue });
                                          // Sync cell selection to this word
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          // Move cursor to end of typed word
                                          const cellOffset = Math.min(newValue.length, pw.word.length - 1);
                                          if (pw.direction === 'across') {
                                            setSelectedCell({ row: pw.row, col: pw.col + cellOffset });
                                          } else {
                                            setSelectedCell({ row: pw.row + cellOffset, col: pw.col });
                                          }
                                        }}
                                        onFocus={() => {
                                          setSelectedClue(pw.number);
                                          setSelectedDirection(pw.direction);
                                          setSelectedCell({ row: pw.row, col: pw.col });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={crosswordChecked}
                                        placeholder={'_'.repeat(pw.word.length)}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-[0.3em] uppercase ${
                                          isCorrect ? 'border-green-400 bg-green-50 text-green-700' :
                                          isWrong ? 'border-red-400 bg-red-50 text-red-700' :
                                          'border-gray-200 bg-gray-50 text-gray-800'
                                        } ${crosswordChecked ? 'cursor-not-allowed' : ''}`}
                                      />
                                      {isWrong && crosswordChecked && (
                                        <p className="text-xs text-red-500 mt-1">Answer: <span className="font-mono font-bold">{pw.word}</span></p>
                                      )}
                                      {isNotAttempted && (
                                        <p className="text-xs text-gray-400 mt-1 italic">Not attempted</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Crossword Input Form */
                  <div className={`relative rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 opacity-20 rotate-12 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-orange-400/10 pointer-events-none" />
                    <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-orange-200/60 dark:border-orange-700/40 shadow-inner">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200/60 dark:border-orange-700/40 px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Words:</span>
                            <select value={isFreeUser ? 10 : crosswordWordCount}
                              onChange={(e) => !isFreeUser && setCrosswordWordCount(Number(e.target.value))}
                              disabled={isFreeUser}
                              className={`px-2 py-1.5 bg-white dark:bg-stone-700 border border-orange-200/60 dark:border-orange-700/40 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 ${isFreeUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {isFreeUser ? <option value={10}>10</option> : [6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <button
                          data-tutorial-target="study-generate-btn"
                          onClick={handleSubmit}
                          disabled={!isTextValid() || isGeneratingCrossword || !canUseQuiz}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                            isTextValid() && !isGeneratingCrossword && canUseQuiz
                              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/25 cursor-pointer'
                              : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {isGeneratingCrossword ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>🧩 Generate Crossword</>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-200/50 dark:border-orange-700/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Source Material</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => studyToolsFileInputRef.current?.click()}
                            disabled={isParsingStudyDoc}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/50 font-semibold text-xs transition-colors disabled:opacity-50 border border-orange-200 dark:border-orange-700"
                            title="Upload PDF, Word, or TXT"
                          >
                            {isParsingStudyDoc ? (
                              <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                            {isParsingStudyDoc ? 'Uploading...' : 'Upload Document'}
                          </button>
                          <button onClick={() => setInputText('')} className={`text-xs text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                          <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">Paste</button>
                        </div>
                      </div>
                      <div className="relative">
                        {isGeneratingCrossword ? (
                          <div className="min-h-[350px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 border-4 border-orange-200 dark:border-orange-700 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Building your crossword puzzle...</p>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your study notes or textbook content — key terms will be extracted for the crossword puzzle..."
                            className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-stone-800 dark:text-stone-100 text-[15px] border-none outline-none resize-none bg-transparent placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-orange-50/30 dark:bg-orange-900/5 border-t border-orange-200/50 dark:border-orange-700/30">
                        <span className={`text-xs font-medium ${
                          getWordCount(inputText) < 50 ? 'text-orange-600' :
                          (isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration) ? 'text-red-600' :
                          'text-stone-400 dark:text-stone-500'
                        }`}>
                          {getWordCount(inputText)} words
                          {getWordCount(inputText) < 50 && ' (min 50)'}
                          {isFreeUser && getWordCount(inputText) > quizUsage.maxWordsPerGeneration && ` (max ${quizUsage.maxWordsPerGeneration.toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============ CRATER BLAST SUB-MODE ============ */}
            {false && studyToolMode === 'crater_blast' && (
              <div className="bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl shadow-xl border border-rose-200/50 dark:border-rose-800/30 overflow-hidden mb-6">
                <div className="p-8 sm:p-10 text-center relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-rose-500/20 blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-lg bg-rose-500/10 rotate-12" />
                  <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-rose-600 shadow-lg shadow-rose-500/30">
                    <span className="text-3xl">💥</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Crater Blast</h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto mb-6">
                    AI-generated quiz craters fall from the sky. Aim your cannon and blast the correct answer before it lands. Build streaks and test your reflexes!
                  </p>
                  <button
                    onClick={() => onNavigate('crater-blast')}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg bg-rose-600 hover:bg-rose-500 shadow-rose-500/25"
                  >
                    Play Crater Blast →
                  </button>
                </div>
              </div>
            )}

            {quizError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{quizError}</p>
                {(quizExhausted || quizError.includes('Upgrade')) && (
                  <>
                    <p className="text-red-600 dark:text-red-500 text-xs mt-1">{getResetsInText(usageStats.daysUntilReset ?? quizUsage.daysUntilReset)}</p>
                    <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                      View Plans
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ))}

        {/* Urgency warning when study tools or citations are expiring soon (≤7 days) */}
        {isFreeUser && (() => {
          const expiringSoonCount = getExpiringSoonCount(recentActivity, 7);
          const urgencyText = getExpiringSoonUrgencyText(expiringSoonCount);
          return expiringSoonCount > 0 && urgencyText && (
            <div className={`mt-8 sm:mt-10 p-4 rounded-xl border ${expiringSoonCount <= 2 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl flex-shrink-0">{expiringSoonCount <= 2 ? '⚠️' : '⏰'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${expiringSoonCount <= 2 ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                    {urgencyText}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${expiringSoonCount <= 2 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          );
        })()}

        {/* Recent Activity - Mobile optimized with horizontal scroll */}
        <div className={isFreeUser && getExpiringSoonCount(recentActivity, 7) > 0 ? 'mt-4' : 'mt-8 sm:mt-10'} data-tutorial="saved-materials">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-stone-900 dark:text-white flex items-center gap-2 tracking-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              <span className="text-xl sm:text-2xl">📂</span> Recents
            </h2>
            {recentActivity.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-3">
                {recentActivity.some(a => a.type === 'document' || a.type === 'analysis') && (
                  <button onClick={() => onNavigate('library')} className="text-xs sm:text-sm text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-violet-100 font-semibold transition-colors px-2 py-1 rounded-lg active:bg-violet-50 dark:active:bg-violet-950/40">
                    Library
                  </button>
                )}
                {recentActivity.some(a => a.type === 'quiz' || a.type === 'flashcard' || a.type === 'crossword' || a.type === 'lesson') && (
                  <button onClick={() => onNavigate('quiz-history')} className="text-xs sm:text-sm text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-violet-100 font-semibold transition-colors px-2 py-1 rounded-lg active:bg-violet-50 dark:active:bg-violet-950/40">
                    History
                  </button>
                )}
                {recentActivity.some(a => a.type === 'citation') && (
                  <button onClick={() => onNavigate('citation-history')} className="text-xs sm:text-sm text-violet-800 dark:text-violet-300 hover:text-violet-950 dark:hover:text-violet-100 font-semibold transition-colors px-2 py-1 rounded-lg active:bg-violet-50 dark:active:bg-violet-950/40">
                    Citations
                  </button>
                )}
              </div>
            )}
          </div>
          
          {(isLoading || isActivityLoading) ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-stone-200/40 dark:border-stone-700/40 rounded-xl sm:rounded-3xl p-3 sm:p-4 animate-pulse">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stone-200 dark:bg-stone-700 rounded-lg sm:rounded-xl flex-shrink-0" />
                    <div className="h-4 sm:h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-12 sm:w-16" />
                  </div>
                  <div className="h-3.5 sm:h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-full mb-1.5 sm:mb-2" />
                  <div className="h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-700/60 rounded-lg w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredActivity.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 scrollbar-hide snap-x snap-mandatory">
              {filteredActivity.slice(0, 7).map((activity) => {
                const meta = activityMeta[activity.type];
                return (
                  <div 
                    key={activity.id}
                    className={`relative overflow-hidden rounded-xl sm:rounded-3xl p-3 sm:p-4 border ${meta.border} bg-gradient-to-br ${meta.cardBg} backdrop-blur-sm sm:hover:shadow-xl sm:hover:-translate-y-1 sm:hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Decorative shapes - hidden on mobile for cleaner look */}
                    <div className="hidden sm:block">
                      {meta.shape === 'circle' && (
                        <>
                          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/40 dark:bg-black/10 blur-sm group-hover:scale-110 transition-transform" />
                          <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-white/30 dark:bg-black/10" />
                        </>
                      )}
                      {meta.shape === 'square' && (
                        <>
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/30 dark:bg-black/10 rotate-12 group-hover:rotate-0 transition-transform" />
                          <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-lg bg-white/20 dark:bg-black/5 -rotate-6" />
                        </>
                      )}
                      {meta.shape === 'diamond' && (
                        <>
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white/40 dark:bg-black/10 rotate-45" />
                          <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/30 dark:bg-black/10 rotate-45" />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 relative z-10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${meta.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 sm:group-hover:scale-110 transition-transform shadow-sm`}>
                        <span className="text-base sm:text-lg">{meta.emoji}</span>
                      </div>
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 ${meta.bg} text-[9px] sm:text-[10px] font-bold rounded-md sm:rounded-lg uppercase tracking-wide ${meta.accent}`}>{meta.label}</span>
                    </div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-xs sm:text-sm truncate sm:group-hover:opacity-90 transition-opacity mb-0.5 sm:mb-1 relative z-10">{activity.title}</h3>
                    <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate relative z-10">{activity.subtitle}</p>
                    <div className="flex items-center gap-2 mt-1.5 sm:mt-2 relative z-10">
                      <span className="text-[9px] sm:text-[10px] font-medium text-stone-400 dark:text-stone-500">{relativeTime(activity.date)}</span>
                      {isFreeUser && activity.expires_at && (() => {
                        const days = getDaysUntilExpiration(activity.expires_at);
                        if (days === null || days > 7) return null;
                        return (
                          <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded ${days <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                            {days <= 0 ? 'Expires today' : `${days}d left`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 sm:py-10 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 dark:border-stone-600/50 shadow-xl">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-100 dark:bg-stone-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-semibold mb-1 text-sm sm:text-base">No results for "{searchQuery}"</p>
              <p className="text-stone-400 dark:text-stone-500 text-xs sm:text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-white/90 dark:bg-stone-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 dark:border-stone-600/50 shadow-xl">
              {/* Actionable empty state with clear first steps */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-100 to-stone-100 dark:from-violet-950/50 dark:to-stone-900/60 rounded-2xl border border-violet-200/60 dark:border-violet-800/40 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-3xl sm:text-4xl">📚</span>
              </div>
              <p className="text-stone-800 dark:text-stone-200 font-semibold text-base sm:text-lg mb-1">No recent activity yet</p>
              <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mb-5 sm:mb-6 max-w-[280px] sm:max-w-sm mx-auto px-4">Try one of these to get started: upload an essay for feedback, generate a study pack from notes, or find citations for your topic.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center flex-wrap">
                <button
                  onClick={() => {
                    setMode('analyze');
                    setTimeout(() => document.querySelector('[data-tutorial="essay-upload"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 hover:shadow-lg text-sm"
                >
                  <span>📝</span>
                  Analyze an Essay
                </button>
                <button
                  onClick={() => {
                    setMode('quiz');
                    setTimeout(() => document.querySelector('[data-tutorial="study-pack-input"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-stone-800 hover:bg-stone-900 dark:bg-stone-600 dark:hover:bg-stone-500 text-white font-semibold rounded-xl transition-all shadow-md ring-1 ring-stone-900/10 hover:shadow-lg text-sm"
                >
                  <span>📦</span>
                  Generate Study Pack
                </button>
                <button
                  onClick={() => setMode('citations')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 font-semibold rounded-xl transition-all shadow-sm hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md text-sm"
                >
                  <span>📚</span>
                  Find Citations
                </button>
                <button
                  onClick={() => onNavigate('upload')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500 text-stone-800 dark:text-stone-100 font-semibold rounded-xl transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Upload Document
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Monthly Usage */}
        {!loadingStats && (
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-stone-200/40 dark:border-stone-700/30">
            <div className="p-5 rounded-2xl bg-white/95 dark:bg-stone-900/50 backdrop-blur-sm border border-stone-200/90 dark:border-stone-700/60 shadow-md">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-700 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Monthly Usage
              </h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {getResetsInText(usageStats.daysUntilReset)}
                </span>
            </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(usageStats.plan === 'pro' || usageStats.plan === 'premium') && (usageStats as any).combinedActionsRemaining != null ? (
                  <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30 sm:col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">Combined (analyses, study packs, citations)</span>
              </div>
                    <div className={`text-lg font-bold ${
                      (usageStats as any).combinedActionsRemaining === -1 ? 'text-lime-600 dark:text-lime-400' :
                      (usageStats as any).combinedActionsRemaining <= 0 ? 'text-red-500' :
                      (usageStats as any).combinedActionsRemaining <= 10 ? 'text-amber-500' : 'text-stone-800 dark:text-stone-100'
                    }`}>
                      {(usageStats as any).combinedActionsRemaining === -1 ? '∞' : (usageStats as any).combinedActionsRemaining}
                      <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
              </div>
                  </div>
                      ) : (
                        <>
                    <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">📝</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Essay analyses</span>
                    </div>
                      <div className={`text-lg font-bold ${
                        usageStats.analysesRemaining === -1 ? 'text-lime-600 dark:text-lime-400' :
                        usageStats.analysesRemaining <= 0 ? 'text-red-500' :
                        usageStats.analysesRemaining <= 1 ? 'text-amber-500' : 'text-stone-800 dark:text-stone-100'
                      }`}>
                        {usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
              </div>
            </div>
                    <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">📚</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Citations</span>
                    </div>
                      <div className={`text-lg font-bold ${
                        usageStats.citationsRemaining === -1 ? 'text-lime-600 dark:text-lime-400' :
                        usageStats.citationsRemaining <= 0 ? 'text-red-500' :
                        usageStats.citationsRemaining <= 1 ? 'text-amber-500' : 'text-stone-800 dark:text-stone-100'
                      }`}>
                        {usageStats.citationsRemaining === -1 ? '∞' : usageStats.citationsRemaining}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                    </div>
                  </div>
                    <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">📦</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Study Packs</span>
            </div>
                      <div className={`text-lg font-bold ${
                        usageStats.studyPacksRemaining === -1 ? 'text-lime-600 dark:text-lime-400' :
                        usageStats.studyPacksRemaining <= 0 ? 'text-red-500' :
                        usageStats.studyPacksRemaining <= 1 ? 'text-amber-500' : 'text-stone-800 dark:text-stone-100'
                      }`}>
                        {usageStats.studyPacksRemaining === -1 ? '∞' : usageStats.studyPacksRemaining}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">📄</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">Uploads</span>
                  </div>
                  <div className={`text-lg font-bold ${
                    usageStats.uploadsRemaining === -1 ? 'text-lime-600 dark:text-lime-400' :
                    usageStats.uploadsRemaining <= 0 ? 'text-red-500' :
                    usageStats.uploadsRemaining <= 1 ? 'text-amber-500' : 'text-stone-800 dark:text-stone-100'
                  }`}>
                    {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining}
                    <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                  </div>
                </div>
              </div>
              {usageStats.plan === 'free' && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="text-xs font-medium text-violet-800 dark:text-violet-300 hover:underline"
                  >
                    Upgrade for more limits →
            </button>
          </div>
              )}
        </div>
          </div>
        )}

          {/* Full tool cards — moved below main flows so the hero stays prominent */}
          <div id="dashboard-all-tools" className="mt-8 pt-6 border-t border-stone-200/60 dark:border-stone-700/50 scroll-mt-8">
            <p className="text-[11px] sm:text-xs font-medium text-stone-500 dark:text-stone-400 mb-3">All tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 opacity-90">
              {[
                { id: 'analyze' as const, title: 'Analyze', desc: 'Professor-style essay feedback', emoji: '📝', iconWrap: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50', titleClr: 'text-stone-900 dark:text-stone-50', badgeText: 'Popular', badgeClr: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-600' },
                { id: 'citations' as const, title: 'Citations', desc: 'Academic sources, formatted', emoji: '📚', iconWrap: 'bg-sky-50 dark:bg-sky-950/35 border border-sky-200/70 dark:border-sky-800/50', titleClr: 'text-stone-900 dark:text-stone-50', badgeText: undefined as string | undefined, badgeClr: '' },
                { id: 'quiz' as const, title: 'Study Pack', desc: 'Lesson, quiz, crossword & more', emoji: '📦', iconWrap: 'bg-amber-50 dark:bg-amber-950/35 border border-amber-200/70 dark:border-amber-800/50', titleClr: 'text-stone-900 dark:text-stone-50', badgeText: '5-in-1', badgeClr: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-600' },
                { id: 'focus_mode' as const, title: 'Focus Mode', desc: 'Block sites until you study', emoji: '🔒', iconWrap: 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-800/50', titleClr: 'text-stone-900 dark:text-stone-50', badgeText: FOCUS_MODE_COMING_SOON ? 'Soon' : 'New', badgeClr: FOCUS_MODE_COMING_SOON ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/50' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-600' },
                { id: 'more-tools' as const, title: 'More Tools', desc: 'Summarizer, grammar & more', emoji: '🔧', iconWrap: 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-600/80', titleClr: 'text-stone-900 dark:text-stone-50', badgeText: undefined as string | undefined, badgeClr: '' },
              ].map((card) => {
                const isActive = (card.id === 'analyze' && mode === 'analyze') || (card.id === 'citations' && mode === 'citations') || (card.id === 'quiz' && mode === 'quiz') || (card.id === 'focus_mode' && mode === 'focus_mode');
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => card.id === 'more-tools' ? onNavigate('more-tools') : (card.id === 'quiz' ? (() => { setMode('quiz'); setShowWordWarning(false); setSummaryResult(null); setQuizResult(null); setFlashcardResult(null); setCrosswordResult(null); setStudyPackResult(null); })() : setMode(card.id))}
                    className={`relative overflow-hidden rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:shadow-md bg-white dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-700/90 shadow-sm dark:shadow-black/20 ${isActive ? 'ring-2 ring-violet-600 dark:ring-violet-500 ring-offset-1 ring-offset-stone-50 dark:ring-offset-stone-950' : ''}`}
                  >
                    {card.badgeText && (
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide ${card.badgeClr}`}>
                        {card.badgeText}
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2 shadow-sm ${card.iconWrap}`}>{card.emoji}</div>
                    <h3 className={`font-semibold text-xs sm:text-sm ${card.titleClr} mb-0.5`}>{card.title}</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] sm:text-xs leading-snug line-clamp-2">{card.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

      </main>

      {/* Analysis Popup */}
      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          text="Analyzing your writing"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}

      {/* Citation Search Animation - same as landing page */}
      {showSearchAnimation && (
        <AnalysisAnimation
          isPopup={true}
          text="Finding citations for your topic"
          isComplete={false}
          variant="citations"
        />
      )}

      {/* Export Upgrade Modal (for locked export features) - Mobile optimized */}
      {showExportUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Unlock Export</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Export quizzes, flashcards & crosswords to PDF or Word.
              </p>
            </div>
            
            <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-600/60 rounded-xl p-3.5 sm:p-4 mb-5 sm:mb-6">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2.5 sm:mb-3 text-sm sm:text-base">Paid Plan Benefits:</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to PDF & Word
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Permanent storage
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited generations
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowExportUpgradeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl active:bg-gray-100 dark:active:bg-gray-700 sm:hover:bg-gray-50 dark:sm:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                Maybe Later
              </button>
              <button
                onClick={() => { setShowExportUpgradeModal(false); onNavigate('pricing'); }}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl active:from-amber-700 active:to-orange-700 sm:hover:from-amber-700 sm:hover:to-orange-700 transition-all font-medium text-sm sm:text-base"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />

    </div>
  );
};

export default Dashboard;
