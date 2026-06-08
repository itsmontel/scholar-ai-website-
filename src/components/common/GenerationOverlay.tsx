import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   GenerationOverlay — a premium, compact "building it for you"
   moment shown while a study pack / citation list / daily review is
   prepared. Mascot-led, with a soft aura, one live status line, a
   slim progress bar + step dots, and a rotating tip. All keyframes
   are scoped here so it doesn't depend on the Tailwind config.
   Theme-able per variant; respects reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

type Variant = 'studyPack' | 'citations' | 'dailyReview' | 'analyze';

interface GenerationOverlayProps {
  open: boolean;
  variant: Variant;
  /** Optional overrides */
  title?: string;
}

type VariantConfig = {
  title: string;
  accent: string;
  accentDark: string;
  glowRgb: string;
  mascot: string;
  steps: { icon: string; label: string }[];
  tips: string[];
};

const CONFIG: Record<Variant, VariantConfig> = {
  studyPack: {
    title: 'Building your study pack',
    accent: '#FF9600',
    accentDark: '#B85F00',
    glowRgb: '255,150,0',
    mascot: '/mascot-juggling.webp',
    steps: [
      { icon: '📖', label: 'Reading your material' },
      { icon: '🎓', label: 'Writing your lesson' },
      { icon: '🃏', label: 'Designing flashcards' },
      { icon: '📝', label: 'Generating a quiz' },
      { icon: '🧩', label: 'Crafting a crossword' },
      { icon: '🎮', label: 'Loading arcade games' },
      { icon: '✨', label: 'Polishing your pack' },
    ],
    tips: [
      'One generation = a lesson, flashcards, a quiz, a crossword and games.',
      'The smarter your notes, the sharper the questions we write.',
      'Replay the games as many times as you like to lock it in.',
    ],
  },
  citations: {
    title: 'Finding your sources',
    accent: '#1CB0F6',
    accentDark: '#1486B5',
    glowRgb: '28,176,246',
    mascot: '/mascot-thinking.webp',
    steps: [
      { icon: '🔍', label: 'Understanding your topic' },
      { icon: '📚', label: 'Searching academic sources' },
      { icon: '📋', label: 'Checking peer-reviewed journals' },
      { icon: '✨', label: 'Filtering for relevance' },
      { icon: '🏷️', label: 'Formatting in your style' },
      { icon: '✅', label: 'Finalizing your list' },
    ],
    tips: [
      'Every source comes with a ready-to-use sentence and an in-text citation.',
      'Switch styles anytime — APA, MLA, Chicago, Harvard, IEEE and more.',
      'We prioritise credible, peer-reviewed work that fits your topic.',
    ],
  },
  dailyReview: {
    title: 'Preparing your review',
    accent: '#58CC02',
    accentDark: '#46A302',
    glowRgb: '88,204,2',
    mascot: '/mascot-study.webp',
    steps: [
      { icon: '📚', label: 'Gathering your study materials' },
      { icon: '🎯', label: 'Picking the best questions' },
      { icon: '🃏', label: 'Mixing quizzes & flashcards' },
      { icon: '🔁', label: 'Applying spaced repetition' },
      { icon: '✨', label: "Building today's session" },
    ],
    tips: [
      'Daily reviews pull from every study pack you have made.',
      'A few minutes a day keeps your streak — and your grades — alive.',
      'Spaced repetition resurfaces what you are about to forget.',
    ],
  },
  analyze: {
    title: 'Analyzing your essay',
    accent: '#A560E8',
    accentDark: '#7733B5',
    glowRgb: '165,96,232',
    mascot: '/mascot-paper.webp',
    steps: [
      { icon: '📄', label: 'Reading your draft' },
      { icon: '📊', label: 'Checking structure & argument' },
      { icon: '✏️', label: 'Assessing grammar & style' },
      { icon: '🏷️', label: 'Writing margin notes' },
      { icon: '🎯', label: 'Scoring the rubric' },
      { icon: '✅', label: 'Finalizing your feedback' },
    ],
    tips: [
      'Feedback is marked up right inside your document — strengths, fixes, and a grade.',
      'We check thesis, evidence, structure, citations, and writing quality.',
      'Re-run analysis anytime after you edit to see your score improve.',
    ],
  },
};

export default function GenerationOverlay({ open, variant, title }: GenerationOverlayProps) {
  const cfg = CONFIG[variant];
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setProgress(0);
    setTipIdx(0);

    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i < cfg.steps.length - 1 ? i + 1 : i));
    }, 2100);

    const progTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 96) return 96;
        const inc = p < 25 ? 1.5 : p < 55 ? 0.9 : p < 80 ? 0.5 : 0.2;
        return Math.min(96, p + inc);
      });
    }, 140);

    const tipTimer = setInterval(() => {
      setTipIdx((t) => (t + 1) % cfg.tips.length);
    }, 4600);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progTimer);
      clearInterval(tipTimer);
    };
  }, [open, cfg.steps.length, cfg.tips.length]);

  if (!open) return null;

  const { accent, accentDark, glowRgb, mascot } = cfg;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? cfg.title}
    >
      <style>{`
        @keyframes goFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes goCardIn{0%{opacity:0;transform:translateY(14px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes goFloat{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-8px) rotate(1.5deg)}}
        @keyframes goShimmer{0%{background-position:-160% 0}100%{background-position:260% 0}}
        @keyframes goTwinkle{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes goRingPulse{0%{opacity:.45;transform:scale(.8)}70%{opacity:0;transform:scale(1.3)}100%{opacity:0;transform:scale(1.3)}}
        @keyframes goRowIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .go-scrim{animation:goFadeIn .25s ease-out}
        .go-card{animation:goCardIn .42s cubic-bezier(.2,.8,.2,1)}
        .go-float{animation:goFloat 3.4s ease-in-out infinite}
        .go-shimmer{background-size:200% 100%;animation:goShimmer 1.5s linear infinite}
        .go-twinkle{animation:goTwinkle 2.2s ease-in-out infinite}
        .go-ringpulse{animation:goRingPulse 2.8s ease-out infinite}
        .go-rowin{animation:goRowIn .32s ease-out}
        @media (prefers-reduced-motion:reduce){
          .go-float,.go-shimmer,.go-twinkle,.go-ringpulse{animation:none!important}
        }
      `}</style>

      {/* Light dim only — no backdrop blur so the dashboard stays sharp */}
      <div
        className="go-scrim absolute inset-0 bg-black/25 pointer-events-auto"
        aria-hidden
      />

      {/* Card */}
      <div
        className="go-card relative w-full max-w-[25rem] rounded-[26px] bg-white dark:bg-stone-900 border-2 border-white/60 dark:border-stone-700 px-6 sm:px-7 pt-6 pb-6 overflow-hidden"
        style={{ boxShadow: `0 40px 90px -30px rgba(${glowRgb},0.55), 0 18px 50px -24px rgba(0,0,0,0.5)` }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accentDark})` }} aria-hidden />
        <div className="pointer-events-none absolute -top-24 -right-20 w-52 h-52 rounded-full blur-3xl opacity-40" style={{ background: accent }} aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-20 w-52 h-52 rounded-full blur-3xl opacity-20" style={{ background: accent }} aria-hidden />

        {/* Mascot emblem */}
        <div className="relative mx-auto mb-3 h-28 w-28">
          <span className="go-ringpulse absolute inset-3 rounded-full" style={{ border: `2px solid rgba(${glowRgb},0.5)` }} aria-hidden />
          <span className="go-ringpulse absolute inset-3 rounded-full" style={{ border: `2px solid rgba(${glowRgb},0.5)`, animationDelay: '1.4s' }} aria-hidden />
          <span className="absolute inset-2 rounded-full blur-xl" style={{ background: `radial-gradient(circle, rgba(${glowRgb},0.35), transparent 70%)` }} aria-hidden />
          <img
            src={mascot}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            className="go-float relative z-10 mx-auto h-28 w-auto object-contain"
            style={{ filter: `drop-shadow(0 14px 24px rgba(${glowRgb},0.45))` }}
          />
          <span className="go-twinkle absolute top-1 right-2 text-[#FFC800] text-sm z-20" aria-hidden>✦</span>
          <span className="go-twinkle absolute bottom-3 left-1 text-sm z-20" style={{ color: accent, animationDelay: '0.9s' }} aria-hidden>✦</span>
        </div>

        {/* Title */}
        <h3 className="relative text-center text-[1.35rem] font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          {title ?? cfg.title}
        </h3>

        {/* Live status line */}
        <div className="relative mt-2 flex items-center justify-center gap-2 h-6">
          <svg className="w-3.5 h-3.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: accent }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
          </svg>
          <span key={stepIdx} className="go-rowin text-[13.5px] font-bold text-stone-600 dark:text-stone-300">
            <span className="mr-1" aria-hidden>{cfg.steps[stepIdx].icon}</span>{cfg.steps[stepIdx].label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative mt-3">
          <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-out relative overflow-hidden"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accentDark})` }}
            >
              <span className="go-shimmer absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} aria-hidden />
            </div>
          </div>
          {/* Step dots + percentage */}
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {cfg.steps.map((s, i) => (
                <span
                  key={s.label}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === stepIdx ? 16 : 6,
                    height: 6,
                    background: i <= stepIdx ? accent : 'rgba(120,113,108,0.22)',
                  }}
                  aria-hidden
                />
              ))}
            </div>
            <span className="text-[12px] font-extrabold tabular-nums" style={{ color: accentDark }}>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Rotating tip */}
        <div
          className="relative mt-4 rounded-2xl px-3.5 py-2.5"
          style={{ background: `rgba(${glowRgb},0.08)`, border: `1.5px solid rgba(${glowRgb},0.18)` }}
        >
          <p key={tipIdx} className="go-rowin text-[11.5px] font-semibold text-center text-stone-600 dark:text-stone-300 leading-snug">
            <span className="mr-1">💡</span>{cfg.tips[tipIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}
