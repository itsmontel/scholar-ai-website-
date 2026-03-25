import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import ScholarMascot from './ScholarMascot';
import { trackEvent } from '../../utils/analytics';

interface InteractiveTutorialProps {
  userName: string;
  onComplete: () => void;
}

type MascotPose = 'waving' | 'pointing' | 'studying' | 'celebrating' | 'default';

type ImmersiveScene =
  | 'intro'
  | 'upload'
  | 'style'
  | 'analyze'
  | 'grade'
  | 'apply'
  | 'done';

interface TutorialStep {
  id: string;
  /** Full-screen scripted demo (no DOM spotlight) */
  immersive?: ImmersiveScene;
  /** Spotlight a real dashboard element */
  targetSelector: string | null;
  mobileTargetSelector?: string;
  title: string;
  body: string;
  emoji: string;
  mascotPose: MascotPose;
  spotlightPadding?: number;
  confetti?: boolean;
}

const REVISION_MARK_CLASS =
  'bg-violet-200/95 dark:bg-violet-900/50 text-violet-950 dark:text-violet-50 px-0.5 rounded-sm ring-2 ring-violet-500/80 dark:ring-violet-400/60 shadow-sm ring-offset-1 ring-offset-white dark:ring-offset-stone-900 [box-decoration-break:clone]';

/** Long excerpt: amber “improve” and red “concern” spans; each revision replaces only its span. */
const DEMO_PREFIX =
  "Harvey Dent's arc in The Dark Knight gives us a way to test Socrates' claim about justice and happiness. ";

const DEMO_AMBER_HIGHLIGHT =
  'However, this all drastically changed when the Joker kidnapped him and Rachel Dawes resulting in the Death of Rachel and Harvey barely surviving the explosion.';

const DEMO_MID =
  ' That same night, the story also pushes a sharper claim: ';

const DEMO_RED_HIGHLIGHT =
  'virtue can survive cruelty without any qualification, which flattens Harvey into a simple moral fable.';

const DEMO_SUFFIX =
  " From that moment on, Harvey's moral compass fractures, and the film asks whether any amount of prior virtue can survive that kind of cruelty.";

const DEMO_AMBER_REVISED =
  'However, this changed drastically when the Joker kidnapped him and Rachel Dawes. Rachel died in the explosion, but Harvey barely survived, leaving him with physical and mental scars.';

const DEMO_RED_REVISED =
  'The film should qualify that claim; virtue is tested by cruelty, not guaranteed against it, as Harvey’s collapse illustrates.';

/** Amber toolkit (matches real “improve” annotation structure) */
const DEMO_IMPROVE_HEADING = 'Sentence needs improvement';
const DEMO_IMPROVE_REASON =
  'This sentence is too long and contains grammatical errors.';
const DEMO_IMPROVE_SUGGESTION =
  'Revise to: However, this changed drastically when the Joker kidnapped him and Rachel Dawes. Rachel died in the explosion, but Harvey barely survived, leaving him with physical and mental scars.';

/** Red toolkit (matches real “concern” structure) */
const DEMO_CONCERN_HEADING = 'Serious concern';
const DEMO_CONCERN_REASON =
  'This claim is too absolute and understates how the film complicates virtue under pressure.';
const DEMO_CONCERN_SUGGESTION =
  'Revise to: The film should qualify that claim; virtue is tested by cruelty, not guaranteed against it, as Harvey’s collapse illustrates.';

const HL_TUT_AMBER =
  'bg-[#fef3c7] dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-sm px-0.5 border-b-2 border-amber-600 dark:border-amber-500 hover:bg-[#fde68a] dark:hover:bg-amber-800/50 cursor-pointer transition-colors duration-200';

const HL_TUT_RED =
  'bg-[#fee2e2] dark:bg-red-900/40 text-red-900 dark:text-red-100 rounded-sm px-0.5 border-b-2 border-red-600 dark:border-red-500 hover:bg-[#fecaca] dark:hover:bg-red-800/50 cursor-pointer transition-colors duration-200';

const TYPING_SAMPLE =
  'In The Republic, Glaucon challenges Socrates on whether justice is valuable for its own sake. I will argue that…';

const STEPS: TutorialStep[] = [
  {
    id: 'intro',
    immersive: 'intro',
    title: 'Welcome to WriteScholar',
    body: 'A short tour: add your paper, pick a citation style, read your grade and highlights, then apply a revision when you want. After that, you are set to analyze your own draft.',
    emoji: '📖',
    targetSelector: null,
    mascotPose: 'waving',
    confetti: true,
  },
  {
    id: 'upload',
    immersive: 'upload',
    title: 'Add your paper',
    body: 'Paste into the box or drop a PDF, Word, or TXT file. When your draft is in place, click Analyze Text to run feedback (minimum word count applies on the real dashboard).',
    emoji: '📄',
    targetSelector: null,
    mascotPose: 'pointing',
  },
  {
    id: 'style',
    immersive: 'style',
    title: 'Choose your citation style',
    body: 'Pick MLA, APA, Chicago, or another supported style so feedback and references match what your course expects.',
    emoji: '📚',
    targetSelector: null,
    mascotPose: 'studying',
  },
  {
    id: 'analyze-wait',
    immersive: 'analyze',
    title: 'Full analysis in motion',
    body: 'We scan structure, argument, clarity, and citations. Then we build your rubric, highlights, and suggestions in one pass.',
    emoji: '⚙️',
    targetSelector: null,
    mascotPose: 'studying',
  },
  {
    id: 'grade',
    immersive: 'grade',
    title: 'Your grade & color map',
    body: 'Green marks strengths, amber is “improve,” red flags serious concerns. Fix red first, then amber.',
    emoji: '🎯',
    targetSelector: null,
    mascotPose: 'pointing',
  },
  {
    id: 'apply',
    immersive: 'apply',
    title: 'Apply a WriteScholar revision',
    body: 'The demo shows amber annotation 1 and red annotation 2 on the margin. Hover either highlight for the WriteScholar toolkit (amber or red styling). The loop applies the amber revision first, then the red one. Purple text is inserted wording.',
    emoji: '✨',
    targetSelector: null,
    mascotPose: 'pointing',
  },
  {
    id: 'done',
    immersive: 'done',
    title: 'That was easy — because it was a sample',
    body:
      'Now run WriteScholar on your own essay. It surfaces argument gaps, rubric breakdown, grade context, and specific rewrites—so you see the kind of feedback your professor expects. Paste your draft and tap Analyze when you are ready.',
    emoji: '🎓',
    targetSelector: null,
    mascotPose: 'celebrating',
    confetti: true,
  },
];

/* --- Confetti --- */
function useConfetti(trigger: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);
  const lastTrigger = useRef(-1);

  useEffect(() => {
    if (trigger === lastTrigger.current || trigger < 0) return;
    lastTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#0d9488', '#14b8a6', '#f59e0b', '#f97316', '#34d399', '#2dd4bf', '#fcd34d', '#5eead4'];

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      life: number;
      maxLife: number;
      spin: number;
      spinV: number;
      shape: 'rect' | 'circle' | 'star';
    };

    const particles: P[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.38;

    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 14;
      const maxLife = 0.7 + Math.random() * 0.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 6,
        r: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: maxLife,
        maxLife,
        spin: Math.random() * Math.PI * 2,
        spinV: (Math.random() - 0.5) * 0.15,
        shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
      });
    }

    const drawStar = (r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        const ia = a + Math.PI / 5;
        ctx.lineTo(Math.cos(ia) * r * 0.4, Math.sin(ia) * r * 0.4);
      }
      ctx.closePath();
      ctx.fill();
    };

    cancelAnimationFrame(animRef.current);
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        p.x += p.vx;
        p.vx *= 0.985;
        p.vy += 0.28;
        p.y += p.vy;
        p.life -= 0.012;
        p.spin += p.spinV;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.3));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
        else if (p.shape === 'star') drawStar(p.r);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return canvasRef;
}

type Rect = { x: number; y: number; w: number; h: number };

function useSmoothRect(target: Rect | null, duration = 900, useExpoEase = true) {
  const displayRef = useRef<Rect | null>(null);
  const fromRef = useRef<Rect | null>(null);
  const targetRef = useRef<Rect | null>(null);
  const startRef = useRef(0);
  const animRef = useRef(0);
  const [, forceRender] = useState(0);

  targetRef.current = target;

  useEffect(() => {
    cancelAnimationFrame(animRef.current);

    if (!target) {
      displayRef.current = null;
      forceRender((n) => n + 1);
      return;
    }

    if (!displayRef.current) {
      displayRef.current = { ...target };
      forceRender((n) => n + 1);
      return;
    }

    fromRef.current = { ...displayRef.current };
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const ease = useExpoEase ? 1 - Math.pow(2, -10 * t) : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const from = fromRef.current!;
      const to = targetRef.current!;
      displayRef.current = {
        x: from.x + (to.x - from.x) * ease,
        y: from.y + (to.y - from.y) * ease,
        w: from.w + (to.w - from.w) * ease,
        h: from.h + (to.h - from.h) * ease,
      };
      forceRender((n) => n + 1);

      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [target?.x, target?.y, target?.w, target?.h, duration, useExpoEase]);

  return displayRef.current;
}

function computeTooltipPos(
  spotlight: Rect | null,
  tooltipH: number,
  padding: number
): { top?: number; bottom?: number; left: number; width: number; centered: boolean } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(420, vw - 32);
  const centerX = Math.max(16, (vw - tooltipW) / 2);

  if (!spotlight) {
    return { top: Math.max(16, (vh - tooltipH) / 2), left: centerX, width: tooltipW, centered: true };
  }

  const gap = 20;
  const sb = spotlight.y + spotlight.h + padding;
  const st = spotlight.y - padding;

  const spotCenterX = spotlight.x + spotlight.w / 2;
  const alignedX = Math.max(16, Math.min(spotCenterX - tooltipW / 2, vw - tooltipW - 16));

  if (vh - sb - gap >= tooltipH + 16) {
    return { top: sb + gap, left: alignedX, width: tooltipW, centered: false };
  }
  if (st - gap >= tooltipH + 16) {
    return { bottom: vh - st + gap, left: alignedX, width: tooltipW, centered: false };
  }
  return { bottom: 16, left: centerX, width: tooltipW, centered: false };
}

/* ── Immersive mock panels ── */
function ImmersiveUploadDemo({ stepKey }: { stepKey: number }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    setTyped('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(TYPING_SAMPLE.slice(0, Math.min(i, TYPING_SAMPLE.length)));
      if (i >= TYPING_SAMPLE.length) window.clearInterval(id);
    }, 38);
    return () => window.clearInterval(id);
  }, [stepKey]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200/90 dark:border-stone-600/80 bg-white dark:bg-stone-800/80 shadow-inner overflow-hidden">
        <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Essay draft
        </div>
        <div className="p-4 min-h-[120px] text-[13px] sm:text-sm leading-relaxed text-stone-700 dark:text-stone-200 font-serif">
          {typed}
          <span className="inline-block w-0.5 h-4 ml-0.5 bg-teal-600 animate-pulse align-middle" />
        </div>
        <div className="px-4 py-2 text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-700">{typed.split(/\s+/).filter(Boolean).length} words · sample</div>
      </div>
      <div className="relative overflow-visible rounded-2xl">
        <div
          key={stepKey}
          className="relative rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-900/40 p-5 tut-upload-zone-ring"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-teal-500/20 dark:bg-teal-400/15 tut-upload-drop-flash"
            aria-hidden
          />
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-[min(220px,calc(100%-1rem))] tut-upload-file-drop" aria-hidden>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white/95 px-3 py-2 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.25)] ring-1 ring-stone-900/5 dark:border-stone-600 dark:bg-stone-800/95 dark:ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                </svg>
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-semibold text-stone-800 dark:text-stone-100">essay_draft.pdf</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">Drop to upload</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-4 pt-10 sm:pt-11">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-stone-100">Drop your document here</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">PDF · Word · TXT. Loads into the box above.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImmersiveStyleDemo({ stepKey }: { stepKey: number }) {
  const styles = ['APA 7', 'MLA 9', 'Chicago'] as const;
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    setSel(null);
    const t = window.setTimeout(() => setSel(1), 500);
    return () => window.clearTimeout(t);
  }, [stepKey]);

  return (
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
      {styles.map((label, i) => (
        <button
          key={label}
          type="button"
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-500 ${
            sel === i
              ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/25 scale-[1.02]'
              : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300'
          }`}
        >
          {label}
        </button>
      ))}
      <div className="w-full mt-3 text-xs text-stone-500 dark:text-stone-400">
        MLA is selected for this demo. Your course rubric still drives how we phrase feedback.
      </div>
    </div>
  );
}

function ImmersiveAnalyzeDemo({ stepKey }: { stepKey: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPct(0);
    const start = performance.now();
    const dur = 2400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setPct(Math.round(t * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepKey]);

  const phases = ['Parsing document', 'Mapping argument', 'Scoring rubric', 'Building highlights'];
  const phaseIdx = Math.min(phases.length - 1, Math.floor((pct / 100) * phases.length));

  return (
    <div className="space-y-4">
      <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 via-teal-400 to-amber-400 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          {phases[phaseIdx]}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <ul className="text-[13px] text-stone-600 dark:text-stone-300 space-y-1.5">
        <li className="flex items-center gap-2">
          <span className={pct > 15 ? 'text-teal-600' : 'text-stone-300'}>✓</span> Structure & thesis
        </li>
        <li className="flex items-center gap-2">
          <span className={pct > 45 ? 'text-teal-600' : 'text-stone-300'}>✓</span> Evidence & citations
        </li>
        <li className="flex items-center gap-2">
          <span className={pct > 78 ? 'text-teal-600' : 'text-stone-300'}>✓</span> Line-level annotations
        </li>
      </ul>
    </div>
  );
}

function ImmersiveGradeDemo({ stepKey }: { stepKey: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const t = window.setTimeout(() => setShow(true), 400);
    return () => window.clearTimeout(t);
  }, [stepKey]);

  return (
    <div className={`space-y-4 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-1">Estimated grade</p>
          <p className="text-4xl sm:text-5xl font-bold text-teal-700 dark:text-teal-400" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            C
          </p>
        </div>
        <div className="h-12 w-px bg-stone-200 dark:bg-stone-600 hidden sm:block" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-1">Rubric score</p>
          <p className="text-2xl font-semibold text-stone-800 dark:text-stone-100">78 / 100</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl py-3 px-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">12</p>
          <p className="text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/90 uppercase tracking-wide">Strong</p>
        </div>
        <div className="rounded-xl py-3 px-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">9</p>
          <p className="text-[10px] font-semibold text-amber-900/80 dark:text-amber-300/90 uppercase tracking-wide">Improve</p>
        </div>
        <div className="rounded-xl py-3 px-2 bg-red-50 dark:bg-red-950/35 border border-red-200/80 dark:border-red-900/60">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">4</p>
          <p className="text-[10px] font-semibold text-red-900/80 dark:text-red-300/90 uppercase tracking-wide">Concern</p>
        </div>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">Same traffic-light system as your real analysis. Prioritize red, then amber.</p>
    </div>
  );
}

type ApplyDemoPhase = 'idle' | 'sentence' | 'toolkit' | 'button' | 'click' | 'applied';
type ApplyDemoSegment = 'amber' | 'red';

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** SVG path tip in 24×24 viewBox scaled to 30×30 icon (aligns pointer tip with target). */
const APPLY_CURSOR_TIP_OFFSET = { x: (5.5 / 24) * 30, y: (3.21 / 24) * 30 };

function ImmersiveApplyDemo({
  stepKey,
  onBothRevisionsApplied,
}: {
  stepKey: number;
  onBothRevisionsApplied?: () => void;
}) {
  const [segment, setSegment] = useState<ApplyDemoSegment>('amber');
  const [phase, setPhase] = useState<ApplyDemoPhase>('idle');
  const [loopKey, setLoopKey] = useState(0);
  const [hover, setHover] = useState<ApplyDemoSegment | null>(null);
  const demoCardRef = useRef<HTMLDivElement>(null);
  const applyBtnRef = useRef<HTMLButtonElement>(null);
  const amberHighlightRef = useRef<HTMLSpanElement>(null);
  const redHighlightRef = useRef<HTMLSpanElement>(null);
  const [cursorOnButtonPx, setCursorOnButtonPx] = useState<{ left: number; top: number } | null>(null);
  const [cursorOnHighlightPx, setCursorOnHighlightPx] = useState<{ left: number; top: number } | null>(null);

  const measureCursorOnButton = useCallback(() => {
    const card = demoCardRef.current;
    const btn = applyBtnRef.current;
    if (!card || !btn) return;
    const cr = card.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setCursorOnButtonPx({
      left: br.left - cr.left + br.width / 2 - APPLY_CURSOR_TIP_OFFSET.x,
      top: br.top - cr.top + br.height / 2 - APPLY_CURSOR_TIP_OFFSET.y,
    });
  }, []);

  const measureCursorOnActiveHighlight = useCallback(() => {
    const card = demoCardRef.current;
    const el = segment === 'amber' ? amberHighlightRef.current : redHighlightRef.current;
    if (!card || !el) return;
    const cr = card.getBoundingClientRect();
    const hr = el.getBoundingClientRect();
    setCursorOnHighlightPx({
      left: hr.left - cr.left + hr.width * 0.38 - APPLY_CURSOR_TIP_OFFSET.x,
      top: hr.top - cr.top + hr.height * 0.42 - APPLY_CURSOR_TIP_OFFSET.y,
    });
  }, [segment]);

  useEffect(() => {
    setHover(null);
  }, [segment, loopKey, stepKey]);

  useEffect(() => {
    if (segment === 'red' && phase === 'applied') {
      onBothRevisionsApplied?.();
    }
  }, [segment, phase, onBothRevisionsApplied]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        setSegment('amber');
        setPhase('idle');
        await sleep(0);
        if (cancelled) return;
        setPhase('sentence');
        await sleep(380);
        if (cancelled) return;
        setPhase('toolkit');
        await sleep(5200);
        if (cancelled) return;
        setPhase('button');
        await sleep(1800);
        if (cancelled) return;
        setPhase('click');
        await sleep(650);
        if (cancelled) return;
        setPhase('applied');
        await sleep(2200);
        if (cancelled) return;

        setSegment('red');
        setPhase('idle');
        await sleep(400);
        if (cancelled) return;
        setPhase('sentence');
        await sleep(380);
        if (cancelled) return;
        setPhase('toolkit');
        await sleep(5200);
        if (cancelled) return;
        setPhase('button');
        await sleep(1800);
        if (cancelled) return;
        setPhase('click');
        await sleep(650);
        if (cancelled) return;
        setPhase('applied');
        await sleep(2600);
        if (cancelled) return;
        setLoopKey((k) => k + 1);
        await sleep(700);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stepKey]);

  const amberApplied = segment === 'red' || (segment === 'amber' && phase === 'applied');
  const redApplied = segment === 'red' && phase === 'applied';
  const showCursorOnHighlight = phase === 'sentence' || phase === 'toolkit';
  const showCursorOnButton = phase === 'button' || phase === 'click' || phase === 'applied';
  const showFloatingCursor = phase !== 'idle';
  const showAnnotationBadges = phase !== 'idle';

  const autoAmberToolkit = segment === 'amber' && phase === 'toolkit';
  const autoRedToolkit = segment === 'red' && phase === 'toolkit';
  /** Hover wins over the scripted toolkit so only one panel shows at a time. */
  const showAmberToolkit = hover === 'amber' || (hover === null && autoAmberToolkit);
  const showRedToolkit = hover === 'red' || (hover === null && autoRedToolkit);

  const ringAmber =
    segment === 'amber' && (phase === 'sentence' || phase === 'toolkit') && !amberApplied;
  const ringRed = segment === 'red' && (phase === 'sentence' || phase === 'toolkit') && !redApplied;

  const buttonLooksApplied =
    (segment === 'amber' && phase === 'applied') || (segment === 'red' && phase === 'applied');
  const buttonLabel =
    segment === 'red' && phase === 'applied'
      ? 'Revisions applied'
      : segment === 'amber' && phase === 'applied'
        ? 'Revision applied'
        : 'Apply WriteScholar revision';

  useLayoutEffect(() => {
    if (!showCursorOnButton) {
      setCursorOnButtonPx(null);
      return;
    }
    measureCursorOnButton();
    const card = demoCardRef.current;
    const btn = applyBtnRef.current;
    if (!card || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureCursorOnButton);
      return () => window.removeEventListener('resize', measureCursorOnButton);
    }
    const ro = new ResizeObserver(() => measureCursorOnButton());
    ro.observe(card);
    if (btn) ro.observe(btn);
    window.addEventListener('resize', measureCursorOnButton);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureCursorOnButton);
    };
  }, [showCursorOnButton, phase, loopKey, stepKey, segment, measureCursorOnButton]);

  useLayoutEffect(() => {
    if (!showCursorOnHighlight) {
      setCursorOnHighlightPx(null);
      return;
    }
    measureCursorOnActiveHighlight();
    const card = demoCardRef.current;
    const amber = amberHighlightRef.current;
    const red = redHighlightRef.current;
    if (!card || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureCursorOnActiveHighlight);
      return () => window.removeEventListener('resize', measureCursorOnActiveHighlight);
    }
    const ro = new ResizeObserver(() => measureCursorOnActiveHighlight());
    ro.observe(card);
    if (amber) ro.observe(amber);
    if (red) ro.observe(red);
    window.addEventListener('resize', measureCursorOnActiveHighlight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureCursorOnActiveHighlight);
    };
  }, [showCursorOnHighlight, phase, loopKey, stepKey, segment, measureCursorOnActiveHighlight]);

  const toolkitShell = (tone: 'amber' | 'red', k: string, children: ReactNode) => {
    const border =
      tone === 'amber'
        ? 'border-amber-200 dark:border-amber-800'
        : 'border-red-200 dark:border-red-900/80';
    /** Pointer toward the highlight; panel opens above the span so it does not cover the Apply button below. */
    const arrowFill = 'border-t-white dark:border-t-stone-900';
    const stripe = tone === 'amber' ? 'border-amber-500' : 'border-red-600';
    return (
      <div
        key={k}
        className={`tut-toolkit-panel absolute bottom-full left-1/2 z-[35] mb-2 w-[min(calc(100vw-5rem),22rem)] max-h-[min(30vh,12rem)] sm:max-h-[min(34vh,13.5rem)] -translate-x-1/2 overflow-y-auto overflow-x-hidden rounded-xl border ${border} bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] ring-1 ring-stone-900/5 dark:bg-stone-900 dark:ring-white/10 animate-tutToolkitIn`}
        role="region"
        aria-label="WriteScholar toolkit"
      >
        <div
          className={`pointer-events-none absolute left-1/2 top-full -translate-x-1/2 border-[10px] border-transparent ${arrowFill}`}
          aria-hidden
        />
        <div className={`border-l-4 ${stripe} pl-3 pr-3 py-3 sm:pl-4`}>{children}</div>
      </div>
    );
  };

  return (
    <div
      ref={demoCardRef}
      className="relative rounded-2xl border border-stone-200/90 dark:border-stone-600 bg-stone-50/90 dark:bg-stone-900/40 p-4 pb-3 min-h-[380px] sm:min-h-[360px]"
    >
      <div className="rounded-lg p-3 pl-7 sm:pl-8 text-[12px] sm:text-[13px] leading-relaxed text-stone-800 dark:text-stone-200 font-serif">
        <p>
          {DEMO_PREFIX}
          <span
            ref={amberHighlightRef}
            className={`relative inline align-baseline [box-decoration-break:clone] ${
              ringAmber
                ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/45 ring-offset-1 ring-offset-[#faf9f6] dark:ring-offset-stone-900 rounded-sm'
                : ''
            }`}
            onMouseEnter={() => setHover('amber')}
            onMouseLeave={() => setHover((h) => (h === 'amber' ? null : h))}
          >
            {!amberApplied ? (
              <mark className={`${HL_TUT_AMBER} [box-decoration-break:clone]`}>{DEMO_AMBER_HIGHLIGHT}</mark>
            ) : (
              <span className={`${REVISION_MARK_CLASS} [box-decoration-break:clone]`}>{DEMO_AMBER_REVISED}</span>
            )}
            {showAnnotationBadges && (
              <span
                className="absolute -left-[1.35rem] sm:-left-[1.5rem] top-1/2 z-[25] flex h-5 min-w-[1.25rem] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-bold text-white shadow-md dark:border-stone-800"
                aria-label="Annotation 1"
              >
                1
              </span>
            )}
            {showAmberToolkit &&
              toolkitShell(
                'amber',
                `${loopKey}-a`,
                <>
                  <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2 dark:border-amber-800/60">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200"
                      aria-hidden
                    >
                      ⚠
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">
                        WriteScholar toolkit
                      </p>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">{DEMO_IMPROVE_HEADING}</p>
                    </div>
                  </div>
                  <div className="tut-toolkit-stagger mt-3 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Sentence</p>
                      <p className="mt-1 text-[12px] leading-snug text-stone-800 dark:text-stone-100 font-serif sm:text-[13px]">
                        &ldquo;{DEMO_AMBER_HIGHLIGHT}&rdquo;
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                        Why it needs improvement
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-stone-700 dark:text-stone-200 sm:text-[13px]">{DEMO_IMPROVE_REASON}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Suggested improvement</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-stone-800 dark:text-stone-100 italic sm:text-[13px]">{DEMO_IMPROVE_SUGGESTION}</p>
                    </div>
                  </div>
                </>
              )}
          </span>
          {DEMO_MID}
          <span
            ref={redHighlightRef}
            className={`relative inline align-baseline [box-decoration-break:clone] ${
              ringRed
                ? 'ring-2 ring-red-400/75 dark:ring-red-500/50 ring-offset-1 ring-offset-[#faf9f6] dark:ring-offset-stone-900 rounded-sm'
                : ''
            }`}
            onMouseEnter={() => setHover('red')}
            onMouseLeave={() => setHover((h) => (h === 'red' ? null : h))}
          >
            {!redApplied ? (
              <mark className={`${HL_TUT_RED} [box-decoration-break:clone]`}>{DEMO_RED_HIGHLIGHT}</mark>
            ) : (
              <span className={`${REVISION_MARK_CLASS} [box-decoration-break:clone]`}>{DEMO_RED_REVISED}</span>
            )}
            {showAnnotationBadges && (
              <span
                className="absolute -left-[1.35rem] sm:-left-[1.5rem] top-1/2 z-[25] flex h-5 min-w-[1.25rem] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold text-white shadow-md dark:border-stone-800"
                aria-label="Annotation 2"
              >
                2
              </span>
            )}
            {showRedToolkit &&
              toolkitShell(
                'red',
                `${loopKey}-r`,
                <>
                  <div className="flex items-center gap-2 border-b border-red-200/80 pb-2 dark:border-red-900/60">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-200"
                      aria-hidden
                    >
                      !
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">
                        WriteScholar toolkit
                      </p>
                      <p className="text-xs font-semibold text-red-900 dark:text-red-200">{DEMO_CONCERN_HEADING}</p>
                    </div>
                  </div>
                  <div className="tut-toolkit-stagger mt-3 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Sentence</p>
                      <p className="mt-1 text-[12px] leading-snug text-stone-800 dark:text-stone-100 font-serif sm:text-[13px]">
                        &ldquo;{DEMO_RED_HIGHLIGHT}&rdquo;
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Why it needs attention</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-stone-700 dark:text-stone-200 sm:text-[13px]">{DEMO_CONCERN_REASON}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Suggested improvement</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-stone-800 dark:text-stone-100 italic sm:text-[13px]">{DEMO_CONCERN_SUGGESTION}</p>
                    </div>
                  </div>
                </>
              )}
          </span>
          {DEMO_SUFFIX}
        </p>
      </div>

      <div className="relative z-[50] mt-6">
        <button
          ref={applyBtnRef}
          type="button"
          disabled
          className={`relative w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            buttonLooksApplied
              ? 'bg-stone-200 dark:bg-stone-700 text-stone-500'
              : phase === 'click'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-900/30 ring-4 ring-violet-300/70 scale-[0.98]'
                : 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
          }`}
        >
          <span className="relative z-0">{buttonLabel}</span>
        </button>
        <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 text-center leading-snug">
          Looped demo: amber then red (annotation 1 and 2). Hover either highlight for its toolkit. The pointer moves to Apply for each revision; purple text is the inserted wording.
        </p>
      </div>

      {showFloatingCursor && (
        <div
          className="pointer-events-none absolute z-[60] h-8 w-8 transition-[left,top] duration-[1350ms] ease-[cubic-bezier(0.33,0.85,0.25,1)] will-change-[left,top]"
          style={
            showCursorOnButton && cursorOnButtonPx
              ? { left: cursorOnButtonPx.left, top: cursorOnButtonPx.top }
              : showCursorOnButton
                ? { left: 'calc(50% - 15px)', top: 'calc(100% - 6.25rem)' }
              : showCursorOnHighlight && cursorOnHighlightPx
                ? { left: cursorOnHighlightPx.left, top: cursorOnHighlightPx.top }
                : showCursorOnHighlight
                  ? { left: '12%', top: '6rem' }
                  : undefined
          }
          aria-hidden
        >
          <svg width="30" height="30" viewBox="0 0 24 24" className="drop-shadow-lg text-stone-900 dark:text-stone-100">
            <path
              fill="currentColor"
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .73-.58.39-.93L6.35 2.86a.5.5 0 0 0-.85.35Z"
            />
          </svg>
          {phase === 'click' && (
            <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/35 animate-ping" />
          )}
        </div>
      )}
    </div>
  );
}

const InteractiveTutorial = ({ userName, onComplete }: InteractiveTutorialProps) => {
  const [step, setStep] = useState(0);
  const [rawRect, setRawRect] = useState<Rect | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const [overlayReady, setOverlayReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(-1);
  const [tooltipH, setTooltipH] = useState(280);
  const [isMobile, setIsMobile] = useState(false);
  /** Sticky after both demo revisions (amber then red) have been applied once on the apply step. */
  const [applyStepBothRevisionsDone, setApplyStepBothRevisionsDone] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const immersivePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const current = STEPS[step];
  const total = STEPS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const padding = current.spotlightPadding ?? 16;
  const isImmersive = Boolean(current.immersive);

  const effectiveSelector =
    isMobile && current.mobileTargetSelector ? current.mobileTargetSelector : current.targetSelector;

  const confettiCanvas = useConfetti(confettiTrigger);
  const spotlightStepIndex = STEPS.findIndex((s) => s.targetSelector);
  const isSpotlightStep = !isImmersive && Boolean(effectiveSelector);
  const smoothRect = useSmoothRect(rawRect, step >= spotlightStepIndex ? 600 : 900, step < spotlightStepIndex);

  useEffect(() => {
    requestAnimationFrame(() => setOverlayReady(true));
  }, []);

  useEffect(() => {
    trackEvent('tutorial_start');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (tooltipRef.current) {
        const h = tooltipRef.current.getBoundingClientRect().height;
        if (h > 0) setTooltipH(h);
      }
      if (immersivePanelRef.current && isImmersive) {
        const h2 = immersivePanelRef.current.getBoundingClientRect().height;
        if (h2 > 0) setTooltipH(h2);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [step, isImmersive]);

  const updateRect = useCallback(() => {
    if (!effectiveSelector || isImmersive) {
      setRawRect(null);
      return;
    }
    const el = document.querySelector(effectiveSelector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRawRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    } else {
      setRawRect(null);
    }
  }, [effectiveSelector, isImmersive]);

  useEffect(() => {
    updateRect();
    const timers = [50, 200, 500, 900].map((d) => setTimeout(updateRect, d));
    return () => timers.forEach(clearTimeout);
  }, [updateRect]);

  useEffect(() => {
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [updateRect]);

  useEffect(() => {
    if (isImmersive || !effectiveSelector) return;
    const scrollToTarget = () => {
      const el = document.querySelector(effectiveSelector!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        [400, 800, 1200].forEach((d) => setTimeout(updateRect, d));
      }
    };
    const t = setTimeout(scrollToTarget, 120);
      return () => clearTimeout(t);
  }, [step, effectiveSelector, updateRect, isImmersive]);

  useEffect(() => {
    setContentKey((k) => k + 1);
  }, [step]);

  useEffect(() => {
    if (current.id !== 'apply') setApplyStepBothRevisionsDone(false);
  }, [step, current.id]);

  useEffect(() => {
    if (current.confetti) setConfettiTrigger(step);
  }, [step, current.confetti]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        e.preventDefault();
        goBack();
      } else if (e.key === 'Escape') handleExit(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, isLast, isFirst]);

  const handleApplyBothRevisionsDone = useCallback(() => {
    setApplyStepBothRevisionsDone(true);
  }, []);

  const goNext = () => {
    if (isLast) handleExit(false);
    else setStep((s) => s + 1);
  };
  const goBack = () => {
    if (!isFirst) setStep((s) => s - 1);
  };
  const handleExit = (skipped?: boolean) => {
    if (skipped) trackEvent('tutorial_skip');
    setExiting(true);
    setTimeout(onComplete, 400);
  };

  const rectForTooltip =
    isSpotlightStep && step < spotlightStepIndex && smoothRect ? smoothRect : isSpotlightStep ? rawRect : null;

  const tooltipPos = useMemo(
    () => computeTooltipPos(rectForTooltip, tooltipH, padding),
    [rectForTooltip?.x, rectForTooltip?.y, rectForTooltip?.w, rectForTooltip?.h, tooltipH, padding]
  );

  const renderSpotlightOverlay = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!smoothRect || isImmersive) {
      return (
        <svg className="fixed inset-0 w-full h-full" aria-hidden>
          <rect width={vw} height={vh} fill="rgba(15,23,42,0.55)" />
        </svg>
      );
    }

    const sl = smoothRect.x - padding;
    const st = smoothRect.y - padding;
    const sw = smoothRect.w + padding * 2;
    const sh = smoothRect.h + padding * 2;
    const r = 16;

    return (
      <svg className="fixed inset-0 w-full h-full" aria-hidden>
        <defs>
          <mask id="tut-mask-analyze">
            <rect width={vw} height={vh} fill="white" />
            <rect x={sl} y={st} width={sw} height={sh} rx={r} ry={r} fill="black" />
          </mask>
          <linearGradient id="tut-ring-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect width={vw} height={vh} fill="rgba(15,23,42,0.52)" mask="url(#tut-mask-analyze)" />
        <rect
          x={sl - 2}
          y={st - 2}
          width={sw + 4}
          height={sh + 4}
          rx={r + 2}
          ry={r + 2}
          fill="none"
          stroke="url(#tut-ring-teal)"
          strokeWidth="2.5"
          className="animate-ringPulseTeal"
        />
        <rect
          x={sl - 5}
          y={st - 5}
          width={sw + 10}
          height={sh + 10}
          rx={r + 4}
          ry={r + 4}
          fill="none"
          stroke="rgba(13,148,136,0.22)"
          strokeWidth="6"
          className="animate-ringGlowTeal"
        />
      </svg>
    );
  };

  const progress = ((step + 1) / total) * 100;

  const tooltipUsesSmoothRect = isSpotlightStep && step < spotlightStepIndex && !!smoothRect;
  const spotlightTooltipCss: CSSProperties = {
    position: 'fixed',
    left: tooltipPos.left,
    width: tooltipPos.width,
    transition: tooltipUsesSmoothRect ? 'none' : 'top 0.5s cubic-bezier(0.22,1,0.36,1), bottom 0.5s cubic-bezier(0.22,1,0.36,1), left 0.5s cubic-bezier(0.22,1,0.36,1)',
    ...(tooltipPos.top !== undefined ? { top: tooltipPos.top } : {}),
    ...(tooltipPos.bottom !== undefined ? { bottom: tooltipPos.bottom } : {}),
    ...(tooltipPos.centered ? { transform: 'none' } : {}),
  };

  const renderImmersiveVisual = () => {
    const scene = current.immersive;
    switch (scene) {
      case 'intro':
        return (
          <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-teal-200/60 dark:border-teal-800/50 bg-gradient-to-br from-teal-50 via-white to-amber-50/80 dark:from-teal-950/40 dark:via-stone-900 dark:to-stone-900">
            <div className="absolute inset-0 opacity-[0.35] dark:opacity-25 bg-[radial-gradient(ellipse_at_30%_20%,rgba(13,148,136,0.35),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.2),transparent_45%)]" />
            <div className="relative h-full flex items-center justify-center p-6">
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {['Paste', 'Analyze', 'Revise'].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-600 shadow-sm px-2 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 tut-intro-chip"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'upload':
        return <ImmersiveUploadDemo stepKey={contentKey} />;
      case 'style':
        return <ImmersiveStyleDemo stepKey={contentKey} />;
      case 'analyze':
        return <ImmersiveAnalyzeDemo stepKey={contentKey} />;
      case 'grade':
        return <ImmersiveGradeDemo stepKey={contentKey} />;
      case 'apply':
        return <ImmersiveApplyDemo stepKey={contentKey} onBothRevisionsApplied={handleApplyBothRevisionsDone} />;
      case 'done':
        return (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-600 bg-white/90 dark:bg-stone-800/80 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              When you finish a real run, your analysis opens with the same layout: rubric at a glance, scrollable essay, and one-tap revisions.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] ${exiting ? 'animate-tutOut' : overlayReady ? 'animate-tutIn' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Analyze interactive tutorial"
    >
      <canvas ref={confettiCanvas} className="fixed inset-0 z-[73] pointer-events-none" style={{ width: '100vw', height: '100vh' }} />

      <div className="fixed inset-0 z-[70] pointer-events-none">{renderSpotlightOverlay()}</div>

      {isImmersive ? (
        <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 sm:p-6 pointer-events-auto overflow-y-auto">
          <div
            ref={immersivePanelRef}
            key={contentKey}
            className="w-full max-w-3xl animate-tutContent rounded-[1.75rem] overflow-visible border border-stone-200/90 dark:border-stone-700/90 bg-[#faf9f6] dark:bg-stone-950/95 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.25)] dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Inset strip: same horizontal padding as body so it does not span edge-to-edge (reads shorter than the card) */}
            <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6" aria-hidden>
              <div className="overflow-hidden rounded-full h-1.5 w-full max-w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 dark:opacity-90" />
            </div>
            <div className="px-5 pb-5 pt-4 sm:px-8 sm:pb-8 sm:pt-5 grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-10 items-start">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <ScholarMascot size={64} animated pose={current.mascotPose} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-2xl">{current.emoji}</span>
                    <h2
                      className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-50 mt-1 leading-snug"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      {current.id === 'intro' && userName
                        ? `Hi, ${userName.split(' ')[0]}!`
                        : current.title}
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mt-2">{current.body}</p>
                  </div>
      </div>

                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-stone-200/80 dark:border-stone-700/80">
                  <button
                    type="button"
                    onClick={() => handleExit(true)}
                    className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-medium"
                  >
                    Skip
                  </button>
                  <div className="flex-1 flex justify-center gap-1">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full flex-shrink-0 transition-all duration-500"
                        style={{
                          width: i === step ? 20 : 5,
                          height: 5,
                          background: i === step ? '#0d9488' : i < step ? '#5eead4' : 'rgba(120,113,108,0.2)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:bg-stone-200/80 dark:hover:bg-stone-800"
                        aria-label="Previous"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={goNext}
                      className={`min-h-9 shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm leading-snug shadow-md shadow-teal-900/15 transition-all active:scale-[0.98] whitespace-nowrap relative ${
                        current.id === 'apply' && applyStepBothRevisionsDone ? 'tut-next-after-revisions' : ''
                      }`}
                    >
                      {isLast ? 'Go to workspace' : 'Next'}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-3 tabular-nums">
                  {step + 1} / {total}
                </p>
              </div>

              <div className="min-w-0 overflow-visible relative z-[1]">{renderImmersiveVisual()}</div>
            </div>
          </div>
        </div>
      ) : (
        <div ref={tooltipRef} style={spotlightTooltipCss} className="z-[72] pointer-events-auto">
        <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl shadow-[0_16px_50px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.45)] border border-stone-200/90 dark:border-stone-700/80 overflow-hidden ring-1 ring-white/50 dark:ring-white/5">
          <div className="h-1 bg-stone-200/80 dark:bg-stone-700">
          <div
                className="h-full bg-teal-600 dark:bg-teal-500 rounded-r-full"
            style={{ width: `${progress}%`, transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </div>

          <div key={contentKey} className="animate-tutContent p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 animate-tutMascot">
                  <ScholarMascot size={56} animated pose={current.mascotPose} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg animate-tutEmoji">{current.emoji}</span>
                    <h2
                      className="text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      {current.title}
                    </h2>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-[13px] sm:text-sm leading-relaxed">{current.body}</p>
                </div>
              </div>

            <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-700/50">
                <button
                  type="button"
                  onClick={() => handleExit(true)}
                  className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium flex-shrink-0"
                >
                Skip tour
              </button>

              <div className="flex items-center gap-1 flex-1 justify-center overflow-hidden px-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-full"
                    style={{
                      width: i === step ? 18 : 5,
                      height: 5,
                        background: i === step ? '#0d9488' : i < step ? '#5eead4' : 'rgba(120,113,108,0.18)',
                      transition: 'all 0.55s cubic-bezier(0.22,1,0.36,1)',
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!isFirst && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all active:scale-90"
                      aria-label="Previous"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                  </button>
                )}
                  <button
                    type="button"
                    onClick={goNext}
                    className="h-8 px-3.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-teal-900/15 ring-1 ring-teal-900/10 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {isLast ? 'Analyze my paper' : (
                      <>
                        Next <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 opacity-40">
                <span className="text-[10px] text-stone-500 font-medium tabular-nums">
                  {step + 1} / {total}
                </span>
              <span className="text-[10px] text-stone-500 hidden sm:flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[9px] font-mono leading-none">←</kbd>
                <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[9px] font-mono leading-none">→</kbd>
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      <style>{`
        @keyframes tutIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tutOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-tutIn  { animation: tutIn  0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .animate-tutOut { animation: tutOut 0.4s cubic-bezier(0.4,0,0.2,1) forwards; }

        @keyframes tutContent {
          0%   { opacity: 0; transform: translateY(10px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-tutContent { animation: tutContent 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes tutMascot {
          0%   { opacity: 0; transform: scale(0.88); }
          70%  { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-tutMascot { animation: tutMascot 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes tutEmoji {
          0%   { opacity: 0; transform: scale(0.5) rotate(-8deg); }
          70%  { transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-tutEmoji { animation: tutEmoji 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes ringPulseTeal {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .animate-ringPulseTeal { animation: ringPulseTeal 2.5s ease-in-out infinite; }

        @keyframes ringGlowTeal {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 0.5; }
        }
        .animate-ringGlowTeal { animation: ringGlowTeal 2.5s ease-in-out infinite 0.3s; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tut-intro-chip {
          animation: fadeSlide 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes tutToolkitIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-tutToolkitIn {
          animation: tutToolkitIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes tutTkSeg {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tut-toolkit-stagger > div {
          opacity: 0;
          animation: tutTkSeg 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .tut-toolkit-stagger > div:nth-child(1) { animation-delay: 0.12s; }
        .tut-toolkit-stagger > div:nth-child(2) { animation-delay: 0.42s; }
        .tut-toolkit-stagger > div:nth-child(3) { animation-delay: 0.72s; }

        @keyframes tutUploadFileDrop {
          0% { transform: translate(-50%, -132px) scale(0.9) rotate(-3deg); opacity: 0; }
          8% { opacity: 1; }
          44% { transform: translate(-50%, 52px) scale(1) rotate(0deg); opacity: 1; }
          50% { transform: translate(-50%, 46px) scale(0.97) rotate(0deg); opacity: 1; }
          58% { opacity: 0; transform: translate(-50%, 58px) scale(0.92) rotate(0deg); }
          59%, 100% { opacity: 0; transform: translate(-50%, -132px) scale(0.9) rotate(-3deg); }
        }
        .tut-upload-file-drop {
          animation: tutUploadFileDrop 3.4s cubic-bezier(0.33, 0.85, 0.25, 1) infinite;
        }

        @keyframes tutUploadDropFlash {
          0%, 40%, 100% { opacity: 0; }
          44%, 56% { opacity: 1; }
        }
        .tut-upload-drop-flash {
          animation: tutUploadDropFlash 3.4s cubic-bezier(0.33, 0.85, 0.25, 1) infinite;
        }

        @keyframes tutUploadZoneRing {
          0%, 40%, 100% {
            border-color: rgb(214 211 209);
            box-shadow: 0 0 0 0 rgba(13, 148, 136, 0);
          }
          44%, 56% {
            border-color: rgb(20 184 166);
            box-shadow: 0 10px 28px -12px rgba(13, 148, 136, 0.35);
          }
        }
        .tut-upload-zone-ring {
          animation: tutUploadZoneRing 3.4s cubic-bezier(0.33, 0.85, 0.25, 1) infinite;
        }
        .dark .tut-upload-zone-ring {
          animation-name: tutUploadZoneRingDark;
        }
        @keyframes tutUploadZoneRingDark {
          0%, 40%, 100% {
            border-color: rgb(82 82 91);
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
          }
          44%, 56% {
            border-color: rgb(45 212 191);
            box-shadow: 0 10px 28px -12px rgba(45, 212, 191, 0.25);
          }
        }

        @keyframes tutNextAfterRevisions {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.35), 0 8px 24px -6px rgba(13, 148, 136, 0.45);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0.12), 0 12px 32px -4px rgba(13, 148, 136, 0.55);
          }
        }
        .tut-next-after-revisions {
          z-index: 1;
          animation: tutNextAfterRevisions 2.1s ease-in-out infinite;
          box-shadow: 0 8px 24px -6px rgba(13, 148, 136, 0.45);
          outline: 2px solid rgba(251, 191, 36, 0.75);
          outline-offset: 2px;
        }
        .dark .tut-next-after-revisions {
          outline-color: rgba(250, 204, 21, 0.65);
        }
        @media (prefers-reduced-motion: reduce) {
          .tut-next-after-revisions {
            animation: none;
            box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.45), 0 8px 24px -6px rgba(13, 148, 136, 0.45);
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveTutorial;
