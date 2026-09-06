import { useState, useEffect, useRef } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import LoadingSpinner from '../common/LoadingSpinner';
import LevelUpCelebration from '../common/LevelUpCelebration';
import { trackEvent } from '../../utils/analytics';
import { getResetsInText } from '../../utils/usageReset';
import CitationsPage, { type EmbeddedDashboardTool } from './CitationsPage';
import StudyPackPage from './StudyPackPage';
import { MoreToolsGrid } from './MoreToolsPage';
import DailyReviewTab from './DailyReviewTab';
import FeatureHub, { type HubItem } from '../common/FeatureHub';
import MobileDashboard from './MobileDashboard';
import {
  AnalysisPreviewSection,
  StudyPackPreviewSection,
  CitationsPreviewSection,
} from '../common/PreviewSections';
import {
  getTotalXP,
  getLevelInfo,
  getUnlockedBadges,
  BADGES,
  type Badge,
} from '../../data/achievements';
import {
  getOnboardingCompletedAt,
  FIRST_SOFT_PAYWALL_FIRED_KEY,
  POST_ONBOARDING_PAYWALL_FALLBACK_MS,
  SOFT_PAYWALL_OPEN_KEY,
  isSoftPaywallOnCooldown,
} from '../../constants/paywallSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type DashboardTool = 'daily_review' | 'analyze' | 'citations' | 'study_pack' | 'more_tools';

interface PlanLimitsSubset {
  analysesPerMonth?: number;
  citationSearchesPerMonth?: number;
  studyPackGenerationsPerMonth?: number;
  documentsPerMonth?: number;
  combinedActionsPerMonth?: number;
}

interface UsageStatsShape {
  plan: string;
  analysesRemaining: number;
  citationsRemaining: number;
  studyPacksRemaining: number;
  uploadsRemaining: number;
  daysUntilReset?: number | null;
  combinedActionsRemaining?: number;
  /** From GET /subscriptions/usage — drives correct monthly caps (esp. pooled Pro/Premium vs free caps). */
  planLimits?: PlanLimitsSubset | null;
}

interface DashboardProps {
  onNavigate: (page: string, slug?: string, options?: { studyPack?: { data: unknown; title?: string } }) => void;
  user: any;
  onLogout: () => void;
  onUserUpdate?: (updates: { welcomeTutorialCompleted?: boolean }) => void;
  initialMode?: string;
}

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFirstName = (u: any): string => {
  if (!u) return '';
  if (u.firstName?.trim()) return u.firstName.trim().split(' ')[0];
  if (u.name?.trim() && !u.name.includes('@')) return u.name.trim().split(' ')[0];
  return '';
};

const getWordCount = (text: string): number => {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
};

const getMaxFileSizeBytes = (plan: string) => {
  const p = (plan || 'free').toLowerCase();
  return p === 'pro' || p === 'premium' || p === 'focus' ? 100 * 1024 * 1024 : 2 * 1024 * 1024;
};

const getMaxFileSizeLabel = (plan: string) =>
  getMaxFileSizeBytes(plan) >= 100 * 1024 * 1024 ? '100 MB' : '2 MB';

interface RecentAnalysis {
  id: string;
  title: string;
  grade?: string;
  score?: number;
  createdAt: Date;
}

const DASHBOARD_TOOL_ITEMS = [
  {
    id: 'analyze' as const,
    title: 'Analyze Essay',
    desc: 'Professor-style essay feedback',
    emoji: '📝',
    iconClass: 'bg-[#FF4B4B]',
    activeBar: 'border-l-[#FF4B4B]',
    titleClass: 'text-[#FF4B4B]',
    activeBg: 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/10',
    accent: 'rose',
    // Quality-anchored badge — Study Pack owns "Popular," so Analyze
    // leans into the AI-quality angle. Reinforces the "professor-style
    // feedback" USP without competing on popularity claims.
    badge: '✨ Smartest AI',
  },
  {
    id: 'study_pack' as const,
    title: 'Study Pack',
    desc: 'Quiz, flashcards, lessons',
    emoji: '📦',
    iconClass: 'bg-[#FF9600]',
    activeBar: 'border-l-[#FF9600]',
    titleClass: 'text-[#FF9600]',
    activeBg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10',
    accent: 'amber',
    badge: '🔥 Popular',
  },
  {
    id: 'daily_review' as const,
    title: 'Daily Review',
    desc: 'Quick daily practice session',
    emoji: '🎯',
    iconClass: 'bg-[#58CC02]',
    activeBar: 'border-l-[#58CC02]',
    titleClass: 'text-[#58CC02]',
    activeBg: 'bg-[#E5F8D0] dark:bg-[#58CC02]/10',
    accent: 'green',
  },
  {
    id: 'citations' as const,
    title: 'Citations',
    desc: 'Find & format sources',
    emoji: '📚',
    iconClass: 'bg-[#1CB0F6]',
    activeBar: 'border-l-[#1CB0F6]',
    titleClass: 'text-[#1CB0F6]',
    activeBg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10',
    accent: 'sky',
  },
  {
    id: 'more_tools' as const,
    title: 'More tools',
    desc: 'Summarizer, grammar & more',
    emoji: '✨',
    iconClass: 'bg-[#A560E8]',
    activeBar: 'border-l-[#A560E8]',
    titleClass: 'text-[#A560E8]',
    activeBg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10',
    accent: 'violet',
  },
] as const;

const WORKSPACE_SHORTCUTS = [
  { id: 'library', label: 'Library', hint: 'Papers & analyses', page: 'library' as const, emoji: '📁' },
  { id: 'upload', label: 'Upload', hint: 'Add a file', page: 'upload' as const, emoji: '⬆️' },
  { id: 'quiz-history', label: 'Study history', hint: 'Quizzes & study packs', page: 'quiz-history' as const, emoji: '📜' },
  { id: 'citation-history', label: 'Citation history', hint: 'Past source searches', page: 'citation-history' as const, emoji: '🔍' },
  { id: 'focus-mode', label: 'Focus mode', hint: 'Distraction-free writing', page: 'focus-mode' as const, emoji: '🎯' },
  { id: 'help', label: 'Help center', hint: 'Guides & FAQs', page: 'help' as const, emoji: '💡' },
] as const;

/** Dashboard hero subtitle: essay line only on Analyze; Study Pack & Citations get tailored copy; More tools differs. */
const getWorkspaceSubtitle = (isNew: boolean, tool: DashboardTool): string => {
  if (!isNew) return 'Pick up where you left off.';
  switch (tool) {
    case 'daily_review':
      return 'Your workspace is ready — complete a quick daily review session below.';
    case 'analyze':
      return 'Your workspace is ready — drop in an essay to get started.';
    case 'citations':
      return 'Your workspace is ready — search sources and nail your citations.';
    case 'study_pack':
      return 'Your workspace is ready — build quizzes, flashcards, and lessons from your notes.';
    case 'more_tools':
      return 'Your workspace is ready — open a calculator, checker, or generator below.';
    default:
      return 'Pick up where you left off.';
  }
};

const Dashboard = ({ onNavigate, user, onLogout }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [dropActive, setDropActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dashboardTool, setDashboardTool] = useState<DashboardTool>(() => {
    const saved = localStorage.getItem('writescholar_dashboard_tab');
    if (saved) {
      localStorage.removeItem('writescholar_dashboard_tab');
      const valid: DashboardTool[] = ['daily_review', 'analyze', 'citations', 'study_pack', 'more_tools'];
      if (valid.includes(saved as DashboardTool)) return saved as DashboardTool;
    }
    /* Smart default: if the user has never built a study pack, they have
       nothing to review, so don't drop them on the Daily Review tab.
       Default to the Essay Checker (the most-used entry point). The check
       reads localStorage rather than waiting for an API call so the first
       paint is correct. */
    try {
      const hasPack = !!localStorage.getItem('writescholar_has_study_pack');
      return hasPack ? 'daily_review' : 'analyze';
    } catch {
      return 'analyze';
    }
  });

  /* Embedded hub view state — each tool tab opens to its hub by default,
     then expands into the create flow when the user clicks "+ Create new". */
  type ToolView = 'hub' | 'create';
  const [analyzeView, setAnalyzeView] = useState<ToolView>('hub');
  const [studyPackView, setStudyPackView] = useState<ToolView>('hub');
  const [citationsView, setCitationsView] = useState<ToolView>('hub');

  /* Recent items — fetched once on dashboard load, refreshed whenever user
     leaves a create flow back to a hub. */
  const [analyzeRecents, setAnalyzeRecents] = useState<HubItem[]>([]);
  const [studyPackRecents, setStudyPackRecents] = useState<HubItem[]>([]);
  const [citationsRecents, setCitationsRecents] = useState<HubItem[]>([]);
  const [hubRecentsLoading, setHubRecentsLoading] = useState(true);

  /* Friendly relative time formatter for hub item meta lines. */
  const timeAgoLabel = (iso: string): string => {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return '';
    const m = Math.floor(Math.max(0, Date.now() - d) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { setHubRecentsLoading(false); return; }

      // Run all three in parallel — hub renders fast even if one fails.
      // `cache: 'no-cache'` on analyses specifically: free users who
      // hit the dashboard BEFORE the /analysis/history gate was removed
      // may still have a stale 403 in their HTTP cache, which would
      // make the recents list silently stay empty even after the
      // backend update. Forcing a revalidation guarantees we read the
      // fresh response. The other two endpoints were never gated, so
      // they can use the default cache strategy.
      const [analysesRes, quizRes, citesRes] = await Promise.allSettled([
        fetch(`${API_URL}/analysis/history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-cache',
        }),
        fetch(`${API_URL}/analysis/quiz-history?limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/analysis/citation-history?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cancelled) return;

      // Analyses
      if (analysesRes.status === 'fulfilled' && analysesRes.value.ok) {
        try {
          const json = await analysesRes.value.json();
          const items = (json?.data || json?.history || []) as Array<{
            id: string;
            document_id?: string | null;
            documentId?: string | null;
            analysis_type?: string;
            created_at: string;
            documents?: { id?: string; title?: string; original_filename?: string } | null;
          }>;
          setAnalyzeRecents(items.slice(0, 4).map((a) => {
            // Resolve the underlying document id from any field the
            // backend might surface it as. Supabase joins normally keep
            // snake_case (`document_id`), but we also fall back to the
            // camelCased variant and to the joined `documents.id` so a
            // schema tweak doesn't silently break the click handler.
            const linkedDocId =
              a.document_id || a.documentId || a.documents?.id || null;
            return {
              id: a.id,
              title: a.documents?.title || a.documents?.original_filename || 'Untitled paper',
              meta: `${timeAgoLabel(a.created_at)}${a.analysis_type ? ' · ' + a.analysis_type.replace(/_/g, ' ') : ''}`,
              icon: '📝',
              onOpen: () => {
                // Recent analyses open in the Library (paid + free) so the
                // user re-views their paper alongside its analysis panel.
                // LibraryPage reads `librarySelectDocumentAfterCheckout`
                // on mount (LibraryPage.tsx:228) and auto-selects the
                // matching document via `docs.find(d => d.id === id)`.
                // If the linked doc isn't in the library's first 100
                // results (or the analysis is orphan / text-only), Library
                // falls back to its newest doc — the trace below is what
                // you check in DevTools when the wrong doc loads.
                // eslint-disable-next-line no-console
                console.log('[dashboard-recents] open in library', {
                  analysisId: a.id,
                  linkedDocId,
                  title: a.documents?.title,
                });
                try {
                  if (linkedDocId) {
                    sessionStorage.setItem(
                      'librarySelectDocumentAfterCheckout',
                      linkedDocId,
                    );
                  } else {
                    // No linked doc — clear the key so Library doesn't
                    // try to restore a stale id from an earlier click.
                    sessionStorage.removeItem('librarySelectDocumentAfterCheckout');
                  }
                } catch {
                  /* ignore */
                }
                onNavigate('library');
              },
            };
          }));
        } catch { /* silent */ }
      }

      // Quiz history → filter to study packs
      if (quizRes.status === 'fulfilled' && quizRes.value.ok) {
        try {
          const json = await quizRes.value.json();
          const items = ((json?.data || json?.history || []) as Array<{ id: string; quiz_type: string; title: string; created_at: string; question_count?: number; questions?: unknown; quiz_bank?: unknown; quiz_display_count?: number; source_word_count?: number }>)
            .filter((row) => row.quiz_type === 'study_pack');
          setStudyPackRecents(items.slice(0, 4).map((p) => ({
            id: p.id,
            title: p.title || 'Untitled study pack',
            meta: `${timeAgoLabel(p.created_at)} · ${p.question_count || 0} ${p.question_count === 1 ? 'card' : 'cards'}`,
            icon: '📚',
            onOpen: () => {
              onNavigate('study-pack-viewer', { studyPack: { data: { questions: p.questions, quiz_bank: p.quiz_bank, ...p }, title: p.title } } as unknown as Parameters<typeof onNavigate>[1]);
            },
          })));
        } catch { /* silent */ }
      }

      // Citations
      if (citesRes.status === 'fulfilled' && citesRes.value.ok) {
        try {
          const json = await citesRes.value.json();
          const items = (json?.data || json?.history || []) as Array<{ id: string; research_topic?: string; citation_style?: string; year_range?: string; created_at: string; search_results?: { citations?: unknown[]; keywords?: string[]; searchStrategies?: string[]; researchTopic?: string; citationStyle?: string; yearRange?: string } }>;
          setCitationsRecents(items.slice(0, 4).map((s) => {
            const count = s.search_results?.citations?.length ?? 0;
            return {
              id: s.id,
              title: s.research_topic || 'Untitled search',
              meta: `${timeAgoLabel(s.created_at)} · ${s.citation_style || 'APA'} · ${count} ${count === 1 ? 'source' : 'sources'}`,
              icon: '📖',
              onOpen: () => {
                if (typeof window !== 'undefined' && s.search_results) {
                  localStorage.setItem('citationSearchResults', JSON.stringify({
                    citations: s.search_results.citations ?? [],
                    keywords: s.search_results.keywords ?? [],
                    searchStrategies: s.search_results.searchStrategies ?? [],
                    researchTopic: s.research_topic || s.search_results.researchTopic || '',
                    citationStyle: s.citation_style || s.search_results.citationStyle || 'APA',
                    yearRange: s.year_range || s.search_results.yearRange,
                  }));
                }
                onNavigate('citation-results');
              },
            };
          }));
        } catch { /* silent */ }
      }

      setHubRecentsLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Streak data for header badge ──
  const getStreakFromStorage = (): { currentStreak: number; lastCompletedDate: string | null } => {
    try {
      const userId = user?.id || user?._id;
      const raw = localStorage.getItem(`writescholar_daily_review_streak_${userId || 'anon'}`);
      if (raw) {
        const data = JSON.parse(raw);
        const last = data.lastCompletedDate ? new Date(data.lastCompletedDate) : null;
        const now = new Date(new Date().toISOString().slice(0, 10));
        if (last) {
          const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
          if (diff <= 1) return { currentStreak: data.currentStreak || 0, lastCompletedDate: data.lastCompletedDate };
        }
        return { currentStreak: 0, lastCompletedDate: data.lastCompletedDate };
      }
    } catch { /* ignore */ }
    return { currentStreak: 0, lastCompletedDate: null };
  };
  const streakInfo = getStreakFromStorage();

  // ── Level & XP state ──
  const [levelUpData, setLevelUpData] = useState<{ level: number; name: string; xp: number } | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  const totalXP = getTotalXP();
  const levelInfo = getLevelInfo(totalXP);
  const unlockedBadges = getUnlockedBadges();
  const unlockedBadgeList: (Badge & { unlockedAt: string })[] = BADGES
    .filter(b => unlockedBadges[b.id])
    .map(b => ({ ...b, unlockedAt: unlockedBadges[b.id] }))
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());

  const recentBadges = unlockedBadgeList.slice(0, 3);
  const nextBadges = BADGES.filter(b => !unlockedBadges[b.id]).slice(0, 3);

  // Check for level-up on XP changes
  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = levelInfo.level;
      return;
    }
    if (levelInfo.level > prevLevelRef.current) {
      setLevelUpData({ level: levelInfo.level, name: levelInfo.name, xp: totalXP });
    }
    prevLevelRef.current = levelInfo.level;
  }, [levelInfo.level, levelInfo.name, totalXP]);

  // Listen for badge-unlocked events (triggers XP recalc)
  useEffect(() => {
    const handler = () => {
      // Force re-render by using a dummy state update
      setDashboardTool(prev => prev);
    };
    window.addEventListener('writescholar-badge-unlocked', handler);
    return () => window.removeEventListener('writescholar-badge-unlocked', handler);
  }, []);

  const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    common: { bg: 'bg-stone-100 dark:bg-stone-700', text: 'text-stone-600 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-600' },
    uncommon: { bg: 'bg-[#EAFFD6] dark:bg-[#58CC02]/10', text: 'text-[#58CC02]', border: 'border-[#58CC02]/30' },
    rare: { bg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10', text: 'text-[#A560E8]', border: 'border-[#A560E8]/30' },
    epic: { bg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10', text: 'text-[#1CB0F6]', border: 'border-[#1CB0F6]/30' },
    legendary: { bg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10', text: 'text-[#FF9600]', border: 'border-[#FF9600]/30' },
  };

  const switchEmbeddedTool = (tool: EmbeddedDashboardTool) => {
    if (tool === 'analyze') setDashboardTool('analyze');
    else if (tool === 'citations') setDashboardTool('citations');
    else if (tool === 'study_pack') setDashboardTool('study_pack');
  };
  const [usageStats, setUsageStats] = useState<UsageStatsShape>({
    plan: 'free',
    analysesRemaining: 0,
    citationsRemaining: 0,
    studyPacksRemaining: 0,
    uploadsRemaining: 0,
    daysUntilReset: null,
    planLimits: null,
  });
  const [loadingUsage, setLoadingUsage] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const plan = (user?.plan || usageStats.plan || 'free').toLowerCase();
  const isFree = plan === 'free';
  const firstName = getFirstName(user);
  const greeting = getTimeGreeting();

  /* Per-tool "is this user new to THIS specific tool" flags.
     A user who has analysed essays but never built a study pack is
     still new for the Study Pack hero, and vice versa. Each tool's
     conversion hero only shows while that tool's recents list is
     empty — once the user creates their first item for the tool,
     they see the hub view (with recents + previews) from then on.

     Study pack + citations have ONE signal each (their respective
     recents fetch), because /analysis/quiz-history and
     /analysis/citation-history work for free + paid users alike.

     Analyze is different because /analysis/history is PAID-ONLY
     (backend returns 403 + `upgradeRequired: true` for free users)
     — so for free users `analyzeRecents` is always empty regardless
     of how many papers they've actually analysed. To match the
     study-pack behaviour for free users, we OR a second signal:
     `analysisCount` (sourced from /users/usage-stats, which is NOT
     paid-gated). The user is "new" only when BOTH sources are zero
     AND BOTH loading flags have settled — that catches paid users
     via `analyzeRecents` and free users via `analysisCount`. */
  const isNewForAnalyze =
    analyzeRecents.length === 0 &&
    analysisCount === 0 &&
    !hubRecentsLoading &&
    !isLoading;
  const isNewForStudyPack = studyPackRecents.length === 0 && !hubRecentsLoading;
  const isNewForCitations = citationsRecents.length === 0 && !hubRecentsLoading;

  /** Workspace-wide "no analyses yet" flag — drives the big new-user
   *  landing hero on the analyze create view and the mobile dashboard
   *  empty-state subtitle. Now mirrors `isNewForAnalyze` exactly so
   *  the two never diverge across paint frames. */
  const isNewUser = isNewForAnalyze;

  /* ─── NEW-USER CONVERSION OPTIMISATION ────────────────────────────
     For each tool, if the user is brand new TO THAT TOOL, force them
     straight into the create view (skipping the empty hub state).
     Returning users on a tool they've already used see the normal hub
     view with their recents + previews.

     Reverse transition: once a brand-new user completes their first
     item (isNewFor* flips true → false), they should land on the hub
     view so they actually see the recent they just created — not stay
     pinned to the landing-style create hero. The view-state deps stay
     out of the array so manual "Back to recents" / "+ Analyze a new
     essay" clicks aren't immediately reverted; the effect only fires
     when isNewFor* or the active tab actually changes. */
  useEffect(() => {
    if (dashboardTool === 'analyze') {
      if (isNewForAnalyze && analyzeView === 'hub') {
        setAnalyzeView('create');
      } else if (!isNewForAnalyze && analyzeView === 'create') {
        setAnalyzeView('hub');
      }
    }
    if (dashboardTool === 'study_pack') {
      if (isNewForStudyPack && studyPackView === 'hub') {
        setStudyPackView('create');
      } else if (!isNewForStudyPack && studyPackView === 'create') {
        setStudyPackView('hub');
      }
    }
    if (dashboardTool === 'citations') {
      if (isNewForCitations && citationsView === 'hub') {
        setCitationsView('create');
      } else if (!isNewForCitations && citationsView === 'create') {
        setCitationsView('hub');
      }
    }
    // View states intentionally not in deps — respect manual "Back to recents"
    // and "+ Analyze a new" clicks. The effect only fires on isNewFor* /
    // dashboardTool changes, so a returning user clicking "+ Analyze a new
    // essay" stays on create (no isNewFor* change, no re-run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewForAnalyze, isNewForStudyPack, isNewForCitations, dashboardTool]);

  /* First soft paywall trigger.
     Fires once per user when EITHER:
       (a) they have at least one completed analysis OR study pack — i.e.
           the dashboard loaded with something in their recents, OR
       (b) 7 days have elapsed since onboarding finished (the fallback
           for users who never actually generate anything).
     Whichever comes first wins; FIRST_SOFT_PAYWALL_FIRED_KEY then locks
     out further automatic fires from this trigger. Subsequent soft
     paywalls go through the existing weekly-cooldown / API-limit paths.

     Skip conditions, in order:
       — hub recents / usage stats still loading (would misread "no items")
       — not signed in
       — paid plan (don't paywall paying users)
       — already fired (one-shot)
       — within the 7-day soft-paywall dismissal cooldown */
  useEffect(() => {
    if (hubRecentsLoading) return;
    if (loadingUsage) return;
    if (!user?.id) return;
    const userPlan = (user?.plan || usageStats.plan || 'free').toLowerCase();
    if (userPlan !== 'free') return;

    try {
      if (localStorage.getItem(FIRST_SOFT_PAYWALL_FIRED_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    if (isSoftPaywallOnCooldown()) return;

    const hasFirstItem =
      analyzeRecents.length > 0 ||
      analysisCount > 0 ||
      studyPackRecents.length > 0;

    let sevenDaysElapsed = false;
    try {
      const ts = user?.id ? getOnboardingCompletedAt(user.id) : 0;
      if (ts > 0) {
        sevenDaysElapsed = Date.now() - ts >= POST_ONBOARDING_PAYWALL_FALLBACK_MS;
      }
    } catch {
      /* ignore */
    }

    if (!hasFirstItem && !sevenDaysElapsed) return;

    try {
      localStorage.setItem(FIRST_SOFT_PAYWALL_FIRED_KEY, '1');
      sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('writescholar-open-paywall'));
  }, [
    hubRecentsLoading,
    loadingUsage,
    user?.id,
    user?.plan,
    usageStats.plan,
    analyzeRecents.length,
    analysisCount,
    studyPackRecents.length,
  ]);

  /** Pro / Premium / Focus: analyses + citations + study packs share one monthly pool (backend). */
  const showCombinedUsage =
    (plan === 'pro' || plan === 'premium' || plan === 'focus') &&
    typeof usageStats.planLimits?.combinedActionsPerMonth === 'number' &&
    typeof usageStats.combinedActionsRemaining === 'number';

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        setLoadingUsage(false);
        return;
      }
      try {
        const [analysesRes, statsRes, usageRes] = await Promise.all([
          fetch(`${API_URL}/analysis/user-analyses?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/usage-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/subscriptions/usage`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
        ]);

        if (analysesRes.ok) {
          const data = await analysesRes.json();
          const items = data.data?.analyses || data.analyses || [];
          setRecentAnalyses(
            items.slice(0, 5).map((a: any) => ({
              id: a.id,
              title: a.title || a.document_title || 'Untitled',
              grade: a.grade,
              score: a.overall_score || a.overallScore,
              createdAt: new Date(a.created_at || a.createdAt),
            }))
          );
          setAnalysisCount(items.length);
        }

        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (typeof stats.totalAnalyses === 'number') {
            setAnalysisCount(stats.totalAnalyses);
          }
        }

        if (usageRes.ok) {
          const raw = await usageRes.json();
          const data = raw?.data ?? raw;
          setUsageStats({
            plan: (data.plan || 'free').toLowerCase(),
            analysesRemaining: typeof data.analysesRemaining === 'number' ? data.analysesRemaining : 0,
            citationsRemaining: typeof data.citationsRemaining === 'number' ? data.citationsRemaining : 0,
            studyPacksRemaining: typeof data.studyPacksRemaining === 'number' ? data.studyPacksRemaining : 0,
            uploadsRemaining: typeof data.uploadsRemaining === 'number' ? data.uploadsRemaining : 0,
            daysUntilReset: data.daysUntilReset ?? null,
            combinedActionsRemaining: data.combinedActionsRemaining,
            planLimits: data.planLimits ?? null,
          });
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      } finally {
        setIsLoading(false);
        setLoadingUsage(false);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = async (file: File) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUploadError('Please log in to upload files.');
      return;
    }

    const maxSize = getMaxFileSizeBytes(plan);
    if (file.size > maxSize) {
      setUploadError(`File too large. Max ${getMaxFileSizeLabel(plan)} on your plan.`);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      setUploadError('Please upload a PDF, Word, or TXT file.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(10);
    trackEvent('dashboard_file_upload_start');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append(
        'title',
        file.name.replace(/\.[^/.]+$/, '').trim() || 'Untitled document'
      );

      setUploadProgress(30);

      const uploadRes = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setUploadProgress(60);

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      const docId = uploadData.data?.document?.id;

      setUploadProgress(80);

      if (docId) {
        setUploadProgress(100);
        trackEvent('dashboard_file_upload_success');
        // AnalysisPage reads this key on mount and pre-loads the doc content
        // into the preview so the user doesn't have to re-paste/re-pick.
        try {
          localStorage.setItem('freshUploadDocumentId', String(docId));
        } catch {
          /* ignore storage quota / privacy mode */
        }
        onNavigate('analysis', docId);
      } else {
        throw new Error('No document ID returned');
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
      trackEvent('dashboard_file_upload_error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
  };

  const handleAnalyzeText = async () => {
    const wordCount = getWordCount(inputText);
    if (wordCount < 200) return;

    setIsAnalyzing(true);
    trackEvent('dashboard_analyze_text_start');

    try {
      localStorage.setItem('textAnalysisContent', inputText);
      onNavigate('analysis');
    } catch (e) {
      console.error('Failed to start analysis:', e);
    }
  };

  const isTextValid = getWordCount(inputText) >= 200;

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  const usagePct = (remaining: number, monthlyLimit: number): number => {
    if (remaining === -1) return 100;
    if (monthlyLimit <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((remaining / monthlyLimit) * 100)));
  };

  const freeLimitsFromApi = usageStats.planLimits ?? {};
  /** Per-feature denominators align with `/subscriptions/usage` (free tier = small separate buckets). */
  const freeMonthlyCaps = {
    analyses: freeLimitsFromApi.analysesPerMonth ?? 2,
    citations: freeLimitsFromApi.citationSearchesPerMonth ?? 2,
    studyPacks: freeLimitsFromApi.studyPackGenerationsPerMonth ?? 2,
    uploads: freeLimitsFromApi.documentsPerMonth ?? 3,
  };
  const combinedLimit =
    usageStats.planLimits?.combinedActionsPerMonth ??
    (usageStats.plan === 'premium' ? 499 : 99);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greetingEmoji = greeting === 'Good morning' ? '☀️' : greeting === 'Good afternoon' ? '👋' : '🌙';

  const QUICK_ACCESS_TINTS = [
    { bg: 'bg-[#A560E8]', border: 'border-[#8A48C7]', tintBg: 'bg-[#F3EAFF] dark:bg-[#A560E8]/10', clr: 'text-[#A560E8]' },
    { bg: 'bg-[#1CB0F6]', border: 'border-[#1899D6]', tintBg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10', clr: 'text-[#1CB0F6]' },
    { bg: 'bg-[#FF9600]', border: 'border-[#D97F00]', tintBg: 'bg-[#FFF4E0] dark:bg-[#FF9600]/10', clr: 'text-[#FF9600]' },
    { bg: 'bg-[#58CC02]', border: 'border-[#46A302]', tintBg: 'bg-[#EAFFD6] dark:bg-[#58CC02]/10', clr: 'text-[#58CC02]' },
    { bg: 'bg-[#FF4B4B]', border: 'border-[#E04343]', tintBg: 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/10', clr: 'text-[#FF4B4B]' },
    { bg: 'bg-[#1CB0F6]', border: 'border-[#1899D6]', tintBg: 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/10', clr: 'text-[#1CB0F6]' },
  ];

  /* ─── Mobile dashboard payload ───────────────────────────────
     Compute the small data slice the mobile redesign needs. We map
     the existing recentAnalyses + hub recents into one unified list,
     dedup-by-id, and sort by recency. The mobile component shows the
     top 3. */
  const mobileRecentItems = (() => {
    const items: { id: string; title: string; createdAt: string; kind: 'analyze' | 'study_pack' | 'citations' | 'daily_review' }[] = [];
    for (const a of recentAnalyses) {
      items.push({
        id: a.id,
        title: (a as any).title || (a as any).essay_title || 'Essay analysis',
        createdAt: (a as any).created_at || (a as any).createdAt || new Date().toISOString(),
        kind: 'analyze',
      });
    }
    for (const h of analyzeRecents) {
      if (items.find((x) => x.id === h.id)) continue;
      items.push({ id: h.id, title: (h as any).title || 'Essay', createdAt: (h as any).updated_at || new Date().toISOString(), kind: 'analyze' });
    }
    for (const h of studyPackRecents) {
      items.push({ id: h.id, title: (h as any).title || 'Study pack', createdAt: (h as any).updated_at || new Date().toISOString(), kind: 'study_pack' });
    }
    for (const h of citationsRecents) {
      items.push({ id: h.id, title: (h as any).title || 'Citation search', createdAt: (h as any).updated_at || new Date().toISOString(), kind: 'citations' });
    }
    return items
      .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  return (
    <div className="min-h-screen relative font-sans overflow-x-clip bg-[#FAF7FF] dark:bg-stone-950">
      {/* ─── MOBILE-ONLY DASHBOARD ─── completely separate component
          from the desktop layout below. Renders its own Header + content
          designed for one-handed phone use. Hidden at md+ where the
          existing dashboard takes over. */}
      <div className="md:hidden">
        <MobileDashboard
          user={user as any}
          onNavigate={onNavigate}
          onLogout={onLogout}
          dashboardTool={dashboardTool}
          setDashboardTool={setDashboardTool}
          recentItems={mobileRecentItems}
          streakDays={streakInfo?.currentStreak ?? 0}
          isNewUser={isNewUser}
        />
      </div>

      {/* ─── TABLET + DESKTOP DASHBOARD (existing layout) ─── */}
      <div className="hidden md:block">
      <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="dashboard">
      {/* 50% off first month (NEWCUSTOMER) — free users only. */}
      {isFree && (
        <div
          role="region"
          aria-label="First month discount"
          className="hidden md:block border-b-2 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-[#FF9600]/10"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
              <p className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">
                <span className="text-[#FF4B4B]">50% off</span> your first month on monthly plans · use code{' '}
                <span className="inline-flex items-center rounded-lg border-2 border-b-4 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-2 py-0.5 font-mono font-extrabold text-[#A560E8] tracking-wide">
                  NEWCUSTOMER
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <AnalysisAnimation isPopup={true} text="Analyzing your essay" isComplete={false} />
      )}

      {levelUpData && (
        <LevelUpCelebration
          level={levelUpData.level}
          levelName={levelUpData.name}
          totalXP={levelUpData.xp}
          onClose={() => setLevelUpData(null)}
        />
      )}

      <style>{`
        @keyframes dashFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dashOrb { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10px,-8px) scale(1.05); } }
        @keyframes dashFire { 0%,100% { transform: rotate(-3deg) scale(1); } 50% { transform: rotate(3deg) scale(1.12); } }
        @keyframes dashPulseRing { 0% { box-shadow: 0 0 0 0 rgba(139,92,246,0.35); } 70% { box-shadow: 0 0 0 14px rgba(139,92,246,0); } 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); } }
        @keyframes dashShine { 0% { background-position: -150% center; } 100% { background-position: 250% center; } }
        .dash-fade { animation: dashFadeUp 0.5s ease-out both; }
        .dash-orb { animation: dashOrb 14s ease-in-out infinite; }
        .dash-fire { animation: dashFire 1.6s ease-in-out infinite; display: inline-block; }
        .dash-pulse { animation: dashPulseRing 2.4s ease-out infinite; }
        .dash-stagger > * { opacity: 0; animation: dashFadeUp 0.45s ease-out forwards; }
        .dash-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .dash-stagger > *:nth-child(2) { animation-delay: 0.10s; }
        .dash-stagger > *:nth-child(3) { animation-delay: 0.16s; }
        .dash-stagger > *:nth-child(4) { animation-delay: 0.22s; }
        .dash-stagger > *:nth-child(5) { animation-delay: 0.28s; }
        .dash-stagger > *:nth-child(6) { animation-delay: 0.34s; }
        .dash-serif { font-family: 'Nunito', system-ui, sans-serif; }
        .dash-shine {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: dashShine 3.4s ease-in-out infinite;
        }
      `}</style>

      <main className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16">
        {/* ═══════════════════════════════════════════════════════════════════
            TOP GREETING BAR
           ═══════════════════════════════════════════════════════════════════ */}
        <header className="dash-fade mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-[#1CB0F6]">
                {todayLabel}
              </p>
              <h1 className="dash-serif mt-2 text-[2rem] sm:text-4xl lg:text-[2.85rem] font-extrabold leading-[1.08] tracking-tight text-stone-900 dark:text-stone-50">
                {greeting}
                {firstName ? (
                  <>
                    ,{' '}
                    <span className="text-[#A560E8]">
                      {firstName}
                    </span>
                  </>
                ) : (
                  ''
                )}
                <span className="ml-2 inline-block text-[1em] align-middle" aria-hidden>
                  {greetingEmoji}
                </span>
              </h1>
              <p className="mt-1.5 text-sm sm:text-base leading-snug text-stone-600 dark:text-stone-300 font-bold max-w-xl">
                {getWorkspaceSubtitle(isNewUser, dashboardTool)}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:justify-end sm:shrink-0">
              {/* Level + XP bar and Streak badge — REMOVED per user brief.
                  Both displays were unconditionally hidden across free
                  and premium plans. Re-introduce by restoring the
                  `<button>` blocks from git history if ever needed. */}

              {analysisCount > 0 && (
                <div className="hidden sm:inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#E5F8D0] dark:bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30">
                  <span className="text-xl leading-none" aria-hidden>📝</span>
                  <span className="text-sm font-extrabold text-[#58CC02]">
                    {analysisCount} {analysisCount === 1 ? 'essay' : 'essays'}
                  </span>
                </div>
              )}
              {isFree ? (
                <>
                  {/* "Free plan" pill — HIDDEN. Kept in code (gated by
                      `false &&`) so it can be brought back in one step
                      if we want the plan status visible again. The
                      Upgrade button beside it stays so free users can
                      still see / act on the upgrade CTA. */}
                  {false && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700">
                      <span className="text-base leading-none" aria-hidden>✨</span>
                      <span className="text-sm font-extrabold text-stone-700 dark:text-stone-200">Free plan</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF9600] text-white text-sm sm:text-base font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#D97F00] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    <span className="text-base leading-none" aria-hidden>⭐</span>
                    Upgrade
                  </button>
                </>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FF9600] text-white border-2 border-b-4 border-[#D97F00]">
                  <span className="text-base leading-none" aria-hidden>⭐</span>
                  <span className="text-sm font-extrabold uppercase tracking-wider">{plan}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE TAB BAR (lg- only)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden mb-5 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
          <div className="inline-flex gap-2 p-1">
            {DASHBOARD_TOOL_ITEMS.map((item) => {
              const active = dashboardTool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    /* Switching tabs always lands on the embedded hub view —
                       click "+ Create new" inside the panel to enter the create flow. */
                    if (item.id === 'analyze') setAnalyzeView('hub');
                    if (item.id === 'study_pack') setStudyPackView('hub');
                    if (item.id === 'citations') setCitationsView('hub');
                    setDashboardTool(item.id);
                    trackEvent('dashboard_tool_tab', { tool: item.id });
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold whitespace-nowrap transition-all ${
                    active
                      ? `${item.activeBg} ${item.titleClass} border-2 border-b-4 border-current`
                      : 'text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-stone-300 active:border-b-2 active:translate-y-0.5'
                  }`}
                >
                  <span className="text-base" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="dash-serif tracking-tight">{item.title}</span>
                  {'badge' in item && item.badge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FF9600] text-white text-[7px] font-extrabold uppercase tracking-wide leading-none whitespace-nowrap border border-b-2 border-[#D97F00]">
                      {/* Extract the leading emoji from the badge string so
                          each tool shows its own icon in this compact view
                          (was hardcoded 🔥, which collapsed all badges to
                          look identical here). Falls back to 🔥 if the
                          regex misses. */}
                      {item.badge.match(/^\S+/)?.[0] || '🔥'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN GRID — Sidebar + Main column
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-[270px,1fr] gap-6 lg:gap-8">
          {/* ─── SIDEBAR (lg+) ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b-2 border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1CB0F6] text-white text-[13px] border-b-2 border-[#1899D6]" aria-hidden>
                      ✳︎
                    </span>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1CB0F6]">
                      Workspace
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-stone-500 dark:text-stone-400 pl-0.5 font-bold">
                    Switch tools or open your saved work.
                  </p>
                </div>

                <nav className="p-2 flex flex-col gap-1" aria-label="Dashboard tools">
                  {DASHBOARD_TOOL_ITEMS.map((item) => {
                    const active = dashboardTool === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          /* Switching tabs always lands on the embedded hub view. */
                          if (item.id === 'analyze') setAnalyzeView('hub');
                          if (item.id === 'study_pack') setStudyPackView('hub');
                          if (item.id === 'citations') setCitationsView('hub');
                          setDashboardTool(item.id);
                          trackEvent('dashboard_tool_tab', { tool: item.id });
                        }}
                        className={`group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all ${
                          active
                            ? `${item.activeBg} border-2 border-b-4 border-current ${item.titleClass}`
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800 border-2 border-transparent'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base text-white ${item.iconClass} border-2 border-b-4 ${
                            item.id === 'daily_review' ? 'border-[#46A302]' : item.id === 'analyze' ? 'border-[#E04343]' : item.id === 'study_pack' ? 'border-[#D97F00]' : item.id === 'citations' ? 'border-[#1899D6]' : 'border-[#8A48C7]'
                          } ${active ? 'scale-105' : 'group-hover:scale-105'} transition-transform`}
                        >
                          <span aria-hidden>{item.emoji}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`dash-serif text-[15px] font-extrabold leading-tight ${active ? item.titleClass : 'text-stone-800 dark:text-stone-50'}`}>
                              {item.title}
                            </p>
                            {'badge' in item && item.badge && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FF9600] text-white text-[8px] font-extrabold uppercase tracking-wide leading-none whitespace-nowrap border border-b-2 border-[#D97F00]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`mt-0.5 text-[10.5px] font-bold leading-snug line-clamp-1 ${active ? 'text-stone-500 dark:text-stone-400' : 'text-stone-400 dark:text-stone-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                        {active && (
                          <svg className={`h-3.5 w-3.5 shrink-0 ${item.titleClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* ── Games section ── */}
                <div className="px-4 pt-1.5 pb-1 border-t-2 border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span aria-hidden className="text-[11px]">🎮</span>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#FF4B4B]">
                      Arcade mode
                    </p>
                  </div>
                </div>
                <nav className="px-2 pb-2 pt-0.5 flex flex-col gap-0.5" aria-label="Arcade mode">
                  {([
                    { id: 'crater_blast', label: 'Crater Blast', hint: 'Blast the right answers', emoji: '💥', page: 'game-launcher-crater-blast', color: '#FF4B4B', borderColor: '#E04343' },
                    { id: 'word_tower', label: 'Word Tower', hint: 'Build your knowledge tower', emoji: '🗼', page: 'game-launcher-word-tower', color: '#58CC02', borderColor: '#46A302' },
                    // Word Blitz — 60-second cloze speedrun. Goes straight to
                    // its own page (no separate launcher) since it always
                    // starts on the menu screen with the bank picker.
                    { id: 'word_blitz', label: 'Word Blitz', hint: '60-second fill-in-the-blank', emoji: '⚡', page: 'word-blitz', color: '#FF9600', borderColor: '#D97F00' },
                  ] as const).map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        onNavigate(game.page);
                        trackEvent('dashboard_game_launch', { game: game.id });
                      }}
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-all hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-white border-2 border-b-4 transition-colors"
                        style={{ backgroundColor: game.color, borderColor: game.borderColor }}
                        aria-hidden
                      >
                        {game.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-extrabold leading-tight text-stone-800 dark:text-stone-50">
                          {game.label}
                        </span>
                        <span className="block text-[10px] mt-px leading-snug text-stone-400 dark:text-stone-500 line-clamp-1 font-bold">
                          {game.hint}
                        </span>
                      </span>
                      <svg
                        className="h-3.5 w-3.5 shrink-0 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </nav>

                <div className="px-4 pt-3 pb-2 border-t-2 border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span aria-hidden className="text-[11px]">⚡</span>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#FF9600]">
                      Shortcuts
                    </p>
                  </div>
                </div>
                <nav className="px-2 pb-3 pt-1 flex flex-col gap-0.5" aria-label="Workspace shortcuts">
                  {WORKSPACE_SHORTCUTS.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => {
                        onNavigate(link.page);
                        trackEvent('dashboard_workspace_shortcut', { page: link.page });
                      }}
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-all hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 group-hover:border-[#1CB0F6]/40 transition-colors"
                        aria-hidden
                      >
                        {link.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-extrabold leading-tight text-stone-800 dark:text-stone-50">
                          {link.label}
                        </span>
                        <span className="block text-[10px] mt-px leading-snug text-stone-400 dark:text-stone-500 line-clamp-1 font-bold">
                          {link.hint}
                        </span>
                      </span>
                      <svg
                        className="h-3.5 w-3.5 shrink-0 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </nav>

                {/* TODO: Remove — dev-only test button */}
                <div className="px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('onboarding')}
                    className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-stone-400 border-2 border-dashed border-stone-300 hover:border-[#58CC02] hover:text-[#58CC02] transition-all"
                  >
                    🧪 Test Onboarding
                  </button>
                </div>
              </div>

              {/* ── Badges Card ── */}
              <button
                type="button"
                onClick={() => onNavigate('badges')}
                className="w-full text-left rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden hover:border-stone-300 dark:hover:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all group"
              >
                <div className="px-4 pt-3.5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg" aria-hidden>🏅</span>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
                        Badges
                      </p>
                    </div>
                    <p className="text-[11px] font-extrabold text-[#1CB0F6]">
                      {unlockedBadgeList.length}/{BADGES.length}
                    </p>
                  </div>

                  {/* Recent badges preview */}
                  {recentBadges.length > 0 ? (
                    <div className="flex gap-1.5">
                      {recentBadges.map((badge) => {
                        const rc = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
                        return (
                          <div
                            key={badge.id}
                            className={`flex-1 rounded-lg ${rc.bg} border-2 ${rc.border} px-1.5 py-1.5 text-center`}
                            title={`${badge.name} — ${badge.description}`}
                          >
                            <p className={`text-[9px] font-extrabold ${rc.text} truncate leading-tight`}>
                              {badge.name}
                            </p>
                            <p className="text-[8px] font-bold text-stone-400 dark:text-stone-500 mt-0.5">
                              +{badge.xp} XP
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 text-center py-1">
                      Earn badges to level up! <span aria-hidden>🏅</span>
                    </p>
                  )}
                </div>

                <div className="px-4 py-2 border-t-2 border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-center gap-1.5">
                  <p className="text-[10px] font-extrabold text-[#A560E8]">View all badges</p>
                  <svg className="h-3 w-3 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Social proof */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2" aria-hidden>
                    {[
                      { emoji: '👩‍🎓', bg: 'bg-[#58CC02]' },
                      { emoji: '👨‍🎓', bg: 'bg-[#1CB0F6]' },
                      { emoji: '👩‍💻', bg: 'bg-[#A560E8]' },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full ${row.bg} flex items-center justify-center text-[12px] border-2 border-white dark:border-stone-900`}
                      >
                        {row.emoji}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] leading-snug">
                    <span className="font-extrabold text-[#58CC02]">50,000+</span>{' '}
                    <span className="text-stone-600 dark:text-stone-300 font-bold">students trust WriteScholar</span>
                  </p>
                </div>
              </div>

              {isFree && (
                <div className="rounded-2xl bg-[#A560E8] border-2 border-b-4 border-[#8A48C7] overflow-hidden">
                  <div className="p-4">
                    <p className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-wider">
                      <span aria-hidden>⭐</span> Pro
                    </p>
                    <p className="dash-serif mt-2 text-[17px] font-extrabold text-white leading-tight">
                      Unlock unlimited essays
                    </p>
                    <p className="mt-1 text-[11px] text-white/90 leading-snug font-bold">
                      Higher limits, larger uploads, every Pro tool.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('pricing')}
                      className="mt-3 w-full rounded-xl bg-white text-[#A560E8] py-2.5 text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      See plans →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ─── MAIN COLUMN ─── */}
          <div className="min-w-0 dash-fade space-y-7 lg:space-y-9">
            {/* === DAILY REVIEW === */}
            {dashboardTool === 'daily_review' && (
              <DailyReviewTab user={user} onNavigate={onNavigate} onSwitchTool={(tool) => setDashboardTool(tool as DashboardTool)} />
            )}

            {/* === ANALYZE TOOL === */}
            {dashboardTool === 'analyze' && analyzeView === 'hub' && (
              <>
                <FeatureHub
                  title="Essay analysis"
                  subtitle="Paste an essay — get professor-level feedback, line-by-line."
                  mascotSrc="/mascot-paper.webp"
                  themeColor="#FF4B4B"
                  themeBorderColor="#E04343"
                  themeBgColor="#FFE8E8"
                  createLabel="+ Analyze a new essay"
                  createSubLabel="Drop in a draft and get feedback in seconds"
                  onCreate={() => setAnalyzeView('create')}
                  recentItems={analyzeRecents}
                  loading={hubRecentsLoading}
                  onViewAll={() => onNavigate('library')}
                  emptyStateMessage="Your analyzed papers will appear here."
                />
                {/* Preview between Recent (inside FeatureHub) and Quick Access
                    (rendered globally further down). Same component as the
                    create flow uses, so users see the same sample either way. */}
                <AnalysisPreviewSection embedded />
              </>
            )}
            {dashboardTool === 'analyze' && analyzeView === 'create' && (
              <>
                {/* Header row — "Back to recents" button drives the
                    row height. The decorative mascot is absolute-
                    positioned in the top-right corner so it doesn't
                    inflate the row's height (which previously left a
                    ~50-80px empty band below the button before the
                    hero card). The mascot's tail visually overlaps
                    into the top-right of the hero card below — that
                    area is empty (the eyebrow chip and H2 are both
                    centred), so the overlap reads as a tucked-in
                    decoration rather than a collision. */}
                <div className="mb-2 relative">
                  {/* "Back to recents" is hidden for new users — clicking
                      it would dump them into the empty-state hub which is
                      a dead end on first sign-in. Existing users (with
                      analyses) keep the navigation. */}
                  {!isNewUser && (
                    <button
                      type="button"
                      onClick={() => setAnalyzeView('hub')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back to recents
                    </button>
                  )}
                  <img
                    src="/mascot-study.webp"
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="hidden sm:block pointer-events-none absolute top-0 right-0 w-20 sm:w-28 lg:w-32 h-auto z-10"
                  />
                </div>
                {/* Hero upload card */}
                <section className={`rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border-2 border-b-4 ${isNewUser ? 'border-[#FF4B4B]/40 shadow-[0_18px_42px_-12px_rgba(255,75,75,0.25)]' : 'border-stone-200 dark:border-stone-700'}`}>

                  {/* NEW USER HERO — extra-prominent banner above the form
                      that pairs a trust signal + outcome-focused H1 + a
                      4-tile "what you'll get" grid. Built per user brief
                      to lift dashboard → essay-analysis conversion: the
                      bigger card, stronger value prop, and concrete
                      deliverables answer the "why upload right now?"
                      question before the visitor scrolls. Returning users
                      see the slimmer original header below. */}
                  {isNewUser ? (
                    <div className="relative px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-2">
                      {/* Trust pill — proof + social, sits above the H1 */}
                      <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-2 border-[#58CC02]/40 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#46A302] dark:text-[#9BE85C]">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Trusted by 50,000+ students
                        </span>
                      </div>

                      {/* Outcome-focused H1 — leads with the result, not the feature */}
                      <h2 className="dash-serif text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-stone-900 dark:text-stone-50">
                        Turn your draft into an{' '}
                        <span className="relative inline-flex items-center justify-center align-baseline rounded-2xl bg-[#58CC02] text-white font-extrabold leading-none w-[0.95em] h-[0.95em] border-2 border-b-[5px] border-[#46A302] rotate-[-4deg] shadow-[0_6px_18px_-2px_rgba(88,204,2,0.5)]" style={{ verticalAlign: '-0.06em' }} aria-hidden>
                          A
                        </span>
                        <span className="sr-only">A</span>
                        <span className="block mt-1.5">in <span className="text-[#FF4B4B]">60 seconds</span></span>
                      </h2>

                      <p className="mt-4 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed font-bold">
                        Drop in your essay. Get a letter grade, rubric scores, and exactly what to fix — before you turn it in.
                      </p>

                      {/* WHAT YOU'LL GET — 4-up visual benefit grid.
                          Concrete deliverables make the offer specific
                          rather than abstract. Each tile mirrors a real
                          part of the analysis output (rubric / annotations
                          / revision / time-to-result). */}
                      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
                        <div className="rounded-xl border-2 border-b-4 border-[#FF4B4B]/30 dark:border-[#FF4B4B]/40 bg-[#FFE8E8]/60 dark:bg-[#FF4B4B]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>📊</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#FF4B4B] leading-tight">Letter grade + rubric</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">A–F with sub-scores</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40 bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>🖍️</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#FF9600] leading-tight">Line-by-line notes</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Exactly what to fix</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#A560E8]/30 dark:border-[#A560E8]/40 bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>✍️</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#A560E8] leading-tight">Polished revision</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Apply with one click</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/40 bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>⚡</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#58CC02] leading-tight">60-second result</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">No sign-up wait</p>
                        </div>
                      </div>

                      {/* Big down-arrow nudge directing eye to the drop zone */}
                      <div className="mt-6 flex flex-col items-center text-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1.5">
                          Start here — drop or paste your essay
                        </p>
                        <svg className="w-5 h-5 text-[#FF4B4B] motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  ) : null}

                  <div className={`relative px-6 sm:px-8 lg:px-10 ${isNewUser ? 'pt-4' : 'pt-4 sm:pt-5 lg:pt-6'} pb-6 sm:pb-8 lg:pb-10`}>
                    {!isNewUser && (
                    <div className="text-center mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 text-[#FF4B4B] border-2 border-[#FF4B4B]/30 text-xs font-extrabold">
                        <span aria-hidden>✨</span>
                        Ready for your next analysis
                      </span>
                    </div>
                    )}

                    {!isNewUser && (
                      <>
                        <h2 className="dash-serif text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50">
                          Drop in your <span className="text-[#FF4B4B]">next essay</span>
                        </h2>
                        <p className="mt-3 text-center text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed font-bold">
                          Detailed feedback on structure, arguments, and writing quality.
                        </p>
                      </>
                    )}

                    {/* Upload drop zone */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`group relative mt-6 cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
                        dropActive
                          ? 'border-[#FF4B4B] bg-[#FFE8E8] dark:bg-[#FF4B4B]/10'
                          : 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/50 hover:border-[#FF4B4B] hover:bg-[#FFE8E8]/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <div className="px-6 py-10 sm:py-14 text-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-4">
                            <LoadingSpinner size="lg" text={`Uploading... ${uploadProgress}%`} color="blue" />
                            <div className="w-full max-w-xs h-3 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                              <div className="h-full rounded-full bg-[#58CC02] transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20">
                              <div className="w-full h-full rounded-2xl bg-[#FF4B4B] text-white flex items-center justify-center border-2 border-b-4 border-[#E04343] group-hover:scale-105 transition-transform">
                                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                            </div>
                            <p className="dash-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                              Drop your essay here
                            </p>
                            <p className="mt-1 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-bold">
                              or <span className="text-[#FF4B4B] font-extrabold underline-offset-4 group-hover:underline">click to browse</span>
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FFE8E8] text-[#FF4B4B] text-[11px] font-extrabold border-2 border-[#FF4B4B]/20">PDF</span>
                              <span className="px-2.5 py-1 rounded-lg bg-[#DDF4FF] text-[#1CB0F6] text-[11px] font-extrabold border-2 border-[#1CB0F6]/20">Word</span>
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-extrabold border-2 border-stone-200 dark:border-stone-700">TXT</span>
                            </div>
                            <p className="mt-3 text-[11px] text-stone-400 dark:text-stone-500 font-bold">
                              Up to {getMaxFileSizeLabel(plan)}
                              {isFree && (
                                <>
                                  {' · '}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onNavigate('pricing'); }}
                                    className="text-[#FF9600] font-extrabold hover:underline"
                                  >
                                    Pro unlocks larger files
                                  </button>
                                </>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Analysis previews — below drop zone (shared with hub view) */}
                    <AnalysisPreviewSection embedded />

                    {uploadError && (
                      <div className="mt-4 p-3 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 text-[#FF4B4B] text-sm font-bold">
                        {uploadError}
                      </div>
                    )}

                    <div className="my-7 flex items-center gap-4">
                      <div className="h-0.5 flex-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Or paste below</span>
                      <div className="h-0.5 flex-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
                    </div>

                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your essay here (minimum 200 words)..."
                        className="w-full min-h-[180px] rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all"
                      />
                      <div className="absolute bottom-4 left-5 text-xs font-bold">
                        <span className={isTextValid ? 'text-[#58CC02] font-extrabold' : 'text-stone-400 dark:text-stone-500'}>
                          {getWordCount(inputText)} words
                        </span>
                        {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                          <span className="text-[#FF9600]"> · {200 - getWordCount(inputText)} more needed</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {inputText.trim() && (
                          <button
                            type="button"
                            onClick={() => setInputText('')}
                            className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                        {isTextValid && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-[#58CC02]/30 text-[11px] font-extrabold text-[#58CC02]">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Ready to analyze
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAnalyzeText}
                        disabled={!isTextValid}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm sm:text-base font-extrabold uppercase tracking-wide transition-all ${
                          isTextValid
                            ? 'bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5'
                            : 'cursor-not-allowed bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-2 border-b-4 border-stone-300 dark:border-stone-700'
                        }`}
                      >
                        {isTextValid ? (
                          <>
                            Analyze my essay <span aria-hidden>✨</span>
                          </>
                        ) : (
                          'Analyze my essay'
                        )}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Stats row — compact, refined. Hidden on mobile because
                    quota tiles take ~480px of scroll for info users rarely
                    need on the dashboard. They can still see usage on the
                    account/settings page. */}
                {!loadingUsage && (
                  <section className="hidden md:block">
                    <div className="flex items-end justify-between mb-3 gap-3">
                      <div>
                        <h3 className="dash-serif text-base sm:text-lg font-extrabold text-stone-700 dark:text-stone-200">
                          {showCombinedUsage ? 'This month' : 'Monthly usage'}
                        </h3>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-bold">
                          {getResetsInText(usageStats.daysUntilReset)}
                        </p>
                      </div>
                      {isFree && (
                        <button
                          type="button"
                          onClick={() => onNavigate('pricing')}
                          className="text-[11px] font-extrabold text-[#FF9600] hover:underline"
                        >
                          Higher limits →
                        </button>
                      )}
                    </div>
                    {showCombinedUsage ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 dash-stagger">
                        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#A560E8]/30 dark:border-[#A560E8]/40 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">
                                Combined actions
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-bold">Analyses · Citations · Study packs · one monthly pool</p>
                            </div>
                            <span className="text-2xl" aria-hidden>⚡</span>
                          </div>
                          <p className={`dash-serif mt-2 text-3xl font-extrabold leading-none tabular-nums ${
                            (usageStats.combinedActionsRemaining ?? 0) <= 0
                              ? 'text-[#FF4B4B]'
                              : (usageStats.combinedActionsRemaining ?? 0) <= Math.max(1, Math.floor(combinedLimit * 0.2))
                                ? 'text-[#FF9600]'
                                : 'text-[#A560E8]'
                          }`}>
                            {usageStats.combinedActionsRemaining ?? 0}
                            <span className="ml-1.5 text-xs font-bold text-stone-400 dark:text-stone-500">left</span>
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 font-bold">of {combinedLimit} this period</p>
                          <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#A560E8] transition-all duration-700"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(2, Math.round(((usageStats.combinedActionsRemaining ?? 0) / Math.max(1, combinedLimit)) * 100))
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        {(() => {
                          const rem = usageStats.uploadsRemaining;
                          const cap = freeLimitsFromApi.documentsPerMonth ?? -1;
                          const pct = cap === -1 ? 100 : usagePct(rem, cap);
                          const display = rem === -1 ? '∞' : `${rem}`;
                          const isUnlimited = rem === -1;
                          return (
                            <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/40 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">Uploads</p>
                                  <p className="dash-serif mt-1 text-3xl font-extrabold text-[#58CC02] leading-none">
                                    {display}
                                    {!isUnlimited && (
                                      <span className="ml-1.5 text-xs font-bold text-stone-400 dark:text-stone-500">left</span>
                                    )}
                                    {isUnlimited && (
                                      <span className="ml-1.5 text-xs font-bold text-stone-400 dark:text-stone-500">library</span>
                                    )}
                                  </p>
                                </div>
                                <span className="text-2xl" aria-hidden>📄</span>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#58CC02] transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 dash-stagger">
                        {[
                          {
                            key: 'analyses',
                            label: 'Analysis previews',
                            emoji: '📝',
                            remaining: usageStats.analysesRemaining,
                            total: freeMonthlyCaps.analyses,
                            color: '#FF4B4B',
                            borderColor: '#FF4B4B',
                          },
                          {
                            key: 'study',
                            label: 'Pack previews',
                            emoji: '📦',
                            remaining: usageStats.studyPacksRemaining,
                            total: freeMonthlyCaps.studyPacks,
                            color: '#FF9600',
                            borderColor: '#FF9600',
                          },
                          {
                            key: 'citations',
                            label: 'Citation previews',
                            emoji: '📚',
                            remaining: usageStats.citationsRemaining,
                            total: freeMonthlyCaps.citations,
                            color: '#1CB0F6',
                            borderColor: '#1CB0F6',
                          },
                          {
                            key: 'uploads',
                            label: 'Uploads',
                            emoji: '📄',
                            remaining: usageStats.uploadsRemaining,
                            total: freeMonthlyCaps.uploads,
                            color: '#58CC02',
                            borderColor: '#58CC02',
                          },
                        ].map((card) => {
                          const pct = usagePct(card.remaining, card.total);
                          const display = card.remaining === -1 ? '∞' : `${card.remaining}`;
                          const isUnlimited = card.remaining === -1;
                          return (
                            <div key={card.key} className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 p-4" style={{ borderColor: `${card.borderColor}30` }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">{card.label}</p>
                                  <p className="dash-serif mt-1 text-3xl font-extrabold leading-none" style={{ color: card.color }}>
                                    {display}
                                    {!isUnlimited && <span className="ml-1.5 text-xs font-bold text-stone-400 dark:text-stone-500">left</span>}
                                  </p>
                                </div>
                                <span className="text-2xl" aria-hidden>{card.emoji}</span>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: card.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* What you'll get — new users. Hidden on mobile so first-
                    time users get a focused upload experience instead of
                    scrolling through a feature preview before starting. */}
                {isNewUser && (
                  <section className="hidden sm:block">
                    <div className="mb-3">
                      <h2 className="dash-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50">What you'll get</h2>
                      <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">A quick taste of what your analysis includes</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 dash-stagger">
                      <div className="rounded-2xl bg-[#EAFFD6] dark:bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30 p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="dash-serif font-extrabold text-stone-900 dark:text-stone-50 text-[14.5px]">Rubric scoring</h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-bold">Category scores + estimated grade</p>
                          </div>
                          <div className="shrink-0 rounded-lg bg-[#58CC02] text-white text-[10px] font-extrabold px-2 py-1 border-b-2 border-[#46A302]">B+</div>
                        </div>
                        <div className="space-y-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 p-2.5">
                          {[
                            { label: 'Thesis & focus', w: '78%', tone: 'bg-[#58CC02]' },
                            { label: 'Evidence', w: '65%', tone: 'bg-[#FF9600]' },
                            { label: 'Organization', w: '82%', tone: 'bg-[#58CC02]' },
                            { label: 'Clarity & style', w: '71%', tone: 'bg-[#1CB0F6]' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center gap-2">
                              <span className="w-[40%] text-[10px] font-bold text-stone-600 dark:text-stone-400 truncate">{row.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                                <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.w }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 p-4">
                        <div className="mb-3">
                          <h3 className="dash-serif font-extrabold text-stone-900 dark:text-stone-50 text-[14.5px]">Line-by-line notes</h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-bold">Inline highlights on your sentences</p>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 p-2.5 space-y-2">
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-[#58CC02] shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300 font-bold">
                              <span className="bg-[#EAFFD6] text-[#46A302] rounded px-0.5 font-extrabold">Strong thesis</span> — clearly states your position early.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-[#FF9600] shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300 font-bold">
                              This paragraph jumps topics — <span className="bg-[#FFF4E0] text-[#D97F00] rounded px-0.5 font-extrabold">add a bridge</span>.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-[#FF4B4B] shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300 font-bold">
                              Citation needed for{' '}
                              <span className="bg-[#FFE8E8] text-[#E04343] rounded px-0.5 font-extrabold">climate data</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-b-4 border-[#A560E8]/30 p-4">
                        <div className="mb-3">
                          <h3 className="dash-serif font-extrabold text-stone-900 dark:text-stone-50 text-[14.5px]">Revision suggestions</h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-bold">Actionable fixes, not vague advice</p>
                        </div>
                        <ul className="rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 p-2.5 space-y-2">
                          {[
                            'Tighten intro: move roadmap up',
                            'Swap passive → active in para 2',
                            'Add counterargument in section 3',
                          ].map((line) => (
                            <li key={line} className="flex items-start gap-2 text-[10px] text-stone-700 dark:text-stone-200 leading-snug font-bold">
                              <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#A560E8] text-white">
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}

                {/* Recent analyses — returning users */}
                {!isNewUser && recentAnalyses.length > 0 && (
                  <section>
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <h2 className="dash-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50">Recent analyses</h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">Continue where you left off</p>
                      </div>
                      <button
                        onClick={() => onNavigate('library')}
                        className="text-xs sm:text-sm font-extrabold text-[#1CB0F6] hover:underline whitespace-nowrap"
                      >
                        View all →
                      </button>
                    </div>
                    {/* Mobile shows the 3 most recent analyses; tablet+
                        shows up to 6. Cuts ~3 stacked cards (~300px) on
                        phones where scrolling matters most. */}
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 dash-stagger">
                      {recentAnalyses.slice(0, 6).map((a, idx) => {
                        const isMobileOnly = idx >= 3;
                        const duoColors = ['#FF4B4B', '#A560E8', '#1CB0F6', '#FF9600', '#58CC02', '#1CB0F6'];
                        const c = duoColors[idx % duoColors.length];
                        return (
                          <button
                            key={a.id}
                            onClick={() => onNavigate('analysis', a.id)}
                            className={`group rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 hover:border-stone-300 text-left transition-all active:border-b-2 active:translate-y-0.5 ${isMobileOnly ? 'hidden sm:block' : ''}`}
                          >
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white border-2 border-b-4 group-hover:scale-105 transition-transform" style={{ backgroundColor: c, borderColor: c }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="dash-serif text-[15px] font-extrabold text-stone-900 dark:text-stone-50 truncate">{a.title}</p>
                                  <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 font-bold">{relativeTime(a.createdAt)}</p>
                                </div>
                                {a.grade && (
                                  <span className="px-2 py-0.5 rounded-lg bg-[#EAFFD6] text-[#58CC02] text-xs font-extrabold border-2 border-[#58CC02]/30">{a.grade}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* === STUDY PACK === */}
            {dashboardTool === 'study_pack' && studyPackView === 'hub' && (
              <>
                <FeatureHub
                  title="Study packs"
                  subtitle="Turn your notes into flashcards, quizzes, crosswords & more."
                  mascotSrc="/mascot-study.webp"
                  themeColor="#FF9600"
                  themeBorderColor="#D97F00"
                  themeBgColor="#FFF4E0"
                  createLabel="+ Create new study pack"
                  createSubLabel="Paste your notes — get a full pack in seconds"
                  onCreate={() => setStudyPackView('create')}
                  recentItems={studyPackRecents}
                  loading={hubRecentsLoading}
                  onViewAll={() => onNavigate('quiz-history')}
                  emptyStateMessage="Your first study pack will live here. Create one above to get started."
                />
                {/* Preview between Recent (inside FeatureHub) and Quick Access
                    (rendered globally further down). Same component as the
                    embedded create flow uses inside StudyPackPage. */}
                <StudyPackPreviewSection embedded />
              </>
            )}
            {dashboardTool === 'study_pack' && studyPackView === 'create' && (
              <>
                {/* "Back to recents" hidden for users new to Study Pack
                    (empty hub = dead end). Visible the moment they've
                    built their first pack. */}
                {!isNewForStudyPack && (
                  <button
                    type="button"
                    onClick={() => setStudyPackView('hub')}
                    className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Back to recents
                  </button>
                )}

                {/* NEW-USER FUSED CARD — Study Pack. The conversion hero
                    (trust pill → outcome H1 → 4-tile benefit grid → down
                    arrow) sits inside this same wrapper as the embedded
                    StudyPackPage form, separated by a hairline divider.
                    Wrapping both in ONE div neutralises the parent
                    space-y-7 gap that previously forced them apart, so
                    they render as a single continuous card with one
                    orange border and one title.
                    Shown ONLY when the user has zero study packs yet —
                    once they've created their first, they see the regular
                    embedded StudyPackPage. */}
                {isNewForStudyPack ? (
                  <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40 shadow-[0_18px_42px_-12px_rgba(255,150,0,0.25)]">
                    {/* Mascots at the actual top corners of the fused
                        card (not the form section's top). Positioned
                        absolute on the outer wrapper so they sit above
                        everything else in the card. */}
                    <img
                      src="/mascot-study.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-20 sm:w-24 lg:w-28 h-auto z-20 drop-shadow-[0_12px_22px_rgba(217,119,6,0.30)]"
                    />
                    <img
                      src="/mascot-dance.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-20 sm:w-24 lg:w-28 h-auto z-20 drop-shadow-[0_12px_22px_rgba(217,119,6,0.30)]"
                    />
                    {/* Conversion hero half */}
                    <div className="relative px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10">
                      <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-2 border-[#58CC02]/40 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#46A302] dark:text-[#9BE85C]">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Trusted by 50,000+ students
                        </span>
                      </div>

                      <h2 className="dash-serif text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-stone-900 dark:text-stone-50">
                        Turn any notes into a{' '}
                        <span className="text-[#FF9600]">study pack</span>
                        <span className="block mt-1.5">in <span className="text-[#FF9600]">60 seconds</span></span>
                      </h2>

                      <p className="mt-4 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed font-bold">
                        Drop your notes. Get a lesson, flashcards, quizzes, and arcade mode — all from your text.
                      </p>

                      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
                        <div className="rounded-xl border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1CB0F6]/40 bg-[#DDF4FF]/60 dark:bg-[#1CB0F6]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>📚</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#1CB0F6] leading-tight">Step-by-step lesson</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Master the key ideas</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40 bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>🎴</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#FF9600] leading-tight">Auto flashcards</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Ready to study</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#A560E8]/30 dark:border-[#A560E8]/40 bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>✅</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#A560E8] leading-tight">Quizzes to test you</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Spot the gaps</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/40 bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>🎮</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#58CC02] leading-tight">Crater Blast + arcade mode</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Make studying fun</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col items-center text-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1.5">
                          Paste your notes below
                        </p>
                        <svg className="w-5 h-5 text-[#FF9600] motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    {/* Hairline divider between hero and form */}
                    <div className="h-px bg-[#FF9600]/20 mx-6 sm:mx-8 lg:mx-10" aria-hidden />

                    {/* Form half — StudyPackPage with hideHeader strips its
                        own outer card border so it nests cleanly here. */}
                    <StudyPackPage
                      embedded
                      hideHeader
                      onEmbeddedToolSwitch={switchEmbeddedTool}
                      onNavigate={onNavigate}
                      user={user}
                      onLogout={onLogout}
                    />
                  </div>
                ) : (
                  <StudyPackPage
                    embedded
                    onEmbeddedToolSwitch={switchEmbeddedTool}
                    onNavigate={onNavigate}
                    user={user}
                    onLogout={onLogout}
                  />
                )}
              </>
            )}

            {/* === CITATIONS === */}
            {dashboardTool === 'citations' && citationsView === 'hub' && (
              <>
                <FeatureHub
                  title="Citations"
                  subtitle="Find peer-reviewed sources in APA, MLA, Chicago & more."
                  mascotSrc="/mascot-thinking.webp"
                  themeColor="#1CB0F6"
                  themeBorderColor="#1899D6"
                  themeBgColor="#DDF4FF"
                  createLabel="+ Find new citations"
                  createSubLabel="Search by topic — get formatted, real sources"
                  onCreate={() => setCitationsView('create')}
                  recentItems={citationsRecents}
                  loading={hubRecentsLoading}
                  onViewAll={() => onNavigate('citation-history')}
                  emptyStateMessage="Your citation searches will live here."
                />
                {/* Preview between Recent (inside FeatureHub) and Quick Access
                    (rendered globally further down). Same component as the
                    embedded create flow uses inside CitationsPage. */}
                <CitationsPreviewSection embedded />
              </>
            )}
            {dashboardTool === 'citations' && citationsView === 'create' && (
              <>
                {/* "Back to recents" hidden for users new to Citations
                    (empty hub = dead end). Visible once they've done
                    their first citation search. */}
                {!isNewForCitations && (
                  <button
                    type="button"
                    onClick={() => setCitationsView('hub')}
                    className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Back to recents
                  </button>
                )}

                {/* NEW-USER FUSED CARD — Citations. One wrapper holds
                    both the conversion hero AND the embedded form so the
                    parent space-y-7 can't force a gap between them.
                    Shown ONLY for users new to Citations. */}
                {isNewForCitations ? (
                  <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1CB0F6]/40 shadow-[0_18px_42px_-12px_rgba(28,176,246,0.25)]">
                    {/* Mascots at top corners of the fused card */}
                    <img
                      src="/mascot-study.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-20 sm:w-24 lg:w-28 h-auto z-20"
                    />
                    <img
                      src="/mascot-dance.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-20 sm:w-24 lg:w-28 h-auto z-20"
                    />
                    {/* Conversion hero half */}
                    <div className="relative px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10">
                      <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/15 border-2 border-[#58CC02]/40 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#46A302] dark:text-[#9BE85C]">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Trusted by 50,000+ students
                        </span>
                      </div>

                      <h2 className="dash-serif text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-stone-900 dark:text-stone-50">
                        Find <span className="text-[#1CB0F6]">real sources</span> for your paper
                        <span className="block mt-1.5">in <span className="text-[#1CB0F6]">60 seconds</span></span>
                      </h2>

                      <p className="mt-4 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed font-bold">
                        Type your topic. Get real, citable journal sources formatted in any style — APA, MLA, Chicago, and more.
                      </p>

                      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
                        <div className="rounded-xl border-2 border-b-4 border-[#1CB0F6]/30 dark:border-[#1CB0F6]/40 bg-[#DDF4FF]/60 dark:bg-[#1CB0F6]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>📚</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#1CB0F6] leading-tight">Real journal sources</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Verified peer-reviewed</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#FF9600]/30 dark:border-[#FF9600]/40 bg-[#FFF4E0]/60 dark:bg-[#FF9600]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>🎯</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#FF9600] leading-tight">Any citation style</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">APA, MLA, Chicago…</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#A560E8]/30 dark:border-[#A560E8]/40 bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>📝</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#A560E8] leading-tight">Relevance notes</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">Why each source fits</p>
                        </div>
                        <div className="rounded-xl border-2 border-b-4 border-[#58CC02]/30 dark:border-[#58CC02]/40 bg-[#E5F8D0]/60 dark:bg-[#58CC02]/10 p-3 text-center">
                          <div className="text-xl mb-1" aria-hidden>⚡</div>
                          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#58CC02] leading-tight">60-second result</p>
                          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">No JSTOR digging</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col items-center text-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1.5">
                          Type your topic below
                        </p>
                        <svg className="w-5 h-5 text-[#1CB0F6] motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    {/* Hairline divider */}
                    <div className="h-px bg-[#1CB0F6]/20 mx-6 sm:mx-8 lg:mx-10" aria-hidden />

                    {/* Form half */}
                    <CitationsPage
                      embedded
                      hideHeader
                      onEmbeddedToolSwitch={switchEmbeddedTool}
                      onNavigate={onNavigate}
                      user={user}
                      onLogout={onLogout}
                    />
                  </div>
                ) : (
                  <CitationsPage
                    embedded
                    onEmbeddedToolSwitch={switchEmbeddedTool}
                    onNavigate={onNavigate}
                    user={user}
                    onLogout={onLogout}
                  />
                )}
              </>
            )}

            {/* === MORE TOOLS === */}
            {dashboardTool === 'more_tools' && (
              <section className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-5 sm:p-7">
                <div className="mb-5">
                  <h2 className="dash-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50">More tools</h2>
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">Free utilities — summarizer, calculators, grammar, and more.</p>
                </div>
                <MoreToolsGrid compact onNavigate={onNavigate} />
              </section>
            )}

            {/* === QUICK ACCESS — always visible === */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="dash-serif text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50">Quick access</h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-bold">Jump straight into your saved work</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 dash-stagger">
                {WORKSPACE_SHORTCUTS.map((link, i) => {
                  const tint = QUICK_ACCESS_TINTS[i % QUICK_ACCESS_TINTS.length];
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => {
                        onNavigate(link.page);
                        trackEvent('dashboard_workspace_shortcut', { page: link.page });
                      }}
                      className={`group rounded-2xl ${tint.tintBg} border-2 border-b-4 border-stone-200 dark:border-stone-700 p-3.5 text-left hover:border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all`}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${tint.bg} text-white flex items-center justify-center text-lg sm:text-xl border-2 border-b-4 ${tint.border} mb-2.5 group-hover:scale-110 transition-transform`}>
                        <span aria-hidden>{link.emoji}</span>
                      </div>
                      <p className={`dash-serif text-sm font-extrabold leading-tight ${tint.clr}`}>{link.label}</p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-stone-500 dark:text-stone-400 line-clamp-1 font-bold">{link.hint}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* === PRO UPGRADE BANNER === */}
            {isFree && (
              <section className="rounded-2xl bg-[#FF9600] border-2 border-b-4 border-[#D97F00]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl lg:text-3xl border-2 border-b-4 border-white/30">
                      <span aria-hidden>⭐</span>
                    </div>
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                        ✨ Limited offer
                      </p>
                      <h3 className="dash-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                        Unlock <span className="text-yellow-200">unlimited</span> essays
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-white/90 font-bold">Higher limits · 100 MB uploads · Every Pro tool</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#FF9600] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all whitespace-nowrap"
                  >
                    See Pro plans →
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
      </div>
    </LoggedInPageShell>
  );
};

export default Dashboard;
