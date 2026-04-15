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

interface UsageStatsShape {
  plan: string;
  analysesRemaining: number;
  citationsRemaining: number;
  studyPacksRemaining: number;
  uploadsRemaining: number;
  daysUntilReset?: number | null;
  combinedActionsRemaining?: number;
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
    desc: 'Professor-style feedback on your essays',
    emoji: '📝',
    iconClass: 'bg-gradient-to-br from-rose-400 to-violet-600',
    activeBar: 'border-l-rose-500',
    titleClass: 'text-rose-950 dark:text-rose-100',
    activeBg: 'bg-gradient-to-r from-rose-50/95 via-white to-violet-50/40 dark:from-rose-950/35 dark:via-stone-900/90 dark:to-violet-950/25',
  },
  {
    id: 'citations' as const,
    title: 'Citations',
    desc: 'Find and format academic sources',
    emoji: '📚',
    iconClass: 'bg-gradient-to-br from-sky-400 to-blue-600',
    activeBar: 'border-l-sky-500',
    titleClass: 'text-sky-900 dark:text-sky-100',
    activeBg: 'bg-gradient-to-r from-sky-50/95 via-white to-blue-50/35 dark:from-sky-950/30 dark:via-stone-900/90 dark:to-blue-950/20',
  },
  {
    id: 'study_pack' as const,
    title: 'Study Pack',
    desc: 'Quiz, flashcards & lesson from notes',
    emoji: '📦',
    iconClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
    activeBar: 'border-l-amber-500',
    titleClass: 'text-amber-950 dark:text-amber-100',
    activeBg: 'bg-gradient-to-r from-amber-50/95 via-white to-orange-50/35 dark:from-amber-950/25 dark:via-stone-900/90 dark:to-orange-950/20',
  },
  {
    id: 'more_tools' as const,
    title: 'More tools',
    desc: 'Summarizer, flashcards & free utilities',
    emoji: '✨',
    iconClass: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    activeBar: 'border-l-violet-500',
    titleClass: 'text-violet-950 dark:text-violet-100',
    activeBg: 'bg-gradient-to-r from-violet-50/95 via-white to-fuchsia-50/35 dark:from-violet-950/30 dark:via-stone-900/90 dark:to-fuchsia-950/20',
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
  });
  const [loadingUsage, setLoadingUsage] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const plan = (user?.plan || usageStats.plan || 'free').toLowerCase();
  const isFree = plan === 'free';
  const firstName = getFirstName(user);
  const greeting = getTimeGreeting();

  const isNewUser = analysisCount === 0 && !isLoading;
  /** Pro/Premium use combined monthly bucket; Focus uses per-feature counts like free */
  const showCombinedUsage =
    (usageStats.plan === 'pro' || usageStats.plan === 'premium') &&
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

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-gradient-to-b from-stone-50 via-white to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {isAnalyzing && (
        <AnalysisAnimation isPopup={true} text="Analyzing your essay" isComplete={false} />
      )}

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-14">
        {/* Greeting — full width above sidebar + content */}
        <header className="mb-5 lg:mb-7">
          <h1
            className="text-xl sm:text-2xl lg:text-3xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          {isFree && (
            <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Free plan ·{' '}
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
              >
                Upgrade for unlimited
              </button>
            </p>
          )}
        </header>

        <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8 xl:gap-10">
          {/* Left rail: vertical toolbar on desktop; 2×2 grid on small screens */}
          <aside className="w-full shrink-0 lg:w-[17rem] xl:w-[17.5rem] lg:sticky lg:top-24 xl:top-[5.5rem] lg:z-[5] flex flex-col gap-3">
            <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/80 bg-white/85 dark:bg-stone-900/75 backdrop-blur-md shadow-[0_20px_50px_-28px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-stone-200/40 dark:ring-white/[0.06] overflow-hidden">
              <div className="px-3.5 pt-3 pb-2 border-b border-stone-100/90 dark:border-stone-800/80">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                  Workspace
                </p>
                <p className="mt-1 hidden lg:block text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  Switch tools or open your saved work — everything in one column.
                </p>
              </div>
              <nav
                className="grid grid-cols-2 lg:grid-cols-1 gap-2 p-2 sm:p-2.5 lg:p-2"
                aria-label="Dashboard tools"
              >
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
                      className={`group relative flex w-full flex-col lg:flex-row lg:items-center gap-2 rounded-xl border-l-[3px] px-2.5 py-2.5 sm:px-3 sm:py-3 text-left transition-all duration-200 ${
                        active
                          ? `${item.activeBar} ${item.activeBg} shadow-md ring-1 ring-black/[0.04] dark:ring-white/10`
                          : 'border-l-transparent bg-stone-50/50 dark:bg-stone-950/20 hover:bg-stone-100/90 dark:hover:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/50 lg:border-transparent lg:hover:border-stone-200/80 dark:lg:hover:border-stone-600/60'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 ${
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        } bg-gradient-to-br from-white/40 to-transparent dark:from-white/[0.03] dark:to-transparent`}
                        aria-hidden
                      />
                      <div
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-md ${item.iconClass}`}
                      >
                        <span aria-hidden>{item.emoji}</span>
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <p className={`text-sm font-bold leading-tight ${item.titleClass}`}>{item.title}</p>
                        <p className="mt-0.5 hidden lg:line-clamp-2 text-[11px] leading-snug text-stone-500 dark:text-stone-400">
                          {item.desc}
                        </p>
                        <p className="mt-0.5 lg:hidden text-[10px] leading-snug text-stone-500 dark:text-stone-400 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-stone-100/90 dark:border-stone-800/80 px-3.5 pt-2.5 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                  Shortcuts
                </p>
              </div>
              <nav
                className="flex flex-col gap-0.5 px-2 pb-2.5 pt-0"
                aria-label="Workspace shortcuts"
              >
                {WORKSPACE_SHORTCUTS.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => {
                      onNavigate(link.page);
                      trackEvent('dashboard_workspace_shortcut', { page: link.page });
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-stone-700 dark:text-stone-200 transition-colors hover:bg-violet-50/90 dark:hover:bg-violet-950/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100/90 text-base shadow-sm ring-1 ring-stone-200/70 dark:bg-stone-800/80 dark:ring-stone-600/50 group-hover:bg-white dark:group-hover:bg-stone-800"
                      aria-hidden
                    >
                      {link.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold leading-tight">{link.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-stone-500 dark:text-stone-400 line-clamp-1">
                        {link.hint}
                      </span>
                    </span>
                    <svg
                      className="h-4 w-4 shrink-0 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-500"
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

            {/* Secondary card: plan CTA on free */}
            {isFree && (
              <div className="hidden lg:block rounded-2xl border border-violet-200/70 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/50 dark:from-violet-950/40 dark:to-fuchsia-950/20 p-3.5 shadow-md ring-1 ring-violet-200/30 dark:ring-violet-900/30">
                <p className="text-xs font-semibold text-violet-950 dark:text-violet-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  Unlock unlimited analyses
                </p>
                <p className="mt-1 text-[11px] leading-snug text-violet-800/90 dark:text-violet-200/90">
                  Higher limits, larger uploads, and every study tool.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="mt-2.5 w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-900/20 transition hover:bg-violet-500 active:scale-[0.99]"
                >
                  View plans
                </button>
              </div>
            )}
          </aside>

          {/* Main column — analyze, citations, study pack, more tools, usage */}
          <div className="min-w-0 flex-1 space-y-6 lg:space-y-8">
        {/* === ANALYZE: HERO UPLOAD === */}
        {dashboardTool === 'analyze' && (
        <div className="relative">
          {/* Main upload card */}
          <div
            className={`relative rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
              dropActive
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 shadow-2xl shadow-violet-500/25'
                : 'border-stone-200/90 dark:border-stone-700 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 dark:from-stone-900 dark:via-violet-950/25 dark:to-stone-900 shadow-xl shadow-violet-900/[0.06] dark:shadow-black/30'
            }`}
          >
            {/* Gradient accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-400" />

            {/* Soft background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[1.4rem]" aria-hidden>
              <div className="absolute -right-12 top-20 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-600/10" />
              <div className="absolute -left-8 bottom-32 h-44 w-44 rounded-full bg-fuchsia-400/10 blur-3xl dark:bg-fuchsia-600/5" />
              <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-pink-300/10 blur-2xl" />
            </div>

            <div className="relative p-5 sm:p-8 lg:p-10">
              {/* Headline */}
              <div className="mb-6 text-center sm:mb-8 lg:mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-violet-800 shadow-sm backdrop-blur-sm dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200 sm:text-sm">
                  <span aria-hidden className="text-base">
                    ✨
                  </span>
                  {isNewUser ? 'Get started in under a minute' : 'Ready for your next analysis'}
                </div>

                <h2
                  className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl lg:text-4xl"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  {isNewUser ? (
                    <>
                      Get <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-fuchsia-400">professor-style feedback</span> on your essay
                    </>
                  ) : (
                    <>
                      Upload your <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-fuchsia-400">next essay</span>
                    </>
                  )}
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400 sm:text-lg">
                  {isNewUser
                    ? 'Drop in your paper and see exactly what to improve — structure, arguments, clarity, and more.'
                    : 'Get detailed feedback on structure, arguments, and writing quality.'}
                </p>
              </div>

              {/* Upload drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isUploading) fileInputRef.current?.click();
                  }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10 ${
                  dropActive
                    ? 'scale-[1.01] border-violet-500 bg-violet-100/90 shadow-inner dark:bg-violet-900/35'
                    : 'border-violet-300/90 bg-gradient-to-b from-violet-50/80 via-white to-white shadow-inner shadow-violet-100/40 dark:border-violet-600/50 dark:from-violet-950/30 dark:via-stone-900/90 dark:to-stone-900/80 dark:shadow-none hover:border-violet-400 hover:from-violet-50 hover:to-white dark:hover:from-violet-950/40'
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

                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner size="lg" text={`Uploading... ${uploadProgress}%`} color="blue" />
                    <div className="w-full max-w-xs bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
                        <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>

                    <p
                      className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      Drop your essay here
                    </p>

                    <p className="text-stone-600 dark:text-stone-400 mb-4">
                      or <span className="text-violet-600 dark:text-violet-400 font-medium">click to browse</span>
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 text-sm">
                      <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">PDF</span>
                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">Word</span>
                      <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">TXT</span>
                    </div>

                    <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
                      Up to {getMaxFileSizeLabel(plan)} · {isFree && <span className="text-violet-600 dark:text-violet-400">Pro unlocks larger files</span>}
                    </p>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-300 to-stone-200 dark:via-stone-600 dark:to-stone-700" />
                <span className="whitespace-nowrap rounded-full border border-stone-200/80 bg-stone-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-400">
                  Or paste below
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-stone-300 to-stone-200 dark:via-stone-600 dark:to-stone-700" />
              </div>

              {/* Text input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your essay here (minimum 200 words)..."
                  className="w-full min-h-[180px] rounded-xl border border-stone-200/90 bg-white/90 p-5 text-stone-800 shadow-inner outline-none ring-0 transition-all placeholder:text-stone-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-violet-500 resize-none text-base leading-relaxed"
                />

                <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500">
                  {getWordCount(inputText)} words
                  {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                    <span className="text-amber-600 dark:text-amber-400"> · {200 - getWordCount(inputText)} more needed</span>
                  )}
                </div>
              </div>

              {/* Analyze button */}
              <div className="mt-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {inputText.trim() && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                    >
                      Clear text
                    </button>
                  )}
                  {!isTextValid && (
                    <p className="max-w-md text-center text-xs text-stone-500 dark:text-stone-400 sm:text-left">
                      {getWordCount(inputText) === 0
                        ? 'Paste at least 200 words for full feedback on structure and argument.'
                        : `${200 - getWordCount(inputText)} more words needed.`}
                    </p>
                  )}
                  {isTextValid && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready to analyze
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeText}
                  disabled={!isTextValid}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold shadow-lg transition-all sm:min-w-[14rem] sm:px-8 sm:text-lg ${
                    isTextValid
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-xl hover:shadow-fuchsia-500/25 hover:-translate-y-0.5 active:translate-y-0'
                      : 'cursor-not-allowed bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500'
                  }`}
                >
                  {isTextValid ? (
                    <>
                      Let&apos;s analyze my essay
                      <span aria-hidden>✨</span>
                    </>
                  ) : (
                    'Analyze my essay'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* What you'll get — mini previews so each benefit reads instantly */}
          {isNewUser && (
            <div className="mt-6 sm:mt-8 grid sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/25 dark:to-stone-900/80 p-4 shadow-md ring-1 ring-emerald-100/60 dark:ring-emerald-900/30">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm">Rubric scoring</h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Category scores + estimated grade</p>
                  </div>
                  <div className="shrink-0 rounded-lg bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 shadow-sm">B+</div>
                </div>
                <div className="space-y-2 rounded-xl bg-white/90 dark:bg-stone-950/40 border border-emerald-100/80 dark:border-emerald-900/40 p-2.5">
                  {[
                    { label: 'Thesis & focus', w: '78%', tone: 'bg-emerald-500' },
                    { label: 'Evidence & support', w: '65%', tone: 'bg-amber-500' },
                    { label: 'Organization', w: '82%', tone: 'bg-emerald-500' },
                    { label: 'Clarity & style', w: '71%', tone: 'bg-sky-500' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="w-[38%] text-[9px] font-medium text-stone-600 dark:text-stone-400 truncate">{row.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-stone-200/90 dark:bg-stone-700/80 overflow-hidden">
                        <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/25 dark:to-stone-900/80 p-4 shadow-md ring-1 ring-amber-100/60 dark:ring-amber-900/30">
                <div className="mb-3">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm">Line-by-line notes</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Inline highlights on your own sentences</p>
                </div>
                <div className="rounded-xl bg-white/90 dark:bg-stone-950/40 border border-amber-100/80 dark:border-amber-900/40 p-2.5 space-y-2">
                  <div className="flex gap-2">
                    <span className="w-1 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                    <p className="text-[9px] leading-relaxed text-stone-600 dark:text-stone-300">
                      <span className="bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 rounded px-0.5">Strong thesis</span> — clearly states your position early.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-1 rounded-full bg-amber-500 shrink-0" aria-hidden />
                    <p className="text-[9px] leading-relaxed text-stone-600 dark:text-stone-300">
                      This paragraph jumps topics — <span className="bg-amber-100/90 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded px-0.5">add a bridge sentence</span>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-1 rounded-full bg-red-500 shrink-0" aria-hidden />
                    <p className="text-[9px] leading-relaxed text-stone-600 dark:text-stone-300">
                      Citation needed here for the statistic on{' '}
                      <span className="bg-red-100/95 dark:bg-red-950/50 text-red-900 dark:text-red-100 rounded px-0.5 ring-1 ring-red-200/80 dark:ring-red-800/60">
                        climate data
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-b from-violet-50/80 to-white dark:from-violet-950/25 dark:to-stone-900/80 p-4 shadow-md ring-1 ring-violet-100/60 dark:ring-violet-900/30">
                <div className="mb-3">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm">Revision suggestions</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Actionable fixes, not vague advice</p>
                </div>
                <ul className="rounded-xl bg-white/90 dark:bg-stone-950/40 border border-violet-100/80 dark:border-violet-900/40 p-2.5 space-y-2">
                  {[
                    'Tighten intro: move the roadmap sentence up',
                    'Swap passive voice in paragraph 2 → active verbs',
                    'Add one counterargument + rebuttal in section 3',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[9px] text-stone-700 dark:text-stone-200 leading-snug">
                      <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
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
          )}
        </div>
        )}

        {dashboardTool === 'citations' && (
          <div className="mb-5 sm:mb-6">
            <CitationsPage
              embedded
              onEmbeddedToolSwitch={switchEmbeddedTool}
              onNavigate={onNavigate}
              user={user}
              onLogout={onLogout}
            />
          </div>
        )}

        {dashboardTool === 'study_pack' && (
          <div className="mb-5 sm:mb-6">
            <StudyPackPage
              embedded
              onEmbeddedToolSwitch={switchEmbeddedTool}
              onNavigate={onNavigate}
              user={user}
              onLogout={onLogout}
            />
          </div>
        )}

        {dashboardTool === 'more_tools' && (
          <div className="mb-5 sm:mb-6 rounded-2xl border border-stone-200/80 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-950/25 p-4 sm:p-5 shadow-sm">
            <div className="mb-3 sm:mb-4 text-center sm:text-left">
              <h2
                className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                More tools
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5 max-w-2xl mx-auto sm:mx-0">
                Free utilities — each card opens a dedicated tool (summarizer, calculators, grammar, and more).
              </p>
            </div>
            <MoreToolsGrid compact onNavigate={onNavigate} />
          </div>
        )}

        {/* Recent analyses - shown for returning users */}
        {!isNewUser && recentAnalyses.length > 0 && dashboardTool === 'analyze' && (
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xl font-semibold text-stone-900 dark:text-stone-100"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Recent Analyses
              </h2>
              <button
                onClick={() => onNavigate('library')}
                className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="grid gap-3">
              {recentAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => onNavigate('analysis', analysis.id)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      {analysis.title}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {relativeTime(analysis.createdAt)}
                    </p>
                  </div>

                  {analysis.grade && (
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                        {analysis.grade}
                      </div>
                      <svg className="w-5 h-5 text-stone-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Social proof for new users */}
        {isNewUser && dashboardTool === 'analyze' && (
          <div className="mt-8 sm:mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="flex -space-x-2">
                {['👩‍🎓', '👨‍🎓', '👩‍💻'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-lg border-2 border-white dark:border-stone-800"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                <span className="font-semibold text-stone-900 dark:text-stone-100">50,000+</span> students trust WriteScholar
              </p>
            </div>
          </div>
        )}

        {/* Monthly usage — same data as legacy dashboard */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-stone-200/40 dark:border-stone-700/30">
          {loadingUsage ? (
            <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 bg-stone-100/80 dark:bg-stone-800/40 animate-pulse h-28" aria-hidden />
          ) : (
            <div className="p-5 rounded-2xl bg-white/95 dark:bg-stone-900/50 backdrop-blur-sm border border-stone-200/90 dark:border-stone-700/60 shadow-md">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Monthly usage
                </h3>
                <span className="text-xs text-stone-500 dark:text-stone-400 text-right">
                  {getResetsInText(usageStats.daysUntilReset)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {showCombinedUsage ? (
                  <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30 sm:col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">Combined (analyses, study packs, citations)</span>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        usageStats.combinedActionsRemaining === -1
                          ? 'text-lime-600 dark:text-lime-400'
                          : usageStats.combinedActionsRemaining <= 0
                            ? 'text-red-500'
                            : usageStats.combinedActionsRemaining <= 10
                              ? 'text-amber-500'
                              : 'text-stone-800 dark:text-stone-100'
                      }`}
                    >
                      {usageStats.combinedActionsRemaining === -1 ? '∞' : usageStats.combinedActionsRemaining}
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
                      <div
                        className={`text-lg font-bold ${
                          usageStats.analysesRemaining === -1
                            ? 'text-lime-600 dark:text-lime-400'
                            : usageStats.analysesRemaining <= 0
                              ? 'text-red-500'
                              : usageStats.analysesRemaining <= 1
                                ? 'text-amber-500'
                                : 'text-stone-800 dark:text-stone-100'
                        }`}
                      >
                        {usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">📚</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Citations</span>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          usageStats.citationsRemaining === -1
                            ? 'text-lime-600 dark:text-lime-400'
                            : usageStats.citationsRemaining <= 0
                              ? 'text-red-500'
                              : usageStats.citationsRemaining <= 1
                                ? 'text-amber-500'
                                : 'text-stone-800 dark:text-stone-100'
                        }`}
                      >
                        {usageStats.citationsRemaining === -1 ? '∞' : usageStats.citationsRemaining}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-200/50 dark:border-stone-600/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">📦</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Study packs</span>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          usageStats.studyPacksRemaining === -1
                            ? 'text-lime-600 dark:text-lime-400'
                            : usageStats.studyPacksRemaining <= 0
                              ? 'text-red-500'
                              : usageStats.studyPacksRemaining <= 1
                                ? 'text-amber-500'
                                : 'text-stone-800 dark:text-stone-100'
                        }`}
                      >
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
                  <div
                    className={`text-lg font-bold ${
                      usageStats.uploadsRemaining === -1
                        ? 'text-lime-600 dark:text-lime-400'
                        : usageStats.uploadsRemaining <= 0
                          ? 'text-red-500'
                          : usageStats.uploadsRemaining <= 1
                            ? 'text-amber-500'
                            : 'text-stone-800 dark:text-stone-100'
                    }`}
                  >
                    {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining}
                    <span className="text-xs font-normal text-stone-400 ml-0.5">left</span>
                  </div>
                </div>
              </div>
              {usageStats.plan === 'free' && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="text-xs font-medium text-violet-800 dark:text-violet-300 hover:underline"
                  >
                    Upgrade for higher limits →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
