import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import LoadingSpinner from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';
import { getResetsInText } from '../../utils/usageReset';
import CitationsPage, { type EmbeddedDashboardTool } from './CitationsPage';
import StudyPackPage from './StudyPackPage';
import { MoreToolsGrid } from './MoreToolsPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type DashboardTool = 'analyze' | 'citations' | 'study_pack' | 'more_tools';

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
    title: 'Analyze',
    desc: 'Professor-style essay feedback',
    emoji: '📝',
    iconClass: 'bg-gradient-to-br from-rose-400 to-violet-600',
    activeBar: 'border-l-rose-500',
    titleClass: 'text-rose-950 dark:text-rose-100',
    activeBg: 'bg-gradient-to-r from-rose-50/95 via-white to-violet-50/40 dark:from-rose-950/35 dark:via-stone-900/90 dark:to-violet-950/25',
    accent: 'rose',
  },
  {
    id: 'study_pack' as const,
    title: 'Study Pack',
    desc: 'Quiz, flashcards, lessons',
    emoji: '📦',
    iconClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
    activeBar: 'border-l-amber-500',
    titleClass: 'text-amber-950 dark:text-amber-100',
    activeBg: 'bg-gradient-to-r from-amber-50/95 via-white to-orange-50/35 dark:from-amber-950/25 dark:via-stone-900/90 dark:to-orange-950/20',
    accent: 'amber',
  },
  {
    id: 'citations' as const,
    title: 'Citations',
    desc: 'Find & format sources',
    emoji: '📚',
    iconClass: 'bg-gradient-to-br from-sky-400 to-blue-600',
    activeBar: 'border-l-sky-500',
    titleClass: 'text-sky-900 dark:text-sky-100',
    activeBg: 'bg-gradient-to-r from-sky-50/95 via-white to-blue-50/35 dark:from-sky-950/30 dark:via-stone-900/90 dark:to-blue-950/20',
    accent: 'sky',
  },
  {
    id: 'more_tools' as const,
    title: 'More tools',
    desc: 'Summarizer, grammar & more',
    emoji: '✨',
    iconClass: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    activeBar: 'border-l-violet-500',
    titleClass: 'text-violet-950 dark:text-violet-100',
    activeBg: 'bg-gradient-to-r from-violet-50/95 via-white to-fuchsia-50/35 dark:from-violet-950/30 dark:via-stone-900/90 dark:to-fuchsia-950/20',
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
  const [dashboardTool, setDashboardTool] = useState<DashboardTool>('analyze');
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

  const isNewUser = analysisCount === 0 && !isLoading;
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
    (usageStats.plan === 'premium' ? 199 : 49);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greetingEmoji = greeting === 'Good morning' ? '☀️' : greeting === 'Good afternoon' ? '👋' : '🌙';

  const QUICK_ACCESS_TINTS = [
    { grad: 'from-violet-400 to-purple-500', tint: 'from-violet-50/80 to-white dark:from-violet-950/30 dark:to-stone-900/80', clr: 'text-violet-700 dark:text-violet-300' },
    { grad: 'from-sky-400 to-blue-500', tint: 'from-sky-50/80 to-white dark:from-sky-950/30 dark:to-stone-900/80', clr: 'text-sky-700 dark:text-sky-300' },
    { grad: 'from-amber-400 to-orange-500', tint: 'from-amber-50/80 to-white dark:from-amber-950/30 dark:to-stone-900/80', clr: 'text-amber-700 dark:text-amber-300' },
    { grad: 'from-emerald-400 to-teal-500', tint: 'from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-stone-900/80', clr: 'text-emerald-700 dark:text-emerald-300' },
    { grad: 'from-rose-400 to-pink-500', tint: 'from-rose-50/80 to-white dark:from-rose-950/30 dark:to-stone-900/80', clr: 'text-rose-700 dark:text-rose-300' },
    { grad: 'from-fuchsia-400 to-purple-500', tint: 'from-fuchsia-50/80 to-white dark:from-fuchsia-950/30 dark:to-stone-900/80', clr: 'text-fuchsia-700 dark:text-fuchsia-300' },
  ];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-stone-50 dark:bg-stone-950">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {isFree && (
        <div
          role="region"
          aria-label="Limited time promotion"
          className="relative overflow-hidden border-b border-violet-200/70 dark:border-violet-900/60 bg-gradient-to-r from-violet-50 via-white to-violet-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(124,58,237,0.10),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(139,92,246,0.18),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Limited Time
              </span>
              <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-100">
                <span className="font-bold text-violet-700 dark:text-violet-300">50% off</span> your first month on monthly plans · use code{' '}
                <span className="inline-flex items-center rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-stone-900 px-2 py-0.5 font-mono font-bold text-violet-700 dark:text-violet-300 tracking-wide">
                  MAY2026
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <AnalysisAnimation isPopup={true} text="Analyzing your essay" isComplete={false} />
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
        .dash-serif { font-family: 'EB Garamond', Georgia, serif; }
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
        <header className="dash-fade mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-violet-500/95 dark:text-violet-400/95">
              {todayLabel}
            </p>
            {/* Greeting + workspace subtitle + trust — harmonious jewel tones */}
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-3">
              <h1 className="dash-serif shrink-0 text-[2rem] sm:text-4xl lg:text-[2.85rem] font-semibold leading-[1.08] tracking-tight text-stone-900 dark:text-stone-50">
                {greeting}
                {firstName ? (
                  <>
                    ,{' '}
                    <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent">
                      {firstName}
                    </span>
                  </>
                ) : (
                  ''
                )}
                <span className="ml-2 inline-block text-[1em] align-middle drop-shadow-sm" aria-hidden>
                  {greetingEmoji}
                </span>
              </h1>
              <span className="hidden md:inline shrink-0 h-px w-8 rounded-full bg-gradient-to-r from-violet-200 to-teal-200 dark:from-violet-700/70 dark:to-teal-600/70 select-none opacity-70" aria-hidden />
              <p className="hidden md:block text-sm sm:text-base leading-snug min-w-[10rem] max-w-xl text-stone-600 dark:text-indigo-100/76 font-medium">
                {getWorkspaceSubtitle(isNewUser, dashboardTool)}
              </p>
              <span className="hidden lg:inline shrink-0 h-px w-8 rounded-full bg-gradient-to-r from-teal-200 to-fuchsia-200 dark:from-teal-700/70 dark:to-fuchsia-600/70 select-none opacity-70" aria-hidden />
              <div
                className="hidden md:inline-flex shrink-0 items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 rounded-[1.375rem] bg-gradient-to-br from-teal-50/98 via-emerald-50/95 to-violet-50/98 dark:from-teal-950/50 dark:via-emerald-950/35 dark:to-violet-950/48 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-teal-200/65 dark:ring-teal-700/40 backdrop-blur-md"
              >
                <div className="flex -space-x-2.5" aria-hidden>
                  {[
                    { emoji: '👩‍🎓', light: 'from-teal-200 via-emerald-100 to-teal-200', dark: 'dark:from-teal-950/85 dark:via-emerald-900/65 dark:to-teal-900/85' },
                    { emoji: '👨‍🎓', light: 'from-sky-200 via-cyan-100 to-sky-200', dark: 'dark:from-sky-950/80 dark:via-cyan-950/55 dark:to-sky-900/85' },
                    { emoji: '👩‍💻', light: 'from-violet-200 via-fuchsia-100 to-violet-200', dark: 'dark:from-violet-950/80 dark:via-fuchsia-950/50 dark:to-purple-950/85' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${row.light} ${row.dark} flex items-center justify-center text-[14px] border-[2.5px] border-white/95 shadow-sm dark:border-stone-900/95`}
                    >
                      {row.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] sm:text-xs leading-snug max-w-[14rem] sm:max-w-none">
                  <span className="font-bold bg-gradient-to-r from-teal-700 via-emerald-600 to-violet-700 dark:from-teal-300 dark:via-emerald-300 dark:to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(16,185,129,0.1)] dark:drop-shadow-none">
                    50,000+
                  </span>{' '}
                  <span className="text-teal-900/90 dark:text-emerald-100/90 font-semibold tracking-tight">
                    students trust WriteScholar
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:justify-end sm:shrink-0">
            {analysisCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40 ring-1 ring-amber-200/70 dark:ring-amber-800/40 shadow-sm">
                <span className="dash-fire text-base" aria-hidden>🔥</span>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {analysisCount} {analysisCount === 1 ? 'essay' : 'essays'} analyzed
                </span>
              </div>
            )}
            {isFree ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/85 dark:bg-stone-900/70 ring-1 ring-stone-200 dark:ring-stone-700 shadow-sm backdrop-blur-sm">
                  <span className="text-sm" aria-hidden>✨</span>
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">Free plan</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-fuchsia-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Upgrade
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30">
                <span className="text-sm" aria-hidden>⭐</span>
                <span className="text-xs font-bold uppercase tracking-wider">{plan}</span>
              </div>
            )}
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE TAB BAR (lg- only)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden mb-5 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
          <div className="relative inline-flex gap-1 p-2 rounded-[1.125rem] bg-white/98 dark:bg-stone-900/94 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] shadow-lg shadow-teal-900/[0.08] dark:shadow-black/45 border border-teal-200/55 dark:border-violet-800/45 backdrop-blur-xl">
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.125rem] bg-gradient-to-br from-teal-50/40 via-transparent to-violet-50/35 dark:from-teal-950/20 dark:via-transparent dark:to-violet-950/25" />
            {DASHBOARD_TOOL_ITEMS.map((item) => {
              const active = dashboardTool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDashboardTool(item.id);
                    trackEvent('dashboard_tool_tab', { tool: item.id });
                  }}
                  className={`relative z-[1] flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? `${item.activeBg} text-stone-900 dark:text-stone-50 shadow-[0_8px_20px_-6px_rgba(91,33,182,0.18)] dark:shadow-black/35 ring-1 ring-white/80 dark:ring-white/10 scale-[1.02]`
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-stone-800/50 hover:shadow-sm active:scale-[0.98]'
                  }`}
                >
                  <span className={`text-base transition-transform ${active ? 'scale-110' : ''}`} aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="dash-serif tracking-tight">{item.title}</span>
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
              {/* Workspace — airy glass + soft glow */}
              <div className="relative rounded-2xl overflow-hidden bg-white/[0.97] dark:bg-stone-900/94 border border-white/90 dark:border-stone-700/90 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.18),0_8px_24px_-12px_rgba(15,118,110,0.12)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] backdrop-blur-[18px]">
                {/* Ambient washes */}
                <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-violet-400/22 to-fuchsia-400/14 blur-[48px] dark:from-violet-500/20 dark:to-fuchsia-600/14" />
                <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-teal-300/22 to-emerald-300/12 blur-[44px] dark:from-teal-600/16 dark:to-emerald-700/14" />

                {/* Top accent */}
                <div aria-hidden className="absolute inset-x-4 top-0 h-[3px] rounded-b-lg bg-gradient-to-r from-teal-400 via-violet-500 to-fuchsia-500 opacity-[0.95] shadow-[0_0_28px_-4px_rgba(139,92,246,0.42)] dark:opacity-100" />

                {/* Header */}
                <div className="relative px-4 pt-[1.125rem] pb-3 border-b border-stone-200/65 dark:border-stone-700/65 bg-[linear-gradient(165deg,rgba(250,251,253,0.98)_0%,rgba(240,251,246,0.55)_52%,rgba(245,243,255,0.45)_100%)] dark:bg-[linear-gradient(170deg,rgba(15,23,42,0.97)_0%,rgba(30,41,59,0.75)_58%,rgba(49,46,129,0.22)_100%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/15 to-violet-600/25 dark:from-teal-400/25 dark:to-violet-600/35 text-[13px]" aria-hidden>
                      ✳︎
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-transparent bg-gradient-to-r from-teal-700 via-violet-600 to-indigo-600 dark:from-teal-300 dark:via-violet-300 dark:to-indigo-300 bg-clip-text">
                      Workspace
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-stone-600/95 dark:text-stone-300/92 pl-0.5">
                    Switch tools or open your saved work.
                  </p>
                </div>

                <nav className="relative p-2.5 pt-3.5 flex flex-col gap-1.5" aria-label="Dashboard tools">
                  {DASHBOARD_TOOL_ITEMS.map((item) => {
                    const active = dashboardTool === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDashboardTool(item.id);
                          trackEvent('dashboard_tool_tab', { tool: item.id });
                        }}
                        className={`group relative flex items-center gap-3 rounded-[0.875rem] border-l-[3px] pl-2.5 pr-2.5 py-2.5 text-left transition-all duration-300 ease-out will-change-transform ${
                          active
                            ? `${item.activeBar} ${item.activeBg} shadow-[0_6px_20px_-8px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.55)]`
                            : 'border-l-transparent hover:border-l-stone-200/80 dark:hover:border-l-stone-600/60 hover:bg-white/75 dark:hover:bg-stone-800/45 hover:shadow-sm hover:-translate-y-px'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.65rem] text-base text-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.25)] ring-1 ring-white/35 dark:ring-white/10 ${item.iconClass} ${
                            active ? 'scale-105 -rotate-[2deg] shadow-lg' : 'group-hover:scale-105 group-hover:-rotate-[2deg] group-hover:shadow-md'
                          } transition-all duration-300`}
                        >
                          <span aria-hidden>{item.emoji}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`dash-serif text-[15px] font-bold leading-tight tracking-tight ${active ? item.titleClass : 'text-stone-800 dark:text-stone-50'}`}>
                            {item.title}
                          </p>
                          <p className={`mt-0.5 text-[10.5px] leading-snug line-clamp-1 ${active ? 'text-stone-600/90 dark:text-stone-400' : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300'}`}>
                            {item.desc}
                          </p>
                        </div>
                        {active && (
                          <svg className="h-3.5 w-3.5 shrink-0 text-violet-500/95 dark:text-emerald-400/95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Shortcuts */}
                <div className="relative px-4 pt-3.5 pb-2 border-t border-stone-200/65 dark:border-stone-700/65 bg-white/40 dark:bg-stone-950/25 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-[11px] opacity-85">
                        ⚡
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 dark:text-violet-300/90">
                        Shortcuts
                      </p>
                    </div>
                    <span className="h-px flex-1 max-w-[3.5rem] ml-auto bg-gradient-to-r from-transparent to-violet-200/85 dark:to-violet-600/35 rounded-full opacity-75" aria-hidden />
                  </div>
                </div>
                <nav className="relative px-2.5 pb-3 pt-1 flex flex-col gap-px" aria-label="Workspace shortcuts">
                  {WORKSPACE_SHORTCUTS.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => {
                        onNavigate(link.page);
                        trackEvent('dashboard_workspace_shortcut', { page: link.page });
                      }}
                      className="group flex items-center gap-2.5 rounded-[0.6875rem] px-2 py-2 text-left transition-all duration-200 hover:bg-white/90 dark:hover:bg-stone-800/55 hover:shadow-[0_4px_14px_-6px_rgba(79,70,229,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 dark:focus-visible:ring-violet-500/35"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5rem] text-sm shadow-sm bg-white/95 dark:bg-stone-900/95 border border-teal-200/55 dark:border-stone-600/85 text-stone-800 dark:text-stone-100 group-hover:border-violet-300/85 dark:group-hover:border-violet-600/50 group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-teal-50/90 dark:group-hover:from-stone-900 dark:group-hover:to-violet-950/60 group-hover:-translate-y-px transition-all"
                        aria-hidden
                      >
                        {link.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold leading-tight text-stone-800 dark:text-stone-50 group-hover:text-violet-900 dark:group-hover:text-violet-200 transition-colors duration-200">
                          {link.label}
                        </span>
                        <span className="block text-[10px] mt-px leading-snug text-stone-500 dark:text-stone-400 line-clamp-1 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                          {link.hint}
                        </span>
                      </span>
                      <svg
                        className="h-3.5 w-3.5 shrink-0 translate-x-[-2px] text-stone-300 dark:text-violet-700/85 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 text-violet-400 dark:group-hover:text-emerald-300 transition-all duration-200"
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
              </div>

              {/* Sidebar Pro card (free users) */}
              {isFree && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 shadow-xl shadow-violet-500/25">
                  <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden>
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-300/30 blur-2xl dash-orb" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-pink-300/30 blur-2xl dash-orb" style={{ animationDelay: '3s' }} />
                  </div>
                  <div className="relative p-4">
                    <p className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      <span aria-hidden>⭐</span> Pro
                    </p>
                    <p className="dash-serif mt-2 text-[17px] font-bold text-white leading-tight">
                      Unlock unlimited essays
                    </p>
                    <p className="mt-1 text-[11px] text-white/90 leading-snug">
                      Higher limits, larger uploads, every Pro tool.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('pricing')}
                      className="mt-3 w-full rounded-xl bg-white text-violet-700 hover:bg-amber-50 active:scale-[0.98] py-2 text-[12px] font-bold shadow-md transition-all"
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
            {/* === ANALYZE TOOL === */}
            {dashboardTool === 'analyze' && (
              <>
                {/* Hero upload card */}
                <section className="relative rounded-3xl overflow-hidden bg-white dark:bg-stone-900/80 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-xl shadow-stone-900/[0.05] dark:shadow-black/40">
                  {/* Top accent strip */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-400" />
                  {/* Soft ambient glow */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-300/15 dark:bg-violet-500/10 blur-3xl dash-orb" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-fuchsia-300/15 dark:bg-fuchsia-500/10 blur-3xl dash-orb" style={{ animationDelay: '5s' }} />
                  </div>

                  <div className="relative p-6 sm:p-8 lg:p-10">
                    {/* Studying mascot — top left, always playing */}
                    <img
                      src="/mascot-study.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(124,58,237,0.25)]"
                    />
                    {/* Dancing mascot — top right, always playing */}
                    <img
                      src="/mascot-dance.webp"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="hidden sm:block pointer-events-none absolute top-3 right-3 sm:top-4 sm:right-4 w-20 sm:w-24 lg:w-28 h-auto z-10 drop-shadow-[0_12px_22px_rgba(124,58,237,0.25)]"
                    />
                    {/* Pill badge */}
                    <div className="text-center mb-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200/80 dark:ring-violet-800/50 text-xs font-medium">
                        <span aria-hidden>✨</span>
                        {isNewUser ? 'Get started in under a minute' : 'Ready for your next analysis'}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="dash-serif text-center text-2xl sm:text-3xl lg:text-[2.4rem] font-semibold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50">
                      {isNewUser ? (
                        <>
                          Get <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent">professor-style feedback</span> on your essay
                        </>
                      ) : (
                        <>
                          Drop in your <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent">next essay</span>
                        </>
                      )}
                    </h2>
                    <p className="mt-3 text-center text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                      {isNewUser
                        ? 'Drop in your paper and see exactly what to improve — structure, arguments, clarity, and more.'
                        : 'Detailed feedback on structure, arguments, and writing quality.'}
                    </p>

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
                      className={`group relative mt-6 cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        dropActive
                          ? 'scale-[1.005] border-violet-500 bg-violet-50/80 dark:bg-violet-900/30 shadow-inner'
                          : 'border-violet-300/70 dark:border-violet-700/50 bg-gradient-to-b from-violet-50/40 via-white to-white dark:from-violet-950/30 dark:via-stone-900/70 dark:to-stone-900/70 hover:border-violet-400 hover:from-violet-50/80 hover:to-white dark:hover:from-violet-950/40'
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
                            <div className="w-full max-w-xs h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20">
                              <span className="absolute inset-0 rounded-2xl dash-pulse" aria-hidden />
                              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-violet-600/35 group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300">
                                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                            </div>
                            <p className="dash-serif text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100">
                              Drop your essay here
                            </p>
                            <p className="mt-1 text-sm sm:text-base text-stone-500 dark:text-stone-400">
                              or <span className="text-violet-700 dark:text-violet-300 font-semibold underline-offset-4 group-hover:underline">click to browse</span>
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold ring-1 ring-rose-200/70 dark:ring-rose-800/40">PDF</span>
                              <span className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-semibold ring-1 ring-sky-200/70 dark:ring-sky-800/40">Word</span>
                              <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold ring-1 ring-stone-200/70 dark:ring-stone-700/60">TXT</span>
                            </div>
                            <p className="mt-3 text-[11px] text-stone-400 dark:text-stone-500">
                              Up to {getMaxFileSizeLabel(plan)}
                              {isFree && (
                                <>
                                  {' · '}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onNavigate('pricing'); }}
                                    className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
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

                    {/* Analysis previews — below drop zone */}
                    <section
                      aria-labelledby="analyze-output-examples-heading"
                      className="mt-6 sm:mt-7 rounded-2xl border border-stone-200/85 dark:border-stone-700/75 bg-white/75 dark:bg-stone-900/45 p-4 sm:p-6 ring-1 ring-stone-200/35 dark:ring-white/5 shadow-inner"
                    >
                      <h3
                        id="analyze-output-examples-heading"
                        className="text-center dash-serif text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100"
                      >
                        See what your analysis looks like
                      </h3>
                      <p className="mt-1 text-center text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mx-auto px-2 sm:px-0 text-balance max-w-[min(100%,36rem)]">
                        Muted previews for your draft—not canned advice.
                      </p>

                      <div className="mt-4 flex flex-nowrap gap-3 lg:gap-4 justify-between overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin]">
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-black/80">
                            <video
                              className="absolute inset-0 h-full w-full object-cover object-center"
                              aria-label="Short preview of essay analysis and professor-style feedback"
                              title="Essay analyzer preview"
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            >
                              <source src="/writescholar-essay-checker-demo.mp4" type="video/mp4" />
                            </video>
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Quick walkthrough
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/analyseimage1.png"
                              alt="Sample rubric and feedback overview from an analyzed essay"
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Rubric & notes
                          </figcaption>
                        </figure>
                        <figure className="snap-center shrink-0 w-[min(72vw,260px)] sm:w-[min(34vw,260px)] lg:w-0 lg:min-w-0 lg:flex-1 rounded-xl overflow-hidden bg-stone-950 border-2 border-violet-500 dark:border-violet-400 shadow-sm flex flex-col">
                          <div className="relative aspect-[16/11] w-full bg-stone-900">
                            <img
                              src="/analyseimage2.png"
                              alt="Sample full written breakdown from an analyzed essay"
                              className="absolute inset-0 h-full w-full object-cover object-top"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <figcaption className="px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-stone-600 dark:text-stone-400 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/95">
                            Full report
                          </figcaption>
                        </figure>
                      </div>
                    </section>

                    {uploadError && (
                      <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {uploadError}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="my-7 flex items-center gap-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-200 to-transparent dark:via-stone-700" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Or paste below</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-stone-200 to-transparent dark:via-stone-700" />
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste your essay here (minimum 200 words)..."
                        className="w-full min-h-[180px] rounded-2xl border border-stone-200/90 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/40 p-5 text-[15px] leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none focus:outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
                      />
                      <div className="absolute bottom-4 left-5 text-xs">
                        <span className={isTextValid ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400 dark:text-stone-500'}>
                          {getWordCount(inputText)} words
                        </span>
                        {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                          <span className="text-amber-600 dark:text-amber-400"> · {200 - getWordCount(inputText)} more needed</span>
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200/70 dark:ring-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
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
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm sm:text-base font-semibold transition-all ${
                          isTextValid
                            ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-fuchsia-500/35 hover:-translate-y-0.5 active:translate-y-0'
                            : 'cursor-not-allowed bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 ring-1 ring-stone-200/70 dark:ring-stone-700/60'
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

                {/* Stats row — compact, refined */}
                {!loadingUsage && (
                  <section>
                    <div className="flex items-end justify-between mb-3 gap-3">
                      <div>
                        <h3 className="dash-serif text-base sm:text-lg font-semibold text-stone-700 dark:text-stone-200">
                          {showCombinedUsage ? 'This month' : 'Monthly usage'}
                        </h3>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                          {getResetsInText(usageStats.daysUntilReset)}
                        </p>
                      </div>
                      {isFree && (
                        <button
                          type="button"
                          onClick={() => onNavigate('pricing')}
                          className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 hover:underline"
                        >
                          Higher limits →
                        </button>
                      )}
                    </div>
                    {showCombinedUsage ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 dash-stagger">
                        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white/95 dark:bg-stone-900/70 ring-1 ring-violet-200/80 dark:ring-violet-800/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group backdrop-blur-sm">
                          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-violet-400/15" aria-hidden />
                          <div className="relative p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">
                                  Combined actions
                                </p>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Analyses · Citations · Study packs · one monthly pool</p>
                              </div>
                              <span className="text-2xl" aria-hidden>⚡</span>
                            </div>
                            <p className={`dash-serif mt-2 text-3xl font-bold leading-none tabular-nums ${
                              (usageStats.combinedActionsRemaining ?? 0) <= 0
                                ? 'text-red-600 dark:text-red-400'
                                : (usageStats.combinedActionsRemaining ?? 0) <= Math.max(1, Math.floor(combinedLimit * 0.2))
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-violet-700 dark:text-violet-300'
                            }`}>
                              {usageStats.combinedActionsRemaining ?? 0}
                              <span className="ml-1.5 text-xs font-normal text-stone-400 dark:text-stone-500">left</span>
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">of {combinedLimit} this period</p>
                            <div className="mt-3 h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 transition-all duration-700"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(2, Math.round(((usageStats.combinedActionsRemaining ?? 0) / Math.max(1, combinedLimit)) * 100))
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const rem = usageStats.uploadsRemaining;
                          const cap = freeLimitsFromApi.documentsPerMonth ?? -1;
                          const pct = cap === -1 ? 100 : usagePct(rem, cap);
                          const display = rem === -1 ? '∞' : `${rem}`;
                          const isUnlimited = rem === -1;
                          return (
                            <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-stone-900/70 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group backdrop-blur-sm">
                              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-emerald-400/15" aria-hidden />
                              <div className="relative p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">Uploads</p>
                                    <p className={`dash-serif mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300 leading-none`}>
                                      {display}
                                      {!isUnlimited && (
                                        <span className="ml-1.5 text-xs font-normal text-stone-400 dark:text-stone-500">left</span>
                                      )}
                                      {isUnlimited && (
                                        <span className="ml-1.5 text-xs font-normal text-stone-400 dark:text-stone-500">library</span>
                                      )}
                                    </p>
                                  </div>
                                  <span className="text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" aria-hidden>📄</span>
                                </div>
                                <div className="mt-3 h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
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
                            label: 'Essay analyses',
                            emoji: '📝',
                            remaining: usageStats.analysesRemaining,
                            total: freeMonthlyCaps.analyses,
                            accent: 'rose' as const,
                          },
                          {
                            key: 'study',
                            label: 'Study packs',
                            emoji: '📦',
                            remaining: usageStats.studyPacksRemaining,
                            total: freeMonthlyCaps.studyPacks,
                            accent: 'amber' as const,
                          },
                          {
                            key: 'citations',
                            label: 'Citations',
                            emoji: '📚',
                            remaining: usageStats.citationsRemaining,
                            total: freeMonthlyCaps.citations,
                            accent: 'sky' as const,
                          },
                          {
                            key: 'uploads',
                            label: 'Uploads',
                            emoji: '📄',
                            remaining: usageStats.uploadsRemaining,
                            total: freeMonthlyCaps.uploads,
                            accent: 'emerald' as const,
                          },
                        ].map((card) => {
                          const pct = usagePct(card.remaining, card.total);
                          const display = card.remaining === -1 ? '∞' : `${card.remaining}`;
                          const isUnlimited = card.remaining === -1;
                          const accentMap = {
                            rose: { bar: 'from-rose-400 to-pink-500', text: 'text-rose-700 dark:text-rose-300', glow: 'bg-rose-400/15' },
                            sky: { bar: 'from-sky-400 to-blue-500', text: 'text-sky-700 dark:text-sky-300', glow: 'bg-sky-400/15' },
                            amber: { bar: 'from-amber-400 to-orange-500', text: 'text-amber-700 dark:text-amber-300', glow: 'bg-amber-400/15' },
                            emerald: { bar: 'from-emerald-400 to-teal-500', text: 'text-emerald-700 dark:text-emerald-300', glow: 'bg-emerald-400/15' },
                          };
                          const a = accentMap[card.accent];
                          return (
                            <div key={card.key} className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-stone-900/70 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group backdrop-blur-sm">
                              <div className={`pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl ${a.glow}`} aria-hidden />
                              <div className="relative p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 truncate">{card.label}</p>
                                    <p className={`dash-serif mt-1 text-3xl font-bold ${a.text} leading-none`}>
                                      {display}
                                      {!isUnlimited && <span className="ml-1.5 text-xs font-normal text-stone-400 dark:text-stone-500">left</span>}
                                    </p>
                                  </div>
                                  <span className="text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" aria-hidden>{card.emoji}</span>
                                </div>
                                <div className="mt-3 h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                                  <div className={`h-full rounded-full bg-gradient-to-r ${a.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* What you'll get — new users */}
                {isNewUser && (
                  <section>
                    <div className="mb-3">
                      <h2 className="dash-serif text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50">What you'll get</h2>
                      <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">A quick taste of what your analysis includes</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 dash-stagger">
                      {/* Rubric scoring */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-stone-900/80 ring-1 ring-emerald-200/70 dark:ring-emerald-800/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="dash-serif font-bold text-stone-900 dark:text-stone-50 text-[14.5px]">Rubric scoring</h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Category scores + estimated grade</p>
                          </div>
                          <div className="shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-1 shadow-sm">B+</div>
                        </div>
                        <div className="space-y-2 rounded-xl bg-white/90 dark:bg-stone-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/40 p-2.5">
                          {[
                            { label: 'Thesis & focus', w: '78%', tone: 'bg-emerald-500' },
                            { label: 'Evidence', w: '65%', tone: 'bg-amber-500' },
                            { label: 'Organization', w: '82%', tone: 'bg-emerald-500' },
                            { label: 'Clarity & style', w: '71%', tone: 'bg-sky-500' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center gap-2">
                              <span className="w-[40%] text-[10px] font-medium text-stone-600 dark:text-stone-400 truncate">{row.label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-stone-200/90 dark:bg-stone-700/80 overflow-hidden">
                                <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.w }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Line-by-line notes */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/30 dark:to-stone-900/80 ring-1 ring-amber-200/70 dark:ring-amber-800/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-4">
                        <div className="mb-3">
                          <h3 className="dash-serif font-bold text-stone-900 dark:text-stone-50 text-[14.5px]">Line-by-line notes</h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Inline highlights on your sentences</p>
                        </div>
                        <div className="rounded-xl bg-white/90 dark:bg-stone-950/40 ring-1 ring-amber-100 dark:ring-amber-900/40 p-2.5 space-y-2">
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300">
                              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 rounded px-0.5">Strong thesis</span> — clearly states your position early.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-amber-500 shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300">
                              This paragraph jumps topics — <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded px-0.5">add a bridge</span>.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-1 rounded-full bg-red-500 shrink-0" aria-hidden />
                            <p className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-300">
                              Citation needed for{' '}
                              <span className="bg-red-100 dark:bg-red-950/50 text-red-900 dark:text-red-100 rounded px-0.5 ring-1 ring-red-200 dark:ring-red-800/60">climate data</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Revision suggestions */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-violet-50/80 to-white dark:from-violet-950/30 dark:to-stone-900/80 ring-1 ring-violet-200/70 dark:ring-violet-800/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-4">
                        <div className="mb-3">
                          <h3 className="dash-serif font-bold text-stone-900 dark:text-stone-50 text-[14.5px]">Revision suggestions</h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Actionable fixes, not vague advice</p>
                        </div>
                        <ul className="rounded-xl bg-white/90 dark:bg-stone-950/40 ring-1 ring-violet-100 dark:ring-violet-900/40 p-2.5 space-y-2">
                          {[
                            'Tighten intro: move roadmap up',
                            'Swap passive → active in para 2',
                            'Add counterargument in section 3',
                          ].map((line) => (
                            <li key={line} className="flex items-start gap-2 text-[10px] text-stone-700 dark:text-stone-200 leading-snug">
                              <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
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
                        <h2 className="dash-serif text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50">Recent analyses</h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">Continue where you left off</p>
                      </div>
                      <button
                        onClick={() => onNavigate('library')}
                        className="text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-400 hover:underline whitespace-nowrap"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 dash-stagger">
                      {recentAnalyses.slice(0, 6).map((a, idx) => {
                        const palettes = ['from-rose-400 to-pink-500', 'from-violet-400 to-fuchsia-500', 'from-sky-400 to-blue-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-fuchsia-400 to-purple-500'];
                        const pal = palettes[idx % palettes.length];
                        return (
                          <button
                            key={a.id}
                            onClick={() => onNavigate('analysis', a.id)}
                            className="group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-stone-900/70 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-left backdrop-blur-sm"
                          >
                            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${pal}`} />
                            <div className="relative p-4">
                              <div className="flex items-start gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${pal} text-white shadow-md group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="dash-serif text-[15px] font-bold text-stone-900 dark:text-stone-50 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{a.title}</p>
                                  <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">{relativeTime(a.createdAt)}</p>
                                </div>
                                {a.grade && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold ring-1 ring-emerald-200/60 dark:ring-emerald-800/50">{a.grade}</span>
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
            {dashboardTool === 'study_pack' && (
              <StudyPackPage
                embedded
                onEmbeddedToolSwitch={switchEmbeddedTool}
                onNavigate={onNavigate}
                user={user}
                onLogout={onLogout}
              />
            )}

            {/* === CITATIONS === */}
            {dashboardTool === 'citations' && (
              <CitationsPage
                embedded
                onEmbeddedToolSwitch={switchEmbeddedTool}
                onNavigate={onNavigate}
                user={user}
                onLogout={onLogout}
              />
            )}

            {/* === MORE TOOLS === */}
            {dashboardTool === 'more_tools' && (
              <section className="rounded-3xl bg-white/85 dark:bg-stone-900/70 ring-1 ring-stone-200/80 dark:ring-stone-700/60 shadow-md backdrop-blur-md p-5 sm:p-7">
                <div className="mb-5">
                  <h2 className="dash-serif text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50">More tools</h2>
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">Free utilities — summarizer, calculators, grammar, and more.</p>
                </div>
                <MoreToolsGrid compact onNavigate={onNavigate} />
              </section>
            )}

            {/* === QUICK ACCESS — always visible === */}
            <section>
              <div className="mb-3">
                <h2 className="dash-serif text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50">Quick access</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">Jump straight into your saved work</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 dash-stagger">
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
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${tint.tint} ring-1 ring-stone-200/80 dark:ring-stone-700/60 p-3.5 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                    >
                      <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${tint.grad} text-white flex items-center justify-center text-lg sm:text-xl shadow-md mb-2.5 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300`}>
                        <span aria-hidden>{link.emoji}</span>
                      </div>
                      <p className={`dash-serif text-sm font-bold leading-tight ${tint.clr}`}>{link.label}</p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-stone-500 dark:text-stone-400 line-clamp-1">{link.hint}</p>
                      <svg className={`absolute right-3 top-3 w-3.5 h-3.5 ${tint.clr} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* === PRO UPGRADE BANNER === */}
            {isFree && (
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 shadow-2xl shadow-fuchsia-500/30">
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                  <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/15 blur-3xl dash-orb" />
                  <div className="absolute top-1/2 -left-16 w-48 h-48 rounded-full bg-amber-300/20 blur-3xl dash-orb" style={{ animationDelay: '2s' }} />
                  <div className="absolute -bottom-8 right-1/3 w-40 h-40 rounded-full bg-pink-300/20 blur-3xl dash-orb" style={{ animationDelay: '4s' }} />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-2 ring-white/30 text-2xl lg:text-3xl shadow-lg">
                      <span aria-hidden>⭐</span>
                    </div>
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-1.5 backdrop-blur-sm">
                        <span aria-hidden>✨</span> Limited offer
                      </p>
                      <h3 className="dash-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                        Unlock <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">unlimited</span> essays
                      </h3>
                      <p className="mt-1.5 text-sm sm:text-base text-white/90">Higher limits · 100 MB uploads · Every Pro tool</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-amber-50 text-violet-700 font-bold rounded-xl shadow-xl shadow-black/15 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
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
  );
};

export default Dashboard;
