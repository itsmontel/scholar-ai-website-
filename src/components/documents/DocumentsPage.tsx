import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WriteEditor, { exportHtmlAsDocx } from '../write/WriteEditor';
import mammoth from 'mammoth';
import AnalyzerPanel, { type AnalyzerResult } from './AnalyzerPanel';
import type { AnnotatorAnnotation } from './analyzerExtension';
import { applyAnnotationRevision, revertAnnotationRevision } from './analyzerExtension';
import type { Editor } from '@tiptap/react';
import DailyReviewTab from '../pages/DailyReviewTab';
import CitationsPanel from './panels/CitationsPanel';
import StudyPacksPanel from './panels/StudyPacksPanel';
import GamesPanel from './panels/GamesPanel';
import PreviewStrip from './panels/PreviewStrip';
import { FREE_EDITOR_WORD_LIMIT } from '../../config/featureFlags';

/* ═══════════════════════════════════════════════════════════════
   DocumentsPage — unified hub for everything in /documents.
   Replaces three separate surfaces (Library, Upload, Write) with
   one mental model: "your documents."

   HUB view
     • Search by title / original filename
     • Filter chips:    All  ·  Drafts  ·  Uploads  ·  Analyzed
     • Sort: most-recently-edited first
     • Top-right CTAs: + New document   ·   Upload .docx
     • Per-row actions (hover or always on touch):
         - Open (default click) → editor view
         - Analyze              → existing /analysis flow
         - Download             → server-side blob fetch
         - Delete               → confirm modal

   EDITOR view
     • Title input + WriteEditor with autosave (3s debounce)
     • Save-status pill (idle / saving / saved / error)
     • "Analyze" button (Phase-2 will wire it to inline annotations)

   Routing handled by parent:
     /documents          → hub
     /documents/:id      → editor for that doc (handled via prop)
     /library /upload /write → redirect to /documents (in
                              CompleteAcademicAIApp.getPageFromPath)
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type DocSummary = {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  wordCount: number;
  pageCount: number;
  uploadStatus: string;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
  /** Derived: did the user open + edit this in the editor? */
  isDraft: boolean;
  /** Derived: was this uploaded from a file (vs. typed in-app)? */
  isUpload: boolean;
};

type DocFull = DocSummary & {
  contentHtml: string | null;
  contentText: string | null;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type FilterKey = 'all' | 'drafts' | 'uploads' | 'analyzed';

/* The whole product is now one page. The left rail swaps the main
   area between these views — no route changes, no page jumps. The
   editor is the only view that hides the rail (it needs the width
   + a distraction-free surface). */
type WorkspaceView =
  | 'hub'
  | 'editor'
  | 'analyze'
  | 'daily-review'
  | 'study-packs'
  | 'citations'
  | 'games';

interface DocumentsPageProps {
  /** Optional: open this doc immediately on mount. */
  initialDocumentId?: string;
  /** Caller-provided — used for the few flows that still leave the
      workspace (pricing upgrade, full report, auth redirects). */
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  /** Logged-in user — threaded into the embedded tools (Daily
      Review streak key, plan-gating, etc.). */
  user?: Record<string, unknown> | null;
  /** Fires when the workspace enters/leaves the full-screen editor.
      The shell uses this to hide the global site header (and free up
      vertical space) while a document is open. */
  onEditorActiveChange?: (active: boolean) => void;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Time-of-day greeting, so the hub feels like it knows you. */
function greetingFor(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Friendly date label, e.g. "Friday, 16 May". */
function todayLabel(d = new Date()): string {
  try {
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

/** Best-effort first name from the loosely-typed user object. */
function firstNameOf(user: Record<string, unknown> | null | undefined): string {
  if (!user) return '';
  const fn = typeof user.firstName === 'string' ? user.firstName.trim() : '';
  if (fn) return fn.split(/\s+/)[0];
  const n = typeof user.name === 'string' ? user.name.trim() : '';
  if (n && !n.includes('@')) return n.split(/\s+/)[0];
  const un = typeof user.username === 'string' ? user.username.trim() : '';
  return un;
}

/** Paid = pro / premium / focus. Free users get the capped editor. */
function isPaidPlan(user: Record<string, unknown> | null | undefined): boolean {
  const p = String((user?.plan ?? user?.subscriptionPlan ?? 'free') as string).toLowerCase();
  return p === 'pro' || p === 'premium' || p === 'focus';
}

/* ─── Tiny inline icons (kept local — avoids component thrash) ─── */
const I = {
  Doc: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>),
  Plus: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" /></svg>),
  Upload: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>),
  Search: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.5-4.5" /></svg>),
  Sparkle: () => (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.6 4.9L18 9l-4.4 2.1L12 16l-1.6-4.9L6 9l4.4-2.1z"/></svg>),
  Download: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>),
  Trash: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>),
  ArrowR: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>),
  ArrowL: () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>),
  Review: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
  Pack: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5L21 12M3 16.5L12 21l9-4.5" /></svg>),
  Cite: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" /></svg>),
  Game: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 11h4m-2-2v4m6-3h.01M17 13h.01M7.5 6h9a4.5 4.5 0 014.47 5l-.9 6.3A2.5 2.5 0 0117.6 19.5c-1 0-1.9-.6-2.3-1.5l-.5-1a2 2 0 00-1.8-1.1h-1.9a2 2 0 00-1.8 1.1l-.5 1c-.4.9-1.3 1.5-2.3 1.5a2.5 2.5 0 01-2.47-2.2l-.9-6.3A4.5 4.5 0 017.5 6z" /></svg>),
};

/* ─── Workspace sidebar ──────────────────────────────────────
   The single navigation surface for the whole product. Clicking an
   item swaps the in-page view — it never leaves the page, so the
   workspace always feels like one app. Documents is the home base;
   every study tool lives one click away in the same shell. */
const SIDEBAR_TOOLS: { view: WorkspaceView; label: string; icon: React.ReactNode; hint: string }[] = [
  { view: 'analyze',      label: 'Analyze',      icon: <I.Sparkle />, hint: 'Professor-style feedback' },
  { view: 'daily-review', label: 'Daily review', icon: <I.Review />,  hint: 'Quick recall session' },
  { view: 'study-packs',  label: 'Study packs',  icon: <I.Pack />,    hint: 'Notes → lessons & quizzes' },
  { view: 'citations',    label: 'Citations',    icon: <I.Cite />,    hint: 'Find & format sources' },
  { view: 'games',        label: 'Games',        icon: <I.Game />,    hint: 'Learn by playing' },
];

function WorkspaceSidebar({
  activeView,
  onSelect,
  headerless = false,
  collapsed = false,
  onToggle,
  usage,
  onUpgrade,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  /** When the global header is hidden (editor view) the rail pins to
   *  the viewport top and fills the full height instead of sitting
   *  below the header. */
  headerless?: boolean;
  /** Collapsed = slim icon-only rail (more width for the paper). */
  collapsed?: boolean;
  /** Toggle collapsed ⇄ expanded. When omitted the rail is static. */
  onToggle?: () => void;
  /** Plan/usage for the footer CTA (pinned to the bottom of the rail).
      Replaces the old standalone right rail. */
  usage?: { used: number; limit: number | null; plan: string } | null;
  onUpgrade?: () => void;
}) {
  // The editor is a doc context — keep "Documents" lit while in it.
  const docsActive = activeView === 'hub' || activeView === 'editor';
  const Item = ({
    active,
    icon,
    label,
    hint,
    onClick,
  }: { active: boolean; icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={`group w-full flex items-center rounded-2xl text-left transition-all ${
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5'
      } ${
        active
          ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] border-2 border-[#A560E8]/25'
          : 'text-stone-600 dark:text-stone-300 border-2 border-transparent hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-[#8A48C7] dark:hover:text-[#C9A0F0]'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-[#A560E8]' : 'text-stone-400 group-hover:text-[#A560E8]'} transition-colors`}>{icon}</span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-[13px] font-extrabold leading-tight">{label}</span>
          {hint && <span className="block text-[10.5px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">{hint}</span>}
        </span>
      )}
      {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#A560E8] shrink-0" aria-hidden />}
    </button>
  );
  return (
    <aside className={`hidden lg:flex lg:flex-col shrink-0 self-stretch sticky overflow-y-auto border-r-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-5 transition-[width] duration-200 ${collapsed ? 'w-[60px] px-2 items-center' : 'w-[208px] px-3'} ${headerless ? 'top-0 h-dvh' : 'top-[3.5rem] sm:top-[4.25rem] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4.25rem)]'}`}>
      {/* Collapse / expand toggle */}
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mb-3 inline-flex items-center justify-center h-8 rounded-xl border-2 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-[#8A48C7] transition-all ${collapsed ? 'w-9' : 'w-9 self-end'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
          </svg>
        </button>
      )}
      {!collapsed && <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Workspace</p>}
      <Item active={docsActive} icon={<I.Doc />} label="Documents" hint="Write, edit & analyze" onClick={() => onSelect('hub')} />
      {!collapsed && <p className="px-3 pt-5 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Study tools</p>}
      <div className={`flex flex-col gap-0.5 w-full ${collapsed ? 'mt-2' : ''}`}>
        {SIDEBAR_TOOLS.map((t) => (
          <Item key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} hint={t.hint} onClick={() => onSelect(t.view)} />
        ))}
      </div>
      {!collapsed && usage && (
        <div className="mt-auto">
          <div className="mx-3 mb-4 mt-6 border-t border-stone-200 dark:border-stone-800" />
          <div className="px-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">{usage.plan} plan</span>
              {usage.limit != null && (
                <span className="text-[11px] font-extrabold tabular-nums text-stone-500 dark:text-stone-400">{usage.used}/{usage.limit}</span>
              )}
            </div>
            {usage.limit != null && (
              <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#A560E8] to-[#8A48C7]"
                  style={{ width: `${Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100))}%` }}
                />
              </div>
            )}
            <p className="text-[11px] font-bold text-stone-400 leading-snug mb-3">
              {usage.plan === 'Free' ? 'More documents, analyses and study tools on Pro.' : 'Thanks for being on a paid plan.'}
            </p>
            {usage.plan === 'Free' && onUpgrade && (
              <button
                type="button"
                onClick={onUpgrade}
                className="w-full py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─── Mobile workspace nav ───────────────────────────────────
   The desktop rail is `hidden lg:flex`, which left phone users with
   NO way to reach Analyze / Daily review / Study packs / Citations
   / Games. This is a floating menu button (lg:hidden) + slide-in
   drawer so the whole workspace is reachable on mobile too. Fixed
   positioning keeps it independent of the editor/hub layout. */
function WorkspaceMobileNav({
  activeView,
  onSelect,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const docsActive = activeView === 'hub' || activeView === 'editor';
  const pick = (v: WorkspaceView) => { setOpen(false); onSelect(v); };
  const Row = ({ active, icon, label, hint, onClick }: { active: boolean; icon: React.ReactNode; label: string; hint: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all border-2 ${
        active
          ? 'bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] border-[#A560E8]/25'
          : 'text-stone-600 dark:text-stone-300 border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-[#A560E8]' : 'text-stone-400'}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold leading-tight">{label}</span>
        <span className="block text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-tight mt-0.5 truncate">{hint}</span>
      </span>
    </button>
  );
  return (
    <div className="lg:hidden">
      {/* Floating menu button — bottom-left, thumb-reachable, never
          collides with the editor toolbar (which sits up top). */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open workspace menu"
          className="fixed bottom-4 left-4 z-[55] inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#A560E8] text-white border-2 border-b-4 border-[#7733B5] shadow-[0_14px_30px_-10px_rgba(165,96,232,0.6)] active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[80vw] max-w-[300px] bg-white dark:bg-stone-900 border-r-2 border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-stone-200/80 dark:border-stone-700 bg-white shrink-0">
                  <img src="/main-logo.png" alt="" aria-hidden className="w-full h-full object-contain" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-[#A560E8]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>WriteScholar</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="px-1 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Workspace</p>
            <Row active={docsActive} icon={<I.Doc />} label="Documents" hint="Write, edit & analyze" onClick={() => pick('hub')} />
            <p className="px-1 pt-4 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Study tools</p>
            <div className="flex flex-col gap-1">
              {SIDEBAR_TOOLS.map((t) => (
                <Row key={t.view} active={activeView === t.view} icon={t.icon} label={t.label} hint={t.hint} onClick={() => pick(t.view)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Workspace shell ────────────────────────────────────────
   Wraps every non-editor view with the persistent sidebar so the
   product reads as one continuous surface. The active panel is
   passed as children. */
function WorkspaceShell({
  activeView,
  onSelect,
  children,
  bare = false,
  headerless = false,
  collapsed = false,
  onToggle,
  usage,
  onUpgrade,
}: {
  activeView: WorkspaceView;
  onSelect: (v: WorkspaceView) => void;
  children: React.ReactNode;
  /** Editor view manages its own width/padding — skip the content
      wrapper so it can run edge-to-edge next to the rail. */
  bare?: boolean;
  /** Editor view hides the global header — pin the rail to the
      viewport top and give it the full height. */
  headerless?: boolean;
  /** Slim icon-only rail (defaults expanded). */
  collapsed?: boolean;
  /** Toggle the rail collapsed ⇄ expanded. */
  onToggle?: () => void;
  /** Plan/usage for the sidebar footer CTA. */
  usage?: { used: number; limit: number | null; plan: string } | null;
  onUpgrade?: () => void;
}) {
  return (
    <div className="flex w-full items-stretch">
      <WorkspaceSidebar activeView={activeView} onSelect={onSelect} headerless={headerless} collapsed={collapsed} onToggle={onToggle} usage={usage} onUpgrade={onUpgrade} />
      <WorkspaceMobileNav activeView={activeView} onSelect={onSelect} />
      <div className="flex-1 min-w-0">
        {bare ? (
          children
        ) : (
          <div className="px-4 sm:px-7 lg:px-10 py-6 sm:py-9">
            <div className="max-w-[1500px]">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared panel chrome ────────────────────────────────────
   Every tool panel opens with the same header so the workspace
   feels cohesive no matter which tool you're in. */
function PanelHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: { eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 sm:mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8]">{eyebrow}</p>
        <h1 className="dash-serif mt-1.5 text-[1.75rem] sm:text-3xl lg:text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-[15px] text-stone-600 dark:text-stone-400 font-medium leading-snug max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ─── Analyze panel ──────────────────────────────────────────
   Doc-centric on purpose: analysing always opens the paper in the
   editor with the inline annotator running, so feedback and the
   text live together. You can analyse an existing document or drop
   in fresh text (which becomes a new document first). */
function AnalyzePanel({
  docs,
  loading,
  onPickDoc,
  onPasteAnalyze,
  onUploadFile,
  onNew,
}: {
  docs: DocSummary[];
  loading: boolean;
  onPickDoc: (id: string) => void;
  onPasteAnalyze: (text: string) => void;
  /** Formatting-preserving uploader (mammoth → HTML) for .docx/.txt. */
  onUploadFile: (file: File) => void;
  onNew: () => void;
}) {
  const [text, setText] = useState('');
  const [dropActive, setDropActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const recent = [...docs]
    .sort((a, b) => new Date(b.lastEditedAt || b.updatedAt).getTime() - new Date(a.lastEditedAt || a.updatedAt).getTime())
    .slice(0, 6);

  const handleFile = async (file: File) => {
    setFileError(null);
    // .docx / .txt keep their formatting — route through the same
    // mammoth-based uploader the hub uses (preserves bold, italics,
    // underline, paragraphs, headings) instead of flattening to
    // plain text via the server parser. PDFs/.doc still parse to
    // text (no rich structure to recover anyway).
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.txt')) {
      onUploadFile(file);
      return;
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/analysis/parse-document`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Could not read that file.');
      const content = String(json?.data?.content ?? '').trim();
      if (!content) throw new Error('That file looks empty. Try another, or paste the text instead.');
      onPasteAnalyze(content);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div>
      {/* 1. Drop a file (the most common way to bring a paper in) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !parsing && fileRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !parsing) { e.preventDefault(); fileRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); setDropActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDropActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDropActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !parsing) void handleFile(f);
        }}
        className={`group relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-200 ${
          parsing ? 'opacity-70 cursor-wait pointer-events-none' : ''
        } ${
          dropActive
            ? 'scale-[1.005] border-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/10'
            : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 hover:border-[#A560E8]/60 hover:bg-[#F3EAFF]/40'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
        />
        <div className="px-6 py-10 sm:py-12 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] border-2 border-[#A560E8]/25">
            {parsing ? (
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
            )}
          </span>
          <p className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {parsing ? 'Reading your paper' : 'Drop your essay here'}
          </p>
          <p className="mt-1 text-[13px] font-bold text-stone-500 dark:text-stone-400">
            {parsing ? 'One moment' : 'or click to browse. Opens in the editor, ready when you are.'}
          </p>
          {!parsing && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {['PDF', 'Word', 'TXT'].map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-extrabold uppercase tracking-wide text-stone-500">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {fileError && <p className="mt-2 text-[12px] font-bold text-[#D63A3A]">{fileError}</p>}

      {/* 2. Paste an essay (always visible) */}
      <div className="mt-4 rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Or paste your essay</label>
          <span className={`text-[11px] font-bold tabular-nums ${words < 50 ? 'text-stone-400' : 'text-[#8A48C7]'}`}>{words} words</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="Paste your draft here. It saves as a document and opens in the editor, where you can run the analysis when you're ready."
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 resize-y"
        />
        <div className="mt-3 flex items-center gap-2">
          {words > 0 && words < 50 && <p className="text-[11px] font-bold text-stone-400">Add {50 - words} more words.</p>}
          <button
            type="button"
            onClick={() => onPasteAnalyze(text)}
            disabled={words < 50}
            className="ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Open in editor
          </button>
        </div>
      </div>

      {/* 3. What analysis gives you */}
      <div className="mt-8">
        <PreviewStrip
          title="What analysis gives you"
          subtitle="Professor-style margin notes, a rubric breakdown and a grade estimate, marked up right on your paper."
          items={[
            { kind: 'video', src: '/quick-walkthrough.mp4', label: 'Quick walkthrough' },
            { kind: 'image', src: '/rubric-and-notes.png', label: 'Rubric & notes' },
            { kind: 'image', src: '/full-report.png', label: 'Full report' },
          ]}
        />
      </div>

      {/* 4. Analyze one of your documents */}
      <div className="mt-2">
        <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Analyze one of your documents
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
            <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">No documents yet</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 mb-3">Start a draft, then analyze it whenever you're ready.</p>
            <button type="button" onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">
              New document
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onPickDoc(d.id)}
                className="group w-full flex items-center gap-3 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 text-left hover:-translate-y-0.5 hover:border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8]"><I.Sparkle /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-stone-800 dark:text-stone-100 truncate">{d.title || 'Untitled'}</span>
                  <span className="block text-[11px] font-bold text-stone-400 mt-0.5">{d.wordCount ? `${d.wordCount.toLocaleString()} words` : 'Empty'} · edited {timeAgo(d.lastEditedAt || d.updatedAt)}</span>
                </span>
                <span className="text-stone-300 group-hover:text-[#A560E8] transition-colors"><I.ArrowR /></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HUB view (list + filters + actions) ───────────────────── */
function DocumentsHub({
  docs,
  loading,
  onNew,
  onOpen,
  onUpload,
  onAnalyze,
  onDownload,
  onDelete,
  userName,
  usage,
}: {
  docs: DocSummary[];
  loading: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onUpload: (file: File) => void;
  onAnalyze: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  userName: string;
  usage: { used: number; limit: number | null; plan: string } | null;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (q) {
          const inTitle = d.title.toLowerCase().includes(q);
          const inFilename = (d.originalFilename || '').toLowerCase().includes(q);
          if (!inTitle && !inFilename) return false;
        }
        if (filter === 'drafts') return d.isDraft;
        if (filter === 'uploads') return d.isUpload;
        // 'analyzed' would require a join with analyses; defer to a
        // future enhancement. For now treat it as "show all" with a
        // visible chip so the surface area is set up.
        return true;
      })
      .sort((a, b) => {
        const ta = a.lastEditedAt || a.updatedAt;
        const tb = b.lastEditedAt || b.updatedAt;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [docs, search, filter]);

  const filterChips: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',      label: 'All',       count: docs.length },
    { key: 'drafts',   label: 'Drafts',    count: docs.filter((d) => d.isDraft).length },
    { key: 'uploads',  label: 'Uploads',   count: docs.filter((d) => d.isUpload).length },
    { key: 'analyzed', label: 'Analyzed',  count: docs.length /* TODO wire to analysis count */ },
  ];

  return (
    <>
      {/* ─── HERO — the flagship "start writing" moment ───────────
          Big editorial headline + two oversized action tiles that
          ARE the primary call to action (write a new draft OR pull
          in an existing paper). This is the centre of gravity for
          the whole product now. */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-px w-7 bg-[#A560E8]/50 shrink-0" aria-hidden />
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8] truncate">{todayLabel()}</p>
          </div>
          {usage && usage.limit != null && (() => {
            const atCap = usage.used >= usage.limit;
            const near = !atCap && usage.used >= usage.limit - 1;
            return (
              <span
                title={`${usage.used} of ${usage.limit} documents used on the ${usage.plan} plan`}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] sm:text-xs font-extrabold tabular-nums ${
                  atCap
                    ? 'border-[#FF4B4B]/40 bg-[#FFE8E8] text-[#E04343] dark:bg-[#FF4B4B]/15 dark:text-[#FF8A8A]'
                    : near
                      ? 'border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
                      : 'border-[#A560E8]/30 bg-[#F3EAFF] text-[#8A48C7] dark:bg-[#A560E8]/15 dark:text-[#C9A0F0]'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
                </svg>
                {usage.used}/{usage.limit}
              </span>
            );
          })()}
        </div>
        <h1 className="dash-serif mt-3 text-[2.1rem] sm:text-[2.7rem] lg:text-[3.1rem] font-extrabold leading-[1.03] tracking-tight text-stone-900 dark:text-stone-50">
          {greetingFor()}{userName ? <>, <span className="text-[#A560E8]">{userName}</span></> : ''}.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-medium leading-relaxed max-w-2xl">
          {userName ? 'Welcome back. ' : ''}Pick up a draft, start something new, or get professor-style feedback whenever you're ready. Everything in one place.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Primary — write new */}
          <button
            type="button"
            onClick={onNew}
            className="group relative overflow-hidden rounded-3xl border-2 border-b-4 border-[#7733B5] bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white p-6 text-left hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_20px_44px_-18px_rgba(165,96,232,0.6)]"
          >
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 border-2 border-white/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-extrabold leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Start a new draft</p>
                <p className="text-[13px] font-bold text-white/80 mt-1">Begin with a blank page</p>
              </div>
              <svg className="ml-auto w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </button>

          {/* Secondary — upload existing */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative overflow-hidden rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 text-left hover:-translate-y-0.5 hover:border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_30px_-18px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] border-2 border-[#A560E8]/25">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-extrabold leading-tight text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Upload a paper</p>
                <p className="text-[13px] font-bold text-stone-500 dark:text-stone-400 mt-1">Bring in a PDF, .docx or .txt file</p>
              </div>
              <svg className="ml-auto w-5 h-5 shrink-0 text-stone-400 group-hover:text-[#A560E8] transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Library section header + search + filters ──────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            Your documents
            <span className="ml-2 text-sm font-bold text-stone-400 tabular-nums align-middle">{docs.length}</span>
          </h2>
          <p className="mt-0.5 text-[13px] font-bold text-stone-500 dark:text-stone-400">Pick up where you left off, or open one to analyze it.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <span aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <I.Search />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-10 pr-3 py-2.5 rounded-2xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-sm font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 transition-colors"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {filterChips.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full text-[12px] font-extrabold transition-all ${
                active
                  ? 'bg-[#A560E8] text-white border-2 border-[#7733B5] shadow-[0_6px_16px_-8px_rgba(165,96,232,0.7)]'
                  : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/40 hover:text-[#8A48C7] dark:hover:text-[#C9A0F0]'
              }`}
            >
              {c.label}
              <span className={`min-w-[1.1rem] text-center text-[10px] tabular-nums px-1 py-px rounded-full ${active ? 'bg-white/25 text-white' : 'bg-stone-200/70 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}`}>{c.count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Document grid ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-[1.5rem] border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden animate-pulse">
              <div className="h-44 bg-stone-100 dark:bg-stone-800 px-5 pt-7">
                <div className="h-full rounded-t-2xl bg-white/70 dark:bg-stone-900/60" />
              </div>
              <div className="px-5 py-4 space-y-2.5">
                <div className="h-2.5 w-2/3 rounded-full bg-stone-100 dark:bg-stone-800" />
                <div className="h-7 w-24 rounded-xl bg-stone-100 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
          <DocsEmptyState hasAnyDocs={docs.length > 0} hasSearch={search.trim().length > 0} onNew={onNew} onUpload={() => fileInputRef.current?.click()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((d) => (
            <DocumentCard
              key={d.id}
              doc={d}
              onOpen={() => onOpen(d.id)}
              onAnalyze={() => onAnalyze(d.id)}
              onDownload={() => onDownload(d.id)}
              onDelete={() => onDelete(d.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function DocsEmptyState({ hasAnyDocs, hasSearch, onNew, onUpload }: { hasAnyDocs: boolean; hasSearch: boolean; onNew: () => void; onUpload: () => void }) {
  if (hasSearch) {
    return (
      <div className="p-10 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
          <I.Search />
        </div>
        <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">Nothing matches that search</p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Try a shorter query or clear the search to see everything.</p>
      </div>
    );
  }
  if (!hasAnyDocs) {
    return (
      <div className="p-10 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-[#F3EAFF] flex items-center justify-center">
          <span className="text-[#A560E8]"><I.Doc /></span>
        </div>
        <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">No documents yet</p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 mb-4">Start a new draft or upload an essay you've already written.</p>
        <div className="inline-flex items-center gap-2">
          <button type="button" onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">
            <I.Plus /> New document
          </button>
          <button type="button" onClick={onUpload} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-b-[3px] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-extrabold hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all">
            <I.Upload /> Upload paper
          </button>
        </div>
      </div>
    );
  }
  // Has docs but the active filter excludes them all.
  return (
    <div className="p-10 text-center">
      <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">Nothing here yet</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Try a different filter. All shows everything.</p>
    </div>
  );
}

function DocumentCard({
  doc,
  onOpen,
  onAnalyze,
  onDownload,
  onDelete,
}: {
  doc: DocSummary;
  onOpen: () => void;
  onAnalyze: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const isDraft = doc.isDraft;
  const statusLabel = isDraft ? 'Draft' : doc.isUpload ? 'Uploaded' : 'Document';
  const wordsText = doc.wordCount ? `${doc.wordCount.toLocaleString()} words` : 'Empty';
  const editedText = timeAgo(doc.lastEditedAt || doc.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
      }}
      aria-label={`Open ${doc.title || 'Untitled'}`}
      className="group relative flex flex-col text-left rounded-[1.5rem] border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-[#A560E8]/50 active:translate-y-0 transition-all duration-200 shadow-[0_10px_28px_-20px_rgba(0,0,0,0.22)] hover:shadow-[0_26px_48px_-22px_rgba(165,96,232,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/55"
    >
      {/* Cover — a floating "page" thumbnail that shows the real
          title, like a mini manuscript, on a brand-tinted desk. */}
      <div
        className={`relative h-44 px-5 pt-5 ${
          isDraft
            ? 'bg-gradient-to-br from-[#A560E8] to-[#7733B5]'
            : 'bg-gradient-to-br from-[#F3EAFF] to-[#E4D3F7] dark:from-stone-800 dark:to-stone-800/60'
        }`}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
        {/* status chip */}
        <span
          className={`absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            isDraft
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-white/80 dark:bg-stone-900/80 text-[#8A48C7] dark:text-[#C9A0F0] border border-[#A560E8]/25'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isDraft ? 'bg-white' : 'bg-[#A560E8]'}`} aria-hidden />
          {statusLabel}
        </span>
        {/* the sheet */}
        <div className="absolute inset-x-5 top-7 bottom-0 rounded-t-2xl bg-white dark:bg-stone-950 shadow-[0_18px_36px_-16px_rgba(0,0,0,0.45)] px-5 pt-5 overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-200 group-hover:-translate-y-1">
          <p className="dash-serif text-[15px] font-extrabold leading-snug text-stone-900 dark:text-stone-50 line-clamp-3">
            {doc.title || 'Untitled'}
          </p>
          <div className="mt-2.5 h-[2px] w-8 rounded-full bg-[#A560E8]/45" />
          {/* faint body lines to suggest a page of writing */}
          <div className="mt-3 space-y-1.5" aria-hidden>
            <div className="h-1 w-[88%] rounded-full bg-stone-200/80 dark:bg-stone-700/70" />
            <div className="h-1 w-full rounded-full bg-stone-200/70 dark:bg-stone-700/60" />
            <div className="h-1 w-[72%] rounded-full bg-stone-200/60 dark:bg-stone-700/50" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 pt-3.5 pb-4">
        <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 tabular-nums">
          {wordsText} <span className="text-stone-300 dark:text-stone-600">·</span> edited {editedText}
        </p>

        {/* Action row */}
        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[12px] font-extrabold border-2 border-[#A560E8]/20 hover:bg-[#A560E8] hover:text-white hover:border-[#7733B5] transition-all"
          >
            <I.Sparkle /> Analyze
          </button>
          <span className="ml-auto flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <CardAction title="Download" onClick={onDownload}><I.Download /></CardAction>
            <CardAction title="Delete" onClick={onDelete} accent="red"><I.Trash /></CardAction>
          </span>
        </div>
      </div>
    </div>
  );
}

function CardAction({ title, onClick, children, accent }: { title: string; onClick: () => void; children: React.ReactNode; accent?: 'red' }) {
  const tone =
    accent === 'red'
      ? 'text-stone-400 hover:text-[#FF4B4B] hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10'
      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-stone-200 dark:hover:bg-stone-800';
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${tone}`}
    >
      {children}
    </button>
  );
}

/* ─── EDITOR view ───────────────────────────────────────────── */
function DocumentEditorView({
  docId,
  initialTitle,
  initialHtml,
  onTitleSave,
  onContentSave,
  onBack,
  onAnalyze,
  analyzerResult,
  analyzerLoading,
  analyzerError,
  analyzerOpen,
  onAnalyzerClose,
  onReopenAnalyzer,
  selectedAnnotationId,
  onSelectAnnotation,
  onAnnotationHover,
  hoverAnnotationId,
  hoverRect,
  onEditorReady,
  onApplyRevision,
  onRevertRevision,
  appliedAnnotationIds,
  applyingAnnotationId,
  onOpenFullReport,
  wordLimit,
  onUpgrade,
  analysesLeft,
  revisionsLocked,
  revisionPaywallAnn,
  onCloseRevisionPaywall,
}: {
  docId: string;
  initialTitle: string;
  initialHtml: string;
  onTitleSave: (title: string) => Promise<void>;
  onContentSave: (payload: { html: string; text: string; wordCount: number }) => Promise<void>;
  onBack: () => void;
  onAnalyze: () => void;
  analyzerResult: AnalyzerResult | null;
  analyzerLoading: boolean;
  analyzerError: string | null;
  analyzerOpen: boolean;
  onAnalyzerClose: () => void;
  onReopenAnalyzer: () => void;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAnnotationHover: (id: string | null, rect: DOMRect | null) => void;
  hoverAnnotationId: string | null;
  hoverRect: DOMRect | null;
  onEditorReady: (editor: Editor) => void;
  onApplyRevision: (annotationId: string) => void;
  onRevertRevision: (annotationId: string) => void;
  appliedAnnotationIds: Set<string>;
  applyingAnnotationId: string | null;
  onOpenFullReport: () => void;
  wordLimit: number | null;
  onUpgrade: () => void;
  analysesLeft: number | null;
  revisionsLocked: boolean;
  revisionPaywallAnn: { text: string; suggestion: string } | null;
  onCloseRevisionPaywall: () => void;
}) {
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Analysis is a deliberate, quota-consuming action — confirm
  // before running so it's never an accidental click.
  const [confirmAnalyze, setConfirmAnalyze] = useState(false);
  const isReanalyze = !!analyzerResult;
  const noAnalysesLeft = typeof analysesLeft === 'number' && analysesLeft === 0;

  useEffect(() => {
    if (title === initialTitle) return;
    if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current);
    titleSaveTimerRef.current = setTimeout(() => { void onTitleSave(title); }, 1500);
    return () => { if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleContentSave = useCallback(async (payload: { html: string; text: string; wordCount: number }) => {
    setSaveStatus('saving');
    try {
      await onContentSave(payload);
      setSavedAt(new Date());
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [onContentSave]);

  // Forward the full annotation shape (including comment +
  // suggestion) so the AnalyzerHighlights extension can power
  // hover tooltips + Apply revisions without a separate lookup.
  const editorAnnotations = useMemo<AnnotatorAnnotation[] | undefined>(
    () => analyzerResult?.annotations.map((a) => ({
      id: a.id,
      type: a.type,
      startIndex: a.startIndex,
      endIndex: a.endIndex,
      text: a.text,
      comment: a.comment,
      suggestion: a.suggestion,
    })),
    [analyzerResult],
  );

  // When a panel card is clicked, also highlight the matching mark
  // in the editor + scroll there. The WriteEditor's
  // selectedAnnotationId effect handles the scroll on its side.
  const handleSelectAnnotation = useCallback((id: string) => {
    onSelectAnnotation(id);
    // Also scroll the panel card into view (handled by useEffect below).
  }, [onSelectAnnotation]);

  // When `selectedAnnotationId` changes (e.g. user clicked a mark
  // in the editor), scroll the corresponding panel card into view.
  useEffect(() => {
    if (!selectedAnnotationId || !analyzerOpen) return;
    const card = document.querySelector(`[data-card-annotation-id="${selectedAnnotationId}"]`);
    if (card && 'scrollIntoView' in card) {
      (card as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedAnnotationId, analyzerOpen]);

  // Hovered annotation lookup — `comment` + `suggestion` from the
  // analyzer result (the editor's annotation array only carries
  // positions). Returns null when nothing's hovered.
  const hoveredAnnotation = useMemo(() => {
    if (!hoverAnnotationId || !analyzerResult) return null;
    return analyzerResult.annotations.find((a) => a.id === hoverAnnotationId) ?? null;
  }, [hoverAnnotationId, analyzerResult]);

  // When the analyzer panel is open we shift to a side-by-side
  // layout: editor takes ~62% on lg, panel takes ~38%. Below lg the
  // panel slides in as a full-screen drawer so users can still read
  // the feedback comfortably on phones / tablets without the editor
  // shrinking to nothing.
  const showSplit = analyzerOpen && (analyzerResult || analyzerLoading || analyzerError);

  return (
    <div className={`mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 transition-[max-width] duration-200 ${showSplit ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <I.ArrowL />
          All documents
        </button>
      </div>

      <div className={`grid gap-4 lg:gap-6 ${showSplit ? 'lg:grid-cols-[minmax(0,1fr)_min(360px,31%)]' : 'grid-cols-1'}`}>
        {/* overflow-clip (not -hidden): clips the rounded corners the
            same way visually, but unlike -hidden it does NOT create a
            scroll container — so the editor toolbar's `sticky top-0`
            (Re-analyze / analyses-left / autosave) actually sticks
            while you scroll a long draft. Same trick the app root
            uses. */}
        <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-clip min-w-0">
        <div className="px-6 sm:px-10 lg:px-16 pt-8 pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Document title"
            className="w-full bg-transparent border-0 outline-none focus:outline-none text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-50 placeholder:text-stone-300 dark:placeholder:text-stone-700"
          />
        </div>

        <WriteEditor
          key={docId}
          initialHtml={initialHtml}
          onSave={handleContentSave}
          annotations={editorAnnotations}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationClick={(id) => onSelectAnnotation(id)}
          onAnnotationHover={onAnnotationHover}
          onEditorReady={onEditorReady}
          wordLimit={wordLimit}
          onUpgrade={onUpgrade}
          exportFileName={title || 'document'}
          headerless
          saveStatus={
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                saveStatus === 'saving'
                  ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  : saveStatus === 'saved'
                    ? 'bg-[#E5F8D0] text-[#46A302]'
                    : saveStatus === 'error'
                      ? 'bg-[#FFE8E8] text-[#FF4B4B]'
                      : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
              }`}
              aria-live="polite"
            >
              {saveStatus === 'saving' && (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Saving…
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
                  Saved {savedAt ? timeAgo(savedAt.toISOString()) : ''}
                </>
              )}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && 'Autosave on'}
            </span>
          }
          toolbarRight={
            <div className="flex items-center gap-2">
              {analysesLeft != null && (
                analysesLeft < 0 ? (
                  <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[10px] font-extrabold uppercase tracking-wider">
                    Unlimited analyses
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={analysesLeft === 0 ? onUpgrade : undefined}
                    title={analysesLeft === 0 ? 'No analyses left this month — upgrade for more' : `${analysesLeft} ${analysesLeft === 1 ? 'analysis' : 'analyses'} left this month`}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border-2 ${
                      analysesLeft === 0
                        ? 'bg-[#FFE8E8] text-[#FF4B4B] border-[#FF4B4B]/30 cursor-pointer hover:bg-[#FFDADA]'
                        : analysesLeft <= 1
                          ? 'bg-[#F3EAFF] text-[#8A48C7] border-[#A560E8]/30 cursor-default'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-transparent cursor-default'
                    }`}
                  >
                    {analysesLeft === 0 ? 'No analyses left' : `${analysesLeft} ${analysesLeft === 1 ? 'analysis' : 'analyses'} left`}
                  </button>
                )
              )}
            {/* When feedback exists but the panel was closed, the
                primary action is "Show feedback" — reopens the
                existing result instantly, no new analysis / no
                quota spent. Re-analyze stays available once it's
                open (and inside the panel header). */}
            {analyzerResult && !analyzerOpen && !analyzerLoading && (
              <button
                type="button"
                onClick={onReopenAnalyzer}
                title="Show your feedback again (no new analysis)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[11px] sm:text-xs font-extrabold uppercase tracking-wider border-2 border-b-[3px] border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 hover:bg-[#EADCFB] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-6 0h.01M12 16h3m-6 0h.01" /></svg>
                Show feedback
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmAnalyze(true)}
              disabled={analyzerLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-wider border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              {analyzerLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <I.Sparkle />
                  {analyzerResult ? 'Re-analyze' : 'Analyze'}
                </>
              )}
            </button>
            </div>
          }
        />
        </div>

        {/* Analyzer side panel — visible on lg+ when an analysis
            is loading / loaded / errored. Fixed `h-` (not max-h)
            so the inner panel's `flex flex-col h-full` resolves
            to a real pixel height — the previous max-h-only setup
            collapsed h-full to 0 and broke scrolling. On smaller
            screens the panel becomes a bottom drawer (see below)
            so the editor isn't squashed into nothing. */}
        {showSplit && (
          <aside className="hidden lg:flex flex-col rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden self-start sticky top-4 h-[calc(100dvh-2rem)]">
            <AnalyzerPanel
              result={analyzerResult}
              loading={analyzerLoading}
              error={analyzerError}
              selectedAnnotationId={selectedAnnotationId}
              onAnnotationClick={handleSelectAnnotation}
              onRerun={() => setConfirmAnalyze(true)}
              onClose={onAnalyzerClose}
              onOpenFullReport={onOpenFullReport}
              onApplyRevision={onApplyRevision}
              onRevertRevision={onRevertRevision}
              appliedAnnotationIds={appliedAnnotationIds}
              applyingAnnotationId={applyingAnnotationId}
              revisionsLocked={revisionsLocked}
            />
          </aside>
        )}
      </div>

      {/* Floating hover tooltip — positioned above the underline
          the cursor is over. Pointer-events-none so it never traps
          mouseout events. Hidden on touch devices (no real hover). */}
      {hoveredAnnotation && hoverRect && (
        <div
          aria-hidden
          className="hidden lg:block fixed z-50 max-w-[320px] p-3 rounded-2xl bg-[#3C3C3C] dark:bg-stone-800 text-white border-2 border-b-4 border-[#2a2a2a] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.45)] pointer-events-none ws-tooltip-in"
          style={{
            left: Math.min(window.innerWidth - 340, Math.max(20, hoverRect.left + hoverRect.width / 2 - 160)),
            top: Math.max(20, hoverRect.top - 12),
            transform: 'translateY(-100%)',
          }}
        >
          {hoveredAnnotation.comment && (
            <p className="text-[12px] font-bold leading-snug">{hoveredAnnotation.comment}</p>
          )}
          {hoveredAnnotation.suggestion && (
            revisionsLocked ? (
              <p className="mt-1.5 pt-1.5 border-t border-white/15 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FFC800] leading-snug">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Unlock the suggested fix with Pro
              </p>
            ) : (
              <p className="mt-1.5 pt-1.5 border-t border-white/15 text-[11px] leading-snug">
                <span className="font-extrabold text-[#FFC800]">Try:</span> {hoveredAnnotation.suggestion}
              </p>
            )
          )}
          {/* Caret pointing down to the underline */}
          <span
            aria-hidden
            className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-[#3C3C3C] dark:bg-stone-800 border-r-2 border-b-2 border-[#2a2a2a]"
          />
        </div>
      )}

      {/* Mobile / tablet drawer — same panel content, takes the
          bottom half of the viewport. Tap-outside dismisses. */}
      {showSplit && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 h-[75dvh] rounded-t-3xl border-t-2 border-l-2 border-r-2 border-b-0 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.20)] overflow-hidden flex flex-col">
          {/* Grab handle */}
          <div className="flex justify-center pt-2 pb-1 shrink-0" aria-hidden>
            <span className="block h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <AnalyzerPanel
              result={analyzerResult}
              loading={analyzerLoading}
              error={analyzerError}
              selectedAnnotationId={selectedAnnotationId}
              onAnnotationClick={handleSelectAnnotation}
              onRerun={() => setConfirmAnalyze(true)}
              onClose={onAnalyzerClose}
              onOpenFullReport={onOpenFullReport}
              onApplyRevision={onApplyRevision}
              onRevertRevision={onRevertRevision}
              appliedAnnotationIds={appliedAnnotationIds}
              applyingAnnotationId={applyingAnnotationId}
              revisionsLocked={revisionsLocked}
            />
          </div>
        </div>
      )}

      {/* Analyze confirmation — analysis is powerful + quota-bound,
          so never let it fire from a stray click. */}
      {confirmAnalyze && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmAnalyze(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8]">
                <I.Sparkle />
              </span>
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {noAnalysesLeft ? 'No analyses left this month' : isReanalyze ? 'Re-analyze this draft?' : 'Analyze this draft?'}
              </h3>
            </div>

            {noAnalysesLeft ? (
              <p className="text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                You've used all your analyses for this billing period. Upgrade for more, or wait until your allowance resets.
              </p>
            ) : (
              <>
                <p className="text-sm text-stone-600 dark:text-stone-300 font-medium leading-snug mb-3">
                  Analysis is a powerful, considered action. Here's exactly what happens:
                </p>
                <ul className="space-y-2 text-[13px] text-stone-700 dark:text-stone-200">
                  <li className="flex gap-2"><span className="text-[#A560E8] font-extrabold">•</span><span>Reads your <strong>current draft</strong> and marks it up with professor-style feedback, inline.</span></li>
                  <li className="flex gap-2"><span className="text-[#A560E8] font-extrabold">•</span><span>Gives a rubric breakdown and a grade estimate.</span></li>
                  {isReanalyze && (
                    <li className="flex gap-2"><span className="text-[#FF4B4B] font-extrabold">•</span><span><strong>Replaces</strong> your current feedback and clears any revisions you've already applied.</span></li>
                  )}
                  <li className="flex gap-2"><span className="text-[#A560E8] font-extrabold">•</span><span>
                    Uses <strong>one analysis</strong>
                    {typeof analysesLeft === 'number' && analysesLeft >= 0 ? ` — you have ${analysesLeft} left this month.` : '.'}
                  </span></li>
                </ul>
              </>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAnalyze(false)}
                className="px-4 py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                {noAnalysesLeft ? 'Close' : 'Cancel'}
              </button>
              {noAnalysesLeft ? (
                <button
                  type="button"
                  onClick={() => { setConfirmAnalyze(false); onUpgrade(); }}
                  className="px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  See plans
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setConfirmAnalyze(false); onAnalyze(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  <I.Sparkle />
                  {isReanalyze ? 'Re-analyze now' : 'Analyze now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teased revision paywall — free users see exactly what
          one-click revisions do, with the rewrite blurred behind
          an upgrade. No API call, no cost. */}
      {revisionPaywallAnn && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={onCloseRevisionPaywall}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#A560E8]/15 blur-2xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8]">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  One-click revision
                </h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 font-medium leading-snug">
                Pro & Premium rewrite this passage and drop a clean, ready-to-use version straight into your draft. One click — no copy-paste.
              </p>

              {revisionPaywallAnn.text && (
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">Your passage</p>
                  <p className="text-[12.5px] italic text-stone-600 dark:text-stone-300 line-clamp-2 border-l-2 border-stone-300 dark:border-stone-600 pl-2.5">
                    "{revisionPaywallAnn.text}"
                  </p>
                </div>
              )}

              <div className="mt-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A560E8] mb-1">WriteScholar's rewrite</p>
                <div className="relative rounded-xl border-2 border-[#A560E8]/30 bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10 p-3 overflow-hidden">
                  <p className="text-[12.5px] text-stone-700 dark:text-stone-200 leading-snug blur-[5px] select-none" aria-hidden>
                    {revisionPaywallAnn.suggestion?.trim()
                      ? revisionPaywallAnn.suggestion
                      : 'A sharper, clearer rewrite of this passage — tightened wording, stronger argument, and smoother flow, ready to slot straight into your draft.'}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-stone-900/90 text-[#8A48C7] dark:text-[#C9A0F0] text-[10px] font-extrabold uppercase tracking-wider border border-[#A560E8]/30">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      Unlock with Pro
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseRevisionPaywall}
                  className="px-4 py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={() => { onCloseRevisionPaywall(); onUpgrade(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Upgrade to apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page shell — owns the hub ⇄ editor view state ──────── */
export default function DocumentsPage({ initialDocumentId, onNavigate, user, onEditorActiveChange }: DocumentsPageProps) {
  const [view, setView] = useState<WorkspaceView>(initialDocumentId ? 'editor' : 'hub');
  const [openDocId, setOpenDocId] = useState<string | null>(initialDocumentId ?? null);
  // Editor opens with the rail expanded; the « / » button on the rail
  // collapses it to a slim icon-only strip when the paper needs the
  // full width.
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [openDoc, setOpenDoc] = useState<DocFull | null>(null);
  const [docList, setDocList] = useState<DocSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // A PDF the user picked, held until they acknowledge that PDFs
  // come in as plain text (formatting/structure isn't recoverable).
  const [pdfNoticeFile, setPdfNoticeFile] = useState<File | null>(null);
  // Plan-aware document usage for the "X / cap" pill (Free 3 / Pro+Premium 99).
  const [docUsage, setDocUsage] = useState<{ used: number; limit: number | null; plan: string } | null>(null);

  // Tell the app shell when we're in the full-screen editor so it can
  // drop the global site header (more vertical room for writing). On
  // unmount we explicitly report inactive so the header can't get
  // stuck hidden if the user routes away while a doc is open.
  useEffect(() => {
    onEditorActiveChange?.(view === 'editor');
  }, [view, onEditorActiveChange]);
  useEffect(() => () => onEditorActiveChange?.(false), [onEditorActiveChange]);

  // ─── Analyzer state ──────────────────────────────────────────
  // Per-document analysis result. Cleared when switching docs so
  // a stale analysis from one essay never bleeds into another.
  // Analyses remaining this month, surfaced in the editor's top
  // right. null = unknown/loading, -1 = unlimited. For free plans
  // it's the per-feature count; for paid it's the shared actions
  // pool (analyses + study packs + citations).
  const [analysesLeft, setAnalysesLeft] = useState<number | null>(null);
  const refreshUsage = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/subscriptions/usage`, { headers: authHeaders() });
      if (!res.ok) return;
      const j = await res.json();
      const n = typeof j?.combinedActionsRemaining === 'number'
        ? j.combinedActionsRemaining
        : (typeof j?.analysesRemaining === 'number' ? j.analysesRemaining : null);
      setAnalysesLeft(n);
    } catch { /* non-fatal — the chip just stays hidden */ }
  }, []);

  const [analyzerResult, setAnalyzerResult] = useState<AnalyzerResult | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  // Tooltip state — annotation id currently hovered + its bounding
  // rect (used to position the tooltip near the underline).
  const [hoverAnnotationId, setHoverAnnotationId] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  // Applied revisions, keyed by annotation id. We keep the
  // original + replacement text so the user can revert (positions
  // shift after edits, so revert is text-search based). Reset on
  // re-analyze / doc-switch.
  const [appliedRevisions, setAppliedRevisions] = useState<Map<string, { originalText: string; replacementText: string }>>(new Map());
  // Annotation id currently calling /inline-revision (button spinner).
  const [applyingAnnotationId, setApplyingAnnotationId] = useState<string | null>(null);
  // Teased paywall: when a free user clicks "Apply", we show them
  // what they're missing (blurred rewrite + upgrade) instead of a
  // dead 403. Holds the annotation being teased, or null.
  const [revisionPaywallAnn, setRevisionPaywallAnn] = useState<{ text: string; suggestion: string } | null>(null);
  // Editor instance handed up from <WriteEditor /> via onEditorReady.
  // Lets us run imperative ops like applyAnnotationRevision from the
  // page level (where the analyzer state lives).
  const editorRef = useRef<Editor | null>(null);
  // One-API-call-ever cache of fetched revisions, keyed by
  // annotation id. Survives revert so re-applying the same
  // annotation reuses the saved revision instead of hitting
  // /inline-revision again. Cleared only on re-analyze / doc-switch.
  const revisionCacheRef = useRef<Map<string, string>>(new Map());
  // Latest content_text — kept in a ref so the Analyze handler always
  // reads what the editor most-recently saved (rather than whatever
  // openDoc.contentText was at first load). Updated by handleContentSave.
  const latestTextRef = useRef<string>('');

  // Analyse-intent flow: set true by the "Analyze a paper" entries
  // (Analyze on a hub doc, paste-to-analyse, upload-to-analyse). When
  // set, opening the editor auto-runs the analyzer so the journey is
  // upload/paste → graded → fix, not editor → hunt for Analyze → fix.
  // Write-from-scratch leaves it false (no auto-analyse on a blank doc).
  const analyzeOnOpenRef = useRef(false);
  // Gate so the auto-analyse waits until the "restore prior analysis"
  // lookup has settled — otherwise a fresh analysis could fire while
  // a cached one is still loading and double-spend an analysis credit.
  const [priorAnalysisChecked, setPriorAnalysisChecked] = useState(false);

  // ─── List load ────────────────────────────────────────────────
  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      // Load the full library in one go. The backend defaults to 20
      // with no pagination UI here, so a user with >20 docs would
      // silently "lose" the rest. 100 covers every plan (Free 3,
      // Pro/Premium hard-capped at 99) and matches the Joi max.
      const res = await fetch(`${API_URL}/documents?limit=100&sortBy=updated_at&sortOrder=desc`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load documents');
      const json = await res.json();
      const raw = (json?.data?.documents ?? json?.documents ?? []) as Array<Record<string, unknown>>;
      const mapped: DocSummary[] = raw.map((d) => {
        const fileType = String(d.fileType ?? d.file_type ?? '');
        const filename = String(d.originalFilename ?? d.original_filename ?? '');
        const isUpload = !!filename && !filename.startsWith('untitled') && !filename.startsWith('Pasted');
        const lastEditedAt = (d.lastEditedAt ?? d.last_edited_at ?? null) as string | null;
        const updatedAt = String(d.updatedAt ?? d.updated_at ?? new Date().toISOString());
        const createdAt = String(d.createdAt ?? d.created_at ?? updatedAt);
        // A doc is a "draft" if it's been edited in the in-app
        // editor — i.e. lastEditedAt is set and is later than the
        // creation time. (Pasted-text uploads still have empty
        // last_edited_at until the user opens them in the editor.)
        const isDraft = !!lastEditedAt && new Date(lastEditedAt).getTime() > new Date(createdAt).getTime() + 1000;
        return {
          id: String(d.id),
          title: String(d.title ?? 'Untitled'),
          originalFilename: filename,
          fileType,
          fileSize: Number(d.fileSize ?? d.file_size ?? 0),
          wordCount: Number(d.wordCount ?? d.word_count ?? 0),
          pageCount: Number(d.pageCount ?? d.page_count ?? 0),
          uploadStatus: String(d.uploadStatus ?? d.upload_status ?? 'completed'),
          createdAt,
          updatedAt,
          lastEditedAt,
          isDraft,
          isUpload,
        };
      });
      setDocList(mapped);
      const u = json?.data?.usage?.documents;
      if (u && typeof u.used === 'number') {
        setDocUsage({ used: u.used, limit: typeof u.limit === 'number' ? u.limit : null, plan: String(u.plan ?? 'Free') });
      }
    } catch (e) {
      console.error('[Documents] list load error', e);
      setError('Could not load your documents.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { if (view === 'hub') void refreshList(); }, [view, refreshList]);

  // ─── Single-doc load when entering editor view ────────────────
  useEffect(() => {
    if (view !== 'editor' || !openDocId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/documents/${openDocId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load document');
        const json = await res.json();
        const d = json?.data?.document;
        if (cancelled) return;
        setOpenDoc({
          id: String(d.id),
          title: String(d.title ?? 'Untitled'),
          originalFilename: String(d.originalFilename ?? ''),
          fileType: String(d.fileType ?? ''),
          fileSize: Number(d.fileSize ?? 0),
          wordCount: Number(d.wordCount ?? 0),
          pageCount: Number(d.pageCount ?? 0),
          uploadStatus: String(d.uploadStatus ?? 'completed'),
          createdAt: String(d.createdAt ?? new Date().toISOString()),
          updatedAt: String(d.updatedAt ?? new Date().toISOString()),
          lastEditedAt: (d.lastEditedAt ?? null) as string | null,
          isDraft: false,
          isUpload: false,
          contentHtml: (d.contentHtml ?? null) as string | null,
          contentText: (d.content_text ?? null) as string | null,
        });
      } catch (e) {
        console.error('[Documents] doc load error', e);
        setError('Could not load that document.');
      }
    })();
    return () => { cancelled = true; };
  }, [view, openDocId]);

  // ─── Create / upload / open / delete handlers ─────────────────
  const createNewDoc = useCallback(async (initial?: { title?: string; html?: string; text?: string }) => {
    const title = initial?.title ?? 'Untitled';
    const text = initial?.text ?? '';
    const html = initial?.html ?? '';
    try {
      // The backend create endpoint is POST /documents/upload and it
      // REQUIRES a real file under the `document` field (multer
      // single('document')). A blank draft has no file, so we
      // synthesise a tiny .txt — empty content only logs a backend
      // warning, never rejects, and the real content is written by
      // the PUT /content call below + the editor's autosave.
      const fd = new FormData();
      fd.append('title', title);
      const safeName = (title || 'Untitled').replace(/[^\w.-]+/g, '_').slice(0, 60) || 'document';
      const fileText = text && text.trim().length > 0 ? text : ' ';
      fd.append('document', new File([new Blob([fileText], { type: 'text/plain' })], `${safeName}.txt`, { type: 'text/plain' }));
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) {
        // Surface the real backend reason — especially the document
        // hard-cap (429) so the user knows to delete one / upgrade,
        // instead of a generic "couldn't create".
        const errJson = await res.json().catch(() => null);
        const e = new Error(errJson?.message || `Upload failed: ${res.status}`);
        // @ts-expect-error tag for the caller
        e.userMessage = errJson?.message || null;
        throw e;
      }
      const json = await res.json();
      const id = String(json?.data?.document?.id ?? json?.document?.id);
      if (!id) throw new Error('No document id returned');
      if (html) {
        await fetch(`${API_URL}/documents/${id}/content`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentHtml: html, contentText: text, wordCount: text ? text.trim().split(/\s+/).filter(Boolean).length : 0 }),
        });
      }
      return id;
    } catch (e) {
      console.error('[Documents] create error', e);
      const um = (e as { userMessage?: string | null })?.userMessage;
      setError(um || 'Could not create a new document.');
      return null;
    }
  }, []);

  const handleNewDoc = useCallback(async () => {
    analyzeOnOpenRef.current = false; // write-from-scratch never auto-analyses
    const id = await createNewDoc({ title: 'Untitled', html: '', text: '' });
    if (id) {
      setOpenDocId(id);
      setOpenDoc({
        id, title: 'Untitled', originalFilename: '', fileType: '', fileSize: 0,
        wordCount: 0, pageCount: 0, uploadStatus: 'completed',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        lastEditedAt: null, isDraft: false, isUpload: false,
        contentHtml: '', contentText: '',
      });
      setView('editor');
    }
  }, [createNewDoc]);

  const runUpload = useCallback(async (file: File) => {
    try {
      let html = '';
      let text = '';
      if (file.name.toLowerCase().endsWith('.docx')) {
        const buf = await file.arrayBuffer();
        // Style map keeps fidelity mammoth drops by default:
        //  • u  → <u>      (underline — ignored unless mapped)
        //  • strike → <s>  (strikethrough)
        //  • Title/Subtitle Word styles → headings
        // Bold/italic/paragraphs/lists/tables/images are preserved
        // by mammoth's defaults (images inline as base64 data URIs,
        // which our Image extension accepts).
        const result = await mammoth.convertToHtml({ arrayBuffer: buf }, {
          styleMap: [
            'u => u',
            'strike => s',
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
          ],
        });
        html = result.value;
        const textRes = await mammoth.extractRawText({ arrayBuffer: buf });
        text = textRes.value;
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
        html = `<p>${text.replace(/\n+/g, '</p><p>')}</p>`;
      } else {
        // PDF / .doc → server-side text extraction (a PDF has no
        // recoverable rich structure, so it comes in as clean
        // paragraphs). Same endpoint the analyze flow uses.
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_URL}/analysis/parse-document`, {
          method: 'POST',
          headers: authHeaders(),
          body: fd,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || 'Could not read that file.');
        }
        text = String(json?.data?.content ?? '').trim();
        if (!text) {
          setError('That file looks empty, or it’s a scanned image we can’t read. Try a .docx or paste the text in.');
          return;
        }
        const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
        html = text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
      }
      const title = file.name.replace(/\.(pdf|docx?|txt)$/i, '');
      const id = await createNewDoc({ title, html, text });
      if (id) {
        setOpenDocId(id);
        setOpenDoc({
          id, title, originalFilename: file.name, fileType: file.type, fileSize: file.size,
          wordCount: text ? text.trim().split(/\s+/).filter(Boolean).length : 0, pageCount: 0,
          uploadStatus: 'completed',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          lastEditedAt: null, isDraft: false, isUpload: true,
          contentHtml: html, contentText: text,
        });
        setView('editor');
      }
    } catch (e) {
      console.error('[Documents] import error', e);
      analyzeOnOpenRef.current = false; // failed import: drop any analyse intent
      setError('Could not read that file. Try a .pdf, .docx or .txt — or paste the text in.');
    }
  }, [createNewDoc]);

  // Single import entry point. PDFs are held behind a heads-up
  // modal first (they come in as plain text — structure can't be
  // recovered); .docx/.txt import straight through with formatting.
  const handleUpload = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setPdfNoticeFile(file);
      return;
    }
    void runUpload(file);
  }, [runUpload]);

  // Upload-to-analyse: same import, but it lands in the editor with
  // the analyzer already running (vs. plain import = write/edit).
  const handleUploadAndAnalyze = useCallback((file: File) => {
    analyzeOnOpenRef.current = true;
    handleUpload(file);
  }, [handleUpload]);

  const handleOpenDoc = useCallback((id: string, analyze = false) => {
    // Explicitly set per open so a stale analyse-intent can't leak
    // onto a plain "open to edit" click.
    analyzeOnOpenRef.current = analyze;
    setOpenDocId(id);
    setOpenDoc(null);
    setView('editor');
    // Update URL for deep-linking — uses pushState so the back
    // button returns to the hub instead of the previous tab.
    try { window.history.pushState({}, '', `/documents/${id}`); } catch { /* ignore */ }
  }, []);

  const handleBackToHub = useCallback(() => {
    analyzeOnOpenRef.current = false;
    setView('hub');
    setOpenDocId(null);
    setOpenDoc(null);
    try { window.history.pushState({}, '', '/documents'); } catch { /* ignore */ }
  }, []);

  const handleTitleSave = useCallback(async (newTitle: string) => {
    if (!openDocId) return;
    try {
      await fetch(`${API_URL}/documents/${openDocId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setOpenDoc((prev) => (prev ? { ...prev, title: newTitle } : prev));
    } catch (e) {
      console.error('[Documents] title save error', e);
    }
  }, [openDocId]);

  const handleContentSave = useCallback(async (payload: { html: string; text: string; wordCount: number }) => {
    if (!openDocId) return;
    // Keep the latest text snapshot for the analyzer call.
    latestTextRef.current = payload.text;
    const res = await fetch(`${API_URL}/documents/${openDocId}/content`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentHtml: payload.html, contentText: payload.text, wordCount: payload.wordCount }),
      // keepalive lets the flush-on-exit save survive a tab close /
      // navigation (the editor flushes the pending save on unmount &
      // beforeunload). Capped at ~64KB by the browser, but the
      // text-only fallback still lands so work isn't lost.
      keepalive: true,
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  }, [openDocId]);

  // Analyze is doc-centric and deliberate: opening a paper takes you
  // into the editor, where the analyzer is one explicit button press
  // away. We intentionally do NOT auto-run it — analysis is a
  // considered action, not something that fires every time a doc
  // opens.
  const handleAnalyzeFromHub = useCallback((id: string) => {
    handleOpenDoc(id, true); // open in editor AND auto-run the analyzer
  }, [handleOpenDoc]);

  // Bring pasted text in as a new document and open it in the
  // editor. The user runs the analysis there, on purpose.
  const handlePasteAnalyze = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const title = text.split(/\s+/).slice(0, 6).join(' ') || 'Untitled';
    const html = `<p>${text.replace(/\n+/g, '</p><p>')}</p>`;
    const id = await createNewDoc({ title, html, text });
    if (id) {
      setOpenDocId(id);
      setOpenDoc({
        id, title, originalFilename: '', fileType: '', fileSize: 0,
        wordCount: text.split(/\s+/).filter(Boolean).length, pageCount: 0,
        uploadStatus: 'completed',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        lastEditedAt: null, isDraft: false, isUpload: false,
        contentHtml: html, contentText: text,
      });
      analyzeOnOpenRef.current = true; // pasted to analyse → auto-run on open
      setView('editor');
      try { window.history.pushState({}, '', `/documents/${id}`); } catch { /* ignore */ }
    }
  }, [createNewDoc]);

  // Download = a faithful Word file generated from the saved HTML via
  // the SAME verified docx pipeline the in-editor export uses. The old
  // path hit GET /:id/download, which only returned unformatted
  // content_text (no .docx, no font/bold/italic) — that's why exports
  // kept opening as plain Times New Roman. We now bypass it entirely.
  const handleDownload = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load document');
      const json = await res.json();
      const d = json?.data?.document;
      const title = String(d?.title ?? docList.find((x) => x.id === id)?.title ?? 'document');
      const html = String(d?.contentHtml ?? d?.content_html ?? '');
      const text = String(d?.content_text ?? d?.contentText ?? '');
      const readLS = (k: string, fb: string) => {
        try { return localStorage.getItem(k) || fb; } catch { return fb; }
      };
      const fontCss = readLS('writescholar_editor_font', '');
      const sizeKey = readLS('writescholar_editor_fontsize', 'base');
      // Don't silently hand the user a blank Word file. A doc with
      // no html and no text (e.g. a never-touched draft) gets a
      // clear message instead of a 0-content .docx that looks broken.
      const htmlHasText = html.replace(/<[^>]*>/g, '').trim().length > 0 || /<img|<table/i.test(html);
      if (!htmlHasText && !text.trim()) {
        setError('That document is empty — open it and add some text before downloading.');
        return;
      }
      const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
      const sourceHtml = html.trim()
        ? html
        : text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
      await exportHtmlAsDocx(sourceHtml, title, fontCss, sizeKey);
    } catch (e) {
      console.error('[Documents] download error', e);
      setError('Could not download that document.');
    }
  }, [docList]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      setDocList((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error('[Documents] delete error', e);
      setError('Could not delete that document.');
    }
  }, []);

  // ─── Analyzer flow ──────────────────────────────────────────
  // POST /api/analysis/analyze with the doc's plain text. Backend
  // returns rubric + annotations indexed against that exact text,
  // so we can map them back to the editor without ambiguity. We
  // open the panel immediately (showing the loading skeleton) so
  // the click feels responsive.
  const handleAnalyzeInEditor = useCallback(async () => {
    if (!openDocId || analyzerLoading) return;
    const text = latestTextRef.current || openDoc?.contentText || '';
    if (!text.trim()) {
      setAnalyzerError('Add some text before running an analysis.');
      setAnalyzerOpen(true);
      return;
    }
    setAnalyzerOpen(true);
    setAnalyzerLoading(true);
    setAnalyzerError(null);
    // Re-analyze invalidates any "applied" markers from the previous
    // result — every card starts fresh (and the cached revisions are
    // no longer valid against the new annotations).
    setAppliedRevisions(new Map());
    revisionCacheRef.current.clear();
    setApplyingAnnotationId(null);
    // Hard timeout so a stalled request can't pin the analyzer
    // panel in its loading state forever.
    const abort = new AbortController();
    const timeoutId = window.setTimeout(() => abort.abort(), 120000);
    try {
      const res = await fetch(`${API_URL}/analysis/analyze`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          // Backend's analysisType enum:
          // 'comprehensive' | 'grammar' | 'style' | 'structure'
          // | 'citation' | 'plagiarism' | 'citation_review'
          // We use 'comprehensive' — the full-rubric flow that
          // returns annotations + scores + top suggestions.
          documentId: openDocId,
          analysisType: 'comprehensive',
          citationStyle: 'None',
          // The Joi validator marks `content` as required even when
          // a documentId is sent. Pass the editor's current text so
          // the analyzer indexes annotations against the SAME plain
          // text the editor's getText() produces — that keeps the
          // startIndex/endIndex offsets accurate for the inline
          // decorations.
          content: text,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Analysis failed (${res.status})`);
      }
      // Endpoint returns the raw analyzer payload either at top
      // level or wrapped in `data` depending on plan/limit-checking
      // path. Normalise into the AnalyzerResult shape the panel
      // wants.
      const payload = json?.data ?? json;
      const annotations = (payload?.annotations ?? []).map((a: Record<string, unknown>) => ({
        id: String(a.id ?? Math.random()),
        type: (a.type as 'strong' | 'improve' | 'concern') ?? 'improve',
        startIndex: Number(a.startIndex ?? a.start_index ?? 0),
        endIndex: Number(a.endIndex ?? a.end_index ?? 0),
        text: String(a.text ?? ''),
        comment: String(a.comment ?? ''),
        suggestion: String(a.suggestion ?? ''),
      }));
      const rubricRaw = payload?.grade_rubric ?? payload?.rubric ?? [];
      setAnalyzerResult({
        annotations,
        overallScore: typeof payload?.overall_score === 'number' ? payload.overall_score : null,
        gradeEstimate: payload?.grade_estimate ?? null,
        clarityRating: typeof payload?.clarity_rating === 'number' ? payload.clarity_rating : null,
        topSuggestions: Array.isArray(payload?.top_suggestions) ? payload.top_suggestions : [],
        rubric: Array.isArray(rubricRaw)
          ? rubricRaw.map((r: Record<string, unknown>) => ({
              category: String(r.category ?? r.criterion ?? 'Criterion'),
              score: typeof r.score === 'number' ? r.score : undefined,
              maxScore: typeof r.maxScore === 'number' ? r.maxScore : typeof r.max_score === 'number' ? r.max_score : undefined,
              feedback: typeof r.feedback === 'string' ? r.feedback : undefined,
            }))
          : [],
      });
    } catch (e) {
      console.error('[Documents] analyze error', e);
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      setAnalyzerError(
        aborted
          ? 'Analysis timed out. Your connection may be slow — please try again.'
          : e instanceof Error ? e.message : 'Could not run the analysis.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      setAnalyzerLoading(false);
      // An analysis just consumed quota — refresh the count.
      void refreshUsage();
    }
  }, [openDocId, openDoc, analyzerLoading, refreshUsage]);

  // ─── Apply revision ─────────────────────────────────────────
  // The analyzer's `suggestion` field is ADVISORY prose ("Revise
  // to: …", "Consider rephrasing…") — splicing it in verbatim is
  // wrong (the user saw the "revise to:" preamble + quote marks).
  // Instead we hit POST /api/analysis/inline-revision, which runs
  // a focused model call that returns CLEAN replacement prose
  // ready to splice. That endpoint is Pro/Premium-gated, so a 403
  // surfaces an upgrade nudge rather than a silent no-op.
  const handleApplyRevision = useCallback(async (annotationId: string) => {
    if (!editorRef.current || !analyzerResult || applyingAnnotationId) return;
    // Already applied → nothing to do (the card shows "Revert").
    if (appliedRevisions.has(annotationId)) return;
    const ann = analyzerResult.annotations.find((a) => a.id === annotationId);
    if (!ann) return;

    // Free users: don't hit the (Pro-gated) endpoint or eat a 403 —
    // show a teased upgrade moment with what the rewrite would do.
    // No API call, no cost.
    if (!isPaidPlan(user)) {
      setRevisionPaywallAnn({ text: ann.text || '', suggestion: ann.suggestion || '' });
      return;
    }

    // Re-apply path: we already fetched this revision once. Reuse it
    // verbatim — no second API call, no matter how many times the
    // user reverts and re-applies the same annotation.
    const cached = revisionCacheRef.current.get(annotationId);
    if (cached) {
      setAnalyzerError(null);
      const { ok, originalText } = applyAnnotationRevision(editorRef.current, ann, cached);
      if (!ok) {
        setAnalyzerError("Couldn't locate that passage in the current draft. It may have been edited. Re-run analysis and try again.");
        return;
      }
      setAppliedRevisions((prev) => {
        const next = new Map(prev);
        next.set(annotationId, { originalText, replacementText: cached });
        return next;
      });
      return;
    }

    const fullDocument = latestTextRef.current || openDoc?.contentText || '';
    if (!fullDocument.trim()) return;

    // The backend rejects (400) unless fullDocument.slice(start,end)
    // EXACTLY equals highlightedText. The annotation's stored
    // offsets were computed against the text at analyze time, so
    // any edit since — or a restored prior analysis — makes them
    // drift and every Apply fails. Re-derive the indices from the
    // text we're actually sending so they always line up. If the
    // passage can't be found verbatim, the draft changed too much
    // to safely revise → tell the user to re-run analysis.
    const needle = (ann.text || '').trim();
    let startIndex = ann.startIndex;
    let endIndex = ann.endIndex;
    if (!needle || fullDocument.slice(startIndex, endIndex) !== needle) {
      let idx = fullDocument.indexOf(needle);
      if (!needle || idx === -1) {
        setAnalyzerError("Couldn't find that exact passage in your current draft — re-run the analysis so the feedback matches your latest text, then apply.");
        return;
      }
      // Multiple matches → pick the one closest to the original
      // offset so we revise the passage the user expects.
      let nextIdx = fullDocument.indexOf(needle, idx + 1);
      if (nextIdx !== -1) {
        let best = idx;
        let bestDist = Math.abs(idx - ann.startIndex);
        while (nextIdx !== -1) {
          const d = Math.abs(nextIdx - ann.startIndex);
          if (d < bestDist) { best = nextIdx; bestDist = d; }
          nextIdx = fullDocument.indexOf(needle, nextIdx + 1);
        }
        idx = best;
      }
      startIndex = idx;
      endIndex = idx + needle.length;
    }

    setApplyingAnnotationId(annotationId);
    setAnalyzerError(null);
    try {
      const res = await fetch(`${API_URL}/analysis/inline-revision`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullDocument,
          highlightedText: needle,
          startIndex,
          endIndex,
          annotationType: ann.type,
          comment: ann.comment ?? '',
          suggestion: ann.suggestion ?? '',
        }),
      });
      const json = await res.json();
      if (res.status === 403) {
        setAnalyzerError(json?.message || 'Apply revisions is a Pro/Premium feature. Upgrade to use one-click revisions.');
        return;
      }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Revision failed (${res.status})`);
      }
      const replacement: string = (json?.data?.replacement ?? '').trim();
      if (!replacement) throw new Error('The model returned an empty revision.');

      // Cache BEFORE applying so even a failed splice still saves the
      // one paid call — a retry/re-apply never hits the API again.
      revisionCacheRef.current.set(annotationId, replacement);

      const { ok, originalText } = applyAnnotationRevision(editorRef.current, ann, replacement);
      if (!ok) {
        setAnalyzerError("Couldn't locate that passage in the current draft. It may have been edited. Re-run analysis and try again.");
        return;
      }
      setAppliedRevisions((prev) => {
        const next = new Map(prev);
        next.set(annotationId, { originalText, replacementText: replacement });
        return next;
      });
    } catch (e) {
      console.error('[Documents] apply-revision error', e);
      setAnalyzerError(e instanceof Error ? e.message : 'Could not apply that revision.');
    } finally {
      setApplyingAnnotationId(null);
    }
  }, [analyzerResult, applyingAnnotationId, appliedRevisions, openDoc, user]);

  // ─── Revert revision ────────────────────────────────────────
  // Always returns the card to the un-applied state so the user is
  // never stuck. The actual text swap is robust (exact match, then
  // a prefix/suffix anchor that survives edits inside the revision).
  // If even that can't find it, we still reset the UI + tell the
  // user — and the fetched revision stays cached so re-applying is
  // instant and free.
  const handleRevertRevision = useCallback((annotationId: string) => {
    if (!editorRef.current) return;
    const rec = appliedRevisions.get(annotationId);
    if (!rec) return;
    const ok = revertAnnotationRevision(editorRef.current, rec.replacementText, rec.originalText);
    // Clear applied state regardless — the toggle must always work.
    setAppliedRevisions((prev) => {
      const next = new Map(prev);
      next.delete(annotationId);
      return next;
    });
    if (ok) {
      setAnalyzerError(null);
    } else {
      setAnalyzerError("Auto-revert couldn't find the revised text (it was edited further). Press ⌘Z to undo, or edit it back — re-applying will reuse the saved revision instantly.");
    }
  }, [appliedRevisions]);

  // ─── Full report ────────────────────────────────────────────
  // Open the SAVED comprehensive analysis in the legacy /analysis
  // page editorial layout. AnalysisPage has two distinct entry
  // modes that key off DIFFERENT localStorage flags:
  //   • `selectedDocumentId`        — preselect a doc in the
  //                                    NEW-analysis flow (picker
  //                                    + "Analyze Now" button).
  //   • `viewAnalysisDocumentId`    — RENDER the existing saved
  //     + `viewAnalysisType`          report (rubric + annotations
  //     + `cameFromLibrary`           in the editorial layout).
  // We want the second mode — same keys the Library + Upload pages
  // already use when they hand off to "View report".
  const handleOpenFullReport = useCallback(() => {
    if (!openDocId || !openDoc) return;
    try {
      localStorage.setItem('viewAnalysisDocumentId', openDocId);
      localStorage.setItem('viewAnalysisType', 'comprehensive');
      // Opened from the editor (not the library) — closing the full
      // report must return to THIS document in the editor, not bounce
      // to the library. cameFromLibrary is explicitly cleared so the
      // old library-return path doesn't win.
      localStorage.setItem('analysisReturnToEditorDocId', openDocId);
      localStorage.removeItem('cameFromLibrary');
      if (openDoc.title) localStorage.setItem('selectedDocumentTitle', openDoc.title);
    } catch {
      /* localStorage failures are non-fatal — the page will fall
         back to the document picker. */
    }
    onNavigate('analysis');
  }, [onNavigate, openDocId, openDoc]);

  // Reset analyzer state when switching documents so the previous
  // doc's annotations don't leak across.
  useEffect(() => {
    setAnalyzerResult(null);
    setAnalyzerOpen(false);
    setAnalyzerError(null);
    setSelectedAnnotationId(null);
    setAppliedRevisions(new Map());
    revisionCacheRef.current.clear();
    setApplyingAnnotationId(null);
    setHoverAnnotationId(null);
    setHoverRect(null);
    latestTextRef.current = openDoc?.contentText ?? '';
  }, [openDocId, openDoc?.contentText]);

  // ─── Restore previously-saved analysis on open ───────────────
  // GET /api/analysis/document/:id returns the most recent
  // comprehensive analysis for this doc (if any). If found, hydrate
  // the panel state immediately so reopening a doc keeps its
  // existing inline annotations + score card without re-spending
  // an analyzer call. The user can still hit "Re-analyze" to
  // refresh against the latest text.
  useEffect(() => {
    if (!openDocId) return;
    // Reset synchronously (effect is keyed to openDocId) so the
    // auto-analyse gate below only opens once this lookup settles.
    setPriorAnalysisChecked(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/analysis/document/${openDocId}`, { headers: authHeaders() });
        if (!res.ok) return; // silent — no prior analysis is fine
        const json = await res.json();
        const row = json?.data?.comprehensive;
        if (!row || cancelled) return;
        const ar = row.analysis_results || row.analysisResults;
        if (!ar) return;
        const annotations = (ar.annotations ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id ?? Math.random()),
          type: (a.type as 'strong' | 'improve' | 'concern') ?? 'improve',
          startIndex: Number(a.startIndex ?? a.start_index ?? 0),
          endIndex: Number(a.endIndex ?? a.end_index ?? 0),
          text: String(a.text ?? ''),
          comment: String(a.comment ?? ''),
          suggestion: String(a.suggestion ?? ''),
        }));
        const rubricRaw = ar.grade_rubric ?? ar.gradeRubric ?? [];
        // grade_rubric stored as either an object keyed by category
        // or already-flattened array — normalise to array shape.
        const rubricArr = Array.isArray(rubricRaw)
          ? rubricRaw
          : typeof rubricRaw === 'object' && rubricRaw !== null
            ? Object.entries(rubricRaw).map(([category, val]) => {
                const v = val as Record<string, unknown>;
                return {
                  category,
                  score: typeof v?.score === 'number' ? v.score : undefined,
                  maxScore: typeof v?.maxScore === 'number' ? v.maxScore : typeof v?.max_score === 'number' ? v.max_score : undefined,
                  feedback: typeof v?.feedback === 'string' ? v.feedback : undefined,
                };
              })
            : [];
        if (cancelled) return;
        setAnalyzerResult({
          annotations,
          overallScore: typeof ar.overall_score === 'number' ? ar.overall_score : null,
          gradeEstimate: ar.grade_estimate ?? null,
          clarityRating: typeof ar.clarity_rating === 'number' ? ar.clarity_rating : null,
          topSuggestions: Array.isArray(ar.top_suggestions) ? ar.top_suggestions : [],
          rubric: rubricArr.map((r: Record<string, unknown>) => ({
            category: String(r.category ?? r.criterion ?? 'Criterion'),
            score: typeof r.score === 'number' ? r.score : undefined,
            maxScore: typeof r.maxScore === 'number' ? r.maxScore : typeof r.max_score === 'number' ? r.max_score : undefined,
            feedback: typeof r.feedback === 'string' ? r.feedback : undefined,
          })),
        });
        // Open the panel so the user sees the restored feedback.
        setAnalyzerOpen(true);
      } catch (e) {
        // Non-fatal — user can run a fresh analysis instead.
        console.warn('[Documents] restore prior analysis skipped:', e);
      } finally {
        if (!cancelled) setPriorAnalysisChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [openDocId]);

  // ─── Auto-analyse on analyse-intent entries ──────────────────
  // When the user came in via an "Analyze a paper" door (Analyze on
  // a hub doc, paste-to-analyse, upload-to-analyse), drop them into
  // the editor with the analyzer already running, so the flow is
  // upload/paste → graded → apply fixes, not editor → hunt for
  // Analyze → fix. Gated on priorAnalysisChecked so a cached result
  // (restored above, which also opens the panel) wins and we never
  // double-spend an analysis credit. Plain open/edit and
  // write-from-scratch leave analyzeOnOpenRef false → never fires.
  useEffect(() => {
    if (view !== 'editor' || !openDocId || !openDoc) return;
    if (!analyzeOnOpenRef.current) return;
    if (!priorAnalysisChecked) return; // wait for the cached-analysis lookup
    if (analyzerResult || analyzerLoading) return; // cached restored, or already running
    const hasText = (latestTextRef.current || openDoc.contentText || '').trim().length > 0;
    if (!hasText) return; // wait until the doc's text is loaded
    analyzeOnOpenRef.current = false;
    void handleAnalyzeInEditor();
  }, [view, openDocId, openDoc, priorAnalysisChecked, analyzerResult, analyzerLoading, handleAnalyzeInEditor]);

  // Pull the remaining-analyses count whenever a document opens so
  // the editor's top-right chip is accurate before they analyze.
  useEffect(() => {
    if (view === 'editor' && openDocId) void refreshUsage();
  }, [view, openDocId, refreshUsage]);

  // ─── Render ───────────────────────────────────────────────────
  const handleRailSelect = (v: WorkspaceView) => {
    setView(v);
    if (v === 'hub') {
      try { window.history.pushState({}, '', '/documents'); } catch { /* ignore */ }
    }
  };

  if (view === 'editor' && openDocId) {
    if (!openDoc) {
      return (
        <WorkspaceShell activeView={view} onSelect={handleRailSelect} bare headerless collapsed={railCollapsed} onToggle={() => setRailCollapsed((v) => !v)} usage={docUsage} onUpgrade={() => onNavigate('pricing')}>
          <div className="px-4 py-16 text-center text-sm font-bold text-stone-500">Loading document…</div>
        </WorkspaceShell>
      );
    }
    return (
      <WorkspaceShell activeView={view} onSelect={handleRailSelect} bare headerless collapsed={railCollapsed} onToggle={() => setRailCollapsed((v) => !v)} usage={docUsage} onUpgrade={() => onNavigate('pricing')}>
        <DocumentEditorView
          docId={openDoc.id}
          initialTitle={openDoc.title}
          initialHtml={openDoc.contentHtml || (openDoc.contentText ? `<p>${openDoc.contentText.replace(/\n+/g, '</p><p>')}</p>` : '')}
          onTitleSave={handleTitleSave}
          onContentSave={handleContentSave}
          onBack={handleBackToHub}
          onAnalyze={handleAnalyzeInEditor}
          analyzerResult={analyzerResult}
          analyzerLoading={analyzerLoading}
          analyzerError={analyzerError}
          analyzerOpen={analyzerOpen}
          onAnalyzerClose={() => setAnalyzerOpen(false)}
          onReopenAnalyzer={() => setAnalyzerOpen(true)}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={setSelectedAnnotationId}
          onAnnotationHover={(id, rect) => { setHoverAnnotationId(id); setHoverRect(rect); }}
          hoverAnnotationId={hoverAnnotationId}
          hoverRect={hoverRect}
          onEditorReady={(ed) => { editorRef.current = ed; }}
          onApplyRevision={handleApplyRevision}
          onRevertRevision={handleRevertRevision}
          appliedAnnotationIds={new Set(appliedRevisions.keys())}
          applyingAnnotationId={applyingAnnotationId}
          onOpenFullReport={handleOpenFullReport}
          wordLimit={isPaidPlan(user) || !FREE_EDITOR_WORD_LIMIT ? null : FREE_EDITOR_WORD_LIMIT}
          onUpgrade={() => onNavigate('pricing')}
          analysesLeft={analysesLeft}
          revisionsLocked={!isPaidPlan(user)}
          revisionPaywallAnn={revisionPaywallAnn}
          onCloseRevisionPaywall={() => setRevisionPaywallAnn(null)}
        />
        {/* Tooltip fade keyframes — hosted at the page level so the
            tooltip's portal'd rendering never loses its animation. */}
        <style>{`
          @keyframes wsTooltipIn {
            0%   { opacity: 0; transform: translateY(-100%) translateY(-4px) scale(0.96); }
            100% { opacity: 1; transform: translateY(-100%) translateY(0)    scale(1); }
          }
          .ws-tooltip-in { animation: wsTooltipIn 140ms cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: 50% 100%; }
        `}</style>
      </WorkspaceShell>
    );
  }

  return (
    <>
      <WorkspaceShell
        activeView={view}
        onSelect={handleRailSelect}
        usage={docUsage}
        onUpgrade={() => onNavigate('pricing')}
      >
        {view === 'hub' && (
          <DocumentsHub
            docs={docList}
            loading={listLoading}
            onNew={handleNewDoc}
            onOpen={handleOpenDoc}
            onUpload={handleUpload}
            onAnalyze={handleAnalyzeFromHub}
            onDownload={handleDownload}
            onDelete={(id) => setConfirmDeleteId(id)}
            userName={firstNameOf(user)}
            usage={docUsage}
          />
        )}
        {view === 'analyze' && (
          <>
            <PanelHeader
              eyebrow="Feedback"
              title="Analyze a paper"
              subtitle="Get professor-style feedback marked up right inside the document: strengths, fixes, and a grade estimate."
            />
            <AnalyzePanel
              docs={docList}
              loading={listLoading}
              onPickDoc={handleAnalyzeFromHub}
              onPasteAnalyze={handlePasteAnalyze}
              onUploadFile={handleUploadAndAnalyze}
              onNew={handleNewDoc}
            />
          </>
        )}
        {view === 'daily-review' && (
          <>
            <PanelHeader
              eyebrow="Review"
              title="Daily review"
              subtitle="A quick recall session pulled from everything you've studied. Keep your streak alive."
            />
            <DailyReviewTab
              user={user}
              onNavigate={onNavigate}
              onSwitchTool={(t: string) => setView(t === 'study_pack' ? 'study-packs' : 'hub')}
            />
          </>
        )}
        {view === 'study-packs' && (
          <>
            <PanelHeader
              eyebrow="Study"
              title="Study packs"
              subtitle="Turn any notes into a lesson, flashcards, a quiz, a crossword and arcade games."
            />
            <StudyPacksPanel onNavigate={onNavigate} />
          </>
        )}
        {view === 'citations' && (
          <>
            <PanelHeader
              eyebrow="Research"
              title="Citations"
              subtitle="Describe your topic and get real, citable sources with ready-to-use sentences in your style."
            />
            <CitationsPanel onNavigate={onNavigate} />
          </>
        )}
        {view === 'games' && (
          <>
            <PanelHeader
              eyebrow="Play"
              title="Games"
              subtitle="Drill recall the fun way. Load them with your own notes via Study Packs."
            />
            <GamesPanel onNavigate={onNavigate} onOpenStudyPacks={() => setView('study-packs')} />
          </>
        )}
      </WorkspaceShell>
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border-2 border-[#FF4B4B] bg-white dark:bg-stone-900 px-4 py-2 text-sm font-extrabold text-[#FF4B4B] shadow-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 text-[11px] font-bold text-stone-500 underline">dismiss</button>
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          docTitle={docList.find((d) => d.id === confirmDeleteId)?.title ?? 'Untitled'}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}
      {pdfNoticeFile && (
        <PdfNoticeModal
          fileName={pdfNoticeFile.name}
          onCancel={() => setPdfNoticeFile(null)}
          onConfirm={() => {
            const f = pdfNoticeFile;
            setPdfNoticeFile(null);
            if (f) void runUpload(f);
          }}
        />
      )}
    </>
  );
}

/* PDFs carry no recoverable structure (no real headings/bold/italic
   — see the editor export notes), so they import as clean plain
   text. This heads-up sets that expectation before the import and
   points formatting-sensitive users at .docx. */
function PdfNoticeModal({ fileName, onCancel, onConfirm }: { fileName: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-[0_24px_60px_-28px_rgba(96,48,140,0.45)]">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 mb-4">
          <svg className="w-6 h-6 text-[#A560E8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Heads up — PDF formatting
        </h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
          PDFs don’t store structure, so <span className="font-extrabold text-stone-800 dark:text-stone-100">“{fileName}”</span> will come in as
          {' '}clean plain text — <span className="font-extrabold">bold, italics, headings and layout may be lost</span>.
        </p>
        <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
          For full formatting, upload the <span className="font-extrabold text-[#8A48C7] dark:text-[#C9A0F0]">.docx</span> version instead.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">
            Import as text
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ docTitle, onCancel, onConfirm }: { docTitle: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6">
        <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Delete "{docTitle}"?
        </h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 font-medium">
          This permanently removes the document and any saved drafts. This can't be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-[#FF4B4B] hover:bg-[#E04343] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
