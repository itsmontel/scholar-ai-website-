import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ScholarMascot from './ScholarMascot';
import { trackEvent } from '../../utils/analytics';

interface InteractiveTutorialProps {
  userName: string;
  onComplete: () => void;
}

type MascotPose = 'waving' | 'pointing' | 'studying' | 'celebrating' | 'default';

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  emoji: string;
  targetSelector: string | null;
  mobileTargetSelector?: string;
  mascotPose: MascotPose;
  spotlightPadding?: number;
  confetti?: boolean;
}

const MASCOT_NAME = 'Cosmo';

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to WriteScholar!',
    body: `Hey! I'm ${MASCOT_NAME}, your study sidekick. Quick tour, then we'll get you to analyze your first essay. That's where the magic happens!`,
    emoji: '🎉',
    targetSelector: null,
    mascotPose: 'waving',
    confetti: true,
  },
  {
    id: 'greeting',
    title: 'Your dashboard',
    body: "Your home base: greeting, search, streak, badges, and quick access to your tools. Everything you create shows up below.",
    emoji: '🏠',
    targetSelector: '[data-tutorial="greeting-area"]',
    mascotPose: 'pointing',
    spotlightPadding: 10,
  },
  {
    id: 'feature-cards',
    title: 'Analyze, Citations, Study Pack & more',
    body: "Analyze (essay feedback) is our star. Tap it to get professor style feedback on your writing. Citations, Study Pack, Focus Mode, and More Tools are one tap away.",
    emoji: '📝',
    targetSelector: '[data-tutorial="dashboard-tool-tabs-hero"]',
    mascotPose: 'pointing',
    spotlightPadding: 10,
  },
  {
    id: 'recents',
    title: 'Recents',
    body: "Everything you create (analyses, study packs, citations) shows up here. Quick access to jump back into anything. After your first analysis, something special will appear!",
    emoji: '📂',
    targetSelector: '[data-tutorial="saved-materials"]',
    mascotPose: 'pointing',
    spotlightPadding: 10,
  },
  {
    id: 'finale',
    title: "You're ready!",
    body: `Try it now. Paste your essay or upload a file, then hit Analyze Text. Professor-style feedback in under 60 seconds. When you're done, come back for a surprise!`,
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

    const colors = ['#818cf8', '#a78bfa', '#8b5cf6', '#fb923c', '#34d399', '#38bdf8', '#facc15', '#c084fc', '#9333ea'];

    type P = {
      x: number; y: number; vx: number; vy: number;
      r: number; color: string; life: number; maxLife: number;
      spin: number; spinV: number; shape: 'rect' | 'circle' | 'star';
    };

    const particles: P[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.38;

    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 14;
      const maxLife = 0.7 + Math.random() * 0.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 120, y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - Math.random() * 6,
        r: 2 + Math.random() * 5, color: colors[Math.floor(Math.random() * colors.length)],
        life: maxLife, maxLife,
        spin: Math.random() * Math.PI * 2, spinV: (Math.random() - 0.5) * 0.15,
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
      ctx.closePath(); ctx.fill();
    };

    cancelAnimationFrame(animRef.current);
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        p.x += p.vx; p.vx *= 0.985; p.vy += 0.28; p.y += p.vy;
        p.life -= 0.012; p.spin += p.spinV; alive++;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.3));
        ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.fillStyle = p.color;
        if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
        else if (p.shape === 'star') drawStar(p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (alive > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return canvasRef;
}

/* ────────────────────────────────────────────────────────────────
   SMOOTH SPOTLIGHT RECT
   Uses requestAnimationFrame with a spring-like cubic ease
   for perfectly smooth morphing between spotlight targets.
   ──────────────────────────────────────────────────────────────── */
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
      forceRender(n => n + 1);
      return;
    }

    if (!displayRef.current) {
      displayRef.current = { ...target };
      forceRender(n => n + 1);
      return;
    }

    fromRef.current = { ...displayRef.current };
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const ease = useExpoEase
        ? 1 - Math.pow(2, -10 * t)
        : (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      const from = fromRef.current!;
      const to = targetRef.current!;
      displayRef.current = {
        x: from.x + (to.x - from.x) * ease,
        y: from.y + (to.y - from.y) * ease,
        w: from.w + (to.w - from.w) * ease,
        h: from.h + (to.h - from.h) * ease,
      };
      forceRender(n => n + 1);

      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [target?.x, target?.y, target?.w, target?.h, duration, useExpoEase]);

  return displayRef.current;
}

/* --- Tooltip position (immediate calculation) --- */
function computeTooltipPos(
  spotlight: Rect | null,
  tooltipH: number,
  padding: number,
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

/* ────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────────── */
const InteractiveTutorial = ({ userName, onComplete }: InteractiveTutorialProps) => {
  const [step, setStep] = useState(0);
  const [rawRect, setRawRect] = useState<Rect | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const [overlayReady, setOverlayReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(-1);
  const [tooltipH, setTooltipH] = useState(260);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

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

  const effectiveSelector = (isMobile && current.mobileTargetSelector) ? current.mobileTargetSelector : current.targetSelector;

  const confettiCanvas = useConfetti(confettiTrigger);
  const useSnappyTransitions = step >= 3;
  const smoothRect = useSmoothRect(rawRect, useSnappyTransitions ? 600 : 900, !useSnappyTransitions);

  useEffect(() => { requestAnimationFrame(() => setOverlayReady(true)); }, []);

  useEffect(() => { trackEvent('tutorial_start'); }, []);

  /* Measure tooltip each step */
  useEffect(() => {
    const t = setTimeout(() => {
      if (tooltipRef.current) {
        const h = tooltipRef.current.getBoundingClientRect().height;
        if (h > 0) setTooltipH(h);
      }
    }, 60);
    return () => clearTimeout(t);
  }, [step]);

  /* Track target element rect */
  const updateRect = useCallback(() => {
    if (!effectiveSelector) { setRawRect(null); return; }
    const el = document.querySelector(effectiveSelector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRawRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    } else {
      setRawRect(null);
    }
  }, [effectiveSelector]);

  useEffect(() => {
    updateRect();
    const timers = [50, 200, 500, 900].map(d => setTimeout(updateRect, d));
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

  /* Scroll spotlight target into view */
  useEffect(() => {
    if (!effectiveSelector) return;
    const scrollToTarget = () => {
      const el = document.querySelector(effectiveSelector!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const delays = step >= 3 ? [400, 700, 1000] : [500, 900, 1400, 1900];
        delays.forEach(d => setTimeout(updateRect, d));
      }
    };
    if (step >= 3) {
      scrollToTarget();
    } else {
      const t = setTimeout(scrollToTarget, 100);
      return () => clearTimeout(t);
    }
  }, [step, effectiveSelector, updateRect]);

  /* Content key for crossfade */
  useEffect(() => { setContentKey(k => k + 1); }, [step]);

  /* Confetti */
  useEffect(() => {
    if (current.confetti) setConfettiTrigger(step);
  }, [step, current.confetti]);


  /* Keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' && !isFirst) { e.preventDefault(); goBack(); }
      else if (e.key === 'Escape') handleExit(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, isLast, isFirst]);

  const goNext = () => { if (isLast) handleExit(false); else setStep(s => s + 1); };
  const goBack = () => { if (!isFirst) setStep(s => s - 1); };
  const handleExit = (skipped?: boolean) => {
    if (skipped) trackEvent('tutorial_skip');
    setExiting(true);
    setTimeout(onComplete, 400);
  };

  /* Tooltip: smoothRect for steps 0–2, rawRect for 3+ (snappier) */
  const rectForTooltip = (step < 3 && smoothRect) ? smoothRect : rawRect;
  const tooltipPos = useMemo(
    () => computeTooltipPos(rectForTooltip, tooltipH, padding),
    [rectForTooltip?.x, rectForTooltip?.y, rectForTooltip?.w, rectForTooltip?.h, tooltipH, padding],
  );

  /* ── SVG overlay with smooth cutout ── */
  const renderOverlay = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!smoothRect) {
      return (
        <svg className="fixed inset-0 w-full h-full">
          <rect width={vw} height={vh} fill="rgba(15,23,42,0.52)" />
        </svg>
      );
    }

    const sl = smoothRect.x - padding;
    const st = smoothRect.y - padding;
    const sw = smoothRect.w + padding * 2;
    const sh = smoothRect.h + padding * 2;
    const r = 16;

    return (
      <svg className="fixed inset-0 w-full h-full">
        <defs>
          <mask id="tut-mask">
            <rect width={vw} height={vh} fill="white" />
            <rect x={sl} y={st} width={sw} height={sh} rx={r} ry={r} fill="black" />
          </mask>
          <linearGradient id="tut-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect width={vw} height={vh} fill="rgba(15,23,42,0.52)" mask="url(#tut-mask)" />
        <rect
          x={sl - 2} y={st - 2} width={sw + 4} height={sh + 4}
          rx={r + 2} ry={r + 2}
          fill="none" stroke="url(#tut-ring-grad)" strokeWidth="2.5"
          className="animate-ringPulse"
        />
        <rect
          x={sl - 5} y={st - 5} width={sw + 10} height={sh + 10}
          rx={r + 4} ry={r + 4}
          fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="6"
          className="animate-ringGlow"
        />
      </svg>
    );
  };

  const progress = ((step + 1) / total) * 100;

  const tooltipUsesSmoothRect = step < 3 && !!smoothRect;
  const tooltipCss: React.CSSProperties = {
    position: 'fixed',
    left: tooltipPos.left,
    width: tooltipPos.width,
    transition: tooltipUsesSmoothRect ? 'none' : 'top 0.5s cubic-bezier(0.22,1,0.36,1), bottom 0.5s cubic-bezier(0.22,1,0.36,1), left 0.5s cubic-bezier(0.22,1,0.36,1)',
    ...(tooltipPos.top !== undefined ? { top: tooltipPos.top } : {}),
    ...(tooltipPos.bottom !== undefined ? { bottom: tooltipPos.bottom } : {}),
    ...(tooltipPos.centered ? { transform: 'none' } : {}),
  };

  return (
    <div
      className={`fixed inset-0 z-[70] ${exiting ? 'animate-tutOut' : overlayReady ? 'animate-tutIn' : 'opacity-0'}`}
      role="dialog" aria-modal="true" aria-label="Interactive tutorial"
    >
      <canvas ref={confettiCanvas} className="fixed inset-0 z-[73] pointer-events-none" style={{ width: '100vw', height: '100vh' }} />

      <div className="fixed inset-0 z-[70] pointer-events-none">
        {renderOverlay()}
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} style={tooltipCss} className="z-[72] pointer-events-auto">
        <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl shadow-[0_16px_50px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.45)] border border-stone-200/90 dark:border-stone-700/80 overflow-hidden ring-1 ring-white/50 dark:ring-white/5">
          {/* Progress bar */}
          <div className="h-1 bg-stone-200/80 dark:bg-stone-700">
          <div
            className="h-full bg-violet-700 dark:bg-violet-600 rounded-r-full"
            style={{ width: `${progress}%`, transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </div>

          <div key={contentKey} className="animate-tutContent p-5 sm:p-6">
            {!current.targetSelector ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 animate-tutMascot">
                  <ScholarMascot size={100} animated pose={current.mascotPose} />
                </div>
                <span className="text-3xl mb-2 block animate-tutEmoji">{current.emoji}</span>
                <h2 className="text-lg sm:text-xl font-semibold text-stone-800 dark:text-stone-100 mb-2 leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  {current.id === 'welcome' && userName
                    ? `Welcome, ${userName.split(' ')[0]}!`
                    : current.title}
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-sm">
                  {current.body}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 animate-tutMascot">
                  <ScholarMascot size={56} animated pose={current.mascotPose} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg animate-tutEmoji">{current.emoji}</span>
                    <h2 className="text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                      {current.title}
                    </h2>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-[13px] sm:text-sm leading-relaxed">
                    {current.body}
                  </p>
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-700/50">
              <button onClick={() => handleExit(true)} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium flex-shrink-0">
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
                      background: i === step ? '#7c3aed' : i < step ? '#a78bfa' : 'rgba(120,113,108,0.18)',
                      transition: 'all 0.55s cubic-bezier(0.22,1,0.36,1)',
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!isFirst && (
                  <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all active:scale-90" aria-label="Previous">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <button onClick={goNext} className="h-8 px-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-violet-900/15 ring-1 ring-violet-900/10 transition-all active:scale-95 flex items-center gap-1.5">
                  {isLast ? 'Get started' : (
                    <>Next <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 opacity-40">
              <span className="text-[10px] text-stone-500 font-medium tabular-nums">{step + 1} / {total}</span>
              <span className="text-[10px] text-stone-500 hidden sm:flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[9px] font-mono leading-none">←</kbd>
                <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-[9px] font-mono leading-none">→</kbd>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tutIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tutOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-tutIn  { animation: tutIn  0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .animate-tutOut { animation: tutOut 0.5s cubic-bezier(0.4,0,0.2,1) forwards; }

        @keyframes tutContent {
          0%   { opacity: 0; transform: translateY(8px) scale(0.98); }
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

        @keyframes ringPulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .animate-ringPulse { animation: ringPulse 2.5s ease-in-out infinite; }

        @keyframes ringGlow {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 0.5; }
        }
        .animate-ringGlow { animation: ringGlow 2.5s ease-in-out infinite 0.3s; }
      `}</style>
    </div>
  );
};

export default InteractiveTutorial;
