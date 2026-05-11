import { useEffect, useRef, useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { BulletproofAPI } from '../../config/api';
import { trackEvent } from '../../utils/analytics';
import {
  AnalysisPreviewSection,
  StudyPackPreviewSection,
  CitationsPreviewSection,
} from '../common/PreviewSections';

/**
 * Mobile dashboard — the chunky-card design with paste textarea + upload
 * button per tool, restored after a brief detour into embedding full tool
 * pages (which the user did not want).
 *
 * Layout (top to bottom):
 *   1. Greeting + streak chip
 *   2. 2×2 tool grid (with SMARTEST AI / MOST POPULAR badges)
 *   3. Active-tool form card — paste textarea OR daily-review status card,
 *      + primary submit button, + secondary "Or upload" file picker
 *   4. Preview screenshots of what the active tool generates
 *   5. Recent activity (3 items max)
 *   6. Games row (Crater Blast, Word Tower, Word Blitz)
 *   7. Quick tools row (citation gen, pomodoro, GPA, all tools)
 *   8. Upgrade nudge (free users only)
 *   9. Site Footer
 *
 * IMPORTANT note about submit behavior:
 *   Submit currently navigates to the full tool page (with the typed text
 *   pre-filled via localStorage). True inline analysis on the dashboard
 *   would require extracting the desktop dashboard's inline analyze logic
 *   into a reusable component — a 2-3 hour refactor not yet done.
 */

type DashboardTool = 'daily_review' | 'analyze' | 'citations' | 'study_pack' | 'more_tools';

interface RecentItem {
  id: string;
  title: string;
  createdAt: string;
  kind: 'analyze' | 'study_pack' | 'citations' | 'daily_review';
}

interface MobileDashboardProps {
  user: { name?: string; firstName?: string; plan?: string; subscription_plan?: string } | null;
  onNavigate: (page: string, slug?: string) => void;
  onLogout: () => void;
  dashboardTool: DashboardTool;
  setDashboardTool: (tool: DashboardTool) => void;
  recentItems: RecentItem[];
  streakDays: number;
  isNewUser: boolean;
}

/* ─── Tool metadata ───────────────────────────────────────────── */

interface ToolDef {
  id: DashboardTool;
  label: string;
  emoji: string;
  badge?: { text: string; bg: string; color: string };
  accent: string;
  accentBg: string;
  accentBorder: string;
  formTitle: string;
  formSub: string;
  placeholder: string;
  submitLabel: string;
  submitPage: string;
  draftKey: string;
  inputType: 'input' | 'textarea';
}

const TOOLS: ToolDef[] = [
  {
    id: 'analyze',
    label: 'Essay Checker',
    emoji: '📝',
    badge: { text: 'SMARTEST AI', bg: '#FFE8E8', color: '#FF4B4B' },
    accent: '#FF4B4B',
    accentBg: '#FFE8E8',
    accentBorder: '#E04343',
    formTitle: 'Get your essay graded',
    formSub: 'Paste it. Get rubric scores, line-by-line annotations, and a polished revision in 30 seconds.',
    placeholder: 'Paste your essay here...',
    submitLabel: 'Check my essay',
    submitPage: 'analyze',
    draftKey: 'writescholar_analyze_draft',
    inputType: 'textarea',
  },
  {
    id: 'study_pack',
    label: 'Study Pack',
    emoji: '📦',
    badge: { text: 'MOST POPULAR', bg: '#FFF4E0', color: '#FF9600' },
    accent: '#FF9600',
    accentBg: '#FFF4E0',
    accentBorder: '#D97F00',
    formTitle: 'Turn notes into a pack',
    formSub: 'Flashcards, quizzes, and summaries from any notes in 60 seconds.',
    placeholder: 'Paste your lecture notes or textbook chapter...',
    submitLabel: 'Build my pack',
    submitPage: 'study-pack',
    draftKey: 'writescholar_studypack_draft',
    inputType: 'textarea',
  },
  {
    id: 'citations',
    label: 'Citations',
    emoji: '📚',
    accent: '#1CB0F6',
    accentBg: '#DDF4FF',
    accentBorder: '#1899D6',
    formTitle: 'Find sources for your paper',
    formSub: 'Type your topic. Get real, citable sources in APA, MLA, Chicago, and more.',
    placeholder: 'What are you researching?',
    submitLabel: 'Find citations',
    submitPage: 'citations',
    draftKey: 'writescholar_citations_draft',
    inputType: 'input',
  },
  {
    id: 'daily_review',
    label: 'Daily Review',
    emoji: '🎯',
    accent: '#58CC02',
    accentBg: '#E5F8D0',
    accentBorder: '#46A302',
    formTitle: "Today's review is ready",
    formSub: 'Quick practice from your saved notes — 10 questions, 5 minutes.',
    placeholder: '',
    submitLabel: 'Start today',
    submitPage: 'dashboard',
    draftKey: '',
    inputType: 'input',
  },
];

const GAMES = [
  { id: 'crater-blast', label: 'Crater Blast', emoji: '💥', accent: '#FF4B4B', accentBg: '#FFE8E8', page: 'crater-blast' },
  { id: 'word-tower', label: 'Word Tower', emoji: '🗼', accent: '#58CC02', accentBg: '#E5F8D0', page: 'word-tower' },
  { id: 'word-blitz', label: 'Word Blitz', emoji: '⚡', accent: '#FF9600', accentBg: '#FFF4E0', page: 'word-blitz' },
];

const QUICK_TOOLS = [
  { label: 'Citation gen', emoji: '🔖', page: 'citation-generator-tool' },
  { label: 'Pomodoro', emoji: '🍅', page: 'pomodoro-timer' },
  { label: 'GPA calc', emoji: '🎓', page: 'gpa-calculator' },
  { label: 'All tools', emoji: '🧰', page: 'more-tools' },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function getFirstName(user: MobileDashboardProps['user']): string {
  if (!user) return 'there';
  if (user.firstName) return user.firstName;
  if (user.name) return user.name.split(' ')[0];
  return 'there';
}
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}
function kindMeta(kind: RecentItem['kind']) {
  const t = TOOLS.find((x) => x.id === kind);
  if (!t) return { emoji: '📄', accent: '#A560E8', accentBg: '#F3EAFF' };
  return { emoji: t.emoji, accent: t.accent, accentBg: t.accentBg };
}

/* ─── Component ───────────────────────────────────────────────── */

const MobileDashboard = ({
  user,
  onNavigate,
  onLogout,
  dashboardTool,
  setDashboardTool,
  recentItems,
  streakDays,
  isNewUser,
}: MobileDashboardProps) => {
  const activeTool = TOOLS.find((t) => t.id === dashboardTool) ?? TOOLS[0];

  /* Per-tool draft state, persisted to localStorage so the full tool page
     can read it on mount and pre-fill the user's text. Switching tools
     reloads the matching draft. */
  const [draftText, setDraftText] = useState('');
  useEffect(() => {
    if (!activeTool.draftKey) { setDraftText(''); return; }
    try { setDraftText(localStorage.getItem(activeTool.draftKey) ?? ''); } catch { setDraftText(''); }
  }, [activeTool.draftKey]);

  const persistDraft = (val: string) => {
    setDraftText(val);
    if (!activeTool.draftKey) return;
    try { localStorage.setItem(activeTool.draftKey, val); } catch { /* ignore */ }
  };

  /* Inline submission state — drives the AnalysisAnimation popup while the
     API call is in flight. Replaces the v3 "navigate immediately and let
     the next page show loading" pattern. */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitComplete, setSubmitComplete] = useState(false);

  /* File upload state — when the user picks a PDF/DOCX/TXT from the upload
     button, we POST it to /analysis/parse-document inline and fill the
     textarea with the parsed content. No navigation. */
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const analyzeFileInputRef = useRef<HTMLInputElement>(null);
  const studyPackFileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Parse a user-picked file inline on the dashboard. POSTs the file as
   * FormData to /analysis/parse-document (the same endpoint AnalyzeEssayPage
   * uses), receives `{ data: { content } }`, fills the draft textarea.
   * Mirrors AnalyzeEssayPage.processAnalyzeFile exactly.
   */
  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setSubmitError(null);
    setUploadedFileName(file.name);

    // Logged-out users can't parse — bounce to signup like the desktop pages do
    if (!user) {
      onNavigate('signup');
      return;
    }
    const token = (() => {
      try { return localStorage.getItem('authToken'); } catch { return null; }
    })();
    if (!token) {
      onNavigate('login');
      return;
    }

    setIsParsingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await BulletproofAPI.upload('/analysis/parse-document', formData, token);
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.message || `Failed to parse file (${res.status})`);
      }
      const content: string = data?.data?.content || '';
      if (!content.trim()) {
        throw new Error('We could not read any text from that file.');
      }
      persistDraft(content);
      setUploadedFileName(null);
      trackEvent('dashboard_file_parsed', { source: 'mobile_dashboard', tool: activeTool.id });
    } catch (err: any) {
      console.error('[MobileDashboard] File parse error:', err);
      setUploadedFileName(null);
      setSubmitError(err?.message || 'Could not read that file. Try pasting the text instead.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const animationText =
    activeTool.id === 'analyze' ? 'Analyzing your essay' :
    activeTool.id === 'study_pack' ? 'Building your study pack' :
    activeTool.id === 'citations' ? 'Finding citations' :
    'Loading';

  /**
   * Run the active tool's API call from the dashboard with the same
   * bulletproof retry mechanics the desktop tool pages use:
   *   - BulletproofAPI.post: 6 retries + exponential backoff + 30s timeout
   *     per attempt + automatic 429 backoff
   *   - Auth checks that match StudyPackPage / CitationsPage exactly
   *   - Body shapes copied verbatim from the desktop page handlers
   *   - Viewer chunk preload so the results page loads instantly
   *   - sessionStorage backup of the input so the viewer can reread it
   *   - trackEvent calls so funnel analytics see the mobile path
   *
   * For analyze, the actual analyze API runs on AnalysisPage itself
   * (it needs citation/grading style picks). Mobile saves the text and
   * navigates with a loading animation so the user knows the tap registered.
   */
  const handleSubmit = async () => {
    setSubmitError(null);

    if (activeTool.id === 'daily_review') {
      setDashboardTool('daily_review');
      return;
    }

    // ────────── ANALYZE ──────────
    // Defer to AnalysisPage (it owns the analyze API + the full results UI).
    // Mobile shows a brief loading animation so the tap visibly registers.
    if (activeTool.id === 'analyze') {
      const wc = draftText.trim().split(/\s+/).filter(Boolean).length;
      if (wc < 50) {
        setSubmitError('Please paste at least 50 words to analyze.');
        return;
      }
      setIsSubmitting(true);
      try { localStorage.setItem('textAnalysisContent', draftText); } catch { /* ignore */ }
      trackEvent('dashboard_analyze_text_start', { source: 'mobile_dashboard' });
      // Pre-warm the analysis page chunk so the navigation feels instant
      import('./AnalysisPage').catch(() => { /* ignore preload failure */ });
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitComplete(true);
      }, 900);
      setTimeout(() => {
        setSubmitComplete(false);
        onNavigate('analysis');
      }, 1500);
      return;
    }

    // ────────── AUTH ──────────
    // Match the desktop page handlers exactly: prompt login if not signed in.
    const token = (() => {
      try { return localStorage.getItem('authToken'); } catch { return null; }
    })();
    if (!user) {
      onNavigate('signup');
      return;
    }
    if (!token) {
      onNavigate('login');
      return;
    }

    // ────────── CITATIONS ──────────
    // Mirror of CitationsPage.handleSubmit. Same body shape, same success
    // handling. Now uses BulletproofAPI.post for retry resilience.
    if (activeTool.id === 'citations') {
      if (!draftText.trim()) {
        setSubmitError('Please enter a research topic.');
        return;
      }
      setIsSubmitting(true);
      // Pre-warm the citation-results chunk so it appears instantly on success
      import('./CitationResultsPage').catch(() => { /* ignore */ });
      // Backup the typed topic in sessionStorage so the results page can
      // re-render the user's original query if needed
      try { sessionStorage.setItem('writescholar_citations_draft', draftText); } catch { /* ignore */ }
      try {
        const res = await BulletproofAPI.post(
          '/analysis/citation-search',
          {
            researchTopic: draftText,
            citationStyle: 'APA',
            numberOfCitations: 10,
            minYear: null,
            yearRange: 'all',
          },
          token
        );
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          throw new Error(data?.message || `Citation search failed (${res.status})`);
        }
        if (!data?.success || !data?.data) {
          throw new Error(data?.message || 'No citation results received');
        }
        try { localStorage.setItem('citationSearchResults', JSON.stringify(data.data)); } catch { /* ignore */ }
        trackEvent('dashboard_citations_success', { source: 'mobile_dashboard' });
        setSubmitComplete(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setSubmitComplete(false);
          onNavigate('citation-results');
        }, 700);
      } catch (err: any) {
        console.error('[MobileDashboard] Citations error:', err);
        trackEvent('dashboard_citations_error', { source: 'mobile_dashboard', message: err?.message || 'unknown' });
        setIsSubmitting(false);
        setSubmitError(err?.message || 'Could not find citations. Please try again.');
      }
      return;
    }

    // ────────── STUDY PACK ──────────
    // Mirror of StudyPackPage.handleGenerateStudyPack. Body shape is { text }
    // (NOT { content, sourceType } — that was the v5 bug that caused the
    // "Load failed" error). Now uses BulletproofAPI.post for retry resilience.
    if (activeTool.id === 'study_pack') {
      const wc = draftText.trim().split(/\s+/).filter(Boolean).length;
      if (wc < 50) {
        setSubmitError('Paste at least 50 words of notes to build a pack.');
        return;
      }
      setIsSubmitting(true);
      // Pre-warm the viewer chunk so the navigation feels instant
      import('./StudyPackViewerPage').catch(() => { /* ignore */ });
      // Backup input for the viewer to re-read if needed
      try { sessionStorage.setItem('writescholar_dashboard_draft', draftText); } catch { /* ignore */ }
      try {
        const res = await BulletproofAPI.post(
          '/analysis/generate-study-pack',
          { text: draftText },
          token
        );
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          throw new Error(data?.message || `Study pack failed (${res.status})`);
        }
        const packTitle =
          data?.data?.quiz?.title ||
          data?.data?.flashcards?.title ||
          data?.data?.lesson?.title ||
          'Study Pack';
        trackEvent('dashboard_study_pack_success', { source: 'mobile_dashboard' });
        setSubmitComplete(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setSubmitComplete(false);
          (onNavigate as any)('study-pack-viewer', undefined, { studyPack: { data: data.data, title: packTitle } });
        }, 700);
      } catch (err: any) {
        console.error('[MobileDashboard] Study pack error:', err);
        trackEvent('dashboard_study_pack_error', { source: 'mobile_dashboard', message: err?.message || 'unknown' });
        setIsSubmitting(false);
        setSubmitError(err?.message || 'Could not build study pack. Please try again.');
      }
      return;
    }
  };

  const subtitle = isNewUser
    ? "Let's start with your first essay."
    : streakDays > 0
      ? `Day ${streakDays} of your streak. Keep going.`
      : "Let's turn that B into an A.";

  const formCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = formCardRef.current;
    if (!el) return;
    el.classList.remove('opacity-0', 'translate-y-2');
    el.classList.add('opacity-100', 'translate-y-0');
  }, [dashboardTool]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} currentPage="dashboard" />

      <main className="flex-1 px-5 pt-4 pb-24 max-w-md mx-auto w-full">
        {/* ── Greeting block ──────────────────────────────────── */}
        <header className="mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15]">
            {getFirstName(user)} 👋
          </h1>
          <p className="mt-1 text-[14px] text-stone-600 dark:text-stone-400 font-medium leading-snug">
            {subtitle}
          </p>

          {streakDays > 0 && (
            <button
              type="button"
              onClick={() => setDashboardTool('daily_review')}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF4E0] dark:bg-[#FF9600]/15 border-2 border-[#FF9600]/40 hover:border-[#FF9600] transition-colors"
              aria-label={`${streakDays} day streak — open daily review`}
            >
              <span className="text-sm" aria-hidden>🔥</span>
              <span className="text-[12px] font-extrabold text-[#FF9600] tabular-nums">{streakDays}</span>
              <span className="text-[11px] font-bold text-[#FF9600]">day streak</span>
            </button>
          )}
        </header>

        {/* ── TOOL GRID 2×2 with badges ───────────────────────── */}
        <section className="mb-5">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Your tools
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map((tool) => {
              const isActive = tool.id === dashboardTool;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setDashboardTool(tool.id)}
                  className={`relative rounded-2xl border-2 border-b-4 px-3.5 py-4 text-left transition-all active:translate-y-0.5 active:border-b-2 ${
                    isActive ? 'bg-white dark:bg-stone-900 shadow-md' : 'bg-white dark:bg-stone-900'
                  }`}
                  style={{ borderColor: isActive ? tool.accent : '#E5E5E5' }}
                >
                  {tool.badge && (
                    <span
                      className="absolute -top-2 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap"
                      style={{
                        backgroundColor: tool.badge.bg,
                        color: tool.badge.color,
                        border: `2px solid ${tool.badge.color}`,
                      }}
                    >
                      {tool.badge.text}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="absolute top-3 right-3 w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool.accent }}
                      aria-hidden
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] mb-2"
                    style={{ backgroundColor: tool.accentBg }}
                    aria-hidden
                  >
                    {tool.emoji}
                  </div>
                  <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[13px] leading-tight">
                    {tool.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── ACTIVE TOOL FORM CARD ───────────────────────────── */}
        <div
          ref={formCardRef}
          className="relative mb-7 rounded-[24px] overflow-hidden border-2 border-b-4 transition-all duration-300 ease-out opacity-0 translate-y-2"
          style={{ backgroundColor: 'white', borderColor: activeTool.accent }}
        >
          <div className="h-1.5 w-full" style={{ backgroundColor: activeTool.accent }} aria-hidden />

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
                style={{ backgroundColor: activeTool.accentBg }}
                aria-hidden
              >
                {activeTool.emoji}
              </div>
              <h2 className="text-[18px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-tight flex-1">
                {activeTool.formTitle}
              </h2>
            </div>
            <p className="text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed mb-4 font-medium">
              {activeTool.formSub}
            </p>

            {/* Tool-specific input */}
            {activeTool.id === 'daily_review' ? (
              <div
                className="rounded-2xl p-4 mb-4 text-center border-2 border-dashed"
                style={{ backgroundColor: activeTool.accentBg, borderColor: activeTool.accent }}
              >
                <div className="text-2xl mb-1" aria-hidden>📚</div>
                <div className="text-[14px] font-extrabold text-stone-900 dark:text-stone-50 mb-0.5">
                  10 questions ready
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-bold">
                  Built from your saved notes
                </div>
              </div>
            ) : activeTool.inputType === 'input' ? (
              <input
                type="text"
                value={draftText}
                onChange={(e) => persistDraft(e.target.value)}
                placeholder={activeTool.placeholder}
                className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-[14px] font-medium text-stone-900 dark:text-stone-50 focus:outline-none focus:border-stone-400 mb-4"
                style={{ borderColor: draftText ? activeTool.accent : undefined }}
              />
            ) : (
              <textarea
                value={draftText}
                onChange={(e) => persistDraft(e.target.value)}
                placeholder={activeTool.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-[14px] font-medium text-stone-900 dark:text-stone-50 focus:outline-none focus:border-stone-400 mb-3 resize-none leading-relaxed"
                style={{ borderColor: draftText ? activeTool.accent : undefined }}
              />
            )}

            {/* Word count + Clear button row — only when there's text.
                Clear wipes both the in-memory draft and the localStorage
                backup so reopening the tool starts fresh. */}
            {activeTool.inputType === 'textarea' && draftText.trim().length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    persistDraft('');
                    setUploadedFileName(null);
                    setSubmitError(null);
                  }}
                  className="text-[12px] font-extrabold uppercase tracking-wider text-stone-500 hover:text-red-500 active:text-red-600 transition-colors inline-flex items-center gap-1"
                  aria-label="Clear text"
                >
                  <span aria-hidden>✕</span> Clear
                </button>
                <span className="text-[11px] text-stone-400 font-bold tabular-nums">
                  {draftText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            )}

            {submitError && (
              <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/40 text-[13px] font-bold text-red-700 dark:text-red-300">
                {submitError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-extrabold text-white text-[15px] border-2 border-b-4 transition-transform active:translate-y-0.5 active:border-b-2 disabled:opacity-70 disabled:cursor-wait"
              style={{ backgroundColor: activeTool.accent, borderColor: activeTool.accentBorder }}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                  Working…
                </>
              ) : (
                <>
                  {activeTool.submitLabel}
                  <span className="text-base" aria-hidden>→</span>
                </>
              )}
            </button>

            {/* Inline file upload — for essay + study pack. Clicking the
                visible button triggers the hidden <input type="file">,
                which POSTs to /analysis/parse-document via BulletproofAPI
                and fills the draft textarea with the parsed content.
                NO navigation — everything happens on the dashboard, just
                like desktop does. */}
            {(activeTool.id === 'analyze' || activeTool.id === 'study_pack') && (
              <>
                <input
                  ref={activeTool.id === 'analyze' ? analyzeFileInputRef : studyPackFileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = ''; // reset so the same file can be re-picked
                    void handleFileSelected(f);
                  }}
                />
                <button
                  type="button"
                  disabled={isParsingFile}
                  onClick={() => {
                    if (activeTool.id === 'analyze') analyzeFileInputRef.current?.click();
                    else studyPackFileInputRef.current?.click();
                  }}
                  className="w-full mt-2.5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 text-[14px] border-2 border-b-4 border-stone-200 dark:border-stone-700 active:translate-y-0.5 active:border-b-2 transition-transform disabled:opacity-70 disabled:cursor-wait"
                >
                  {isParsingFile ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" aria-hidden />
                      Reading {uploadedFileName ? `"${uploadedFileName}"` : 'your file'}…
                    </>
                  ) : (
                    <>
                      <span aria-hidden>📎</span>
                      {activeTool.id === 'analyze' ? 'Or upload your essay' : 'Or upload your notes'}
                    </>
                  )}
                </button>
                <p className="mt-2 text-[11px] text-center text-stone-500 font-bold">
                  PDF, DOCX, or TXT · parsed inline on the dashboard
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── PREVIEW SCREENSHOTS — real product output ───────── */}
        {activeTool.id === 'analyze' && <div className="mb-7"><AnalysisPreviewSection embedded /></div>}
        {activeTool.id === 'study_pack' && <div className="mb-7"><StudyPackPreviewSection embedded /></div>}
        {activeTool.id === 'citations' && <div className="mb-7"><CitationsPreviewSection embedded /></div>}

        {/* ── RECENT ACTIVITY ───────────────────────────────────
            Shows the 3 most-recent items across ALL tool types
            (analyze / study pack / citations / daily review) — the
            underlying `recentItems` array is already a unified,
            sorted list from DashboardPageNew's mobileRecentItems
            mapper. Full history is one tap away via View all. */}
        {recentItems.length > 0 && (
          <section className="mb-7">
            <div className="flex items-center justify-between mb-3 pl-1">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Recent</h3>
              <button type="button" onClick={() => onNavigate('library')} className="text-[11px] font-extrabold text-[#A560E8]">
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {recentItems.slice(0, 3).map((item) => {
                const meta = kindMeta(item.kind);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.kind === 'analyze') onNavigate('analysis', item.id);
                      else onNavigate('library');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-800 hover:border-stone-300 transition-all active:translate-y-0.5 active:border-b-2 text-left"
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[16px]"
                      style={{ backgroundColor: meta.accentBg }}
                      aria-hidden
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[13px] truncate">{item.title}</div>
                      <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">{timeAgo(item.createdAt)}</div>
                    </div>
                    <span className="flex-shrink-0 text-stone-400 text-base" aria-hidden>→</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── GAMES ROW ───────────────────────────────────────── */}
        <section className="mb-7">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Quick games
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onNavigate(g.page)}
                className="rounded-2xl border-2 border-b-4 px-2 py-3.5 text-center transition-all active:translate-y-0.5 active:border-b-2 bg-white dark:bg-stone-900"
                style={{ borderColor: g.accent }}
              >
                <div
                  className="w-9 h-9 mx-auto mb-1.5 rounded-xl flex items-center justify-center text-[18px]"
                  style={{ backgroundColor: g.accentBg }}
                  aria-hidden
                >
                  {g.emoji}
                </div>
                <div className="font-extrabold text-stone-900 dark:text-stone-50 text-[11.5px] leading-tight">
                  {g.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── QUICK TOOLS ROW ─────────────────────────────────── */}
        <section className="mb-7">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 mb-3 pl-1">
            Quick tools
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_TOOLS.map((q) => (
              <button
                key={q.page}
                type="button"
                onClick={() => onNavigate(q.page)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-b-2 border-stone-200 dark:border-stone-800 active:translate-y-0.5 transition-transform"
              >
                <span className="text-[20px]" aria-hidden>{q.emoji}</span>
                <span className="text-[10.5px] font-extrabold text-stone-700 dark:text-stone-300 leading-tight text-center">
                  {q.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── UPGRADE NUDGE ───────────────────────────────────── */}
        {user && (user.plan || user.subscription_plan || 'free').toLowerCase() === 'free' && (
          <section className="rounded-2xl bg-gradient-to-br from-[#A560E8] to-[#8A48C7] border-2 border-b-4 border-[#8A48C7] p-5 text-white">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl" aria-hidden>⭐</span>
              <div>
                <h3 className="font-extrabold text-[15px] mb-1">Try 7 days free</h3>
                <p className="text-[12.5px] opacity-90 leading-relaxed">
                  Unlock unlimited essay checks, study packs, and citations. Cancel anytime.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="w-full bg-white text-[#A560E8] font-extrabold py-3 rounded-xl border-2 border-b-4 border-white/80 active:border-b-2 active:translate-y-0.5 transition-transform text-[14px]"
            >
              Start free trial
            </button>
          </section>
        )}
      </main>

      <Footer onNavigate={onNavigate} />

      {/* Full-screen loading popup while the API call is in flight. Same
          component the desktop dashboard + tool pages use, so the loading
          experience feels consistent across surfaces. */}
      {(isSubmitting || submitComplete) && (
        <AnalysisAnimation
          isPopup
          text={animationText}
          isComplete={submitComplete}
          onComplete={() => { /* nav handled inline by handleSubmit's timeouts */ }}
        />
      )}
    </div>
  );
};

export default MobileDashboard;
