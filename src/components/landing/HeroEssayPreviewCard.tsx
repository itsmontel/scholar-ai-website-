import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DemoAnnotation, DemoPaper } from '../../data/landingPageDemoAnalysis';

const highlightClasses = {
  strong:
    'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 rounded px-0.5 py-px shadow-[inset_0_-1px_0_0_rgba(5,150,105,0.25)] dark:shadow-[inset_0_-1px_0_0_rgba(52,211,153,0.2)] ring-1 ring-emerald-500/25 dark:ring-emerald-400/25',
  improve:
    'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 rounded px-0.5 py-px shadow-[inset_0_-1px_0_0_rgba(217,119,6,0.22)] dark:shadow-[inset_0_-1px_0_0_rgba(251,191,36,0.15)] ring-1 ring-amber-500/30 dark:ring-amber-400/25',
  concern:
    'bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-100 rounded px-0.5 py-px shadow-[inset_0_-1px_0_0_rgba(225,29,72,0.2)] dark:shadow-[inset_0_-1px_0_0_rgba(251,113,133,0.15)] ring-1 ring-rose-500/30 dark:ring-rose-400/25',
} as const;

const hoverRing = {
  strong: 'hover:ring-2 hover:ring-emerald-400/60 dark:hover:ring-emerald-500/50',
  improve: 'hover:ring-2 hover:ring-amber-400/60 dark:hover:ring-amber-500/50',
  concern: 'hover:ring-2 hover:ring-rose-400/60 dark:hover:ring-rose-500/50',
} as const;

/** Matches InteractiveDocumentAnalysis revision marks (purple until revert). */
const REVISION_MARK_CLASS =
  'bg-violet-200/95 dark:bg-violet-900/50 text-violet-950 dark:text-violet-50 px-0.5 rounded-sm ring-2 ring-violet-500/80 dark:ring-violet-400/60 shadow-sm ring-offset-1 ring-offset-white dark:ring-offset-stone-900 [box-decoration-break:clone]';

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
    accent: 'border-l-emerald-500',
    header:
      'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white border-b border-emerald-700/30',
    quote: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800',
    sectionLabel: 'text-emerald-800 dark:text-emerald-400',
    suggestionBox:
      'bg-stone-50 dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800 shadow-sm',
    suggestionLabel: 'text-emerald-700 dark:text-emerald-400',
  },
  improve: {
    label: 'Area to improve',
    accent: 'border-l-amber-500',
    header:
      'bg-gradient-to-r from-amber-600 via-amber-600 to-orange-600 text-white border-b border-amber-900/20',
    quote: 'bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-50 border border-amber-200 dark:border-amber-800',
    sectionLabel: 'text-amber-900 dark:text-amber-400',
    suggestionBox:
      'bg-stone-50 dark:bg-stone-900 border border-amber-200 dark:border-amber-800 shadow-sm',
    suggestionLabel: 'text-amber-800 dark:text-amber-400',
  },
  concern: {
    label: 'Needs attention',
    accent: 'border-l-rose-500',
    header:
      'bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 text-white border-b border-rose-900/25',
    quote: 'bg-rose-50 dark:bg-rose-950 text-rose-950 dark:text-rose-50 border border-rose-200 dark:border-rose-800',
    sectionLabel: 'text-rose-900 dark:text-rose-400',
    suggestionBox:
      'bg-stone-50 dark:bg-stone-900 border border-rose-200 dark:border-rose-800 shadow-sm',
    suggestionLabel: 'text-rose-800 dark:text-rose-400',
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
        fixed z-[300] w-[min(300px,calc(100vw-1.25rem))] overflow-hidden rounded-xl pointer-events-none
        border-y border-r border-stone-200 dark:border-stone-600 border-l-[4px]
        bg-white dark:bg-stone-950
        text-stone-900 dark:text-stone-100
        shadow-[0_18px_40px_-10px_rgba(91,33,182,0.2),0_8px_16px_-6px_rgba(0,0,0,0.12)]
        dark:shadow-[0_22px_44px_-10px_rgba(0,0,0,0.7)]
        animate-in fade-in zoom-in-95 duration-150
        ${v.accent}
      `}
      style={{
        left,
        top,
        transform: 'translateY(calc(-100% - 10px))',
      }}
    >
      <div className={`flex items-center gap-2 px-2.5 py-2 ${v.header}`}>
        <TooltipHeaderIcon type={annotation.type} />
        <span className="text-[11px] font-bold tracking-tight">{v.label}</span>
        <span className="ml-auto rounded-full bg-white/25 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
          Live
        </span>
      </div>

      <div className="p-2.5 space-y-2">
        <div>
          <p className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${v.sectionLabel}`}>Highlighted text</p>
          <p
            className={`text-[10px] leading-snug italic rounded-md px-2 py-2 line-clamp-4 ${v.quote}`}
          >
            &ldquo;{annotation.text}&rdquo;
          </p>
        </div>

        <div>
          <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${v.sectionLabel}`}>Feedback</p>
          <p className="text-[11px] font-medium leading-snug text-stone-800 dark:text-stone-200">{annotation.comment}</p>
        </div>

        <div className={`rounded-lg px-2 py-2 ${v.suggestionBox}`}>
          <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5 ${v.suggestionLabel}`}>
            <span className="inline-flex h-0.5 w-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" aria-hidden />
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
    outerShadow:
      'group-hover/preview:shadow-[0_22px_44px_-14px_rgba(124,58,237,0.26)] dark:group-hover/preview:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.72)]',
    cardRing: 'ring-violet-200/90 dark:ring-violet-800/55',
    cardShadow:
      'shadow-[0_14px_32px_-12px_rgba(91,33,182,0.14),0_0_0_1px_rgba(139,92,246,0.08)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]',
    chromeBar: 'border-violet-200/90 dark:border-violet-800/55 bg-violet-50/90 dark:bg-violet-950/40',
    docIcon: 'text-violet-600 dark:text-violet-400',
    scoreBadge: 'bg-gradient-to-br from-violet-600 to-violet-500',
    paperAccent: 'bg-violet-300/90 dark:bg-violet-600',
    legendIcon: 'text-violet-600 dark:text-violet-400',
    ctaBar: 'text-violet-950 dark:text-violet-100 bg-violet-100 dark:bg-violet-950 border-violet-200 dark:border-violet-800 hover:bg-violet-200/90 dark:hover:bg-violet-900',
    ctaIcon: 'text-violet-600 dark:text-violet-400',
    activeRing: 'ring-violet-500/70',
  },
  after: {
    outerShadow:
      'group-hover/preview:shadow-[0_22px_44px_-14px_rgba(109,40,217,0.28)] dark:group-hover/preview:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.72)]',
    cardRing: 'ring-violet-300/90 dark:ring-violet-700/55',
    cardShadow:
      'shadow-[0_14px_32px_-12px_rgba(91,33,182,0.2),0_0_0_1px_rgba(139,92,246,0.09)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]',
    chromeBar: 'border-violet-300/85 dark:border-violet-600/50 bg-violet-50/95 dark:bg-violet-950/45',
    docIcon: 'text-violet-700 dark:text-violet-400',
    scoreBadge: 'bg-gradient-to-br from-violet-700 to-violet-600',
    paperAccent: 'bg-violet-400/90 dark:bg-violet-500',
    legendIcon: 'text-violet-700 dark:text-violet-400',
    ctaBar: 'text-violet-950 dark:text-violet-100 bg-violet-100 dark:bg-violet-950 border-violet-200 dark:border-violet-800 hover:bg-violet-200/90 dark:hover:bg-violet-900',
    ctaIcon: 'text-violet-600 dark:text-violet-400',
    activeRing: 'ring-violet-500/70',
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
          className={`mb-1.5 text-stone-600 dark:text-stone-400 leading-snug ${isTitle ? 'text-[10px] font-semibold tracking-tight text-stone-900 dark:text-stone-50' : 'text-[10px] text-justify'}`}
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
              className={`${REVISION_MARK_CLASS} font-medium cursor-help select-none motion-safe:animate-[landing-revision-fade_0.45s_ease-out] hover:ring-2 hover:ring-violet-400/55 dark:hover:ring-violet-500/45 ${
                isActive ? `ring-2 ${vs.activeRing} ring-offset-1 ring-offset-[#fdfcfa] dark:ring-offset-stone-800` : ''
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
              font-medium ${heroLive ? 'cursor-help motion-safe:animate-[landing-revision-fade_0.45s_ease-out]' : 'cursor-help'} transition-shadow duration-150
              ${isActive ? `ring-2 ${vs.activeRing} ring-offset-1 ring-offset-[#fdfcfa] dark:ring-offset-stone-800` : ''}
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
        className={`mb-1.5 text-stone-600 dark:text-stone-400 leading-snug break-words ${isTitle ? 'text-[10px] font-semibold tracking-tight text-stone-900 dark:text-stone-50' : 'text-[10px] text-justify'}`}
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
        className={`relative rounded-2xl overflow-hidden transition-shadow duration-500 ${vs.outerShadow}
          bg-white dark:bg-stone-900
          ring-1 ${vs.cardRing}
          ${vs.cardShadow}`}
      >
        {/* Window chrome */}
        <div className={`relative flex items-center gap-2 px-2.5 py-2 border-b ${vs.chromeBar}`}>
          <div className="flex gap-1 shrink-0" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/5" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/5" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/5" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-md bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-600 px-2 py-0.5 shadow-sm">
            <svg className={`w-3 h-3 shrink-0 ${vs.docIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-medium text-stone-600 dark:text-stone-300 truncate">
              {resolvedChromeTitle}
            </span>
          </div>
          <span className={`text-[9px] font-bold tabular-nums px-2 py-1 rounded-md ${vs.scoreBadge} text-white shadow-sm shrink-0`}>
            {paper.grade.split(' ')[0]} · {paper.overallScore}/100
          </span>
        </div>

        {legendPlacement === 'top' && (
          <div className="relative px-2.5 pt-2.5 pb-1 space-y-1.5 border-b border-stone-100 dark:border-stone-800/80">
            {heroInteractive ? (
              <>
                <p className="text-center text-[8px] font-medium text-stone-500 dark:text-stone-400 leading-snug px-1">
                  Live preview cycles; hover for highlighted text, feedback, and suggested revision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-black/10 dark:ring-white/15" />
                    Flagged
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950 text-violet-900 dark:text-violet-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 ring-1 ring-black/10 dark:ring-white/15" />
                    Revision
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-[8px] font-medium text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1">
                  <svg className={`w-2.5 h-2.5 ${vs.legendIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Hover highlights for annotations
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {[
                    { key: 'strong', label: 'Strong', dot: 'bg-emerald-500', chip: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200' },
                    { key: 'improve', label: 'Improve', dot: 'bg-amber-500', chip: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-200' },
                    { key: 'concern', label: 'Concern', dot: 'bg-rose-500', chip: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200' },
                  ].map((item) => (
                    <span
                      key={item.key}
                      className={`inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border ${item.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} ring-1 ring-black/10 dark:ring-white/15`} />
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
            className="relative rounded-lg border border-stone-200 dark:border-stone-600
              bg-[#fdfcfa] dark:bg-stone-800
              shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.05)]
              dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.28)]"
          >
            <div className={`absolute left-2.5 top-2.5 bottom-2.5 w-px rounded-full ${vs.paperAccent}`} aria-hidden />
            <div className={`pl-4 pr-2.5 py-2.5 overflow-hidden ${paperMaxHeightClass}`}>
              <div className="font-serif text-stone-800 dark:text-stone-200 text-[10px]">
                {paragraphRanges.map((r, i) => renderParagraph(r, i))}
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-2.5 bottom-2.5 h-14 rounded-b-lg bg-gradient-to-t from-[#fdfcfa] via-[#fdfcfa] dark:from-stone-800 dark:via-stone-800 to-transparent"
            aria-hidden
          />
        </div>

        {legendPlacement === 'bottom' && (
          <div className="relative px-2.5 pb-2 -mt-4 space-y-1.5">
            {heroInteractive ? (
              <>
                <p className="text-center text-[8px] font-medium text-stone-500 dark:text-stone-400 leading-snug px-1">
                  Live preview cycles; hover for highlighted text, feedback, and suggested revision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-black/10 dark:ring-white/15" />
                    Flagged
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950 text-violet-900 dark:text-violet-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 ring-1 ring-black/10 dark:ring-white/15" />
                    Revision
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-[8px] font-medium text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1">
                  <svg className={`w-2.5 h-2.5 ${vs.legendIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Hover highlights for annotations
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {[
                    { key: 'strong', label: 'Strong', dot: 'bg-emerald-500', chip: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200' },
                    { key: 'improve', label: 'Improve', dot: 'bg-amber-500', chip: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-200' },
                    { key: 'concern', label: 'Concern', dot: 'bg-rose-500', chip: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200' },
                  ].map((item) => (
                    <span
                      key={item.key}
                      className={`inline-flex items-center gap-0.5 rounded-full pl-0.5 pr-1.5 py-0.5 text-[8px] font-bold border ${item.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} ring-1 ring-black/10 dark:ring-white/15`} />
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
            className={`relative w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-semibold border-t transition-colors duration-200 group/btn ${vs.ctaBar}`}
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
