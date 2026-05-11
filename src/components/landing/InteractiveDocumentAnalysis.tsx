import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  DEMO_PAPERS,
  type DemoAnnotation,
  type DemoPaper,
} from '../../data/landingPageDemoAnalysis';

/** Matches AnalysisPage revision marks (purple until revert). Inline flow — not inline-block — so words are not split awkwardly at line breaks. */
const REVISION_MARK_CLASS =
  'bg-[#F3EAFF] dark:bg-[#A560E8]/30 text-[#3C3C3C] dark:text-white px-0.5 rounded-sm ring-2 ring-[#A560E8] dark:ring-[#A560E8]/60 ring-offset-1 ring-offset-white dark:ring-offset-[#3C3C3C] [box-decoration-break:clone]';

/** Landing hero: hero “Full interactive demo” CTA scrolls here and focuses the feedback column */
export const LANDING_DEMO_FOCUS_FEEDBACK_EVENT = 'writescholar:landing-demo-focus-feedback';

/** Demo never applies revisions in-page — keeps highlights static. */
const EMPTY_APPLIED_IDS = new Set<string>();

interface LandingDemoDisplay {
  displayContent: string;
  paragraphRanges: { start: number; end: number; text: string }[];
  hlSpans: { start: number; end: number; annotation: DemoAnnotation }[];
  revRanges: { start: number; end: number; annId: string }[];
}

/**
 * Stable [start,end) per annotation in the original essay — avoids matching the wrong
 * duplicate substring when the same phrase appears twice.
 */
function computeAnchorMap(content: string, annotations: DemoAnnotation[]): Map<string, { start: number; end: number }> {
  const map = new Map<string, { start: number; end: number }>();
  const used: Array<{ start: number; end: number }> = [];

  const sorted = [...annotations].sort(
    (a, b) => content.indexOf(a.text) - content.indexOf(b.text)
  );

  for (const ann of sorted) {
    let from = 0;
    while (from <= content.length) {
      const idx = content.indexOf(ann.text, from);
      if (idx < 0) break;
      const end = idx + ann.text.length;
      const overlaps = used.some((u) => !(end <= u.start || idx >= u.end));
      if (!overlaps) {
        map.set(ann.id, { start: idx, end });
        used.push({ start: idx, end });
        break;
      }
      from = idx + 1;
    }
  }
  return map;
}

/** Prefer match near the original analysis anchor (after other edits shifted indices). */
function findTextInWork(work: string, text: string, hintStart: number): number {
  const radius = 160;
  const lo = Math.max(0, hintStart - radius);
  const hi = Math.min(work.length, hintStart + text.length + radius);
  const local = work.slice(lo, hi).indexOf(text);
  if (local >= 0) return lo + local;
  return work.indexOf(text);
}

/**
 * Scrolls only `container` so `child` is visible — does not call scrollIntoView (which
 * also scrolls the window and hijacks the landing page scroll position).
 */
function scrollChildIntoContainer(
  container: HTMLElement,
  child: HTMLElement,
  block: 'center' | 'nearest',
  scrollBehavior: ScrollBehavior = 'smooth'
) {
  const cRect = container.getBoundingClientRect();
  const eRect = child.getBoundingClientRect();
  const childTopInContent = container.scrollTop + (eRect.top - cRect.top);
  const childH = eRect.height;

  if (block === 'center') {
    const target = childTopInContent - container.clientHeight / 2 + childH / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: scrollBehavior });
    return;
  }

  const scrollTop = container.scrollTop;
  const viewBottom = scrollTop + container.clientHeight;
  const childBottom = childTopInContent + childH;

  if (childTopInContent < scrollTop) {
    container.scrollTo({ top: Math.max(0, childTopInContent), behavior: scrollBehavior });
  } else if (childBottom > viewBottom) {
    container.scrollTo({ top: Math.max(0, childBottom - container.clientHeight), behavior: scrollBehavior });
  }
}

function buildLandingDemoDisplay(
  base: DemoPaper,
  appliedIds: ReadonlySet<string>,
  anchorMap: Map<string, { start: number; end: number }>
): LandingDemoDisplay {
  let work = base.content;
  const ops = base.annotations
    .filter((a) => appliedIds.has(a.id) && a.demoRevisedText)
    .map((a) => {
      const anchor = anchorMap.get(a.id);
      return anchor ? { a, start: anchor.start, end: anchor.end } : null;
    })
    .filter((o): o is { a: DemoAnnotation; start: number; end: number } => o != null)
    .sort((x, y) => y.start - x.start);

  for (const { a, start: origStart, end: origEnd } of ops) {
    let s = origStart;
    let e = origEnd;
    if (work.slice(s, e) !== a.text) {
      const found = findTextInWork(work, a.text, origStart);
      if (found < 0) continue;
      s = found;
      e = found + a.text.length;
      if (work.slice(s, e) !== a.text) continue;
    }
    const rep = a.demoRevisedText!;
    work = work.slice(0, s) + rep + work.slice(e);
  }

  /**
   * Recompute purple ranges from the final string only. Pushing ranges during each replace
   * (high-to-low) breaks when a later replace shifts earlier text: stale [start,end) splits
   * the revision mid-word ("In"/"Ge" plain, "t Out…" purple) and drops red/amber highlights.
   */
  const revRanges: { start: number; end: number; annId: string }[] = [];
  const appliedInDocOrder = base.annotations
    .filter((a) => appliedIds.has(a.id) && a.demoRevisedText)
    .sort((a, b) => (anchorMap.get(a.id)?.start ?? 0) - (anchorMap.get(b.id)?.start ?? 0));
  let scanFrom = 0;
  for (const ann of appliedInDocOrder) {
    const rep = ann.demoRevisedText!;
    let idx = work.indexOf(rep, scanFrom);
    if (idx < 0) {
      idx = findTextInWork(work, rep, anchorMap.get(ann.id)?.start ?? 0);
    }
    if (idx < 0 || work.slice(idx, idx + rep.length) !== rep) continue;
    revRanges.push({ start: idx, end: idx + rep.length, annId: ann.id });
    scanFrom = idx + rep.length;
  }

  const hlSpans: { start: number; end: number; annotation: DemoAnnotation }[] = [];
  for (const ann of base.annotations) {
    if (appliedIds.has(ann.id) && ann.demoRevisedText) continue;
    const anchor = anchorMap.get(ann.id);
    if (!anchor) continue;
    const idx = findTextInWork(work, ann.text, anchor.start);
    if (idx < 0 || work.slice(idx, idx + ann.text.length) !== ann.text) continue;
    const start = idx;
    const end = idx + ann.text.length;
    // Revision text must fully own its range — never draw another highlight inside it (avoids "Ge" + "t Out" splits).
    const overlapsRev = revRanges.some((r) => !(end <= r.start || start >= r.end));
    if (overlapsRev) continue;
    hlSpans.push({ start, end, annotation: ann });
  }
  hlSpans.sort((a, b) => a.start - b.start);

  const paras = work.split(/\n\n+/);
  const paragraphRanges: { start: number; end: number; text: string }[] = [];
  let searchFrom = 0;
  for (const p of paras) {
    const start = work.indexOf(p, searchFrom);
    if (start >= 0) {
      const end = start + p.length;
      paragraphRanges.push({ start, end, text: p });
      searchFrom = end;
    }
  }

  return { displayContent: work, paragraphRanges, hlSpans, revRanges };
}

function paragraphSegments(
  pStart: number,
  pEnd: number,
  work: string,
  hlSpans: LandingDemoDisplay['hlSpans'],
  revRanges: LandingDemoDisplay['revRanges'],
  annotations: DemoAnnotation[]
): Array<
  | { kind: 'plain'; text: string }
  | { kind: 'highlight'; ann: DemoAnnotation; text: string }
  | { kind: 'revision'; ann: DemoAnnotation; text: string }
> {
  type Iv = { start: number; end: number; t: 'rev' | 'hl'; ann: DemoAnnotation };
  const intervals: Iv[] = [];
  for (const r of revRanges) {
    if (r.end <= pStart || r.start >= pEnd) continue;
    const ann = annotations.find((a) => a.id === r.annId);
    if (!ann) continue;
    intervals.push({
      start: Math.max(r.start, pStart),
      end: Math.min(r.end, pEnd),
      t: 'rev',
      ann,
    });
  }
  for (const h of hlSpans) {
    if (h.end <= pStart || h.start >= pEnd) continue;
    const start = Math.max(h.start, pStart);
    const end = Math.min(h.end, pEnd);
    const overlapsRev = intervals.some((iv) => iv.t === 'rev' && !(end <= iv.start || start >= iv.end));
    if (!overlapsRev) {
      intervals.push({ start, end, t: 'hl', ann: h.annotation });
    }
  }
  intervals.sort((a, b) => a.start - b.start);

  const out: Array<
    | { kind: 'plain'; text: string }
    | { kind: 'highlight'; ann: DemoAnnotation; text: string }
    | { kind: 'revision'; ann: DemoAnnotation; text: string }
  > = [];
  let cursor = pStart;
  for (const iv of intervals) {
    if (cursor < iv.start) {
      out.push({ kind: 'plain', text: work.slice(cursor, iv.start) });
    }
    const segText = work.slice(iv.start, iv.end);
    if (iv.t === 'rev') {
      out.push({ kind: 'revision', ann: iv.ann, text: segText });
    } else {
      out.push({ kind: 'highlight', ann: iv.ann, text: segText });
    }
    cursor = iv.end;
  }
  if (cursor < pEnd) {
    out.push({ kind: 'plain', text: work.slice(cursor, pEnd) });
  }
  return out;
}

interface InteractiveDocumentAnalysisProps {
  onNavigate: (page: string) => void;
  /** When true (e.g. landing hero), show compact marketing lines inside the mock chrome */
  landingHeroEmbed?: boolean;
}

export default function InteractiveDocumentAnalysis({ onNavigate, landingHeroEmbed = false }: InteractiveDocumentAnalysisProps) {
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_PAPERS.find((p) => p.id === 'b')?.id ?? DEMO_PAPERS[0].id);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<'document' | 'feedback' | 'analysis'>('document');

  const documentPanelScrollRef = useRef<HTMLDivElement>(null);
  const feedbackPanelScrollRef = useRef<HTMLDivElement>(null);

  const demo = DEMO_PAPERS.find((d) => d.id === selectedDemoId) ?? DEMO_PAPERS[0];

  const anchorMap = useMemo(() => computeAnchorMap(demo.content, demo.annotations), [demo.content, demo.annotations]);

  const landingDisplay = useMemo(
    () => buildLandingDemoDisplay(demo, EMPTY_APPLIED_IDS, anchorMap),
    [demo, anchorMap]
  );

  const { displayContent, paragraphRanges, hlSpans, revRanges } = landingDisplay;

  const afterLayout = useCallback((fn: () => void) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }, []);

  /** Hero “Full interactive demo” CTA: open Feedback tab and select first annotation (document order). */
  useEffect(() => {
    if (!landingHeroEmbed) return;

    const handler = () => {
      setMobileTab('feedback');
      const candidates = demo.annotations.filter((a) => a.type === 'improve' || a.type === 'concern');
      const sorted = [...candidates].sort((a, b) => {
        const aa = anchorMap.get(a.id)?.start ?? 0;
        const bb = anchorMap.get(b.id)?.start ?? 0;
        return aa - bb;
      });
      const first = sorted[0];
      if (first) setSelectedAnnotation(first.id);
      window.setTimeout(() => {
        afterLayout(() => {
          const fb = feedbackPanelScrollRef.current;
          if (!fb || !first) return;
          const card = fb.querySelector<HTMLElement>(`[data-landing-feedback-card="${first.id}"]`);
          if (card) scrollChildIntoContainer(fb, card, 'nearest');
        });
      }, 120);
    };

    window.addEventListener(LANDING_DEMO_FOCUS_FEEDBACK_EVENT, handler);
    return () => window.removeEventListener(LANDING_DEMO_FOCUS_FEEDBACK_EVENT, handler);
  }, [landingHeroEmbed, demo, anchorMap, afterLayout]);

  const highlightClasses: Record<DemoAnnotation['type'], string> = {
    strong:
      'bg-[#E5F8D0] dark:bg-[#58CC02]/20 text-[#3C3C3C] dark:text-white rounded-sm px-0.5 border-b-2 border-[#58CC02] dark:border-[#46A302] hover:bg-[#d4f4b8]',
    improve:
      'bg-[#FFF4E0] dark:bg-[#FF9600]/20 text-[#3C3C3C] dark:text-white rounded-sm px-0.5 border-b-2 border-[#FF9600] dark:border-[#D97F00] hover:bg-[#ffe9c0]',
    concern:
      'bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 text-[#3C3C3C] dark:text-white rounded-sm px-0.5 border-b-2 border-[#FF4B4B] dark:border-[#E04343] hover:bg-[#ffd0d0]',
  };

  const renderHighlightedDocument = () => {
    return paragraphRanges.map((range, paraIdx) => {
      const isTitle = paraIdx === 0 && range.text === demo.title;
      const segments = paragraphSegments(range.start, range.end, displayContent, hlSpans, revRanges, demo.annotations);
      if (segments.length === 1 && segments[0].kind === 'plain') {
        return (
          <p
            key={paraIdx}
            className={`mb-3 text-[#3C3C3C] dark:text-stone-300 leading-relaxed ${isTitle ? 'text-sm sm:text-lg font-extrabold text-left' : 'text-[11px] sm:text-sm text-justify text-pretty hyphens-auto'}`}
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {range.text}
          </p>
        );
      }
      return (
        <p
          key={paraIdx}
          className={`mb-3 text-[#3C3C3C] dark:text-stone-300 leading-relaxed break-words ${isTitle ? 'text-sm sm:text-lg font-extrabold text-left' : 'text-[11px] sm:text-sm text-justify text-pretty hyphens-auto'}`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {segments.map((seg, i) => {
            if (seg.kind === 'plain') {
              return <span key={i}>{seg.text}</span>;
            }
            if (seg.kind === 'revision') {
              return (
                <mark
                  key={`${seg.ann.id}-rev-${i}`}
                  data-landing-doc-ann={seg.ann.id}
                  data-revision-draft-mark
                  className={`${REVISION_MARK_CLASS} font-medium inline motion-safe:animate-[landing-revision-fade_0.45s_ease-out]`}
                  title="WriteScholar revision (stays purple in the real editor until you revert)"
                >
                  {seg.text}
                </mark>
              );
            }
            const ann = seg.ann;
            const isSelected = selectedAnnotation === ann.id || hoveredAnnotation === ann.id;
            return (
              <span
                key={`${ann.id}-${i}`}
                data-landing-doc-ann={ann.id}
                className={`relative inline ${highlightClasses[ann.type]} px-0.5 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-[#A560E8]' : ''
                }`}
                onClick={() => setSelectedAnnotation(ann.id)}
                onMouseEnter={(e) => {
                  setHoveredAnnotation(ann.id);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => {
                  setHoveredAnnotation(null);
                  setTooltipPos(null);
                }}
              >
                {seg.text}
              </span>
            );
          })}
        </p>
      );
    });
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'strong':
        return (
          <svg className="w-5 h-5 text-[#58CC02]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'improve':
        return (
          <svg className="w-5 h-5 text-[#FF9600]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'concern':
        return (
          <svg className="w-5 h-5 text-[#FF4B4B]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const strongAnnotations = demo.annotations.filter(a => a.type === 'strong');
  const improveAnnotations = demo.annotations.filter(a => a.type === 'improve');
  const concernAnnotations = demo.annotations.filter(a => a.type === 'concern');

  const renderGradeBreakdown = () => (
    <div className="mx-4 sm:mx-6 mt-6 mb-4 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 overflow-hidden">
      <div className="bg-gradient-to-br from-[#A560E8] to-[#7733B5] text-white px-6 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>General Academic Assessment</h2>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.overallScore}/100</div>
              <div className="text-white/80 text-xs font-extrabold">Score</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.grade}</div>
              <div className="text-white/80 text-xs font-extrabold">Grade</div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-stone-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demo.rubric.map((cat) => (
            <div key={cat.name} className="p-4 rounded-2xl bg-white dark:bg-stone-700/50 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-extrabold text-[#3C3C3C] dark:text-stone-200 text-sm break-words flex-1 min-w-0" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{cat.name}</span>
                <span className="font-extrabold text-[#3C3C3C] dark:text-stone-100 text-sm flex-shrink-0">{cat.score}/{cat.maxScore}</span>
              </div>
              <p className="text-xs text-[#AFAFAF] dark:text-stone-400 break-words leading-snug">{cat.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const liveWordCount = displayContent.trim() ? displayContent.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-stone-900 min-w-0 max-w-full ${
        landingHeroEmbed
          ? 'rounded-2xl sm:rounded-3xl border-0'
          : 'rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600'
      }`}
    >
      {/* Demo selector + Header — Duolingo dark chrome */}
      {/* Sample-paper chrome bar — clean off-white "document folder"
          look with a soft purple tint, dark text, and brand-purple
          accents. Replaces the previous yellow (felt too loud) and the
          earlier deep-purple/charcoal versions. Reads like a polished
          document viewer that pairs naturally with the cream section
          background below the hero. */}
      <div className="relative bg-gradient-to-b from-white to-[#FAF5FF] dark:from-stone-900 dark:to-stone-900/95 px-3 sm:px-6 py-4 sm:py-5 border-b-2 border-[#E5E5E5] dark:border-stone-700">
        {/* Thin brand-purple accent strip at the very top edge —
            the "tab" detail that makes the chrome feel like a folder. */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#A560E8] via-[#8A48C7] to-[#A560E8]" aria-hidden />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {DEMO_PAPERS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDemoId(d.id);
                  setSelectedAnnotation(null);
                  setHoveredAnnotation(null);
                  setMobileTab('document');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedDemoId === d.id
                    ? 'bg-[#58CC02] text-white border-2 border-b-4 border-[#46A302]'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5'
                }`}
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 text-left sm:text-right leading-snug sm:ml-auto max-w-none sm:max-w-[min(100%,22rem)]">
            Professor-style review · sample draft (not your work)
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] sm:text-base lg:text-xl font-extrabold text-stone-900 dark:text-stone-100 leading-snug break-words" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{demo.title}</h2>
          </div>
          <div className="flex flex-nowrap items-center gap-1.5 sm:flex-wrap sm:gap-2 md:gap-3 min-w-0 overflow-x-auto pb-0.5 sm:pb-0 sm:overflow-visible [-webkit-overflow-scrolling:touch]">
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-stone-700 dark:text-stone-200 shrink-0 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-stone-700 dark:text-stone-200 shrink-0 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Word
          </button>
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-stone-700 dark:text-stone-200 shrink-0 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block border-b-2 border-[#E5E5E5] dark:border-stone-700">{renderGradeBreakdown()}</div>

      {/* Hover tooltip for annotations */}
      {hoveredAnnotation && tooltipPos && (() => {
        const ann = demo.annotations.find(a => a.id === hoveredAnnotation);
        if (!ann) return null;
        const tooltipCategory = {
          strong: {
            label: 'Strong point',
            className: 'text-[#58CC02] bg-[#E5F8D0] border-[#58CC02]/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
          },
          improve: {
            label: 'Area to improve',
            className: 'text-[#FF9600] bg-[#FFF4E0] border-[#FF9600]/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>,
          },
          concern: {
            label: 'Serious concern',
            className: 'text-[#FF4B4B] bg-[#FFE8E8] border-[#FF4B4B]/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
          },
        }[ann.type];
        return (
          <div
            className="fixed z-[100] min-w-[220px] max-w-[320px] p-3 bg-[#3C3C3C] dark:bg-[#3C3C3C] text-white text-xs rounded-2xl border-2 border-b-4 border-[#2a2a2a] pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x, window.innerWidth - 340),
              top: tooltipPos.y - 8,
              transform: 'translateY(-100%)',
            }}
          >
            <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b border-white/20 ${tooltipCategory.className} rounded-lg px-2 py-1 w-fit text-[11px] font-extrabold`}>
              {tooltipCategory.icon}
              <span>{tooltipCategory.label}</span>
            </div>
            <p className="text-stone-400 text-[11px] mb-2 pb-2 border-b border-white/20 italic leading-snug">"{ann.text}"</p>
            <p className="font-medium mb-1 text-white">{ann.comment}</p>
            <p className="text-stone-300 italic">{ann.suggestion}</p>
          </div>
        );
      })()}

      {/* Legend + hint (on mobile, only when Document tab is active; always on lg+) */}
      <div
        className={`bg-white dark:bg-stone-800/50 px-4 sm:px-6 py-4 border-b-2 border-[#E5E5E5] dark:border-stone-700 ${
          mobileTab !== 'document' ? 'hidden lg:block' : ''
        }`}
      >
        <p className="text-sm text-[#3C3C3C] dark:text-stone-400 mb-3 font-extrabold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Click highlights to explore feedback</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#58CC02] rounded-full" />
            <span className="text-[#3C3C3C] dark:text-stone-400 font-extrabold">Strong sections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF9600] rounded-full" />
            <span className="text-[#3C3C3C] dark:text-stone-400 font-extrabold">Needs improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF4B4B] rounded-full" />
            <span className="text-[#3C3C3C] dark:text-stone-400 font-extrabold">Needs revision</span>
          </div>
        </div>
      </div>

      {/* Mobile tabs: Document | Feedback | Analysis (lg+ keeps split view + full scroll) */}
      <div className="lg:hidden flex border-b-2 border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-stone-800/50">
        <button
          type="button"
          onClick={() => setMobileTab('document')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-extrabold transition-colors leading-tight ${
            mobileTab === 'document'
              ? 'text-[#A560E8] dark:text-[#A560E8] border-b-4 border-[#A560E8] bg-white dark:bg-stone-900'
              : 'text-[#AFAFAF] dark:text-stone-400 hover:text-[#3C3C3C] dark:hover:text-stone-200'
          }`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          Document
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('feedback')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-extrabold transition-colors leading-tight ${
            mobileTab === 'feedback'
              ? 'text-[#A560E8] dark:text-[#A560E8] border-b-4 border-[#A560E8] bg-white dark:bg-stone-900'
              : 'text-[#AFAFAF] dark:text-stone-400 hover:text-[#3C3C3C] dark:hover:text-stone-200'
          }`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          Feedback
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('analysis')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-extrabold transition-colors leading-tight ${
            mobileTab === 'analysis'
              ? 'text-[#A560E8] dark:text-[#A560E8] border-b-4 border-[#A560E8] bg-white dark:bg-stone-900'
              : 'text-[#AFAFAF] dark:text-stone-400 hover:text-[#3C3C3C] dark:hover:text-stone-200'
          }`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          Analysis
        </button>
      </div>

      {/* Two-column: Document + Annotations - matches AnalysisPage layout */}
      <div className="flex flex-col lg:flex-row lg:min-h-[560px]">
        {/* Document panel */}
        <div
          className={`flex-1 min-w-0 flex flex-col overflow-hidden bg-white dark:bg-stone-900 max-h-[min(58dvh,460px)] sm:max-h-[420px] lg:max-h-[580px] ${mobileTab !== 'document' ? 'hidden lg:block' : ''}`}
        >
          <div
            ref={documentPanelScrollRef}
            className="flex-1 min-h-0 bg-white p-4 sm:p-6 overflow-y-auto overscroll-contain dark:bg-stone-900"
          >
            <div className="max-w-3xl">
              <div className="text-sm leading-relaxed text-gray-700 dark:text-stone-300">
                {renderHighlightedDocument()}
              </div>
            </div>
          </div>
        </div>

        {/* Annotations sidebar */}
        <div
          ref={feedbackPanelScrollRef}
          className={`w-full lg:w-[380px] lg:min-w-[340px] bg-white dark:bg-stone-800/50 border-t-2 lg:border-t-0 lg:border-l-2 border-[#E5E5E5] dark:border-stone-700 overflow-y-auto overscroll-contain max-h-[min(58dvh,460px)] sm:max-h-[420px] lg:max-h-[580px] flex-shrink-0 ${mobileTab !== 'feedback' ? 'hidden lg:block' : ''}`}
        >
          <div className="p-5 md:p-6">
            <h3 className="text-sm sm:text-lg font-extrabold text-[#3C3C3C] dark:text-stone-100 mb-3 sm:mb-5 flex items-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              <svg className="w-5 h-5 mr-2 text-[#A560E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Annotations
            </h3>
            <div className="space-y-6">
              {/* Strong Points */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#E5F8D0] dark:bg-[#58CC02]/20 rounded-xl">
                    {getAnnotationIcon('strong')}
                  </div>
                  <h4 className="font-extrabold text-[#58CC02] dark:text-[#58CC02]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Strong Points ({strongAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {strongAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-2xl p-3.5 border-2 border-b-4 border-[#E5E5E5] border-l-[6px] border-l-[#58CC02] transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-[#A560E8]' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-[#3C3C3C] dark:text-stone-300 font-extrabold mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-[#AFAFAF] dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#FFF4E0] dark:bg-[#FF9600]/20 rounded-xl">
                    {getAnnotationIcon('improve')}
                  </div>
                  <h4 className="font-extrabold text-[#FF9600] dark:text-[#FF9600]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Areas to Improve ({improveAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {improveAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      data-landing-feedback-card={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-2xl p-3.5 border-2 border-b-4 border-[#E5E5E5] border-l-[6px] border-l-[#FF9600] transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-[#A560E8]' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-[#3C3C3C] dark:text-stone-300 font-extrabold mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-[#AFAFAF] dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                      {ann.demoRevisedText && (
                        <div className="mt-2.5 pt-2 border-t-2 border-[#E5E5E5] dark:border-[#FF9600]/30">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#AFAFAF] dark:text-stone-500 mb-1">
                            Suggested revision
                          </p>
                          <p className="text-[12px] text-stone-700 dark:text-stone-300 leading-snug">{ann.demoRevisedText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Serious Concerns */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 rounded-xl">
                    {getAnnotationIcon('concern')}
                  </div>
                  <h4 className="font-extrabold text-[#FF4B4B] dark:text-[#FF4B4B]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Serious Concerns ({concernAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {concernAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      data-landing-feedback-card={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-2xl p-3.5 border-2 border-b-4 border-[#E5E5E5] border-l-[6px] border-l-[#FF4B4B] transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-[#A560E8]' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-[#3C3C3C] dark:text-stone-300 font-extrabold mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-[#AFAFAF] dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                      {ann.demoRevisedText && (
                        <div className="mt-2.5 pt-2 border-t-2 border-[#E5E5E5] dark:border-[#FF4B4B]/30">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#AFAFAF] dark:text-stone-500 mb-1">
                            Suggested revision
                          </p>
                          <p className="text-[12px] text-stone-700 dark:text-stone-300 leading-snug">{ann.demoRevisedText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only: rubric in Analysis tab */}
        <div
          className={`lg:hidden w-full overflow-y-auto max-h-[min(72dvh,640px)] bg-white dark:bg-stone-900 border-t-2 border-[#E5E5E5] dark:border-stone-700 ${
            mobileTab !== 'analysis' ? 'hidden' : ''
          }`}
        >
          <div className="[&>div]:mx-0 [&>div]:mt-0 [&>div]:mb-0 [&>div]:rounded-none [&>div]:border-0">
            {renderGradeBreakdown()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 bg-white dark:bg-stone-800/50 border-t-2 border-[#E5E5E5] dark:border-stone-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-xl text-xs font-extrabold text-[#3C3C3C] dark:text-stone-400 border-2 border-[#E5E5E5] dark:border-stone-600">
            Word Count: {liveWordCount}
          </span>
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-xl text-xs font-extrabold text-[#3C3C3C] dark:text-stone-400 border-2 border-[#E5E5E5] dark:border-stone-600">
            Citation Style: None
          </span>
        </div>
        <button
          onClick={() => onNavigate('signup')}
          className="px-6 py-2.5 bg-[#58CC02] text-white font-extrabold border-2 border-b-4 border-[#46A302] rounded-xl transition-all text-sm active:border-b-2 active:translate-y-0.5"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
