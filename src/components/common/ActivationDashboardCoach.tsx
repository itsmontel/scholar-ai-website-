import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  activationCoachBody,
  activationCoachBtnPrimary,
  activationCoachCard,
  activationCoachKicker,
  activationCoachMuted,
  activationCoachSegmentClass,
} from './activationCoachUi';

export type ActivationDashboardCoachStep = 'welcome' | 'essay' | 'analyze';

const STEP_ORDER: ActivationDashboardCoachStep[] = ['welcome', 'essay', 'analyze'];

function stepIndex(s: ActivationDashboardCoachStep): number {
  return STEP_ORDER.indexOf(s);
}

/** Survives React Strict Mode remount (instance refs reset); cleared when leaving welcome. */
let welcomeConfettiAlreadyFired = false;

/** Confetti on welcome only; wrapper fades out. */
function useWelcomeConfetti(fire: boolean, allowMotion: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);

  useEffect(() => {
    if (!fire) {
      welcomeConfettiAlreadyFired = false;
      return;
    }
    if (!allowMotion || welcomeConfettiAlreadyFired) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    welcomeConfettiAlreadyFired = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#0d9488', '#14b8a6', '#f59e0b', '#f97316', '#34d399', '#a78bfa', '#fcd34d'];
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
      shape: 'rect' | 'circle';
    };

    const particles: P[] = [];
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.42;

    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 16;
      const maxLife = 0.75 + Math.random() * 0.55;
      const r0 = Math.random() * 120;
      particles.push({
        x: cx + Math.cos(angle) * r0 * 0.35 + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * r0 * 0.35 + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 6,
        r: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: maxLife,
        maxLife,
        spin: Math.random() * Math.PI * 2,
        spinV: (Math.random() - 0.5) * 0.15,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

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

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [fire, allowMotion]);
  return canvasRef;
}

type Props = {
  step: ActivationDashboardCoachStep;
  onNext: () => void;
  analyzeButtonRef?: RefObject<HTMLButtonElement | null>;
};

/** Bottom-right onboarding on the real dashboard (matches analysis activation coach). Subtle dim + backdrop blocks stray clicks; analyze step passes clicks through to Analyze Text. */
export default function ActivationDashboardCoach({ step, onNext, analyzeButtonRef }: Props) {
  const reactId = useId();
  const markerId = `dash-arr-${reactId.replace(/:/g, '')}`;
  const [allowWelcomeConfetti, setAllowWelcomeConfetti] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setAllowWelcomeConfetti(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const canvasRef = useWelcomeConfetti(step === 'welcome', allowWelcomeConfetti);
  const panelRef = useRef<HTMLDivElement>(null);
  const [arrow, setArrow] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [arrowKey, setArrowKey] = useState(0);
  const [confettiWrapOpacity, setConfettiWrapOpacity] = useState(1);

  useEffect(() => {
    if (step !== 'welcome') {
      setConfettiWrapOpacity(0);
      return;
    }
    setConfettiWrapOpacity(1);
    const fade = window.setTimeout(() => setConfettiWrapOpacity(0), 3800);
    return () => window.clearTimeout(fade);
  }, [step]);

  useLayoutEffect(() => {
    if (step !== 'analyze' || !analyzeButtonRef?.current) {
      setArrow(null);
      return;
    }
    const update = () => {
      const panel = panelRef.current;
      const btn = analyzeButtonRef.current;
      if (!panel || !btn) {
        setArrow(null);
        return;
      }
      const pr = panel.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      setArrow({
        x1: pr.left + pr.width * 0.18,
        y1: pr.bottom - 6,
        x2: br.left + br.width * 0.5,
        y2: br.top + br.height * 0.5,
      });
      setArrowKey((k) => k + 1);
    };
    update();
    const t1 = window.setTimeout(update, 50);
    const t2 = window.setTimeout(update, 200);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step, analyzeButtonRef]);

  const si = stepIndex(step);
  const backdropBlocksClicks = step === 'welcome' || step === 'essay';

  return (
    <>
      {/* Slight dim; blocks clicks on welcome + essay. On analyze, pointer-events pass through so Analyze Text (pointer-events-auto) works. */}
      <div
        className={`fixed inset-0 z-[118] transition-opacity duration-300 ease-out ${
          backdropBlocksClicks ? 'pointer-events-auto' : 'pointer-events-none'
        } ${
          step === 'essay'
            ? 'bg-stone-900/[0.05] dark:bg-black/18'
            : 'bg-stone-900/[0.08] dark:bg-black/25'
        }`}
        aria-hidden
      />

      {step === 'welcome' && (
        <div
          className="fixed inset-0 z-[225] pointer-events-none transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: confettiWrapOpacity }}
          aria-hidden
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>
      )}
      {arrow && (
        <svg
          key={arrowKey}
          className="pointer-events-none fixed left-0 top-0 z-[131] overflow-visible"
          aria-hidden
          width="100vw"
          height="100vh"
        >
          <defs>
            <linearGradient id={`dashGrad-${markerId}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke={`url(#dashGrad-${markerId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            className="activation-tutorial-arrow-line"
          />
        </svg>
      )}

      <div
        ref={panelRef}
        className="pointer-events-auto fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[132] w-[min(23rem,calc(100vw-1.5rem))] animate-in fade-in zoom-in-95 duration-500 ease-out"
      >
        {/* Outer glow wrapper so pulsing shadow does not fight Tailwind ring on the card */}
        <div className="rounded-2xl dashboard-coach-panel-glow">
        <div className={`px-4 py-4 ${activationCoachCard}`}>
          <div className="mb-3 flex items-center gap-1.5" aria-hidden>
            {STEP_ORDER.map((_, i) => (
              <span
                key={i}
                className={activationCoachSegmentClass(i <= si, i === si)}
              />
            ))}
          </div>

          <div className="min-h-[158px]">
            {step === 'welcome' && (
              <div key="welcome" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className={`${activationCoachKicker} mb-1`}>Welcome</p>
                <p className="text-base font-semibold leading-snug text-stone-900 dark:text-stone-50">
                  Welcome to WriteScholar
                </p>
                <p className={`${activationCoachBody} mt-2`}>
                  We&apos;re going to give you a quick tutorial so you understand how our analysis works.
                </p>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={onNext} className={activationCoachBtnPrimary}>
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 'essay' && (
              <div key="essay" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className={`${activationCoachKicker} mb-1`}>Sample essay</p>
                <p className={activationCoachBody}>
                  Your text box is already filled with our Sample&nbsp;B paper so you can see how it
                  works before you analyze your own paper.
                </p>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={onNext} className={activationCoachBtnPrimary}>
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 'analyze' && (
              <div key="analyze" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className={`${activationCoachKicker} mb-1`}>Your turn</p>
                <p className={`${activationCoachBody} font-medium`}>
                  Tap{' '}
                  <span className="font-semibold text-violet-700 dark:text-violet-300">Analyze Text</span> below (the
                  glowing button).
                </p>
                <p className={activationCoachMuted}>Other controls stay off until you do.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
