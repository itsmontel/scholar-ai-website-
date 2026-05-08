/* ═══════════════════════════════════════════════════════════════
   QuizMascotReaction — Duolingo-style answer feedback panel.
   Shows a happy mascot + "Nice work!" on correct, a sad mascot +
   "Not quite!" on wrong. Renders as a sticky bottom panel inside
   any quiz view; the parent decides when to show it via the
   `state` prop (set on Check, cleared on Continue/next question).

   Also exports a smaller inline variant for embedded quizzes that
   already have a feedback area.
   ═══════════════════════════════════════════════════════════════ */

interface QuizMascotReactionProps {
  /** 'correct' = happy mascot, 'wrong' = sad mascot, null = hidden */
  state: 'correct' | 'wrong' | null;
  /** Optional override for the heading line (defaults: "Nice work!" / "Not quite!") */
  message?: string;
  /** Optional sub-text shown beneath the heading (e.g. correct answer hint) */
  subMessage?: string;
  /** Optional Continue button — wired to parent's "next question" handler */
  onContinue?: () => void;
  /** Layout: 'banner' = sticky bottom panel (best for full-screen quizzes),
              'inline' = compact card (best when nested inside other UI). */
  variant?: 'banner' | 'inline';
}

const QuizMascotReaction = ({
  state,
  message,
  subMessage,
  onContinue,
  variant = 'banner',
}: QuizMascotReactionProps) => {
  if (!state) return null;
  const isCorrect = state === 'correct';
  const heading = message || (isCorrect ? 'Nice work!' : 'Not quite!');

  const palette = isCorrect
    ? {
        bg: '#D7FFB8',
        border: '#46A302',
        text: '#46A302',
        btnBg: '#58CC02',
        btnBorder: '#46A302',
      }
    : {
        bg: '#FFE0E0',
        border: '#E04343',
        text: '#E04343',
        btnBg: '#FF4B4B',
        btnBorder: '#E04343',
      };

  const mascotSrc = isCorrect ? '/mascot-celebrating.webp' : '/mascot-sad.webp';

  if (variant === 'inline') {
    /* Compact card — fits inside an existing feedback section. */
    return (
      <div
        className="qmr-pop-in rounded-2xl border-2 border-b-4 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      >
        <img
          src={mascotSrc}
          alt=""
          width={56}
          height={56}
          className="qmr-mascot-bob w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
          loading="eager"
          decoding="async"
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-base sm:text-lg font-extrabold leading-tight" style={{ color: palette.text }}>
            {heading}
          </p>
          {subMessage && (
            <p className="text-xs sm:text-sm font-bold mt-0.5" style={{ color: palette.text }}>
              {subMessage}
            </p>
          )}
        </div>
        <style>{`
          @keyframes qmrPopIn {
            0%   { transform: translateY(8px) scale(0.94); opacity: 0; }
            60%  { transform: translateY(-2px) scale(1.03); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          .qmr-pop-in { animation: qmrPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
          @keyframes qmrMascotBob {
            0%, 100% { transform: translateY(0) rotate(${isCorrect ? '-2deg' : '2deg'}); }
            50%      { transform: translateY(-3px) rotate(${isCorrect ? '4deg' : '-4deg'}); }
          }
          .qmr-mascot-bob { animation: qmrMascotBob 1.2s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .qmr-pop-in, .qmr-mascot-bob { animation: none; } }
        `}</style>
      </div>
    );
  }

  /* Banner — full-width Duolingo-style bottom panel. */
  return (
    <div
      className="qmr-banner-slide fixed bottom-0 left-0 right-0 z-[200] border-t-2"
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
        <img
          src={mascotSrc}
          alt=""
          width={72}
          height={72}
          className="qmr-mascot-bob w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
          loading="eager"
          decoding="async"
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-lg sm:text-2xl font-extrabold leading-tight" style={{ color: palette.text, fontFamily: '"Nunito", system-ui, sans-serif' }}>
            {heading}
          </p>
          {subMessage && (
            <p className="text-xs sm:text-sm font-bold mt-1" style={{ color: palette.text }}>
              {subMessage}
            </p>
          )}
        </div>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="shrink-0 px-5 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-white font-extrabold text-sm sm:text-base uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all"
            style={{ backgroundColor: palette.btnBg, borderColor: palette.btnBorder }}
          >
            Continue
          </button>
        )}
      </div>
      <style>{`
        @keyframes qmrBannerSlide {
          0%   { transform: translateY(110%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .qmr-banner-slide { animation: qmrBannerSlide 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes qmrMascotBob {
          0%, 100% { transform: translateY(0) rotate(${isCorrect ? '-2deg' : '2deg'}); }
          50%      { transform: translateY(-4px) rotate(${isCorrect ? '4deg' : '-4deg'}); }
        }
        .qmr-mascot-bob { animation: qmrMascotBob 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .qmr-banner-slide, .qmr-mascot-bob { animation: none; } }
      `}</style>
    </div>
  );
};

export default QuizMascotReaction;
