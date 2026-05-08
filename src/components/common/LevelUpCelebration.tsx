import { useState, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════
   LevelUpCelebration — Duolingo-style full-screen level-up popup
   Shows when the user crosses into a new XP level with:
   - Confetti particles
   - Mascot celebrating gif
   - Level name + number
   - XP earned
   ═══════════════════════════════════════════════════════════════ */

interface LevelUpCelebrationProps {
  level: number;
  levelName: string;
  totalXP: number;
  onClose: () => void;
}

/* Color tiers for 100 levels — cycles through 5 palettes based on level range */
const COLOR_PALETTES = [
  { primary: '#58CC02', border: '#46A302', glow: 'rgba(88,204,2,0.3)', bg: '#EAFFD6' },   // green
  { primary: '#1CB0F6', border: '#1899D6', glow: 'rgba(28,176,246,0.3)', bg: '#DDF4FF' },  // blue
  { primary: '#A560E8', border: '#8A48C7', glow: 'rgba(165,96,232,0.3)', bg: '#F3EAFF' },  // purple
  { primary: '#FF9600', border: '#D97F00', glow: 'rgba(255,150,0,0.3)', bg: '#FFF4E0' },   // orange
  { primary: '#FF4B4B', border: '#E04343', glow: 'rgba(255,75,75,0.3)', bg: '#FFE8E8' },   // red
];
function getLevelColors(level: number) {
  if (level >= 80) return COLOR_PALETTES[3]; // orange — top tier
  if (level >= 60) return COLOR_PALETTES[2]; // purple
  if (level >= 40) return COLOR_PALETTES[4]; // red
  if (level >= 20) return COLOR_PALETTES[1]; // blue
  return COLOR_PALETTES[0]; // green
}

const CONFETTI_COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#A560E8', '#FFD700', '#E040FB', '#00E5FF'];

const LevelUpCelebration = ({ level, levelName, totalXP, onClose }: LevelUpCelebrationProps) => {
  const [show, setShow] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showMascot, setShowMascot] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const colors = getLevelColors(level);

  useEffect(() => {
    // Stagger the animations
    const t1 = setTimeout(() => setShow(true), 50);
    const t2 = setTimeout(() => setShowContent(true), 300);
    const t3 = setTimeout(() => setShowMascot(true), 600);
    const t4 = setTimeout(() => setShowDetails(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  // Generate confetti particles
  const confetti = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
    shape: i % 3, // 0 = square, 1 = circle, 2 = triangle
  }));

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Level up celebration"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute animate-confetti-fall"
            style={{
              left: p.left,
              top: '-5%',
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {p.shape === 0 ? (
              <div style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: 2 }} />
            ) : p.shape === 1 ? (
              <div style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '50%' }} />
            ) : (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${p.size / 2}px solid transparent`,
                  borderRight: `${p.size / 2}px solid transparent`,
                  borderBottom: `${p.size}px solid ${p.color}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
        .animate-confetti-fall { animation: confettiFall var(--dur, 3s) ease-out forwards; }
        @keyframes levelPop {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes mascotBounce {
          0% { transform: translateY(40px) scale(0.5); opacity: 0; }
          60% { transform: translateY(-10px) scale(1.05); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes detailsSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes starBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 0.8; }
          100% { transform: scale(1) rotate(360deg); opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}; }
          50% { box-shadow: 0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}; }
        }
      `}</style>

      {/* Main card */}
      <div
        className={`relative z-10 w-[90vw] max-w-[420px] rounded-3xl bg-white dark:bg-stone-900 border-2 border-b-4 overflow-hidden ${
          showContent ? '' : 'scale-50 opacity-0'
        }`}
        style={{
          borderColor: colors.primary,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: showContent ? 'pulseGlow 2.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Top color band */}
        <div
          className="relative py-8 sm:py-10 flex flex-col items-center overflow-hidden"
          style={{ backgroundColor: colors.bg }}
        >
          {/* Starburst behind level number */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div
              className="w-64 h-64 rounded-full opacity-30"
              style={{
                background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
                animation: 'starBurst 3s ease-out forwards',
              }}
            />
          </div>

          {/* "LEVEL UP!" text */}
          <div
            className="relative"
            style={{
              animation: showContent ? 'levelPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              opacity: showContent ? 1 : 0,
            }}
          >
            <p
              className="text-xs font-extrabold uppercase tracking-[0.3em] mb-3"
              style={{ color: colors.primary }}
            >
              Level up!
            </p>
            <div
              className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center border-4"
              style={{
                borderColor: colors.primary,
                backgroundColor: 'white',
                boxShadow: `0 0 0 6px ${colors.bg}, 0 0 30px ${colors.glow}`,
              }}
            >
              <div className="text-center">
                <p
                  className="text-3xl sm:text-4xl font-extrabold leading-none"
                  style={{ color: colors.primary }}
                >
                  {level}
                </p>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 mt-0.5">
                  Level
                </p>
              </div>
            </div>
          </div>

          {/* Mascot */}
          <div
            className="relative mt-4"
            style={{
              animation: showMascot ? 'mascotBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              opacity: showMascot ? 1 : 0,
            }}
          >
            <img
              src="/mascot-celebrating.gif"
              alt="Mascot celebrating"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Bottom details */}
        <div
          className="p-6 sm:p-8 text-center"
          style={{
            animation: showDetails ? 'detailsSlideUp 0.5s ease-out forwards' : 'none',
            opacity: showDetails ? 1 : 0,
          }}
        >
          <h2
            className="text-2xl sm:text-3xl font-extrabold leading-tight"
            style={{
              fontFamily: "'Nunito', system-ui, sans-serif",
              color: colors.primary,
            }}
          >
            {levelName}
          </h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-bold">
            You've reached a new level!
          </p>

          {/* XP badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-b-4" style={{ borderColor: `${colors.primary}40`, backgroundColor: colors.bg }}>
            <span className="text-lg" aria-hidden>
              {level >= 80 ? '👑' : level >= 50 ? '🌟' : level >= 20 ? '💎' : '⭐'}
            </span>
            <span className="text-sm font-extrabold" style={{ color: colors.primary }}>
              {totalXP} XP earned
            </span>
          </div>

          {/* Continue button */}
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 w-full rounded-xl py-3.5 text-base font-extrabold uppercase tracking-wide text-white border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all"
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.border,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%), ${colors.primary}`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          >
            Amazing!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpCelebration;
