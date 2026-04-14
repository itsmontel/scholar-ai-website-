import { useState, useEffect, useRef } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import LoadingSpinner from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';
import { getResetsInText } from '../../utils/usageReset';

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
  onNavigate: (page: string, slug?: string) => void;
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

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20">
        {/* Greeting + tool switcher (cards like landing reference) */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-shrink-0 lg:max-w-[min(100%,20rem)]">
            <h1
              className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            {isFree && (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto lg:max-w-[28rem] xl:max-w-[32rem] lg:flex-shrink-0">
            {(
              [
                {
                  id: 'analyze' as const,
                  title: 'Analyze',
                  desc: 'Professor-style feedback on your essays',
                  emoji: '📝',
                  iconClass: 'bg-gradient-to-br from-rose-400 to-violet-600',
                  activeRing: 'ring-2 ring-rose-400/80 border-rose-300 dark:border-rose-600',
                },
                {
                  id: 'citations' as const,
                  title: 'Citations',
                  desc: 'Find and format academic sources',
                  emoji: '📚',
                  iconClass: 'bg-gradient-to-br from-sky-400 to-blue-600',
                  activeRing: 'ring-2 ring-sky-400/80 border-sky-300 dark:border-sky-600',
                },
                {
                  id: 'study_pack' as const,
                  title: 'Study Pack',
                  desc: 'Quiz, flashcards & lesson from notes',
                  emoji: '📦',
                  iconClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
                  activeRing: 'ring-2 ring-amber-400/80 border-amber-300 dark:border-amber-600',
                },
                {
                  id: 'more_tools' as const,
                  title: 'More tools',
                  desc: 'Library, upload & extra utilities',
                  emoji: '🔧',
                  iconClass: 'bg-gradient-to-br from-slate-400 to-stone-600',
                  activeRing: 'ring-2 ring-slate-400/80 border-slate-300 dark:border-slate-600',
                },
              ] as const
            ).map((item) => {
              const active = dashboardTool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDashboardTool(item.id);
                    trackEvent('dashboard_tool_tab', { tool: item.id });
                  }}
                  className={`relative text-left rounded-2xl border bg-white dark:bg-stone-900/70 p-3 sm:p-3.5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    active ? item.activeRing : 'border-stone-200/90 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute -top-1 -right-1 h-10 w-10 rounded-full opacity-[0.12] blur-xl ${
                      item.id === 'analyze'
                        ? 'bg-rose-500'
                        : item.id === 'citations'
                          ? 'bg-sky-500'
                          : item.id === 'study_pack'
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                    }`}
                    aria-hidden
                  />
                  <div className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-lg shadow-sm ${item.iconClass}`}>
                    <span aria-hidden>{item.emoji}</span>
                  </div>
                  <p
                    className={`mt-2 text-sm font-bold leading-tight ${
                      item.id === 'analyze'
                        ? 'text-rose-950 dark:text-rose-100'
                        : item.id === 'citations'
                          ? 'text-sky-900 dark:text-sky-100'
                          : item.id === 'study_pack'
                            ? 'text-amber-950 dark:text-amber-100'
                            : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* === ANALYZE: HERO UPLOAD === */}
        {dashboardTool === 'analyze' && (
        <div className="relative">
          {/* Main upload card */}
          <div
            className={`relative rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
              dropActive
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 shadow-2xl shadow-violet-500/25'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/80 shadow-xl shadow-stone-900/5 dark:shadow-black/20'
            }`}
          >
            {/* Gradient accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

            <div className="p-6 sm:p-10">
              {/* Value proposition header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {isNewUser ? 'Get started in 30 seconds' : 'Ready for your next analysis'}
                </div>

                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight mb-4"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  {isNewUser ? (
                    <>Get <span className="text-violet-600 dark:text-violet-400">professor-style feedback</span> on your essay</>
                  ) : (
                    <>Upload your <span className="text-violet-600 dark:text-violet-400">next essay</span></>
                  )}
                </h2>

                <p className="text-stone-600 dark:text-stone-400 text-lg max-w-2xl mx-auto">
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
                className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
                  dropActive
                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/30'
                    : 'border-violet-300 dark:border-violet-700 bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-stone-900 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
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
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">or paste your text</span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </div>

              {/* Text input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your essay here (minimum 200 words)..."
                  className="w-full min-h-[180px] p-5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-base leading-relaxed"
                />

                <div className="absolute bottom-4 left-5 text-sm text-stone-400 dark:text-stone-500">
                  {getWordCount(inputText)} words
                  {getWordCount(inputText) > 0 && getWordCount(inputText) < 200 && (
                    <span className="text-amber-600 dark:text-amber-400"> · {200 - getWordCount(inputText)} more needed</span>
                  )}
                </div>
              </div>

              {/* Analyze button */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                  {inputText.trim() && (
                    <button
                      onClick={() => setInputText('')}
                      className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                    >
                      Clear text
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAnalyzeText}
                  disabled={!isTextValid}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                    isTextValid
                      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 hover:-translate-y-0.5 active:translate-y-0'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Analyze My Essay
                </button>
              </div>
            </div>
          </div>

          {/* What you'll get - shown for new users */}
          {isNewUser && (
            <div className="mt-10 grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Rubric Scoring</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">See your grade estimate with category breakdowns</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Line-by-Line Notes</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">Highlights on what's strong and what needs work</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Revision Suggestions</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">Concrete fixes you can apply right away</p>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Citations / Study pack / More tools — compact panels (full flows on dedicated pages) */}
        {dashboardTool === 'citations' && (
          <div className="rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/80 shadow-xl overflow-hidden mb-8">
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-blue-600" />
            <div className="p-6 sm:p-10 text-center max-w-xl mx-auto">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-3xl shadow-lg mb-4">📚</div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Find academic sources
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-6">
                Search peer-reviewed papers and get formatted citations in APA, MLA, Chicago, and more.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('citations')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg shadow-sky-900/20 transition-all"
              >
                Open Citations
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        )}

        {dashboardTool === 'study_pack' && (
          <div className="rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/80 shadow-xl overflow-hidden mb-8">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="p-6 sm:p-10 text-center max-w-xl mx-auto">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Study Pack
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-6">
                Turn notes or readings into quizzes, flashcards, crosswords, and a lesson — all in one go.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('study-pack')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-900/20 transition-all"
              >
                Open Study Pack
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        )}

        {dashboardTool === 'more_tools' && (
          <div className="rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/80 shadow-xl overflow-hidden mb-8">
            <div className="h-1 w-full bg-gradient-to-r from-slate-500 to-stone-600" />
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-4 text-center" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                More tools
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  { label: 'Library', desc: 'All your documents & analyses', page: 'library' as const, emoji: '📁' },
                  { label: 'Upload', desc: 'Add files to your library', page: 'upload' as const, emoji: '⬆️' },
                  { label: 'Saved materials', desc: 'Quizzes, flashcards & more', page: 'more-tools' as const, emoji: '✨' },
                  { label: 'Analyze (full page)', desc: 'Dedicated analysis workspace', page: 'analyze' as const, emoji: '📝' },
                ].map((row) => (
                  <button
                    key={row.page}
                    type="button"
                    onClick={() => onNavigate(row.page)}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/50 p-4 text-left hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all"
                  >
                    <span className="text-2xl" aria-hidden>{row.emoji}</span>
                    <span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 block">{row.label}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">{row.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent analyses - shown for returning users */}
        {!isNewUser && recentAnalyses.length > 0 && dashboardTool === 'analyze' && (
          <div className="mt-12">
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
          <div className="mt-16 text-center">
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
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-200/40 dark:border-stone-700/30">
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
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
