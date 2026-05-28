import { useState, useEffect } from 'react';

const FEATURES = [
  {
    emoji: '📝',
    title: 'AI Essay Feedback',
    desc: 'Instant analysis, suggestions & grading',
    color: '#A560E8',
    tint: '#F3EAFF',
  },
  {
    emoji: '📖',
    title: 'Smart Summaries',
    desc: 'Condense any text or paper in seconds',
    color: '#8A48C7',
    tint: '#F3EAFF',
  },
  {
    emoji: '🎮',
    title: 'Arcade mode',
    desc: 'Crater Blast, Word Tower & more',
    color: '#A560E8',
    tint: '#F3EAFF',
  },
  {
    emoji: '📚',
    title: 'Citations & Study Packs',
    desc: 'Auto-generate APA, MLA, flashcards & quizzes',
    color: '#8A48C7',
    tint: '#F3EAFF',
  },
] as const;

const HEADLINES = [
  'Summarise, cite & analyse',
  'Powerful study tools for students',
  'Paper analysis & so much more',
  'Your all-in-one academic AI',
] as const;

/**
 * Right-hand marketing column used on login, signup, and reset-password flows.
 * Duolingo-style design with 3D borders, Nunito font, and brand colors — matches
 * the rest of the WriteScholar app (landing page, dashboard, study tools).
 */
export const AuthMarketingSide: React.FC = () => {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIdx((prev) => (prev + 1) % HEADLINES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="hidden lg:flex lg:w-1/2 min-h-screen min-h-[100dvh] flex-col items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: '"Nunito", system-ui, sans-serif',
        background: 'linear-gradient(165deg, #F3EAFF 0%, #E8DAFF 45%, #F3EAFF 100%)',
      }}
    >
      {/* Decorative background shapes — soft single-hue purple orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #A560E8 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8A48C7 0%, transparent 70%)' }} />
        <div className="absolute top-1/4 -left-8 w-48 h-48 rounded-full opacity-[0.13]" style={{ background: 'radial-gradient(circle, #A560E8 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 -right-12 w-56 h-56 rounded-full opacity-[0.13]" style={{ background: 'radial-gradient(circle, #8A48C7 0%, transparent 70%)' }} />

        {/* Floating dot pattern — purple shades only */}
        {[
          { top: '8%', left: '15%', size: 8, color: '#A560E8', delay: 0 },
          { top: '18%', right: '20%', size: 6, color: '#8A48C7', delay: 1 },
          { top: '45%', left: '8%', size: 10, color: '#A560E8', delay: 0.5 },
          { top: '72%', right: '12%', size: 7, color: '#8A48C7', delay: 1.5 },
          { top: '85%', left: '22%', size: 5, color: '#7733B5', delay: 2 },
          { top: '30%', right: '8%', size: 9, color: '#A560E8', delay: 0.8 },
          { top: '60%', left: '18%', size: 6, color: '#8A48C7', delay: 1.2 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: dot.top,
              left: (dot as any).left,
              right: (dot as any).right,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              opacity: 0.25,
              animationDelay: `${dot.delay}s`,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full px-6 xl:px-8 py-8">
        {/* Mascot with sparkle + star badges */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 -m-2 rounded-2xl bg-white/40 blur-xl" />
            <div className="relative w-28 h-28 rounded-2xl border-2 border-b-4 border-[#A560E8]/25 bg-white shadow-xl shadow-[#A560E8]/10 flex items-center justify-center overflow-hidden">
              <img
                src="/mascot-study.webp"
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="w-[96px] h-[96px] object-contain"
              />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-lg bg-[#A560E8] border-2 border-b-[3px] border-[#8A48C7] flex items-center justify-center text-sm shadow-lg shadow-[#A560E8]/30">
              ✨
            </div>
            <div className="absolute -bottom-1 -left-1.5 w-7 h-7 rounded-lg bg-[#8A48C7] border-2 border-b-[3px] border-[#7733B5] flex items-center justify-center text-xs shadow-lg shadow-[#8A48C7]/30">
              ⭐
            </div>
          </div>
        </div>

        {/* Animated headline */}
        <div className="text-center mb-6">
          <h2 className="text-[22px] xl:text-[26px] font-extrabold tracking-tight text-stone-800 mb-1.5 min-h-[34px] flex items-center justify-center">
            <span
              key={headlineIdx}
              className="inline-block"
              style={{ animation: 'authFadeInUp 0.5s ease-out' }}
            >
              {HEADLINES[headlineIdx]}
            </span>
          </h2>
          <p className="text-sm font-bold text-stone-500">
            Join thousands of students acing their coursework
          </p>
        </div>

        {/* Feature cards */}
        <div className="space-y-2.5">
          {FEATURES.map((f, i) => {
            const isActive = activeFeature === i;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-b-4 transition-all duration-500 cursor-default"
                style={{
                  backgroundColor: isActive ? f.tint : 'white',
                  borderColor: isActive ? `${f.color}40` : '#e7e5e4',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isActive
                    ? `0 6px 20px ${f.color}18`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div
                  className="w-10 h-10 rounded-lg border-2 border-b-[3px] flex items-center justify-center text-lg shrink-0 transition-transform duration-500"
                  style={{
                    backgroundColor: isActive ? `${f.color}20` : f.tint,
                    borderColor: `${f.color}50`,
                    transform: isActive ? 'rotate(-6deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                  }}
                >
                  {f.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[13px] text-stone-800 leading-tight">
                    {f.title}
                  </p>
                  <p className="text-[11px] font-bold text-stone-400 mt-0.5 leading-snug">
                    {f.desc}
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-500"
                  style={{
                    backgroundColor: isActive ? f.color : '#e7e5e440',
                  }}
                >
                  <svg
                    className="w-3 h-3 transition-colors duration-500"
                    fill="none"
                    stroke={isActive ? 'white' : '#a8a29e'}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust pill — same pattern as the landing-page hero */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-b-[3px] border-[#E5E5E5] bg-white pl-1.5 pr-4 py-1 shadow-[0_8px_22px_-6px_rgba(0,0,0,0.20)]">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3EAFF]"
              aria-hidden
            >
              <svg className="w-[18px] h-[18px] text-[#8A48C7]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </span>
            <span className="text-[13px] font-bold text-stone-800">
              Trusted by <span className="font-extrabold text-[#A560E8] tabular-nums">50,000+</span> students worldwide
            </span>
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes authFadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AuthMarketingSide;
