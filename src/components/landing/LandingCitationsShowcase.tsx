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
      className="relative py-16 sm:py-24 overflow-hidden border-t-2 border-[#E5E5E5] scroll-mt-20"
      aria-labelledby="landing-citations-showcase-heading"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <div className="absolute inset-0 bg-[#F7F7F7]" aria-hidden />

      <div ref={containerRef} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-1.5 mb-5 rounded-full bg-[#DDF4FF] border-2 border-[#1CB0F6] px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-[#1CB0F6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#1CB0F6]">
              APA, MLA, Chicago &amp; more
            </span>
          </div>
          <h2
            id="landing-citations-showcase-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] tracking-tight leading-[1.08] mb-5"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Find{' '}
            <span className="text-[#1CB0F6]">
              academic sources
            </span>{' '}
            in seconds
          </h2>
          <p className="text-base sm:text-xl text-[#777777] leading-relaxed max-w-2xl mx-auto font-normal mb-4">
            Not just feedback on drafts — search real literature, then copy APA, MLA, or Chicago in one tap. Peer-reviewed
            picks, filter by year, export-ready references.
          </p>
          <FeatureTickRow items={['APA', 'MLA', 'Chicago', 'Peer-reviewed', 'Export-ready']} />
          <p className="text-xs text-[#AFAFAF] mt-3 min-h-[1.25rem]" aria-live="polite">
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

        <div className="relative rounded-2xl overflow-hidden border-2 border-b-4 border-[#E5E5E5] bg-white">
          <div
            className="h-1.5 w-full bg-[#1CB0F6]"
            aria-hidden
          />
          <div className="relative rounded-b-2xl bg-white p-4 sm:p-10">

            <div className="relative lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,48rem)_minmax(0,220px)] lg:gap-8 xl:gap-10 lg:items-stretch">
              <div
                className={`hidden lg:block relative self-end justify-self-start w-[236px] xl:w-[248px] pointer-events-auto z-[5] transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                  showPanels
                    ? 'opacity-100 translate-y-0 translate-x-0 scale-100 -rotate-[11deg] blur-0'
                    : 'opacity-0 translate-y-8 translate-x-[-12px] scale-[0.94] -rotate-[14deg] blur-[1px] pointer-events-none'
                }`}
                style={{ filter: showPanels ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.08))' : undefined }}
                aria-hidden={!showPanels}
              >
                <p className="text-center mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1CB0F6]">
                    Sources
                  </span>
                  <span className="block text-[10px] text-[#AFAFAF] font-extrabold mt-0.5">Peer-reviewed picks</span>
                </p>
                <InteractiveCitationsDemo variant="side-left" topicLabel={DEMO_QUERY} />
              </div>

              <div className="min-w-0 self-start">
                <div className="relative flex rounded-2xl bg-[#F7F7F7] p-1 mb-1 sm:mb-1.5 max-w-lg mx-auto border-2 border-[#E5E5E5]">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 text-[#AFAFAF]"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>📝</span>{' '}
                    Analyze Text
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 text-[#AFAFAF]"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>📦</span>{' '}
                    Study Tools
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200 bg-white text-[#1CB0F6] border-2 border-b-4 border-[#1899D6]"
                    tabIndex={-1}
                  >
                    <span className="text-base" aria-hidden>📚</span>{' '}
                    Citations
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
                  filter: showPanels ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.08))' : undefined,
                }}
                aria-hidden={!showPanels}
              >
                <p className="text-center mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1CB0F6]">
                    Export
                  </span>
                  <span className="block text-[10px] text-[#AFAFAF] font-extrabold mt-0.5">APA · MLA · Chicago</span>
                </p>
                <InteractiveCitationsDemo variant="side-right" />
              </div>
            </div>

            <div className="lg:hidden -mb-2 sm:-mb-3 mt-6 sm:mt-8 flex flex-row justify-between items-end gap-3 sm:gap-4 px-1">
              <div
                className={`w-[min(46%,220px)] shrink-0 origin-bottom-left transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] -rotate-[8deg] ${
                  showPanels ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
                }`}
                style={{ filter: showPanels ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.08))' : undefined }}
              >
                <InteractiveCitationsDemo variant="side-left" topicLabel={DEMO_QUERY} />
              </div>
              <div
                className={`w-[min(46%,220px)] shrink-0 origin-bottom-right transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] rotate-[8deg] ${
                  showPanels ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
                }`}
                style={{ transitionDelay: showPanels ? '90ms' : '0ms', filter: showPanels ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.08))' : undefined }}
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
                      className="fill-[#3C3C3C]"
                      stroke="white"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <div
                className={`relative rounded-2xl border-2 transition-all duration-500 bg-white ${
                  isSearching
                    ? 'border-[#1CB0F6] border-b-4 ring-2 ring-[#1CB0F6]/20'
                    : isFieldActive
                      ? 'border-[#1CB0F6] border-b-4'
                      : 'border-[#E5E5E5] border-b-4'
                }`}
              >
                {isSearching && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden" aria-hidden>
                    <div
                      className="absolute inset-y-0 w-[55%] bg-[#1CB0F6]/15 motion-reduce:hidden"
                      style={{
                        left: '-55%',
                        animation: 'landingCiteShimmer 1.85s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}
                <div className="relative rounded-2xl bg-white min-h-[120px] sm:min-h-[160px]">
                  <textarea
                    ref={textareaRef}
                    value={typed}
                    readOnly
                    placeholder="Enter your research topic to find academic sources..."
                    className="relative w-full min-h-[120px] sm:min-h-[160px] max-h-[220px] overflow-y-auto p-4 sm:p-6 pr-8 text-[#3C3C3C] text-[15px] sm:text-lg bg-transparent border-none outline-none resize-none placeholder-[#AFAFAF] leading-relaxed font-extrabold"
                    aria-label="Demo search topic (illustration)"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  />
                  <div className="absolute bottom-4 left-5 text-xs sm:text-sm text-[#AFAFAF] font-extrabold tabular-nums">
                    {typed.length} characters
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-7">
                <button
                  ref={findSourcesBtnRef}
                  type="button"
                  disabled={buttonDisabled}
                  className={`group relative px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 font-extrabold text-base min-w-[220px] overflow-hidden border-2 border-b-4 ${
                    buttonFilled || isSearching
                      ? 'bg-[#1CB0F6] text-white border-[#1899D6] active:border-b-2 active:translate-y-0.5'
                      : 'bg-[#E5E5E5] text-[#AFAFAF] border-[#CECECE] cursor-not-allowed'
                  } ${
                    phase === 'cursor-to-button' || phase === 'click-button'
                      ? 'ring-2 ring-[#1CB0F6]/40 ring-offset-2 ring-offset-white'
                      : ''
                  }`}
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  aria-busy={isSearching}
                >
                  {(phase === 'cursor-to-button' || phase === 'click-button') && (
                    <span
                      className="absolute inset-0 bg-[#1CB0F6]/20 animate-ping rounded-xl opacity-40"
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
              <div className="flex justify-center gap-3 flex-wrap pointer-events-none">
                <div className="px-4 py-2.5 rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-white text-sm font-extrabold text-[#3C3C3C]">
                  APA 7th
                </div>
                <div className="px-4 py-2.5 rounded-xl border-2 border-b-4 border-[#E5E5E5] bg-white text-sm font-extrabold text-[#3C3C3C]">
                  All years
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_TOPICS.map((topic) => {
                  const isDemo = topic === DEMO_QUERY;
                  return (
                    <span
                      key={topic}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-extrabold transition-colors duration-500 ${
                        isDemo && showPanels
                          ? 'border-[#1CB0F6] bg-[#DDF4FF] text-[#1CB0F6]'
                          : 'border-[#E5E5E5] text-[#AFAFAF]'
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
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-extrabold text-white bg-[#58CC02] border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Open citation finder
          </button>
          <button
            type="button"
            onClick={replay}
            className="text-sm font-extrabold text-[#1CB0F6] hover:underline underline-offset-4"
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
