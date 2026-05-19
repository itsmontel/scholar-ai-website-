import { useMemo } from 'react';
import type { AnnotatorAnnotation, AnnotationType } from './analyzerExtension';

/* ═══════════════════════════════════════════════════════════════
   AnalyzerPanel — side panel rendered next to the editor when an
   analysis result is loaded.

   Sections (top → bottom):
     • Score card        — overall_score / grade_estimate / "View
                           rubric" expandable
     • Top suggestions   — bulleted list (collapsible, default open)
     • Annotations       — three groupings (Strengths · Improve ·
                           Concerns), each card shows the matched
                           text snippet + comment + suggestion.
                           Clicking a card scrolls the editor to
                           the matched span and highlights the card.

   Designed to inherit the full height of its parent column so it
   scrolls independently from the editor (sticky behaviour handled
   by the parent layout).
   ═══════════════════════════════════════════════════════════════ */

export interface AnalyzerResult {
  annotations: (AnnotatorAnnotation & { comment: string; suggestion: string })[];
  overallScore?: number | null;
  gradeEstimate?: string | null;
  clarityRating?: number | null;
  topSuggestions?: string[];
  rubric?: Array<{ category: string; score?: number; maxScore?: number; feedback?: string }>;
}

interface AnalyzerPanelProps {
  result: AnalyzerResult | null;
  loading: boolean;
  error: string | null;
  selectedAnnotationId: string | null;
  onAnnotationClick: (id: string) => void;
  onRerun: () => void;
  onClose: () => void;
  /** Routes to the standalone /analysis report page for the same doc. */
  onOpenFullReport?: () => void;
  /** Fetches clean replacement prose + splices it into the editor. */
  onApplyRevision?: (annotationId: string) => void;
  /** Undoes an applied revision — restores the original text. */
  onRevertRevision?: (annotationId: string) => void;
  /** Annotation ids whose revision is currently applied — drives the
   *  "Revert" button + green card state. Reset when re-analyzing. */
  appliedAnnotationIds?: Set<string>;
  /** Annotation id whose revision is mid-flight (button spinner). */
  applyingAnnotationId?: string | null;
  /** Free tier — show a lock cue on Apply; the click is intercepted
   *  upstream to open the teased upgrade modal. */
  revisionsLocked?: boolean;
}

const TYPE_META: Record<AnnotationType, { label: string; chip: string; bar: string; dot: string }> = {
  strong: {
    label: 'Strong',
    chip: 'bg-[#E5F8D0] text-[#46A302] border-[#58CC02]/30',
    bar: 'bg-[#58CC02]',
    dot: 'bg-[#58CC02]',
  },
  improve: {
    label: 'Improve',
    chip: 'bg-[#FFF4E0] text-[#D97F00] border-[#FF9600]/30',
    bar: 'bg-[#FF9600]',
    dot: 'bg-[#FF9600]',
  },
  concern: {
    label: 'Concern',
    chip: 'bg-[#FFE8E8] text-[#FF4B4B] border-[#FF4B4B]/30',
    bar: 'bg-[#FF4B4B]',
    dot: 'bg-[#FF4B4B]',
  },
};

/* Rubric category keys arrive snake_cased from the model
   (thesis_and_argument, response_to_question…). Render them as
   clean prose. Known keys map to the same hand-tuned labels the
   full report uses; anything else is title-cased generically with
   connector words kept lowercase so it reads naturally. */
const RUBRIC_LABELS: Record<string, string> = {
  thesis_and_argument: 'Thesis & argument',
  response_to_question: 'Response to question',
  use_of_evidence_and_textual_support: 'Use of evidence & textual support',
  analysis_and_critical_thinking: 'Analysis & critical thinking',
  organization_and_structure: 'Organization & structure',
  writing_quality_and_clarity: 'Writing quality & clarity',
};
const SMALL_WORDS = new Set(['and', 'or', 'of', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'with', 'vs', 'at', 'by', 'as']);
function humanizeLabel(raw: string): string {
  if (!raw) return '';
  const key = raw.trim();
  const mapped = RUBRIC_LABELS[key.toLowerCase()];
  if (mapped) return mapped;
  const words = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
  return words
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function ScoreCard({
  overallScore,
  gradeEstimate,
  clarityRating,
  rubric,
  onRerun,
  loading,
  locked = false,
}: {
  overallScore?: number | null;
  gradeEstimate?: string | null;
  clarityRating?: number | null;
  rubric?: AnalyzerResult['rubric'];
  onRerun: () => void;
  loading: boolean;
  /** Free plan — show the full paid layout but mask the numbers
      (grade, /100 score, per-category rubric scores, clarity) with
      "?" so free users get a feel for the paid breakdown. */
  locked?: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">Estimated Academic Assessment</span>
          <button
            type="button"
            onClick={onRerun}
            disabled={loading}
            title="Re-run analysis"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-[10px] font-extrabold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '…' : 'Re-run'}
          </button>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          {typeof overallScore === 'number' && (
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums leading-none">
              {locked ? '?' : overallScore}
              <span className="text-xs font-extrabold text-white/75">/100</span>
            </span>
          )}
          {gradeEstimate && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFC800] text-[#6B27A3] leading-none border-2 border-b-[3px] border-[#D4A300]">
              {locked && (
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Estimated grade</span>
              )}
              <span className="text-lg font-extrabold">{locked ? '?' : gradeEstimate}</span>
            </span>
          )}
        </div>
        {(typeof overallScore === 'number' || gradeEstimate) && (
          <p className="mt-1.5 text-[10px] font-bold text-white/70 leading-snug">
            {locked
              ? 'Upgrade to Pro to reveal your estimated grade, score and full rubric.'
              : 'Estimated grade & score — an AI guide for revision, not your official grade.'}
          </p>
        )}
      </div>
      {rubric && rubric.length > 0 && (
        <div className="px-3 py-3 space-y-2">
          {rubric.map((r) => {
            const max = r.maxScore || 100;
            const pct = typeof r.score === 'number' ? Math.round((r.score / max) * 100) : 0;
            return (
              <div key={r.category}>
                <div className="flex justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  <span>{humanizeLabel(r.category)}</span>
                  {typeof r.score === 'number' && (
                    <span className="tabular-nums">{locked ? '?' : r.score}/{max}</span>
                  )}
                </div>
                {typeof r.score === 'number' && (
                  <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                    <div className="h-full rounded-full bg-[#A560E8]" style={{ width: `${pct}%` }} />
                  </div>
                )}
                {r.feedback && (
                  <p className="mt-1 text-[10px] text-stone-500 dark:text-stone-400 leading-snug">{r.feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
      {typeof clarityRating === 'number' && (
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-bold text-stone-500 dark:text-stone-400">
          Clarity rating: <span className="tabular-nums text-stone-700 dark:text-stone-200">{locked ? '?' : clarityRating}/10</span>
        </div>
      )}
    </div>
  );
}

function AnnotationCard({
  ann,
  selected,
  applied,
  applying,
  onClick,
  onApply,
  onRevert,
  locked = false,
}: {
  ann: AnalyzerResult['annotations'][number];
  selected: boolean;
  applied: boolean;
  applying: boolean;
  onClick: () => void;
  onApply?: () => void;
  onRevert?: () => void;
  locked?: boolean;
}) {
  const meta = TYPE_META[ann.type];
  // Only "improve" / "concern" cards have an Apply button — strong
  // points have no rewrite to apply.
  const canApply = !!onApply && (ann.type === 'improve' || ann.type === 'concern') && !!ann.suggestion?.trim();
  return (
    <div
      data-card-annotation-id={ann.id}
      className={`relative w-full rounded-xl border-2 ${selected ? 'border-[#A560E8] ring-2 ring-[#A560E8]/30' : applied ? 'border-[#58CC02]/40 bg-[#E5F8D0]/30 dark:bg-[#58CC02]/10' : 'border-stone-200 dark:border-stone-700'} bg-white dark:bg-stone-900 transition-all overflow-hidden`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${meta.bar}`} aria-hidden />
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left p-3 pl-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-start gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider ${meta.chip}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden />
            {meta.label}
          </span>
          {applied && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#E5F8D0] text-[#46A302] border border-[#58CC02]/30 text-[9px] font-extrabold uppercase tracking-wider">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
              Applied
            </span>
          )}
        </div>
        {ann.text && (
          <p className="text-[11px] italic text-stone-500 dark:text-stone-400 mb-1.5 line-clamp-2 leading-snug">"{ann.text}"</p>
        )}
        {(() => {
          const blurC = locked && (ann.type === 'improve' || ann.type === 'concern');
          return (
            <p
              className={`text-[12px] font-bold text-stone-800 dark:text-stone-100 leading-snug ${blurC ? 'blur-[4px] select-none' : ''}`}
              aria-hidden={blurC || undefined}
            >
              {ann.comment}
            </p>
          );
        })()}
        {ann.suggestion && (
          locked ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#8A48C7] dark:text-[#C9A0F0]">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Unlock WriteScholar's suggested fix with Pro
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
              <span className="font-extrabold text-[#A560E8]">Try:</span> {ann.suggestion}
            </p>
          )
        )}
      </button>
      {canApply && (
        <div className="px-3 pl-3.5 pb-2.5 -mt-1 flex items-center justify-end gap-1.5">
          {applied ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRevert?.(); }}
              title="Undo this revision and restore the original text"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border-2 border-b-[3px] border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v6h6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-7 3.3L3 13" />
              </svg>
              Revert
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onApply?.(); }}
              disabled={applying}
              title={locked ? 'Pro feature — see what one-click revisions do' : undefined}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border-2 border-b-[3px] active:border-b-2 active:translate-y-0.5 transition-all ${
                applying
                  ? 'bg-[#A560E8]/70 text-white border-[#7733B5] cursor-wait'
                  : 'bg-[#A560E8] hover:bg-[#8A48C7] text-white border-[#7733B5]'
              }`}
            >
              {applying ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Revising…
                </>
              ) : locked ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  Apply revision
                  <span className="ml-0.5 px-1 py-px rounded bg-white/25 text-[8px] leading-none tracking-wide">PRO</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
                  Apply revision
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyzerPanel({
  result,
  loading,
  error,
  selectedAnnotationId,
  onAnnotationClick,
  onRerun,
  onClose,
  onOpenFullReport,
  onApplyRevision,
  onRevertRevision,
  appliedAnnotationIds,
  applyingAnnotationId,
  revisionsLocked = false,
}: AnalyzerPanelProps) {
  // Group annotations by type for the three sections.
  const grouped = useMemo(() => {
    const out: Record<AnnotationType, AnalyzerResult['annotations']> = { strong: [], improve: [], concern: [] };
    if (!result) return out;
    for (const a of result.annotations) {
      if (out[a.type]) out[a.type].push(a);
    }
    return out;
  }, [result]);

  return (
    <div className="flex flex-col h-full bg-stone-50/60 dark:bg-stone-950">
      {/* Header bar — sticky over the scrollable content */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A560E8]">Feedback</p>
          <p className="text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">Professor-style analysis</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onOpenFullReport && result && (
            <button
              type="button"
              onClick={onOpenFullReport}
              title="Open full analysis report"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3EAFF] hover:bg-[#A560E8]/20 text-[#7733B5] dark:bg-[#A560E8]/15 dark:hover:bg-[#A560E8]/25 dark:text-[#C390F2] text-[10px] font-extrabold uppercase tracking-wider border border-[#A560E8]/30 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14M5 5h6v2H7v10h10v-4h2v6H5z" /></svg>
              Full report
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback panel"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Re-analyze toast — shown ONLY while a re-analysis is in
          flight on top of an already-loaded result. The empty-state
          loading skeleton handles the first-ever analysis case. */}
      {loading && result && (
        <div className="sticky top-[57px] z-10 mx-3 mt-2 mb-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#A560E8]/95 to-[#7733B5]/95 text-white shadow-[0_8px_22px_-8px_rgba(165,96,232,0.55)] flex items-center gap-2 ws-toast-in">
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Re-analyzing your draft…</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {/* Loading state — show skeleton so the panel doesn't pop */}
        {loading && !result && (
          <div className="space-y-3">
            <div className="h-32 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-xl border-2 border-[#FF4B4B]/40 bg-[#FFE8E8] px-3 py-2.5 text-[12px] font-bold text-[#FF4B4B]">
            {error}
            <button type="button" onClick={onRerun} className="ml-2 underline font-extrabold">
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div className={loading ? 'ws-pulse-soft' : undefined}>
              <ScoreCard
                overallScore={result.overallScore}
                gradeEstimate={result.gradeEstimate}
                clarityRating={result.clarityRating}
                rubric={result.rubric}
                onRerun={onRerun}
                loading={loading}
                locked={revisionsLocked}
              />
            </div>

            {result.topSuggestions && result.topSuggestions.length > 0 && (
              <div className="rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A560E8] mb-2">Top suggestions</p>
                <ul className="space-y-1.5">
                  {(revisionsLocked ? result.topSuggestions.slice(0, 3) : result.topSuggestions).map((s, i) => (
                    <li key={i} className="flex gap-2 text-[12px] font-bold text-stone-700 dark:text-stone-300 leading-snug">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-[#A560E8] text-white text-[9px] font-extrabold mt-0.5" aria-hidden>
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                {revisionsLocked && result.topSuggestions.length > 3 && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#8A48C7] dark:text-[#C9A0F0]">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                    +{result.topSuggestions.length - 3} more with Pro
                  </p>
                )}
              </div>
            )}

            {/* Annotation groups */}
            {(['concern', 'improve', 'strong'] as AnnotationType[]).map((type) => {
              const list = grouped[type];
              if (!list.length) return null;
              const meta = TYPE_META[type];
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${meta.chip}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden />
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 tabular-nums">{list.length}</span>
                  </div>
                  <div className="space-y-2">
                    {list.map((ann) => (
                      <AnnotationCard
                        key={ann.id}
                        ann={ann}
                        selected={ann.id === selectedAnnotationId}
                        applied={appliedAnnotationIds?.has(ann.id) ?? false}
                        applying={applyingAnnotationId === ann.id}
                        onClick={() => onAnnotationClick(ann.id)}
                        onApply={onApplyRevision ? () => onApplyRevision(ann.id) : undefined}
                        onRevert={onRevertRevision ? () => onRevertRevision(ann.id) : undefined}
                        locked={revisionsLocked}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {result.annotations.length === 0 && (
              <div className="text-center py-8 text-[12px] text-stone-500 dark:text-stone-400">
                No specific annotations on this draft.
              </div>
            )}
          </>
        )}

        {/* Empty initial state */}
        {!loading && !error && !result && (
          <div className="text-center py-12 px-2">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-[#F3EAFF] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#A560E8]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <p className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Run an analysis</p>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 mb-4">Click <span className="font-extrabold text-[#A560E8]">Analyze</span> in the editor toolbar to see professor-style feedback here.</p>
          </div>
        )}
      </div>

      {/* Locally-scoped animations — keeps the polish self-contained
          rather than polluting the global stylesheet. */}
      <style>{`
        @keyframes wsToastIn {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.97); }
          60%  { opacity: 1; transform: translateY(0)    scale(1.02); }
          100% { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .ws-toast-in { animation: wsToastIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes wsPulseSoft {
          0%, 100% { box-shadow: 0 0 0 0 rgba(165, 96, 232, 0); }
          50%      { box-shadow: 0 0 0 6px rgba(165, 96, 232, 0.15); }
        }
        .ws-pulse-soft { border-radius: 16px; animation: wsPulseSoft 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
