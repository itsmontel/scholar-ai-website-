/* ─── PostCheckoutWelcomeOverlay ─────────────────────────────────
 *
 * Fullscreen "Welcome to WriteScholar!" celebration shown when the
 * user lands on /dashboard after completing the onboarding Stripe
 * checkout. Mirrors the `transition` phase of the onboarding flow so
 * the user gets the same confetti + mascot + cascading H1 reward
 * moment they would have seen if Stripe didn't do a hard redirect.
 *
 * Self-contained — own confetti generator, own keyframe block, own
 * mascot <img> (so we don't have to plumb the MascotGif helper out
 * of OnboardingPage). Auto-dismisses after `durationMs` and calls
 * `onDone` so the parent can unmount it.
 */
import { useEffect } from 'react';

const CONFETTI_COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#A560E8', '#FFD700'];

interface PostCheckoutWelcomeOverlayProps {
  /** Optional first name shown in the subtitle ("Your journey starts now, {name} 🎉"). */
  firstName?: string;
  /** Called when the celebration animation finishes — parent uses it to unmount. */
  onDone: () => void;
  /** Visible duration in ms. Defaults to 2400ms to match the in-onboarding `TRANSITION_MS`. */
  durationMs?: number;
}

export default function PostCheckoutWelcomeOverlay({
  firstName,
  onDone,
  durationMs = 2400,
}: PostCheckoutWelcomeOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white dark:bg-stone-950"
      role="status"
      aria-live="polite"
      aria-label="Welcome to WriteScholar"
    >
      {/* Animated radial gradient background — slow hue cycle */}
      <div className="absolute inset-0 pcw-bg-cycle" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white dark:from-stone-950/70 dark:via-stone-950/40 dark:to-stone-950 pointer-events-none"
        aria-hidden
      />

      {/* Confetti — 4 shape variants in 6 colours */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: 90 }, (_, i) => {
          const shape = i % 4; // 0=square, 1=circle, 2=sparkle, 3=triangle
          const size = 6 + Math.random() * 10;
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          return (
            <div
              key={i}
              className="absolute pcw-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 3}s`,
              }}
            >
              {shape === 2 ? (
                /* Sparkle / 4-point star */
                <svg
                  width={size + 4}
                  height={size + 4}
                  viewBox="0 0 24 24"
                  style={{ filter: `drop-shadow(0 0 4px ${color}aa)` }}
                >
                  <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={color} />
                </svg>
              ) : shape === 3 ? (
                /* Triangle */
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${size / 2}px solid transparent`,
                    borderRight: `${size / 2}px solid transparent`,
                    borderBottom: `${size}px solid ${color}`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              ) : (
                /* Square or circle */
                <div
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: shape === 1 ? '50%' : 2,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    boxShadow: `0 0 6px ${color}55`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* CENTRE — mascot in halo + heading + progress */}
      <div className="relative z-10 text-center px-6 max-w-md">
        {/* Mascot wrapped in pulsing halo + concentric rings */}
        <div className="relative mb-6 pcw-scale-in">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <div className="w-56 h-56 rounded-full border-4 border-[#58CC02]/50 pcw-ring-pulse" />
          </div>
          {/* Inner pulsing ring (offset delay) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <div
              className="w-44 h-44 rounded-full border-4 border-[#A560E8]/50 pcw-ring-pulse"
              style={{ animationDelay: '0.6s' }}
            />
          </div>
          {/* Soft glow behind mascot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <div className="w-40 h-40 rounded-full bg-[#58CC02]/30 blur-2xl pcw-glow-pulse" />
          </div>
          {/* The mascot — bounces */}
          <div className="relative pcw-mascot-bounce flex justify-center">
            <div
              className="rounded-full overflow-hidden flex items-center justify-center border-2 border-b-4 shadow-md"
              style={{ width: 160, height: 160, borderColor: '#58CC02', backgroundColor: '#E5F8D0' }}
            >
              <img
                src="/mascot-celebrating.webp"
                alt="Mascot celebrating"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Cascading H1 — each word fades in on its own delay */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-[#3C3C3C] dark:text-stone-50 leading-tight"
          style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        >
          <span className="inline-block pcw-word" style={{ animationDelay: '0.15s' }}>
            Welcome
          </span>{' '}
          <span className="inline-block pcw-word" style={{ animationDelay: '0.30s' }}>
            to
          </span>{' '}
          <span className="inline-block pcw-word text-[#A560E8]" style={{ animationDelay: '0.45s' }}>
            WriteScholar
          </span>
          <span className="inline-block pcw-word" style={{ animationDelay: '0.60s' }}>
            !
          </span>
        </h1>
        <p className="mt-3 text-stone-500 dark:text-stone-400 font-bold text-base pcw-subtitle">
          {firstName ? `Your journey starts now, ${firstName} 🎉` : 'Your journey starts now 🎉'}
        </p>

        {/* Progress bar with shimmer pass */}
        <div className="mt-8 w-60 mx-auto relative">
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden border-2 border-stone-300 dark:border-stone-600">
            <div className="h-full bg-gradient-to-r from-[#58CC02] via-[#46A302] to-[#58CC02] rounded-full pcw-progress-fill relative overflow-hidden">
              <div className="absolute inset-0 pcw-shimmer" aria-hidden />
            </div>
          </div>
          <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
            Loading your dashboard…
          </p>
        </div>
      </div>

      <style>{`
        /* Animated brand-colour radial gradient background */
        @keyframes pcwBgCycle {
          0%, 100% { background: radial-gradient(ellipse at 30% 30%, rgba(165,96,232,0.18), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(88,204,2,0.18), transparent 60%); }
          33%      { background: radial-gradient(ellipse at 70% 30%, rgba(255,150,0,0.18), transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(28,176,246,0.18), transparent 60%); }
          66%      { background: radial-gradient(ellipse at 50% 80%, rgba(255,75,75,0.16), transparent 60%), radial-gradient(ellipse at 50% 20%, rgba(255,215,0,0.18), transparent 60%); }
        }
        .pcw-bg-cycle { animation: pcwBgCycle 6s ease-in-out infinite; }

        /* Confetti — varied shapes, longer fall, gentle spin */
        @keyframes pcwConfettiFall {
          0%   { transform: translateY(-10vh) rotate(0deg) scale(1);  opacity: 1; }
          50%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
        .pcw-confetti-fall { animation: pcwConfettiFall var(--dur, 3s) ease-out forwards; }

        /* Scale-in card entrance */
        @keyframes pcwScaleIn {
          0%   { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .pcw-scale-in { animation: pcwScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        /* Pulsing concentric rings around the mascot */
        @keyframes pcwRingPulse {
          0%   { transform: scale(0.8);  opacity: 0.9; }
          70%  { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        .pcw-ring-pulse { animation: pcwRingPulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }

        /* Soft glow behind mascot pulses with the rings */
        @keyframes pcwGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.08); }
        }
        .pcw-glow-pulse { animation: pcwGlowPulse 2.4s ease-in-out infinite; }

        /* Mascot gentle bounce */
        @keyframes pcwMascotBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .pcw-mascot-bounce { animation: pcwMascotBounce 1.6s ease-in-out infinite; }

        /* Heading words cascade in */
        @keyframes pcwWordIn {
          0%   { transform: translateY(18px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        .pcw-word { animation: pcwWordIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        /* Subtitle fades in after the H1 finishes */
        @keyframes pcwSubtitleIn {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
        .pcw-subtitle { animation: pcwSubtitleIn 0.5s ease-out 0.95s both; opacity: 0; }

        /* Progress bar fill + shimmer pass */
        @keyframes pcwProgressFill { from { width: 0%; } to { width: 100%; } }
        .pcw-progress-fill { animation: pcwProgressFill 2.4s linear forwards; }
        @keyframes pcwShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .pcw-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
          animation: pcwShimmer 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
