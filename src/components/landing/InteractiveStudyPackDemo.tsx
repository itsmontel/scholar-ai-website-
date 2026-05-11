import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type Tab = 'flashcards' | 'quiz' | 'lesson';

export type GeneratedPack = {
  flashcards: { front: string; back: string }[];
  lesson: string[];
  quiz: { question: string; options: string[]; correctIndex: number; correctReason: string };
};

const MIN_CHARS = 48;

/** Demo text typed by the fake cursor (~400 chars): three flashcards, quiz, and lesson bullets. */
export const STUDY_PACK_DEMO_NOTES = `Photosynthesis converts light energy into chemical energy inside chloroplasts in plant cells. Chlorophyll absorbs mostly blue and red light while reflecting green, which is why leaves look green to us. The Calvin cycle uses ATP and NADPH to fix carbon dioxide into sugars through RuBisCO. Stomata on leaf surfaces regulate gas exchange so CO2 can enter while water loss is managed.`;

function shuffleWithCorrect(items: string[], correctIndex: number): { items: string[]; correctIndex: number } {
  const indexed = items.map((item, i) => ({ item, i }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const newCorrect = indexed.findIndex((x) => x.i === correctIndex);
  return { items: indexed.map((x) => x.item), correctIndex: newCorrect };
}

function splitIntoSegments(raw: string): string[] {
  const cleaned = raw.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  let parts = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 24);

  if (parts.length >= 3) return parts.slice(0, 8);

  if (parts.length === 2 && cleaned.length >= MIN_CHARS) {
    const mid = Math.floor(cleaned.length / 2);
    const extra = cleaned.slice(mid).trim();
    if (extra.length >= 24) parts = [parts[0], parts[1], extra];
  }

  if (parts.length < 3) {
    const flat = cleaned;
    const n = 3;
    const step = Math.floor(flat.length / n);
    parts = [];
    for (let i = 0; i < n; i++) {
      const chunk = flat.slice(i * step, i === n - 1 ? flat.length : (i + 1) * step).trim();
      if (chunk.length >= 20) parts.push(chunk);
    }
  }

  return parts.slice(0, 8).filter((p) => p.length >= 20);
}

function truncateWords(s: string, maxWords: number): string {
  const w = s.split(/\s+/).filter(Boolean);
  if (w.length <= maxWords) return s;
  return `${w.slice(0, maxWords).join(' ')}…`;
}

/** Picks a concrete quiz prompt from the first segments so the question reads like a real check, not placeholder copy. */
function quizQuestionFromSegments(primary: string[]): string {
  const s0 = (primary[0] || '').toLowerCase();
  if (/\bchloroplast/.test(s0) && /\bphotosynthesis/.test(s0)) {
    return 'According to your notes, where does photosynthesis convert light energy into chemical energy in plant cells?';
  }
  if (/\bchlorophyll\b/.test(s0)) {
    return 'According to your notes, why do leaves often appear green?';
  }
  if (/\bcalvin cycle|rubisco|fix\s+carbon|carbon dioxide\b/i.test(s0)) {
    return 'According to your notes, what does the Calvin cycle use ATP and NADPH to do?';
  }
  if (/\blight-dependent|atp\b.*\bnadph|split\s+water/i.test(s0)) {
    return 'According to your notes, what do the light-dependent reactions produce for the Calvin cycle?';
  }
  if (/\bstomata|gas exchange|co2\b/i.test(s0)) {
    return 'According to your notes, what do stomata regulate on the leaf surface?';
  }
  return 'Which option best matches the first main idea you captured from your notes?';
}

/** Short explanation of why the keyed correct option matches the question (demo / study-pack UX). */
function quizCorrectReasonFromSegments(primary: string[]): string {
  const s0 = (primary[0] || '').toLowerCase();
  if (/\bchloroplast/.test(s0) && /\bphotosynthesis/.test(s0)) {
    return 'Your notes state that photosynthesis turns light energy into chemical energy inside chloroplasts, so that sentence answers where that conversion happens in plant cells.';
  }
  if (/\bchlorophyll\b/.test(s0)) {
    return 'Your notes tie leaf colour to chlorophyll absorbing blue and red light while reflecting green, which matches this answer.';
  }
  if (/\bcalvin cycle|rubisco|fix\s+carbon|carbon dioxide\b/i.test(s0)) {
    return 'Your notes describe the Calvin cycle using ATP and NADPH to fix carbon dioxide into sugars, which is what this option captures.';
  }
  if (/\blight-dependent|atp\b.*\bnadph|split\s+water/i.test(s0)) {
    return 'Your notes say the light-dependent reactions supply ATP and NADPH for the Calvin cycle, which matches this choice.';
  }
  if (/\bstomata|gas exchange|co2\b/i.test(s0)) {
    return 'Your notes connect stomata to gas exchange (including CO₂), which is what this answer reflects.';
  }
  return 'This option matches the first main idea you wrote in your notes, so it fits the question.';
}

export function buildStudyPackFromNotes(raw: string, opts?: { shuffleQuiz?: boolean }): GeneratedPack | null {
  const segments = splitIntoSegments(raw);
  if (segments.length < 1) return null;

  const primary = segments.slice(0, 3);
  while (primary.length < 3) {
    primary.push(primary[0] || raw.slice(0, 120));
  }

  const flashcards = primary.map((back, i) => ({
    front: `Recall point ${i + 1}: ${truncateWords(back, 10)}`,
    back,
  }));

  const lesson = segments.slice(0, Math.min(6, segments.length));

  const distractors = [
    'This line did not appear in the notes you pasted.',
    'Check the syllabus for learning outcomes.',
    'Skim the chapter intro and try again.',
  ];

  const optionsRaw = [primary[0], ...primary.slice(1), ...distractors].slice(0, 4);
  let options: string[];
  let correctIndex: number;
  if (opts?.shuffleQuiz === false) {
    options = optionsRaw.slice(0, 4);
    correctIndex = 0;
  } else {
    const shuffled = shuffleWithCorrect(optionsRaw, 0);
    options = shuffled.items;
    correctIndex = shuffled.correctIndex;
  }

  return {
    flashcards,
    lesson,
    quiz: {
      question: quizQuestionFromSegments(primary),
      options,
      correctIndex,
      correctReason: quizCorrectReasonFromSegments(primary),
    },
  };
}

export type InteractiveStudyPackDemoVariant = 'full' | 'side-left' | 'side-right';

const defaultPackStatic = buildStudyPackFromNotes(STUDY_PACK_DEMO_NOTES)!;

/* --- Automated demo timings (interactive video) --- */
const TYPE_MS = 17;
const MOVE_CURSOR_MS = 520;
const CLICK_CURSOR_MS = 170;
const CURSOR_INTRO_MS = 90;
const POST_TYPE_MS = 380;
const LOADING_MS = 2100;
/** Time after lesson before full demo restarts (lets user read). */
const LOOP_AFTER_LESSON_MS = 5500;
const FLIP_DELAY_MS = 1050;
/** Time each card stays on the answer side before advancing (or before quiz on the last card). */
const FLASHCARD_READ_MS = 2650;
const QUIZ_SHOW_DELAY_MS = 650;
/** Fake cursor pauses on a wrong option before moving to the correct answer. */
const QUIZ_HOVER_WRONG_MS = 520;
const QUIZ_MOVE_TO_ANSWER_MS = 600;
const AFTER_QUIZ_REVEAL_MS = 3200;

type CursorPct = { x: number; y: number };

function cursorPctFromElement(stage: HTMLElement, el: HTMLElement): CursorPct {
  const s = stage.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const w = Math.max(s.width, 1);
  const h = Math.max(s.height, 1);
  return {
    x: ((b.left + b.width / 2 - s.left) / w) * 100,
    y: ((b.top + b.height / 2 - s.top) / h) * 100,
  };
}

const DEFAULT_ANCHORS: { start: CursorPct; input: CursorPct; inputRest: CursorPct; button: CursorPct } = {
  start: { x: 88, y: 10 },
  input: { x: 48, y: 38 },
  inputRest: { x: 58, y: 52 },
  button: { x: 52, y: 88 },
};

type DemoPhase =
  | 'idle'
  | 'cursor-to-textarea'
  | 'click-textarea'
  | 'typing'
  | 'cursor-to-button'
  | 'click-button'
  | 'loading'
  | 'ready';

function SideLeftFlashcard({ card }: { card: { front: string; back: string } }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1CB0F6] mb-2 text-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Flashcards</p>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="relative w-full min-h-[120px] rounded-xl border-2 border-b-4 border-[#1CB0F6]/40 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 p-3 transition-transform duration-300 hover:scale-[1.01] active:border-b-2 active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
      >
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#1CB0F6] mb-1">{flipped ? 'Answer' : 'Prompt'}</p>
        <p className="text-[11px] text-[#3C3C3C] dark:text-white leading-snug text-center line-clamp-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{flipped ? card.back : card.front}</p>
        <p className="text-[9px] text-[#1CB0F6] mt-2 text-center font-bold">Tap to flip</p>
      </button>
    </div>
  );
}

function SideQuiz({ quiz }: { quiz: GeneratedPack['quiz'] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#58CC02] mb-2 text-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Quiz</p>
      <div className="rounded-xl border-2 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-2">
        <p className="text-[11px] font-extrabold text-[#3C3C3C] dark:text-white mb-2 leading-snug line-clamp-4" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{quiz.question}</p>
        <div className="space-y-1.5">
          {quiz.options.slice(0, 3).map((opt, i) => {
            const isSel = selected === i;
            const isCorrect = i === quiz.correctIndex;
            const reveal = showAnswer;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setSelected(i);
                  setShowAnswer(true);
                }}
                className={`w-full text-left text-[10px] px-2 py-1.5 rounded-lg border-2 border-b-[3px] transition-all active:border-b-2 active:translate-y-0.5 ${
                  reveal && isCorrect
                    ? 'border-[#58CC02] bg-[#E5F8D0] text-[#58CC02]'
                    : reveal && isSel && !isCorrect
                      ? 'border-[#FF4B4B] bg-[#FFE8E8] text-[#FF4B4B]'
                      : isSel
                        ? 'border-[#1CB0F6] bg-[#DDF4FF]'
                        : 'border-[#E5E5E5] dark:border-[#4A4A4A] hover:border-[#1CB0F6]/50'
                }`}
              >
                <span className="font-extrabold text-[#AFAFAF] dark:text-stone-400 mr-1">{String.fromCharCode(65 + i)}.</span>
                <span className="line-clamp-2">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InteractiveStudyPackFull() {
  const stageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const quizStageRef = useRef<HTMLDivElement>(null);
  const quizOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const anchorsRef = useRef(DEFAULT_ANCHORS);
  const timersRef = useRef<number[]>([]);
  const sequenceTimersRef = useRef<number[]>([]);
  const typeIntervalRef = useRef<number | null>(null);
  const typedRef = useRef('');
  const phaseRef = useRef<DemoPhase>('idle');
  const inViewRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const runDemoRef = useRef<() => void>(() => {});
  const walkthroughEpochRef = useRef(0);

  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [typed, setTyped] = useState('');
  const [cursorPct, setCursorPct] = useState<CursorPct>(DEFAULT_ANCHORS.start);
  const [cursorClicking, setCursorClicking] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [pack, setPack] = useState<GeneratedPack | null>(null);
  const [tab, setTab] = useState<Tab>('flashcards');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [walkthroughLock, setWalkthroughLock] = useState(false);
  const [showQuizCursor, setShowQuizCursor] = useState(false);

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

  const clearSequenceTimers = () => {
    sequenceTimersRef.current.forEach((id) => clearTimeout(id));
    sequenceTimersRef.current = [];
  };

  const pushSequenceTimer = (id: number) => {
    sequenceTimersRef.current.push(id);
  };

  const clearAll = () => {
    clearTimers();
    clearTypeInterval();
    clearSequenceTimers();
  };

  const isActive = useCallback(
    () => inViewRef.current && typeof document !== 'undefined' && document.visibilityState === 'visible',
    []
  );

  const autosizeDemoTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.58 : 680, 680);
    const min = 140;
    const h = Math.max(el.scrollHeight, min);
    const next = Math.min(h, max);
    el.style.height = `${next}px`;
    el.style.overflowY = h > max ? 'auto' : 'hidden';
  }, []);

  const measureCursorAnchors = useCallback(() => {
    const stage = stageRef.current;
    const ta = textareaRef.current;
    const btn = buttonRef.current;
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
      start: pct(s.right - 36, s.top + 24),
      input: pct(taR.left + taR.width * 0.25, taR.top + taR.height * 0.35),
      inputRest: pct(taR.left + taR.width * 0.72, taR.top + taR.height * 0.55),
      button: pct(bR.left + bR.width / 2, bR.top + bR.height / 2),
    };
  }, []);

  useLayoutEffect(() => {
    if (phase === 'ready' || phase === 'loading') return;
    autosizeDemoTextarea();
    measureCursorAnchors();
  }, [typed, phase, autosizeDemoTextarea, measureCursorAnchors]);

  useLayoutEffect(() => {
    if (phase === 'ready' || phase === 'loading') return;
    measureCursorAnchors();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      autosizeDemoTextarea();
      measureCursorAnchors();
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [phase, measureCursorAnchors, autosizeDemoTextarea]);

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

  const beginAfterTyping = useCallback(() => {
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
                setPhase('loading');
                phaseRef.current = 'loading';
                pushTimer(
                  window.setTimeout(() => {
                    if (!isActive()) return;
                    const next = buildStudyPackFromNotes(STUDY_PACK_DEMO_NOTES, { shuffleQuiz: false });
                    if (next) {
                      setPack(next);
                      setCardIdx(0);
                      setFlipped(false);
                      setSelected(null);
                      setShowAnswer(false);
                      setTab('flashcards');
                    }
                    setPhase('ready');
                    phaseRef.current = 'ready';
                  }, LOADING_MS)
                );
              }, CLICK_CURSOR_MS)
            );
          }, MOVE_CURSOR_MS)
        );
      }, POST_TYPE_MS)
    );
  }, [isActive, measureCursorAnchors]);

  const runDemo = useCallback(() => {
    if (!isActive()) return;
    clearAll();
    setTyped('');
    typedRef.current = '';
    setShowQuizCursor(false);
    measureCursorAnchors();

    if (reduceMotionRef.current) {
      setShowCursor(false);
      setTyped(STUDY_PACK_DEMO_NOTES);
      typedRef.current = STUDY_PACK_DEMO_NOTES;
      setPhase('loading');
      phaseRef.current = 'loading';
      pushTimer(
        window.setTimeout(() => {
          if (!isActive()) return;
          const next = buildStudyPackFromNotes(STUDY_PACK_DEMO_NOTES, { shuffleQuiz: false });
          if (next) {
            setPack(next);
            setTab('flashcards');
            setPhase('ready');
            phaseRef.current = 'ready';
          }
        }, 400)
      );
      return;
    }

    setShowCursor(true);
    setCursorClicking(false);
    setCursorPct(anchorsRef.current.start);
    setPhase('cursor-to-textarea');
    phaseRef.current = 'cursor-to-textarea';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCursorPct(anchorsRef.current.input);
      });
    });

    pushTimer(
      window.setTimeout(() => {
        if (!isActive()) return;
        setPhase('click-textarea');
        phaseRef.current = 'click-textarea';
        setCursorClicking(true);
        pushTimer(
          window.setTimeout(() => {
            if (!isActive()) return;
            setCursorClicking(false);
            setPhase('typing');
            phaseRef.current = 'typing';
            setCursorPct(anchorsRef.current.inputRest);

            const chars = [...STUDY_PACK_DEMO_NOTES];
            let i = 0;
            typeIntervalRef.current = window.setInterval(() => {
              if (!isActive()) return;
              i += 1;
              const next = chars.slice(0, i).join('');
              setTyped(next);
              typedRef.current = next;
              if (i >= chars.length) {
                clearTypeInterval();
                beginAfterTyping();
              }
            }, TYPE_MS);
          }, CLICK_CURSOR_MS)
        );
      }, CURSOR_INTRO_MS + MOVE_CURSOR_MS)
    );
  }, [isActive, measureCursorAnchors, beginAfterTyping]);

  runDemoRef.current = runDemo;

  /** Stop timers and reset when the demo scrolls off-screen or the tab is hidden (no background playback). */
  const pauseDemo = useCallback(() => {
    walkthroughEpochRef.current += 1;
    clearAll();
    setWalkthroughLock(false);
    setShowQuizCursor(false);
    setShowCursor(false);
    setCursorClicking(false);
    setTyped('');
    typedRef.current = '';
    setPack(null);
    setPhase('idle');
    phaseRef.current = 'idle';
    setTab('flashcards');
    setCardIdx(0);
    setFlipped(false);
    setSelected(null);
    setShowAnswer(false);
  }, []);

  /** After pack is ready: flip flashcard → quiz (auto-pick correct) → lesson → loop. */
  useEffect(() => {
    if (phase !== 'ready' || !pack) return;
    const epoch = ++walkthroughEpochRef.current;
    const q = pack.quiz;

    const stale = () => walkthroughEpochRef.current !== epoch || !inViewRef.current;

    setWalkthroughLock(true);
    setShowQuizCursor(false);
    setTab('flashcards');
    setCardIdx(0);
    setFlipped(false);
    setSelected(null);
    setShowAnswer(false);

    const scheduleLoop = () => {
      if (stale()) return;
      setShowQuizCursor(false);
      setWalkthroughLock(false);
      clearAll();
      setTyped('');
      typedRef.current = '';
      setPack(null);
      setPhase('idle');
      phaseRef.current = 'idle';
      runDemoRef.current();
    };

    const nCards = Math.min(3, pack.flashcards.length);
    const flashPhaseMs = nCards * FLIP_DELAY_MS + nCards * FLASHCARD_READ_MS;

    if (reduceMotionRef.current) {
      for (let i = 0; i < nCards; i++) {
        pushSequenceTimer(
          window.setTimeout(() => {
            if (stale()) return;
            setCardIdx(i);
            setFlipped(true);
          }, 200 * i)
        );
      }
      pushSequenceTimer(
        window.setTimeout(() => {
          if (stale()) return;
          setTab('quiz');
          setSelected(q.correctIndex);
          setShowAnswer(true);
          pushSequenceTimer(
            window.setTimeout(() => {
              if (stale()) return;
              setTab('lesson');
              pushSequenceTimer(
                window.setTimeout(() => {
                  if (stale()) return;
                  scheduleLoop();
                }, 5000)
              );
            }, 500)
          );
        }, 200 * nCards + 150)
      );
      return () => {
        walkthroughEpochRef.current += 1;
        clearSequenceTimers();
      };
    }

    for (let k = 0; k < nCards; k++) {
      const tFlip = k * (FLASHCARD_READ_MS + FLIP_DELAY_MS) + FLIP_DELAY_MS;
      pushSequenceTimer(
        window.setTimeout(() => {
          if (stale()) return;
          setCardIdx(k);
          setFlipped(true);
        }, tFlip)
      );
      if (k < nCards - 1) {
        const tNext = (k + 1) * (FLASHCARD_READ_MS + FLIP_DELAY_MS);
        pushSequenceTimer(
          window.setTimeout(() => {
            if (stale()) return;
            setCardIdx(k + 1);
            setFlipped(false);
          }, tNext)
        );
      }
    }

    const tQuizTab = flashPhaseMs;
    const tLesson =
      tQuizTab +
      QUIZ_SHOW_DELAY_MS +
      QUIZ_HOVER_WRONG_MS +
      QUIZ_MOVE_TO_ANSWER_MS +
      CLICK_CURSOR_MS +
      AFTER_QUIZ_REVEAL_MS;
    const tLoop = tLesson + LOOP_AFTER_LESSON_MS;
    const wrongIdx = [0, 1, 2, 3].find((i) => i !== q.correctIndex) ?? 1;

    pushSequenceTimer(
      window.setTimeout(() => {
        if (stale()) return;
        setTab('quiz');
        setSelected(null);
        setShowAnswer(false);
        pushSequenceTimer(
          window.setTimeout(() => {
            if (stale()) return;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (stale()) return;
                const stage = quizStageRef.current;
                const wrongEl = quizOptionRefs.current[wrongIdx];
                const correctEl = quizOptionRefs.current[q.correctIndex];
                if (!stage || !wrongEl || !correctEl) {
                  setSelected(q.correctIndex);
                  setShowAnswer(true);
                  return;
                }
                setShowQuizCursor(true);
                setCursorClicking(false);
                setCursorPct(cursorPctFromElement(stage, wrongEl));
                pushSequenceTimer(
                  window.setTimeout(() => {
                    if (stale()) return;
                    setCursorPct(cursorPctFromElement(stage, correctEl));
                    pushSequenceTimer(
                      window.setTimeout(() => {
                        if (stale()) return;
                        setCursorClicking(true);
                        pushSequenceTimer(
                          window.setTimeout(() => {
                            if (stale()) return;
                            setSelected(q.correctIndex);
                            setShowAnswer(true);
                            setCursorClicking(false);
                          }, CLICK_CURSOR_MS)
                        );
                      }, QUIZ_MOVE_TO_ANSWER_MS)
                    );
                  }, QUIZ_HOVER_WRONG_MS)
                );
              });
            });
          }, QUIZ_SHOW_DELAY_MS)
        );
      }, tQuizTab)
    );

    pushSequenceTimer(
      window.setTimeout(() => {
        if (stale()) return;
        setTab('lesson');
        setShowQuizCursor(false);
      }, tLesson)
    );

    pushSequenceTimer(
      window.setTimeout(() => {
        if (stale()) return;
        scheduleLoop();
      }, tLoop)
    );

    return () => {
      walkthroughEpochRef.current += 1;
      clearSequenceTimers();
    };
  }, [phase, pack]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      inViewRef.current = true;
      const t = window.setTimeout(() => runDemo(), 600);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        const inView = e.isIntersecting && e.intersectionRatio > 0.12;
        inViewRef.current = inView;
        if (!inView) {
          pauseDemo();
          return;
        }
        if (phaseRef.current === 'idle' && !timersRef.current.length) {
          runDemo();
        }
      },
      { threshold: [0, 0.12, 0.25] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [runDemo, pauseDemo]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseDemo();
        return;
      }
      if (document.visibilityState === 'visible' && inViewRef.current && phaseRef.current === 'idle' && !timersRef.current.length) {
        runDemo();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [runDemo, pauseDemo]);

  const replay = useCallback(() => {
    pauseDemo();
    setTimeout(() => runDemo(), 200);
  }, [pauseDemo, runDemo]);

  const cards = pack?.flashcards ?? [];
  const lessonLines = pack?.lesson ?? [];
  const quizData = pack?.quiz;
  const currentCard = cards[Math.min(cardIdx, Math.max(cards.length - 1, 0))];

  const isFieldActive = phase === 'click-textarea' || phase === 'typing';
  const isLoadingPhase = phase === 'loading';
  const showStage = phase !== 'ready' && phase !== 'loading';
  const demoTyping = phase === 'typing';

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="mb-1">
        <h3 className="text-lg sm:text-xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Study pack demo
        </h3>
        <p className="text-xs sm:text-sm text-[#777] dark:text-stone-400 mt-1.5 leading-relaxed font-bold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Watch the cursor paste notes, then see flashcards, a quiz, and a lesson appear. Runs in your browser only.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-4 sm:p-6">
        {isLoadingPhase && (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="relative mb-6">
              <div className="h-14 w-14 rounded-full border-4 border-[#E5E5E5] dark:border-[#4A4A4A] border-t-[#1CB0F6] motion-safe:animate-spin" />
            </div>
            <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-white" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Building your pack</p>
            <p className="text-xs text-[#AFAFAF] dark:text-stone-400 mt-1 font-bold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Flashcards, quiz, lesson</p>
          </div>
        )}

        {showStage && (
          <div ref={stageRef} className="relative overflow-visible min-h-[220px]">
            {showCursor && (
              <div
                className="pointer-events-none absolute z-[45] transition-[left,top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,top,transform]"
                style={{
                  left: `${cursorPct.x}%`,
                  top: `${cursorPct.y}%`,
                  transform: cursorClicking ? 'translate(-2px,-2px) scale(0.9)' : 'translate(-2px,-2px) scale(1)',
                }}
                aria-hidden
              >
                <svg width="28" height="28" viewBox="0 0 24 24" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" aria-hidden>
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
              className={`relative rounded-2xl border-2 border-b-4 transition-all duration-200 bg-white dark:bg-[#3C3C3C] ${
                isFieldActive
                  ? 'border-[#1CB0F6] ring-2 ring-[#1CB0F6]/30'
                  : 'border-[#E5E5E5] dark:border-[#4A4A4A]'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={typed}
                readOnly
                placeholder="Your notes appear here…"
                rows={6}
                className="relative w-full min-h-[140px] sm:min-h-[160px] rounded-2xl p-4 sm:p-5 text-[#3C3C3C] dark:text-white text-sm sm:text-[15px] bg-transparent border-none outline-none resize-none placeholder-[#AFAFAF] dark:placeholder-stone-500 leading-relaxed overflow-x-clip"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                aria-label="Demo notes (illustration)"
              />
              <div className="absolute bottom-3 right-4 text-[11px] font-extrabold tabular-nums text-[#AFAFAF] dark:text-stone-400">
                {typed.length} chars{demoTyping ? <span className="ml-1 inline-block w-1.5 h-4 bg-[#1CB0F6] motion-safe:animate-pulse align-middle rounded-sm" aria-hidden /> : null}
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                ref={buttonRef}
                type="button"
                disabled={typed.length < MIN_CHARS && phase !== 'click-button'}
                className={`group relative px-8 sm:px-10 py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-extrabold text-base min-w-[220px] overflow-hidden transition-all border-2 border-b-4 active:border-b-2 active:translate-y-0.5 ${
                  typed.length >= MIN_CHARS || phase === 'click-button' || phase === 'cursor-to-button'
                    ? 'bg-[#58CC02] border-[#46A302] text-white'
                    : 'bg-[#E5E5E5] border-[#CCCCCC] text-[#AFAFAF] cursor-not-allowed'
                } ${phase === 'cursor-to-button' || phase === 'click-button' ? 'ring-2 ring-[#58CC02]/50 ring-offset-2 ring-offset-white dark:ring-offset-[#3C3C3C]' : ''}`}
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {(phase === 'cursor-to-button' || phase === 'click-button') && (
                  <span className="absolute inset-0 bg-white/25 animate-ping rounded-xl opacity-30" aria-hidden />
                )}
                <span className="relative">Build study pack</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'ready' && pack && quizData && currentCard && (
          <div ref={quizStageRef} className="relative space-y-5 pt-1">
            {showQuizCursor && tab === 'quiz' && (
              <div
                className="pointer-events-none absolute z-[50] transition-[left,top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,top,transform]"
                style={{
                  left: `${cursorPct.x}%`,
                  top: `${cursorPct.y}%`,
                  transform: cursorClicking ? 'translate(-2px,-2px) scale(0.9)' : 'translate(-2px,-2px) scale(1)',
                }}
                aria-hidden
              >
                <svg width="28" height="28" viewBox="0 0 24 24" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" aria-hidden>
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

            <div className="flex items-center justify-between gap-2 border-b-2 border-[#E5E5E5] dark:border-[#4A4A4A] pb-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#58CC02]" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Pack ready</p>
              <button type="button" onClick={replay} className="text-xs font-extrabold text-[#1CB0F6] hover:underline" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Replay demo
              </button>
            </div>

            <div className="flex rounded-xl border-2 border-[#E5E5E5] dark:border-[#4A4A4A] bg-[#F7F7F7] dark:bg-[#2C2C2C] p-1">
              {(
                [
                  { id: 'flashcards' as const, label: 'Flashcards', color: 'bg-[#1CB0F6] border-[#1899D6]' },
                  { id: 'quiz' as const, label: 'Quiz', color: 'bg-[#58CC02] border-[#46A302]' },
                  { id: 'lesson' as const, label: 'Lesson', color: 'bg-[#FF9600] border-[#D97F00]' },
                ] as const
              ).map(({ id, label, color }) => (
                <button
                  key={id}
                  type="button"
                  disabled={walkthroughLock}
                  onClick={() => {
                    setTab(id);
                    setFlipped(false);
                    setSelected(null);
                    setShowAnswer(false);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all disabled:pointer-events-none disabled:opacity-50 ${
                    tab === id
                      ? `${color} text-white border-2 border-b-[3px]`
                      : 'text-[#AFAFAF] dark:text-stone-400 hover:text-[#3C3C3C] dark:hover:text-white'
                  }`}
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'flashcards' && (
              <div className="space-y-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1CB0F6] text-center" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  Card {cardIdx + 1} of {cards.length} · {flipped ? 'Answer' : 'Question'}
                </p>
                <button
                  type="button"
                  disabled={walkthroughLock}
                  onClick={() => !walkthroughLock && setFlipped((f) => !f)}
                  className="group relative w-full text-left focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] rounded-2xl disabled:pointer-events-none disabled:opacity-90"
                >
                  <div className="[perspective:1400px] w-full min-h-[180px]">
                    <div
                      className="relative w-full min-h-[180px] will-change-transform transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateY(${flipped ? 180 : 0}deg)`,
                      }}
                    >
                      <div
                        className="absolute inset-0 flex flex-col rounded-2xl border-2 border-b-4 border-[#1CB0F6]/50 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 p-6 [backface-visibility:hidden]"
                        style={{ transform: 'rotateY(0deg)' }}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1CB0F6] mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Question</p>
                        <p className="text-sm sm:text-[15px] text-[#3C3C3C] dark:text-white leading-relaxed flex-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{currentCard.front}</p>
                        <p className="text-xs text-[#1CB0F6] mt-4 font-bold">Tap to flip</p>
                      </div>
                      <div
                        className="absolute inset-0 flex flex-col rounded-2xl border-2 border-b-4 border-[#FF9600]/50 bg-[#FFF4E0] dark:bg-[#FF9600]/10 p-6 [backface-visibility:hidden]"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF9600] mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Answer</p>
                        <p className="text-sm sm:text-[15px] text-[#3C3C3C] dark:text-white leading-relaxed flex-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{currentCard.back}</p>
                        <p className="text-xs text-[#FF9600] mt-4 font-bold">Tap to flip back</p>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-center gap-2">
                  {cards.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Card ${i + 1}`}
                      disabled={walkthroughLock}
                      onClick={() => {
                        setCardIdx(i);
                        setFlipped(false);
                      }}
                      className={`h-2 rounded-full transition-all disabled:pointer-events-none disabled:opacity-40 ${i === cardIdx ? 'w-8 bg-[#1CB0F6]' : 'w-2 bg-[#E5E5E5] dark:bg-[#4A4A4A]'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={walkthroughLock || cardIdx <= 0}
                    onClick={() => {
                      setCardIdx((i) => Math.max(0, i - 1));
                      setFlipped(false);
                    }}
                    className="flex-1 py-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] text-sm font-extrabold text-[#3C3C3C] dark:text-white disabled:opacity-35 bg-white dark:bg-[#3C3C3C] active:border-b-2 active:translate-y-0.5 transition-all"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={walkthroughLock || cardIdx >= cards.length - 1}
                    onClick={() => {
                      setCardIdx((i) => Math.min(cards.length - 1, i + 1));
                      setFlipped(false);
                    }}
                    className="flex-1 py-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] text-sm font-extrabold text-[#3C3C3C] dark:text-white disabled:opacity-35 bg-white dark:bg-[#3C3C3C] active:border-b-2 active:translate-y-0.5 transition-all"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {tab === 'quiz' && (
              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-4 sm:p-5 motion-safe:transition-all motion-safe:duration-500">
                <p className="text-sm font-extrabold text-[#3C3C3C] dark:text-white mb-4 leading-snug" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{quizData.question}</p>
                <div className="space-y-2.5">
                  {quizData.options.map((opt, i) => {
                    const isSel = selected === i;
                    const isCorrect = i === quizData.correctIndex;
                    const reveal = showAnswer;
                    return (
                      <button
                        key={`${i}-${opt.slice(0, 24)}`}
                        type="button"
                        ref={(el) => {
                          quizOptionRefs.current[i] = el;
                        }}
                        disabled={walkthroughLock}
                        onClick={() => {
                          setSelected(i);
                          setShowAnswer(true);
                        }}
                        className={`w-full text-left text-sm px-3 py-3 rounded-xl border-2 border-b-4 motion-safe:transition-all motion-safe:duration-300 disabled:pointer-events-none active:border-b-2 active:translate-y-0.5 ${
                          reveal && isCorrect
                            ? 'border-[#58CC02] bg-[#E5F8D0] text-[#58CC02] scale-[1.02]'
                            : reveal && isSel && !isCorrect
                              ? 'border-[#FF4B4B] bg-[#FFE8E8] text-[#FF4B4B]'
                              : isSel
                                ? 'border-[#1CB0F6] bg-[#DDF4FF] text-[#1CB0F6]'
                                : 'border-[#E5E5E5] dark:border-[#4A4A4A] hover:border-[#1CB0F6]/50'
                        }`}
                        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                      >
                        <span className="font-extrabold text-[#AFAFAF] dark:text-stone-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {showAnswer && (
                  <div
                    className="mt-5 overflow-hidden rounded-xl border-2 border-[#58CC02]/40 bg-[#E5F8D0] dark:bg-[#58CC02]/10 px-4 py-3.5 animate-study-pack-quiz-feedback"
                    role="status"
                  >
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#58CC02] mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Why this is correct</p>
                    <p className="text-sm text-[#3C3C3C] dark:text-white leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{quizData.correctReason}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'lesson' && (
              <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#4A4A4A] bg-white dark:bg-[#3C3C3C] p-4 sm:p-5">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#FF9600] mb-4" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Lesson from your notes</p>
                <ul className="space-y-3">
                  {lessonLines.map((line, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#777] dark:text-stone-300 leading-relaxed" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                      <span className="shrink-0 w-8 h-8 rounded-xl bg-[#FF9600] border-2 border-b-[3px] border-[#D97F00] text-white text-xs font-extrabold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="pt-1">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InteractiveStudyPackDemo({ variant = 'full' }: { variant?: InteractiveStudyPackDemoVariant }) {
  if (variant === 'side-left') {
    return <SideLeftFlashcard card={defaultPackStatic.flashcards[0]} />;
  }
  if (variant === 'side-right') {
    return <SideQuiz quiz={defaultPackStatic.quiz} />;
  }
  return <InteractiveStudyPackFull />;
}
