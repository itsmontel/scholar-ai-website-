import { useMemo, useState, type ReactNode } from 'react';
import DOMPurify from 'dompurify';
import type { AnalyzerResult } from './AnalyzerPanel';
import { normalizeAnnotationType, type AnnotationType } from './analyzerExtension';

const RUBRIC_LABELS: Record<string, string> = {
  thesis_and_argument: 'Thesis & argument',
  response_to_question: 'Response to question',
  use_of_evidence_and_textual_support: 'Use of evidence & textual support',
  analysis_and_critical_thinking: 'Analysis & critical thinking',
  organization_and_structure: 'Organization & structure',
  writing_quality_and_clarity: 'Writing quality & clarity',
};

const SMALL_WORDS = new Set(['and', 'or', 'of', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'with', 'vs', 'at', 'by', 'as']);

const RUBRIC_CATEGORY_STYLES: Record<string, { accent: string }> = {
  thesis_and_argument: { accent: 'border-l-[#A560E8]' },
  response_to_question: { accent: 'border-l-[#FFC800]' },
  use_of_evidence_and_textual_support: { accent: 'border-l-[#58CC02]' },
  analysis_and_critical_thinking: { accent: 'border-l-[#FF9600]' },
  organization_and_structure: { accent: 'border-l-[#1CB0F6]' },
  writing_quality_and_clarity: { accent: 'border-l-[#FF4B4B]' },
};

function rubricStyleFor(category: string) {
  return RUBRIC_CATEGORY_STYLES[category.trim().toLowerCase()] ?? RUBRIC_CATEGORY_STYLES.thesis_and_argument;
}

const ACADEMIC_ITALIC_PATTERNS: RegExp[] = [
  /\b(Get Out|The Dark Knight|White Privilege|Black Panther|Hegemony|McIntosh)\b/g,
  /(?:^|[.!?]\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})(?=\.|:|\s+Dir\.|\s+Perf\.|\s+Eds\.)/g,
  /\b(et al\.|ibid\.|op\. cit\.|sic|circa|ca\.|vs\.|viz\.)\b/gi,
  /(?:^|[.]\s+)([A-Z][a-z]+(?:,\s+[A-Z][a-z]+){2,})(?=\.)/g,
];

const REVISION_MARK_CLASS =
  'bg-[#A560E8]/20 dark:bg-[#A560E8]/30 text-[#A560E8] dark:text-[#A560E8] px-0.5 rounded-sm ring-2 ring-[#A560E8]/80 dark:ring-[#A560E8]/60 shadow-sm ring-offset-1 ring-offset-white dark:ring-offset-stone-900';

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
}

function humanizeLabel(raw: string): string {
  if (!raw) return '';
  const mapped = RUBRIC_LABELS[raw.trim().toLowerCase()];
  if (mapped) return mapped;
  const words = raw
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
      if (h1) return `<h2 class="text-xl font-extrabold mt-6 mb-2 text-stone-900 dark:text-stone-100">${escape(h1[1])}</h2>`;
      const h2 = trimmed.match(/^## (.+)$/);
      if (h2) return `<h3 class="text-lg font-extrabold mt-4 mb-2 text-stone-800 dark:text-stone-200">${escape(h2[1])}</h3>`;
      const h3 = trimmed.match(/^### (.+)$/);
      if (h3) return `<h4 class="text-base font-extrabold mt-3 mb-1 text-stone-700 dark:text-stone-300">${escape(h3[1])}</h4>`;
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

/** Remove explicit score/grade lines from comprehensive markdown so free previews don't leak them. */
function stripGradeLeaksFromComprehensive(md: string): string {
  if (!md) return '';
  const gradeLine =
    /^\s*(?:\*\*)?(?:Overall Score|Grade Estimate|Clarity Rating|Estimated Grade|Letter Grade)(?:\*\*)?\s*:/i;
  return md
    .split('\n')
    .filter((line) => !gradeLine.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitSegmentByRevisionRanges(
  text: string,
  chunkGlobalStart: number,
  revisedDraftRanges: { start: number; end: number }[],
): Array<{ type: 'normal' | 'revision'; text: string }> {
  if (!text) return [];
  if (!revisedDraftRanges.length) return [{ type: 'normal', text }];
  const g0 = chunkGlobalStart;
  const g1 = g0 + text.length;
  const ivs: [number, number][] = [];
  for (const r of revisedDraftRanges) {
    if (r.start >= r.end) continue;
    const s = Math.max(g0, r.start);
    const e = Math.min(g1, r.end);
    if (s < e) ivs.push([s, e]);
  }
  if (ivs.length === 0) return [{ type: 'normal', text }];
  ivs.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ivs) {
    const last = merged[merged.length - 1];
    if (!last || s > last[1]) merged.push([s, e]);
    else last[1] = Math.max(last[1], e);
  }
  const parts: Array<{ type: 'normal' | 'revision'; text: string }> = [];
  let cursor = g0;
  for (const [s, e] of merged) {
    if (cursor < s) parts.push({ type: 'normal', text: text.slice(cursor - g0, s - g0) });
    parts.push({ type: 'revision', text: text.slice(s - g0, e - g0) });
    cursor = e;
  }
  if (cursor < g1) parts.push({ type: 'normal', text: text.slice(cursor - g0) });
  return parts.length ? parts : [{ type: 'normal', text }];
}

function renderTextWithItalics(text: string, key: string): ReactNode {
  let parts: ReactNode[] = [];
  let lastIndex = 0;
  let foundMatch = false;
  ACADEMIC_ITALIC_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index >= lastIndex) {
        foundMatch = true;
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        parts.push(<em key={`${key}-italic-${match.index}`}>{match[0]}</em>);
        lastIndex = match.index + match[0].length;
      }
    }
  });
  if (!foundMatch || lastIndex === 0) return text;
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function AnnotationIcon({ type, filled }: { type: 'strong' | 'improve' | 'concern'; filled?: boolean }) {
  if (filled) {
    if (type === 'strong') {
      return (
        <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (type === 'concern') {
      return (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type === 'strong') {
    return (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === 'concern') {
    return (
      <svg className="w-4 h-4 text-[#FF4B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

type ReportAnnotation = AnalyzerResult['annotations'][number];

export default function AnalysisReportView({
  title,
  documentText,
  result,
  revisionsLocked,
  selectedAnnotationId,
  appliedAnnotationIds,
  applyingAnnotationId,
  onSelectAnnotation,
  onApplyRevision,
  onRevertRevision,
  onEditDraft,
  onReanalyze,
  onUpgrade,
  onOpenClassicReport,
}: {
  title: string;
  documentText: string;
  result: AnalyzerResult;
  revisionsLocked: boolean;
  selectedAnnotationId?: string | null;
  appliedAnnotationIds?: Set<string>;
  applyingAnnotationId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  onApplyRevision?: (id: string) => void;
  onRevertRevision?: (id: string) => void;
  onEditDraft: () => void;
  onReanalyze?: () => void;
  onUpgrade: () => void;
  onOpenClassicReport?: () => void;
}) {
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const rawNarrative = (result.comprehensiveText || '').trim();
  const narrative = revisionsLocked ? stripGradeLeaksFromComprehensive(rawNarrative) : rawNarrative;
  const previewCut = Math.max(1, Math.floor(narrative.length * 0.5));
  const previewMd = revisionsLocked ? narrative.slice(0, previewCut) : narrative;
  const lockedMd = revisionsLocked ? narrative.slice(previewCut) : '';
  const wordCount = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;

  const isFreePreview = revisionsLocked;
  const annotations = result.annotations ?? [];
  const annotationsForRender = annotations;

  const revisedDraftRanges = useMemo(() => {
    if (!appliedAnnotationIds?.size) return [];
    return annotations
      .filter((a) => appliedAnnotationIds.has(a.id))
      .map((a) => ({ start: a.startIndex, end: a.endIndex }));
  }, [annotations, appliedAnnotationIds]);

  const firstInsight = useMemo(() => {
    if (revisionsLocked || !narrative) return '';
    const plain = narrative
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    const sentence = plain.split(/(?<=[.!?])\s+/)[0] || plain;
    return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence;
  }, [narrative, revisionsLocked]);

  const getFilteredAnnotations = (type?: 'strong' | 'improve' | 'concern') => {
    if (type) return annotationsForRender.filter((a) => a.type === type);
    return annotationsForRender;
  };

  const rubricRows = result.rubric ?? [];
  const previewKeys = ['thesis_and_argument', 'analysis_and_critical_thinking'];
  const unlockedRubric = revisionsLocked
    ? [...rubricRows].sort((a, b) => {
        const ai = previewKeys.indexOf(a.category);
        const bi = previewKeys.indexOf(b.category);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }).slice(0, 2)
    : rubricRows;
  const lockedRubric = revisionsLocked
    ? rubricRows.filter((r) => !unlockedRubric.some((u) => u.category === r.category))
    : [];

  const handleAnnotationHover = (e: React.MouseEvent, annotationId: string) => {
    setHoveredAnnotation(annotationId);
    const rect = e.currentTarget.getBoundingClientRect();
    if (isMobileDevice()) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      let x = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, rect.left));
      let y = rect.top - tooltipHeight - 10;
      if (y < 20) y = rect.bottom + 10;
      if (y + tooltipHeight > viewportHeight - 20) y = viewportHeight - tooltipHeight - 20;
      setTooltipPosition({ x, y });
    } else {
      setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  const scrollAnnotationPanelToCard = (annotationId: string) => {
    onSelectAnnotation?.(annotationId);
    requestAnimationFrame(() => {
      document.getElementById(`annotation-panel-${annotationId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const scrollDocumentToHighlight = (annotationId: string) => {
    onSelectAnnotation?.(annotationId);
    requestAnimationFrame(() => {
      document.querySelector(`[data-doc-annotation="${annotationId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const renderParagraphChunkWithRevision = (text: string, chunkGlobalStart: number, keyPrefix: string) => {
    if (!text) return null;
    const segments = splitSegmentByRevisionRanges(text, chunkGlobalStart, revisedDraftRanges);
    return (
      <>
        {segments.map((seg, i) =>
          seg.type === 'revision' ? (
            <mark key={`${keyPrefix}-r-${i}`} data-revision-draft-mark className={REVISION_MARK_CLASS} title="WriteScholar revision">
              {renderTextWithItalics(seg.text, `${keyPrefix}-r-${i}`)}
            </mark>
          ) : (
            <span key={`${keyPrefix}-n-${i}`}>{renderTextWithItalics(seg.text, `${keyPrefix}-n-${i}`)}</span>
          ),
        )}
      </>
    );
  };

  const renderHighlightedText = () => {
    if (!documentText) {
      return <div className="text-stone-700 leading-relaxed">No document content available.</div>;
    }

    const displayContent = documentText;
    const paragraphs = displayContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let searchFrom = 0;
    const paragraphStarts = paragraphs.map((paragraph) => {
      const idx = displayContent.indexOf(paragraph, searchFrom);
      const start = idx >= 0 ? idx : searchFrom;
      searchFrom = start + paragraph.length;
      return start;
    });

    const highlightClasses: Record<AnnotationType, string> = {
      strong: 'bg-[#E5F8D0]/70 text-stone-900 dark:text-stone-100 border-b-2 border-[#58CC02] hover:bg-[#E5F8D0]',
      improve: 'bg-[#FFF4E0]/80 text-stone-900 dark:text-stone-100 border-b-2 border-[#FF9600] hover:bg-[#FFF4E0]',
      concern: 'bg-[#FFE8E8]/80 text-stone-900 dark:text-stone-100 border-b-2 border-[#FF4B4B] hover:bg-[#FFE8E8]',
    };

    if (annotationsForRender.length === 0) {
      return (
        <div className="text-gray-700 leading-relaxed">
          {paragraphs.map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={index} className="mb-4 text-justify">
                {renderParagraphChunkWithRevision(paragraph, paragraphStarts[index] ?? 0, `no-anno-p-${index}`)}
              </p>
            );
          })}
        </div>
      );
    }

    const sortedAnnotations = [...annotationsForRender]
      .filter(
        (annotation) =>
          annotation.startIndex >= 0 &&
          annotation.endIndex > annotation.startIndex &&
          annotation.endIndex <= documentText.length,
      )
      .sort((a, b) => a.startIndex - b.startIndex);

    return (
      <div className="text-stone-700 leading-relaxed">
        {paragraphs.map((paragraph, paragraphIndex) => {
          const paragraphStart = paragraphStarts[paragraphIndex] ?? 0;
          const paragraphEnd = paragraphStart + paragraph.length;
          if (!paragraph.length) return null;

          const paragraphAnnotations = sortedAnnotations.filter(
            (annotation) => annotation.startIndex < paragraphEnd && annotation.endIndex > paragraphStart,
          );

          if (paragraphAnnotations.length === 0) {
            return (
              <p key={paragraphIndex} className="mb-4 text-justify">
                {renderParagraphChunkWithRevision(paragraph, paragraphStart, `p-${paragraphIndex}`)}
              </p>
            );
          }

          const parts: ReactNode[] = [];
          let lastIndex = 0;

          paragraphAnnotations.forEach((annotation) => {
            const annotationStart = Math.max(annotation.startIndex, paragraphStart);
            const annotationEnd = Math.min(annotation.endIndex, paragraphEnd);
            let relativeStart = Math.max(0, annotationStart - paragraphStart);
            const relativeEnd = Math.min(paragraph.length, annotationEnd - paragraphStart);
            if (relativeEnd <= lastIndex) return;
            if (relativeStart < lastIndex) relativeStart = lastIndex;

            if (relativeStart > lastIndex) {
              const textBefore = paragraph.slice(lastIndex, relativeStart);
              if (textBefore.length > 0) {
                parts.push(
                  <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-stone-700">
                    {renderParagraphChunkWithRevision(textBefore, paragraphStart + lastIndex, `text-${paragraphIndex}-${lastIndex}`)}
                  </span>,
                );
              }
            }

            const actualText = paragraph.slice(relativeStart, relativeEnd);
            const annoType = normalizeAnnotationType(annotation.type);
            const annoSegments = splitSegmentByRevisionRanges(actualText, annotationStart, revisedDraftRanges);

            parts.push(
              <span
                key={`${annotation.id}-p${paragraphIndex}`}
                data-doc-annotation={annotation.id}
                className={`inline px-0.5 cursor-pointer transition-all duration-200 ${
                  selectedAnnotationId === annotation.id ? 'ring-2 ring-offset-2 ring-[#A560E8] rounded-sm' : ''
                }`}
                onMouseEnter={(e) => handleAnnotationHover(e, annotation.id)}
                onMouseLeave={() => setHoveredAnnotation(null)}
                onClick={() => scrollAnnotationPanelToCard(annotation.id)}
                title={isFreePreview ? 'Unlock this comment on Pro' : `${annoType.toUpperCase()}: ${annotation.comment || ''}`}
              >
                {annoSegments.map((seg, si) =>
                  seg.type === 'revision' ? (
                    <mark key={`${annotation.id}-seg-${si}`} data-revision-draft-mark className={REVISION_MARK_CLASS} title="WriteScholar revision">
                      {renderTextWithItalics(seg.text, `anno-${annotation.id}-r${si}`)}
                    </mark>
                  ) : (
                    <span key={`${annotation.id}-seg-${si}`} className={`${highlightClasses[annoType]} px-0.5 rounded-sm`}>
                      {renderTextWithItalics(seg.text, `anno-${annotation.id}-n${si}`)}
                    </span>
                  ),
                )}
              </span>,
            );
            lastIndex = relativeEnd;
          });

          if (lastIndex < paragraph.length) {
            const remainingText = paragraph.slice(lastIndex);
            if (remainingText.length > 0) {
              parts.push(
                <span key={`text-${paragraphIndex}-${lastIndex}`} className="text-gray-700">
                  {renderParagraphChunkWithRevision(remainingText, paragraphStart + lastIndex, `text-${paragraphIndex}-${lastIndex}`)}
                </span>,
              );
            }
          }

          return (
            <p key={paragraphIndex} className="mb-4 text-justify">{parts}</p>
          );
        })}
      </div>
    );
  };

  const hoveredAnnotationData = hoveredAnnotation ? annotations.find((a) => a.id === hoveredAnnotation) : null;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 pb-14 text-[90%]">
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 lg:-mx-8 mb-5 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A560E8]">Read-only report</p>
            <h2
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 truncate"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {title || 'Essay analysis'}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onReanalyze && (
              <button
                type="button"
                onClick={onReanalyze}
                className="inline-flex items-center px-3 h-10 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50"
              >
                Re-analyze
              </button>
            )}
            <button
              type="button"
              onClick={onEditDraft}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[13px] font-extrabold border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
            >
              Edit this draft
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white px-4 sm:px-6 py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">Estimated Academic Assessment</p>
          {revisionsLocked ? (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onUpgrade}
                className="rounded-xl bg-[#FFC800] hover:bg-[#F0BC00] border-2 border-b-4 border-[#D4A300] hover:border-[#C49A00] active:border-b-2 active:translate-y-0.5 px-4 py-3 text-left transition-all shadow-[0_8px_24px_-8px_rgba(255,200,0,0.55)]"
              >
                <p className="text-base font-extrabold leading-snug text-[#5A4500]">Unlock your estimated grade</p>
                <p className="mt-1 text-xs font-bold text-[#6B5200]/90 leading-snug">
                  Pro shows your letter grade and /100 score — the same rubric professors use.
                </p>
              </button>
              <p className="text-xs font-semibold text-white/75 max-w-sm leading-snug">
                An AI estimate of how a professor might grade this — use it to squeeze out every point before you submit.
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-5">
              {result.gradeEstimate && (
                <div>
                  <p className="text-4xl sm:text-[2.75rem] font-extrabold leading-none">{result.gradeEstimate}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/70">Estimated grade</p>
                </div>
              )}
              {typeof result.overallScore === 'number' && (
                <div>
                  <p className="text-3xl font-extrabold tabular-nums leading-none">
                    {Math.round(result.overallScore)}
                    <span className="text-sm text-white/70">/100</span>
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/70">Estimated score</p>
                </div>
              )}
            </div>
          )}
          {firstInsight && <p className="mt-4 max-w-3xl text-[15px] font-semibold leading-relaxed text-white/95">{firstInsight}</p>}
          <p className="mt-3 text-[11px] font-bold text-white/65 leading-snug">
            WriteScholar&apos;s grade is an AI estimate to guide revision — not your official grade.
          </p>
        </div>

        {rubricRows.length > 0 && (
          <div className="p-5 sm:p-7 border-b-2 border-stone-100 dark:border-stone-800">
            <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-stone-500 mb-4">Rubric breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unlockedRubric.map((r) => {
                const style = rubricStyleFor(r.category);
                return (
                  <div
                    key={r.category}
                    className={`rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 border-l-4 ${style.accent} bg-white dark:bg-stone-900/80 p-4`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[13px] font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{humanizeLabel(r.category)}</span>
                      {typeof r.score === 'number' && (
                        <span className="tabular-nums text-[13px] font-extrabold text-stone-500 dark:text-stone-400 shrink-0">
                          {r.score}/{r.maxScore || 100}
                        </span>
                      )}
                    </div>
                    {r.feedback && (
                      <p className="text-[12.5px] font-medium text-stone-600 dark:text-stone-300 leading-snug">{r.feedback}</p>
                    )}
                  </div>
                );
              })}
              {lockedRubric.map((r) => {
                const style = rubricStyleFor(r.category);
                return (
                  <div
                    key={r.category}
                    className={`rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 border-l-4 ${style.accent} bg-white dark:bg-stone-900/80 p-4`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[13px] font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{humanizeLabel(r.category)}</span>
                      <span className="tabular-nums text-[13px] font-extrabold text-stone-400 shrink-0">?/{r.maxScore || 100}</span>
                    </div>
                    <div className="relative min-h-[3.5rem] overflow-hidden rounded-lg">
                      <p className="text-[12px] text-stone-500 blur-[6px] select-none" aria-hidden>
                        {r.feedback || 'Personalized feedback for this category unlocks on Pro.'}
                      </p>
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-stone-900/90 dark:via-stone-900/50">
                        <span className="rounded-full border-2 border-[#A560E8] bg-[#F3EAFF] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#A560E8] dark:border-[#8A48C7] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]">Pro</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="mt-2 w-full rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] px-3 py-2 text-[11px] font-extrabold text-white border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
                    >
                      Unlock {humanizeLabel(r.category)}
                    </button>
                  </div>
                );
              })}
            </div>
            {lockedRubric.length > 0 && (
              <button
                type="button"
                onClick={onUpgrade}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[13px] font-extrabold border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
              >
                Unlock remaining {lockedRubric.length} categories
              </button>
            )}
          </div>
        )}

        <div className="border-b-2 border-stone-100 dark:border-stone-800" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          <div className="bg-stone-50 dark:bg-stone-800/40 px-5 sm:px-6 py-4 border-b-2 border-[#E5E5E5] dark:border-stone-700">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-stone-600 dark:text-stone-300 font-bold text-xs">Strong sections</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full" />
                <span className="text-stone-600 dark:text-stone-300 font-bold text-xs">Needs improvement</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#FF4B4B] rounded-full" />
                <span className="text-stone-600 dark:text-stone-300 font-bold text-xs">Needs revision</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:h-[540px]">
            <div className="flex-1 p-3.5 md:p-5 overflow-y-auto bg-white dark:bg-stone-950">
              {renderHighlightedText()}
            </div>

            <div className="w-full md:w-96 bg-stone-50 dark:bg-stone-900/80 border-t-2 md:border-t-0 md:border-l-2 border-[#E5E5E5] dark:border-stone-700 overflow-y-auto max-h-[400px] md:max-h-none">
              <div className="p-5 md:p-6 space-y-6">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Annotations
                </h3>
                {isFreePreview && (
                  <div className="rounded-xl border-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/10 dark:border-[#8A48C7]/40 px-3 py-2.5">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-snug">Colors on the full paper · comments on Pro</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                      Hover a highlight on the left to upgrade. Comments, suggested fixes, and apply-revision stay locked until Pro.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="mt-2.5 w-full rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] px-3 py-2 text-[12px] font-extrabold text-white border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
                    >
                      Unlock all comments
                    </button>
                  </div>
                )}

                <div className="relative">
                  <div className={isFreePreview ? 'blur-[6px] select-none pointer-events-none' : undefined} aria-hidden={isFreePreview || undefined}>
                    {([
                      { type: 'strong' as const, title: 'Strong Points', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', titleClass: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-400', ring: 'ring-emerald-400' },
                      { type: 'improve' as const, title: 'Areas to Improve', iconBg: 'bg-amber-100 dark:bg-amber-900/40', titleClass: 'text-amber-700 dark:text-amber-400', border: 'border-amber-400', ring: 'ring-amber-400' },
                      { type: 'concern' as const, title: 'Serious Concerns', iconBg: 'bg-red-100 dark:bg-red-900/40', titleClass: 'text-[#FF4B4B]', border: 'border-[#FF4B4B]', ring: 'ring-[#FF4B4B]' },
                    ]).map((section) => (
                      <div key={section.type} className="mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`flex items-center justify-center w-8 h-8 ${section.iconBg} rounded-xl`}>
                            <AnnotationIcon type={section.type} />
                          </div>
                          <h4 className={`font-extrabold ${section.titleClass}`}>
                            {section.title} ({getFilteredAnnotations(section.type).length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {getFilteredAnnotations(section.type).map((annotation) => {
                            const selected = selectedAnnotationId === annotation.id;
                            const applied = appliedAnnotationIds?.has(annotation.id);
                            const applying = applyingAnnotationId === annotation.id;
                            const canApply = (annotation.type === 'improve' || annotation.type === 'concern') && !!annotation.suggestion?.trim();
                            return (
                              <div
                                key={annotation.id}
                                id={`annotation-panel-${annotation.id}`}
                                className={`bg-white dark:bg-stone-900 rounded-xl p-4 border-l-4 ${section.border} shadow-sm hover:shadow-md transition-all cursor-pointer ${selected ? `ring-2 ${section.ring}` : ''}`}
                                onClick={() => scrollDocumentToHighlight(annotation.id)}
                              >
                                <p className="text-sm text-gray-700 dark:text-stone-200 font-medium mb-1">{annotation.comment}</p>
                                {annotation.suggestion && <p className="text-xs text-gray-500 dark:text-stone-400 italic">{annotation.suggestion}</p>}
                                {canApply && onApplyRevision && (
                                  applied ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRevertRevision?.(annotation.id);
                                      }}
                                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-[#FF4B4B] hover:bg-[#E04343] text-white border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all"
                                    >
                                      Revert back to normal
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!!applying}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onApplyRevision(annotation.id);
                                      }}
                                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-60 disabled:pointer-events-none text-white border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all"
                                    >
                                      {applying ? 'Generating revision…' : 'Apply WriteScholar revision'}
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isFreePreview && annotations.length > 0 && (
                    <div className="absolute inset-0 flex items-start justify-center pt-10 bg-gradient-to-b from-stone-50/30 via-stone-50/85 to-stone-50 dark:from-stone-900/20 dark:via-stone-900/85 dark:to-stone-900">
                      <div className="mx-3 w-full rounded-2xl border-2 border-b-4 border-[#7733B5] bg-white dark:bg-stone-900 px-4 py-5 text-center shadow-[0_16px_36px_-18px_rgba(119,51,181,0.45)]">
                        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">Comments are a Pro feature</p>
                        <p className="mt-1.5 text-[12px] font-bold text-stone-500 dark:text-stone-400 leading-snug">
                          {annotations.length} notes on this paper — unlock them to see what to fix and apply revisions.
                        </p>
                        <button
                          type="button"
                          onClick={onUpgrade}
                          className="mt-3 w-full rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] px-4 py-2.5 text-[13px] font-extrabold text-white border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
                        >
                          Unlock all annotations
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {narrative && (
          <div className="p-5 sm:p-7">
            <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Comprehensive Academic Analysis
            </h3>
            <p className="text-[13px] font-semibold text-stone-500 mb-4">
              The full write-up professors-style readers asked for — what works, what to fix, and why.
            </p>
            <div className="prose prose-stone dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: sanitizeAnalysisHtml(simpleMarkdownToHtml(previewMd)) }} />
            {lockedMd && (
              <>
                <div className="my-5 flex flex-col sm:flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-[#A560E8]/45 bg-[#F3EAFF] dark:bg-[#A560E8]/10 px-4 py-4">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
                      {Math.round((lockedMd.length / narrative.length) * 100)}% more analysis below
                    </p>
                    <p className="text-[12px] font-semibold text-stone-500 mt-0.5">Unlock the rest of this report with Pro.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onUpgrade}
                    className="shrink-0 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] px-4 py-2 text-sm font-extrabold text-white border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-px transition-all"
                  >
                    Unlock full analysis
                  </button>
                </div>
                <div className="relative select-none">
                  <div
                    className="prose prose-stone dark:prose-invert max-w-none text-sm blur-[6px] opacity-60 pointer-events-none"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: sanitizeAnalysisHtml(simpleMarkdownToHtml(lockedMd)) }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/10 via-white/70 to-white dark:from-stone-900/10 dark:via-stone-900/75 dark:to-stone-900">
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] px-5 py-2.5 text-sm font-extrabold text-white border-2 border-b-4 border-[#7733B5]"
                    >
                      Upgrade to read the full report
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="px-5 sm:px-7 py-4 bg-stone-50 dark:bg-stone-800/40 border-t-2 border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] font-bold text-stone-500">{wordCount.toLocaleString()} words</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onEditDraft} className="text-[13px] font-extrabold text-[#8A48C7] hover:underline">
              Edit this draft
            </button>
            {onOpenClassicReport && (
              <button type="button" onClick={onOpenClassicReport} className="text-[12px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                Classic layout
              </button>
            )}
          </div>
        </div>
      </div>

      {hoveredAnnotationData && (
        <div
          className={`fixed transition-all duration-200 z-50 ${isFreePreview ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: isMobileDevice() ? 'translate(0, 0)' : 'translate(-50%, -100%)',
          }}
        >
          <div
            className={`relative rounded-xl px-3 py-2 shadow-xl mb-2 bg-[#3C3C3C] text-white border-2 border-b-4 border-[#2A2A2A] ${
              isMobileDevice() ? 'text-sm max-w-xs w-72' : 'text-xs max-w-xs'
            }`}
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            <div className="font-extrabold">
              {hoveredAnnotationData.type === 'strong'
                ? 'Strong point'
                : hoveredAnnotationData.type === 'improve'
                  ? 'Needs improvement'
                  : 'Serious concern'}
            </div>
            {isFreePreview ? (
              <>
                <p className={`mt-1.5 text-white/90 ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>
                  Subscribe to Pro to see this comment and how to fix it.
                </p>
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="mt-2.5 w-full rounded-xl bg-[#FFC800] hover:bg-[#F0BC00] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#5A4500] border-2 border-b-[3px] border-[#D4A300] active:border-b-2 active:translate-y-px transition-all"
                >
                  Unlock comments on Pro
                </button>
              </>
            ) : (
              <>
                <div className={`mb-2 text-gray-200 ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>&quot;{hoveredAnnotationData.text}&quot;</div>
                <div className={`text-gray-100 ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>{hoveredAnnotationData.comment}</div>
                {hoveredAnnotationData.suggestion && (
                  <div className={`mt-2 text-gray-300 italic ${isMobileDevice() ? 'text-sm' : 'text-xs'}`}>💡 {hoveredAnnotationData.suggestion}</div>
                )}
              </>
            )}
            {!isMobileDevice() && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="border-8 border-transparent border-t-[#3C3C3C]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
