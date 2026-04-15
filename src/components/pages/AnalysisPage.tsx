import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { diffWordsWithSpace } from 'diff';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import LoadingSpinner from '../common/LoadingSpinner';
import AnalysisAnimation from '../common/AnalysisAnimation';
import ScholarMascot from '../common/ScholarMascot';
import { ExportService, AnalysisData } from '../../services/exportService';
import { trackAction, getStats } from '../../data/achievements';
import { trackEvent } from '../../utils/analytics';
import ActivationAnalysisCoach from '../common/ActivationAnalysisCoach';
import SoftPaywall from '../common/SoftPaywall';
import {
  ACTIVATION_MOCK_ANALYSIS_MARKDOWN,
  ACTIVATION_OVERALL_SCORE,
  ACTIVATION_GRADE_LABEL,
  ACTIVATION_TUTORIAL_CONCERN_REVISION_ID,
  ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID,
  ACTIVATION_TUTORIAL_APPLYABLE_IDS,
  ACTIVATION_CONCERN_SPAN,
  ACTIVATION_CONCERN_REWRITE,
  ACTIVATION_IMPROVE_SPAN,
  ACTIVATION_IMPROVE_REWRITE,
  buildActivationAnnotationsForDocument,
  buildActivationGradeRubric,
  ACTIVATION_SPECIFIC_REWRITES,
} from '../../data/activationTutorialMock';
import { persistTutorialToServer } from '../../utils/onboarding';
import { POST_ACTIVATION_PAYWALL_PENDING_KEY } from '../../constants/paywallSession';

/** Supabase/JSON occasionally returns analysis_results as a string — normalize for library reloads. */
function normalizeSavedAnalysisResults(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

/**
 * Normalize draft text before diffing so highlights match real edits, not CRLF/Unicode drift.
 * Character-level diffs were fragmenting mid-word; word-level diff on normalized strings is stable.
 */
function normalizeDraftForCompare(text: string): string {
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').normalize('NFC');
}

/** Simple markdown-to-HTML for analysis result display */
function simpleMarkdownToHtml(md: string): string {
  if (!md) return '';
  const escape = (t: string) => {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  };
  return md
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      const h1 = trimmed.match(/^# (.+)$/);
      if (h1) return `<h2 class="text-xl font-bold mt-6 mb-2 text-stone-900 dark:text-stone-100">${escape(h1[1])}</h2>`;
      const h2 = trimmed.match(/^## (.+)$/);
      if (h2) return `<h3 class="text-lg font-semibold mt-4 mb-2 text-stone-800 dark:text-stone-200">${escape(h2[1])}</h3>`;
      const h3 = trimmed.match(/^### (.+)$/);
      if (h3) return `<h4 class="text-base font-semibold mt-3 mb-1 text-stone-700 dark:text-stone-300">${escape(h3[1])}</h4>`;
      const content = trimmed
        .replace(/\*\*([^*]+)\*\*/g, (_, m) => `<strong>${escape(m)}</strong>`)
        .replace(/\*([^*]+)\*/g, (_, m) => `<em>${escape(m)}</em>`)
        .replace(/`([^`]+)`/g, (_, m) => `<code class="bg-stone-100 dark:bg-stone-700 px-1 rounded text-sm">${escape(m)}</code>`);
      return content ? `<p class="mb-2 text-stone-700 dark:text-stone-300 leading-relaxed">${content}</p>` : '';
    })
    .join('');
}

function sanitizeAnalysisHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: ['class'],
  });
}

/** Matches backend comprehensive prompt — shown when grade_rubric is withheld for free users */
const STANDARD_GRADE_RUBRIC_PREVIEW: { key: string; label: string; maxScore: number }[] = [
  { key: 'thesis_and_argument', label: 'Thesis & argument', maxScore: 20 },
  { key: 'response_to_question', label: 'Response to question', maxScore: 20 },
  { key: 'use_of_evidence_and_textual_support', label: 'Use of evidence & textual support', maxScore: 15 },
  { key: 'analysis_and_critical_thinking', label: 'Analysis & critical thinking', maxScore: 20 },
  { key: 'organization_and_structure', label: 'Organization & structure', maxScore: 15 },
  { key: 'writing_quality_and_clarity', label: 'Writing quality & clarity', maxScore: 10 },
];

function formatRubricCategoryLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Same rules as on-screen italic highlights — book titles, Latin phrases, etc. */
const ACADEMIC_ITALIC_PATTERNS: RegExp[] = [
  /\b(Get Out|The Dark Knight|White Privilege|Black Panther|Hegemony|McIntosh)\b/g,
  /(?:^|[.!?]\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})(?=\.|:|\s+Dir\.|\s+Perf\.|\s+Eds\.)/g,
  /\b(et al\.|ibid\.|op\. cit\.|sic|circa|ca\.|vs\.|viz\.)\b/gi,
  /(?:^|[.]\s+)([A-Z][a-z]+(?:,\s+[A-Z][a-z]+){2,})(?=\.)/g,
];

function escapeHtmlForCopy(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mirrors renderTextWithItalics; HTML fragment for rich clipboard (Word, Docs). */
function textToHtmlWithItalics(text: string): string {
  let parts: string[] = [];
  let lastIndex = 0;
  let foundMatch = false;

  ACADEMIC_ITALIC_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index >= lastIndex) {
        foundMatch = true;
        if (match.index > lastIndex) {
          parts.push(escapeHtmlForCopy(text.slice(lastIndex, match.index)));
        }
        parts.push(`<em>${escapeHtmlForCopy(match[0])}</em>`);
        lastIndex = match.index + match[0].length;
      }
    }
  });

  if (!foundMatch || lastIndex === 0) {
    return escapeHtmlForCopy(text);
  }
  if (lastIndex < text.length) {
    parts.push(escapeHtmlForCopy(text.slice(lastIndex)));
  }
  return parts.join('');
}

function FreeAnalysisProBlur({
  children,
  onUpgrade,
  dense,
  headline,
  primaryLabel = 'Upgrade to Pro',
  sublabel = 'Unlock full feedback on your paper — annotations, grade breakdown, and exports.',
  upgradeDisabled,
}: {
  children: React.ReactNode;
  onUpgrade: () => void;
  dense?: boolean;
  headline?: string;
  primaryLabel?: string;
  sublabel?: string;
  upgradeDisabled?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-violet-300/80 bg-gradient-to-b from-violet-100/40 via-white to-stone-50/95 shadow-[0_12px_40px_-12px_rgba(109,40,217,0.35)] ring-1 ring-violet-400/15 dark:border-violet-700/45 dark:from-violet-950/50 dark:via-stone-900 dark:to-stone-950 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)] dark:ring-violet-500/10 ${
        dense ? 'my-1' : 'my-2'
      }`}
    >
      {/* Soft edge light — draws the eye */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 dark:opacity-40"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, transparent 40%, transparent 60%, rgba(167,139,250,0.15) 100%)',
        }}
      />
      {/* Blurred “peek” — real shapes readable enough to tease, not enough to use */}
      <div
        className={`pointer-events-none relative overflow-hidden ${dense ? 'min-h-[72px] max-h-[100px]' : 'min-h-[140px] max-h-[min(260px,42vh)]'}`}
        aria-hidden
      >
        <div className="select-none px-4 pb-10 pt-3 blur-[11px] contrast-[0.92] sm:blur-[13px] opacity-[0.78] [transform:translateZ(0)] scale-[1.015] dark:opacity-[0.72]">
          {children}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/90 to-transparent dark:from-stone-950/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-stone-950 dark:via-stone-950/90" />
      </div>
      {/* CTA — centered over blur; z-index so it always wins stacking */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-3 py-4 sm:gap-2.5 sm:px-4">
        <div className="flex items-center gap-2 rounded-full border border-violet-200/90 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 shadow-sm backdrop-blur-md dark:border-violet-600/50 dark:bg-stone-900/75 dark:text-violet-300">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Pro
        </div>
        {headline ? (
          <p
            className={`max-w-[19rem] text-center font-semibold leading-snug text-stone-900 drop-shadow-sm dark:text-stone-50 ${
              dense ? 'text-xs' : 'text-sm'
            }`}
          >
            {headline}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onUpgrade}
          disabled={upgradeDisabled}
          className="relative px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/35 transition-all hover:scale-[1.02] hover:shadow-violet-500/45 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600"
        >
          {primaryLabel}
        </button>
        <span className="max-w-[18rem] text-center text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
          {sublabel}
        </span>
      </div>
    </div>
  );
}

interface AnalysisPageProps {
  onNavigate?: (page: string) => void;
  user?: { 
    id: string; 
    name: string; 
    email: string; 
    firstName?: string; 
    lastName?: string; 
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
    onboardingCompleted?: boolean;
    welcomeTutorialCompleted?: boolean;
  } | null;
  onLogout?: () => void;
  /** Sync welcome tutorial completion to app shell (same as dashboard). */
  onUserUpdate?: (updates: { welcomeTutorialCompleted?: boolean }) => void;
}

interface Document {
  id: string;
  title: string;
  file_name?: string;
  originalFilename?: string;
  file_type?: string;
  fileType?: string;
  file_size?: number;
  fileSize?: number;
  created_at?: string;
  createdAt?: string;
  content_text?: string;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

interface Annotation {
  id: string;
  type: 'strong' | 'improve' | 'concern';
  text: string;
  startIndex: number;
  endIndex: number;
  comment: string;
  suggestion?: string;
  isCoverageOnly?: boolean; // Filler to avoid 200+ word gaps; not for scoring, still in export/sidebar
}

/** After inline replace [start,end) → newLen chars, remap every annotation so list length and ids stay the same. */
function mapAnnotationsAfterInlineReplace(
  list: Annotation[],
  appliedId: string,
  start: number,
  end: number,
  newLen: number,
  newContent: string
): Annotation[] {
  const oldLen = end - start;
  const delta = newLen - oldLen;
  const docLen = newContent.length;

  const clampRange = (ns: number, ne: number): [number, number] => {
    let a = Math.max(0, Math.min(ns, docLen));
    let b = Math.max(0, Math.min(ne, docLen));
    if (b <= a) {
      b = Math.min(a + 1, docLen);
    }
    return [a, b];
  };

  return list.map((ann) => {
    if (ann.id === appliedId) {
      const ne = start + newLen;
      const [a, b] = clampRange(start, ne);
      return {
        ...ann,
        startIndex: a,
        endIndex: b,
        text: newContent.slice(a, b),
      };
    }

    if (ann.endIndex <= start) {
      return ann;
    }

    if (ann.startIndex >= end) {
      const ns = ann.startIndex + delta;
      const ne = ann.endIndex + delta;
      const [a, b] = clampRange(ns, ne);
      return {
        ...ann,
        startIndex: a,
        endIndex: b,
        text: newContent.slice(a, b),
      };
    }

    // Overlaps replaced span [start, end)
    let ns = ann.startIndex;
    let ne = ann.endIndex;

    if (ann.startIndex >= start && ann.endIndex <= end) {
      ns = start + Math.round(((ann.startIndex - start) / oldLen) * newLen);
      ne = start + Math.round(((ann.endIndex - start) / oldLen) * newLen);
    } else if (ann.startIndex < start && ann.endIndex > start && ann.endIndex <= end) {
      ns = ann.startIndex;
      ne = start + Math.round(((ann.endIndex - start) / oldLen) * newLen);
    } else if (ann.startIndex >= start && ann.endIndex > end && ann.startIndex < end) {
      ns = start + Math.round(((ann.startIndex - start) / oldLen) * newLen);
      ne = ann.endIndex + delta;
    } else if (ann.startIndex < start && ann.endIndex > end) {
      ns = ann.startIndex;
      ne = ann.endIndex + delta;
    }

    const [a, b] = clampRange(ns, ne);
    return {
      ...ann,
      startIndex: a,
      endIndex: b,
      text: newContent.slice(a, b),
    };
  });
}

/** After replacing [repStart, repEnd) with newLen chars, shift or drop revision highlight ranges that tracked old indices. */
function shiftRevisionRangesAfterReplace(
  ranges: { start: number; end: number }[],
  repStart: number,
  repEnd: number,
  newLen: number
): { start: number; end: number }[] {
  const oldLen = repEnd - repStart;
  const delta = newLen - oldLen;
  return ranges
    .map((r) => {
      if (r.end <= repStart) return r;
      if (r.start >= repEnd) return { start: r.start + delta, end: r.end + delta };
      if (r.start >= repStart && r.end <= repEnd) return null;
      return null;
    })
    .filter((r): r is { start: number; end: number } => r != null);
}

/** Split a text chunk by any WriteScholar revision ranges (global indices). Revision segments render purple. */
function splitSegmentByRevisionRanges(
  text: string,
  chunkGlobalStart: number,
  revisedDraftRanges: { start: number; end: number }[]
): Array<{ type: 'normal' | 'revision'; text: string }> {
  if (!text) return [];
  if (!revisedDraftRanges.length) {
    return [{ type: 'normal', text }];
  }
  const g0 = chunkGlobalStart;
  const g1 = g0 + text.length;
  const ivs: [number, number][] = [];
  for (const r of revisedDraftRanges) {
    if (r.start >= r.end) continue;
    const s = Math.max(g0, r.start);
    const e = Math.min(g1, r.end);
    if (s < e) ivs.push([s, e]);
  }
  if (ivs.length === 0) {
    return [{ type: 'normal', text }];
  }
  ivs.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ivs) {
    const last = merged[merged.length - 1];
    if (!last || s > last[1]) {
      merged.push([s, e]);
    } else {
      last[1] = Math.max(last[1], e);
    }
  }
  const parts: Array<{ type: 'normal' | 'revision'; text: string }> = [];
  let cursor = g0;
  for (const [s, e] of merged) {
    if (cursor < s) {
      parts.push({ type: 'normal', text: text.slice(cursor - g0, s - g0) });
    }
    parts.push({ type: 'revision', text: text.slice(s - g0, e - g0) });
    cursor = e;
  }
  if (cursor < g1) {
    parts.push({ type: 'normal', text: text.slice(cursor - g0) });
  }
  return parts.length ? parts : [{ type: 'normal', text }];
}

/** Rebuild purple highlight ranges after loading from library (cache + current indices + replacement text). */
function buildRevisedDraftRangesFromCache(
  content: string,
  annList: Annotation[],
  cache: Record<string, { sourceSpan: string; replacement: string }>
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  for (const ann of annList) {
    const c = cache[ann.id];
    if (!c?.replacement) continue;
    const s = ann.startIndex;
    const e = ann.endIndex;
    if (s < 0 || e > content.length || s >= e) continue;
    const sl = content.slice(s, e);
    if (sl === c.replacement || sl.trim() === c.replacement.trim()) {
      ranges.push({ start: s, end: e });
    }
  }
  return ranges;
}

const REVISION_MARK_CLASS =
  'bg-violet-200/95 dark:bg-violet-900/50 text-violet-950 dark:text-violet-50 px-0.5 rounded-sm ring-2 ring-violet-500/80 dark:ring-violet-400/60 shadow-sm ring-offset-1 ring-offset-white dark:ring-offset-stone-900';

interface RubricCriterion {
  criterion: string;
  status: 'met' | 'partially_met' | 'not_met';
  score_estimate?: string;
  assessment: string;
  evidence?: string;
  suggestions?: string[];
}

interface RubricAlignment {
  success: boolean;
  result: string;
  criteria: RubricCriterion[];
  missingElements: string[];
  priorityImprovements: string[];
  overallAssessment: string;
  timestamp: string;
  model: string;
}

interface AnalysisResult {
  success: boolean;
  data: {
    analysisType: string;
    result: string;
    documentId?: string | null;
    timestamp: string;
    annotations?: Annotation[];
    lockedFeatures?: string[];
    overall_score?: number | null;
    grade_estimate?: string | null;
    clarity_rating?: string | null;
    top_suggestions?: string[];
    grade_rubric?: Record<string, { score: number; max_score: number; feedback: string }> | null;
    specific_rewrites?: Array<{ original: string; rewritten: string; reason: string }> | null;
    rubricAlignment?: RubricAlignment | null;
    savedAnalysisId?: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ onNavigate, user, onLogout, onUserUpdate }) => {
  const analyzingRef = useRef(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('comprehensive');
  const [selectedCitationStyle, setSelectedCitationStyle] = useState<string>('None');
  const [selectedGradingStyle, setSelectedGradingStyle] = useState<'us' | 'uk'>('us');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [limitExceededError, setLimitExceededError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [essayCopyFeedback, setEssayCopyFeedback] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isExporting, setIsExporting] = useState(false);
  const [applyingRevisionId, setApplyingRevisionId] = useState<string | null>(null);
  /** Snapshot before last WriteScholar apply (single-step undo). */
  const [writeScholarUndo, setWriteScholarUndo] = useState<{
    documentContent: string;
    previewContent: string;
    annotations: Annotation[];
    revisedDraftRanges: { start: number; end: number }[];
  } | null>(null);
  /** Global indices of every applied WriteScholar revision still in effect (purple until reverted). */
  const [revisedDraftRanges, setRevisedDraftRanges] = useState<{ start: number; end: number }[]>([]);
  const [revisionNoticeMeta, setRevisionNoticeMeta] = useState<{
    comment: string;
    type: 'improve' | 'concern';
  } | null>(null);
  /** Essay text as of when analysis finished (or loaded); for compare-before-revisions. */
  const [originalDraftBaseline, setOriginalDraftBaseline] = useState<string | null>(null);
  const [showCompareOriginalModal, setShowCompareOriginalModal] = useState(false);
  /** Cached OpenAI replacement per annotation (reuse after revert; avoids repeat API calls). */
  const [cachedWsRevisionByAnnotationId, setCachedWsRevisionByAnnotationId] = useState<
    Record<string, { sourceSpan: string; replacement: string }>
  >({});
  const [cameFromLibrary, setCameFromLibrary] = useState(false);
  const [showRubricSection, setShowRubricSection] = useState(true);
  const [rubricContent, setRubricContent] = useState<string>('');
  const [rubricInputMode, setRubricInputMode] = useState<'paste' | 'upload'>('paste');
  const [isParsingRubric, setIsParsingRubric] = useState(false);
  const [rubricAlignment, setRubricAlignment] = useState<any>(null);
  /** One-time Stripe trial — from GET /subscriptions/trial-eligibility `trialEligible` */
  const [canStartFreeTrial, setCanStartFreeTrial] = useState(false);
  /** True while creating Stripe Checkout session (Pro monthly) from analysis CTAs */
  const [checkoutRedirecting, setCheckoutRedirecting] = useState(false);
  const checkoutInFlightRef = useRef(false);
  const [lockedFeatures, setLockedFeatures] = useState<string[]>([]);
  const [gradeRubric, setGradeRubric] = useState<Record<string, { score: number; max_score: number; feedback: string }> | null>(null);
  const [specificRewrites, setSpecificRewrites] = useState<Array<{ original: string; rewritten: string; reason: string }> | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<{
    overall_score: number | null;
    grade_estimate: string | null;
    clarity_rating: string | null;
    top_suggestions: string[];
  }>({ overall_score: null, grade_estimate: null, clarity_rating: null, top_suggestions: [] });
  /** Post-signup activation tutorial: real UI, mock analysis */
  const [activationCoachStep, setActivationCoachStep] = useState<
    | 'off'
    | 'mla'
    | 'analyze'
    | 'loading'
    | 'doc'
    | 'rubric'
    | 'rewriteConcern'
    | 'rewriteImprove'
    | 'copyText'
    | 'library'
    | 'done'
  >('off');
  const [isActivationTutorial, setIsActivationTutorial] = useState(false);
  /** Full-screen checkout offer after activation tour (hard paywall, not the /pricing page). */
  const [showPostActivationPaywall, setShowPostActivationPaywall] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (sessionStorage.getItem(POST_ACTIVATION_PAYWALL_PENDING_KEY) !== '1') return false;
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const u = JSON.parse(raw) as { plan?: string };
      const plan = (u.plan || 'free').toLowerCase();
      if (plan === 'pro' || plan === 'premium') return false;
      return true;
    } catch {
      return false;
    }
  });
  /** Tour requires both mock revisions (one concern + one improve) before advancing. */
  const [activationConcernRevisionApplied, setActivationConcernRevisionApplied] = useState(false);
  const [activationImproveRevisionApplied, setActivationImproveRevisionApplied] = useState(false);
  const activationConcernDone = useMemo(() => {
    return (
      activationConcernRevisionApplied ||
      documentContent.includes(ACTIVATION_CONCERN_REWRITE) ||
      documentContent.includes(ACTIVATION_CONCERN_REWRITE.trim())
    );
  }, [activationConcernRevisionApplied, documentContent]);

  const activationImproveDone = useMemo(() => {
    return (
      activationImproveRevisionApplied ||
      documentContent.includes(ACTIVATION_IMPROVE_REWRITE) ||
      documentContent.includes(ACTIVATION_IMPROVE_REWRITE.trim())
    );
  }, [activationImproveRevisionApplied, documentContent]);

  const activationDualRevisionsDone = useMemo(() => {
    return activationConcernDone && activationImproveDone;
  }, [activationConcernDone, activationImproveDone]);

  /** Free plan: show first ~40% of essay + matching annotations; full analysis still runs server-side. */
  const isFreePreview = useMemo(
    () => currentPlan === 'free' && !isActivationTutorial,
    [currentPlan, isActivationTutorial]
  );

  const freePreviewCharCutoff = useMemo(() => {
    if (!isFreePreview) return null;
    const len = (documentContent || '').length;
    if (len < 2) return null;
    return Math.floor(len * 0.4);
  }, [isFreePreview, documentContent]);

  /** Free plan: first ~40% of comprehensive narrative — shown as readable text; remainder is gated (all free sessions). */
  const freeComprehensiveAnalysisPreviewMd = useMemo(() => {
    if (!analysisResult) return '';
    if (currentPlan !== 'free') return analysisResult;
    const len = analysisResult.length;
    if (len < 2) return analysisResult;
    return analysisResult.slice(0, Math.floor(len * 0.4));
  }, [analysisResult, currentPlan]);

  const freeComprehensiveAnalysisHasLockedRemainder = useMemo(() => {
    const len = analysisResult.length;
    if (len < 2) return false;
    return Math.floor(len * 0.4) < len;
  }, [analysisResult]);

  /** Locked portion of the narrative — shown only inside heavy blur (full analysis already in client state from API). */
  const freeComprehensiveLockedRemainderMd = useMemo(() => {
    if (!analysisResult || currentPlan !== 'free') return '';
    const len = analysisResult.length;
    if (len < 2) return '';
    const cut = Math.floor(len * 0.4);
    if (cut >= len) return '';
    return analysisResult.slice(cut);
  }, [analysisResult, currentPlan]);

  const annotationsForRender = useMemo((): Annotation[] => {
    if (freePreviewCharCutoff == null) return annotations;
    return annotations
      .filter(
        (a) =>
          a.startIndex >= 0 &&
          a.endIndex > a.startIndex &&
          a.endIndex <= documentContent.length &&
          a.startIndex < freePreviewCharCutoff
      )
      .map((a) => {
        const end = Math.min(a.endIndex, freePreviewCharCutoff);
        return {
          ...a,
          endIndex: end,
          text: documentContent.slice(a.startIndex, end),
        };
      });
  }, [annotations, freePreviewCharCutoff, documentContent]);

  /** Locked annotations for free users — those beyond the 40% cutoff (teaser preview in sidebar) */
  const lockedAnnotationsForTeaser = useMemo((): Annotation[] => {
    if (!isFreePreview || freePreviewCharCutoff == null) return [];
    return annotations.filter(
      (a) =>
        a.startIndex >= 0 &&
        a.endIndex > a.startIndex &&
        a.endIndex <= documentContent.length &&
        a.startIndex >= freePreviewCharCutoff
    );
  }, [annotations, freePreviewCharCutoff, documentContent, isFreePreview]);

  useEffect(() => {
    if (!user?.id) return;
    const plan = (user.plan || 'free').toLowerCase();
    if (plan === 'pro' || plan === 'premium') {
      try {
        sessionStorage.removeItem(POST_ACTIVATION_PAYWALL_PENDING_KEY);
      } catch {
        /* ignore */
      }
      setShowPostActivationPaywall(false);
    }
  }, [user?.id, user?.plan]);

  /** Red (serious concern) first, then amber (improve), while both revisions are pending. */
  const activationRewritePhase = useMemo((): 'concern' | 'improve' => {
    const concernDone =
      activationConcernRevisionApplied ||
      documentContent.includes(ACTIVATION_CONCERN_REWRITE) ||
      documentContent.includes(ACTIVATION_CONCERN_REWRITE.trim());
    if (!concernDone) return 'concern';
    return 'improve';
  }, [activationConcernRevisionApplied, documentContent]);

  useEffect(() => {
    if (!isActivationTutorial) return;
    if (activationCoachStep !== 'rewriteConcern' && activationCoachStep !== 'rewriteImprove') return;
    if (activationCoachStep === 'rewriteConcern' && activationConcernDone) return;
    if (activationCoachStep === 'rewriteImprove' && activationImproveDone) return;
    const phase = activationRewritePhase;
    const t = window.setTimeout(() => {
      document
        .querySelector(`[data-activation-rewrite-focus="${phase}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const docAnnoId =
        phase === 'concern'
          ? ACTIVATION_TUTORIAL_CONCERN_REVISION_ID
          : ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID;
      document
        .querySelector(`[data-doc-annotation="${docAnnoId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 220);
    return () => window.clearTimeout(t);
  }, [
    isActivationTutorial,
    activationCoachStep,
    activationRewritePhase,
    activationConcernDone,
    activationImproveDone,
  ]);

  useEffect(() => {
    if (!isActivationTutorial || activationCoachStep !== 'copyText') return;
    const t = window.setTimeout(() => {
      const nodes = document.querySelectorAll('[data-activation-copy-full-text]');
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i] as HTMLElement;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 180);
    return () => window.clearTimeout(t);
  }, [isActivationTutorial, activationCoachStep]);

  useEffect(() => {
    if (!isActivationTutorial || activationCoachStep !== 'library') return;
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [isActivationTutorial, activationCoachStep]);

  const documentRef = useRef<HTMLDivElement>(null);
  const rubricFileInputRef = useRef<HTMLInputElement>(null);
  const limitBannerRef = useRef<HTMLDivElement>(null);
  const activationCitationSelectRef = useRef<HTMLSelectElement>(null);
  const activationAnalyzeDocBtnRef = useRef<HTMLButtonElement>(null);

  // Mobile detection utility
  const isMobileDevice = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  /** Keep paywall UI aligned with shell user before /subscriptions/current returns. */
  useEffect(() => {
    if (!user?.plan) return;
    const p = user.plan.toLowerCase();
    if (p === 'pro' || p === 'premium') setCurrentPlan(p);
    else setCurrentPlan('free');
  }, [user?.id, user?.plan]);

  useEffect(() => {
    console.log('AnalysisPage: fetchDocuments and fetchAnalysisTypes called');
    fetchDocuments();
    fetchAnalysisTypes();
    fetchUserPlan();
    checkTrialEligibility();
    
    // Check if there's text content from dashboard (do NOT remove yet – only on success, so it can be restored if user goes back after failure)
    const textContent = localStorage.getItem('textAnalysisContent');
    if (textContent) {
      setPreviewContent(textContent);
      setDocumentContent(textContent);
    }

    const cameFromLibraryFlag = localStorage.getItem('cameFromLibrary');
    if (cameFromLibraryFlag === 'true') {
      setCameFromLibrary(true);
      localStorage.removeItem('cameFromLibrary');
    }

  }, []);

  /** Library → Analysis: load after mount; cleanup avoids applying state from a stale async run (React Strict Mode). Keys clear only on success. */
  useEffect(() => {
    let cancelled = false;
    const docId = localStorage.getItem('viewAnalysisDocumentId');
    const analysisType = localStorage.getItem('viewAnalysisType');
    if (!docId) return;

    void (async () => {
      await loadExistingAnalysisSimple(docId, analysisType, () => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    try {
      if (user?.welcomeTutorialCompleted === true) {
        sessionStorage.removeItem('writescholar_activation_tutorial');
        return;
      }
      if (sessionStorage.getItem('writescholar_activation_tutorial') !== '1') return;
      if (!user?.id) return;
      setActivationCoachStep('mla');
      setSelectedCitationStyle('None');
    } catch {
      /* ignore */
    }
  }, [user?.id, user?.welcomeTutorialCompleted]);

  /** If the shell learns the user already finished the welcome tour, never keep the analysis coach open. */
  useEffect(() => {
    if (user?.welcomeTutorialCompleted !== true) return;
    try {
      sessionStorage.removeItem('writescholar_activation_tutorial');
    } catch {
      /* ignore */
    }
    setActivationCoachStep('off');
    setIsActivationTutorial(false);
  }, [user?.welcomeTutorialCompleted]);

  // When coming from Upload or Library "Analyze", pre-select the document once documents are loaded
  useEffect(() => {
    if (documents.length === 0 || selectedDocument !== '') return;
    const uploadedDocId = localStorage.getItem('selectedDocumentId');
    if (!uploadedDocId) return;
    const docExists = documents.some((d) => d.id === uploadedDocId);
    if (docExists) {
      setSelectedDocument(uploadedDocId);
      setIsLoadingPreview(true);
      fetchDocumentContent(uploadedDocId)
        .then((content) => {
          setPreviewContent(content);
        })
        .catch((err) => {
          console.error('Error loading uploaded document preview:', err);
          setPreviewContent('Failed to load document preview');
        })
        .finally(() => setIsLoadingPreview(false));
      localStorage.removeItem('selectedDocumentId');
      localStorage.removeItem('selectedDocumentTitle');
      localStorage.removeItem('selectedDocumentContent');
    }
  }, [documents, selectedDocument]);

  // Scroll limit-exceeded banner into view when it appears
  useEffect(() => {
    if (limitExceededError && limitBannerRef.current) {
      limitBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [limitExceededError]);

  // Check for plan changes periodically (for automatic unlocking after upgrade)
  useEffect(() => {
    const checkPlanChanges = setInterval(async () => {
      try {
        const newPlan = await fetchUserPlan();
        if (newPlan && newPlan !== currentPlan && (newPlan === 'pro' || newPlan === 'premium')) {
          console.log('Plan upgrade detected:', currentPlan, '->', newPlan);
          setCurrentPlan(newPlan);
          // Show success message
          setSuccessMessage('🎉 Plan upgraded! You now have access to full document annotations.');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } catch (error) {
        console.error('Error checking plan changes:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkPlanChanges);
  }, [currentPlan]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access documents');
        return;
      }

      // Use bulletproof API with maximum reliability
      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        console.log('✅ Analysis documents loaded successfully');
        setDocuments(result.data.documents || []);
        setError(''); // Clear any previous errors
      } else {
        console.error('📄 Document fetch failed:', result.error);
        setError('Failed to load documents. Retrying automatically...');
        setDocuments([]); // Show empty state
      }
    } catch (error) {
      console.error('💥 Critical error in fetchDocuments:', error);
      setError('Unable to load documents. Please check your connection.');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return 'free';

      // Use bulletproof API for plan fetching
      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/subscriptions/current', token),
        { plan: 'free' }
      );

      if (result.success) {
        console.log('✅ User plan loaded successfully:', result.data.plan);
        const plan = result.data.plan || 'free';
        setCurrentPlan(plan);
        return plan;
      } else {
        console.error('🎯 Plan fetch failed:', result.error);
        setCurrentPlan('free');
        return 'free';
      }
    } catch (error) {
      console.error('💥 Critical error fetching user plan:', error);
      setCurrentPlan('free');
      return 'free';
    }
  };

  const checkTrialEligibility = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/trial-eligibility`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCanStartFreeTrial(data.trialEligible === true);
      } else {
        setCanStartFreeTrial(false);
      }
    } catch {
      setCanStartFreeTrial(false);
    }
  };

  /** Skip billing page — open Stripe Checkout for Pro monthly (same as pricing upgrade). */
  const startProMonthlyCheckout = useCallback(async () => {
    if (checkoutInFlightRef.current) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      onNavigate?.('signup');
      return;
    }
    checkoutInFlightRef.current = true;
    setCheckoutRedirecting(true);
    setError('');
    try {
      trackEvent('paywall_start_trial');
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      /** After Stripe success/cancel, return to Library with this document selected (not dashboard). */
      try {
        if (selectedDocument) {
          sessionStorage.setItem('librarySelectDocumentAfterCheckout', selectedDocument);
          sessionStorage.setItem('librarySelectAnalysisTypeAfterCheckout', selectedAnalysisType || 'comprehensive');
        } else {
          sessionStorage.removeItem('librarySelectDocumentAfterCheckout');
          sessionStorage.removeItem('librarySelectAnalysisTypeAfterCheckout');
        }
      } catch {
        /* ignore */
      }
      const res = await fetch(`${base}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: 'pro',
          billingCycle: 'monthly',
          successUrl: `${window.location.origin}/library?payment=success`,
          cancelUrl: `${window.location.origin}/library?payment=cancelled`,
          trialPeriodDays: canStartFreeTrial ? 7 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start checkout');
      const url = data?.data?.checkoutUrl as string | undefined;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      checkoutInFlightRef.current = false;
      setCheckoutRedirecting(false);
      setError(e instanceof Error ? e.message : 'Could not open Stripe checkout');
    }
  }, [canStartFreeTrial, onNavigate, selectedDocument, selectedAnalysisType]);

  const fetchAnalysisTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to access analysis types');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis types');
      }

      const data = await response.json();
      const allTypes = data.data || [];
      const comprehensiveOnly = allTypes.filter((t: AnalysisType) => t.id === 'comprehensive');
      setAnalysisTypes(comprehensiveOnly.length > 0 ? comprehensiveOnly : allTypes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analysis types');
    }
  };

  const generateAIAnnotations = (content: string): Annotation[] => {
    console.log('=== STARTING BULLETPROOF ANNOTATION GENERATION ===');
    console.log('Content length:', content.length);
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    console.log('Total sentences found:', sentences.length);
    
    // BULLETPROOF APPROACH: Create exactly what we need, no compromises
    const finalAnnotations: Annotation[] = [];
    let annotationId = 1;
    const usedTexts = new Set<string>();
    
    // STEP 1: FORCE CREATE 6 STRONG POINTS FIRST (2 from each section)
    console.log('=== STEP 1: FORCING 6 STRONG POINTS ===');
    const sectionSize = Math.floor(sentences.length / 3);
    const sections = [
      sentences.slice(0, sectionSize),
      sentences.slice(sectionSize, sectionSize * 2),
      sentences.slice(sectionSize * 2)
    ];
    
    for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
      const section = sections[sectionIndex];
      const sectionName = ['beginning', 'middle', 'end'][sectionIndex];
      
      // Create 2 strong points from each section
      let strongPointsFromSection = 0;
      for (let i = 0; i < section.length && strongPointsFromSection < 2; i++) {
        const sentence = section[i].trim();
        if (sentence.length > 15) {
          const startIndex = content.indexOf(sentence);
          if (startIndex !== -1) {
            const endIndex = startIndex + sentence.length;
            const textKey = sentence.toLowerCase().trim();
            
            if (!usedTexts.has(textKey)) {
              usedTexts.add(textKey);
              finalAnnotations.push({
              id: annotationId.toString(),
                type: 'strong',
                text: sentence,
              startIndex: startIndex,
                endIndex: endIndex,
                comment: `This ${sectionName} section demonstrates strong academic writing with clear structure and appropriate vocabulary.`,
                suggestion: 'This is an excellent foundation. Continue using this approach throughout your paper.'
            });
            annotationId++;
              strongPointsFromSection++;
              console.log(`✅ FORCED strong point ${strongPointsFromSection}/2 from ${sectionName} section (${i + 1}/${section.length})`);
            }
          }
        }
      }
    }
    
    console.log(`Strong points created: ${finalAnnotations.filter(a => a.type === 'strong').length}/6`);
    
    // STEP 2: FORCE CREATE 12 MORE ANNOTATIONS (mix of all types with more strong points)
    console.log('=== STEP 2: FORCING 12 MORE ANNOTATIONS ===');
    const remainingSentences = sentences.filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 10 && !usedTexts.has(trimmed.toLowerCase());
    });
    
    console.log('Remaining sentences available:', remainingSentences.length);
    
    // Create 12 more annotations with more strong points: 4 strong, 4 improve, 4 concern
    const types: ('strong' | 'improve' | 'concern')[] = [
      'strong', 'improve', 'concern', 'strong', 
      'improve', 'concern', 'strong', 'improve', 
      'concern', 'strong', 'improve', 'concern'
    ];
    
    for (let i = 0; i < Math.min(12, remainingSentences.length); i++) {
      const sentence = remainingSentences[i].trim();
      const startIndex = content.indexOf(sentence);
      if (startIndex !== -1) {
        const endIndex = startIndex + sentence.length;
        const textKey = sentence.toLowerCase().trim();
        const type = types[i];
        
        usedTexts.add(textKey);
        finalAnnotations.push({
          id: annotationId.toString(),
            type: type,
          text: sentence,
          startIndex: startIndex,
          endIndex: endIndex,
          comment: type === 'strong' ? 'This demonstrates excellent academic writing with strong structure and clear communication.' : 
                   (type === 'improve' ? 'This section could be enhanced with more specific details and supporting evidence.' : 
                   'This section may need attention to strengthen the argument and provide clearer explanations.'),
          suggestion: type === 'strong' ? 'This is a great example of strong academic writing. Continue using this approach.' : 
                     (type === 'improve' ? 'Consider adding more specific examples, data, or citations to support your point.' : 
                     'Consider providing more specific evidence or clarifying your point to strengthen this section.')
        });
        annotationId++;
        console.log(`✅ Added ${type} annotation (${i + 1}/12)`);
      }
    }
    
    // STEP 3: EMERGENCY FILL - If we still don't have 18, create more
    console.log('=== STEP 3: EMERGENCY FILL TO 18 ===');
    while (finalAnnotations.length < 18) {
      const allSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const availableSentences = allSentences.filter(s => !usedTexts.has(s.trim().toLowerCase()));
      
      if (availableSentences.length === 0) {
        // No more unique sentences, duplicate existing ones
        const existingAnnotation = finalAnnotations[finalAnnotations.length % finalAnnotations.length];
        const newAnnotation = {
          ...existingAnnotation,
          id: annotationId.toString(),
          comment: 'Additional comprehensive feedback point for thorough analysis.',
          suggestion: 'This provides another perspective on your academic writing approach.'
        };
        finalAnnotations.push(newAnnotation);
        annotationId++;
        console.log(`✅ Duplicated annotation to reach 18 (${finalAnnotations.length}/18)`);
      } else {
        const sentence = availableSentences[0].trim();
        const startIndex = content.indexOf(sentence);
        if (startIndex !== -1) {
          const endIndex = startIndex + sentence.length;
          const type: 'strong' | 'improve' | 'concern' = finalAnnotations.length % 3 === 0 ? 'strong' : (finalAnnotations.length % 3 === 1 ? 'improve' : 'concern');
          
          usedTexts.add(sentence.toLowerCase());
          finalAnnotations.push({
            id: annotationId.toString(),
            type: type,
            text: sentence,
              startIndex: startIndex,
            endIndex: endIndex,
            comment: type === 'strong' ? 'This demonstrates good academic writing practices.' : (type === 'improve' ? 'This section could be enhanced with more detail.' : 'This section may need attention to strengthen the argument.'),
            suggestion: type === 'strong' ? 'Continue using this approach throughout your paper.' : (type === 'improve' ? 'Consider adding more specific examples or evidence.' : 'Consider providing more specific evidence or clarifying your point.')
          });
          annotationId++;
          console.log(`✅ Emergency ${type} annotation added (${finalAnnotations.length}/18)`);
        }
      }
    }
    
    // STEP 4: FINAL VERIFICATION AND SORTING
    console.log('=== STEP 4: FINAL VERIFICATION ===');
    finalAnnotations.sort((a, b) => a.startIndex - b.startIndex);
    
    const strongCount = finalAnnotations.filter(a => a.type === 'strong').length;
    const improveCount = finalAnnotations.filter(a => a.type === 'improve').length;
    const concernCount = finalAnnotations.filter(a => a.type === 'concern').length;
    
    console.log(`🎯 FINAL RESULTS:`);
    console.log(`   Total annotations: ${finalAnnotations.length} (minimum 18 required)`);
    console.log(`   Strong points: ${strongCount} (minimum 6 required)`);
    console.log(`   Improve points: ${improveCount}`);
    console.log(`   Concern points: ${concernCount}`);
    
    // FINAL SAFETY CHECK - This should NEVER happen with our bulletproof approach
    if (finalAnnotations.length < 18) {
      console.error('🚨 CRITICAL ERROR: Less than 18 annotations created!');
    }
    if (strongCount < 6) {
      console.error('🚨 CRITICAL ERROR: Less than 6 strong points created!');
    }

    // STEP 5: Ensure no more than 200 words without an annotation (coverage fill-ins)
    // These don't count toward the 18/min logic or scoring; they appear in export and sidebar
    const withCoverage = ensureCoverageAnnotations(finalAnnotations, content, annotationId);

    console.log('=== ANNOTATION GENERATION COMPLETE ===');
    return withCoverage;
  };

  const ensureCoverageAnnotations = (annotations: Annotation[], content: string, startId: number): Annotation[] => {
    const MAX_WORDS = 200;
    const result = [...annotations].sort((a, b) => a.startIndex - b.startIndex);
    let nextId = startId;

    const words = content.split(/\s+/);
    if (words.length < MAX_WORDS) return result;

    let charPos = 0;
    const wordBounds: { start: number; end: number }[] = [];
    for (let i = 0; i < words.length; i++) {
      const idx = content.indexOf(words[i], charPos);
      if (idx === -1) break;
      wordBounds.push({ start: idx, end: idx + words[i].length });
      charPos = idx + words[i].length;
    }

    const getWordCountInRange = (charStart: number, charEnd: number) =>
      wordBounds.filter(w => w.end > charStart && w.start < charEnd).length;

    const getCharPosOfNthWordFrom = (charStart: number, n: number) => {
      let count = 0;
      for (const w of wordBounds) {
        if (w.end <= charStart) continue;
        count++;
        if (count >= n) return w.end;
      }
      return content.length;
    };

    const findSentenceInRange = (charStart: number, charEnd: number): { text: string; startIndex: number; endIndex: number } | null => {
      const segment = content.substring(charStart, charEnd);
      const sentences = segment.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length === 0) return null;
      const midIdx = Math.floor(sentences.length / 2);
      const sentence = sentences[midIdx].trim();
      if (sentence.length < 15) return null;
      const absStart = content.indexOf(sentence, charStart);
      if (absStart === -1 || absStart >= charEnd) return null;
      return { text: sentence, startIndex: absStart, endIndex: absStart + sentence.length };
    };

    const gaps: { start: number; end: number }[] = [];
    let lastEnd = 0;
    for (const a of result) {
      if (a.startIndex > lastEnd) gaps.push({ start: lastEnd, end: a.startIndex });
      lastEnd = Math.max(lastEnd, a.endIndex);
    }
    if (lastEnd < content.length) gaps.push({ start: lastEnd, end: content.length });

    for (const gap of gaps) {
      let gapStart = gap.start;
      const gapEnd = gap.end;
      while (getWordCountInRange(gapStart, gapEnd) >= MAX_WORDS) {
        const segEndChar = getCharPosOfNthWordFrom(gapStart, MAX_WORDS);
        const sent = findSentenceInRange(gapStart, segEndChar);
        if (!sent) break;
        if (result.some(a => a.endIndex > sent.startIndex && a.startIndex < sent.endIndex)) break;
        result.push({
          id: nextId.toString(),
          type: 'strong',
          text: sent.text,
          startIndex: sent.startIndex,
          endIndex: sent.endIndex,
          comment: 'This section demonstrates clear academic writing with appropriate structure and vocabulary.',
          suggestion: 'Continue using this approach throughout your paper.',
          isCoverageOnly: true,
        });
        nextId++;
        result.sort((a, b) => a.startIndex - b.startIndex);
        gapStart = sent.endIndex;
      }
    }
    return result;
  };





  const fetchDocumentContent = async (documentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to access documents');
      }

      const { BulletproofAPI } = await import('../../config/api');
      const response = await BulletproofAPI.get(`/documents/${documentId}/content`, token);

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const data = await response.json();
      console.log('Document content response:', data);
      return data.data?.content || '';
    } catch (error) {
      console.error('Error fetching document content:', error);
      throw new Error('Failed to fetch document content');
    }
  };

  /** Load saved analysis from library / deep link. `isCancelled` skips state updates (React Strict Mode remount). Clears localStorage keys only on success. */
  const loadExistingAnalysisSimple = async (
    documentId: string,
    analysisType?: string | null,
    isCancelled?: () => boolean
  ) => {
    const clearLibraryNavKeys = () => {
      try {
        localStorage.removeItem('viewAnalysisDocumentId');
        localStorage.removeItem('viewAnalysisType');
      } catch {
        /* ignore */
      }
    };

    try {
      console.log('=== LOADING EXISTING ANALYSIS ===');
      console.log('Document ID:', documentId);
      if (!isCancelled?.()) {
        setSelectedDocument(documentId);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        if (!isCancelled?.()) setError('Please log in to access analyses');
        return;
      }

      const content = await fetchDocumentContent(documentId);
      if (isCancelled?.()) return;

      console.log('Document content loaded, length:', content.length);
      setDocumentContent(content);
      setPreviewContent(content);
      setOriginalDraftBaseline(null);

      const { BulletproofAPI } = await import('../../config/api');
      const response = await BulletproofAPI.get(`/analysis/document/${documentId}`, token);

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'No saved analysis for this document' : 'Failed to fetch analysis');
      }

      const data = await response.json();
      if (isCancelled?.()) return;
      console.log('Analysis response:', data);

      let analysis: {
        analysis_type?: string;
        analysis_results?: unknown;
      } | null = null;

      const payload = data.data as {
        all?: Array<{ analysis_type?: string; analysis_results?: unknown }>;
        comprehensive?: { analysis_type?: string; analysis_results?: unknown };
        citation?: { analysis_type?: string; analysis_results?: unknown };
      } | null
        | undefined;

      if (payload && !Array.isArray(payload)) {
        const all = Array.isArray(payload.all) ? payload.all : [];
        const hasRow = !!payload.comprehensive || !!payload.citation || all.length > 0;
        if (hasRow) {
          if (analysisType === 'citation' && payload.citation) {
            analysis = payload.citation;
            console.log('Loading citation analysis:', analysis);
          } else if (analysisType === 'comprehensive') {
            analysis =
              payload.comprehensive ||
              all.find(
                (a) => a?.analysis_type === 'comprehensive' || a?.analysis_type === 'general'
              ) ||
              all[0] ||
              null;
            console.log('Loading comprehensive analysis:', analysis);
          } else {
            analysis = (payload.comprehensive || payload.citation || all[0]) ?? null;
            console.log('Loading default analysis:', analysis);
          }
        }
      } else if (Array.isArray(data.data) && data.data.length > 0) {
        analysis = data.data[0];
        console.log('Loading legacy format analysis:', analysis);
      }

      if (analysis) {
        const analysisResultsRaw = normalizeSavedAnalysisResults(analysis.analysis_results);
        const analysisResults = analysisResultsRaw as Record<string, any> | null;

        console.log('Found analysis:', analysis);
        console.log('Analysis results:', analysisResults);
        console.log('Analysis results keys:', Object.keys(analysisResults || {}));

        if (analysisResults) {
          if (isCancelled?.()) return;

          const resultText = analysisResults.result;
          setAnalysisResult(
            typeof resultText === 'string' ? resultText : resultText != null ? String(resultText) : ''
          );

          // Compare-with-first-draft: baseline must be text at analysis time (persisted as original_content), not current doc
          const savedOriginal =
            typeof (analysisResults as { original_content?: string }).original_content === 'string'
              ? (analysisResults as { original_content: string }).original_content
              : '';
          setOriginalDraftBaseline(savedOriginal.length > 0 ? savedOriginal : content);
          
          const wsRaw = (analysisResults as { ws_revision_cache?: unknown }).ws_revision_cache;
          const wsRevisionCache: Record<string, { sourceSpan: string; replacement: string }> =
            wsRaw && typeof wsRaw === 'object' && !Array.isArray(wsRaw)
              ? (wsRaw as Record<string, { sourceSpan: string; replacement: string }>)
              : {};
          setCachedWsRevisionByAnnotationId(wsRevisionCache);

          // Create simple annotations from the analysis data
          let annotationsToUse: Annotation[] = [];
          
          console.log('Strong points:', analysisResults.strong_points);
          console.log('Areas to improve:', analysisResults.areas_to_improve);
          console.log('Serious concerns:', analysisResults.serious_concerns);
          console.log('Original annotations:', analysisResults.annotations);
          
          // Try to use the original annotations first (if they exist)
          if (analysisResults.annotations && Array.isArray(analysisResults.annotations)) {
            console.log('Using original annotations:', analysisResults.annotations.length);
            annotationsToUse = analysisResults.annotations;
            setAnnotations(annotationsToUse);
          } else {
            // Fallback to creating annotations from the structured data
            console.log('Creating annotations from structured data');
            
            // Add strong points
            if (analysisResults.strong_points && Array.isArray(analysisResults.strong_points)) {
              analysisResults.strong_points.forEach((point: any, index: number) => {
                if (point.text) {
                  const textIndex = content.toLowerCase().indexOf(point.text.toLowerCase());
                  if (textIndex !== -1) {
                    annotationsToUse.push({
                      id: `strong-${index}`,
                      type: 'strong',
                      text: point.text,
                      startIndex: textIndex,
                      endIndex: textIndex + point.text.length,
                      comment: point.explanation || point.comment,
                      suggestion: point.explanation || point.comment
                    });
                    console.log(`Added strong point: "${point.text}"`);
                  } else {
                    console.log(`Could not find strong point text: "${point.text}"`);
                  }
                }
              });
            }
            
            // Add areas to improve
            if (analysisResults.areas_to_improve && Array.isArray(analysisResults.areas_to_improve)) {
              analysisResults.areas_to_improve.forEach((point: any, index: number) => {
                if (point.text) {
                  const textIndex = content.toLowerCase().indexOf(point.text.toLowerCase());
                  if (textIndex !== -1) {
                    annotationsToUse.push({
                      id: `improve-${index}`,
                      type: 'improve',
                      text: point.text,
                      startIndex: textIndex,
                      endIndex: textIndex + point.text.length,
                      comment: point.explanation || point.comment,
                      suggestion: point.explanation || point.comment
                    });
                    console.log(`Added improvement point: "${point.text}"`);
                  } else {
                    console.log(`Could not find improvement text: "${point.text}"`);
                  }
                }
              });
            }
            
            // Add serious concerns
            if (analysisResults.serious_concerns && Array.isArray(analysisResults.serious_concerns)) {
              analysisResults.serious_concerns.forEach((point: any, index: number) => {
                if (point.text) {
                  const textIndex = content.toLowerCase().indexOf(point.text.toLowerCase());
                  if (textIndex !== -1) {
                    annotationsToUse.push({
                      id: `concern-${index}`,
                      type: 'concern',
                      text: point.text,
                      startIndex: textIndex,
                      endIndex: textIndex + point.text.length,
                      comment: point.explanation || point.comment,
                      suggestion: point.explanation || point.comment
                    });
                    console.log(`Added concern point: "${point.text}"`);
                  } else {
                    console.log(`Could not find concern text: "${point.text}"`);
                  }
                }
              });
            }
            
            console.log('Created annotations:', annotationsToUse.length);
            setAnnotations(annotationsToUse);
          }

          setRevisedDraftRanges(buildRevisedDraftRangesFromCache(content, annotationsToUse, wsRevisionCache));
          
          setSelectedAnalysisType(analysis.analysis_type || 'comprehensive');
          setSelectedCitationStyle(analysisResults.citation_style || 'None');
          
          // Restore rubric alignment from saved analysis (or clear if none)
          setRubricAlignment(analysisResults.rubric_alignment || null);
          
          // Restore new-format summary (score, grade, clarity, suggestions)
          // Score must equal rubric sum — use rubric sum when available to fix any saved mismatches
          const savedRubric = analysisResults.grade_rubric as Record<string, { score?: number }> | null | undefined;
          const savedRubricSum = savedRubric && typeof savedRubric === 'object'
            ? Object.values(savedRubric).reduce((sum: number, e) => sum + (e?.score ?? 0), 0)
            : 0;
          const displayScore = savedRubricSum > 0 ? savedRubricSum : (analysisResults.overall_score ?? null);
          setAnalysisSummary({
            overall_score: displayScore,
            grade_estimate: analysisResults.grade_estimate ?? null,
            clarity_rating: analysisResults.clarity_rating ?? null,
            top_suggestions: Array.isArray(analysisResults.top_suggestions) ? analysisResults.top_suggestions : []
          });
          setGradeRubric(analysisResults.grade_rubric ?? null);
          setSpecificRewrites(analysisResults.specific_rewrites ?? null);
          
          // Set locked features based on current user plan (free users see upgrade prompts)
          const plan = await fetchUserPlan();
          if (isCancelled?.()) return;

          const isPaid = plan === 'pro' || plan === 'premium';
          setLockedFeatures(
            !isPaid
              ? ['full_annotations', 'grade_rubric', 'specific_rewrites', 'export', 'history']
              : []
          );

          clearLibraryNavKeys();
          setError('');

          console.log('=== ANALYSIS LOADED SUCCESSFULLY ===');
          console.log('Final annotations count:', annotationsToUse.length);
        } else {
          console.log('No analysis results found in the data');
          if (!isCancelled?.()) setError('Analysis results not found');
        }
      } else {
        console.log('No analysis found for document');
        if (!isCancelled?.()) setError('No analysis found for this document');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      if (!isCancelled?.()) {
        setError('Failed to load analysis: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  // Export functions
  const exportToPDF = async () => {
    if (!analysisResult || !documentContent) {
      setError('No analysis data available to export');
      return;
    }

    try {
      setIsExporting(true);
      
      const analysisData: AnalysisData = {
        documentTitle: documents.find(doc => doc.id === selectedDocument)?.title || 'Unknown Document',
        documentContent: documentContent,
        analysisResult: analysisResult,
        annotations: annotations.map(annotation => ({
          id: annotation.id,
          type: annotation.type,
          text: annotation.text,
          comment: annotation.comment,
          suggestion: annotation.suggestion || annotation.comment
        })),
        analysisType: selectedAnalysisType,
        citationStyle: selectedCitationStyle,
        createdAt: new Date().toISOString()
      };

      await ExportService.exportToPDF(analysisData);
      setSuccessMessage('PDF report exported successfully!');
    } catch (error) {
      console.error('Export to PDF failed:', error);
      setError('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    if (!analysisResult || !documentContent) {
      setError('No analysis data available to export');
      return;
    }

    try {
      setIsExporting(true);
      
      const analysisData: AnalysisData = {
        documentTitle: documents.find(doc => doc.id === selectedDocument)?.title || 'Unknown Document',
        documentContent: documentContent,
        analysisResult: analysisResult,
        annotations: annotations.map(annotation => ({
          id: annotation.id,
          type: annotation.type,
          text: annotation.text,
          comment: annotation.comment,
          suggestion: annotation.suggestion || annotation.comment
        })),
        analysisType: selectedAnalysisType,
        citationStyle: selectedCitationStyle,
        createdAt: new Date().toISOString()
      };

      await ExportService.exportToWord(analysisData);
      setSuccessMessage('Word document exported successfully!');
    } catch (error) {
      console.error('Export to Word failed:', error);
      setError('Failed to export Word document');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle close button click
  const handleCloseAnalysis = () => {
    setAnalysisResult('');
    setAnnotations([]);
    setDocumentContent('');
    setRubricAlignment(null);
    setWriteScholarUndo(null);
    setRevisedDraftRanges([]);
    setRevisionNoticeMeta(null);
    setOriginalDraftBaseline(null);
    setShowCompareOriginalModal(false);
    setCachedWsRevisionByAnnotationId({});
    
    // If user came from Library, navigate back to Library
    if (cameFromLibrary && onNavigate) {
      onNavigate('library');
    }
  };

  const handleRubricFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in to upload files');
      return;
    }

    setIsParsingRubric(true);
    setError('');
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
      if (!res.ok) throw new Error(data.message || 'Failed to parse rubric file');
      setRubricContent(data.data.content || '');
    } catch (err: any) {
      console.error('Rubric upload error:', err);
      setError(err.message || 'Failed to parse rubric file');
    } finally {
      setIsParsingRubric(false);
    }
  };

  const handleDocumentSelection = async (documentId: string) => {
    setSelectedDocument(documentId);
    setPreviewContent('');
    
    if (documentId) {
      setIsLoadingPreview(true);
      try {
        const content = await fetchDocumentContent(documentId);
        setPreviewContent(content);
      } catch (error) {
        console.error('Error loading document preview:', error);
        setPreviewContent('Failed to load document preview');
      } finally {
        setIsLoadingPreview(false);
      }
    }
  };

  useEffect(() => {
    if (activationCoachStep === 'mla' && selectedCitationStyle === 'MLA') {
      setActivationCoachStep('analyze');
    }
  }, [activationCoachStep, selectedCitationStyle]);

  const applyActivationMock = (content: string) => {
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const ann = buildActivationAnnotationsForDocument(normalized);
    setAnnotations(ann);
    setDocumentContent(normalized);
    setPreviewContent(normalized);
    try {
      localStorage.setItem('textAnalysisContent', normalized);
    } catch {
      /* ignore */
    }
    setAnalysisResult(ACTIVATION_MOCK_ANALYSIS_MARKDOWN);
    setGradeRubric(buildActivationGradeRubric());
    setSpecificRewrites(ACTIVATION_SPECIFIC_REWRITES);
    setAnalysisSummary({
      overall_score: ACTIVATION_OVERALL_SCORE,
      grade_estimate: ACTIVATION_GRADE_LABEL,
      clarity_rating: 'Good',
      top_suggestions: [
        'Tighten MLA in-text citations (author-page).',
        'Replace broad claims with cited evidence.',
      ],
    });
    setLockedFeatures([]);
    setActivationConcernRevisionApplied(false);
    setActivationImproveRevisionApplied(false);
    const concernAnn = ann.find((a) => a.id === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID);
    const improveAnn = ann.find((a) => a.id === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID);
    const concernSource =
      concernAnn != null ? normalized.slice(concernAnn.startIndex, concernAnn.endIndex) : ACTIVATION_CONCERN_SPAN;
    const improveSource =
      improveAnn != null ? normalized.slice(improveAnn.startIndex, improveAnn.endIndex) : ACTIVATION_IMPROVE_SPAN;
    setCachedWsRevisionByAnnotationId({
      [ACTIVATION_TUTORIAL_CONCERN_REVISION_ID]: { sourceSpan: concernSource, replacement: ACTIVATION_CONCERN_REWRITE },
      [ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID]: { sourceSpan: improveSource, replacement: ACTIVATION_IMPROVE_REWRITE },
    });
    setOriginalDraftBaseline(normalized);
    setSelectedCitationStyle('MLA');
    setIsActivationTutorial(true);
    trackEvent('activation_tutorial_mock_results');
  };

  const finishActivationTutorial = async () => {
    let isTest = false;
    try {
      sessionStorage.removeItem('writescholar_activation_tutorial');
      isTest = sessionStorage.getItem('writescholar_activation_test') === '1';
      if (isTest) {
        localStorage.setItem('writescholar_activation_test_finish', '1');
        sessionStorage.removeItem('writescholar_activation_test');
      }
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('textAnalysisContent');
    } catch {
      /* ignore */
    }
    setActivationCoachStep('off');
    setIsActivationTutorial(false);
    setActivationConcernRevisionApplied(false);
    setActivationImproveRevisionApplied(false);

    if (isTest) {
      onNavigate?.('dashboard');
      return;
    }

    try {
      sessionStorage.removeItem('writescholar_show_interactive_tutorial');
      await persistTutorialToServer();
      trackEvent('tutorial_complete');
    } catch {
      /* ignore */
    } finally {
      onUserUpdate?.({ welcomeTutorialCompleted: true });
    }
    onNavigate?.('dashboard');
  };

  const handleActivationCoachContinue = () => {
    if (activationCoachStep === 'rubric') {
      setActivationCoachStep('doc');
      window.setTimeout(() => {
        document.querySelector('[data-activation-target="activation-doc"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activationCoachStep === 'doc') {
      setActivationCoachStep('rewriteConcern');
      window.setTimeout(() => {
        document
          .querySelector('[data-activation-target="activation-revisions"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activationCoachStep === 'rewriteConcern') {
      if (!activationConcernDone) return;
      setActivationCoachStep('rewriteImprove');
      window.setTimeout(() => {
        document
          .querySelector('[data-activation-target="activation-revisions"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (activationCoachStep === 'rewriteImprove') {
      if (!activationImproveDone) return;
      setActivationCoachStep('copyText');
    } else if (activationCoachStep === 'copyText') {
      setActivationCoachStep('library');
    } else if (activationCoachStep === 'library') {
      setActivationCoachStep('done');
    } else if (activationCoachStep === 'done') {
      void finishActivationTutorial();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAnalysisType) {
      setError('Please select an analysis type');
      return;
    }

    if (activationCoachStep === 'analyze') {
      const pasted = documentContent?.trim() ? documentContent : '';
      if (!pasted) {
        setError('Please select a document or provide text content');
        return;
      }
      setError('');
      setLimitExceededError(null);
      setActivationCoachStep('loading');
      setIsAnalyzing(true);
      setShowAnalysisPopup(true);
      setAnalysisComplete(false);
      window.setTimeout(() => {
        applyActivationMock(pasted);
        setIsAnalyzing(false);
        setShowAnalysisPopup(false);
        setAnalysisComplete(true);
        setActivationCoachStep('rubric');
      }, 3000);
      return;
    }

    console.log('=== FRONTEND ANALYSIS DEBUG ===');
    console.log('selectedDocument:', selectedDocument);
    console.log('documentContent length:', documentContent?.length);
    console.log('selectedAnalysisType:', selectedAnalysisType);

    // Check if we have text content from dashboard or a selected document
    let content = '';
    if (documentContent && documentContent.trim().length > 0) {
      // Use text content from dashboard
      content = documentContent;
      console.log('Using text content from dashboard');
    } else if (selectedDocument) {
      // Use selected document content
      const token = localStorage.getItem('authToken');
      if (!token) {
        analyzingRef.current = false;
        setError('Please log in to analyze documents');
        return;
      }
      content = await fetchDocumentContent(selectedDocument);
      if (!content || content.trim().length === 0) {
        analyzingRef.current = false;
        setError('Document content is empty or unavailable');
        return;
      }
      setDocumentContent(content);
      console.log('Using selected document content, documentId:', selectedDocument);
    } else {
      analyzingRef.current = false;
      setError('Please select a document or provide text content');
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    setError('');
    setLimitExceededError(null);
    setSuccessMessage('');
    setAnalysisResult('');
    setAnnotations([]);
    setLockedFeatures([]);
    setGradeRubric(null);
    setSpecificRewrites(null);
    setAnalysisSummary({ overall_score: null, grade_estimate: null, clarity_rating: null, top_suggestions: [] });
    setWriteScholarUndo(null);
    setRevisedDraftRanges([]);
    setRevisionNoticeMeta(null);
    setOriginalDraftBaseline(null);
    setCachedWsRevisionByAnnotationId({});

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        analyzingRef.current = false;
        throw new Error('Please log in to analyze documents');
      }

      console.log('Making API call with:', {
        documentId: selectedDocument || null,
        contentLength: content.length,
        analysisType: selectedAnalysisType,
        citationStyle: selectedCitationStyle,
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument || null,
          content: content,
          analysisType: selectedAnalysisType,
          citationStyle: selectedCitationStyle,
          gradingStyle: selectedGradingStyle,
          rubricContent: rubricContent.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.errors?.[0]?.message || errorData.message || 'Analysis failed';
        const isLimitExceeded = response.status === 403 || response.status === 429;
        if (isLimitExceeded) {
          setLimitExceededError(errorMessage);
          setError(errorMessage);
          setShowAnalysisPopup(false);
          analyzingRef.current = false;
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          fetchDocuments();
          return;
        }
        throw new Error(errorMessage);
      }

      const result: AnalysisResult = await response.json();
      if (result.data.documentId) {
        setSelectedDocument(result.data.documentId);
      }
      setAnalysisResult(result.data.result);
      try { localStorage.removeItem('textAnalysisContent'); } catch (_) {}
      setRubricAlignment(result.data.rubricAlignment ?? null);
      setLockedFeatures(result.data.lockedFeatures || []);
      const rubric = result.data.grade_rubric as Record<string, { score?: number }> | null | undefined;
      const rubricSum = rubric && typeof rubric === 'object'
        ? Object.values(rubric).reduce((sum: number, e) => sum + (e?.score ?? 0), 0)
        : 0;
      const displayScore = rubricSum > 0 ? rubricSum : (result.data.overall_score ?? null);
      setAnalysisSummary({
        overall_score: displayScore,
        grade_estimate: result.data.grade_estimate ?? null,
        clarity_rating: result.data.clarity_rating ?? null,
        top_suggestions: Array.isArray(result.data.top_suggestions) ? result.data.top_suggestions : []
      });
      setGradeRubric(result.data.grade_rubric ?? null);
      setSpecificRewrites(result.data.specific_rewrites ?? null);
      
      // Use annotations from backend if available, otherwise generate fallback
      let finalAnnotations: Annotation[] = [];
      if (result.data.annotations && result.data.annotations.length > 0) {
        console.log('Using backend annotations:', result.data.annotations);
        
        // Validate and clean annotations
        const validatedAnnotations = result.data.annotations
          .filter(annotation => {
            // Validate that the annotation has proper indices and text
            const isValid = annotation.startIndex >= 0 && 
                           annotation.endIndex > annotation.startIndex && 
                           annotation.endIndex <= content.length &&
                           annotation.text && 
                           annotation.comment;
            
            if (!isValid) {
              console.warn('Invalid annotation filtered out:', annotation);
            }
            
            return isValid;
          })
          .map(annotation => {
            // Ensure the text matches what's actually in the document
            const actualText = content.slice(annotation.startIndex, annotation.endIndex);
            return {
              ...annotation,
              text: actualText // Use the actual text from the document
            };
          });
        
        console.log('Validated annotations:', validatedAnnotations);
        finalAnnotations = validatedAnnotations;
        setAnnotations(validatedAnnotations);
      } else {
        // Fallback to frontend generation if backend doesn't provide annotations
        const aiAnnotations = generateAIAnnotations(content);
        console.log('Generated fallback annotations:', aiAnnotations);
        finalAnnotations = aiAnnotations;
        setAnnotations(aiAnnotations);
      }

      setOriginalDraftBaseline(content);

      const wasFirst = (getStats().analyses_count || 0) === 0;
      trackAction('analyses_count');
      if (wasFirst) trackEvent('first_analysis');

      // Backend already saves analysis (including pasted text → creates document for library)
      // Only call /save if backend didn't save (e.g. legacy path)
      const backendAlreadySaved = !!result.data?.savedAnalysisId;
      if (backendAlreadySaved) {
        setError('');
        setSuccessMessage('Analysis saved successfully! You can now view it in your Library.');
      } else {
        try {
          console.log('Auto-saving analysis with data:', {
            documentId: selectedDocument,
            contentLength: content.length,
            analysisResultLength: result.data.result.length,
            annotationsCount: finalAnnotations.length,
            analysisType: selectedAnalysisType,
            citationStyle: selectedCitationStyle,
          });

          const saveResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/save`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId: selectedDocument,
              content: content,
              analysisResult: result.data.result,
              annotations: finalAnnotations,
              analysisType: selectedAnalysisType,
              citationStyle: selectedCitationStyle,
            }),
          });

          if (saveResponse.ok) {
            await saveResponse.json();
            setError('');
            setSuccessMessage('Analysis saved successfully! You can now view it in your Library.');
          } else {
            const errorText = await saveResponse.text();
            console.error('Failed to automatically save analysis:', {
              status: saveResponse.status,
              statusText: saveResponse.statusText,
              error: errorText
            });
          }
        } catch (saveError) {
          console.error('Error automatically saving analysis:', saveError);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed');
      setShowAnalysisPopup(false);
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
      // Mark analysis as complete and let the popup handle the transition
      setAnalysisComplete(true);
      // Refresh documents to update analysis status
      fetchDocuments();
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('analysisCompleted', { 
        detail: { 
          documentId: selectedDocument,
          analysisType: selectedAnalysisType 
        } 
      }));
    }
  };


  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnnotationHover = (e: React.MouseEvent, annotationId: string) => {
    setHoveredAnnotation(annotationId);
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (isMobileDevice()) {
      // Mobile-optimized tooltip positioning
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 280; // Estimated tooltip width
      const tooltipHeight = 120; // Estimated tooltip height
      
      let x = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, rect.left));
      let y = rect.top - tooltipHeight - 10;
      
      // If tooltip would go above viewport, position it below the element
      if (y < 20) {
        y = rect.bottom + 10;
      }
      
      // Ensure tooltip doesn't go beyond viewport height
      if (y + tooltipHeight > viewportHeight - 20) {
        y = viewportHeight - tooltipHeight - 20;
      }
      
      setTooltipPosition({ x, y });
    } else {
      // Desktop positioning (original)
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  /** Click on highlighted text in the essay → scroll the annotation card into view in the sidebar. */
  const scrollAnnotationPanelToCard = (annotationId: string) => {
    setSelectedAnnotation(annotationId);
    requestAnimationFrame(() => {
      const el = document.getElementById(`annotation-panel-${annotationId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  /** Click on a sidebar card → scroll the essay text to the matching highlight. */
  const scrollDocumentToHighlight = (annotationId: string) => {
    setSelectedAnnotation(annotationId);
    requestAnimationFrame(() => {
      const safe =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(annotationId)
          : annotationId.replace(/"/g, '\\"');
      const el = document.querySelector(`[data-doc-annotation="${safe}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const scrollToRevisionDraft = () => {
    const el = document.querySelector('[data-revision-draft-mark]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /** Sync revised draft + annotations + WriteScholar cache to the library (purple + no repeat OpenAI on reopen). */
  const persistLibraryRevisionDraft = async (
    docId: string,
    content: string,
    annList: Annotation[],
    wsRevisionCache: Record<string, { sourceSpan: string; replacement: string }> = {}
  ) => {
    try {
      if (lockedFeatures.includes('apply_revisions')) return;
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/analysis/save-revised-draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: docId,
          content,
          annotations: annList,
          wsRevisionCache,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('Library draft save failed:', res.status, t);
      }
    } catch (e) {
      console.error('Library draft save error:', e);
    }
  };

  const dismissRevisionHighlight = () => {
    setRevisedDraftRanges([]);
  };

  /** True when this highlight currently shows the cached AI replacement (revision applied). */
  const isWriteScholarRevisionAppliedOnCard = (annotation: Annotation): boolean => {
    const cached = cachedWsRevisionByAnnotationId[annotation.id];
    if (!cached) return false;
    const slice = documentContent.slice(annotation.startIndex, annotation.endIndex);
    return slice === cached.replacement || slice.trim() === cached.replacement.trim();
  };

  /** Pulse + glow on the one tour card the user should click next (red first, then amber). */
  const activationTourShouldGlowCard = (annotation: Annotation): boolean => {
    if (!isActivationTutorial || activationDualRevisionsDone) return false;
    if (activationCoachStep === 'rewriteConcern') {
      return (
        annotation.id === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID &&
        activationRewritePhase === 'concern' &&
        !isWriteScholarRevisionAppliedOnCard(annotation)
      );
    }
    if (activationCoachStep === 'rewriteImprove') {
      return (
        annotation.id === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID &&
        activationRewritePhase === 'improve' &&
        !isWriteScholarRevisionAppliedOnCard(annotation)
      );
    }
    return false;
  };

  /** Revert one applied WriteScholar revision back to the original span (other revisions stay). */
  const revertWriteScholarRevisionForAnnotation = (annotationId: string) => {
    if (!canApplyWriteScholarRevisions) return;
    const ann = annotations.find((a) => a.id === annotationId);
    const cached = cachedWsRevisionByAnnotationId[annotationId];
    if (!ann || ann.type === 'strong' || ann.isCoverageOnly || !cached) return;
    const start = ann.startIndex;
    const end = ann.endIndex;
    if (start < 0 || end > documentContent.length || start >= end) {
      setError('This highlight no longer matches your draft.');
      return;
    }
    const slice = documentContent.slice(start, end);
    if (slice !== cached.replacement && slice.trim() !== cached.replacement.trim()) {
      setError('Could not revert: this passage no longer matches the applied revision.');
      return;
    }

    const sourceSpan = cached.sourceSpan;
    const newLen = sourceSpan.length;
    const docBefore = documentContent;
    const newContent = docBefore.slice(0, start) + sourceSpan + docBefore.slice(end);
    const nextAnnotations = mapAnnotationsAfterInlineReplace(
      [...annotations],
      annotationId,
      start,
      end,
      newLen,
      newContent
    );

    const draftRangesBefore = [...revisedDraftRanges];
    setRevisedDraftRanges(() =>
      shiftRevisionRangesAfterReplace(draftRangesBefore, start, end, newLen)
    );

    setDocumentContent(newContent);
    setPreviewContent(newContent);
    setAnnotations(nextAnnotations);
    setWriteScholarUndo(null);
    setRevisionNoticeMeta(null);
    setError('');

    try {
      if (!selectedDocument) {
        localStorage.setItem('textAnalysisContent', newContent);
      }
    } catch {
      /* ignore quota */
    }

    setSuccessMessage('Revision reverted for this sentence.');
    window.setTimeout(() => setSuccessMessage(''), 5000);

    if (selectedDocument) {
      void persistLibraryRevisionDraft(selectedDocument, newContent, nextAnnotations, cachedWsRevisionByAnnotationId);
    }
  };

  const revertWriteScholarRevision = () => {
    if (!canApplyWriteScholarRevisions || !writeScholarUndo) return;
    const snap = writeScholarUndo;
    const docId = selectedDocument;
    setDocumentContent(snap.documentContent);
    setPreviewContent(snap.previewContent);
    setAnnotations(snap.annotations);
    try {
      if (!selectedDocument) {
        localStorage.setItem('textAnalysisContent', snap.documentContent);
      }
    } catch {
      /* ignore quota */
    }
    setWriteScholarUndo(null);
    setRevisedDraftRanges(snap.revisedDraftRanges ?? []);
    setRevisionNoticeMeta(null);
    setSuccessMessage('Revision reverted.');
    window.setTimeout(() => setSuccessMessage(''), 5000);

    if (docId) {
      void persistLibraryRevisionDraft(docId, snap.documentContent, snap.annotations, cachedWsRevisionByAnnotationId);
    }
  };

  /** Pro/Premium: replace highlighted span with WriteScholar's suggested revision (improve/concern only). */
  const canApplyWriteScholarRevisions = useMemo(
    () =>
      isActivationTutorial ||
      (!lockedFeatures.includes('full_annotations') && !lockedFeatures.includes('apply_revisions')),
    [lockedFeatures, isActivationTutorial]
  );

  /** Shared apply path after we have replacement text (from API or cache). */
  const applyWsReplacementToDraft = (
    annotationId: string,
    ann: Annotation,
    start: number,
    end: number,
    replacement: string,
    docBefore: string,
    previewBefore: string,
    annotationsBefore: Annotation[],
    draftRangesBefore: { start: number; end: number }[],
    wsRevisionCacheSnapshot: Record<string, { sourceSpan: string; replacement: string }>
  ) => {
    const newLen = replacement.length;
    const newContent = docBefore.slice(0, start) + replacement + docBefore.slice(end);
    const nextAnnotations = mapAnnotationsAfterInlineReplace(
      annotationsBefore,
      annotationId,
      start,
      end,
      newLen,
      newContent
    );

    setWriteScholarUndo({
      documentContent: docBefore,
      previewContent: previewBefore,
      annotations: annotationsBefore,
      revisedDraftRanges: [...draftRangesBefore],
    });
    setRevisionNoticeMeta({
      comment: ann.comment,
      type: ann.type as 'improve' | 'concern',
    });

    setDocumentContent(newContent);
    setPreviewContent(newContent);
    if (isActivationTutorial) {
      if (annotationId === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID) {
        setActivationConcernRevisionApplied(true);
      }
      if (annotationId === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID) {
        setActivationImproveRevisionApplied(true);
      }
    }
    setRevisedDraftRanges(() => {
      const shifted = shiftRevisionRangesAfterReplace(draftRangesBefore, start, end, newLen);
      return [...shifted, { start, end: start + newLen }];
    });

    try {
      if (!selectedDocument) {
        localStorage.setItem('textAnalysisContent', newContent);
      }
    } catch {
      /* ignore quota */
    }

    setAnnotations(nextAnnotations);

    if (selectedAnnotation === annotationId) setSelectedAnnotation(null);
    setHoveredAnnotation(null);
    setSuccessMessage(
      selectedDocument
        ? 'Revision applied in your draft. Saved to your library.'
        : 'Revision applied in your draft.'
    );
    window.setTimeout(() => setSuccessMessage(''), 5000);
    window.setTimeout(() => scrollToRevisionDraft(), 200);

    if (selectedDocument) {
      void persistLibraryRevisionDraft(selectedDocument, newContent, nextAnnotations, wsRevisionCacheSnapshot);
    }
  };

  const applyWriteScholarRevision = async (annotationId: string) => {
    if (!canApplyWriteScholarRevisions) return;
    const ann = annotations.find((a) => a.id === annotationId);
    if (!ann || ann.type === 'strong' || ann.isCoverageOnly) return;
    const start = ann.startIndex;
    const end = ann.endIndex;
    if (start < 0 || end > documentContent.length || start >= end) {
      setError('This highlight no longer matches your draft. Re-run analysis if you edited the text elsewhere.');
      return;
    }
    const slice = documentContent.slice(start, end);
    if (slice !== ann.text && slice.trim() !== ann.text.trim()) {
      setError('This highlight no longer matches your draft. Re-run analysis to refresh annotations.');
      return;
    }

    const cached = cachedWsRevisionByAnnotationId[annotationId];
    const matchesSource =
      cached &&
      (slice === cached.sourceSpan || slice.trim() === cached.sourceSpan.trim());
    const matchesReplacement =
      cached &&
      (slice === cached.replacement || slice.trim() === cached.replacement.trim());

    if (matchesReplacement && !matchesSource) {
      setError('');
      setRevisionNoticeMeta({
        comment: ann.comment,
        type: ann.type as 'improve' | 'concern',
      });
      const coveredByPurple = revisedDraftRanges.some(
        (r) => r.start <= start && r.end >= end
      );
      if (!coveredByPurple) {
        setRevisedDraftRanges((prev) => [...prev, { start, end }]);
      }
      setSuccessMessage(
        coveredByPurple
          ? 'This revision is already in your draft (no change).'
          : 'Purple highlight restored for this passage.'
      );
      window.setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }

    if (matchesSource && cached) {
      setError('');
      applyWsReplacementToDraft(
        annotationId,
        ann,
        start,
        end,
        cached.replacement,
        documentContent,
        previewContent,
        [...annotations],
        revisedDraftRanges,
        cachedWsRevisionByAnnotationId
      );
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in to apply revisions.');
      return;
    }

    setApplyingRevisionId(annotationId);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/analysis/inline-revision`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullDocument: documentContent,
          highlightedText: slice,
          startIndex: start,
          endIndex: end,
          annotationType: ann.type,
          comment: ann.comment ?? '',
          suggestion: ann.suggestion ?? '',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          (payload as { message?: string }).message ||
          (payload as { error?: string }).error ||
          'Could not generate revision';
        throw new Error(msg);
      }

      const replacement = String((payload as { data?: { replacement?: string } }).data?.replacement ?? '').trim();
      if (!replacement) {
        setError('No revision text returned. Try again.');
        return;
      }

      const nextCache = {
        ...cachedWsRevisionByAnnotationId,
        [annotationId]: { sourceSpan: slice, replacement },
      };
      setCachedWsRevisionByAnnotationId(nextCache);

      applyWsReplacementToDraft(
        annotationId,
        ann,
        start,
        end,
        replacement,
        documentContent,
        previewContent,
        [...annotations],
        revisedDraftRanges,
        nextCache
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply revision');
    } finally {
      setApplyingRevisionId(null);
    }
  };

  // Helper function to render text with italics for common patterns
  const renderTextWithItalics = (text: string, key: string) => {
    // Split text and apply italics where needed (same rules as textToHtmlWithItalics / copy)
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let foundMatch = false;

    ACADEMIC_ITALIC_PATTERNS.forEach((pattern) => {
      pattern.lastIndex = 0; // Reset regex
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        if (match.index >= lastIndex) {
          foundMatch = true;
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
          }
          // Add italicized match
          parts.push(
            <em key={`${key}-italic-${match.index}`}>
              {match[0]}
            </em>
          );
          lastIndex = match.index + match[0].length;
        }
      }
    });

    // If no patterns found, return plain text
    if (!foundMatch || lastIndex === 0) {
      return text;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const getDisplayContent = () => {
    return documentContent || '';
  };

  const copyEssayPlainText = async () => {
    const text = getDisplayContent();
    if (!text.trim()) {
      setError('Nothing to copy yet.');
      return;
    }

    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    /** Word / Docs often collapse bare <p> on paste; explicit margins preserve paragraph gaps. */
    const pStyle =
      'margin:0 0 12pt 0;margin-bottom:0.75em;mso-margin-top-alt:0;mso-margin-bottom-alt:12.0pt;line-height:1.15;';
    const htmlBody = paragraphs
      .map((p) => {
        const trimmed = p.trim();
        const inner = textToHtmlWithItalics(trimmed).replace(/\n/g, '<br />');
        return `<p style="${pStyle}">${inner}</p>`;
      })
      .join('');
    const htmlFragment = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">${htmlBody}</body></html>`;

    const tryRichCopy = async (): Promise<boolean> => {
      if (typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') {
        return false;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlFragment], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
        return true;
      } catch {
        return false;
      }
    };

    try {
      const ok = await tryRichCopy();
      if (!ok) {
        await navigator.clipboard.writeText(text);
      }
      setEssayCopyFeedback(true);
      setTimeout(() => setEssayCopyFeedback(false), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setEssayCopyFeedback(true);
        setTimeout(() => setEssayCopyFeedback(false), 2000);
      } catch {
        setError('Could not copy to clipboard. Try selecting the text in the document instead.');
      }
    }
  };

  const getFilteredAnnotations = (type?: string) => {
    const source = annotationsForRender;
    if (type) {
      return source.filter((a) => a.type === type);
    }
    return source;
  };

  /** Plain text between annotations: purple revision takes priority over default styling. */
  const renderParagraphChunkWithRevision = (text: string, chunkGlobalStart: number, keyPrefix: string) => {
    if (!text) return null;
    const segments = splitSegmentByRevisionRanges(text, chunkGlobalStart, revisedDraftRanges);
    return (
      <>
        {segments.map((seg, i) =>
          seg.type === 'revision' ? (
            <mark
              key={`${keyPrefix}-rev-${i}`}
              data-revision-draft-mark
              className={REVISION_MARK_CLASS}
              title="WriteScholar revision (stays purple until you revert that change)"
            >
              {renderTextWithItalics(seg.text, `${keyPrefix}-r${i}`)}
            </mark>
          ) : (
            <span key={`${keyPrefix}-n-${i}`}>{renderTextWithItalics(seg.text, `${keyPrefix}-n${i}`)}</span>
          )
        )}
      </>
    );
  };

  const renderHighlightedText = () => {
    if (!documentContent) {
      return <div className="text-stone-700 leading-relaxed">No document content available.</div>;
    }

    const displayContent = getDisplayContent();

    console.log('Rendering text with annotations:', annotationsForRender.length);
    console.log('Document content length:', documentContent.length);

    const paragraphs = displayContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let searchFrom = 0;
    const paragraphStarts = paragraphs.map((paragraph) => {
      const idx = displayContent.indexOf(paragraph, searchFrom);
      const start = idx >= 0 ? idx : searchFrom;
      searchFrom = start + paragraph.length;
      return start;
    });

    /** Inline banner shown at the 40% mark where annotations stop (free users see full paper, annotations only on first 40%) */
    const freeAnnotationCutoffBanner =
      isFreePreview && freePreviewCharCutoff != null && freePreviewCharCutoff < displayContent.length ? (
        <div className="my-6 relative overflow-hidden rounded-2xl border-2 border-dashed border-violet-300/80 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/80 dark:border-violet-600/50 dark:from-violet-950/30 dark:via-stone-900 dark:to-violet-950/30">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 px-5 py-5 sm:py-4">
            {/* Left: Visual indicator showing annotation colors */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-400 ring-2 ring-green-200 dark:ring-green-800" title="Strengths" />
              <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 dark:ring-amber-800" title="Improvements" />
              <div className="w-3 h-3 rounded-full bg-red-400 ring-2 ring-red-200 dark:ring-red-800" title="Concerns" />
              <svg className="w-5 h-5 text-violet-400 ml-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {/* Middle: Message */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                Annotations continue on {Math.round((1 - (freePreviewCharCutoff / displayContent.length)) * 100)}% of your paper
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                You can read the rest below — {annotations.filter(a => a.startIndex >= freePreviewCharCutoff).length} more feedback points are waiting for you
              </p>
            </div>
            {/* Right: CTA */}
            <button
              type="button"
              onClick={startProMonthlyCheckout}
              disabled={checkoutRedirecting}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-violet-600 hover:shadow-violet-500/35 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {checkoutRedirecting ? 'Opening…' : canStartFreeTrial ? 'Unlock all — free trial' : 'Unlock all annotations'}
            </button>
          </div>
        </div>
      ) : null;

    if (annotationsForRender.length === 0) {
      let bannerInserted = false;
      return (
        <div className="text-gray-700 leading-relaxed">
          {paragraphs.map((paragraph, index) => {
            const paragraphStart = paragraphStarts[index] ?? 0;
            const isPastCutoff = isFreePreview && freePreviewCharCutoff != null && paragraphStart >= freePreviewCharCutoff;
            const shouldShowBanner = !bannerInserted && isFreePreview && freePreviewCharCutoff != null && paragraphStart >= freePreviewCharCutoff;
            if (shouldShowBanner) bannerInserted = true;
            if (!paragraph.trim()) return null;
            return (
              <React.Fragment key={index}>
                {shouldShowBanner && freeAnnotationCutoffBanner}
                <p className={`mb-4 text-justify ${isPastCutoff ? 'text-stone-500 dark:text-stone-400' : ''}`}>
                  {renderParagraphChunkWithRevision(paragraph, paragraphStart, `no-anno-p-${index}`)}
                </p>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    const sortedAnnotations = [...annotationsForRender]
      .filter((annotation) => {
        const isValid =
          annotation.startIndex >= 0 &&
          annotation.endIndex > annotation.startIndex &&
          annotation.endIndex <= documentContent.length;

        if (!isValid) {
          console.warn('Invalid annotation filtered out during rendering:', annotation);
          return false;
        }

        return true;
      })
      .sort((a, b) => a.startIndex - b.startIndex);

    console.log('Valid annotations for rendering:', sortedAnnotations.length);

    let bannerInserted = false;
    return (
      <div className="text-stone-700 leading-relaxed">
        {paragraphs.map((paragraph, paragraphIndex) => {
          const paragraphStart = paragraphStarts[paragraphIndex] ?? 0;
          const paragraphEnd = paragraphStart + paragraph.length;
          const isPastCutoff = isFreePreview && freePreviewCharCutoff != null && paragraphStart >= freePreviewCharCutoff;
          const shouldShowBanner = !bannerInserted && isFreePreview && freePreviewCharCutoff != null && paragraphStart >= freePreviewCharCutoff;
          if (shouldShowBanner) bannerInserted = true;
          
          if (!paragraph.length) return null;
          const effectiveParagraphEnd = paragraphEnd;
          
          // For paragraphs past the cutoff, render as plain text with faded styling
          if (isPastCutoff) {
            return (
              <React.Fragment key={paragraphIndex}>
                {shouldShowBanner && freeAnnotationCutoffBanner}
                <p className="mb-4 text-justify text-stone-500 dark:text-stone-400">
                  {renderParagraphChunkWithRevision(paragraph, paragraphStart, `p-${paragraphIndex}`)}
                </p>
              </React.Fragment>
            );
          }
          
          const paragraphAnnotations = sortedAnnotations.filter((annotation) => {
            return annotation.startIndex < effectiveParagraphEnd && annotation.endIndex > paragraphStart;
          });

          if (paragraphAnnotations.length === 0) {
            return (
              <React.Fragment key={paragraphIndex}>
                {shouldShowBanner && freeAnnotationCutoffBanner}
                <p className="mb-4 text-justify">
                  {renderParagraphChunkWithRevision(paragraph, paragraphStart, `p-${paragraphIndex}`)}
                </p>
              </React.Fragment>
            );
          }

          const parts = [];
          let lastIndex = 0;

          paragraphAnnotations.forEach((annotation) => {
            const annotationStart = Math.max(annotation.startIndex, paragraphStart);
            const annotationEnd = Math.min(annotation.endIndex, effectiveParagraphEnd);

            const relativeStart = Math.max(0, annotationStart - paragraphStart);
            const relativeEnd = Math.min(paragraph.length, annotationEnd - paragraphStart);

            if (relativeStart > lastIndex) {
              const textBefore = paragraph.slice(lastIndex, relativeStart);
              if (textBefore.length > 0) {
                parts.push(
                  <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-stone-700">
                    {renderParagraphChunkWithRevision(
                      textBefore,
                      paragraphStart + lastIndex,
                      `text-${paragraphIndex}-${lastIndex}`
                    )}
                  </span>
                );
              }
            }

            const actualText = paragraph.slice(relativeStart, relativeEnd);
            console.log(`Annotation ${annotation.id} (${annotation.type}): "${actualText.substring(0, 50)}..." (${relativeStart}-${relativeEnd} in paragraph ${paragraphIndex})`);

            const highlightClasses = {
              strong: 'bg-green-100 text-green-900 border-b-2 border-green-400 hover:bg-green-200',
              improve: 'bg-amber-100 text-amber-900 border-b-2 border-amber-400 hover:bg-amber-200',
              concern: 'bg-red-100 text-red-900 border-b-2 border-red-400 hover:bg-red-200'
            };

            const annoSegments = splitSegmentByRevisionRanges(actualText, annotationStart, revisedDraftRanges);

            parts.push(
              <span
                key={`${annotation.id}-p${paragraphIndex}`}
                data-doc-annotation={annotation.id}
                className={`inline px-0.5 cursor-pointer transition-all duration-200 ${
                  selectedAnnotation === annotation.id ? 'ring-2 ring-offset-2 ring-violet-500 rounded-sm' : ''
                } ${activationTourShouldGlowCard(annotation) ? 'activation-tour-doc-glow' : ''}`}
                onMouseEnter={(e) => handleAnnotationHover(e, annotation.id)}
                onMouseLeave={() => setHoveredAnnotation(null)}
                onClick={() => scrollAnnotationPanelToCard(annotation.id)}
                title={
                  lockedFeatures.includes('full_annotations') && !isFreePreview
                    ? annotation.type === 'strong'
                      ? 'Upgrade to Pro to see why this sentence works and what makes it effective'
                      : 'Upgrade to Pro for concrete feedback on how to improve this sentence'
                    : `${annotation.type.toUpperCase()}: ${annotation.comment}`
                }
              >
                {annoSegments.map((seg, si) =>
                  seg.type === 'revision' ? (
                    <mark
                      key={`${annotation.id}-seg-${si}`}
                      data-revision-draft-mark
                      className={REVISION_MARK_CLASS}
                      title="WriteScholar revision"
                    >
                      {renderTextWithItalics(seg.text, `anno-${annotation.id}-r${si}`)}
                    </mark>
                  ) : (
                    <span
                      key={`${annotation.id}-seg-${si}`}
                      className={`${highlightClasses[annotation.type]} px-0.5 rounded-sm`}
                    >
                      {renderTextWithItalics(seg.text, `anno-${annotation.id}-n${si}`)}
                    </span>
                  )
                )}
              </span>
            );

            lastIndex = relativeEnd;
          });

          if (lastIndex < paragraph.length) {
            const remainingText = paragraph.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(
                <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-gray-700">
                  {renderParagraphChunkWithRevision(
                    remainingText,
                    paragraphStart + lastIndex,
                    `text-${paragraphIndex}-${lastIndex}`
                  )}
                </span>
              );
            }
          }

          return (
            <React.Fragment key={paragraphIndex}>
              {shouldShowBanner && freeAnnotationCutoffBanner}
              <p className="mb-4 text-justify">
                {parts}
              </p>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const analysisPageTitle = analysisResult ? 'Essay analysis results' : 'Analyze your essay';
  const analysisPageSubtitle = useMemo(() => {
    if (!analysisResult) return 'Get comprehensive AI-powered feedback on your academic documents';
    const docMeta = documents.find((d) => d.id === selectedDocument);
    const docLabel = docMeta?.title || docMeta?.originalFilename || docMeta?.file_name;
    if (docLabel) return `Results for: ${docLabel}`;
    return 'Review annotations, scores, and suggestions below.';
  }, [analysisResult, documents, selectedDocument]);

  /** Word-level diff on normalized text: purple = new/changed vs first-draft baseline (compare modal). */
  const compareModalCurrentDraftDiff = useMemo(() => {
    if (!showCompareOriginalModal || !originalDraftBaseline) return null;
    const a = normalizeDraftForCompare(originalDraftBaseline);
    const b = normalizeDraftForCompare(documentContent);
    const parts = diffWordsWithSpace(a, b);
    return parts.flatMap((part, i) => {
      if (part.removed) return [];
      if (!part.value) return [];
      if (part.added) {
        return [
          <mark key={`cmp-${i}`} className={REVISION_MARK_CLASS}>
            {part.value}
          </mark>,
        ];
      }
      return [<span key={`cmp-${i}`}>{part.value}</span>];
    });
  }, [showCompareOriginalModal, originalDraftBaseline, documentContent]);

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'strong':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'improve':
        return (
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'concern':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-x-hidden">
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Loading analysis tools...</p>
        </div>
      </div>
    );
  }

  const activationCoachPointerGate =
    isActivationTutorial &&
    (activationCoachStep === 'mla' ||
      activationCoachStep === 'analyze' ||
      activationCoachStep === 'rubric' ||
      activationCoachStep === 'doc' ||
      activationCoachStep === 'rewriteConcern' ||
      activationCoachStep === 'rewriteImprove' ||
      activationCoachStep === 'copyText');

  /** Lets the page receive wheel scroll while inner controls stay inert except data-activation-focus. */
  const activationScrollPassResults =
    isActivationTutorial &&
    (activationCoachStep === 'rubric' ||
      activationCoachStep === 'doc' ||
      activationCoachStep === 'rewriteConcern' ||
      activationCoachStep === 'rewriteImprove' ||
      activationCoachStep === 'copyText');

  const activationScrollPassConfigure =
    isActivationTutorial && (activationCoachStep === 'mla' || activationCoachStep === 'analyze');

  const activationHideRevertOnTourRewrite =
    isActivationTutorial &&
    (activationCoachStep === 'rewriteConcern' || activationCoachStep === 'rewriteImprove');

  /** Essay + annotation sidebar: restore pointer events under the tour gate so highlight hover tooltips work (CSS: .activation-analysis-pointer-gate). Not during mla/analyze — only configure controls should be interactive. */
  const activationPaperHoverSubtree =
    isActivationTutorial &&
    (activationCoachStep === 'rubric' ||
      activationCoachStep === 'doc' ||
      activationCoachStep === 'rewriteConcern' ||
      activationCoachStep === 'rewriteImprove' ||
      activationCoachStep === 'copyText');

  /** Full-screen dim above the nav; must be first inside the gated wrapper so z-[210] focus controls (citation, analyze) paint above it. */
  const showMlAnalyzeActivationBackdrop =
    isActivationTutorial && (activationCoachStep === 'mla' || activationCoachStep === 'analyze');

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <div
        className={
          activationCoachPointerGate
            ? 'activation-analysis-pointer-gate [&_*]:pointer-events-none [&_[data-activation-focus]]:pointer-events-auto [&_[data-activation-focus]]:relative [&_[data-activation-focus]]:z-[210] [&_[data-activation-scroll-pass]]:pointer-events-auto'
            : undefined
        }
      >
      {showMlAnalyzeActivationBackdrop && (
        <div
          className="fixed inset-0 z-[118] pointer-events-none bg-stone-900/[0.07] dark:bg-black/22 transition-opacity duration-300"
          aria-hidden
        />
      )}
      <Header
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        currentPage="analysis"
        libraryActivationHighlight={isActivationTutorial && activationCoachStep === 'library'}
        blockNavigationInteractions={activationCoachPointerGate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Mascot with analytical pose - glasses, clipboard, magnifying glass */}
              <div className="relative p-2 sm:p-3 bg-violet-50 rounded-2xl border border-violet-100 shadow-sm">
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🔍</span>
                </div>
                <ScholarMascot size={100} animated={true} pose="analyzing" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50">
                  {analysisPageTitle}
                </h1>
                <p className="mt-3 text-lg text-stone-600 dark:text-stone-400">
                  {analysisPageSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('analysis-history')}
              className="flex items-center space-x-2 px-5 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">Analysis History</span>
            </button>
          </div>
        </div>

        {limitExceededError && (
          <div 
            ref={limitBannerRef}
            className="mb-8 p-6 bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 rounded-2xl shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Monthly limit exceeded</h3>
                  <p className="text-red-700 dark:text-red-300 mt-1">{limitExceededError}</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">Upgrade to Pro for more analyses.</p>
                </div>
              </div>
              <button
                onClick={startProMonthlyCheckout}
                disabled={checkoutRedirecting}
                className="flex-shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-wait text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                {checkoutRedirecting ? 'Opening checkout…' : 'Upgrade for more'}
              </button>
            </div>
          </div>
        )}

        {error && !limitExceededError && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-5 bg-violet-50 border border-violet-200 rounded-2xl">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-violet-700 font-medium">{successMessage}</p>
                <button
                  onClick={() => onNavigate?.('library')}
                  className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View in Library
                </button>
              </div>
            </div>
          </div>
        )}

        {!analysisResult ? (
          <>
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            data-activation-scroll-pass={activationScrollPassConfigure ? true : undefined}
          >
            {/* Analysis Configuration - left column */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 min-h-0">
              <h2 className="text-xl font-bold text-stone-900 mb-6">Configure Analysis</h2>
              
              {/* Document Selection */}
              {!documentContent && (
                <div className="mb-6">
                  <label className="block text-base font-medium text-stone-900 mb-2">
                    Select Document
                  </label>
                  <select
                    value={selectedDocument}
                    onChange={(e) => handleDocumentSelection(e.target.value)}
                    className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                    disabled={isAnalyzing}
                  >
                    <option value="">Choose a document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.originalFilename || doc.file_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Text Content Notice */}
              {documentContent && !selectedDocument && (
                <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-violet-800">Text Analysis Mode</span>
                  </div>
                  <p className="text-sm text-violet-700 mt-2">
                    Analyzing text content from dashboard. Select citation style and run analysis.
                  </p>
                </div>
              )}

              {/* Analysis Type Selection - only comprehensive shown for better UX */}
              <div className="mb-6">
                <label className="block text-base font-medium text-stone-900 mb-3">
                  Analysis Type
                </label>
                <div className="space-y-3">
                  {analysisTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedAnalysisType === type.id
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      onClick={() => setSelectedAnalysisType(type.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-stone-900">{type.name}</h3>
                          <p className="text-sm text-stone-600 mt-0.5">{type.description}</p>
                          <p className="text-xs text-stone-500 mt-1">⏱️ {type.estimatedTime}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAnalysisType === type.id
                            ? 'border-violet-500 bg-violet-500'
                            : 'border-stone-300'
                        }`}>
                          {selectedAnalysisType === type.id && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citation Style Selection */}
              <div className="mb-6">
                <label className="block text-base font-medium text-stone-900 mb-2">
                  Citation Style
                </label>
                <select
                  ref={activationCitationSelectRef}
                  value={selectedCitationStyle}
                  onChange={(e) => setSelectedCitationStyle(e.target.value)}
                  data-activation-citation-select
                  data-activation-focus={activationCoachStep === 'mla' ? true : undefined}
                  className={`w-full px-4 py-3.5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 ease-out ${
                    activationCoachStep === 'mla'
                      ? 'border-violet-500/90 shadow-[0_0_0_3px_rgba(167,139,250,0.35),0_0_24px_rgba(139,92,246,0.25)]'
                      : 'border-gray-300 dark:border-stone-600'
                  }`}
                  disabled={isAnalyzing}
                >
                  <option value="None">None (No citations required)</option>
                  <option value="APA">APA (American Psychological Association)</option>
                  <option value="Harvard">Harvard</option>
                  <option value="Chicago">Chicago</option>
                  <option value="MLA">MLA (Modern Language Association)</option>
                  <option value="IEEE">IEEE</option>
                  <option value="Vancouver">Vancouver</option>
                </select>
                <p className="text-sm text-stone-500 mt-2">
                  Select the citation style used in your document
                </p>
              </div>

              {/* Grading Style Selection */}
              <div className="mb-6">
                <label className="block text-base font-medium text-stone-900 dark:text-stone-100 mb-2">
                  Grade format
                </label>
                <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-600">
                  <button
                    type="button"
                    onClick={() => setSelectedGradingStyle('us')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedGradingStyle === 'us'
                        ? 'bg-white dark:bg-stone-700 text-violet-700 dark:text-violet-300 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <span className="font-semibold">Letter grades</span>
                    <span className="ml-1.5 text-stone-400 dark:text-stone-500 font-normal">A, B+, C</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGradingStyle('uk')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedGradingStyle === 'uk'
                        ? 'bg-white dark:bg-stone-700 text-violet-700 dark:text-violet-300 shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <span className="font-semibold">Classifications</span>
                    <span className="ml-1.5 text-stone-400 dark:text-stone-500 font-normal">1st, 2:1, 2:2</span>
                  </button>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
                  How your grade will appear in the results
                </p>
              </div>

              {/* Analyze Button */}
              <button
                ref={activationAnalyzeDocBtnRef}
                type="button"
                data-activation-analyze-doc
                data-activation-focus={activationCoachStep === 'analyze' ? true : undefined}
                onClick={handleAnalyze}
                disabled={
                  (!selectedDocument && !documentContent) ||
                  !selectedAnalysisType ||
                  isAnalyzing ||
                  (activationCoachStep === 'mla' && selectedCitationStyle !== 'MLA')
                }
                className={`w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 px-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out ${
                  activationCoachStep === 'analyze'
                    ? 'shadow-[0_0_0_3px_rgba(167,139,250,0.45),0_0_32px_rgba(139,92,246,0.3)]'
                    : ''
                }`}
              >
                {isAnalyzing ? (
                  <LoadingSpinner 
                    size="sm" 
                    text="Analyzing..."
                    color="white"
                  />
                ) : (
                  'Analyze Document'
                )}
              </button>
            </div>

            {/* Document Preview - right column, row 1 */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 min-h-[700px]">
              <h2 className="text-xl font-bold text-stone-900 mb-6">Document Preview</h2>
              
              {!selectedDocument && !documentContent ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-stone-900">No document selected</h3>
                  <p className="mt-2 text-stone-500">
                    Select a document to preview its content
                  </p>
                </div>
              ) : selectedDocument && isLoadingPreview ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto"></div>
                  <p className="mt-4 text-stone-600">Loading document preview...</p>
                </div>
              ) : previewContent || documentContent ? (
                <div className="relative min-h-[600px] max-h-[800px] overflow-y-auto">
                  <div className="relative z-0 bg-stone-50 rounded-xl p-5 border border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-stone-900">
                        {selectedDocument 
                          ? documents.find(doc => doc.id === selectedDocument)?.title || 'Document Content'
                          : 'Text Content from Dashboard'
                        }
                      </h3>
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                        {(previewContent || documentContent).split(' ').length} words
                      </span>
                    </div>
                    <div className="text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                      {(previewContent || documentContent).split(/\n\s*\n/).filter(p => p.trim().length > 0).map((paragraph, index) => (
                        <p key={index} className="mb-4 text-justify">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm text-gray-500">
                    This is the content that will be analyzed. Click "Analyze Document" to begin.
                  </p>

                  {/* Rubric / Requirements - directly below */}
                  <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowRubricSection(!showRubricSection)}
                      className="flex items-center justify-between w-full px-4 py-3.5 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl flex-shrink-0">📋</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-stone-900 text-sm">Add Rubric or Requirements</div>
                          <div className="text-stone-600 text-xs mt-1">
                            {rubricContent ? 'Rubric added — will be compared against your essay' : 'Optional — compare your essay against assignment criteria'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {rubricContent && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Added</span>
                        )}
                        <svg className={`w-5 h-5 text-stone-500 transition-transform ${showRubricSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {showRubricSection && (
                      <div className="px-4 pb-4 pt-1 border-t border-stone-200 bg-white space-y-4">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setRubricInputMode('paste')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              rubricInputMode === 'paste'
                                ? 'bg-violet-100 text-violet-700 border border-violet-300'
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Paste Text
                          </button>
                          <button
                            type="button"
                            onClick={() => setRubricInputMode('upload')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              rubricInputMode === 'upload'
                                ? 'bg-violet-100 text-violet-700 border border-violet-300'
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Upload File
                          </button>
                        </div>

                        {rubricInputMode === 'paste' ? (
                          <textarea
                            value={rubricContent}
                            onChange={(e) => setRubricContent(e.target.value)}
                            placeholder="Paste your rubric, essay question, or assignment requirements here..."
                            className="w-full px-4 py-3 text-sm border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors resize-y min-h-[120px] bg-white text-stone-900 placeholder-stone-400"
                            rows={5}
                            disabled={isAnalyzing}
                          />
                        ) : (
                          <div>
                            <input
                              ref={rubricFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={handleRubricFileUpload}
                              className="hidden"
                              disabled={isAnalyzing || isParsingRubric}
                            />
                            <button
                              type="button"
                              onClick={() => rubricFileInputRef.current?.click()}
                              disabled={isAnalyzing || isParsingRubric}
                              className="w-full px-4 py-6 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
                            >
                              {isParsingRubric ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                                  <span className="text-sm">Parsing rubric file...</span>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <span className="text-sm font-medium">Upload rubric (PDF, DOCX, TXT)</span>
                                </div>
                              )}
                            </button>
                          </div>
                        )}

                        {rubricContent && (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-green-700 font-medium">
                                Rubric loaded ({rubricContent.split(/\s+/).filter(Boolean).length} words)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRubricContent('')}
                              className="text-sm text-red-500 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedDocument ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Failed to load preview</h3>
                  <p className="mt-2 text-gray-500">
                    Unable to load document content for preview
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          </>
        ) : (
          <>
          {/* Premium Analysis Results Display */}
          <div
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            data-activation-scroll-pass={activationScrollPassResults ? true : undefined}
          >
            {/* Results Header */}
            <div className="bg-gray-900 text-white px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {documents.find(doc => doc.id === selectedDocument)?.title || 'Document Analysis'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {analysisTypes.find(type => type.id === selectedAnalysisType)?.name} • Analyzed {formatDate(new Date().toISOString())}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={copyEssayPlainText}
                    data-activation-copy-full-text
                    data-activation-focus={isActivationTutorial && activationCoachStep === 'copyText' ? true : undefined}
                    className={`px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium ${
                      isActivationTutorial && activationCoachStep === 'copyText'
                        ? 'ring-2 ring-violet-300/95 ring-offset-2 ring-offset-gray-900 z-[5] relative'
                        : ''
                    }`}
                    title="Copy the full essay — paste into Word or Google Docs; auto-italics (titles, Latin phrases, etc.) are preserved where supported"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>{essayCopyFeedback ? 'Copied!' : 'Copy full text'}</span>
                  </button>
                  {!isMobileDevice() && (
                    <>
                      {currentPlan !== 'free' ? (
                        <>
                          <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm font-medium"
                            title="Export as PDF"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>PDF</span>
                          </button>
                          <button 
                            onClick={exportToWord}
                            disabled={isExporting}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm font-medium"
                            title="Export as Word Document"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Word</span>
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => onNavigate?.('pricing')}
                          className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium text-amber-200"
                          title="Export your full report — PDF or Word (Pro)"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Export full report — Pro</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  <button 
                    onClick={handleCloseAnalysis}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grade Breakdown — FIRST: score, grade, and all categories */}
            <div
              data-activation-target="rubric"
              className={`mx-6 mt-6 mb-4 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-600 overflow-hidden transition-shadow duration-300 ${
                isActivationTutorial && activationCoachStep === 'rubric'
                  ? 'ring-4 ring-violet-500/75 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-900 shadow-[0_0_48px_rgba(139,92,246,0.28)] z-[5] relative'
                  : ''
              }`}
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-5">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <h2 className="text-xl font-bold">General Academic Assessment</h2>
                    <p className="text-emerald-100 text-sm mt-0.5 max-w-xl">
                      {isFreePreview ? (
                        <>
                          Real scores above — you&apos;re seeing how professors grade you. Unlock the rest of your paper and the full write-up to squeeze out every point before you submit.
                        </>
                      ) : (
                        <>Standard college rubric: thesis, evidence, structure, and clarity</>
                      )}
                    </p>
                  </div>
                  {(analysisSummary.overall_score != null || analysisSummary.grade_estimate) && (
                    <div className="flex items-center gap-6 ml-auto">
                      {analysisSummary.overall_score != null && (
                        <div className="text-right">
                          <div className="text-3xl font-extrabold">{Math.round(Number(analysisSummary.overall_score))}/100</div>
                          <div className="text-emerald-100 text-xs">Score</div>
                        </div>
                      )}
                      {analysisSummary.grade_estimate && (
                        <div className="text-right">
                          <div className="text-3xl font-extrabold">{analysisSummary.grade_estimate}</div>
                          <div className="text-emerald-100 text-xs">Grade</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {gradeRubric && Object.keys(gradeRubric).length > 0 &&
                (!lockedFeatures.includes('grade_rubric') || isFreePreview) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(gradeRubric).map(([key, val]) => (
                      <div key={key} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-stone-800 dark:text-stone-200 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">{Math.round(Number(val.score))}/{val.max_score}</span>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-stone-400">{val.feedback}</p>
                      </div>
                    ))}
                  </div>
                ) : lockedFeatures.includes('grade_rubric') && !isFreePreview ? (
                  <div className="space-y-4">
                    <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                      Your essay is graded on six college-style categories (thesis, evidence, analysis, structure, and writing quality). Upgrade to see{' '}
                      <strong className="text-stone-800 dark:text-stone-200">your</strong> score and feedback in each box below.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(gradeRubric && Object.keys(gradeRubric).length > 0
                        ? Object.entries(gradeRubric).map(([key, val]) => ({
                            key,
                            label: formatRubricCategoryLabel(key),
                            maxScore: val.max_score,
                          }))
                        : STANDARD_GRADE_RUBRIC_PREVIEW.map((r) => ({
                            key: r.key,
                            label: r.label,
                            maxScore: r.maxScore,
                          }))
                      ).map((row) => (
                        <div
                          key={row.key}
                          className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600"
                        >
                          <div className="flex justify-between items-center gap-2 mb-2">
                            <span className="font-medium text-stone-800 dark:text-stone-200 text-sm leading-snug">{row.label}</span>
                            <span className="text-sm font-bold text-stone-400 dark:text-stone-500 tabular-nums flex-shrink-0">
                              ?/{row.maxScore}
                            </span>
                          </div>
                          <div className="relative min-h-[4.5rem] rounded-lg overflow-hidden border border-stone-200/90 bg-gradient-to-b from-stone-50 to-stone-100/90 dark:border-stone-600/50 dark:from-stone-700/30 dark:to-stone-800/50 ring-1 ring-violet-400/10">
                            <div
                              className="absolute inset-0 p-3 text-xs leading-relaxed text-stone-600 opacity-[0.72] contrast-[0.92] blur-[8px] select-none dark:text-stone-400 dark:opacity-[0.65] sm:blur-[9px]"
                              aria-hidden
                            >
                              Your personalized feedback for this category—what you did well, what to fix, and how—unlocks on Pro.
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/88 via-white/45 to-transparent dark:from-stone-900/88 dark:via-stone-900/40">
                              <span className="rounded-full border border-violet-200/90 bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 shadow-sm backdrop-blur-sm dark:border-violet-600/50 dark:bg-stone-900/80 dark:text-violet-300">
                                Pro
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={startProMonthlyCheckout}
                        disabled={checkoutRedirecting}
                        className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg font-semibold transition-colors"
                      >
                        {checkoutRedirecting ? 'Opening checkout…' : 'Unlock full rubric'}
                      </button>
                      <span className="text-sm text-violet-600 dark:text-violet-400">$19.99/mo</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Legend + essay + annotations — coach "annotated essay" step; paper-hover restores pointer events for highlight tooltips under the tour gate */}
            <div
              data-activation-target="activation-doc"
              data-activation-paper-hover={activationPaperHoverSubtree ? true : undefined}
            >
            {/* Legend */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-sm">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Strong sections</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    <span className="text-gray-600">Needs improvement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Needs revision</span>
                  </div>
                  {revisedDraftRanges.length > 0 && !isFreePreview && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-violet-400 rounded-full ring-2 ring-violet-500/45 shadow-sm" />
                      <span className="text-gray-600">WriteScholar revisions</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={copyEssayPlainText}
                    data-activation-copy-full-text
                    data-activation-focus={isActivationTutorial && activationCoachStep === 'copyText' ? true : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700/80 ${
                      isActivationTutorial && activationCoachStep === 'copyText'
                        ? 'ring-2 ring-violet-500/85 ring-offset-2 ring-offset-gray-50 dark:ring-offset-stone-900 z-[5] relative'
                        : ''
                    }`}
                    title="Copy full essay — Word/Docs keep italics for detected titles and Latin phrases"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    {essayCopyFeedback ? 'Copied' : 'Copy full text'}
                  </button>
                  {originalDraftBaseline && analysisResult && currentPlan !== 'free' && (
                    <button
                      type="button"
                      onClick={() => setShowCompareOriginalModal(true)}
                      className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline shrink-0"
                    >
                      Compare with first draft
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Document Analysis — Main Content Area */}
            <div className="flex flex-col md:flex-row md:h-[600px]">
              {/* Document Panel */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white" ref={documentRef}>
                <div className="prose max-w-none">
                  <div className="text-sm leading-7">
                    {renderHighlightedText()}
                  </div>
          </div>
        </div>

              {/* Annotations Panel — coach "apply revisions" step scroll target */}
              <div
                data-activation-target="activation-revisions"
                className="w-full md:w-96 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto max-h-[400px] md:max-h-none"
              >
                <div className="p-5 md:p-6">
                  <div className="space-y-6">
                    {/* Annotations — paid users, or free ~40% preview (real cards in the early part of the paper) */}
                    {(!lockedFeatures.includes('full_annotations') || isFreePreview) && (
                    <>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Annotations
                    </h3>
                    {isFreePreview && (
                      <div className="mb-4 rounded-xl border border-violet-200/80 bg-violet-50/80 dark:bg-violet-950/25 dark:border-violet-800/50 px-3 py-2.5">
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                          Full paper shown · Annotations on first ~40%
                        </p>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                          {canStartFreeTrial
                            ? `You can read your entire paper. Unlock Pro to see ${lockedAnnotationsForTeaser.length} more feedback points on the rest—same professor-level notes, rewrites, and grade-boosting fixes. Eligible: one 7-day free trial.`
                            : `You can read your entire paper. Upgrade to Pro to unlock ${lockedAnnotationsForTeaser.length} more annotations—full feedback, rewrites, and grade-boosting fixes on the whole draft.`}
                        </p>
                      </div>
                    )}
                    {writeScholarUndo && revisionNoticeMeta && !isFreePreview && (
                      <div className="rounded-xl border-2 border-dashed border-violet-400/75 bg-violet-50/95 dark:bg-violet-950/35 p-4 mb-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              revisionNoticeMeta.type === 'concern'
                                ? 'bg-red-100 dark:bg-red-900/40'
                                : 'bg-amber-100 dark:bg-amber-900/40'
                            }`}
                          >
                            {getAnnotationIcon(revisionNoticeMeta.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                              WriteScholar revision applied
                            </p>
                            <p className="text-xs text-stone-700 dark:text-stone-300 mt-1.5 leading-relaxed">
                              <span className="text-stone-500 dark:text-stone-400">Feedback you addressed: </span>
                              {revisionNoticeMeta.comment}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                              Applied revisions stay <span className="font-medium text-violet-700 dark:text-violet-300">purple</span> (not yellow/red) until you revert that sentence from its card. The banner “Revert to original text” only undoes the most recent apply.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={scrollToRevisionDraft}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm"
                          >
                            Show in document
                          </button>
                          {revisedDraftRanges.length > 0 && (
                            <button
                              type="button"
                              onClick={dismissRevisionHighlight}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                              Hide purple highlights
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={revertWriteScholarRevision}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-stone-900 border-2 border-violet-400 dark:border-violet-600 text-violet-800 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950/60"
                          >
                            Revert to original text
                          </button>
                          {originalDraftBaseline && (
                            <button
                              type="button"
                              onClick={() => setShowCompareOriginalModal(true)}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                              Compare with first draft
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {(!lockedFeatures.includes('full_annotations') || isFreePreview) && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-5 leading-snug">
                        {lockedFeatures.includes('apply_revisions') && !isFreePreview ? (
                          <>
                            Upgrade to <span className="font-semibold text-stone-600 dark:text-stone-300">Pro</span> to use{' '}
                            <span className="font-semibold text-stone-600 dark:text-stone-300">Apply WriteScholar revision</span>{' '}
                            and insert edits into your draft in one click.
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-stone-600 dark:text-stone-300">Apply WriteScholar revision</span>{' '}
                            runs once per sentence and saves the result; re-applying after{' '}
                            <span className="font-semibold text-stone-600 dark:text-stone-300">Revert back to normal</span> uses the
                            same wording (no extra AI call). Needs improvement &amp; serious concerns only.
                          </>
                        )}
                      </p>
                    )}
                    {/* Strong Points */}
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-xl">
                        {getAnnotationIcon('strong')}
                      </div>
                      <h4 className="font-semibold text-green-800">Strong Points ({getFilteredAnnotations('strong').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {getFilteredAnnotations('strong').map((annotation) => (
                          <div
                            key={annotation.id}
                            id={`annotation-panel-${annotation.id}`}
                            className={`bg-white rounded-xl p-4 border-l-4 border-green-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-violet-500' : ''
                            }`}
                            onClick={() => scrollDocumentToHighlight(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* During activation tour, Serious Concerns (red) is shown above Areas to Improve (amber) so step 1 is first in the list. */}
                    <div className="flex flex-col">
                    {/* Areas to Improve */}
                    <div className={isActivationTutorial ? 'order-2' : undefined}>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-xl">
                          {getAnnotationIcon('improve')}
                        </div>
                        <h4 className="font-semibold text-amber-800">Areas to Improve ({getFilteredAnnotations('improve').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {getFilteredAnnotations('improve').map((annotation) => (
                          <div
                            key={annotation.id}
                            id={`annotation-panel-${annotation.id}`}
                            data-activation-rewrite-focus={
                              annotation.id === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID ? 'improve' : undefined
                            }
                            className={`bg-white rounded-xl p-4 border-l-4 border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-violet-500' : ''
                            } ${activationTourShouldGlowCard(annotation) ? 'activation-tour-rewrite-card-glow' : ''}`}
                            onClick={() => scrollDocumentToHighlight(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                            {canApplyWriteScholarRevisions &&
                              !annotation.isCoverageOnly &&
                              (!isActivationTutorial || ACTIVATION_TUTORIAL_APPLYABLE_IDS.includes(annotation.id)) &&
                              (isWriteScholarRevisionAppliedOnCard(annotation) ? (
                                !activationHideRevertOnTourRewrite ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      revertWriteScholarRevisionForAnnotation(annotation.id);
                                    }}
                                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-900/15 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                      />
                                    </svg>
                                    Revert back to normal
                                  </button>
                                ) : null
                              ) : (
                                <button
                                  type="button"
                                  disabled={applyingRevisionId === annotation.id}
                                  data-activation-rewrite-apply-target={
                                    annotation.id === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID ? 'improve' : undefined
                                  }
                                  data-activation-focus={
                                    isActivationTutorial &&
                                    activationCoachStep === 'rewriteImprove' &&
                                    !activationImproveDone &&
                                    annotation.id === ACTIVATION_TUTORIAL_IMPROVE_REVISION_ID
                                      ? true
                                      : undefined
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void applyWriteScholarRevision(annotation.id);
                                  }}
                                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-700 hover:bg-violet-800 disabled:opacity-60 disabled:pointer-events-none text-white shadow-sm ring-1 ring-violet-900/10 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  {applyingRevisionId === annotation.id ? 'Generating revision…' : 'Apply WriteScholar revision'}
                                </button>
                              ))}
                            {lockedFeatures.includes('apply_revisions') && !isFreePreview && !annotation.isCoverageOnly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate?.('pricing');
                                }}
                                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-600"
                              >
                                Pro: apply revisions ($19.99/mo)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Serious Concerns */}
                    <div className={isActivationTutorial ? 'order-1' : undefined}>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-xl">
                          {getAnnotationIcon('concern')}
                        </div>
                        <h4 className="font-semibold text-red-800">Serious Concerns ({getFilteredAnnotations('concern').length})</h4>
                      </div>
                      <div className="space-y-2">
                        {getFilteredAnnotations('concern').map((annotation) => (
                          <div
                            key={annotation.id}
                            id={`annotation-panel-${annotation.id}`}
                            data-activation-rewrite-focus={
                              annotation.id === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID ? 'concern' : undefined
                            }
                            className={`bg-white rounded-xl p-4 border-l-4 border-red-400 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                              selectedAnnotation === annotation.id ? 'ring-2 ring-violet-500' : ''
                            } ${activationTourShouldGlowCard(annotation) ? 'activation-tour-rewrite-card-glow' : ''}`}
                            onClick={() => scrollDocumentToHighlight(annotation.id)}
                            onMouseEnter={() => setHoveredAnnotation(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotation(null)}
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">{annotation.comment}</p>
                            {annotation.suggestion && (
                              <p className="text-xs text-gray-500 italic">{annotation.suggestion}</p>
                            )}
                            {canApplyWriteScholarRevisions &&
                              !annotation.isCoverageOnly &&
                              (!isActivationTutorial || ACTIVATION_TUTORIAL_APPLYABLE_IDS.includes(annotation.id)) &&
                              (isWriteScholarRevisionAppliedOnCard(annotation) ? (
                                !activationHideRevertOnTourRewrite ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      revertWriteScholarRevisionForAnnotation(annotation.id);
                                    }}
                                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-900/15 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                      />
                                    </svg>
                                    Revert back to normal
                                  </button>
                                ) : null
                              ) : (
                                <button
                                  type="button"
                                  disabled={applyingRevisionId === annotation.id}
                                  data-activation-rewrite-apply-target={
                                    annotation.id === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID ? 'concern' : undefined
                                  }
                                  data-activation-focus={
                                    isActivationTutorial &&
                                    activationCoachStep === 'rewriteConcern' &&
                                    !activationConcernDone &&
                                    annotation.id === ACTIVATION_TUTORIAL_CONCERN_REVISION_ID
                                      ? true
                                      : undefined
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void applyWriteScholarRevision(annotation.id);
                                  }}
                                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-700 hover:bg-violet-800 disabled:opacity-60 disabled:pointer-events-none text-white shadow-sm ring-1 ring-violet-900/10 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  {applyingRevisionId === annotation.id ? 'Generating revision…' : 'Apply WriteScholar revision'}
                                </button>
                              ))}
                            {lockedFeatures.includes('apply_revisions') && !isFreePreview && !annotation.isCoverageOnly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate?.('pricing');
                                }}
                                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-600"
                              >
                                Pro: apply revisions ($19.99/mo)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    </div>
                    </>
                    )}

                    {/* Locked annotations teaser — show free users what they're missing (annotations beyond 40%) */}
                    {isFreePreview && lockedAnnotationsForTeaser.length > 0 && (
                      <div className="mt-6 pt-5 border-t-2 border-dashed border-violet-200/80 dark:border-violet-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <h4 className="font-bold text-stone-900 dark:text-stone-100">
                            +{lockedAnnotationsForTeaser.length} more annotations locked
                          </h4>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                          Your paper has more feedback waiting. Here&apos;s a preview of what you&apos;ll unlock:
                        </p>
                        <div className="space-y-2">
                          {lockedAnnotationsForTeaser.slice(0, 4).map((annotation) => {
                            const borderColor = {
                              strong: 'border-green-400',
                              improve: 'border-amber-400',
                              concern: 'border-red-400',
                            }[annotation.type];
                            const iconBg = {
                              strong: 'bg-green-100 dark:bg-green-900/40',
                              improve: 'bg-amber-100 dark:bg-amber-900/40',
                              concern: 'bg-red-100 dark:bg-red-900/40',
                            }[annotation.type];
                            return (
                              <div
                                key={annotation.id}
                                className={`relative rounded-xl p-3 border-l-4 ${borderColor} bg-white/80 dark:bg-stone-800/60 shadow-sm overflow-hidden`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`flex shrink-0 items-center justify-center w-6 h-6 rounded-lg ${iconBg}`}>
                                    {getAnnotationIcon(annotation.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300 blur-[5px] select-none pointer-events-none" aria-hidden>
                                      {annotation.comment.slice(0, 60)}...
                                    </p>
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-white/60 dark:via-stone-900/20 dark:to-stone-900/60" />
                              </div>
                            );
                          })}
                          {lockedAnnotationsForTeaser.length > 4 && (
                            <p className="text-xs text-center text-stone-500 dark:text-stone-400 py-2">
                              +{lockedAnnotationsForTeaser.length - 4} more feedback points…
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={startProMonthlyCheckout}
                          disabled={checkoutRedirecting}
                          className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.01] hover:from-violet-500 hover:to-violet-600 hover:shadow-violet-500/35 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                        >
                          {checkoutRedirecting
                            ? 'Opening checkout…'
                            : canStartFreeTrial
                              ? `Unlock all ${lockedAnnotationsForTeaser.length} — start free trial`
                              : `Unlock all ${lockedAnnotationsForTeaser.length} annotations`}
                        </button>
                      </div>
                    )}

                    {/* Free: fake sidebar only when we are not showing the real ~40% preview */}
                    {lockedFeatures.includes('full_annotations') && !isFreePreview && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Annotations
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            Colors in your essay match these groups. On Pro, each card shows your real comment and concrete rewrite ideas—click a card to jump to the highlighted sentence.
                          </p>
                        </div>
                        {(
                          [
                            { type: 'strong' as const, label: 'Strong points', border: 'border-green-400', iconBg: 'bg-green-100', heading: 'text-green-800 dark:text-green-200' },
                            { type: 'improve' as const, label: 'Areas to improve', border: 'border-amber-400', iconBg: 'bg-amber-100', heading: 'text-amber-800 dark:text-amber-200' },
                            { type: 'concern' as const, label: 'Serious concerns', border: 'border-red-400', iconBg: 'bg-red-100', heading: 'text-red-800 dark:text-red-200' },
                          ] as const
                        ).map((group) => (
                          <div key={group.type}>
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${group.iconBg}`}>
                                {getAnnotationIcon(group.type)}
                              </div>
                              <h4 className={`font-semibold text-sm ${group.heading}`}>{group.label}</h4>
                            </div>
                            <div className="space-y-2">
                              {[0, 1].map((i) => (
                                <div
                                  key={i}
                                  className={`relative rounded-xl p-4 border-l-4 ${group.border} bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden`}
                                >
                                  <div className="pointer-events-none select-none space-y-2 text-sm text-gray-700 blur-[8px] opacity-[0.68] contrast-[0.92] dark:text-gray-300 dark:opacity-[0.62] sm:blur-[9px]" aria-hidden>
                                    <p className="font-medium">Professor-style feedback for a highlighted sentence in your draft.</p>
                                    <p className="text-xs italic text-gray-500">Specific rewrite or example would appear here on Pro.</p>
                                  </div>
                                  <div className="absolute bottom-2 right-2 rounded-full border border-violet-200/90 bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600 shadow-sm backdrop-blur-sm dark:border-violet-600/50 dark:bg-stone-900/85 dark:text-violet-300">
                                    Pro
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={startProMonthlyCheckout}
                            disabled={checkoutRedirecting}
                            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-wait text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 text-sm"
                          >
                            {checkoutRedirecting ? 'Opening checkout…' : 'Unlock full annotations'}
                          </button>
                          <div className="text-sm text-violet-600 dark:text-violet-400">$19.99/mo</div>
                        </div>
                      </div>
                    )}

                    {/* Clarity & top suggestions — below annotations */}
                    {(analysisSummary.clarity_rating || analysisSummary.top_suggestions.length > 0) && (
                      <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800">
                        {analysisSummary.clarity_rating && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                            Clarity: <span className="font-semibold text-stone-800 dark:text-stone-200">{analysisSummary.clarity_rating}</span>
                          </p>
                        )}
                        {analysisSummary.top_suggestions.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">Top suggestions</p>
                            {lockedFeatures.includes('full_annotations') ? (
                              <div className="space-y-2">
                                <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400">
                                  <li>{analysisSummary.top_suggestions[0]}</li>
                                </ul>
                                {analysisSummary.top_suggestions.length > 1 && (
                                  <FreeAnalysisProBlur
                                    dense
                                    onUpgrade={startProMonthlyCheckout}
                                    upgradeDisabled={checkoutRedirecting}
                                    headline="Don't leave easy points on the table"
                                    primaryLabel={
                                      checkoutRedirecting
                                        ? 'Opening checkout…'
                                        : canStartFreeTrial
                                          ? 'See every fix — start 7-day free trial'
                                          : 'Upgrade to Pro — see every fix'
                                    }
                                    sublabel={
                                      canStartFreeTrial
                                        ? 'Full list + the rest of your analysis. One free trial per account; cancel anytime.'
                                        : 'Upgrade to Pro for the full list and the rest of your analysis.'
                                    }
                                  >
                                    <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-0.5">
                                      {analysisSummary.top_suggestions.slice(1).map((s, i) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </FreeAnalysisProBlur>
                                )}
                              </div>
                            ) : (
                              <ul className="list-disc list-inside text-sm text-stone-600 dark:text-stone-400 space-y-0.5">
                                {analysisSummary.top_suggestions.slice(0, 3).map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Specific rewrites — Pro only (not shown on free ~40% preview) */}
                    {currentPlan !== 'free' && specificRewrites && specificRewrites.length > 0 && (
                      <div className="mt-6 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-600">
                        <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Rewrite Suggestions</h4>
                        <div className="space-y-3">
                          {specificRewrites.map((rw, i) => (
                            <div key={i} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-700/50 space-y-1">
                              <p className="text-xs text-stone-500 dark:text-stone-400">Original: &quot;{rw.original}&quot;</p>
                              <p className="text-sm text-emerald-700 dark:text-emerald-400">→ {rw.rewritten}</p>
                              <p className="text-xs text-stone-600 dark:text-stone-400 italic">{rw.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentPlan !== 'free' &&
                      lockedFeatures.includes('specific_rewrites') &&
                      (!specificRewrites || specificRewrites.length === 0) && (
                      <div className="mt-6 p-5 bg-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 border-2 border-violet-200 dark:border-violet-600/40 rounded-2xl">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-violet-800 dark:text-violet-200">Unlock rewrite suggestions with Pro</h4>
                            <p className="text-sm text-violet-700 dark:text-violet-300 mt-0.5">Get 3-5 specific sentence rewrites that improve your grade</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={startProMonthlyCheckout}
                                disabled={checkoutRedirecting}
                                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg font-medium transition-colors"
                              >
                                {checkoutRedirecting ? 'Opening checkout…' : 'Upgrade'}
                              </button>
                              <span className="text-sm text-violet-600">$19.99/mo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Full Analysis Result — free users: full content visible, but text beyond 40% is blurred inline */}
            {analysisResult && (
              <div className="mx-6 mt-8 mb-6 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-600 overflow-hidden">
                <div className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">Comprehensive Academic Analysis</h2>
                  <p className="text-violet-100 text-sm mt-0.5">
                    {currentPlan === 'free'
                      ? 'Full analysis structure shown below — unlock all text to read every insight'
                      : 'Full analysis report'}
                  </p>
                </div>
                <div className="p-6 prose pviolet-stone dark:pviolet-invert max-w-none">
                  {currentPlan === 'free' ? (
                    <div className="text-sm leading-relaxed">
                      {/* Readable portion (first 40%) */}
                      <div
                        className="prose pviolet-sm dark:pviolet-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeAnalysisHtml(simpleMarkdownToHtml(freeComprehensiveAnalysisPreviewMd)),
                        }}
                      />
                      {freeComprehensiveAnalysisHasLockedRemainder && (
                        <>
                          {/* Inline upgrade banner */}
                          <div className="my-6 relative overflow-hidden rounded-xl border-2 border-dashed border-violet-300/80 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/80 dark:border-violet-600/50 dark:from-violet-950/30 dark:via-stone-900 dark:to-violet-950/30">
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 px-4 py-4">
                              <svg className="w-5 h-5 text-violet-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                                  {Math.round((1 - (freeComprehensiveAnalysisPreviewMd.length / analysisResult.length)) * 100)}% more analysis below
                                </p>
                                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                                  The structure is visible — unlock to read the full breakdown
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={startProMonthlyCheckout}
                                disabled={checkoutRedirecting}
                                className="shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-violet-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                              >
                                {checkoutRedirecting ? 'Opening…' : canStartFreeTrial ? 'Unlock — free trial' : 'Unlock full analysis'}
                              </button>
                            </div>
                          </div>
                          {/* Blurred remainder (full text visible but unreadable) */}
                          <div className="relative select-none">
                            <div
                              className="prose pviolet-sm dark:pviolet-invert max-w-none text-sm blur-[6px] opacity-70 [transform:translateZ(0)] pointer-events-none"
                              aria-hidden="true"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeAnalysisHtml(simpleMarkdownToHtml(freeComprehensiveLockedRemainderMd)),
                              }}
                            />
                            {/* Floating CTA overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/20 via-white/60 to-white/90 dark:from-stone-800/20 dark:via-stone-800/60 dark:to-stone-800/90">
                              <div className="text-center px-4 py-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/90 bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 shadow-sm backdrop-blur-sm dark:border-violet-600/50 dark:bg-stone-900/90 dark:text-violet-300 mb-3">
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Pro
                                </div>
                                <p className="text-base font-bold text-stone-900 dark:text-stone-50 mb-2">
                                  Your complete analysis is right here
                                </p>
                                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 max-w-sm mx-auto">
                                  {canStartFreeTrial
                                    ? 'Specific feedback on your thesis, evidence, and writing style. Start your free trial to read it all.'
                                    : 'Specific feedback on your thesis, evidence, and writing style awaits you.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={startProMonthlyCheckout}
                                  disabled={checkoutRedirecting}
                                  className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-violet-600 hover:shadow-violet-500/40 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                                >
                                  {checkoutRedirecting
                                    ? 'Opening checkout…'
                                    : canStartFreeTrial
                                      ? 'Read the full analysis — start free trial'
                                      : 'Upgrade to Pro — read full analysis'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(simpleMarkdownToHtml(analysisResult), {
                          ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'strong', 'em', 'code', 'ul', 'ol', 'li'],
                          ALLOWED_ATTR: ['class'],
                        }),
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Summary Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Word Count:</span>
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900 text-sm">{documentContent.split(' ').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Citation Style:</span>
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900 text-sm">{selectedCitationStyle}</span>
                  </div>
                </div>
                {currentPlan !== 'free' ? (
                  <button 
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Export Report
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      type="button"
                      onClick={startProMonthlyCheckout}
                      disabled={checkoutRedirecting}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-wait transition-colors shadow-md shadow-violet-600/25"
                      title="Download your full marked-up report — PDF or Word"
                    >
                      {checkoutRedirecting
                        ? 'Opening checkout…'
                        : canStartFreeTrial
                          ? 'Export full report — start free trial'
                          : 'Export full report — upgrade to Pro'}
                    </button>
                    <span className="text-sm text-stone-500">$19.99/mo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rubric Alignment Results */}
          {rubricAlignment && (
            <div className="mt-8 bg-white dark:bg-stone-800 rounded-2xl sm:rounded-3xl border border-stone-200/60 dark:border-stone-700/40 shadow-lg shadow-stone-200/50 dark:shadow-stone-900/50 overflow-hidden">
              {/* Rubric Header - matches dashboard Analyze tool style */}
              <div className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-5 shadow-lg shadow-violet-500/25">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Assignment Rubric</h2>
                    <p className="text-violet-100 text-sm mt-0.5">Compared against the rubric you uploaded</p>
                  </div>
                </div>
              </div>

              {currentPlan === 'free' ? (
                /* Free users: show ~40% of rubric content + CTA to upgrade (like document preview) */
                <div className="p-6 relative">
                  {/* Overall Assessment - truncated to ~40% */}
                  {rubricAlignment.overallAssessment && (
                    <div className="mb-6 p-4 sm:p-5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl shadow-sm">
                      <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-2">Overall Assessment</h3>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                        {rubricAlignment.overallAssessment.length > 1
                          ? rubricAlignment.overallAssessment.substring(0, Math.floor(rubricAlignment.overallAssessment.length * 0.4)) + '...'
                          : rubricAlignment.overallAssessment}
                      </p>
                    </div>
                  )}

                  {/* Score Summary */}
                  {rubricAlignment.criteria && rubricAlignment.criteria.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex-1 min-w-[100px] p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'met').length}</span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Criteria Met</p>
                      </div>
                      <div className="flex-1 min-w-[100px] p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'partially_met').length}</span>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Partially Met</p>
                      </div>
                      <div className="flex-1 min-w-[100px] p-3 bg-gradient-to-br from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-xl font-bold text-violet-700 dark:text-violet-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'not_met').length}</span>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">Not Met</p>
                      </div>
                    </div>
                  )}

                  {/* First ~40% of criteria */}
                  {rubricAlignment.criteria && rubricAlignment.criteria.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">Criterion-by-Criterion Breakdown</h3>
                      <div className="space-y-4">
                        {rubricAlignment.criteria.slice(0, Math.max(1, Math.ceil(rubricAlignment.criteria.length * 0.4))).map((criterion: any, index: number) => {
                          const statusConfig: Record<string, { bg: string; border: string; icon: string; label: string; textColor: string }> = {
                            met: { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-200/70 dark:border-emerald-700/40', icon: '✅', label: 'Met', textColor: 'text-emerald-700 dark:text-emerald-300' },
                            partially_met: { bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200/70 dark:border-amber-700/40', icon: '⚠️', label: 'Partially Met', textColor: 'text-amber-700 dark:text-amber-300' },
                            not_met: { bg: 'from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20', border: 'border-violet-200/70 dark:border-violet-700/40', icon: '❌', label: 'Not Met', textColor: 'text-violet-700 dark:text-violet-300' }
                          };
                          const config = statusConfig[criterion.status] || statusConfig.partially_met;
                          const truncatedAssessment = criterion.assessment ? criterion.assessment.substring(0, Math.floor(criterion.assessment.length * 0.4)) + '...' : criterion.assessment;
                          return (
                            <div key={index} className={`p-4 sm:p-5 bg-gradient-to-br ${config.bg} border ${config.border} rounded-2xl shadow-sm`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span>{config.icon}</span>
                                  <h4 className="font-semibold text-stone-900 dark:text-stone-100">{criterion.criterion}</h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${config.textColor} bg-white/80 dark:bg-stone-800/80`}>{config.label}</span>
                              </div>
                              <p className="text-sm text-stone-700 dark:text-stone-300">{truncatedAssessment}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay + CTA - like document preview */}
                  <div className="relative mt-6 pt-8 -mb-2">
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-stone-800 via-white/90 dark:via-stone-800/90 to-transparent pointer-events-none" style={{ marginTop: '-120px', height: '140px' }} />
                    <div className="relative p-6 bg-gradient-to-r from-violet-50 to-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-violet-600 hover:bg-violet-500 rounded-full">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12-9V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-9z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                            Don&apos;t guess what your professor wants — see the full rubric map
                          </h3>
                          <p className="text-sm text-stone-600 dark:text-stone-400">
                            {canStartFreeTrial
                              ? 'Missing quotes, weak criteria, and priority fixes—unlocked on Pro. Improve your grade with the complete breakdown; eligible accounts get one 7-day free trial.'
                              : 'Missing quotes, weak criteria, and priority fixes—upgrade to Pro for the complete rubric breakdown.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={startProMonthlyCheckout}
                        disabled={checkoutRedirecting}
                        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-wait text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/30"
                      >
                        {checkoutRedirecting
                          ? 'Opening checkout…'
                          : canStartFreeTrial
                            ? 'See the full rubric analysis — start 7-day free trial'
                            : 'Upgrade to Pro — full rubric analysis'}
                      </button>
                      <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
                        Starting at $19.99/month · Cancel anytime
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Full rubric results for paid users */
                <div className="p-6">
                  {/* Overall Assessment - dashboard card style */}
                  {rubricAlignment.overallAssessment && (
                    <div className="mb-6 p-4 sm:p-5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl shadow-sm">
                      <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-2">Overall Assessment</h3>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{rubricAlignment.overallAssessment}</p>
                    </div>
                  )}

                  {/* Score Summary - dashboard card style */}
                  {rubricAlignment.criteria && rubricAlignment.criteria.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex-1 min-w-[120px] p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'met').length}</span>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">Criteria Met</p>
                      </div>
                      <div className="flex-1 min-w-[120px] p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'partially_met').length}</span>
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1">Partially Met</p>
                      </div>
                      <div className="flex-1 min-w-[120px] p-4 bg-gradient-to-br from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl text-center shadow-sm">
                        <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">{rubricAlignment.criteria.filter((c: any) => c.status === 'not_met').length}</span>
                        <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mt-1">Not Met</p>
                      </div>
                    </div>
                  )}

                  {/* Criterion-by-Criterion Breakdown - dashboard card style */}
                  {rubricAlignment.criteria && rubricAlignment.criteria.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">Criterion-by-Criterion Breakdown</h3>
                      <div className="space-y-4">
                        {rubricAlignment.criteria.map((criterion: any, index: number) => {
                          const statusConfig = {
                            met: { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-200/70 dark:border-emerald-700/40', icon: '✅', label: 'Met', textColor: 'text-emerald-700 dark:text-emerald-300' },
                            partially_met: { bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200/70 dark:border-amber-700/40', icon: '⚠️', label: 'Partially Met', textColor: 'text-amber-700 dark:text-amber-300' },
                            not_met: { bg: 'from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20', border: 'border-violet-200/70 dark:border-violet-700/40', icon: '❌', label: 'Not Met', textColor: 'text-violet-700 dark:text-violet-300' }
                          };
                          const config = statusConfig[criterion.status as keyof typeof statusConfig] || statusConfig.partially_met;

                          return (
                            <div key={index} className={`p-4 sm:p-5 bg-gradient-to-br ${config.bg} border ${config.border} rounded-2xl shadow-sm`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span>{config.icon}</span>
                                  <h4 className="font-semibold text-stone-900 dark:text-stone-100">{criterion.criterion}</h4>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {criterion.score_estimate && criterion.score_estimate !== 'N/A' && (
                                    <span className="px-2 py-0.5 bg-white/80 dark:bg-stone-800/80 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300">{criterion.score_estimate}</span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${config.textColor} bg-white/80 dark:bg-stone-800/80`}>{config.label}</span>
                                </div>
                              </div>
                              <p className="text-sm text-stone-700 dark:text-stone-300 mb-2">{criterion.assessment}</p>
                              {criterion.evidence && criterion.evidence !== 'No relevant content found' && (
                                <div className="mb-2 p-3 bg-white/60 dark:bg-stone-800/60 rounded-xl border border-stone-200/60 dark:border-stone-600/40">
                                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">Evidence from essay:</p>
                                  <p className="text-sm text-stone-700 dark:text-stone-300 italic">"{criterion.evidence}"</p>
                                </div>
                              )}
                              {criterion.suggestions && criterion.suggestions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">Suggestions:</p>
                                  <ul className="space-y-1">
                                    {criterion.suggestions.map((suggestion: string, sIdx: number) => (
                                      <li key={sIdx} className="text-sm text-stone-600 dark:text-stone-400 flex items-start space-x-2">
                                        <span className="text-violet-500 dark:text-violet-400 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Missing Elements - dashboard card style */}
                  {rubricAlignment.missingElements && rubricAlignment.missingElements.length > 0 && (
                    <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-violet-50 to-red-50 dark:from-violet-900/20 dark:to-red-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl shadow-sm">
                      <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-3">Missing Elements</h3>
                      <p className="text-sm text-stone-700 dark:text-stone-300 mb-2">The following rubric requirements are not addressed in your essay:</p>
                      <ul className="space-y-2">
                        {rubricAlignment.missingElements.map((element: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-stone-700 dark:text-stone-300">
                            <span className="mt-0.5 text-violet-500">❌</span>
                            <span>{element}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Priority Improvements - dashboard card style */}
                  {rubricAlignment.priorityImprovements && rubricAlignment.priorityImprovements.length > 0 && (
                    <div className="p-4 sm:p-5 bg-violet-50 dark:from-violet-900/20 dark:to-violet-900/20 border border-violet-200/70 dark:border-violet-700/40 rounded-2xl shadow-sm">
                      <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-3">Priority Improvements</h3>
                      <ol className="space-y-2">
                        {rubricAlignment.priorityImprovements.map((improvement: string, index: number) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-stone-700 dark:text-stone-300">
                            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{index + 1}</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </>
        )}

        {/* Hover Tooltip - Mobile Responsive */}
        {hoveredAnnotation && analysisResult && (
          <div 
            className={`fixed pointer-events-none transition-all duration-200 ${
              activationPaperHoverSubtree ? 'z-[230]' : 'z-50'
            }`}
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: isMobileDevice() ? 'translate(0, 0)' : 'translate(-50%, -100%)'
            }}
          >
            {(() => {
              const annotation = annotations.find(a => a.id === hoveredAnnotation);
              if (!annotation) return null;
              
              const typeLabels = {
                strong: 'Strong point',
                improve: 'Needs improvement',
                concern: 'Serious concern'
              };
              
              const isLimitedTooltip = lockedFeatures.includes('full_annotations') && !isFreePreview;
              
              return (
                <div className={`relative rounded-lg px-3 py-2 shadow-xl mb-2 ${
                  isLimitedTooltip 
                    ? annotation.type === 'strong' 
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                      : annotation.type === 'improve'
                        ? 'bg-amber-500 text-white border-2 border-amber-300'
                        : 'bg-red-600 text-white border-2 border-red-400'
                    : 'bg-gray-900 text-white'
                } ${isMobileDevice() ? 'text-sm max-w-xs w-72' : 'text-xs max-w-xs'}`}>
                  <div className="font-semibold">
                    {typeLabels[annotation.type]}
                  </div>
                  {!isLimitedTooltip && (
                    <>
                      <div className={`mb-2 text-gray-200 ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>
                        "{annotation.text}"
                      </div>
                      <div className={`text-gray-100 ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>
                        {annotation.comment}
                      </div>
                      {annotation.suggestion && (
                        <div className={`mt-2 text-gray-300 italic ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>
                          💡 {annotation.suggestion}
                        </div>
                      )}
                    </>
                  )}
                  {isLimitedTooltip && (
                    <p className="text-white/90 text-xs mt-1 leading-snug">
                      {annotation.type === 'strong'
                        ? 'Upgrade to Pro to see why this sentence works well and how to build on it.'
                        : 'Upgrade to Pro for specific feedback on how to improve this sentence.'}
                    </p>
                  )}
                  {!isMobileDevice() && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className={`border-8 border-transparent ${isLimitedTooltip ? (annotation.type === 'strong' ? 'border-t-emerald-600' : annotation.type === 'improve' ? 'border-t-amber-500' : 'border-t-red-600') : 'border-t-gray-900'}`}></div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
      </div>

      {/* Compare original draft (before any WriteScholar revisions this session) */}
      {showCompareOriginalModal && originalDraftBaseline && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-original-title"
          onClick={() => setShowCompareOriginalModal(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-2xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-700">
              <h2 id="compare-original-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Compare with first draft
              </h2>
              <button
                type="button"
                onClick={() => setShowCompareOriginalModal(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Close
              </button>
            </div>
            <p className="px-5 pt-3 text-xs text-stone-500 dark:text-stone-400">
              Left: text as it was when this analysis was run. Right: your current draft;{' '}
              <span className="font-medium text-violet-700 dark:text-violet-300">purple</span> highlights what changed
              compared to the first draft (including WriteScholar revisions and any other edits).
            </p>
            <div className="grid md:grid-cols-2 gap-0 flex-1 min-h-0 border-t border-stone-200 dark:border-stone-700">
              <div className="p-4 md:p-5 overflow-y-auto max-h-[min(65vh,560px)] border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-700">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">
                  First draft (analysis)
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
                  {normalizeDraftForCompare(originalDraftBaseline)}
                </pre>
              </div>
              <div className="p-4 md:p-5 overflow-y-auto max-h-[min(65vh,560px)]">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">
                  Current draft
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
                  {compareModalCurrentDraftDiff ?? documentContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activationCoachStep !== 'off' && (
        <ActivationAnalysisCoach
          step={
            activationCoachStep as
              | 'mla'
              | 'analyze'
              | 'loading'
              | 'doc'
              | 'rubric'
              | 'rewriteConcern'
              | 'rewriteImprove'
              | 'copyText'
              | 'library'
              | 'done'
          }
          concernRevisionApplied={activationConcernDone}
          improveRevisionApplied={activationImproveDone}
          showConfetti={activationCoachStep === 'done'}
          onContinue={handleActivationCoachContinue}
          citeTargetRef={activationCitationSelectRef}
          analyzeDocTargetRef={activationAnalyzeDocBtnRef}
        />
      )}

      {showPostActivationPaywall && (
        <SoftPaywall
          hard
          variant="postTutorial"
          canStartFreeTrial={canStartFreeTrial}
          userName={
            user?.firstName?.trim() ||
            (user?.name?.trim() && !user.name.includes('@') ? user.name.trim().split(/\s+/)[0] ?? '' : '') ||
            ''
          }
          onStartTrial={() => trackEvent('paywall_start_trial')}
          onDismiss={() => {
            try {
              sessionStorage.removeItem(POST_ACTIVATION_PAYWALL_PENDING_KEY);
            } catch {
              /* ignore */
            }
            setShowPostActivationPaywall(false);
            onNavigate?.('dashboard');
          }}
          onNavigate={onNavigate}
        />
      )}

      {/* Analysis Popup Animation */}
      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          variant="analyze"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}
    </div>
  );
};

export default AnalysisPage;