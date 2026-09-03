import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import WriteEditor, { exportHtmlAsDocx } from '../write/WriteEditor';
import mammoth from 'mammoth';
import AnalyzerPanel, { type AnalyzerResult } from './AnalyzerPanel';
import AnalysisReportView from './AnalysisReportView';
import type { AnnotatorAnnotation } from './analyzerExtension';
import { applyAnnotationRevision, revertAnnotationRevision, normalizeAnnotations, normalizeAnnotationType, normalizeTopSuggestions } from './analyzerExtension';
import type { Editor } from '@tiptap/react';
import DailyReviewTab from '../pages/DailyReviewTab';
import CitationsPanel from './panels/CitationsPanel';
import StudyPacksPanel from './panels/StudyPacksPanel';
import GamesPanel from './panels/GamesPanel';
import PreviewStrip from './panels/PreviewStrip';
import SoftPaywall from '../common/SoftPaywall';
import { FREE_EDITOR_WORD_LIMIT } from '../../config/featureFlags';
import { getTotalXP, getLevelInfo, getUnlockedCount, BADGES } from '../../data/achievements';
import type { WorkspaceView } from '../workspace/types';
import { SIDEBAR_TOOLS } from '../workspace/sidebarTools';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import DashboardTopBar from '../common/DashboardTopBar';
import Footer from '../common/Footer';
import PromoBanner from '../common/PromoBanner';
import GenerationOverlay from '../common/GenerationOverlay';
import ViewportAutoplayVideo from '../common/ViewportAutoplayVideo';
import { consumePendingWorkspaceView, WS_SWITCH_VIEW_EVENT } from '../workspace/workspaceNavigate';
import { trackEvent, trackFunnelStep } from '../../utils/analytics';
import { openUpgradePaywall } from '../../utils/paywall';
import {
  getOnboardingCompletedAt,
  isFirstRunFastPathDone,
  markFirstRunFastPathDone,
} from '../../constants/paywallSession';
import {
  getPrimaryFeatureInterest,
  HUB_NUDGE_AFTER_ONBOARDING_KEY,
  HIGHLIGHT_PACK_AFTER_ONBOARDING_KEY,
  STUDY_PACK_VIEWER_KEY,
} from '../../utils/featureInterests';

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

/** Grade format defaults to US; only pre-select UK if the last analysis used it. */
type GradingStyle = 'us' | 'uk';
type AnalyzeStyleOptions = { citationStyle: string; gradingStyle: GradingStyle };

const LAST_ANALYSIS_GRADING_KEY = 'writescholar_last_analysis_grading_style';
const PENDING_GRADING_KEY = 'writescholar_pending_grading_style';

function getDefaultGradingStyle(): GradingStyle {
  try {
    return localStorage.getItem(LAST_ANALYSIS_GRADING_KEY) === 'uk' ? 'uk' : 'us';
  } catch {
    return 'us';
  }
}

function persistLastAnalysisGradingStyle(style: GradingStyle) {
  try {
    localStorage.setItem(LAST_ANALYSIS_GRADING_KEY, style);
  } catch {
    /* noop */
  }
}

/** Hub picker → editor auto-analyze bridge (consumed once on first analyze). */
function stagePendingGradingStyle(style: GradingStyle) {
  try {
    localStorage.setItem(PENDING_GRADING_KEY, style);
  } catch {
    /* noop */
  }
}

function consumePendingGradingStyle(): GradingStyle | null {
  try {
    const v = localStorage.getItem(PENDING_GRADING_KEY);
    localStorage.removeItem(PENDING_GRADING_KEY);
    return v === 'uk' || v === 'us' ? v : null;
  } catch {
    return null;
  }
}

function resolveGradingStyleForAnalyze(opts?: AnalyzeStyleOptions): GradingStyle {
  if (opts?.gradingStyle) return opts.gradingStyle;
  const pending = consumePendingGradingStyle();
  if (pending) return pending;
  return getDefaultGradingStyle();
}

type HubStudyPack = {
  id: string;
  title: string;
  createdAt: string;
  questions: unknown;
  /** Free packs expire; null means keep forever. */
  expiresAt?: string | null;
};

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
  /** Free never-paid docs expire; null means keep forever. */
  expiresAt?: string | null;
  /** Plain-text snippet of the document body (server-trimmed). */
  contentPreview: string;
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

/* The whole product is now one page. The left rail swaps the main
   area between these views — no route changes, no page jumps. The
   editor is the only view that hides the rail (it needs the width
   + a distraction-free surface). */

interface DocumentsPageProps {
  /** Optional: open this doc immediately on mount. */
  initialDocumentId?: string;
  /** Caller-provided — used for the few flows that still leave the
      workspace (pricing upgrade, full report, auth redirects). */
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  /** Sign-out handler — surfaced in the workspace top-bar avatar
      menu now that the global Header is hidden on /dashboard. */
  onLogout?: () => void;
  /** Logged-in user — threaded into the embedded tools (Daily
      Review streak key, plan-gating, etc.). */
  user?: Record<string, unknown> | null;
  /** Fires when the workspace enters/leaves the full-screen editor.
      The shell uses this to hide the global site header (and free up
      vertical space) while a document is open. */
  onEditorActiveChange?: (active: boolean) => void;
  /** Free, never-trialed user in the post-onboarding trial gate. They can
      browse the dashboard, but any create / upload / tool-switch action
      calls `onTrialGate` (which opens the app-level hard-paywall overlay)
      instead of running. */
  trialGated?: boolean;
  onTrialGate?: () => void;
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
  Wand: () => (<svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5l4 4L9 19H5v-4l9.5-9.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.5 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></svg>),
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

/* ─── Shared panel chrome ────────────────────────────────────
   Every tool panel opens with the same header so the workspace
   feels cohesive no matter which tool you're in. */
/* ─── PanelHeader — colourful banner above each sub-page ────────
 *
 * When given a `tint` (one of the SIDEBAR_TOOLS palette entries),
 * renders as a full-width gradient banner in the tool's brand
 * colour, with a mascot tucked in the right side. Matches the
 * dashboard hero aesthetic so the workspace feels consistent.
 *
 * Without a tint, falls back to the original plain header for
 * backwards compatibility.
 */
function PanelHeader({
  eyebrow,
  title,
  subtitle,
  right,
  tint,
  mascotSrc,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Brand palette — usually one entry from SIDEBAR_TOOLS. When
   *  omitted, falls back to the neutral original layout. */
  tint?: { tint: string; tintBg: string; border?: string; icon?: React.ReactNode };
  /** Optional mascot image shown in the banner's right side. */
  mascotSrc?: string;
}) {
  if (!tint) {
    // Fallback — original neutral layout.
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

  // Clean dashboard-style header — a brand-coloured icon chip beside a
  // dark Nunito title on the page background (no saturated banner), so
  // every tool page reads like the redesigned home instead of the old
  // gradient hero. The tool's own icon + colour anchor each page.
  return (
    <div className="mb-6 sm:mb-7 flex items-center gap-3.5 sm:gap-4">
      {/* Tool icon chip — same chunky, brand-coloured chip language as
          the dashboard "Pick a tool" cards. */}
      <span
        className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.4)] [&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-7 sm:[&>svg]:w-7"
        style={{ backgroundColor: tint.tint, borderColor: shadeColor(tint.tint, -28) }}
        aria-hidden
      >
        {tint.icon ?? null}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.22em] mb-1"
          style={{ color: tint.tint }}
        >
          {eyebrow}
        </p>
        <h1
          className="text-[1.7rem] sm:text-[2rem] lg:text-[2.3rem] font-extrabold leading-[1.04] tracking-tight text-stone-900 dark:text-stone-50"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px] sm:text-[15px] font-bold text-stone-500 dark:text-stone-400 leading-snug max-w-2xl">
            {subtitle}
          </p>
        )}
        {right && <div className="mt-4">{right}</div>}
      </div>
      {mascotSrc && (
        <img
          src={mascotSrc}
          alt=""
          aria-hidden
          className="hidden md:block w-16 h-16 lg:w-20 lg:h-20 object-contain shrink-0 self-start drop-shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
          loading="eager"
          decoding="async"
        />
      )}
    </div>
  );
}

/** Lighten or darken a hex colour by `percent` (negative darkens).
 *  Used by PanelHeader to derive a gradient end-stop + border tone
 *  from a single brand colour, so we don't have to hand-pick a full
 *  palette for every PanelHeader call. */
function shadeColor(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const adj = (c: number) => {
    const v = Math.round(c + (percent / 100) * (percent < 0 ? c : 255 - c));
    return Math.max(0, Math.min(255, v));
  };
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`;
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

  /* ─── Citation + grading picker ─────────────────────────────
   * When the user drops, pastes or picks a doc to analyse, we
   * show a small modal first so they can tailor the citation
   * style (APA / Harvard / etc.) and grade format (US / UK)
   * before the actual analysis runs. Selections are persisted
   * to the same localStorage keys the analyzer service reads,
   * so the editor's flow picks them up automatically. */
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [citationStyle, setCitationStyleState] = useState<string>(() => {
    try { return localStorage.getItem('writescholar_editor_citation_style') || 'None'; } catch { return 'None'; }
  });
  const [gradingStyle, setGradingStyleState] = useState<GradingStyle>(getDefaultGradingStyle);
  const updateCitationStyle = (v: string) => {
    setCitationStyleState(v);
    try { localStorage.setItem('writescholar_editor_citation_style', v); } catch { /* noop */ }
  };
  const updateGradingStyle = (v: GradingStyle) => {
    setGradingStyleState(v);
  };
  /** Wraps any analyze trigger so the picker shows first. The
   *  `action` is captured in state and invoked on confirm. */
  const askThenRun = (action: () => void) => {
    setGradingStyleState(getDefaultGradingStyle());
    setPendingAction(() => action);
    setOptionsOpen(true);
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    // .docx / .txt keep their formatting — route through the same
    // mammoth-based uploader the hub uses (preserves bold, italics,
    // underline, paragraphs, headings) instead of flattening to
    // plain text via the server parser. PDFs/.doc still parse to
    // text (no rich structure to recover anyway).
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.txt')) {
      askThenRun(() => onUploadFile(file));
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
      askThenRun(() => onPasteAnalyze(content));
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div>
      {/* ── ANALYZE CARD — premium gradient frame ─────────────────── */}
      <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-[#C79BF2] via-[#A560E8] to-[#7733B5] shadow-[0_28px_60px_-30px_rgba(165,96,232,0.7)]">
        <div className="relative overflow-hidden rounded-[26px] bg-white dark:bg-stone-900 p-5 sm:p-7">
          {/* Ambient glow + faint grid texture */}
          <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#C79BF2]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(120,113,108,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.8) 1px, transparent 1px)', backgroundSize: '26px 26px' }} aria-hidden />

          {/* Header */}
          <div className="relative flex items-center gap-3.5 mb-5">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#BD8BF0] to-[#A560E8] text-white text-xl border-2 border-b-[3px] border-[#7733B5] shadow-[0_10px_24px_-10px_rgba(165,96,232,0.9)]" aria-hidden>
              ✦
            </span>
            <div className="min-w-0">
              <h2 className="text-[19px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Get essay feedback</h2>
              <p className="text-[12.5px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">Upload or paste your essay — we&apos;ll mark it up with professor-style notes and a grade.</p>
            </div>
          </div>

          {/* Drop zone */}
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
            className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ${
              parsing ? 'opacity-70 cursor-wait pointer-events-none' : ''
            } ${
              dropActive
                ? 'scale-[1.005] border-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/10'
                : 'border-[#A560E8]/30 dark:border-stone-600 bg-[#FBF8FF] dark:bg-stone-800/60 hover:border-[#A560E8]/70 hover:bg-[#F3EAFF]/60'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }}
            />
            <div className="px-6 py-8 text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3EAFF] to-[#E9DBFF] dark:bg-[#A560E8]/15 text-[#A560E8] border-2 border-[#A560E8]/25 transition-transform group-hover:-translate-y-0.5">
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
                    <span key={t} className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 border border-[#A560E8]/20 text-[10px] font-extrabold uppercase tracking-wide text-[#8A48C7] dark:text-stone-400">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {fileError && <p className="mt-2 text-[12px] font-bold text-[#D63A3A]">{fileError}</p>}

          {/* OR divider */}
          <div className="relative my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">or paste it</span>
            <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
          </div>

          {/* Paste */}
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="analyze-paste-input" className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Paste your essay</label>
            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold tabular-nums px-2 py-0.5 rounded-full transition-colors ${words >= 50 ? 'text-[#8A48C7] bg-[#F3EAFF] dark:bg-[#A560E8]/15' : 'text-stone-400 bg-stone-100 dark:bg-stone-800'}`}>
              {words >= 50 && (<svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
              {words} words
            </span>
          </div>
          <textarea
            id="analyze-paste-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste your draft here. It saves as a document and opens in the editor, where you can run the analysis when you're ready."
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 focus:border-[#A560E8] resize-y transition-all"
          />
          <div className="mt-4 flex items-center gap-2">
            {words > 0 && words < 50 && <p className="text-[11px] font-bold text-stone-400">Add {50 - words} more words.</p>}
            <button
              type="button"
              onClick={() => askThenRun(() => onPasteAnalyze(text))}
              disabled={words < 50}
              className="group ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#A560E8] to-[#8A48C7] hover:from-[#8A48C7] hover:to-[#7733B5] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] enabled:hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_28px_-12px_rgba(165,96,232,0.9)]"
            >
              Open in editor
              <svg className="w-4 h-4 transition-transform group-enabled:group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
          </div>

          {/* What you'll get — value reinforcement chips */}
          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 mr-0.5">You&apos;ll get</span>
            {['📝 Margin notes', '📊 Rubric breakdown', '🎯 Grade estimate'].map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-full bg-[#FBF8FF] dark:bg-[#A560E8]/10 border border-[#A560E8]/25 text-[11px] font-extrabold text-[#8A48C7] dark:text-[#C79BF2]">{c}</span>
            ))}
          </div>
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
                onClick={() => askThenRun(() => onPickDoc(d.id))}
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

      {/* ─── Citation + grading picker ──────────────────────────
          Always shown before the analyser actually runs, so the
          user can tailor it to their assignment (APA / Harvard /
          IEEE etc., and US A-F vs UK class) before we burn an
          analysis. Saved to localStorage so the same choices
          carry over to the editor flow. */}
      {optionsOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOptionsOpen(false)}
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
                Tailor your analysis
              </h3>
            </div>
            <p className="text-[13px] text-stone-600 dark:text-stone-300 font-medium leading-snug mb-3">
              Pick your citation style and grade format so the rubric and feedback match your assignment.
            </p>

            <div className="grid gap-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 p-3">
              <div>
                <label htmlFor="ws-ap-cite-style" className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-400 mb-1.5">Citation style</label>
                <select
                  id="ws-ap-cite-style"
                  value={citationStyle}
                  onChange={(e) => updateCitationStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 transition-colors"
                >
                  <option value="None">None (no citations required)</option>
                  <option value="APA">APA</option>
                  <option value="Harvard">Harvard</option>
                  <option value="Chicago">Chicago</option>
                  <option value="MLA">MLA</option>
                  <option value="IEEE">IEEE</option>
                  <option value="Vancouver">Vancouver</option>
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-400 mb-1.5">Grade format</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['us', 'uk'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateGradingStyle(g)}
                      className={`px-3 py-2 rounded-lg text-sm font-extrabold border-2 transition-all ${
                        gradingStyle === g
                          ? 'bg-[#A560E8] text-white border-[#7733B5]'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/40'
                      }`}
                    >
                      {g === 'us' ? 'US (A–F · /100)' : 'UK (class · %)'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] font-bold text-stone-400 leading-snug">Defaults to US; UK is pre-selected only if you used it on your last analysis.</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setOptionsOpen(false); setPendingAction(null); }}
                className="px-4 py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOptionsOpen(false);
                  try { localStorage.setItem('writescholar_editor_citation_style', citationStyle); } catch { /* noop */ }
                  stagePendingGradingStyle(gradingStyle);
                  // Defer to next tick so the modal close animation
                  // doesn't jank the underlying action's transition.
                  const fn = pendingAction;
                  setPendingAction(null);
                  if (fn) setTimeout(fn, 0);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <I.Sparkle />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Edited 2 days ago" style stamp for the document rows. */
function editedAgo(iso: string | null | undefined): string {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  const months = Math.max(1, Math.floor(days / 30));
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function expiresInLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (!Number.isFinite(days)) return null;
  if (days <= 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/* ─── DocumentRow — one document in the dashboard's recents list and
 * in the full My Documents library. The whole row opens the doc; the
 * ⋮ menu holds download + delete. */
function DocumentRow({
  doc,
  onOpen,
  onDownload,
  onDelete,
  onUpgrade,
  elevated = false,
  highlighted = false,
  kind = 'document',
}: {
  doc: Pick<DocSummary, 'id' | 'title' | 'wordCount' | 'lastEditedAt' | 'updatedAt'> & { expiresAt?: string | null };
  onOpen: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onUpgrade?: () => void;
  /** Hub-style spaced card; library keeps the compact list row. */
  elevated?: boolean;
  /** First-run after onboarding — this is the paper they just analysed. */
  highlighted?: boolean;
  kind?: 'document' | 'pack';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  const placeMenu = useCallback(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    placeMenu();
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || menuPanelRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onReposition = () => placeMenu();
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [menuOpen, placeMenu]);

  const isPack = kind === 'pack';
  const expiryLabel = expiresInLabel(doc.expiresAt);
  const words = isPack
    ? 'Study pack'
    : doc.wordCount
      ? `${doc.wordCount.toLocaleString()} words`
      : 'Empty';
  const showMenu = Boolean(onDownload || onDelete);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      aria-label={`Open ${doc.title || 'Untitled'}`}
      className={
        highlighted
          ? 'group relative flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer rounded-2xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_16px_36px_-18px_rgba(119,51,181,0.55)] ring-4 ring-[#A560E8]/15 motion-safe:animate-[hubDocPulse_1.8s_ease-in-out_infinite] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/40'
          : elevated
          ? 'group relative flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_1px_2px_rgba(60,40,90,0.04)] hover:border-[#C9A0F0] dark:hover:border-[#A560E8]/40 hover:shadow-[0_14px_28px_-20px_rgba(90,45,140,0.45)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/40'
          : 'group relative flex items-center gap-3.5 px-4 sm:px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#FBF8FF] dark:hover:bg-stone-800/60 focus:outline-none focus-visible:bg-[#F5EEFE] dark:focus-visible:bg-stone-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A560E8]/40'
      }
    >
      {!elevated && (
        <span
          className="pointer-events-none absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#A560E8] origin-top scale-y-0 opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
          aria-hidden
        />
      )}

      <span
        className={
          elevated
            ? 'shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3EAFF] to-[#E9DBFF] text-[#8A48C7] dark:from-[#A560E8]/25 dark:to-[#A560E8]/10 dark:text-[#C9A0F0] ring-1 ring-[#C9A0F0]/35 dark:ring-[#A560E8]/25 transition-transform duration-200 group-hover:scale-105'
            : 'shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAFF] text-[#A560E8] dark:bg-[#A560E8]/15 dark:text-[#C9A0F0] transition-colors group-hover:bg-[#EADCFB] dark:group-hover:bg-[#A560E8]/25'
        }
        aria-hidden
      >
        {isPack ? (
          <svg className={elevated ? 'w-[22px] h-[22px]' : 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5L21 12M3 16.5L12 21l9-4.5" />
          </svg>
        ) : (
          <svg className={elevated ? 'w-[22px] h-[22px]' : 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate transition-colors group-hover:text-[#7733B5] dark:group-hover:text-[#C9A0F0]">
          {doc.title || 'Untitled'}
        </p>
        {highlighted && (
          <span className="mt-1 inline-flex items-center rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7733B5] dark:text-[#C9A0F0]">
            Ready to view
          </span>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-stone-400 dark:text-stone-500">
            <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {editedAgo(doc.lastEditedAt || doc.updatedAt)}
          </span>
          <span
            className="inline-flex items-center h-[18px] px-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-extrabold tabular-nums text-stone-500 dark:text-stone-400"
          >
            {words}
          </span>
          {expiryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center h-[18px] px-1.5 rounded-md bg-red-50 dark:bg-red-950/40 text-[11px] font-extrabold tabular-nums text-red-600 dark:text-red-400">
                {expiryLabel}
              </span>
              {onUpgrade && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
                  className="inline-flex items-center h-[18px] px-1.5 rounded-md bg-[#FFC800] text-[11px] font-extrabold text-[#5A4500] hover:bg-[#F0BC00] transition-colors"
                >
                  <span className="sm:hidden">Keep forever</span>
                  <span className="hidden sm:inline">Upgrade to keep forever</span>
                </button>
              )}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        className={
          highlighted
            ? 'shrink-0 hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#A560E8] text-white text-[13px] font-extrabold hover:bg-[#7733B5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/45'
            : 'shrink-0 hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[13px] font-extrabold hover:bg-[#A560E8] hover:text-white dark:hover:bg-[#A560E8] dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/45'
        }
      >
        {highlighted ? (isPack ? 'Open pack' : 'See notes') : 'Open'}
        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      {showMenu && (
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          aria-label={`More actions for ${doc.title || 'Untitled'}`}
          aria-expanded={menuOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <svg className="w-4.5 h-4.5" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
        {menuOpen && menuPos && createPortal(
          <div
            ref={menuPanelRef}
            className="fixed z-[240] w-44 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_18px_38px_-18px_rgba(40,30,60,0.35)] overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onOpen(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {isPack ? <I.Pack /> : <I.Doc />} Open
            </button>
            {onDownload && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDownload(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <I.Download /> Download
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <I.Trash /> Delete
              </button>
            )}
          </div>,
          document.body,
        )}
      </div>
      )}
    </div>
  );
}

/** Loading placeholder rows for the document lists. */
function DocumentRowSkeleton({ elevated = false }: { elevated?: boolean }) {
  return (
    <div
      className={
        elevated
          ? 'flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-4 animate-pulse rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900'
          : 'flex items-center gap-3.5 px-4 sm:px-5 py-3.5 animate-pulse'
      }
    >
      <div className={`${elevated ? 'h-11 w-11 rounded-2xl' : 'h-10 w-10 rounded-xl'} bg-stone-100 dark:bg-stone-800 shrink-0`} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-1/3 rounded-full bg-stone-100 dark:bg-stone-800" />
        <div className="h-2.5 w-1/4 rounded-full bg-stone-100 dark:bg-stone-800" />
      </div>
      <div className="h-9 w-16 rounded-xl bg-stone-100 dark:bg-stone-800 shrink-0" />
    </div>
  );
}

/* ─── HUB view — the dashboard home ──────────────────────────────
 *
 * /dashboard landing: greeting, flagship essay-upload surface with a
 * real product preview, a quiet four-tool launch row, and recent docs.
 * Full library lives in the `docs` view ("My Documents" in the rail).
 */
function DocumentsHub({
  docs,
  packs,
  packsLoading,
  loading,
  onNew,
  onOpen,
  onOpenPack,
  onUpload,
  onDownload,
  onDelete,
  userName,
  user,
  usage,
  onSwitchView,
  onNavigate,
  topBar,
  highlightDocId,
  highlightPack,
  highlightTool,
  onDismissHighlight,
  onOpenHighlightedPack,
  onOpenHighlightedTool,
}: {
  docs: DocSummary[];
  packs: HubStudyPack[];
  packsLoading?: boolean;
  loading: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onOpenPack: (pack: HubStudyPack) => void;
  onUpload: (file: File) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  userName: string;
  /** Logged-in user — only used to personalise the tool order. */
  user: { id?: string } | null | undefined;
  usage: { used: number; limit: number | null; plan: string } | null;
  onSwitchView: (v: WorkspaceView) => void;
  /** Top-level navigation (e.g. to /pricing) — used by the expiry
      urgency banner so it can route free users to upgrade. */
  onNavigate: (page: string) => void;
  /** Account controls (Saved Materials / Pomodoro / avatar). Sits in
      the greeting row so the header reads as one band. */
  topBar?: React.ReactNode;
  /** Paper just analysed in onboarding — highlight it on first landing. */
  highlightDocId?: string | null;
  /** Study pack just built in onboarding — highlight the Study Pack tile. */
  highlightPack?: boolean;
  /** Games / Daily Review-only onboarding — highlight that tool. */
  highlightTool?: 'games' | 'daily-review' | null;
  onDismissHighlight?: () => void;
  onOpenHighlightedPack?: () => void;
  onOpenHighlightedTool?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadDropActive, setUploadDropActive] = useState(false);

  const planLower = String((usage?.plan ?? 'free')).toLowerCase();
  const isPaidUser = planLower === 'pro' || planLower === 'premium';

  /* ─── Expiry snapshot for the free-user "your stuff is about to
   * vanish" banner. We aggregate study materials + citation searches
   * and anchor the countdown on the soonest-expiring item. Paid users
   * skip the whole flow. */
  const [expiryInfo, setExpiryInfo] = useState<
    | { materialCount: number; citationCount: number; documentCount: number; soonestDays: number }
    | null
  >(null);

  useEffect(() => {
    if (isPaidUser) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${API_URL}/analysis/quiz-history?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const rows: unknown[] = Array.isArray(data) ? data : (data?.data ?? data?.quizzes ?? []);
        if (cancelled) return;
        const objs = rows.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object');

        let citationObjs: Record<string, unknown>[] = [];
        try {
          const cRes = await fetch(`${API_URL}/analysis/citation-history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cRes.ok) {
            const cData = await cRes.json().catch(() => null);
            const cRows: unknown[] = Array.isArray(cData) ? cData : (cData?.data ?? []);
            citationObjs = cRows.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object');
          }
        } catch { /* ignore citation fetch failures */ }
        if (cancelled) return;

        const now = Date.now();
        const toDays = (iso: string) => Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
        const materialDays = objs
          .map((r) => (r as { expires_at?: string | null }).expires_at)
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
          .map(toDays).filter((d) => d >= 0);
        const citationDays = citationObjs
          .map((r) => (r.expires_at as string | null | undefined) ?? null)
          .filter((d): d is string => typeof d === 'string' && d.length > 0)
          .map(toDays).filter((d) => d >= 0);
        const allDays = [...materialDays, ...citationDays];
        if (allDays.length === 0) {
          setExpiryInfo(null);
          return;
        }
        setExpiryInfo({
          materialCount: materialDays.length,
          citationCount: citationDays.length,
          documentCount: 0,
          soonestDays: Math.min(...allDays),
        });
      } catch { /* network blip — the banner just stays hidden */ }
    })();
    return () => { cancelled = true; };
  }, [isPaidUser]);

  const recentItems = useMemo(() => {
    type Item =
      | { kind: 'doc'; id: string; at: number; doc: DocSummary; highlighted: boolean }
      | { kind: 'pack'; id: string; at: number; pack: HubStudyPack; highlighted: boolean };

    const items: Item[] = [
      ...docs.map((d) => ({
        kind: 'doc' as const,
        id: `doc-${d.id}`,
        at: new Date(d.lastEditedAt || d.updatedAt).getTime(),
        doc: d,
        highlighted: Boolean(highlightDocId && d.id === highlightDocId),
      })),
      ...packs.map((p) => ({
        kind: 'pack' as const,
        id: `pack-${p.id}`,
        at: new Date(p.createdAt).getTime() || 0,
        pack: p,
        highlighted: false,
      })),
    ];

    if (highlightPack) {
      const pending = items.find((i) => i.kind === 'pack' && i.pack.id === '__onboarding_pack__');
      if (pending) {
        pending.highlighted = true;
      } else {
        const newestPackAt = Math.max(0, ...items.filter((i) => i.kind === 'pack').map((i) => i.at));
        for (const item of items) {
          if (item.kind === 'pack' && item.at === newestPackAt) item.highlighted = true;
        }
      }
    }

    items.sort((a, b) => {
      if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
      return b.at - a.at;
    });
    return items.slice(0, 5);
  }, [docs, packs, highlightDocId, highlightPack]);

  const recentsLoading = loading || (Boolean(packsLoading) && docs.length === 0 && packs.length === 0);
  const recentsCount = docs.length + packs.length;

  const combinedExpiry = useMemo(() => {
    if (isPaidUser) return null;
    const now = Date.now();
    const toDays = (iso: string) => Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
    const docDays = docs
      .map((d) => d.expiresAt)
      .filter((d): d is string => typeof d === 'string' && d.length > 0)
      .map(toDays)
      .filter((d) => d >= 0);
    const materialCount = expiryInfo?.materialCount ?? 0;
    const citationCount = expiryInfo?.citationCount ?? 0;
    const documentCount = docDays.length;
    if (materialCount + citationCount + documentCount === 0) return null;
    const days: number[] = [...docDays];
    if (expiryInfo) days.push(expiryInfo.soonestDays);
    return {
      materialCount,
      citationCount,
      documentCount,
      soonestDays: Math.min(...days),
    };
  }, [docs, expiryInfo, isPaidUser]);

  /* Quiet launch tiles — icon + copy only. Colour lives in the tools
   * themselves; the hub stays monochrome so nothing competes with the
   * essay-upload hero. */
  /* Each tool shows a looping demo clip, or a still when there's a
     better-fitting screenshot for that surface. */
  const PICK_TOOLS: { key: string; title: string; sub: string; icon: React.ReactNode; video?: string; image?: string; onClick: () => void }[] = [
    {
      key: 'editor',
      title: 'Start a draft',
      sub: isPaidUser ? 'Blank page with live feedback' : 'Blank page — unlock on Pro',
      onClick: onNew,
      icon: <I.Wand />,
      image: '/startdraft.png',
    },
    {
      key: 'pack',
      title: 'Study Pack',
      sub: 'Lesson, flashcards, quiz',
      onClick: () => (highlightPack && onOpenHighlightedPack ? onOpenHighlightedPack() : onSwitchView('study-packs')),
      icon: <I.Pack />,
      video: '/hero-flashcards-hq.mp4',
    },
    {
      key: 'citations',
      title: 'Citations',
      sub: 'Find and format sources',
      onClick: () => onSwitchView('citations'),
      icon: <I.Cite />,
      video: '/writescholar-citation-finder-demo.mp4',
    },
    {
      key: 'games',
      title: 'Arcade',
      sub: 'Learn with study games',
      onClick: () => (highlightTool === 'games' && onOpenHighlightedTool ? onOpenHighlightedTool() : onSwitchView('games')),
      icon: <I.Game />,
      video: '/hero-word-blitz-hq.mp4',
    },
  ];

  const primaryInterest = getPrimaryFeatureInterest(user?.id);
  const pickToolsFirstKey = primaryInterest === 'study_packs' ? 'pack' : primaryInterest === 'games' ? 'games' : 'editor';
  const pickTools = [...PICK_TOOLS].sort(
    (a, b) => (a.key === pickToolsFirstKey ? -1 : 0) - (b.key === pickToolsFirstKey ? -1 : 0),
  );

  const dateLine = todayLabel();

  return (
    <>
      <style>{`
        @keyframes hubDocPulse {
          0%, 100% { box-shadow: 0 16px 36px -18px rgba(119,51,181,0.45); }
          50% { box-shadow: 0 18px 40px -14px rgba(119,51,181,0.7), 0 0 0 6px rgba(165,96,232,0.12); }
        }
        .hub-tile-pulse { animation: hubDocPulse 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hub-tile-pulse { animation: none; }
        }
      `}</style>
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

      {/* ─── Header — mascot + greeting left, account chrome right ─ */}
      <div className="relative z-40 flex flex-col-reverse sm:flex-row sm:items-center gap-4 sm:gap-6 mb-7 sm:mb-8">
        <div className="min-w-0 flex-1 flex items-center gap-3.5 sm:gap-5">
          {/* Celebrating Scholar mascot — brand welcome beside the greeting.
              Animated webp in a purple ring, echoing the product identity. */}
          <div
            className="relative shrink-0 w-[4.75rem] h-[4.75rem] sm:w-[5.75rem] sm:h-[5.75rem] lg:w-[6.5rem] lg:h-[6.5rem] motion-safe:animate-float"
            aria-hidden
          >
            <span className="absolute inset-0 rounded-full bg-[#E9DBFF]/70 dark:bg-[#A560E8]/20 ring-[3px] sm:ring-4 ring-[#C9A0F0]/55 dark:ring-[#A560E8]/40" />
            <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#A560E8] ring-2 ring-white dark:ring-stone-900" />
            <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-stone-900 p-1.5 sm:p-2">
              <img
                src="/mascot-celebrating.webp"
                alt=""
                width={104}
                height={104}
                loading="eager"
                decoding="async"
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(122,52,182,0.22)]"
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {dateLine && (
              <p className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500 mb-2">
                {dateLine}
              </p>
            )}
            <h1
              className="text-[1.75rem] sm:text-[2.05rem] lg:text-[2.25rem] font-extrabold leading-[1.08] tracking-tight text-stone-900 dark:text-stone-50"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {greetingFor()}
              {userName ? (
                <>
                  , <span className="text-[#8A48C7] dark:text-[#C9A0F0]">{userName}</span>
                </>
              ) : null}
            </h1>
            <p className="mt-1.5 text-[14px] sm:text-[15px] font-semibold text-stone-500 dark:text-stone-400">
              {highlightDocId
                ? 'Your essay is ready — open it to see the notes.'
                : highlightPack
                  ? 'Your study pack is ready — open it from the tile below.'
                  : highlightTool === 'daily-review'
                    ? 'Daily Review is ready — start a short session when you are.'
                    : highlightTool === 'games'
                      ? 'Arcade is ready — pick a game and load your notes.'
                      : 'Upload an essay, open a tool, or continue a draft.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {topBar}
        </div>
      </div>

      {(highlightDocId || highlightPack || highlightTool) && (
        <div className="relative flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#7733B5] bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-4 py-3 mb-5">
          <img src="/mascot-celebrating.webp" alt="" width={48} height={48} className="w-12 h-12 object-contain shrink-0" loading="eager" />
          <p className="min-w-0 flex-1 text-[13px] sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {highlightDocId
              ? 'Your essay is ready — open it below to see the notes.'
              : highlightPack
                ? 'Your study pack is ready — open it to study the lesson and cards.'
                : highlightTool === 'daily-review'
                  ? 'You picked Daily Review — start a short practice session.'
                  : 'You picked Arcade — open it and play a study game.'}
          </p>
          {highlightDocId && (
            <button
              type="button"
              onClick={() => onOpen(highlightDocId)}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-[12.5px] font-extrabold border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
            >
              Open essay
            </button>
          )}
          {highlightPack && onOpenHighlightedPack && (
            <button
              type="button"
              onClick={onOpenHighlightedPack}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-[12.5px] font-extrabold border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
            >
              Open pack
            </button>
          )}
          {highlightTool && onOpenHighlightedTool && (
            <button
              type="button"
              onClick={onOpenHighlightedTool}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-[12.5px] font-extrabold border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
            >
              {highlightTool === 'daily-review' ? 'Open Daily Review' : 'Open Arcade'}
            </button>
          )}
          {onDismissHighlight && (
            <button
              type="button"
              onClick={onDismissHighlight}
              aria-label="Dismiss"
              className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      )}

      {/* ─── Free-plan expiry nudge ─────────────────────────────── */}
      {!isPaidUser && combinedExpiry && (() => {
        const { materialCount, citationCount, documentCount, soonestDays } = combinedExpiry;
        const totalCount = materialCount + citationCount + documentCount;
        if (totalCount === 0) return null;
        const urgent = soonestDays <= 7;
        const daysText =
          soonestDays <= 0 ? 'today' :
          soonestDays === 1 ? 'tomorrow' :
          `in ${soonestDays} days`;
        const countLabel = (n: number, one: string, many: string) =>
          n === 1 ? `1 ${one}` : `${n} ${many}`;
        const parts: string[] = [];
        if (documentCount > 0) parts.push(countLabel(documentCount, 'document', 'documents'));
        if (materialCount > 0) parts.push(countLabel(materialCount, 'study pack', 'study packs'));
        if (citationCount > 0) parts.push(countLabel(citationCount, 'citation search', 'citation searches'));
        const itemsText =
          parts.length <= 1
            ? parts[0] ?? ''
            : parts.length === 2
              ? `${parts[0]} and ${parts[1]}`
              : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
        const headline =
          totalCount === 1
            ? `This ${itemsText.replace(/^1 /, '')} expires ${daysText}`
            : `These ${itemsText} expire ${daysText}`;
        return (
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border px-4 sm:px-5 py-3.5 mb-5 ${
              urgent
                ? 'border-red-200/90 bg-red-50/80 dark:border-red-500/30 dark:bg-red-950/30'
                : 'border-amber-200/90 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-950/25'
            }`}
          >
            <div className="min-w-0 flex-1">
              <h3
                className="text-[14.5px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {headline}
              </h3>
              <p className="mt-0.5 text-[12.5px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">
                On the free plan these last 30 days. Upgrade and we keep them forever.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-[#A560E8] hover:bg-[#9450D8] text-white text-[13px] font-extrabold transition-colors"
            >
              Upgrade
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        );
      })()}

      {/* ─── Flagship: essay feedback upload ──────────────────────
          Product-led split — copy + CTA left, real editor preview
          right (same crop bias as the college grader page). */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); setUploadDropActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setUploadDropActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setUploadDropActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setUploadDropActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onUpload(f);
        }}
        className={`group relative overflow-hidden rounded-[1.75rem] border cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A560E8]/25 ${
          uploadDropActive
            ? 'border-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/20 shadow-[0_20px_44px_-28px_rgba(90,45,140,0.55)]'
            : 'border-[#E4D4F8] dark:border-[#A560E8]/25 bg-white dark:bg-stone-900 hover:border-[#C9A0F0] dark:hover:border-[#A560E8]/45 shadow-[0_2px_4px_rgba(60,40,90,0.04),0_22px_50px_-34px_rgba(90,45,140,0.5)] hover:shadow-[0_2px_4px_rgba(60,40,90,0.04),0_30px_60px_-34px_rgba(90,45,140,0.62)]'
        }`}
      >
        {/* Brand wash + ambient orbs behind the copy column */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FBF8FF] via-white to-transparent dark:from-[#A560E8]/10 dark:via-stone-900 dark:to-transparent" aria-hidden />
        <span className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full bg-[#C9A0F0]/22 blur-3xl dark:bg-[#A560E8]/12" aria-hidden />

        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,50%)] items-stretch">
          <div className="min-w-0 px-5 py-5 sm:px-8 sm:py-6 lg:pr-6">
            <span className="inline-flex items-center gap-2 h-7 pl-1.5 pr-3 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/15 ring-1 ring-[#C9A0F0]/45 dark:ring-[#A560E8]/30">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#B57AF0] to-[#7733B5] text-white" aria-hidden>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#7733B5] dark:text-[#C9A0F0]">
                Essay Analyzer
              </span>
            </span>

            <h2
              className="mt-2.5 text-[1.5rem] sm:text-[1.8rem] lg:text-[1.95rem] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Get{' '}
              <span className="relative inline-block">
                <span className="relative z-10">professor-style</span>
                <span
                  className="absolute inset-x-0 bottom-[0.1em] z-0 h-[0.34em] rounded-full bg-gradient-to-r from-[#E9DBFF] to-[#C9A0F0]/70 dark:from-[#A560E8]/35 dark:to-[#A560E8]/20"
                  aria-hidden
                />
              </span>{' '}
              feedback
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] sm:text-[14px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">
              Drop in a draft for a grade, rubric scores, and line-by-line notes — usually in under a minute.
            </p>

            {/* What you get back — three quick proof points */}
            <ul className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {['Predicted grade', 'Rubric scores', 'Inline notes'].map((f) => (
                <li
                  key={f}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/90 dark:bg-stone-800/70 ring-1 ring-[#E4D4F8] dark:ring-stone-700 text-[11.5px] font-extrabold text-stone-600 dark:text-stone-300"
                >
                  <svg className="w-3.5 h-3.5 text-[#A560E8] dark:text-[#C9A0F0]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2">
              <span className="relative inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-br from-[#B57AF0] to-[#8A48C7] text-white text-[14px] font-extrabold overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] shadow-[0_14px_30px_-14px_rgba(122,52,182,0.8)]">
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-white/20" aria-hidden />
                <svg className="relative w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                <span className="relative">Upload document</span>
              </span>
              <span className="text-[13px] font-semibold text-stone-400 dark:text-stone-500">
                or drag &amp; drop · PDF, Word, TXT
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block min-h-[210px] p-3 pl-0" aria-hidden>
            <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] ring-1 ring-[#E4D4F8] dark:ring-stone-700 bg-stone-50 dark:bg-stone-950/50">
              <img
                src="/WriterPic.png"
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover object-[88%_8%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#7733B5]/18 via-transparent to-transparent" />

              {/* Result chip — bottom-right, speed claim only */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur px-2.5 py-2 shadow-[0_10px_24px_-14px_rgba(40,20,70,0.5)] max-w-[min(100%,13.5rem)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#B57AF0] to-[#7733B5] text-white" aria-hidden>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div className="min-w-0 pr-0.5">
                  <p className="text-[12px] font-extrabold text-stone-800 dark:text-stone-100 leading-tight">
                    Graded in under 60 seconds
                  </p>
                  <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-tight">
                    Inline notes · 6 rubric scores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {uploadDropActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#A560E8]/96 rounded-[1.65rem]">
            <div className="text-center px-4">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7733B5]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m4-6l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              <p className="text-lg font-extrabold text-white" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Drop to upload
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Quick start — soft purple tray of launch cards ─────── */}
      <div className="mt-8 sm:mt-10">
        <div className="mb-4 flex items-center gap-3">
          <h2
            className="text-[1.15rem] sm:text-[1.25rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Quick start
          </h2>
          <span className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent dark:from-stone-800" aria-hidden />
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] border border-[#E4D4F8]/90 dark:border-[#A560E8]/20 bg-gradient-to-br from-[#FBF8FF] via-[#F7F1FF] to-[#F3EAFF]/80 dark:from-stone-900 dark:via-stone-900 dark:to-[#A560E8]/10 p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          {/* Soft ambient orbs — atmosphere without clutter */}
          <span className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 rounded-full bg-[#C9A0F0]/25 blur-3xl dark:bg-[#A560E8]/15" aria-hidden />
          <span className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[#A560E8]/12 blur-3xl dark:bg-[#A560E8]/10" aria-hidden />

          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {pickTools.map((t, i) => {
              const tileHighlighted =
                (t.key === 'pack' && highlightPack) || (t.key === 'games' && highlightTool === 'games');
              return (
              <button
                key={t.key}
                type="button"
                onClick={t.onClick}
                className={`group relative flex flex-col items-stretch text-left overflow-hidden rounded-2xl border bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm p-2 pb-3.5 sm:p-2.5 sm:pb-4 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A560E8]/40 ${
                  tileHighlighted
                    ? 'hub-tile-pulse border-[#7733B5] dark:border-[#A560E8] shadow-[0_16px_36px_-18px_rgba(119,51,181,0.45)]'
                    : 'border-white/80 dark:border-stone-700/80 shadow-[0_2px_8px_-4px_rgba(90,45,140,0.18)] hover:border-[#C9A0F0] dark:hover:border-[#A560E8]/50 hover:shadow-[0_16px_32px_-18px_rgba(90,45,140,0.55)]'
                }`}
              >
                {/* Preview of what the tool does. Clips play only while
                    the card is on screen. */}
                <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-900 ring-1 ring-[#E4D4F8] dark:ring-stone-700">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : t.video ? (
                    <ViewportAutoplayVideo
                      src={t.video}
                      aria-hidden
                      tabIndex={-1}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" aria-hidden />
                  <span className="absolute top-1.5 right-2 text-[10px] font-extrabold tabular-nums tracking-wider text-white/70" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </span>

                <span className="mt-3 flex items-center gap-2.5 px-1.5">
                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#B57AF0] to-[#7733B5] text-white shadow-[0_8px_16px_-8px_rgba(122,52,182,0.85)] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 [&>svg]:w-[17px] [&>svg]:h-[17px]"
                    aria-hidden
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/25" />
                    {t.icon}
                  </span>
                  <span
                    className="min-w-0 block text-[14px] sm:text-[14.5px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    {t.title}
                    {t.key === 'editor' && !isPaidUser && (
                      <span className="ml-1.5 inline-flex align-middle rounded-md bg-[#FFC800] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#5A4500] border border-[#D4A300]">
                        Pro
                      </span>
                    )}
                  </span>
                </span>

                <span className="mt-1.5 block px-1.5 text-[12.5px] font-semibold text-stone-400 dark:text-stone-500 leading-snug">
                  {t.sub}
                </span>

                <span className="mt-2.5 inline-flex items-center gap-1 px-1.5 text-[12px] font-extrabold text-[#8A48C7] dark:text-[#C9A0F0]">
                  Launch
                  <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.75} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Recent documents — title outside, spaced cards inside ─ */}
      <div className="mt-8 sm:mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3 flex-1">
            <div className="min-w-0 flex items-center gap-2.5">
              <h2
                className="text-[1.15rem] sm:text-[1.25rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Recent
              </h2>
              {recentsCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#8A48C7] dark:text-[#C9A0F0] text-[10.5px] font-extrabold tabular-nums">
                  {recentsCount}
                </span>
              )}
            </div>
            <span className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent dark:from-stone-800" aria-hidden />
          </div>
          <button
            type="button"
            onClick={() => onSwitchView('docs')}
            className="group/all shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-extrabold text-[#8A48C7] dark:text-[#C9A0F0] hover:bg-[#F3EAFF] dark:hover:bg-[#A560E8]/15 transition-colors"
          >
            View all
            <svg className="w-3.5 h-3.5 transition-transform group-hover/all:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        <div className="relative overflow-visible rounded-[1.35rem] border border-[#E4D4F8]/90 dark:border-[#A560E8]/20 bg-gradient-to-br from-[#FBF8FF] via-[#F7F1FF] to-[#F3EAFF]/70 dark:from-stone-900 dark:via-stone-900 dark:to-[#A560E8]/10 p-3 sm:p-3.5">
          <span className="pointer-events-none absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-[#C9A0F0]/20 blur-3xl dark:bg-[#A560E8]/12" aria-hidden />

          <div className="relative flex flex-col gap-2 sm:gap-2.5">
            {recentsLoading ? (
              <>
                <DocumentRowSkeleton elevated />
                <DocumentRowSkeleton elevated />
                <DocumentRowSkeleton elevated />
              </>
            ) : recentItems.length === 0 ? (
              <div className="px-5 py-12 text-center rounded-2xl border border-dashed border-[#C9A0F0]/55 dark:border-[#A560E8]/30 bg-white/70 dark:bg-stone-900/70">
                <div
                  className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3EAFF] to-[#E9DBFF] text-[#8A48C7] dark:from-[#A560E8]/20 dark:to-[#A560E8]/10 dark:text-[#C9A0F0] [&>svg]:w-6 [&>svg]:h-6"
                  aria-hidden
                >
                  <I.Doc />
                </div>
                <p className="text-[15px] font-extrabold text-stone-800 dark:text-stone-100">Nothing here yet</p>
                <p className="mt-1 text-[13px] font-semibold text-stone-400 dark:text-stone-500">
                  Upload an essay, start a draft, or build a study pack.
                </p>
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#A560E8] hover:bg-[#9450D8] text-white text-[13px] font-extrabold transition-colors"
                  >
                    <I.Upload /> Upload paper
                  </button>
                  <button
                    type="button"
                    onClick={onNew}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 text-[13px] font-extrabold hover:border-[#A560E8]/45 transition-colors"
                  >
                    <I.Plus /> New document
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchView('study-packs')}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 text-[13px] font-extrabold hover:border-[#A560E8]/45 transition-colors"
                  >
                    <I.Pack /> Study pack
                  </button>
                </div>
              </div>
            ) : (
              recentItems.map((item) =>
                item.kind === 'pack' ? (
                  <DocumentRow
                    key={item.id}
                    kind="pack"
                    elevated
                    highlighted={item.highlighted}
                    doc={{
                      id: item.pack.id,
                      title: item.pack.title,
                      wordCount: 0,
                      lastEditedAt: item.pack.createdAt,
                      updatedAt: item.pack.createdAt,
                      expiresAt: item.pack.expiresAt,
                    }}
                    onOpen={() => onOpenPack(item.pack)}
                    onUpgrade={() => onNavigate('pricing')}
                  />
                ) : (
                  <DocumentRow
                    key={item.id}
                    doc={item.doc}
                    elevated
                    highlighted={item.highlighted}
                    onOpen={() => onOpen(item.doc.id)}
                    onDownload={() => onDownload(item.doc.id)}
                    onDelete={() => onDelete(item.doc.id)}
                    onUpgrade={() => onNavigate('pricing')}
                  />
                ),
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── DOCS view — the full document library ("My Documents") ─────
   Same rows as the dashboard recents, plus search, the plan's
   document allowance, and the create / upload actions. */
function DocumentsLibrary({
  docs,
  loading,
  onNew,
  onOpen,
  onUpload,
  onDownload,
  onDelete,
  onUpgrade,
  usage,
  topBar,
}: {
  docs: DocSummary[];
  loading: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onUpload: (file: File) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onUpgrade?: () => void;
  usage: { used: number; limit: number | null; plan: string } | null;
  /** Account controls — shares the heading row, same as the hub. */
  topBar?: React.ReactNode;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (!q) return true;
        const inTitle = d.title.toLowerCase().includes(q);
        const inFilename = (d.originalFilename || '').toLowerCase().includes(q);
        return inTitle || inFilename;
      })
      .sort((a, b) => {
        const ta = a.lastEditedAt || a.updatedAt;
        const tb = b.lastEditedAt || b.updatedAt;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [docs, search]);

  return (
    <>
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

      {/* Heading row — title (left) · account controls (right), so the
          top bar shares the band instead of floating over the page. */}
      <div className="relative z-40 flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-3 sm:gap-5 mb-6">
        <div className="min-w-0">
          <h1
            className="text-[1.85rem] sm:text-[2.1rem] font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            My Documents
          </h1>
          <p className="mt-1.5 text-[14px] font-bold text-stone-500 dark:text-stone-400">
            {docs.length} {docs.length === 1 ? 'document' : 'documents'}
            {usage && usage.limit != null && <> · {usage.used}/{usage.limit} on the {usage.plan} plan</>}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0 sm:pt-1">{topBar}</div>
      </div>

      {/* Search (left) · create actions (right) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:max-w-md">
          <span aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <I.Search />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-10 pr-10 h-11 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[14px] font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#A560E8] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 text-[13.5px] font-extrabold hover:border-[#A560E8]/45 hover:text-[#7733B5] dark:hover:text-[#C9A0F0] transition-colors"
          >
            <I.Upload /> Upload
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[#A560E8] hover:bg-[#9450D8] text-white text-[13.5px] font-extrabold transition-colors"
          >
            <I.Plus /> New document
          </button>
        </div>
      </div>

      {search.trim() && !loading && (
        <p className="mb-3 text-[12.5px] font-bold text-stone-500 dark:text-stone-400">
          {filtered.length} of {docs.length} {docs.length === 1 ? 'document' : 'documents'} match &ldquo;<span className="text-[#7733B5] dark:text-[#C9A0F0]">{search.trim()}</span>&rdquo;
        </p>
      )}

      <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 shadow-[0_2px_8px_-5px_rgba(60,40,90,0.16)]">
        {loading ? (
          <>
            <DocumentRowSkeleton />
            <DocumentRowSkeleton />
            <DocumentRowSkeleton />
            <DocumentRowSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <DocsEmptyState
            hasAnyDocs={docs.length > 0}
            hasSearch={search.trim().length > 0}
            onNew={onNew}
            onUpload={() => fileInputRef.current?.click()}
          />
        ) : (
          filtered.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              onOpen={() => onOpen(d.id)}
              onDownload={() => onDownload(d.id)}
              onDelete={() => onDelete(d.id)}
              onUpgrade={onUpgrade}
            />
          ))
        )}
      </div>
    </>
  );
}

/* ─── CompactDailyReview — slim CTA tile that lives in the right
 * column of the dashboard, under the 3 action pills. Streak now
 * lives in the top bar as a chip, so this card only handles the
 * "do today's review" action. */
function CompactDailyReview({
  user,
  onSwitchView,
}: {
  user: { id?: string } | null | undefined;
  onSwitchView: (v: WorkspaceView) => void;
}) {
  const [reviewCompletedToday, setReviewCompletedToday] = useState(false);
  const [reviewStreak, setReviewStreak] = useState(0);

  useEffect(() => {
    try {
      const key = `writescholar_daily_review_streak_${user?.id || 'anon'}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { lastCompletedDate?: string; currentStreak?: number };
      const today = new Date().toISOString().slice(0, 10);
      setReviewCompletedToday(parsed?.lastCompletedDate === today);
      setReviewStreak(typeof parsed?.currentStreak === 'number' ? parsed.currentStreak : 0);
    } catch { /* ignore */ }
  }, [user?.id]);

  const tint = '#A560E8';
  const tintLight = '#E9DBFF';
  const tintDark = '#7733B5';
  const bodyGradient = 'linear-gradient(135deg, #F3EAFF 0%, #FFFFFF 48%, #FBF8FF 100%)';

  return (
    <button
      type="button"
      onClick={() => onSwitchView('daily-review')}
      className="group relative overflow-hidden rounded-2xl border-2 border-b-[5px] min-h-[104px] sm:min-h-[112px] text-left flex items-stretch hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all dark:from-stone-900 dark:via-stone-900 dark:to-stone-900"
      style={{
        background: bodyGradient,
        borderColor: tint,
        borderBottomColor: tintDark,
        boxShadow: '0 12px 28px -12px rgba(165,96,232,0.45)',
      }}
    >
      {/* Video preview left block */}
      <span
        className="relative shrink-0 self-stretch overflow-hidden w-[92px] sm:w-[100px] min-h-[104px] sm:min-h-[112px]"
        aria-hidden
        style={{ background: `linear-gradient(168deg, ${tint} 0%, ${tintDark} 100%)` }}
      >
        <video
          src="/dashboardlogo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <span
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.16em] text-white border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          style={{ background: `linear-gradient(145deg, ${tintLight}, ${tint})` }}
        >
          Daily
        </span>
        {reviewCompletedToday && (
          <span
            className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#7733B5] text-[11px] font-extrabold leading-none border border-white/70 shadow-sm"
            aria-hidden
          >
            ✓
          </span>
        )}
      </span>

      {/* Body */}
      <span className="relative flex-1 min-w-0 px-4 sm:px-5 py-4 flex items-center gap-3.5">
        <span
          className="pointer-events-none absolute -top-6 -right-8 w-32 h-32 rounded-full blur-2xl opacity-70"
          style={{ backgroundColor: tintLight }}
          aria-hidden
        />

        <span className="relative min-w-0 flex-1">
          <p
            className="text-base sm:text-[17px] font-extrabold leading-tight truncate"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif', color: tintDark }}
          >
            Today&apos;s Daily Review
          </p>
          <p
            className="mt-1 text-[12.5px] sm:text-[13px] font-bold leading-snug line-clamp-2"
            style={{ color: `${tintDark}CC` }}
          >
            {reviewCompletedToday
              ? `Done · ${reviewStreak}-day review streak. Want another round?`
              : '~2 min · 5 quick recall questions from your study packs.'}
          </p>
        </span>

        <span
          className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border-2 text-white transition-all group-hover:translate-x-0.5 group-hover:scale-105"
          style={{
            borderColor: tintDark,
            background: `linear-gradient(145deg, ${tintLight}, ${tint})`,
            boxShadow: `0 4px 12px -4px ${tint}88`,
          }}
          aria-hidden
        >
          <svg className="relative w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </span>
    </button>
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
          <button type="button" onClick={onUpload} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">
            <I.Upload /> Upload paper
          </button>
          <button type="button" onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border-2 border-b-[3px] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-extrabold hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all">
            <I.Plus /> New document
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-200/70 dark:border-stone-800">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-400 mb-4">Here's what your editor looks like</p>
          <div className="relative mx-auto max-w-3xl">
            <div
              aria-hidden
              className="absolute -inset-x-6 -bottom-6 top-10 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_60%,rgba(165,96,232,0.16),transparent_70%)] blur-2xl"
            />
            <div className="overflow-hidden rounded-2xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_2px_8px_rgba(40,30,60,0.06),0_36px_70px_-30px_rgba(40,30,60,0.32)]">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-200/70 dark:border-stone-800 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-900">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] ring-1 ring-black/5" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E] ring-1 ring-black/5" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28C840] ring-1 ring-black/5" />
                </span>
                <span className="mx-auto hidden sm:block text-[11px] font-semibold text-stone-400 dark:text-stone-500">writescholar.com — your essay, graded</span>
                <span className="w-10 shrink-0" aria-hidden />
              </div>
              <img
                src="/WriterPic.png"
                alt="The WriteScholar editor: an essay draft with a live professor-style rubric, an estimated grade, and one-click line-by-line fixes"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </div>
          </div>
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


function extractComprehensiveText(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return '';
  if (typeof payload.result === 'string' && payload.result.trim()) return payload.result;
  if (typeof payload.analysis_result === 'string' && payload.analysis_result.trim()) return payload.analysis_result;
  if (typeof payload.formattedResult === 'string' && payload.formattedResult.trim()) return payload.formattedResult;
  return '';
}

function parseAnalysisResults(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function normalizeRubricRows(raw: unknown): NonNullable<AnalyzerResult['rubric']> {
  const rubricRaw = raw ?? [];
  const rubricArr = Array.isArray(rubricRaw)
    ? rubricRaw
    : typeof rubricRaw === 'object' && rubricRaw !== null
      ? Object.entries(rubricRaw as Record<string, unknown>).map(([category, val]) => {
          const v = val as Record<string, unknown>;
          return {
            category,
            score: typeof v?.score === 'number' ? v.score : undefined,
            maxScore: typeof v?.maxScore === 'number' ? v.maxScore : typeof v?.max_score === 'number' ? v.max_score : undefined,
            feedback: typeof v?.feedback === 'string' ? v.feedback : undefined,
          };
        })
      : [];
  return rubricArr.map((r) => ({
    category: String(r.category ?? 'Criterion'),
    score: typeof r.score === 'number' ? r.score : undefined,
    maxScore: typeof r.maxScore === 'number' ? r.maxScore : undefined,
    feedback: typeof r.feedback === 'string' ? r.feedback : undefined,
  }));
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
  onOpenClassicReport,
  documentText,
  wordLimit,
  onUpgrade,
  analysesLeft,
  revisionsLocked,
  revisionPaywallAnn,
  onCloseRevisionPaywall,
  analyzeConfirmSignal,
}: {
  docId: string;
  initialTitle: string;
  initialHtml: string;
  onTitleSave: (title: string) => Promise<void>;
  onContentSave: (payload: { html: string; text: string; wordCount: number }) => Promise<void>;
  onBack: () => void;
  onAnalyze: (opts: AnalyzeStyleOptions) => void;
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
  onOpenClassicReport?: () => void;
  documentText: string;
  wordLimit: number | null;
  onUpgrade: () => void;
  analysesLeft: number | null;
  revisionsLocked: boolean;
  revisionPaywallAnn: { text: string; suggestion: string } | null;
  onCloseRevisionPaywall: () => void;
  /** Bump to open the analyze-confirm modal from outside the editor
   *  (e.g. the post-upload nudge) so the citation/grade picker shows. */
  analyzeConfirmSignal: number;
}) {
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Analysis is a deliberate, quota-consuming action — confirm
  // before running so it's never an accidental click.
  const [confirmAnalyze, setConfirmAnalyze] = useState(false);
  // Citation style + grading scale for a more personal analysis —
  // chosen in the confirm modal, persisted so it sticks per browser
  // and is what handleAnalyzeInEditor sends to the backend.
  const [citationStyle, setCitationStyle] = useState<string>(() => {
    try { return localStorage.getItem('writescholar_editor_citation_style') || 'None'; } catch { return 'None'; }
  });
  const [gradingStyle, setGradingStyle] = useState<GradingStyle>(getDefaultGradingStyle);
  const changeCitationStyle = useCallback((v: string) => {
    setCitationStyle(v);
    try { localStorage.setItem('writescholar_editor_citation_style', v); } catch { /* noop */ }
  }, []);
  const changeGradingStyle = useCallback((v: GradingStyle) => {
    setGradingStyle(v);
  }, []);
  const openAnalyzeConfirm = useCallback(() => {
    setGradingStyle(getDefaultGradingStyle());
    setConfirmAnalyze(true);
  }, []);
  const isReanalyze = !!analyzerResult;
  const noAnalysesLeft = typeof analysesLeft === 'number' && analysesLeft === 0;
  const [editorMode, setEditorMode] = useState<'draft' | 'report'>('draft');
  const wasAnalyzingRef = useRef(false);

  useEffect(() => {
    setEditorMode('draft');
  }, [docId]);

  useEffect(() => {
    if (wasAnalyzingRef.current && !analyzerLoading && analyzerResult && !analyzerError) {
      setEditorMode('report');
    }
    wasAnalyzingRef.current = analyzerLoading;
  }, [analyzerLoading, analyzerResult, analyzerError]);

  const openReport = useCallback(() => {
    if (analyzerResult) setEditorMode('report');
    else onOpenFullReport();
  }, [analyzerResult, onOpenFullReport]);

  // External request (e.g. the post-upload nudge) to open the
  // analyze-confirm modal — so the citation style + grade picker
  // shows instead of analysis firing straight away.
  useEffect(() => {
    if (analyzeConfirmSignal > 0) openAnalyzeConfirm();
  }, [analyzeConfirmSignal, openAnalyzeConfirm]);

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
    () => analyzerResult?.annotations?.map((a) => ({
      id: a.id,
      type: normalizeAnnotationType(a.type),
      startIndex: a.startIndex,
      endIndex: a.endIndex,
      text: a.text,
      comment: a.comment,
      suggestion: a.suggestion,
      locked: a.locked,
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
    if (!hoverAnnotationId || !analyzerResult?.annotations) return null;
    return analyzerResult.annotations.find((a) => a.id === hoverAnnotationId) ?? null;
  }, [hoverAnnotationId, analyzerResult]);

  // When the analyzer panel is open we shift to a side-by-side
  // layout: editor takes ~62% on lg, panel takes ~38%. Below lg the
  // panel slides in as a full-screen drawer so users can still read
  // the feedback comfortably on phones / tablets without the editor
  // shrinking to nothing.
  const showSplit = analyzerOpen && (analyzerResult || analyzerLoading || analyzerError);
  // Before the first analysis, surface a promo rail in the exact same
  // slot as the feedback panel so new users discover analysis (and
  // free users see the upgrade path) before they've ever run it.
  // Mutually exclusive with showSplit (which needs a result/loading/
  // error — all negated here).
  const showAnalyzePromo = !analyzerResult && !analyzerLoading && !analyzerError;
  const splitLayout = showSplit || showAnalyzePromo;

  return (
    <div className={`mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 transition-[max-width] duration-200 ${splitLayout ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
      <div className="flex flex-wrap items-center gap-3 mb-3 sm:mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <I.ArrowL />
          All documents
        </button>
        {analyzerResult && (
          <div
            role="tablist"
            aria-label="Document view"
            className="inline-flex rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'draft'}
              onClick={() => setEditorMode('draft')}
              className={`px-3.5 py-1.5 rounded-[10px] text-xs font-extrabold transition-colors ${
                editorMode === 'draft'
                  ? 'bg-[#F3EAFF] text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'report'}
              onClick={() => setEditorMode('report')}
              className={`px-3.5 py-1.5 rounded-[10px] text-xs font-extrabold transition-colors ${
                editorMode === 'report'
                  ? 'bg-[#F3EAFF] text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Report
            </button>
          </div>
        )}
      </div>

      {editorMode === 'report' && analyzerResult && (
        <AnalysisReportView
          title={title}
          documentText={documentText}
          result={analyzerResult}
          revisionsLocked={revisionsLocked}
          selectedAnnotationId={selectedAnnotationId}
          appliedAnnotationIds={appliedAnnotationIds}
          applyingAnnotationId={applyingAnnotationId}
          onSelectAnnotation={handleSelectAnnotation}
          onApplyRevision={onApplyRevision}
          onRevertRevision={onRevertRevision}
          onEditDraft={() => {
            setEditorMode('draft');
            onReopenAnalyzer();
          }}
          onReanalyze={openAnalyzeConfirm}
          onUpgrade={onUpgrade}
          onOpenClassicReport={onOpenClassicReport}
        />
      )}
      <div className={`${editorMode === 'report' && analyzerResult ? 'hidden' : ''} grid gap-4 lg:gap-6 ${splitLayout ? 'lg:grid-cols-[minmax(0,1fr)_min(360px,31%)]' : 'grid-cols-1'}`}>
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
          annotationPreviewRatio={revisionsLocked ? 0.5 : null}
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
                    title={
                      analysesLeft === 0
                        ? revisionsLocked
                          ? 'You\u2019ve used your free analysis previews — upgrade for more'
                          : 'No analyses left this month — upgrade for more'
                        : revisionsLocked
                          ? `${analysesLeft} free ${analysesLeft === 1 ? 'analysis preview' : 'analysis previews'} left (one-time, no monthly reset)`
                          : `${analysesLeft} ${analysesLeft === 1 ? 'analysis' : 'analyses'} left this month`
                    }
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
              onClick={openAnalyzeConfirm}
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
              onRerun={openAnalyzeConfirm}
              onClose={onAnalyzerClose}
              onOpenFullReport={openReport}
              onApplyRevision={onApplyRevision}
              onRevertRevision={onRevertRevision}
              appliedAnnotationIds={appliedAnnotationIds}
              applyingAnnotationId={applyingAnnotationId}
              revisionsLocked={revisionsLocked}
              onUpgrade={onUpgrade}
            />
          </aside>
        )}

        {/* Pre-analysis promo rail — same slot/shell as the feedback
            panel, shown until the user runs their first analysis. */}
        {showAnalyzePromo && (
          <aside className="hidden lg:flex flex-col rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden self-start sticky top-4 h-[calc(100dvh-2rem)]">
            <div className="relative flex-1 flex flex-col items-center justify-center text-center px-7 py-8 overflow-y-auto">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/4 h-56 bg-[radial-gradient(ellipse_60%_50%_at_50%_42%,rgba(165,96,232,0.08),transparent_72%)]"
              />
              <div className="relative w-full">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white ring-1 ring-black/5 shadow-[0_10px_22px_-12px_rgba(60,40,90,0.4)]">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg>
                </div>

                <h3 className="mt-6 text-[1.35rem] font-extrabold tracking-tight text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Grade this essay
                </h3>
                <p className="mx-auto mt-2 max-w-[15rem] text-[13px] font-medium text-stone-500 dark:text-stone-400 leading-relaxed">
                  Professor-style feedback, an estimated grade and one-click fixes, right beside your draft.
                </p>

                <button
                  type="button"
                  onClick={() => (noAnalysesLeft ? onUpgrade() : openAnalyzeConfirm())}
                  className="group mt-7 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_26px_-14px_rgba(122,51,181,0.5)]"
                >
                  <I.Sparkle />
                  {noAnalysesLeft ? 'Upgrade to analyze' : 'Run full analysis'}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>

                {revisionsLocked && !noAnalysesLeft && (
                  <p className="mx-auto mt-4 max-w-[16rem] text-[11.5px] font-medium text-stone-400 dark:text-stone-500 leading-relaxed">
                    Free preview: grade estimate, issue counts &amp; top fixes.{' '}
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="font-extrabold text-[#8A48C7] dark:text-[#C9A0F0] underline decoration-[#A560E8]/40 underline-offset-2 hover:decoration-[#A560E8] transition-colors"
                    >
                      Unlock the full report
                    </button>
                  </p>
                )}
                {typeof analysesLeft === 'number' && !noAnalysesLeft && (
                  <p className="mt-3 text-[11px] font-bold text-stone-400 dark:text-stone-500 tabular-nums">
                    {analysesLeft} free {analysesLeft === 1 ? 'analysis' : 'analyses'} left
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating hover tooltip — positioned above the underline
          the cursor is over. Pointer-events-none so it never traps
          mouseout events. Hidden on touch devices (no real hover). */}
      {editorMode === 'draft' && hoveredAnnotation && hoverRect && (
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
            hoveredAnnotation.locked ? (
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
      {editorMode === 'draft' && showSplit && (
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
              onRerun={openAnalyzeConfirm}
              onClose={onAnalyzerClose}
              onOpenFullReport={openReport}
              onApplyRevision={onApplyRevision}
              onRevertRevision={onRevertRevision}
              appliedAnnotationIds={appliedAnnotationIds}
              applyingAnnotationId={applyingAnnotationId}
              revisionsLocked={revisionsLocked}
              onUpgrade={onUpgrade}
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
                {noAnalysesLeft
                  ? revisionsLocked
                    ? 'Free previews used up'
                    : 'No analyses left this month'
                  : isReanalyze ? 'Re-analyze this draft?' : 'Analyze this draft?'}
              </h3>
            </div>

            {noAnalysesLeft ? (
              <p className="text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                {revisionsLocked
                  ? 'You\u2019ve used your free analysis previews — they\u2019re one-time and don\u2019t reset. Upgrade to keep analyzing your papers.'
                  : 'You\u2019ve used all your analyses for this billing period. Upgrade for more, or wait until your allowance resets.'}
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
                    {typeof analysesLeft === 'number' && analysesLeft >= 0
                      ? revisionsLocked
                        ? ` — you have ${analysesLeft} free ${analysesLeft === 1 ? 'preview' : 'previews'} left (one-time).`
                        : ` — you have ${analysesLeft} left this month.`
                      : '.'}
                  </span></li>
                </ul>
              </>
            )}

            {!noAnalysesLeft && (
              <div className="mt-4 grid gap-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 p-3">
                <div>
                  <label htmlFor="ws-cite-style" className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-400 mb-1.5">Citation style</label>
                  <select
                    id="ws-cite-style"
                    value={citationStyle}
                    onChange={(e) => changeCitationStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 transition-colors"
                  >
                    <option value="None">None (no citations required)</option>
                    <option value="APA">APA</option>
                    <option value="Harvard">Harvard</option>
                    <option value="Chicago">Chicago</option>
                    <option value="MLA">MLA</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-400 mb-1.5">Grade format</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['us', 'uk'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => changeGradingStyle(g)}
                        className={`px-3 py-2 rounded-lg text-sm font-extrabold border-2 transition-all ${
                          gradingStyle === g
                            ? 'bg-[#A560E8] text-white border-[#7733B5]'
                            : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/40'
                        }`}
                      >
                        {g === 'us' ? 'US (A–F · /100)' : 'UK (class · %)'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] font-bold text-stone-400 leading-snug">Defaults to US; UK is pre-selected only if you used it on your last analysis.</p>
              </div>
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
                  onClick={() => {
                    setConfirmAnalyze(false);
                    try { localStorage.setItem('writescholar_editor_citation_style', citationStyle); } catch { /* noop */ }
                    onAnalyze({ citationStyle, gradingStyle });
                  }}
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
export default function DocumentsPage({ initialDocumentId, onNavigate, onLogout, user, onEditorActiveChange, trialGated, onTrialGate }: DocumentsPageProps) {
  const [view, setView] = useState<WorkspaceView>(initialDocumentId ? 'editor' : 'hub');
  const [openDocId, setOpenDocId] = useState<string | null>(initialDocumentId ?? null);
  const [highlightDocId, setHighlightDocId] = useState<string | null>(() => {
    if (initialDocumentId) return null;
    try { return sessionStorage.getItem('writescholar_open_doc_after_onboarding'); } catch { return null; }
  });
  const [highlightPack, setHighlightPack] = useState(() => {
    if (initialDocumentId) return false;
    try { return sessionStorage.getItem(HIGHLIGHT_PACK_AFTER_ONBOARDING_KEY) === '1'; } catch { return false; }
  });
  const [highlightTool, setHighlightTool] = useState<'games' | 'daily-review' | null>(() => {
    if (initialDocumentId) return null;
    try {
      const v = sessionStorage.getItem(HUB_NUDGE_AFTER_ONBOARDING_KEY);
      return v === 'games' || v === 'daily-review' ? v : null;
    } catch { return null; }
  });

  const clearOnboardingHighlight = useCallback(() => {
    setHighlightDocId(null);
    setHighlightPack(false);
    setHighlightTool(null);
    try {
      sessionStorage.removeItem('writescholar_open_doc_after_onboarding');
      sessionStorage.removeItem('writescholar_ws_pending_view');
      sessionStorage.removeItem(HIGHLIGHT_PACK_AFTER_ONBOARDING_KEY);
      sessionStorage.removeItem(HUB_NUDGE_AFTER_ONBOARDING_KEY);
    } catch { /* ignore */ }
  }, []);

  const openHubStudyPack = useCallback((pack: HubStudyPack) => {
    try {
      sessionStorage.setItem(STUDY_PACK_VIEWER_KEY, JSON.stringify({ data: pack.questions, title: pack.title }));
    } catch { /* noop */ }
    if (highlightPack) clearOnboardingHighlight();
    onNavigate('study-pack-viewer', undefined, { studyPack: { data: pack.questions, title: pack.title } });
  }, [onNavigate, highlightPack, clearOnboardingHighlight]);

  const openOnboardingStudyPack = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(STUDY_PACK_VIEWER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.data) {
        onNavigate('study-pack-viewer', undefined, { studyPack: parsed });
        clearOnboardingHighlight();
        return;
      }
    } catch { /* fall through */ }
    setView('study-packs');
    clearOnboardingHighlight();
  }, [onNavigate, clearOnboardingHighlight]);

  const openOnboardingTool = useCallback(() => {
    const tool = highlightTool;
    clearOnboardingHighlight();
    if (tool === 'daily-review') setView('daily-review');
    else setView('games');
  }, [highlightTool, clearOnboardingHighlight]);

  useEffect(() => {
    if (initialDocumentId) return;
    // After onboarding essay analysis: stay on the hub and light up
    // that paper so they know where it lives, then open markup on click.
    try {
      const highlight = sessionStorage.getItem('writescholar_open_doc_after_onboarding');
      if (highlight) {
        sessionStorage.removeItem('writescholar_ws_pending_view');
        setHighlightDocId(highlight);
        setView('hub');
        return;
      }
      if (sessionStorage.getItem(HIGHLIGHT_PACK_AFTER_ONBOARDING_KEY) === '1') {
        sessionStorage.removeItem('writescholar_ws_pending_view');
        setHighlightPack(true);
        setView('hub');
        return;
      }
      const nudge = sessionStorage.getItem(HUB_NUDGE_AFTER_ONBOARDING_KEY);
      if (nudge === 'games' || nudge === 'daily-review') {
        sessionStorage.removeItem('writescholar_ws_pending_view');
        setHighlightTool(nudge);
        setView('hub');
        return;
      }
    } catch { /* ignore */ }

    const pending = consumePendingWorkspaceView();
    if (!pending || pending === 'hub' || pending === 'editor') return;

    // Right after onboarding / trial checkout, always land on the hub —
    // ignore a stashed tool view (e.g. Analyze) so Stripe →
    // /dashboard?payment=success doesn't open a deep-linked panel.
    const userId = user?.id;
    if (userId) {
      try {
        if (!isFirstRunFastPathDone(userId)) {
          const completedAt = getOnboardingCompletedAt(userId);
          if (completedAt && Date.now() - completedAt <= 10 * 60 * 1000) {
            return;
          }
        }
      } catch {
        /* fall through and apply pending */
      }
    }
    setView(pending);
  }, [initialDocumentId, user?.id]);

  // First-run after onboarding / trial start: stay on the main hub.
  // We used to deep-link into Analyze (or whichever tool they picked in
  // the survey), but that skips the dashboard overview right when
  // orientation matters most — especially after Stripe drops them on
  // /dashboard?payment=success. Mark the fast-path done so we never
  // yank them later either.
  const [firstRunNudge, setFirstRunNudge] = useState<WorkspaceView | null>(null);
  useEffect(() => {
    const userId = user?.id;
    if (!userId || initialDocumentId || trialGated) return;
    try {
      if (isFirstRunFastPathDone(userId)) return;
      const completedAt = getOnboardingCompletedAt(userId);
      if (!completedAt || Date.now() - completedAt > 10 * 60 * 1000) return;
      markFirstRunFastPathDone(userId);
    } catch {
      return;
    }
    setView('hub');
    setFirstRunNudge(null);
    trackEvent('first_action_prompt_cta_click', { cta: 'auto_fast_path', view: 'hub' });
  }, [user?.id, initialDocumentId, trialGated]);

  // Listen for direct view-switch events fired by navigateWorkspaceView
  // when DocumentsPage is already mounted (e.g. "Start review" popup
  // clicked while the user is already on the dashboard).
  useEffect(() => {
    const handler = (e: Event) => {
      const view = (e as CustomEvent<string>).detail;
      const allowed: WorkspaceView[] = ['hub', 'docs', 'editor', 'analyze', 'daily-review', 'study-packs', 'citations', 'games'];
      if (allowed.includes(view as WorkspaceView)) {
        setView(view as WorkspaceView);
      }
    };
    window.addEventListener(WS_SWITCH_VIEW_EVENT, handler);
    return () => window.removeEventListener(WS_SWITCH_VIEW_EVENT, handler);
  }, []);
  // Editor opens with the rail collapsed so the paper gets full width;
  // the › button expands it to the labelled rail when needed.
  const [railCollapsed, setRailCollapsed] = useState(true);
  // Re-collapse whenever a document is opened (including switching docs)
  // so the writing surface always starts with maximum width.
  useEffect(() => {
    if (view === 'editor' && openDocId) setRailCollapsed(true);
  }, [view, openDocId]);
  const [openDoc, setOpenDoc] = useState<DocFull | null>(null);
  const [docList, setDocList] = useState<DocSummary[]>([]);
  const [packList, setPackList] = useState<HubStudyPack[]>([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // A PDF the user picked, held until they acknowledge that PDFs
  // come in as plain text (formatting/structure isn't recoverable).
  const [pdfNoticeFile, setPdfNoticeFile] = useState<File | null>(null);
  // Full-screen "importing your paper…" animation while a file is
  // parsed + the doc is created (esp. the PDF server round-trip).
  const [importing, setImporting] = useState(false);
  // After a plain upload lands in the editor, nudge the user to run
  // an analysis (upload-and-analyse already auto-runs it, so skip).
  const [showAnalyzeNudge, setShowAnalyzeNudge] = useState(false);
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
  // Soft paywall shown once after a free user's first editor analysis
  // finishes. Dismissible — they keep the (gated) editor afterwards.
  const [showSoftPaywall, setShowSoftPaywall] = useState(false);
  const softPaywallSeenRef = useRef(false);
  // Bumped to ask DocumentEditorView to open its analyze-confirm
  // modal (with the citation/grade picker) from the upload nudge.
  const [analyzeConfirmSignal, setAnalyzeConfirmSignal] = useState(0);
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
      // `cache: 'no-store'` so we don't get a stale 304 (without the
      // contentPreview field) after deploying the preview-text change.
      const res = await fetch(`${API_URL}/documents?limit=100&sortBy=updated_at&sortOrder=desc`, { headers: authHeaders(), cache: 'no-store' });
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
          contentPreview: String(d.contentPreview ?? d.content_preview ?? ''),
          expiresAt: (d.expiresAt ?? d.expires_at ?? null) as string | null,
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

  useEffect(() => { if (view === 'hub' || view === 'docs') void refreshList(); }, [view, refreshList]);

  const refreshPacks = useCallback(async () => {
    setPacksLoading(true);
    try {
      const res = await fetch(`${API_URL}/analysis/quiz-history?limit=20`, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const rows: unknown[] = Array.isArray(json) ? json : (json?.data ?? json?.quizzes ?? []);
      const objs = rows.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object');
      setPackList(
        objs
          .filter((r) => r.quiz_type === 'study_pack')
          .map((r) => ({
            id: String(r.id ?? ''),
            title: String(r.title ?? 'Study pack'),
            createdAt: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
            questions: r.questions ?? r,
            expiresAt: (r.expires_at ?? r.expiresAt ?? null) as string | null,
          }))
          .filter((p) => p.id),
      );
    } catch {
      /* recents stay document-only if this fails */
    } finally {
      setPacksLoading(false);
    }
  }, []);

  useEffect(() => { if (view === 'hub') void refreshPacks(); }, [view, refreshPacks]);

  const hubPacks = useMemo(() => {
    if (!highlightPack) return packList;
    try {
      const raw = sessionStorage.getItem(STUDY_PACK_VIEWER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.data) return packList;
      const title = String(parsed.title || 'Study pack');
      if (packList.some((p) => p.title === title)) return packList;
      return [
        {
          id: '__onboarding_pack__',
          title,
          createdAt: new Date().toISOString(),
          questions: parsed.data,
        },
        ...packList,
      ];
    } catch {
      return packList;
    }
  }, [packList, highlightPack]);

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
        if (cancelled || !d) return;
        setOpenDoc({
          id: String(d.id),
          title: String(d.title ?? 'Untitled'),
          originalFilename: String(d.originalFilename ?? d.original_filename ?? ''),
          fileType: String(d.fileType ?? d.file_type ?? ''),
          fileSize: Number(d.fileSize ?? d.file_size ?? 0),
          wordCount: Number(d.wordCount ?? d.word_count ?? 0),
          pageCount: Number(d.pageCount ?? d.page_count ?? 0),
          uploadStatus: String(d.uploadStatus ?? d.upload_status ?? 'completed'),
          createdAt: String(d.createdAt ?? d.created_at ?? new Date().toISOString()),
          updatedAt: String(d.updatedAt ?? d.updated_at ?? new Date().toISOString()),
          lastEditedAt: (d.lastEditedAt ?? d.last_edited_at ?? null) as string | null,
          isDraft: false,
          isUpload: false,
          contentHtml: (d.contentHtml ?? d.content_html ?? null) as string | null,
          contentText: (d.contentText ?? d.content_text ?? null) as string | null,
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
    setShowAnalyzeNudge(false);
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

  /** Blank drafts (write from scratch) are Pro-only; uploads and paste stay free. */
  const requestBlankDraft = useCallback(() => {
    if (trialGated) {
      onTrialGate?.();
      return;
    }
    if (!isPaidPlan(user)) {
      trackEvent('upgrade_clicked', { source: 'blank_draft' });
      openUpgradePaywall('blank_draft');
      return;
    }
    void handleNewDoc();
  }, [trialGated, onTrialGate, user, handleNewDoc]);

  const runUpload = useCallback(async (file: File) => {
    setShowAnalyzeNudge(false);
    setImporting(true);
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
        // Plain upload → push them toward an analysis. The
        // upload-and-analyse path auto-runs it, so skip the nudge.
        if (!analyzeOnOpenRef.current) setShowAnalyzeNudge(true);
      }
    } catch (e) {
      console.error('[Documents] import error', e);
      analyzeOnOpenRef.current = false; // failed import: drop any analyse intent
      setError('Could not read that file. Try a .pdf, .docx or .txt — or paste the text in.');
    } finally {
      setImporting(false);
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
    if (id === highlightDocId) clearOnboardingHighlight();
    setOpenDocId(id);
    setOpenDoc(null);
    setView('editor');
    // Update URL for deep-linking — uses pushState so the back
    // button returns to the hub instead of the previous tab.
    try { window.history.pushState({}, '', `/documents/${id}`); } catch { /* ignore */ }
  }, [highlightDocId, clearOnboardingHighlight]);

  const handleBackToHub = useCallback(() => {
    analyzeOnOpenRef.current = false;
    setShowAnalyzeNudge(false);
    setView('hub');
    setOpenDocId(null);
    setOpenDoc(null);
    try { window.history.pushState({}, '', '/documents'); } catch { /* ignore */ }
  }, []);

  /** Logo / wordmark — always return to the main dashboard hub. */
  const goHomeDashboard = useCallback(() => {
    analyzeOnOpenRef.current = false;
    setShowAnalyzeNudge(false);
    setView('hub');
    setOpenDocId(null);
    setOpenDoc(null);
    onNavigate('dashboard');
  }, [onNavigate]);

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
  const handleAnalyzeInEditor = useCallback(async (opts?: AnalyzeStyleOptions) => {
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
    // no longer valid against the new annotations). Drop the persisted
    // store too so the now-stale revisions don't resurrect on refresh.
    setAppliedRevisions(new Map());
    try {
      if (openDocId) {
        localStorage.removeItem(`writescholar_applied_revisions_${openDocId}`);
        void fetch(`${API_URL}/analysis/revision-markers`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: openDocId, wsRevisionCache: {} }),
        }).catch(() => {});
      }
    } catch { /* ignore */ }
    revisionCacheRef.current.clear();
    setApplyingAnnotationId(null);
    // Hard timeout so a stalled request can't pin the analyzer
    // panel in its loading state forever.
    const abort = new AbortController();
    const timeoutId = window.setTimeout(() => abort.abort(), 120000);
    // Citation style sticks per browser; grade format defaults to US
    // unless the user's last completed analysis used UK.
    let citationStyle = opts?.citationStyle ?? 'None';
    if (!opts?.citationStyle) {
      try {
        citationStyle = localStorage.getItem('writescholar_editor_citation_style') || 'None';
      } catch { /* default */ }
    }
    const gradingStyle = resolveGradingStyleForAnalyze(opts);
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
          citationStyle,
          gradingStyle,
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
      // Free tier: everything from the document midpoint onward is
      // locked (blurred comment, hidden fix, gated Apply, locked
      // tooltip). Paid users lock nothing.
      const lockFromIndex = isPaidPlan(user)
        ? Number.POSITIVE_INFINITY
        : Math.floor((text?.length || 0) / 2);
      const annotations = normalizeAnnotations(payload?.annotations).map((a) => ({
        ...a,
        locked: a.startIndex >= lockFromIndex,
      }));
      const rubricRaw = payload?.grade_rubric ?? payload?.rubric ?? [];
      setAnalyzerResult({
        annotations,
        overallScore: typeof payload?.overall_score === 'number' ? payload.overall_score : null,
        gradeEstimate: payload?.grade_estimate != null ? String(payload.grade_estimate) : null,
        clarityRating: typeof payload?.clarity_rating === 'number' ? payload.clarity_rating : null,
        topSuggestions: normalizeTopSuggestions(payload?.top_suggestions),
        comprehensiveText: extractComprehensiveText(payload as Record<string, unknown>),
        rubric: normalizeRubricRows(rubricRaw),
      });
      persistLastAnalysisGradingStyle(gradingStyle);
      try { localStorage.setItem('writescholar_editor_citation_style', citationStyle); } catch { /* noop */ }
      trackEvent('preview_ran', { feature: 'analysis', annotations: annotations.length });
      // Funnel step 2 of 4 — activation. This is the primary analyze path
      // (the workspace editor), so it's the one the funnel has to measure.
      trackFunnelStep('analysis_completed', {
        source: 'editor',
        annotations: annotations.length,
        paid: isPaidPlan(user),
      });
      if (!isPaidPlan(user)) {
        trackEvent('lock_viewed', {
          feature: 'analysis',
          locked: annotations.filter((a) => a.locked).length,
        });
      }
      // Soft paywall is NOT shown here — it fires once a free user
      // has scrolled ~65% through their paper after an analysis
      // (see the scroll-progress effect below), capped to once a day.
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
  // Persist the applied-revision map (annotation id → original +
  // replacement text) per document so a refresh keeps the "Revert"
  // state AND the original text needed to undo. Cleared on re-analyze.
  const persistAppliedRevisions = useCallback((docId: string | null, map: Map<string, { originalText: string; replacementText: string }>) => {
    if (!docId) return;
    // 1. Local cache — instant + offline.
    try {
      const key = `writescholar_applied_revisions_${docId}`;
      if (map.size === 0) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify([...map.entries()]));
    } catch { /* localStorage quota/serialisation — non-fatal */ }
    // 2. Server — cross-device. Persist JUST the markers (no content),
    //    so the editor's own content autosave is never clobbered.
    try {
      const wsRevisionCache = Object.fromEntries(
        [...map.entries()].map(([id, r]) => [id, { sourceSpan: r.originalText, replacement: r.replacementText }])
      );
      void fetch(`${API_URL}/analysis/revision-markers`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, wsRevisionCache }),
      }).catch(() => { /* offline / non-fatal — localStorage still holds it */ });
    } catch { /* ignore */ }
  }, []);

  const handleApplyRevision = useCallback(async (annotationId: string) => {
    if (!editorRef.current || !analyzerResult || applyingAnnotationId) return;
    // Already applied → nothing to do (the card shows "Revert").
    if (appliedRevisions.has(annotationId)) return;
    const ann = analyzerResult.annotations.find((a) => a.id === annotationId);
    if (!ann) return;

    // Free users: don't hit the (Pro-gated) endpoint or eat a 403 —
    // show a teased upgrade moment with what the rewrite would do.
    // Apply revision is a Pro feature for the whole document.
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
        persistAppliedRevisions(openDocId, next);
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
        persistAppliedRevisions(openDocId, next);
        return next;
      });
    } catch (e) {
      console.error('[Documents] apply-revision error', e);
      setAnalyzerError(e instanceof Error ? e.message : 'Could not apply that revision.');
    } finally {
      setApplyingAnnotationId(null);
    }
  }, [analyzerResult, applyingAnnotationId, appliedRevisions, openDoc, openDocId, persistAppliedRevisions, user]);

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
      persistAppliedRevisions(openDocId, next);
      return next;
    });
    if (ok) {
      setAnalyzerError(null);
    } else {
      setAnalyzerError("Auto-revert couldn't find the revised text (it was edited further). Press ⌘Z to undo, or edit it back — re-applying will reuse the saved revision instantly.");
    }
  }, [appliedRevisions, openDocId, persistAppliedRevisions]);

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

  // Reset analyzer state ONLY on a real document switch (openDocId) —
  // keyed identically to the restore effect below so the two stay
  // coordinated. Previously this also keyed on openDoc.contentText,
  // which wiped a freshly-restored analysis the instant the doc's
  // content arrived/reloaded (e.g. returning from the full report or
  // a slow first load) while the restore effect — keyed only on
  // openDocId — never re-ran. That left the editor saying "not
  // analyzed" with no highlights until a hard refresh.
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
  }, [openDocId]);

  // Keep the analyzer's text snapshot in sync with the loaded doc
  // WITHOUT resetting analysis — so content load / report-return
  // never nukes restored annotations.
  useEffect(() => {
    latestTextRef.current = openDoc?.contentText ?? '';
  }, [openDoc?.contentText]);

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
        const ar = parseAnalysisResults(row.analysis_results ?? row.analysisResults);
        const hasPayload =
          ar.annotations != null ||
          ar.overall_score != null ||
          ar.grade_estimate != null ||
          ar.grade_rubric != null ||
          ar.gradeRubric != null ||
          typeof ar.result === 'string';
        if (!hasPayload) return;
        // Recompute the free-tier positional lock on restore too —
        // otherwise closing the full report (which re-hydrates from
        // the saved row) un-gated every annotation for free users.
        const restoreText = latestTextRef.current || openDoc?.contentText || '';
        const restoreLockFromIndex = isPaidPlan(user)
          ? Number.POSITIVE_INFINITY
          : Math.floor((restoreText.length || 0) / 2);
        const annotations = normalizeAnnotations(ar.annotations).map((a) => ({
          ...a,
          locked: a.startIndex >= restoreLockFromIndex,
        }));
        if (cancelled) return;
        setAnalyzerResult({
          annotations,
          overallScore: typeof ar.overall_score === 'number' ? ar.overall_score : null,
          gradeEstimate: ar.grade_estimate != null ? String(ar.grade_estimate) : null,
          clarityRating: typeof ar.clarity_rating === 'number' ? ar.clarity_rating : null,
          topSuggestions: normalizeTopSuggestions(ar.top_suggestions),
          comprehensiveText: extractComprehensiveText(ar),
          rubric: normalizeRubricRows(ar.grade_rubric ?? ar.gradeRubric),
        });
        // Restore which revisions were already applied (+ the original
        // text needed to revert) so refresh / another device keeps the
        // "Revert" state. Prefer the server copy (ws_revision_cache,
        // cross-device); fall back to the local cache.
        try {
          const validIds = new Set(annotations.map((a: { id: string }) => a.id));
          let restored = new Map<string, { originalText: string; replacementText: string }>();
          const serverCache = (ar as { ws_revision_cache?: Record<string, { sourceSpan?: string; replacement?: string }> }).ws_revision_cache;
          if (serverCache && typeof serverCache === 'object') {
            for (const [id, r] of Object.entries(serverCache)) {
              if (validIds.has(id) && r && typeof r.replacement === 'string') {
                restored.set(id, { originalText: String(r.sourceSpan ?? ''), replacementText: String(r.replacement) });
              }
            }
          }
          if (restored.size === 0) {
            const raw = localStorage.getItem(`writescholar_applied_revisions_${openDocId}`);
            if (raw) {
              const entries = JSON.parse(raw) as [string, { originalText: string; replacementText: string }][];
              restored = new Map(entries.filter(([id]) => validIds.has(id)));
            }
          }
          if (restored.size > 0) {
            setAppliedRevisions(restored);
            // Re-seed the in-memory replacement cache so re-applying
            // after a refresh is instant + free (no extra API call).
            restored.forEach((rec, id) => revisionCacheRef.current.set(id, rec.replacementText));
          }
        } catch { /* ignore corrupt/absent store */ }
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

  // Soft paywall — fire when a free user, after an analysis, has
  // scrolled ~65% of the way through their paper (NOT at the 50%
  // divider — that popped too early and startled people).
  //
  //   • FIRST time ever they cross 65%: always show — this is the
  //     welcome-discount moment. SoftPaywall itself renders the
  //     $9.99 first-month offer + the one-shot "last chance" pop-up
  //     (its FIRST_PAYWALL_DISCOUNT_SHOWN_KEY logic), so the daily
  //     cap must NOT swallow it.
  //   • After that: plain $19.99 (SoftPaywall's discount flag is
  //     spent), capped to once per calendar day per browser.
  // Dismissible; they keep the (gated) editor afterwards.
  useEffect(() => {
    if (isPaidPlan(user)) return;
    if (softPaywallSeenRef.current) return;
    if (!analyzerResult) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    let firstTime = true;
    try {
      firstTime = localStorage.getItem('ws_editor_softpaywall_first') !== '1';
      // Subsequent times only: at most once per day. The first ever
      // crossing always shows (the discount moment).
      if (!firstTime && localStorage.getItem('ws_editor_softpaywall_day') === todayKey) return;
    } catch { /* localStorage unavailable — fall through, ref still caps it */ }
    const root = editorRef.current?.view?.dom as HTMLElement | undefined;
    if (!root) return;
    const SCROLL_THRESHOLD = 0.65; // ~65% of the paper scrolled past the fold
    let ticking = false;
    const check = () => {
      ticking = false;
      if (softPaywallSeenRef.current) return;
      const rect = root.getBoundingClientRect();
      if (rect.height <= 0) return;
      // Fraction of the prose that has scrolled above the viewport top.
      const scrolled = -rect.top / rect.height;
      if (scrolled >= SCROLL_THRESHOLD) {
        softPaywallSeenRef.current = true;
        try {
          localStorage.setItem('ws_editor_softpaywall_first', '1');
          localStorage.setItem('ws_editor_softpaywall_day', todayKey);
        } catch { /* ignore */ }
        setShowSoftPaywall(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // in case the doc is already scrolled past the threshold
    return () => window.removeEventListener('scroll', onScroll);
  }, [analyzerResult, user]);

  // Pull the remaining-analyses count whenever a document opens so
  // the editor's top-right chip is accurate before they analyze.
  useEffect(() => {
    if (view === 'editor' && openDocId) void refreshUsage();
  }, [view, openDocId, refreshUsage]);

  const promoBanner = !isPaidPlan(user) ? (
    <PromoBanner variant="app" onCta={() => onNavigate('pricing')} ctaLabel="Unlock Pro" />
  ) : undefined;

  // ─── Render ───────────────────────────────────────────────────
  const handleRailSelect = (v: WorkspaceView) => {
    // Trial gate: never-trialed free users can stay on the hub, but switching
    // into any tool view opens the app-level hard-paywall overlay instead.
    if (trialGated && v !== 'hub') {
      onTrialGate?.();
      return;
    }
    // Leaving the fast-path landing view retires the one-shot mascot
    // acknowledgment — it shouldn't reappear if they come back later.
    if (firstRunNudge !== null && v !== firstRunNudge) setFirstRunNudge(null);
    setView(v);
    if (v === 'hub') {
      try { window.history.pushState({}, '', '/documents'); } catch { /* ignore */ }
    }
  };

  if (view === 'editor' && openDocId) {
    if (!openDoc) {
      return (
        <WorkspaceShell activeView={view} onSelect={handleRailSelect} bare headerless collapsed={railCollapsed} onToggle={() => setRailCollapsed((v) => !v)} usage={docUsage} onUpgrade={() => onNavigate('pricing')} onNavigateBadges={() => onNavigate('badges')} onNavigateHome={goHomeDashboard} user={user} onNavigateAccount={() => onNavigate('account')} onNavigateBlog={() => onNavigate('blog')} banner={promoBanner}>
          <div className="px-4 py-16 text-center text-sm font-bold text-stone-500">Loading document…</div>
        </WorkspaceShell>
      );
    }
    return (
      <WorkspaceShell activeView={view} onSelect={handleRailSelect} bare headerless collapsed={railCollapsed} onToggle={() => setRailCollapsed((v) => !v)} usage={docUsage} onUpgrade={() => onNavigate('pricing')} onNavigateBadges={() => onNavigate('badges')} onNavigateHome={goHomeDashboard} user={user} onNavigateAccount={() => onNavigate('account')} onNavigateBlog={() => onNavigate('blog')} banner={promoBanner}>
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
          onOpenClassicReport={handleOpenFullReport}
          documentText={latestTextRef.current || openDoc.contentText || ''}
          wordLimit={isPaidPlan(user) || !FREE_EDITOR_WORD_LIMIT ? null : FREE_EDITOR_WORD_LIMIT}
          onUpgrade={() => { trackEvent('upgrade_clicked', { source: 'analyzer_panel' }); openUpgradePaywall('analyzer_panel'); }}
          analysesLeft={analysesLeft}
          revisionsLocked={!isPaidPlan(user)}
          revisionPaywallAnn={revisionPaywallAnn}
          onCloseRevisionPaywall={() => setRevisionPaywallAnn(null)}
          analyzeConfirmSignal={analyzeConfirmSignal}
        />
        <GenerationOverlay open={analyzerLoading} variant="analyze" />
        {/* Post-upload nudge — pushes a freshly imported paper toward
            an analysis. Auto-hides once they engage the analyzer. */}
        {showAnalyzeNudge && !analyzerResult && !analyzerLoading && !analyzerError && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[120] w-[min(92vw,30rem)] ws-nudge-in">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#7733B5] bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white px-4 py-3 shadow-[0_22px_50px_-18px_rgba(165,96,232,0.7)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 border-2 border-white/30" aria-hidden>
                <I.Sparkle />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Paper imported — get it graded</p>
                <p className="text-[11px] font-bold text-white/85 leading-tight mt-0.5">See your estimated grade and line-by-line fixes.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAnalyzeNudge(false); setAnalyzeConfirmSignal((s) => s + 1); }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#7733B5] text-[11px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-white/70 hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Analyze
              </button>
              <button
                type="button"
                onClick={() => setShowAnalyzeNudge(false)}
                aria-label="Dismiss"
                className="shrink-0 -mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}
        {/* Tooltip fade keyframes — hosted at the page level so the
            tooltip's portal'd rendering never loses its animation. */}
        <style>{`
          @keyframes wsTooltipIn {
            0%   { opacity: 0; transform: translateY(-100%) translateY(-4px) scale(0.96); }
            100% { opacity: 1; transform: translateY(-100%) translateY(0)    scale(1); }
          }
          .ws-tooltip-in { animation: wsTooltipIn 140ms cubic-bezier(0.34, 1.56, 0.64, 1); transform-origin: 50% 100%; }
          @keyframes wsNudgeIn {
            0%   { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.97); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
          }
          .ws-nudge-in { animation: wsNudgeIn 260ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        `}</style>
        {showSoftPaywall && !isPaidPlan(user) && (
          <SoftPaywall
            userName={firstNameOf(user)}
            onStartTrial={() => {}}
            onDismiss={() => setShowSoftPaywall(false)}
            onNavigate={onNavigate}
          />
        )}
      </WorkspaceShell>
    );
  }

  const dashboardTopBar = (
    <DashboardTopBar
      user={user}
      plan={String((user?.plan ?? user?.subscriptionPlan ?? 'free') as string).toLowerCase()}
      onNavigate={onNavigate}
      onLogout={onLogout}
      variant="dashboard"
      // On the hub the bar sits inline in the greeting row, so it
      // needs no floating white surface of its own.
      chromeless={view === 'hub' || view === 'docs'}
    />
  );

  return (
    <>
      <WorkspaceShell
        activeView={view}
        onSelect={handleRailSelect}
        headerless
        usage={docUsage}
        onUpgrade={() => onNavigate('pricing')}
        onNavigateBadges={() => onNavigate('badges')}
        onNavigateHome={goHomeDashboard}
        user={user}
        onNavigateAccount={() => onNavigate('account')}
        onNavigateBlog={() => onNavigate('blog')}
        topBar={view === 'hub' || view === 'docs' ? undefined : dashboardTopBar}
        banner={promoBanner}
        footer={<Footer onNavigate={onNavigate} />}
      >
        {/* First-run acknowledgment — one-shot mascot line shown only on
            the fast-path landing right after onboarding. Tells the user
            we routed them based on their own survey pick, then points
            them at the input below. Dismissed by the X or by navigating
            to any other view. */}
        {firstRunNudge !== null && firstRunNudge === view && view !== 'hub' && (
          <div className="mx-auto w-full max-w-3xl px-4 pt-4">
            <div className="relative flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#7733B5] bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-4 py-3">
              <img src="/mascot-celebrating.webp" alt="" width={48} height={48} className="w-12 h-12 object-contain shrink-0" loading="eager" />
              <p className="min-w-0 flex-1 text-[13px] sm:text-sm font-extrabold text-[#3C3C3C] dark:text-stone-100 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {view === 'analyze' && <>You said you wanted feedback on your essays — paste one in below and I&apos;ll grade it 👇</>}
                {view === 'study-packs' && <>You said you wanted flashcards &amp; quizzes — drop your notes in and I&apos;ll build your study pack 👇</>}
                {view === 'daily-review' && <>You said you wanted daily practice — let&apos;s do a quick review session 👇</>}
                {view === 'games' && <>You picked arcade mode — load your notes into a game and start playing 👇</>}
              </p>
              <button
                type="button"
                onClick={() => setFirstRunNudge(null)}
                aria-label="Dismiss"
                className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}
        {view === 'hub' && (
          <DocumentsHub
            docs={docList}
            packs={hubPacks}
            packsLoading={packsLoading}
            loading={listLoading}
            onNew={requestBlankDraft}
            onOpen={handleOpenDoc}
            onOpenPack={openHubStudyPack}
            onUpload={(f: File) => { if (trialGated) { onTrialGate?.(); return; } handleUpload(f); }}
            onDownload={handleDownload}
            onDelete={(id) => setConfirmDeleteId(id)}
            userName={firstNameOf(user)}
            user={user}
            usage={docUsage}
            onSwitchView={handleRailSelect}
            onNavigate={onNavigate}
            topBar={dashboardTopBar}
            highlightDocId={highlightDocId}
            highlightPack={highlightPack}
            highlightTool={highlightTool}
            onDismissHighlight={clearOnboardingHighlight}
            onOpenHighlightedPack={openOnboardingStudyPack}
            onOpenHighlightedTool={openOnboardingTool}
          />
        )}
        {view === 'docs' && (
          <DocumentsLibrary
            docs={docList}
            loading={listLoading}
            onNew={requestBlankDraft}
            onOpen={handleOpenDoc}
            onUpload={(f: File) => { if (trialGated) { onTrialGate?.(); return; } handleUpload(f); }}
            onDownload={handleDownload}
            onDelete={(id) => setConfirmDeleteId(id)}
            onUpgrade={() => onNavigate('pricing')}
            usage={docUsage}
            topBar={dashboardTopBar}
          />
        )}
        {view === 'analyze' && (
          <>
            <PanelHeader
              eyebrow="Feedback"
              title="Analyze a paper"
              subtitle="Get professor-style feedback marked up right inside the document: strengths, fixes, and a grade estimate."
              tint={SIDEBAR_TOOLS.find((t) => t.view === 'analyze')}
              mascotSrc="/mascot-thinking.webp"
            />
            <AnalyzePanel
              docs={docList}
              loading={listLoading}
              onPickDoc={handleAnalyzeFromHub}
              onPasteAnalyze={handlePasteAnalyze}
              onUploadFile={handleUploadAndAnalyze}
              onNew={requestBlankDraft}
            />
          </>
        )}
        {view === 'daily-review' && (
          <>
            <PanelHeader
              eyebrow="Review"
              title="Daily review"
              subtitle="A quick recall session pulled from everything you've studied. Keep your streak alive."
              tint={SIDEBAR_TOOLS.find((t) => t.view === 'daily-review')}
              mascotSrc="/mascot-celebrating.webp"
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
              subtitle="Turn any notes into a lesson, flashcards, a quiz, a crossword and arcade mode."
              tint={SIDEBAR_TOOLS.find((t) => t.view === 'study-packs')}
              mascotSrc="/mascot-juggling.webp"
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
              tint={SIDEBAR_TOOLS.find((t) => t.view === 'citations')}
              mascotSrc="/mascot-pointing.webp"
            />
            <CitationsPanel onNavigate={onNavigate} isPaid={isPaidPlan(user)} />
          </>
        )}
        {view === 'games' && (
          <>
            <PanelHeader
              eyebrow="Arcade"
              title="Arcade mode"
              subtitle="Drill recall the fun way. Load Crater Blast, Word Tower & Word Blitz with your own notes via Study Packs."
              tint={SIDEBAR_TOOLS.find((t) => t.view === 'games')}
              mascotSrc="/mascot-jumping-joy.webp"
            />
            <GamesPanel onNavigate={onNavigate} onOpenStudyPacks={() => setView('study-packs')} />
          </>
        )}
      </WorkspaceShell>
      {importing && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="status" aria-live="polite" aria-label="Importing your paper">
          <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 px-9 py-8 shadow-[0_24px_60px_-28px_rgba(96,48,140,0.45)]">
            <div className="relative h-14 w-14">
              <svg className="absolute inset-0 h-14 w-14 animate-spin text-[#A560E8]" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.18} strokeWidth={3} />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[#A560E8]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Importing your paper…</p>
              <p className="mt-1 text-[12px] font-bold text-stone-500 dark:text-stone-400">Reading the text and setting up your editor.</p>
            </div>
            <div className="h-1.5 w-52 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#A560E8] to-[#7733B5] ws-import-bar" />
            </div>
          </div>
          <style>{`
            @keyframes wsImportBar {
              0%   { transform: translateX(-120%); }
              100% { transform: translateX(420%); }
            }
            .ws-import-bar { animation: wsImportBar 1.1s ease-in-out infinite; }
          `}</style>
        </div>
      )}
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

const __unused_probe = 42;
