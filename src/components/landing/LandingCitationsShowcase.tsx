import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FeatureTickRow } from '../common/FeatureTickRow';
import InteractiveCitationsDemo from './InteractiveCitationsDemo';
import LandingCitationResultsPreview from './LandingCitationResultsPreview';
import LandingScrollReveal from './LandingScrollReveal';

const DEMO_QUERY = 'Climate change mitigation strategies';

const SUGGESTED_TOPICS = [
  'Effects of social media on teenagers',
  DEMO_QUERY,
  'AI in healthcare applications',
  'Remote work productivity research',
];

const TYPE_MS = 20;
const POST_TYPE_MS = 420;
const SEARCH_MS = 2000;
const LOOP_PAUSE_MS = 4800;
/** Time for the fake pointer to travel between targets (matches CSS transition). */
const MOVE_CURSOR_MS = 540;
const CLICK_CURSOR_MS = 200;
/** Brief pause before the pointer moves from the corner (lets layout settle). */
const CURSOR_INTRO_MS = 120;

type DemoPhase =
  | 'idle'
  | 'cursor-to-input'
  | 'click-input'
  | 'typing'
  | 'cursor-to-button'
  | 'click-button'
  | 'searching'
  | 'done';

type CursorPct = { x: number; y: number };

const DEFAULT_ANCHORS: {
  start: CursorPct;
  input: CursorPct;
  inputRest: CursorPct;
  button: CursorPct;
} = {
  start: { x: 88, y: 12 },
  input: { x: 48, y: 34 },
  inputRest: { x: 58, y: 46 },
  button: { x: 50, y: 88 },
};

interface LandingCitationsShowcaseProps {
  onNavigate: (page: string) => void;
}

export default function LandingCitationsShowcase({ onNavigate }: LandingCitationsShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const demoStageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findSourcesBtnRef = useRef<HTMLButtonElement>(null);
  const anchorsRef = useRef(DEFAULT_ANCHORS);
  const inViewRef = useRef(false);
  const typeIntervalRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const searchingStartedAtRef = useRef<number | null>(null);
  const phaseRef = useRef<DemoPhase>('idle');
  const typedRef = useRef('');
  const reduceMotionRef = useRef(false);
  /** Only run resume/pause on transitions so we do not reset the loop timer on every scroll tick. */
  const wasActiveRef = useRef(false);

  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [typed, setTyped] = useState('');
  const [cursorPct, setCursorPct] = useState<CursorPct>(DEFAULT_ANCHORS.start);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [showCursor, setShowCursor] = useState(false);

  const measureCursorAnchors = useCallback(() => {
    const stage = demoStageRef.current;
    const ta = textareaRef.current;
    const btn = findSourcesBtnRef.current;
    if (!stage || !ta || !btn) return;
    const s = stage.getBoundingClientRect();
    if (s.width < 32 || s.height < 32) return;
    const taR = ta.getBoundingClientRect();
    const bR = btn.getBoundingClientRect();
    const pct = (cx: number, cy: number): CursorPct => ({
      x: ((cx - s.left) / s.width) * 100,
      y: ((cy - s.top) / s.height) * 100,
    });
    anchorsRef.current = {
      start: pct(s.right - 36, s.top + 28),
      input: pct(taR.left + taR.width * 0.22, taR.top + taR.height * 0.32),
      inputRest: pct(taR.left + taR.width * 0.78, taR.top + taR.height * 0.58),
      button: pct(bR.left + bR.width / 2, bR.top + bR.height / 2),
    };
  }, []);

  useLayoutEffect(() => {
    measureCursorAnchors();
    const stage = demoStageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureCursorAnchors());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measureCursorAnchors]);

  const pushTimer = (id: number) => {
    timersRef.current.push(id);
  };

  const clearTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  const clearTypeInterval = () => {
    if (typeIntervalRef.current != null) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }
  };

  const isActive = useCallback(
    () => inViewRef.current && typeof document !== 'undefined' && document.visibilityState === 'visible',
    []
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  useEffect(() => {
    try {
      reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduceMotionRef.current = false;
    }
  }, []);

  const scheduleLoopRestart = useCallback(() => {
    clearTimers();
    const id = window.setTimeout(() => {
      if (!isActive()) return;
      runDemoRef.current();
    }, LOOP_PAUSE_MS);
    pushTimer(id);
  }, [isActive]);

  /** After typing finishes: pause, move pointer to Find Sources, click, then search. */
  const beginSearchAfterTyping = useCallback(() => {
    measureCursorAnchors();
    pushTimer(
      window.setTimeout(() => {
        if (!isActive()) return;
        setShowCursor(true);
        setCursorPct(anchorsRef.current.inputRest);
        setPhase('cursor-to-button');
        phaseRef.current = 'cursor-to-button';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setCursorPct(anchorsRef.current.button);
          });
        });
        pushTimer(
          window.setTimeout(() => {
            if (!isActive()) return;
            setPhase('click-button');
            phaseRef.current = 'click-button';
            setCursorClicking(true);
            pushTimer(
              window.setTimeout(() => {
                if (!isActive()) return;
                setCursorClicking(false);
                setShowCursor(false);
                setPhase('searching');
                phaseRef.current = 'searching';
                searchingStartedAtRef.current = Date.now();
                pushTimer(
                  window.setTimeout(() => {
                    if (!isActive()) return;
                    searchingStartedAtRef.current = null;
                    setPhase('done');
                    phaseRef.current = 'done';
                    scheduleLoopRestart();
                  }, SEARCH_MS)
                );
              }, CLICK_CURSOR_MS)
            );
          }, MOVE_CURSOR_MS)
        );
      }, POST_TYPE_MS)
    );
  }, [isActive, measureCursorAnchors, scheduleLoopRestart]);

  const finishTypingAndContinue = useCallback(() => {
    clearTimers();
    clearTypeInterval();
    setTyped(DEMO_QUERY);
    typedRef.current = DEMO_QUERY;
    if (reduceMotionRef.current) {
      setShowCursor(false);
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          setPhase('searching');
          phaseRef.current = 'searching';
          searchingStartedAtRef.current = Date.now();
          pushTimer(
            window.setTimeout(() => {
              if (!isActive()) return;
              searchingStartedAtRef.current = null;
              setPhase('done');
              phaseRef.current = 'done';
              scheduleLoopRestart();
            }, SEARCH_MS)
          );
        }, 300)
      );
      return;
    }
    beginSearchAfterTyping();
  }, [beginSearchAfterTyping, isActive, scheduleLoopRestart]);

  const runDemo = useCallback(() => {
    if (!isActive()) return;
    clearTimers();
    clearTypeInterval();
    searchingStartedAtRef.current = null;
    setTyped('');
    typedRef.current = '';
    measureCursorAnchors();

    if (reduceMotionRef.current) {
      setShowCursor(false);
      setTyped(DEMO_QUERY);
      typedRef.current = DEMO_QUERY;
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          setPhase('searching');
          phaseRef.current = 'searching';
          searchingStartedAtRef.current = Date.now();
          pushTimer(
            window.setTimeout(() => {
              if (!isActive()) return;
              searchingStartedAtRef.current = null;
              setPhase('done');
              phaseRef.current = 'done';
              scheduleLoopRestart();
            }, SEARCH_MS)
          );
        }, 300)
      );
      return;
    }

    setShowCursor(true);
    setCursorClicking(false);
    setCursorPct(anchorsRef.current.start);
    setPhase('cursor-to-input');
    phaseRef.current = 'cursor-to-input';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCursorPct(anchorsRef.current.input);
      });
    });

    pushTimer(
      window.setTimeout(() => {
        if (!isActive()) return;
        setPhase('click-input');
        phaseRef.current = 'click-input';
        setCursorClicking(true);
        pushTimer(
          window.setTimeout(() => {
            if (!isActive()) return;
            setCursorClicking(false);
            setPhase('typing');
            phaseRef.current = 'typing';
            setCursorPct(anchorsRef.current.inputRest);

            const chars = [...DEMO_QUERY];
            let i = 0;
            typeIntervalRef.current = window.setInterval(() => {
              if (!isActive()) return;
              i += 1;
              const next = chars.slice(0, i).join('');
              setTyped(next);
              typedRef.current = next;
              if (i >= chars.length) {
                clearTypeInterval();
                beginSearchAfterTyping();
              }
            }, TYPE_MS);
          }, CLICK_CURSOR_MS)
        );
      }, CURSOR_INTRO_MS + MOVE_CURSOR_MS)
    );
  }, [isActive, measureCursorAnchors, beginSearchAfterTyping, scheduleLoopRestart]);

  const runDemoRef = useRef(runDemo);
  runDemoRef.current = runDemo;

  const resumeDemo = useCallback(() => {
    if (!isActive()) return;
    const p = phaseRef.current;
    const t = typedRef.current;

    if (p === 'idle') {
      runDemo();
      return;
    }

    if (p === 'cursor-to-input' || p === 'click-input') {
      runDemo();
      return;
    }

    if (p === 'typing') {
      if (reduceMotionRef.current) {
        finishTypingAndContinue();
        return;
      }
      if (t.length >= DEMO_QUERY.length) {
        finishTypingAndContinue();
        return;
      }
      clearTypeInterval();
      const chars = [...DEMO_QUERY];
      let i = t.length;
      typeIntervalRef.current = window.setInterval(() => {
        if (!isActive()) return;
        i += 1;
        const next = chars.slice(0, i).join('');
        setTyped(next);
        typedRef.current = next;
        if (i >= chars.length) {
          clearTypeInterval();
          beginSearchAfterTyping();
        }
      }, TYPE_MS);
      return;
    }

    if (p === 'cursor-to-button') {
      measureCursorAnchors();
      setShowCursor(true);
      setTyped(DEMO_QUERY);
      typedRef.current = DEMO_QUERY;
      setCursorPct(anchorsRef.current.inputRest);
      setPhase('cursor-to-button');
      phaseRef.current = 'cursor-to-button';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCursorPct(anchorsRef.current.button);
        });
      });
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          setPhase('click-button');
          phaseRef.current = 'click-button';
          setCursorClicking(true);
          pushTimer(
            window.setTimeout(() => {
              if (!isActive()) return;
              setCursorClicking(false);
              setShowCursor(false);
              setPhase('searching');
              phaseRef.current = 'searching';
              searchingStartedAtRef.current = Date.now();
              pushTimer(
                window.setTimeout(() => {
                  if (!isActive()) return;
                  searchingStartedAtRef.current = null;
                  setPhase('done');
                  phaseRef.current = 'done';
                  scheduleLoopRestart();
                }, SEARCH_MS)
              );
            }, CLICK_CURSOR_MS)
          );
        }, MOVE_CURSOR_MS)
      );
      return;
    }

    if (p === 'click-button') {
      setShowCursor(true);
      setCursorClicking(true);
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          setCursorClicking(false);
          setShowCursor(false);
          setPhase('searching');
          phaseRef.current = 'searching';
          searchingStartedAtRef.current = Date.now();
          pushTimer(
            window.setTimeout(() => {
              if (!isActive()) return;
              searchingStartedAtRef.current = null;
              setPhase('done');
              phaseRef.current = 'done';
              scheduleLoopRestart();
            }, SEARCH_MS)
          );
        }, CLICK_CURSOR_MS)
      );
      return;
    }

    if (p === 'searching') {
      const started = searchingStartedAtRef.current;
      const remaining =
        started != null ? Math.max(80, SEARCH_MS - (Date.now() - started)) : SEARCH_MS;
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          searchingStartedAtRef.current = null;
          setPhase('done');
          phaseRef.current = 'done';
          scheduleLoopRestart();
        }, remaining)
      );
      return;
    }

    if (p === 'done') {
      scheduleLoopRestart();
    }
  }, [beginSearchAfterTyping, finishTypingAndContinue, isActive, measureCursorAnchors, runDemo, scheduleLoopRestart]);

  const pauseDemo = useCallback(() => {
    clearTimers();
    clearTypeInterval();
  }, []);

  const updateActivity = useCallback(() => {
    const active = inViewRef.current && document.visibilityState === 'visible';
    if (active) {
      if (!wasActiveRef.current) {
        wasActiveRef.current = true;
        resumeDemo();
      }
    } else if (wasActiveRef.current) {
      wasActiveRef.current = false;
      pauseDemo();
    }
  }, [pauseDemo, resumeDemo]);

  useEffect(() => {
    const onVis = () => updateActivity();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [updateActivity]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        updateActivity();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: [0, 0.12, 0.2] }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      pauseDemo();
      if (typeIntervalRef.current != null) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
    };
  }, [pauseDemo, updateActivity]);

  const replay = () => {
    pauseDemo();
    setPhase('idle');
    phaseRef.current = 'idle';
    setTyped('');
    typedRef.current = '';
    searchingStartedAtRef.current = null;
    setShowCursor(false);
    setCursorClicking(false);
    setCursorPct(anchorsRef.current.start);
    pushTimer(window.setTimeout(() => runDemo(), 80));
  };

  const showPanels = phase === 'done';
  const isSearching = phase === 'searching';
  const isTyping = phase === 'typing';
  const isFieldActive =
    phase === 'cursor-to-input' || phase === 'click-input' || phase === 'typing';
  const buttonDisabled =
    phase === 'typing' ||
    phase === 'cursor-to-input' ||
    phase === 'click-input' ||
    phase === 'cursor-to-button' ||
    phase === 'click-button' ||
    typed.trim().length === 0 ||
    phase === 'searching';
  const buttonFilled =
    typed.trim().length > 0 &&
    (phase === 'cursor-to-button' || phase === 'click-button' || phase === 'searching');

  return (
    <section
      id="landing-citations-showcase"
      className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800 scroll-mt-20"
      aria-labelledby="landing-citations-showcase-heading"
    >
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-stone-50/95 via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-18%,rgba(37,99,235,0.028),transparent_58%)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-12%,rgba(29,78,216,0.055),transparent_58%)] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none bg-[length:24px_24px] bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)]"
        aria-hidden
      />

      <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-blue-200/80 dark:border-blue-800/60 bg-white/80 dark:bg-stone-900/70 backdrop-blur px-3.5 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              Citations · live in dashboard
            </span>
          </div>
          <h2
            id="landing-citations-showcase-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.1] mb-5"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            <span className="block">Find academic sources</span>
            <span className="relative inline-block mt-1 sm:mt-1.5 text-blue-700 dark:text-blue-400">
              in seconds
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-2 text-blue-400/80 dark:text-blue-500/70"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 6 Q50 1 100 5 T198 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p className="text-base sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto font-sans font-normal mb-4">
            Not just feedback on drafts — search real literature, then copy APA, MLA, or Chicago in one tap. Peer-reviewed
            picks, filter by year, export-ready references.
          </p>
          <FeatureTickRow items={['APA', 'MLA', 'Chicago', 'Peer-reviewed', 'Export-ready']} />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 min-h-[1.25rem]" aria-live="polite">
            {phase === 'cursor-to-input' && 'Moving pointer to the topic field…'}
            {phase === 'click-input' && 'Clicking in the topic field…'}
            {isTyping && 'Typing a sample topic…'}
            {phase === 'cursor-to-button' && 'Moving pointer to Find sources…'}
            {phase === 'click-button' && 'Clicking Find sources…'}
            {isSearching && 'Finding peer-reviewed sources…'}
            {showPanels && 'Sample sources and export — loops while you watch.'}
            {phase === 'idle' && 'Scroll here — demo runs when in view.'}
          </p>
        </div>

        <div className="relative rounded-[1.35rem] sm:rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-700/90 bg-white/90 dark:bg-stone-900/60 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.6)_inset] dark:shadow-[0_28px_90px_-28px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md ring-1 ring-white/50 dark:ring-white/5">
          <div
            className="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-600 opacity-90 dark:opacity-95"
            aria-hidden
          />
          <div className="relative rounded-b-2xl bg-gradient-to-b from-white/98 to-stone-50/90 dark:from-stone-900/85 dark:to-stone-950/90 p-4 sm:p-10">
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-25%,rgba(37,99,235,0.025),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(29,78,216,0.05),transparent_55%)] pointer-events-none rounded-b-2xl"
              aria-hidden
            />

            <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-stretch">
              <div
                className={`hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto z-[5] transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                  showPanels
                    ? 'opacity-100 translate-y-0 translate-x-0 scale-100 -rotate-[11deg] blur-0'
                    : 'opacity-0 translate-y-8 translate-x-[-12px] scale-[0.94] -rotate-[14deg] blur-[1px] pointer-events-none'
                }`}
                style={{ filter: showPanels ? 'drop-shadow(0 22px 40px rgba(37,99,235,0.18))' : undefined }}
                aria-hidden={!showPanels}
              >
                <p className="text-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800/95 dark:text-blue-300/95">
                    Sources
                  </span>
                  <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Peer-reviewed picks</span>
                </p>
                <InteractiveCitationsDemo variant="side-left" topicLabel={DEMO_QUERY} />
              </div>

              <div className="min-w-0 self-start">
                <div className="relative flex rounded-2xl border border-stone-200/85 dark:border-stone-600/80 bg-gradient-to-b from-stone-100/90 to-stone-100/50 dark:from-stone-800/80 dark:to-stone-900/50 p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>
                      📝
                    </span>{' '}
                    Analyze
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 bg-white dark:bg-stone-900 text-blue-800 dark:text-blue-300 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.35)] border border-blue-200/70 dark:border-blue-800/50 ring-1 ring-blue-500/10"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>
                      📚
                    </span>{' '}
                    Citations
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[0.65rem] font-medium text-sm transition-all duration-200 text-stone-500 dark:text-stone-400"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>
                      📦
                    </span>{' '}
                    Study Pack
                  </button>
                </div>
              </div>

              <div
                className={`hidden lg:block relative self-end justify-self-end w-[236px] xl:w-[248px] pointer-events-auto z-[5] transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                  showPanels
                    ? 'opacity-100 translate-y-0 translate-x-0 scale-100 rotate-[11deg] blur-0'
                    : 'opacity-0 translate-y-8 translate-x-3 scale-[0.94] rotate-[14deg] blur-[1px] pointer-events-none'
                }`}
                style={{
                  transitionDelay: showPanels ? '90ms' : '0ms',
                  filter: showPanels ? 'drop-shadow(0 22px 40px rgba(37,99,235,0.16))' : undefined,
                }}
                aria-hidden={!showPanels}
              >
                <p className="text-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800/95 dark:text-blue-300/95">
                    Export
                  </span>
                  <span className="block text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">APA · MLA · Chicago</span>
                </p>
                <InteractiveCitationsDemo variant="side-right" />
              </div>
            </div>

            <div className="lg:hidden -mb-2 sm:-mb-3 mt-6 sm:mt-8 flex flex-row justify-between items-end gap-3 sm:gap-4 px-1">
              <div
                className={`w-[min(46%,220px)] shrink-0 origin-bottom-left transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] -rotate-[8deg] ${
                  showPanels ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
                }`}
                style={{ filter: showPanels ? 'drop-shadow(0 16px 28px rgba(37,99,235,0.15))' : undefined }}
              >
                <InteractiveCitationsDemo variant="side-left" topicLabel={DEMO_QUERY} />
              </div>
              <div
                className={`w-[min(46%,220px)] shrink-0 origin-bottom-right transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] rotate-[8deg] ${
                  showPanels ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
                }`}
                style={{ transitionDelay: showPanels ? '90ms' : '0ms', filter: showPanels ? 'drop-shadow(0 16px 28px rgba(37,99,235,0.14))' : undefined }}
              >
                <InteractiveCitationsDemo variant="side-right" />
              </div>
            </div>

            <div
              ref={demoStageRef}
              className="relative mb-2 max-w-3xl mx-auto -mt-8 sm:-mt-10 lg:-mt-14 xl:-mt-16 z-20 overflow-visible"
            >
              {showCursor && (
                <div
                  className="pointer-events-none absolute z-[45] transition-[left,top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,top,transform]"
                  style={{
                    left: `${cursorPct.x}%`,
                    top: `${cursorPct.y}%`,
                    transform: cursorClicking
                      ? 'translate(-2px, -2px) scale(0.9)'
                      : 'translate(-2px, -2px) scale(1)',
                  }}
                  aria-hidden
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
                    aria-hidden
                  >
                    <path
                      d="M4.5 2.2L4.5 17.5L8.2 14.1L10.8 19.2L13.5 18.1L10.9 12.8L17.2 10.5L4.5 2.2Z"
                      className="fill-stone-900 dark:fill-stone-50"
                      stroke="white"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <div
                className={`relative rounded-2xl border transition-all duration-500 bg-white dark:bg-stone-900/50 ${
                  isSearching
                    ? 'border-blue-400/70 dark:border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_20px_50px_-20px_rgba(37,99,235,0.35)] ring-2 ring-blue-400/20'
                    : isFieldActive
                      ? 'border-blue-300/60 dark:border-blue-600/40 shadow-[0_12px_40px_-18px_rgba(37,99,235,0.2)]'
                      : 'border-blue-200/90 dark:border-blue-800/55 shadow-md shadow-stone-900/5'
                }`}
              >
                {isSearching && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden" aria-hidden>
                    <div
                      className="absolute inset-y-0 w-[55%] bg-gradient-to-r from-transparent via-blue-400/25 to-transparent motion-reduce:hidden"
                      style={{
                        left: '-55%',
                        animation: 'landingCiteShimmer 1.85s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}
                <div className="relative rounded-[14px] sm:rounded-[18px] bg-white/98 dark:bg-stone-800/95 backdrop-blur-sm min-h-[120px] sm:min-h-[160px]">
                  <textarea
                    ref={textareaRef}
                    value={typed}
                    readOnly
                    placeholder="Enter your research topic to find academic sources..."
                    className="relative w-full min-h-[120px] sm:min-h-[160px] max-h-[220px] overflow-y-auto p-4 sm:p-6 pr-8 text-stone-800 dark:text-stone-100 text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 leading-relaxed"
                    aria-label="Demo search topic (illustration)"
                  />
                  <div className="absolute bottom-4 left-5 text-xs sm:text-sm text-stone-400 dark:text-stone-500 font-medium tabular-nums">
                    {typed.length} characters
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-7">
                <button
                  ref={findSourcesBtnRef}
                  type="button"
                  disabled={buttonDisabled}
                  className={`group relative px-8 sm:px-10 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300 font-semibold text-base min-w-[220px] overflow-hidden ${
                    buttonFilled || isSearching
                      ? 'bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.55)] ring-1 ring-blue-400/30 hover:brightness-105 active:scale-[0.98]'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                  } ${
                    phase === 'cursor-to-button' || phase === 'click-button'
                      ? 'ring-2 ring-blue-400/40 ring-offset-2 ring-offset-white dark:ring-offset-stone-900'
                      : ''
                  }`}
                  aria-busy={isSearching}
                >
                  {(phase === 'cursor-to-button' || phase === 'click-button') && (
                    <span
                      className="absolute inset-0 bg-blue-400/20 animate-ping rounded-2xl opacity-40"
                      aria-hidden
                    />
                  )}
                  {isSearching ? (
                    <>
                      <svg
                        className="relative w-5 h-5 shrink-0 motion-safe:animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="relative">Finding sources…</span>
                    </>
                  ) : (
                    <span className="relative">Find Sources</span>
                  )}
                </button>
              </div>
            </div>

            <div className="relative space-y-4 pt-3 max-w-3xl mx-auto">
              <div className="flex justify-center gap-3 flex-wrap pointer-events-none opacity-95">
                <div className="px-4 py-2.5 rounded-2xl border border-stone-200/85 dark:border-stone-600/80 bg-white/95 dark:bg-stone-800/90 text-sm font-semibold text-stone-700 dark:text-stone-200 shadow-sm">
                  APA 7th
                </div>
                <div className="px-4 py-2.5 rounded-2xl border border-stone-200/85 dark:border-stone-600/80 bg-white/95 dark:bg-stone-800/90 text-sm font-semibold text-stone-700 dark:text-stone-200 shadow-sm">
                  All years
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_TOPICS.map((topic) => {
                  const isDemo = topic === DEMO_QUERY;
                  return (
                    <span
                      key={topic}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors duration-500 ${
                        isDemo && showPanels
                          ? 'border-blue-400/90 bg-gradient-to-b from-blue-50 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm'
                          : 'border-stone-200/90 dark:border-stone-600 text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {topic}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <LandingCitationResultsPreview />

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => onNavigate('citations')}
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 shadow-[0_14px_36px_-10px_rgba(37,99,235,0.55)] hover:brightness-105 active:scale-[0.98] transition-all ring-1 ring-blue-400/25"
          >
            Open citation finder
          </button>
          <button
            type="button"
            onClick={replay}
            className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline underline-offset-4"
          >
            Restart demo
          </button>
        </div>
        </LandingScrollReveal>
      </div>

      <style>{`
        @keyframes landingCiteShimmer {
          0% { transform: translateX(0); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </section>
  );
}
