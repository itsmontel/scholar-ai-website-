import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  DEMO_PAPERS,
  type DemoAnnotation,
  type DemoPaper,
} from '../../data/landingPageDemoAnalysis';

/** Matches AnalysisPage revision marks (purple until revert). Inline flow — not inline-block — so words are not split awkwardly at line breaks. */
const REVISION_MARK_CLASS =
  'bg-violet-200/95 dark:bg-violet-900/50 text-violet-950 dark:text-violet-50 px-0.5 rounded-sm ring-2 ring-violet-500/80 dark:ring-violet-400/60 shadow-sm ring-offset-1 ring-offset-white dark:ring-offset-stone-900 [box-decoration-break:clone]';

/** Landing hero: hero “Full interactive demo” CTA scrolls here and focuses the feedback column */
export const LANDING_DEMO_FOCUS_FEEDBACK_EVENT = 'writescholar:landing-demo-focus-feedback';

/** Compact guidance when a demo revision is applied (banner stays subtle). */
const REVISION_GUIDANCE_COPY: Record<'improve' | 'concern', string> = {
  improve: 'Purple text in the essay is the new wording—often clearer flow or a sharper thesis line from the suggestion you applied.',
  concern: 'Purple text in the essay replaces the flagged sentence—stronger argument or clearer wording in context.',
};

/** Landing hero: below Tailwind `lg` (1024px), automated tour stays off — static preview only. */
const LANDING_HERO_MOBILE_MQ = '(max-width: 1023px)';

function useLandingHeroMobileLayout(): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LANDING_HERO_MOBILE_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LANDING_HERO_MOBILE_MQ);
    const fn = () => setMatches(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return matches;
}

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
  const isLandingMobile = useLandingHeroMobileLayout();
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_PAPERS.find((p) => p.id === 'b')?.id ?? DEMO_PAPERS[0].id);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<'document' | 'feedback' | 'analysis'>('document');
  /** Rubric + category scores (default) vs full written report; only one at a time */
  const [analysisPanel, setAnalysisPanel] = useState<'assessment' | 'comprehensive'>('assessment');
  /** Landing demo: inline “Apply WriteScholar revision” replacements */
  const [appliedDemoRevisions, setAppliedDemoRevisions] = useState<Set<string>>(() => new Set());
  const [demoRevisionNotice, setDemoRevisionNotice] = useState<{ comment: string; type: 'improve' | 'concern' } | null>(null);
  /** Landing hero: tour is opt-in only (Play tour) — never auto-starts on desktop or mobile. */
  const [walkthroughPlaying, setWalkthroughPlaying] = useState(false);
  const [fakeCursor, setFakeCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [walkthroughPulse, setWalkthroughPulse] = useState<string | null>(null);
  /** Dashboard hero: pause the automated tour when scrolled off-screen or tab is hidden */
  const [heroDemoInView, setHeroDemoInView] = useState(false);
  const [docTabVisible, setDocTabVisible] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  /** Scrollable regions only — walkthrough must not use scrollIntoView (scrolls the whole page). */
  const documentPanelScrollRef = useRef<HTMLDivElement>(null);
  const feedbackPanelScrollRef = useRef<HTMLDivElement>(null);
  const walkthroughTimersRef = useRef<number[]>([]);

  const demo = DEMO_PAPERS.find((d) => d.id === selectedDemoId) ?? DEMO_PAPERS[0];

  const anchorMap = useMemo(() => computeAnchorMap(demo.content, demo.annotations), [demo.content, demo.annotations]);

  const landingDisplay = useMemo(
    () => buildLandingDemoDisplay(demo, appliedDemoRevisions, anchorMap),
    [demo, appliedDemoRevisions, anchorMap]
  );

  const { displayContent, paragraphRanges, hlSpans, revRanges } = landingDisplay;

  const revisableOrdered = useMemo(() => {
    const list = demo.annotations.filter((a) => a.demoRevisedText && a.type !== 'strong');
    return list.sort((a, b) => {
      const aa = anchorMap.get(a.id)?.start ?? 0;
      const bb = anchorMap.get(b.id)?.start ?? 0;
      return aa - bb;
    });
  }, [demo.annotations, anchorMap]);

  const applyDemoRevision = useCallback((annotationId: string) => {
    const ann = demo.annotations.find((a) => a.id === annotationId);
    if (!ann?.demoRevisedText) return;
    setAppliedDemoRevisions((prev) => {
      if (prev.has(annotationId)) return prev;
      return new Set(prev).add(annotationId);
    });
    if (ann.type === 'improve' || ann.type === 'concern') {
      setDemoRevisionNotice({ comment: ann.comment, type: ann.type });
    }
    setSelectedAnnotation(annotationId);
  }, [demo.annotations]);

  const clearDemoRevisions = useCallback(() => {
    setAppliedDemoRevisions(new Set());
    setDemoRevisionNotice(null);
    setSelectedAnnotation(null);
  }, []);

  /** `applyButton`: tip near center of full-width pill (stable when label wraps); `offset`: top-left + px for inline spans */
  const positionFakeCursorOnEl = useCallback(
    (el: HTMLElement | null, target: { type: 'offset'; x: number; y: number } | { type: 'applyButton' } = { type: 'offset', x: 8, y: 8 }) => {
      if (!el || !rootRef.current) return;
      const root = rootRef.current.getBoundingClientRect();
      const t = el.getBoundingClientRect();
      if (target.type === 'applyButton') {
        setFakeCursor({
          x: t.left - root.left + t.width * 0.42,
          y: t.top - root.top + t.height * 0.48,
          visible: true,
        });
        return;
      }
      setFakeCursor({
        x: t.left - root.left + target.x,
        y: t.top - root.top + target.y,
        visible: true,
      });
    },
    []
  );

  const afterLayout = useCallback((fn: () => void) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }, []);

  useEffect(() => {
    setAppliedDemoRevisions(new Set());
    setDemoRevisionNotice(null);
    setWalkthroughPulse(null);
    setFakeCursor((c) => ({ ...c, visible: false }));
  }, [selectedDemoId]);

  useLayoutEffect(() => {
    if (!landingHeroEmbed) return;
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setHeroDemoInView(entry.isIntersecting);
      },
      { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);

    const onVisibility = () => setDocTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [landingHeroEmbed]);

  /** Mobile landing: no automated tour — keep preview static (user explores tabs manually). */
  useEffect(() => {
    if (!landingHeroEmbed || !isLandingMobile) return;
    setWalkthroughPlaying(false);
    setWalkthroughPulse(null);
    setFakeCursor((c) => ({ ...c, visible: false }));
  }, [landingHeroEmbed, isLandingMobile]);

  useEffect(() => {
    if (!landingHeroEmbed || !walkthroughPlaying || !heroDemoInView || !docTabVisible || isLandingMobile) {
      setFakeCursor((c) => ({ ...c, visible: false }));
      if (isLandingMobile) setWalkthroughPulse(null);
      return;
    }
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || revisableOrdered.length === 0) return;

    walkthroughTimersRef.current.forEach((id) => clearTimeout(id));
    walkthroughTimersRef.current = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      walkthroughTimersRef.current.push(id);
    };

    const runPair = (ann: DemoAnnotation, onDone: () => void) => {
      let seq = 0;
      schedule(() => {
        setMobileTab('document');
        const span = rootRef.current?.querySelector<HTMLElement>(`[data-landing-doc-ann="${ann.id}"]`);
        const docScroll = documentPanelScrollRef.current;
        if (span && docScroll) {
          // Instant scroll so rects match when we place the cursor (smooth scroll was still moving on later steps)
          scrollChildIntoContainer(docScroll, span, 'center', 'auto');
          schedule(() => {
            afterLayout(() => {
              const el = rootRef.current?.querySelector<HTMLElement>(`[data-landing-doc-ann="${ann.id}"]`);
              if (el) positionFakeCursorOnEl(el, { type: 'offset', x: 12, y: 14 });
              setWalkthroughPulse(ann.id);
            });
          }, 480);
        }
      }, seq);
      seq += 1580;

      schedule(() => {
        setMobileTab((prev) => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'feedback' : prev));
        const deferMs = typeof window !== 'undefined' && window.innerWidth < 1024 ? 90 : 0;
        schedule(() => {
          const btn = rootRef.current?.querySelector<HTMLElement>(`[data-landing-apply="${ann.id}"]`);
          const fbScroll = feedbackPanelScrollRef.current;
          if (btn && fbScroll) {
            scrollChildIntoContainer(fbScroll, btn, 'nearest', 'auto');
            schedule(() => {
              afterLayout(() => {
                const b = rootRef.current?.querySelector<HTMLElement>(`[data-landing-apply="${ann.id}"]`);
                if (b) positionFakeCursorOnEl(b, { type: 'applyButton' });
              });
            }, 100);
          }
        }, deferMs);
      }, seq);
      seq += 1150;

      schedule(() => {
        setWalkthroughPulse(null);
        applyDemoRevision(ann.id);
        setFakeCursor((c) => ({ ...c, visible: false }));
      }, seq);
      seq += 2700;

      schedule(onDone, seq);
    };

    const loop = (idx: number) => {
      if (idx >= revisableOrdered.length) {
        schedule(() => {
          clearDemoRevisions();
          setMobileTab('document');
          loop(0);
        }, 3400);
        return;
      }
      runPair(revisableOrdered[idx], () => loop(idx + 1));
    };

    schedule(() => loop(0), 850);

    return () => {
      walkthroughTimersRef.current.forEach((id) => clearTimeout(id));
      walkthroughTimersRef.current = [];
    };
  }, [
    landingHeroEmbed,
    walkthroughPlaying,
    heroDemoInView,
    docTabVisible,
    revisableOrdered,
    applyDemoRevision,
    clearDemoRevisions,
    positionFakeCursorOnEl,
    afterLayout,
    selectedDemoId,
    isLandingMobile,
  ]);

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
      'bg-[#dcfce7] dark:bg-green-900/40 text-green-900 dark:text-green-100 rounded-sm px-0.5 border-b-2 border-green-600 dark:border-green-500 hover:bg-[#bbf7d0] dark:hover:bg-green-800/50',
    improve:
      'bg-[#fef3c7] dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-sm px-0.5 border-b-2 border-amber-600 dark:border-amber-500 hover:bg-[#fde68a] dark:hover:bg-amber-800/50',
    concern:
      'bg-[#fee2e2] dark:bg-red-900/40 text-red-900 dark:text-red-100 rounded-sm px-0.5 border-b-2 border-red-600 dark:border-red-500 hover:bg-[#fecaca] dark:hover:bg-red-800/50',
  };

  const renderHighlightedDocument = () => {
    return paragraphRanges.map((range, paraIdx) => {
      const isTitle = paraIdx === 0 && range.text === demo.title;
      const segments = paragraphSegments(range.start, range.end, displayContent, hlSpans, revRanges, demo.annotations);
      if (segments.length === 1 && segments[0].kind === 'plain') {
        return (
          <p
            key={paraIdx}
            className={`mb-3 text-gray-700 dark:text-stone-300 leading-relaxed ${isTitle ? 'text-lg font-semibold text-left' : 'text-sm text-left text-pretty'}`}
          >
            {range.text}
          </p>
        );
      }
      return (
        <p
          key={paraIdx}
          className={`mb-3 text-gray-700 dark:text-stone-300 leading-relaxed break-words ${isTitle ? 'text-lg font-semibold text-left' : 'text-sm text-left text-pretty'}`}
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
            const isPulse = walkthroughPulse === ann.id;
            return (
              <span
                key={`${ann.id}-${i}`}
                data-landing-doc-ann={ann.id}
                className={`relative inline ${highlightClasses[ann.type]} px-0.5 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-violet-500' : ''
                } ${isPulse ? 'motion-safe:animate-[landing-highlight-pulse_1.35s_ease-in-out_2] z-[1]' : ''}`}
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

  const strongAnnotations = demo.annotations.filter(a => a.type === 'strong');
  const improveAnnotations = demo.annotations.filter(a => a.type === 'improve');
  const concernAnnotations = demo.annotations.filter(a => a.type === 'concern');

  const renderGradeBreakdown = () => (
    <div className="mx-4 sm:mx-6 mt-6 mb-4 rounded-2xl border border-gray-200 dark:border-stone-600 overflow-hidden">
      <div className="bg-teal-600 text-white px-6 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <h2 className="text-xl font-bold">General Academic Assessment</h2>
            <p className="text-emerald-100 text-sm mt-0.5">Standard college rubric: thesis, evidence, structure, and clarity</p>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.overallScore}/100</div>
              <div className="text-emerald-100 text-xs">Score</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{demo.grade}</div>
              <div className="text-emerald-100 text-xs">Grade</div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-[#F8FAFC] dark:bg-stone-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demo.rubric.map((cat) => (
            <div key={cat.name} className="p-4 rounded-xl bg-white dark:bg-stone-700/50 border border-gray-200 dark:border-stone-600 shadow-sm min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-medium text-gray-800 dark:text-stone-200 text-sm break-words flex-1 min-w-0">{cat.name}</span>
                <span className="font-bold text-gray-900 dark:text-stone-100 text-sm flex-shrink-0">{cat.score}/{cat.maxScore}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-stone-400 break-words leading-snug">{cat.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComprehensiveAnalysis = () => (
    <div className="border-t border-gray-200 dark:border-stone-700 rounded-t-2xl overflow-hidden">
      <div className="bg-gray-900 dark:bg-stone-950 px-4 sm:px-6 py-4 rounded-t-2xl">
        <h3 className="text-lg font-bold text-white">Full written report</h3>
        <p className="text-gray-400 text-sm mt-0.5">Narrative feedback, category-by-category, same data as the real export</p>
      </div>
      <div className="p-4 sm:p-6 space-y-8">
        <div>
          <p className="text-gray-700 dark:text-stone-300 text-sm leading-relaxed mb-4">
            {demo.comprehensiveAnalysis.overallSummary}
          </p>
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Overall Score</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.overallScore}/100</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Grade Estimate</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.grade}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">Clarity Rating</span>
              <p className="text-lg font-bold text-gray-900 dark:text-stone-100">{demo.comprehensiveAnalysis.clarityRating}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-stone-100 mb-2">Top Suggestions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-stone-300">
              {demo.comprehensiveAnalysis.topSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </div>

        {demo.comprehensiveAnalysis.categories.map((cat) => (
          <div key={cat.name}>
            <h4 className="font-bold text-gray-900 dark:text-stone-100 mb-2">{cat.name}</h4>
            <p className="text-sm text-gray-600 dark:text-stone-400 mb-4">{cat.summary}</p>
            {cat.strengths && cat.strengths.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Strengths</h5>
                <ul className="space-y-2">
                  {cat.strengths.map((s, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{s.quote}"</span>
                      <p className="text-gray-600 dark:text-stone-400 mt-0.5">{s.feedback}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cat.areasForImprovement && cat.areasForImprovement.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Areas for Improvement</h5>
                <ul className="space-y-2">
                  {cat.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{a.quote}"</span>
                      <p className="text-amber-700 dark:text-amber-400 italic mt-0.5">Suggestion: {a.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cat.seriousConcerns && cat.seriousConcerns.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Serious Concerns</h5>
                <ul className="space-y-2">
                  {cat.seriousConcerns.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-700 dark:text-stone-300">"{c.quote}"</span>
                      <p className="text-red-700 dark:text-red-400 italic mt-0.5">Suggestion: {c.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <div>
          <h4 className="font-bold text-gray-900 dark:text-stone-100 mb-3">Priority Recommendations</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-stone-300">
            {demo.comprehensiveAnalysis.priorityRecommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );

  const liveWordCount = displayContent.trim() ? displayContent.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden bg-white dark:bg-stone-900 min-w-0 max-w-full ${
        landingHeroEmbed
          ? 'rounded-2xl sm:rounded-3xl border-0 shadow-none'
          : 'rounded-2xl shadow-xl border border-gray-200 dark:border-stone-600'
      }`}
    >
      {landingHeroEmbed && fakeCursor.visible && (
        <div
          className="pointer-events-none absolute z-[80] motion-safe:transition-[transform,opacity] duration-[920ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{
            transform: `translate3d(${fakeCursor.x}px, ${fakeCursor.y}px, 0)`,
          }}
          aria-hidden
        >
          {/* Classic OS-style arrow pointer (white fill + outline); tip at top-left of the box */}
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            className="text-violet-900 dark:text-violet-100 drop-shadow-[0_3px_10px_rgba(0,0,0,0.28)] dark:drop-shadow-[0_3px_12px_rgba(0,0,0,0.5)]"
            aria-hidden
          >
            <path
              fill="white"
              stroke="currentColor"
              strokeWidth={1.25}
              strokeLinejoin="round"
              d="M5 2.25L5 18.6L9.35 14.25L12.4 21.85L15.55 20.35L12.1 12.55L19.5 12.55L5 2.25z"
            />
          </svg>
        </div>
      )}
      {/* Demo selector + Header — dark violet chrome (brand), not blue-gray */}
      <div className="bg-violet-950 px-3 sm:px-6 py-4 sm:py-5">
        {landingHeroEmbed && (
          <div className="mb-3 pb-3 border-b border-violet-500/20 space-y-2">
            <p className="text-[11px] sm:text-xs text-violet-200/95 leading-snug">
              {isLandingMobile ? (
                <>
                  <span className="font-semibold text-violet-50">Static preview</span>
                  <span className="text-violet-500/80 mx-1.5">·</span>
                  Use the tabs below to explore highlights and{' '}
                  <span className="text-violet-100/95">Apply revision</span>. On desktop, press Play tour for a guided walkthrough.
                </>
              ) : (
                <>
                  <span className="font-semibold text-violet-50">Interactive preview</span>
                  <span className="text-violet-500/80 mx-1.5">·</span>
                  Highlights, sidebar, and <span className="text-violet-100/95">Apply revision</span> — press{' '}
                  <span className="text-violet-100/95">Play tour</span> for a guided walkthrough, or explore freely.
                </>
              )}
            </p>
            <div className={`flex flex-wrap items-center gap-2 ${isLandingMobile ? 'hidden' : ''}`}>
              <button
                type="button"
                onClick={() => setWalkthroughPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/12 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-violet-100 transition-colors"
              >
                {walkthroughPlaying ? (
                  <>
                    <svg className="w-3 h-3 opacity-90" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause tour
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 opacity-90" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play tour
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDemoRevisions();
                  setMobileTab('document');
                  setWalkthroughPlaying(false);
                }}
                className="rounded-lg border border-violet-500/30 px-2.5 py-1.5 text-[11px] font-medium text-violet-300/95 hover:bg-violet-900/35 transition-colors"
              >
                Reset
              </button>
              <span className="text-[10px] text-violet-400/80 sm:ml-1">Purple in the essay = applied wording.</span>
            </div>
          </div>
        )}
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
                  setAnalysisPanel('assessment');
                  setAppliedDemoRevisions(new Set());
                  setDemoRevisionNotice(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedDemoId === d.id
                    ? 'bg-violet-600 text-violet-50 shadow-sm ring-1 ring-violet-400/35'
                    : 'bg-violet-900/70 text-violet-200/90 hover:bg-violet-800/90 hover:text-violet-50 border border-violet-800/50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] sm:text-xs text-violet-300/90 text-left sm:text-right leading-snug sm:ml-auto max-w-none sm:max-w-[min(100%,22rem)]">
            Professor-style review · sample draft (not your work)
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] sm:text-base lg:text-xl font-bold text-violet-50 leading-snug break-words">{demo.title}</h2>
          </div>
          <div className="flex flex-nowrap items-center gap-1.5 sm:flex-wrap sm:gap-2 md:gap-3 min-w-0 overflow-x-auto pb-0.5 sm:pb-0 sm:overflow-visible [-webkit-overflow-scrolling:touch]">
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-medium text-violet-50 shrink-0 bg-violet-900/80 hover:bg-violet-800 border border-violet-700/45">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-medium text-violet-50 shrink-0 bg-violet-900/80 hover:bg-violet-800 border border-violet-700/45">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Word
          </button>
          <button type="button" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-medium text-violet-50 shrink-0 bg-violet-900/80 hover:bg-violet-800 border border-violet-700/45">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
          </div>
        </div>
      </div>

      {/* Toggle: rubric (default) vs full report (desktop/tablet; mobile uses same under Analysis tab) */}
      <div className="hidden lg:block border-b border-gray-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 px-4 sm:px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-3">Analysis view</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAnalysisPanel('assessment')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ring-1 ${
              analysisPanel === 'assessment'
                ? 'bg-teal-600 text-white ring-teal-500 shadow-sm'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-stone-200 dark:ring-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700/50'
            }`}
          >
            General academic assessment
          </button>
          <button
            type="button"
            onClick={() => setAnalysisPanel('comprehensive')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ring-1 ${
              analysisPanel === 'comprehensive'
                ? 'bg-violet-700 text-white ring-violet-600 shadow-sm'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-stone-200 dark:ring-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700/50'
            }`}
          >
            Comprehensive written analysis
          </button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 leading-snug max-w-3xl">
          Start with the rubric for a quick score breakdown. Switch to the comprehensive view for paragraph-level narrative feedback, strengths, and revision notes. That is the same depth you get on a real analysis.
        </p>
      </div>
      <div className="hidden lg:block">{analysisPanel === 'assessment' ? renderGradeBreakdown() : renderComprehensiveAnalysis()}</div>

      {/* Hover tooltip for annotations */}
      {hoveredAnnotation && tooltipPos && (() => {
        const ann = demo.annotations.find(a => a.id === hoveredAnnotation);
        if (!ann) return null;
        const tooltipCategory = {
          strong: {
            label: 'Strong point',
            className: 'text-green-400 bg-green-500/20 border-green-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
          },
          improve: {
            label: 'Area to improve',
            className: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>,
          },
          concern: {
            label: 'Serious concern',
            className: 'text-red-400 bg-red-500/20 border-red-500/50',
            icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
          },
        }[ann.type];
        return (
          <div
            className="fixed z-[100] min-w-[220px] max-w-[320px] p-3 bg-stone-900 dark:bg-stone-800 text-white text-xs rounded-lg shadow-xl border border-stone-700 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x, window.innerWidth - 340),
              top: tooltipPos.y - 8,
              transform: 'translateY(-100%)',
            }}
          >
            <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b border-stone-600 ${tooltipCategory.className} rounded px-2 py-1 w-fit text-[11px] font-semibold`}>
              {tooltipCategory.icon}
              <span>{tooltipCategory.label}</span>
            </div>
            <p className="text-stone-400 text-[11px] mb-2 pb-2 border-b border-stone-600 italic leading-snug">"{ann.text}"</p>
            <p className="font-medium mb-1 text-white">{ann.comment}</p>
            <p className="text-stone-300 italic">{ann.suggestion}</p>
          </div>
        );
      })()}

      {/* Legend + hint (on mobile, only when Document tab is active; always on lg+) */}
      <div
        className={`bg-gray-50 dark:bg-stone-800/50 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-stone-700 ${
          mobileTab !== 'document' ? 'hidden lg:block' : ''
        }`}
      >
        <p className="text-sm text-gray-600 dark:text-stone-400 mb-3">Click highlights to explore feedback</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Strong sections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Needs improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span className="text-gray-600 dark:text-stone-400">Needs revision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-300/80 dark:ring-violet-400/50" />
            <span className="text-gray-600 dark:text-stone-400">WriteScholar revision</span>
          </div>
        </div>
        {landingHeroEmbed && (
          <p className="mt-2 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-500 leading-snug">
            Applied revisions appear as <span className="text-violet-600 dark:text-violet-400 font-medium">purple</span> in the essay.
          </p>
        )}
      </div>

      {/* Mobile tabs: Document | Feedback | Analysis (lg+ keeps split view + full scroll) */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-stone-700 bg-gray-50 dark:bg-stone-800/50">
        <button
          type="button"
          onClick={() => setMobileTab('document')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold transition-colors leading-tight ${
            mobileTab === 'document'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
        >
          Document
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('feedback')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold transition-colors leading-tight ${
            mobileTab === 'feedback'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
        >
          Feedback
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('analysis')}
          className={`flex-1 py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-sm font-semibold transition-colors leading-tight ${
            mobileTab === 'analysis'
              ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-white dark:bg-stone-900'
              : 'text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200'
          }`}
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
          {demoRevisionNotice && (
            <div
              role="status"
              aria-live="polite"
              className="shrink-0 mx-3 mt-2 mb-0 sm:mx-4 sm:mt-3 rounded-lg border border-violet-200/60 bg-violet-50/40 px-2.5 py-2 sm:px-3 dark:border-violet-800/40 dark:bg-violet-950/20"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200">Revision applied — see purple in essay</span>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide ${
                        demoRevisionNotice.type === 'concern' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {demoRevisionNotice.type === 'concern' ? 'Concern' : 'Improve'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] leading-snug text-stone-600 dark:text-stone-400">
                    {REVISION_GUIDANCE_COPY[demoRevisionNotice.type]}
                  </p>
                  <p className="text-[10px] leading-snug text-stone-500 dark:text-stone-500 border-t border-stone-200/70 pt-1.5 dark:border-stone-600/60">
                    <span className="font-medium text-stone-600 dark:text-stone-400">Note: </span>
                    {demoRevisionNotice.comment}
                  </p>
                </div>
              </div>
            </div>
          )}
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
          className={`w-full lg:w-[380px] lg:min-w-[340px] bg-gray-50 dark:bg-stone-800/50 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-stone-700 overflow-y-auto overscroll-contain max-h-[min(58dvh,460px)] sm:max-h-[420px] lg:max-h-[580px] flex-shrink-0 ${mobileTab !== 'feedback' ? 'hidden lg:block' : ''}`}
        >
          <div className="p-5 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mb-5 flex items-center">
              <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Annotations
            </h3>
            <div className="space-y-6">
              {/* Strong Points */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-xl">
                    {getAnnotationIcon('strong')}
                  </div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300">Strong Points ({strongAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {strongAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-green-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-violet-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                    {getAnnotationIcon('improve')}
                  </div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">Areas to Improve ({improveAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {improveAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      data-landing-feedback-card={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-amber-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-violet-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                      {ann.demoRevisedText && (
                        <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/50">
                          {appliedDemoRevisions.has(ann.id) ? (
                            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Applied in draft (purple in document)
                            </p>
                          ) : (
                            <button
                              type="button"
                              data-landing-apply={ann.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                applyDemoRevision(ann.id);
                              }}
                              className="w-full min-w-0 rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-2.5 shadow-sm ring-1 ring-violet-500/25 transition-colors"
                            >
                              Apply WriteScholar revision
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Serious Concerns */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-xl">
                    {getAnnotationIcon('concern')}
                  </div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300">Serious Concerns ({concernAnnotations.length})</h4>
                </div>
                <div className="space-y-2">
                  {concernAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      data-landing-feedback-card={ann.id}
                      className={`bg-white dark:bg-stone-800 rounded-xl p-3.5 border-l-[6px] border-red-500 shadow-[0_4px_6px_rgba(0,0,0,0.07)] hover:shadow-md transition-all cursor-pointer min-w-0 ${
                        selectedAnnotation === ann.id ? 'ring-2 ring-violet-500' : ''
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                      onMouseEnter={() => setHoveredAnnotation(ann.id)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                    >
                      <p className="text-[13px] text-gray-700 dark:text-stone-300 font-medium mb-1 break-words leading-snug">{ann.comment}</p>
                      <p className="text-[12px] text-gray-500 dark:text-stone-400 italic break-words leading-snug">{ann.suggestion}</p>
                      {ann.demoRevisedText && (
                        <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-800/50">
                          {appliedDemoRevisions.has(ann.id) ? (
                            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Applied in draft (purple in document)
                            </p>
                          ) : (
                            <button
                              type="button"
                              data-landing-apply={ann.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                applyDemoRevision(ann.id);
                              }}
                              className="w-full min-w-0 rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-2.5 shadow-sm ring-1 ring-violet-500/25 transition-colors"
                            >
                              Apply WriteScholar revision
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only: rubric + full report in Analysis tab */}
        <div
          className={`lg:hidden w-full overflow-y-auto max-h-[min(72dvh,640px)] bg-white dark:bg-stone-900 border-t border-gray-200 dark:border-stone-700 ${
            mobileTab !== 'analysis' ? 'hidden' : ''
          }`}
        >
          <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/95 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Analysis view</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnalysisPanel('assessment')}
                className={`flex-1 rounded-lg py-2 px-2 text-xs font-semibold transition-colors ${
                  analysisPanel === 'assessment'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-1 ring-stone-200 dark:ring-stone-600'
                }`}
              >
                Assessment
              </button>
              <button
                type="button"
                onClick={() => setAnalysisPanel('comprehensive')}
                className={`flex-1 rounded-lg py-2 px-2 text-xs font-semibold transition-colors ${
                  analysisPanel === 'comprehensive'
                    ? 'bg-violet-700 text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 ring-1 ring-stone-200 dark:ring-stone-600'
                }`}
              >
                Full report
              </button>
            </div>
          </div>
          <div className="[&>div]:mx-0 [&>div]:mt-0 [&>div]:mb-0 [&>div]:rounded-none [&>div]:border-0">
            {analysisPanel === 'assessment' ? renderGradeBreakdown() : renderComprehensiveAnalysis()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-stone-800/50 border-t border-gray-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-gray-600 dark:text-stone-400 border border-gray-200 dark:border-stone-600">
            Word Count: {liveWordCount}
          </span>
          <span className="px-3 py-1.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-gray-600 dark:text-stone-400 border border-gray-200 dark:border-stone-600">
            Citation Style: None
          </span>
        </div>
        <button
          onClick={() => onNavigate('signup')}
          className="px-6 py-2.5 bg-gray-900 dark:bg-stone-700 hover:bg-gray-800 dark:hover:bg-stone-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Export Report
        </button>
      </div>
    </div>
  );
}
