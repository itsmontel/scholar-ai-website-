import { useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  activationCoachBody,
  activationCoachBtnPrimary,
  activationCoachCard,
  activationCoachHint,
  activationCoachKicker,
  activationCoachSegmentClass,
} from './activationCoachUi';

type CoachStep =
  | 'mla'
  | 'analyze'
  | 'loading'
  | 'rubric'
  | 'doc'
  | 'rewriteConcern'
  | 'rewriteImprove'
  | 'copyText'
  | 'library'
  | 'done';

const STEP_SEQUENCE: CoachStep[] = [
  'mla',
  'analyze',
  'loading',
  'rubric',
  'doc',
  'rewriteConcern',
  'rewriteImprove',
  'copyText',
  'library',
  'done',
];

function findVisibleActivationTarget(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function stepProgressIndex(step: CoachStep): number {
  const i = STEP_SEQUENCE.indexOf(step);
  return i < 0 ? 0 : i;
}

function ActivationConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        left: `${(i * 31) % 97}%`,
        delay: `${(i % 9) * 0.07}s`,
        duration: `${2.2 + (i % 6) * 0.28}s`,
        color: ['#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#fb923c'][i % 6],
        w: 6 + (i % 4),
        h: 8 + (i % 5),
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[225] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="activation-confetti-piece absolute top-0 rounded-[2px] opacity-95"
          style={{
            left: p.left,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function ActivationAnalysisCoach({
  step,
  onContinue,
  concernRevisionApplied,
  improveRevisionApplied,
  showConfetti,
  citeTargetRef,
  analyzeDocTargetRef,
}: {
  step: CoachStep;
  onContinue: () => void;
  /** Serious-concern card revision applied (activation tour). */
  concernRevisionApplied: boolean;
  /** Areas-to-improve card revision applied (activation tour). */
  improveRevisionApplied: boolean;
  /** Tour-complete celebration (skipped when prefers-reduced-motion). */
  showConfetti: boolean;
  citeTargetRef?: RefObject<HTMLElement | null>;
  analyzeDocTargetRef?: RefObject<HTMLElement | null>;
}) {
  const rid = useId().replace(/:/g, '');
  const markerId = `an-mk-${rid}`;
  const gradId = `an-gr-${rid}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const [arrow, setArrow] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [arrowKey, setArrowKey] = useState(0);
  const [allowConfetti, setAllowConfetti] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setAllowConfetti(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useLayoutEffect(() => {
    if (step === 'mla' || step === 'analyze') {
      const update = () => {
        const panel = panelRef.current;
        const target =
          step === 'mla' ? citeTargetRef?.current ?? null : analyzeDocTargetRef?.current ?? null;
        if (!panel || !target) {
          setArrow(null);
          return;
        }
        const pr = panel.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        setArrow({
          x1: pr.left + pr.width * 0.1,
          y1: pr.top + pr.height * 0.45,
          x2: tr.left + tr.width * 0.5,
          y2: tr.top + tr.height * 0.5,
        });
        setArrowKey((k) => k + 1);
      };
      update();
      const t1 = window.setTimeout(update, 40);
      const t2 = window.setTimeout(update, 220);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }

    if (step === 'rewriteConcern' && !concernRevisionApplied) {
      const rewritePhase = 'concern';
      const update = () => {
        const panel = panelRef.current;
        const applyEl = document.querySelector(
          `[data-activation-rewrite-apply-target="${rewritePhase}"]`
        ) as HTMLElement | null;
        const fallback = document.querySelector(
          `[data-activation-rewrite-focus="${rewritePhase}"]`
        ) as HTMLElement | null;
        const target = applyEl ?? fallback;
        if (!panel || !target) {
          setArrow(null);
          return;
        }
        const pr = panel.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        setArrow({
          x1: pr.left + pr.width * 0.12,
          y1: pr.top + pr.height * 0.35,
          x2: tr.left + tr.width * 0.5,
          y2: tr.top + tr.height * 0.45,
        });
        setArrowKey((k) => k + 1);
      };
      update();
      const t1 = window.setTimeout(update, 60);
      const t2 = window.setTimeout(update, 280);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }

    if (step === 'rewriteImprove' && !improveRevisionApplied) {
      const rewritePhase = 'improve';
      const update = () => {
        const panel = panelRef.current;
        const applyEl = document.querySelector(
          `[data-activation-rewrite-apply-target="${rewritePhase}"]`
        ) as HTMLElement | null;
        const fallback = document.querySelector(
          `[data-activation-rewrite-focus="${rewritePhase}"]`
        ) as HTMLElement | null;
        const target = applyEl ?? fallback;
        if (!panel || !target) {
          setArrow(null);
          return;
        }
        const pr = panel.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        setArrow({
          x1: pr.left + pr.width * 0.12,
          y1: pr.top + pr.height * 0.35,
          x2: tr.left + tr.width * 0.5,
          y2: tr.top + tr.height * 0.45,
        });
        setArrowKey((k) => k + 1);
      };
      update();
      const t1 = window.setTimeout(update, 60);
      const t2 = window.setTimeout(update, 280);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }

    if (step === 'copyText') {
      const update = () => {
        const panel = panelRef.current;
        const target = findVisibleActivationTarget('[data-activation-copy-full-text]');
        if (!panel || !target) {
          setArrow(null);
          return;
        }
        const pr = panel.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        setArrow({
          x1: pr.left + pr.width * 0.1,
          y1: pr.top + pr.height * 0.42,
          x2: tr.left + tr.width * 0.5,
          y2: tr.top + tr.height * 0.5,
        });
        setArrowKey((k) => k + 1);
      };
      update();
      const t1 = window.setTimeout(update, 60);
      const t2 = window.setTimeout(update, 280);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }

    if (step === 'library') {
      const update = () => {
        const panel = panelRef.current;
        const target = findVisibleActivationTarget('[data-activation-library-tab]');
        if (!panel || !target) {
          setArrow(null);
          return;
        }
        const pr = panel.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        setArrow({
          x1: pr.left + pr.width * 0.08,
          y1: pr.top + pr.height * 0.38,
          x2: tr.left + tr.width * 0.5,
          y2: tr.top + tr.height * 0.5,
        });
        setArrowKey((k) => k + 1);
      };
      update();
      const t1 = window.setTimeout(update, 60);
      const t2 = window.setTimeout(update, 280);
      /** Mobile: header opens the nav drawer; allow animation before measuring. */
      const t3 = window.setTimeout(update, 420);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }

    setArrow(null);
    return undefined;
  }, [step, concernRevisionApplied, improveRevisionApplied, citeTargetRef, analyzeDocTargetRef]);

  const copy: Record<CoachStep, { title: string; body: string; hint?: string }> = {
    mla: {
      title: 'Citation style',
      body: 'This essay is written in MLA. Select MLA so in-text checks match the citations.',
      hint: 'Choose MLA in the dropdown',
    },
    analyze: {
      title: 'Run analysis',
      body: 'Now click Analyze Document to see how our analysis works.',
      hint: 'Analyze Document',
    },
    loading: {
      title: 'Analyzing…',
      body: 'Your grade breakdown and annotated essay are next.',
    },
    rubric: {
      title: 'General Academic Assessment',
      body:
        'Your score and estimated grade are at the top. Each rubric box shows how you scored in that category and why.',
    },
    doc: {
      title: 'Annotated essay',
      body:
        'Here is our paper analysis section. Green is highlighted for strong points, Amber for areas to improve, and Red for serious concerns. Hover any highlight to read the note in context.',
    },
    rewriteConcern: {
      title: 'Serious concern: apply revision',
      body:
        'Under Serious Concerns, find the card that starts with the movie opening (Chris and Rose visiting her parents). Click Apply WriteScholar revision. Your draft updates in purple so you can see the fix.',
      hint: 'Apply WriteScholar revision',
    },
    rewriteImprove: {
      title: 'Areas to improve: apply revision',
      body:
        'Under Areas to Improve, find the long sentence about her parents not knowing Chris is a Black man and his read on their behavior. Click Apply WriteScholar revision there too.',
      hint: 'Apply WriteScholar revision',
    },
    copyText: {
      title: 'Copy your essay',
      body:
        'When you are happy with your revisions, use Copy full text to grab the whole essay. Paste into Word, Google Docs, or wherever you submit.',
      hint: 'Copy full text',
    },
    library: {
      title: 'Your Library',
      body:
        'Papers you upload and analyze are saved to your Library. Use the Library tab in the header to see all of your uploaded documents and also to make changes to your papers whenever you want.',
      hint: 'Tap Next to continue',
    },
    done: {
      title: 'Tour complete',
      body:
        'You finished the interactive tour. You just saw what an 82 paper looks like. Now let\'s do the same with your paper.\n\nUpload or paste your draft - get argument gaps, citation fixes, your grade breakdown, and line-level rewrites in under a minute before your professor sees it.',
    },
  };

  const copyBase = copy[step];
  const c =
    step === 'rewriteConcern' && concernRevisionApplied
      ? {
          title: 'Revision applied',
          body:
            'WriteScholar improved this sentence without changing what you meant. The serious concern is addressed, but the line still sounds like you. Compare the purple text in your draft to see exactly what changed.',
          hint: 'Tap Next to continue',
        }
      : step === 'rewriteImprove' && improveRevisionApplied
        ? {
            title: 'Perfect. Revision applied.',
            body:
              'Look how the sentence flows now. WriteScholar tightened the wording so your point comes through clearly. Your update appears in purple in the draft. Tap Next when you are ready.',
            hint: 'Tap Next to continue',
          }
        : copyBase;
  const showNext = step !== 'loading' && step !== 'mla' && step !== 'analyze';
  const nextDisabled =
    (step === 'rewriteConcern' && !concernRevisionApplied) ||
    (step === 'rewriteImprove' && !improveRevisionApplied);

  const pi = stepProgressIndex(step);
  const contentKey =
    step === 'loading'
      ? 'loading'
      : step === 'rewriteConcern'
        ? `rewriteConcern-${concernRevisionApplied ? 'applied' : 'pending'}`
        : step === 'rewriteImprove'
          ? `rewriteImprove-${improveRevisionApplied ? 'applied' : 'pending'}`
          : step;

  /** MLA/Analyze dim + click-capture is rendered inside AnalysisPage’s gated wrapper (first child) so citation/analyze controls can stack above the overlay (z-[118]). */
  /** Library + Tour complete: block the whole app until Next/Done; coach card stays above (z-[220]). */
  const blockPageExceptCoach = step === 'library' || step === 'done';

  return (
    <>
      {blockPageExceptCoach && (
        <div
          className="fixed inset-0 z-[211] pointer-events-auto bg-stone-900/[0.06] dark:bg-black/25 transition-opacity duration-300"
          aria-hidden
        />
      )}

      {step === 'done' && showConfetti && allowConfetti && <ActivationConfetti />}

      {arrow && (
        <svg
          key={arrowKey}
          className={`pointer-events-none fixed left-0 top-0 overflow-visible ${blockPageExceptCoach ? 'z-[215]' : 'z-[205]'}`}
          aria-hidden
          width="100vw"
          height="100vh"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(167 139 250)" />
              <stop offset="100%" stopColor="rgb(139 92 246)" />
            </linearGradient>
            <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" className="fill-violet-500" />
            </marker>
          </defs>
          <line
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke={`url(#${gradId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            className="activation-tutorial-arrow-line"
          />
        </svg>
      )}

      <div
        ref={panelRef}
        className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[220] w-[min(23rem,calc(100vw-1.5rem))] animate-in fade-in zoom-in-95 duration-300 ease-out"
      >
        <div className={`pointer-events-auto px-4 py-4 ${activationCoachCard}`}>
          <div className="mb-3 flex items-center gap-1.5" aria-hidden>
            {STEP_SEQUENCE.map((_, i) => (
              <span key={i} className={activationCoachSegmentClass(i <= pi, i === pi)} />
            ))}
          </div>

          <div key={contentKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className={`${activationCoachKicker} mb-1 flex flex-wrap items-center gap-2`}>
              <span>{c.title}</span>
              {step === 'done' && (
                <span className="inline-flex shrink-0 text-emerald-500" aria-hidden>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              {step === 'loading' && (
                <span className="inline-flex gap-1" aria-hidden>
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                  <span
                    className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500"
                    style={{ animationDelay: '120ms' }}
                  />
                  <span
                    className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500"
                    style={{ animationDelay: '240ms' }}
                  />
                </span>
              )}
            </p>
            <p
              className={`${activationCoachBody} font-medium ${step === 'done' ? 'whitespace-pre-line' : ''}`}
            >
              {c.body}
            </p>
            {(step === 'mla' ||
              step === 'analyze' ||
              step === 'rewriteConcern' ||
              step === 'rewriteImprove' ||
              step === 'copyText' ||
              step === 'library') &&
              c.hint && (
              <p className={activationCoachHint}>{c.hint}</p>
            )}
            {showNext && (
              <div className="mt-4 flex justify-end">
                <button type="button" disabled={nextDisabled} onClick={onContinue} className={activationCoachBtnPrimary}>
                  {step === 'done' ? 'Done' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
