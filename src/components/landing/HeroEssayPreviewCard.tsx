import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DemoAnnotation, DemoPaper } from '../../data/landingPageDemoAnalysis';

const highlightClasses = {
  strong:
    'bg-[#E5F8D0] dark:bg-[#58CC02]/20 text-[#3C3C3C] dark:text-white rounded px-0.5 py-px border-b-2 border-[#58CC02]',
  improve:
    'bg-[#FFF4E0] dark:bg-[#FF9600]/20 text-[#3C3C3C] dark:text-white rounded px-0.5 py-px border-b-2 border-[#FF9600]',
  concern:
    'bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 text-[#3C3C3C] dark:text-white rounded px-0.5 py-px border-b-2 border-[#FF4B4B]',
} as const;

const hoverRing = {
  strong: 'hover:ring-2 hover:ring-[#58CC02]/60',
  improve: 'hover:ring-2 hover:ring-[#FF9600]/60',
  concern: 'hover:ring-2 hover:ring-[#FF4B4B]/60',
} as const;

/** Matches InteractiveDocumentAnalysis revision marks (purple until revert). */
const REVISION_MARK_CLASS =
  'bg-[#F3EAFF] dark:bg-[#A560E8]/30 text-[#3C3C3C] dark:text-white px-0.5 rounded-sm ring-2 ring-[#A560E8] dark:ring-[#A560E8]/60 ring-offset-1 ring-offset-white dark:ring-offset-[#3C3C3C] [box-decoration-break:clone]';

function buildExcerpt(paper: DemoPaper, maxChars: number) {
  const full = paper.content;
  let cut = full.slice(0, maxChars);
  const lastBreak = cut.lastIndexOf('\n\n');
  if (lastBreak > 120) cut = cut.slice(0, lastBreak);
  const end = cut.length;

  const spans: { start: number; end: number; annotation: DemoAnnotation }[] = [];
  for (const ann of paper.annotations) {
    const idx = full.indexOf(ann.text);
    if (idx >= 0 && idx < end && idx + ann.text.length <= end) {
      spans.push({ start: idx, end: idx + ann.text.length, annotation: ann });
    }
  }
  spans.sort((a, b) => a.start - b.start);

  const paras = cut.split(/\n\n+/);
  const paragraphRanges: { start: number; end: number; text: string }[] = [];
  let searchFrom = 0;
  for (const p of paras) {
    const start = cut.indexOf(p, searchFrom);
    if (start >= 0) {
      const e = start + p.length;
      paragraphRanges.push({ start, end: e, text: p });
      searchFrom = e;
    }
  }

  return { paragraphRanges, annotationSpans: spans };
}

const TOOLTIP_VARIANT: Record<
  DemoAnnotation['type'],
  {
    label: string;
    icon: ReactNode;
    /** Left border color (width set on tooltip shell) */
    accent: string;
    /** Header row */
    header: string;
    /** Quoted excerpt panel */
    quote: string;
    /** “Feedback” label */
    sectionLabel: string;
    /** Suggestion panel */
    suggestionBox: string;
    suggestionLabel: string;
  }
> = {
  strong: {
    label: 'Strong point',
    accent: 'border-l-[#58CC02]',
    header:
      'bg-[#58CC02] text-white border-b-2 border-[#46A302]',
    quote: 'bg-[#E5F8D0] dark:bg-[#58CC02]/15 text-[#3C3C3C] dark:text-white border-2 border-[#58CC02]/30 dark:border-[#46A302]',
    sectionLabel: 'text-[#58CC02] dark:text-[#58CC02]',
    suggestionBox:
      'bg-white dark:bg-stone-900 border-2 border-[#58CC02]/30 dark:border-[#46A302]',
    suggestionLabel: 'text-[#58CC02] dark:text-[#58CC02]',
  },
  improve: {
    label: 'Area to improve',
    accent: 'border-l-[#FF9600]',
    header:
      'bg-[#FF9600] text-white border-b-2 border-[#D97F00]',
    quote: 'bg-[#FFF4E0] dark:bg-[#FF9600]/15 text-[#3C3C3C] dark:text-white border-2 border-[#FF9600]/30 dark:border-[#D97F00]',
    sectionLabel: 'text-[#FF9600] dark:text-[#FF9600]',
    suggestionBox:
      'bg-white dark:bg-stone-900 border-2 border-[#FF9600]/30 dark:border-[#D97F00]',
    suggestionLabel: 'text-[#FF9600] dark:text-[#FF9600]',
  },
  concern: {
    label: 'Needs attention',
    accent: 'border-l-[#FF4B4B]',
    header:
      'bg-[#FF4B4B] text-white border-b-2 border-[#E04343]',
    quote: 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#3C3C3C] dark:text-white border-2 border-[#FF4B4B]/30 dark:border-[#E04343]',
    sectionLabel: 'text-[#FF4B4B] dark:text-[#FF4B4B]',
    suggestionBox:
      'bg-white dark:bg-stone-900 border-2 border-[#FF4B4B]/30 dark:border-[#E04343]',
    suggestionLabel: 'text-[#FF4B4B] dark:text-[#FF4B4B]',
  },
};

function TooltipHeaderIcon({ type }: { type: DemoAnnotation['type'] }) {
  if (type === 'strong') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (type === 'improve') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AnnotationTooltipPortal({
  annotation,
  position,
  suggestedRevisionBody,
}: {
  annotation: DemoAnnotation;
  position: { x: number; y: number };
  /** When set (e.g. hero live demo), shows the actual revised wording instead of the template suggestion line */
  suggestedRevisionBody?: string;
}) {
  if (typeof document === 'undefined' || !document.body) return null;

  const v = TOOLTIP_VARIANT[annotation.type];
  const pad = 16;
  const maxW = 300;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const left = Math.min(Math.max(pad, position.x - maxW / 2), vw - maxW - pad);
  const top = position.y - 12;

  return createPortal(
    <div
      role="tooltip"
      className={`
        fixed z-[300] w-[min(300px,calc(100vw-1.25rem))] overflow-hidden rounded-2xl pointer-events-none
        border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600 border-l-[4px]
        bg-white dark:bg-[#3C3C3C]
        text-[#3C3C3C] dark:text-stone-100
        animate-in fade-in zoom-in-95 duration-150
        ${v.accent}
      `}
      style={{
        left,
        top,
        transform: 'translateY(calc(-100% - 10px))',
      }}
    >
      <div className={`flex items-center gap-2 px-2.5 py-2 rounded-t-xl ${v.header}`}>
        <TooltipHeaderIcon type={annotation.type} />
        <span className="text-[11px] font-extrabold tracking-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{v.label}</span>
        <span className="ml-auto rounded-full bg-white/25 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white">
          Live
        </span>
      </div>

      <div className="p-2.5 space-y-2">
        <div>
          <p className={`text-[8px] font-extrabold uppercase tracking-widest mb-1 ${v.sectionLabel}`}>Highlighted text</p>
          <p
            className={`text-[10px] leading-snug italic rounded-md px-2 py-2 line-clamp-4 ${v.quote}`}
          >
            &ldquo;{annotation.text}&rdquo;
          </p>
        </div>

        <div>
          <p className={`text-[8px] font-extrabold uppercase tracking-widest mb-0.5 ${v.sectionLabel}`}>Feedback</p>
          <p className="text-[11px] font-extrabold leading-snug text-[#3C3C3C] dark:text-stone-200">{annotation.comment}</p>
        </div>

        <div className={`rounded-xl px-2 py-2 ${v.suggestionBox}`}>
          <p className={`text-[8px] font-extrabold uppercase tracking-widest mb-0.5 flex items-center gap-1.5 ${v.suggestionLabel}`}>
            <span className="inline-flex h-0.5 w-6 rounded-full bg-[#A560E8]" aria-hidden />
            Suggested revision
          </p>
          <p className="text-[10px] leading-snug text-stone-700 dark:text-stone-300">
            {suggestedRevisionBody ?? annotation.suggestion}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

const variantStyles = {
  before: {
    outerShadow: '',
    cardRing: 'ring-[#E5E5E5] dark:ring-stone-700',
    cardShadow: '',
    chromeBar: 'border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-[#3C3C3C]',
    docIcon: 'text-[#1CB0F6] dark:text-[#1CB0F6]',
    scoreBadge: 'bg-[#A560E8]',
    paperAccent: 'bg-[#1CB0F6]/60 dark:bg-[#1CB0F6]',
    legendIcon: 'text-[#1CB0F6] dark:text-[#1CB0F6]',
    ctaBar: 'text-[#3C3C3C] dark:text-white bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 border-[#E5E5E5] dark:border-stone-700 hover:bg-[#c8edff] dark:hover:bg-[#1CB0F6]/30',
    ctaIcon: 'text-[#1CB0F6] dark:text-[#1CB0F6]',
    activeRing: 'ring-[#1CB0F6]/70',
  },
  after: {
    outerShadow: '',
    cardRing: 'ring-[#E5E5E5] dark:ring-stone-700',
    cardShadow: '',
    chromeBar: 'border-[#E5E5E5] dark:border-stone-700 bg-white dark:bg-[#3C3C3C]',
    docIcon: 'text-[#58CC02] dark:text-[#58CC02]',
    scoreBadge: 'bg-[#58CC02]',
    paperAccent: 'bg-[#58CC02]/60 dark:bg-[#58CC02]',
    legendIcon: 'text-[#58CC02] dark:text-[#58CC02]',
    ctaBar: 'text-[#3C3C3C] dark:text-white bg-[#E5F8D0] dark:bg-[#58CC02]/20 border-[#E5E5E5] dark:border-stone-700 hover:bg-[#d4f4b8] dark:hover:bg-[#58CC02]/30',
    ctaIcon: 'text-[#58CC02] dark:text-[#58CC02]',
    activeRing: 'ring-[#1CB0F6]/70',
  },
} as const;

interface HeroEssayPreviewCardProps {
  paper: DemoPaper;
  /** `none` = no tilt (e.g. dashboard inline preview) */
  rotate?: 'left' | 'right' | 'none';
  onOpenDemo?: () => void;
  /** Legend chips above or below the paper mock-up */
  legendPlacement?: 'top' | 'bottom';
  /** Visual theme: lighter violet “before” vs richer violet “after” */
  variant?: 'before' | 'after';
  /** Tab label in window chrome */
  chromeTitle?: string;
  maxExcerptChars?: number;
  /** Max height of the paper scroll area (taller = more visible text) */
  paperMaxHeightClass?: string;
  /**
   * Landing hero “before” only: show a single red (concern) span with `demoRevisedText`;
   * cycles automatically to the purple WriteScholar revision (no click — respects reduced motion).
   */
  interactiveConcernRevision?: boolean;
}

export default function HeroEssayPreviewCard({
  paper,
  rotate = 'left',
  onOpenDemo,
  legendPlacement = 'bottom',
  variant = 'before',
  chromeTitle,
  maxExcerptChars = 480,
  paperMaxHeightClass = 'max-h-[200px]',
  interactiveConcernRevision = false,
}: HeroEssayPreviewCardProps) {
  const vs = variantStyles[variant];
  const resolvedChromeTitle = chromeTitle ?? (variant === 'after' ? 'Revised preview' : 'Essay preview');

  const targetConcern = useMemo(() => {
    if (!interactiveConcernRevision) return null;
    return paper.annotations.find((a) => a.type === 'concern' && a.demoRevisedText) ?? null;
  }, [paper.annotations, interactiveConcernRevision]);

  const excerptPaper = useMemo((): DemoPaper => {
    if (!targetConcern) return paper;
    return { ...paper, annotations: [targetConcern] };
  }, [paper, targetConcern]);

  const { paragraphRanges, annotationSpans } = useMemo(
    () => buildExcerpt(excerptPaper, maxExcerptChars),
    [excerptPaper, maxExcerptChars]
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [appliedHeroRevision, setAppliedHeroRevision] = useState(false);

  const heroInteractive = Boolean(interactiveConcernRevision && targetConcern);

  /** Reduced motion: show purple revision only (no cycling). */
  useLayoutEffect(() => {
    if (!heroInteractive || !targetConcern || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAppliedHeroRevision(true);
    }
  }, [heroInteractive, targetConcern?.id, paper.id]);

  /** Auto-cycle red → purple → red (live preview). */
  useEffect(() => {
    if (!heroInteractive || !targetConcern) return;
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dwellRedMs = 2800;
    const dwellPurpleMs = 3400;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const cycle = () => {
      setAppliedHeroRevision(false);
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setAppliedHeroRevision(true);
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              cycle();
            }, dwellPurpleMs)
          );
        }, dwellRedMs)
      );
    };

    cycle();

    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [heroInteractive, targetConcern?.id, paper.id]);

  const hoveredAnnotation = useMemo(
    () => (hoveredId ? paper.annotations.find((a) => a.id === hoveredId) ?? null : null),
    [hoveredId, paper.annotations]
  );

  const rotation =
    rotate === 'none'
      ? ''
      : rotate === 'left'
        ? '-rotate-[11deg] origin-bottom-right'
        : 'rotate-[11deg] origin-bottom-left';

  const renderParagraph = (range: { start: number; end: number; text: string }, paraIdx: number) => {
    const isTitle = paraIdx === 0 && range.text === paper.title;
    const overlaps = annotationSpans.filter((s) => s.end > range.start && s.start < range.end);
    if (overlaps.length === 0) {
      return (
        <p
          key={paraIdx}
          className={`mb-1.5 text-[#3C3C3C] dark:text-stone-400 leading-snug ${isTitle ? 'text-[10px] font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-50' : 'text-[10px] text-justify'}`}
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          {range.text}
        </p>
      );
    }
    const parts: ReactNode[] = [];
    let last = 0;
    for (const span of overlaps) {
      const relStart = Math.max(0, span.start - range.start);
      const relEnd = Math.min(range.text.length, span.end - range.start);
      const actualStart = Math.max(relStart, last);
      if (actualStart > last) {
        parts.push(<span key={`t-${last}`}>{range.text.slice(last, actualStart)}</span>);
      }
      if (actualStart < relEnd) {
        const ann = span.annotation;
        const isActive = hoveredId === ann.id;
        const showPurpleRevision =
          heroInteractive &&
          targetConcern &&
          ann.id === targetConcern.id &&
          appliedHeroRevision &&
          Boolean(ann.demoRevisedText);

        const heroLive = heroInteractive && ann.id === targetConcern?.id;

        if (showPurpleRevision) {
          parts.push(
            <mark
              key={`${ann.id}-purple`}
              className={`${REVISION_MARK_CLASS} font-extrabold cursor-help select-none motion-safe:animate-[landing-revision-fade_0.45s_ease-out] hover:ring-2 hover:ring-[#A560E8]/55 ${
                isActive ? `ring-2 ${vs.activeRing} ring-offset-1 ring-offset-white dark:ring-offset-stone-800` : ''
              }`}
              onMouseEnter={(e) => {
                setHoveredId(ann.id);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setTooltipPos(null);
              }}
            >
              {ann.demoRevisedText}
            </mark>
          );
        } else {
          parts.push(
            <span
              key={`${ann.id}-rose`}
              className={`
              ${highlightClasses[ann.type]}
              ${hoverRing[ann.type]}
              font-extrabold ${heroLive ? 'cursor-help motion-safe:animate-[landing-revision-fade_0.45s_ease-out]' : 'cursor-help'} transition-shadow duration-150
              ${isActive ? `ring-2 ${vs.activeRing} ring-offset-1 ring-offset-white dark:ring-offset-stone-800` : ''}
            `}
              onMouseEnter={(e) => {
                setHoveredId(ann.id);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setTooltipPos(null);
              }}
            >
              {range.text.slice(actualStart, relEnd)}
            </span>
          );
        }
      }
      last = Math.max(last, relEnd);
    }
    if (last < range.text.length) {
      parts.push(<span key="end">{range.text.slice(last)}</span>);
    }
    return (
      <p
        key={paraIdx}
        className={`mb-1.5 text-[#3C3C3C] dark:text-stone-400 leading-snug break-words ${isTitle ? 'text-[10px] font-extrabold tracking-tight text-[#3C3C3C] dark:text-stone-50' : 'text-[10px] text-justify'}`}
        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
      >
        {parts}
      </p>
    );
  };

  return (
    <div
      className={`group/preview pointer-events-auto w-full max-w-[252px] ${rotation} transition-transform duration-500 ease-out hover:rotate-0 hover:scale-[1.02]`}
    >
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-500
          bg-white dark:bg-stone-900
          border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700`}
      >
        {/* Window chrome */}
        <div className={`relative flex items-center gap-2 px-2.5 py-2 border-b-2 ${vs.chromeBar}`}>
          <div className="flex gap-1 shrink-0" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B] border border-[#E04343]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9600] border border-[#D97F00]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#58CC02] border border-[#46A302]" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-xl bg-white dark:bg-stone-950 border-2 border-[#E5E5E5] dark:border-stone-600 px-2 py-0.5">
            <svg className={`w-3 h-3 shrink-0 ${vs.docIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-extrabold text-[#3C3C3C] dark:text-stone-300 truncate" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              {resolvedChromeTitle}
            </span>
          </div>
          <span className={`text-[9px] font-extrabold tabular-nums px-2 py-1 rounded-xl ${vs.scoreBadge} text-white border-2 border-b-4 border-black/10 shrink-0`}>
            {paper.grade.split(' ')[0]} · {paper.overallScore}/100
          </span>
        </div>

        {legendPlacement === 'top' && (
          <div className="relative px-2.5 pt-2.5 pb-1 space-y-1.5 border-b-2 border-[#E5E5E5] dark:border-stone-800/80">
            {heroInteractive ? (
              <>
                <p className="text-center text-[8px] font-extrabold text-[#AFAFAF] dark:text-stone-400 leading-snug px-1">
                  Live preview cycles; hover for highlighted text, feedback, and suggested revision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold border-2 border-[#FF4B4B]/30 bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#FF4B4B] dark:text-[#FF4B4B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B4B]" />
                    Flagged
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold border-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] dark:text-[#A560E8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A560E8]" />
                    Revision
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-[8px] font-extrabold text-[#AFAFAF] dark:text-stone-400 flex items-center justify-center gap-1">
                  <svg className={`w-2.5 h-2.5 ${vs.legendIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Hover highlights for annotations
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {[
                    { key: 'strong', label: 'Strong', dot: 'bg-[#58CC02]', chip: 'border-2 border-[#58CC02]/30 bg-[#E5F8D0] dark:bg-[#58CC02]/15 text-[#58CC02] dark:text-[#58CC02]' },
                    { key: 'improve', label: 'Improve', dot: 'bg-[#FF9600]', chip: 'border-2 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-[#FF9600]/15 text-[#FF9600] dark:text-[#FF9600]' },
                    { key: 'concern', label: 'Concern', dot: 'bg-[#FF4B4B]', chip: 'border-2 border-[#FF4B4B]/30 bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#FF4B4B] dark:text-[#FF4B4B]' },
                  ].map((item) => (
                    <span
                      key={item.key}
                      className={`inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold ${item.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Paper */}
        <div className={`relative px-2.5 ${legendPlacement === 'top' ? 'pt-2.5' : 'pt-2.5'} pb-9`}>
          <div
            className="relative rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-stone-600
              bg-white dark:bg-stone-800"
          >
            <div className={`absolute left-2.5 top-2.5 bottom-2.5 w-px rounded-full ${vs.paperAccent}`} aria-hidden />
            <div className={`pl-4 pr-2.5 py-2.5 overflow-hidden ${paperMaxHeightClass}`}>
              <div className="font-serif text-stone-800 dark:text-stone-200 text-[10px]">
                {paragraphRanges.map((r, i) => renderParagraph(r, i))}
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-2.5 bottom-2.5 h-14 rounded-b-xl bg-gradient-to-t from-white via-white dark:from-stone-800 dark:via-stone-800 to-transparent"
            aria-hidden
          />
        </div>

        {legendPlacement === 'bottom' && (
          <div className="relative px-2.5 pb-2 -mt-4 space-y-1.5">
            {heroInteractive ? (
              <>
                <p className="text-center text-[8px] font-extrabold text-[#AFAFAF] dark:text-stone-400 leading-snug px-1">
                  Live preview cycles; hover for highlighted text, feedback, and suggested revision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold border-2 border-[#FF4B4B]/30 bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#FF4B4B] dark:text-[#FF4B4B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B4B]" />
                    Flagged
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold border-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] dark:text-[#A560E8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A560E8]" />
                    Revision
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-[8px] font-extrabold text-[#AFAFAF] dark:text-stone-400 flex items-center justify-center gap-1">
                  <svg className={`w-2.5 h-2.5 ${vs.legendIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Hover highlights for annotations
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {[
                    { key: 'strong', label: 'Strong', dot: 'bg-[#58CC02]', chip: 'border-2 border-[#58CC02]/30 bg-[#E5F8D0] dark:bg-[#58CC02]/15 text-[#58CC02] dark:text-[#58CC02]' },
                    { key: 'improve', label: 'Improve', dot: 'bg-[#FF9600]', chip: 'border-2 border-[#FF9600]/30 bg-[#FFF4E0] dark:bg-[#FF9600]/15 text-[#FF9600] dark:text-[#FF9600]' },
                    { key: 'concern', label: 'Concern', dot: 'bg-[#FF4B4B]', chip: 'border-2 border-[#FF4B4B]/30 bg-[#FFE8E8] dark:bg-[#FF4B4B]/15 text-[#FF4B4B] dark:text-[#FF4B4B]' },
                  ].map((item) => (
                    <span
                      key={item.key}
                      className={`inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-extrabold ${item.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {onOpenDemo && (
          <button
            type="button"
            onClick={onOpenDemo}
            className={`relative w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-extrabold border-t-2 transition-all duration-200 active:translate-y-0.5 group/btn ${vs.ctaBar}`}
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            <span>Full interactive demo</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 group-hover/btn:translate-x-0.5 ${vs.ctaIcon}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>

      {hoveredAnnotation && tooltipPos && (
        <AnnotationTooltipPortal
          annotation={hoveredAnnotation}
          position={tooltipPos}
          suggestedRevisionBody={
            heroInteractive &&
            targetConcern &&
            hoveredAnnotation.id === targetConcern.id &&
            hoveredAnnotation.demoRevisedText
              ? hoveredAnnotation.demoRevisedText
              : undefined
          }
        />
      )}
    </div>
  );
}
