//
// WelcomeOnboardingPage.tsx
//
// Pre-signup, Duolingo-energy funnel. Visual language matches the
// existing post-signup OnboardingPage (`aha` phase) so the user
// transitions into signup without a jarring style change:
//
//   • WriteScholarEditorialBackgroundLayers as the canvas
//   • Floating violet/fuchsia ambient orbs (animated)
//   • EB Garamond serif headlines with a gradient-clip on the key word
//   • Glass cards (rounded-2xl/3xl, white/80 + ring + soft shadows)
//   • Chunky CTA buttons with bottom-shadow lip
//   • GIF mascots (mascot-dance / mascot-paper / mascot-laptop / mascot-study)
//     instead of the SVG ScholarMascot, so the character actually moves
//
// Phases:
//   1. welcome   — "Hi there! I'm Scholar"
//   2. hype      — "Let's go change your grade"
//   3. q-source  — "How'd you find Scholar?" (6-card grid)
//   4. q-goal    — "What grade are you chasing?" (4-card grid)
//   5. q-time    — "How long can you study a day?" (4-card grid)
//   6. achieve   — "Here's what you'll get" (3 feature rows)
//   7. try       — Paste a topic → fake "Scholar's making your pack…"
//                   loader → mocked pack preview → CTA to /signup
//
// On completion (try → "Save my pack"), answers + the user's typed
// topic are persisted to localStorage under
// `ws_welcome_onboarding_answers` so the post-signup OnboardingPage can
// pick up where we left off.
//

import { useEffect, useRef, useState } from 'react';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import { trackEvent } from '../../utils/analytics';

interface WelcomeOnboardingPageProps {
  onNavigate: (page: string) => void;
}

type Phase = 'welcome' | 'hype' | 'q-source' | 'q-goal' | 'q-time' | 'achieve' | 'try';

const PHASE_ORDER: Phase[] = ['welcome', 'hype', 'q-source', 'q-goal', 'q-time', 'achieve', 'try'];

interface Answers {
  source?: string;
  goal?: string;
  studyTime?: string;
  topic?: string;
}

const SOURCE_OPTIONS = [
  { id: 'tiktok',    label: 'TikTok',          emoji: '🎵' },
  { id: 'instagram', label: 'Instagram',       emoji: '📸' },
  { id: 'friend',    label: 'Friend / family', emoji: '🫶' },
  { id: 'google',    label: 'Google Search',   emoji: '🔍' },
  { id: 'youtube',   label: 'YouTube',         emoji: '📺' },
  { id: 'other',     label: 'Somewhere else',  emoji: '✨' },
];

const GOAL_OPTIONS = [
  { id: 'as',      label: "Crush A's",     emoji: '🏆' },
  { id: 'bs',      label: "Solid B's",     emoji: '👍' },
  { id: 'pass',    label: 'Just pass',     emoji: '🛟' },
  { id: 'catchup', label: 'Catch up fast', emoji: '⚡' },
];

const TIME_OPTIONS = [
  { id: '5',  label: '5 min',     emoji: '🌱', blurb: 'Casual' },
  { id: '10', label: '10 min',    emoji: '🎯', blurb: 'Regular' },
  { id: '20', label: '20 min',    emoji: '🔥', blurb: 'Serious' },
  { id: '30', label: '30+ min',   emoji: '🏆', blurb: 'Intense' },
];

const ACHIEVE_FEATURES = [
  {
    icon: '✏️',
    title: 'Notes → study pack in 60 seconds',
    subtitle: 'Scholar turns your notes into a quiz, flashcards, lesson, and crossword automatically.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: '🎓',
    title: 'AI feedback on every essay',
    subtitle: 'Professor-style annotations + a grade-level rubric — before your real prof sees it.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: '🎮',
    title: 'Beat finals with quizzes, flashcards & games',
    subtitle: 'Crater Blast, Word Tower, and 90+ achievements turn revision into a streak.',
    gradient: 'from-amber-500 to-orange-600',
  },
];

// Sample topics so the "try" phase has a one-tap option for users who
// don't want to think of one.
const SAMPLE_TOPICS = [
  'The French Revolution',
  'Photosynthesis',
  'Cell biology',
  'World War 1',
  'Macbeth',
];

const STORAGE_KEY = 'ws_welcome_onboarding_answers';

export default function WelcomeOnboardingPage({ onNavigate }: WelcomeOnboardingPageProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [answers, setAnswers] = useState<Answers>({});
  const [topicDraft, setTopicDraft] = useState('');
  const [tryStep, setTryStep] = useState<'input' | 'generating' | 'reveal'>('input');
  const generatingTimerRef = useRef<number | null>(null);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const progress = (phaseIndex + 1) / PHASE_ORDER.length;
  const firstName = 'friend'; // pre-signup — no name yet

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    trackEvent('welcome_onboarding_view', { phase });
  }, [phase]);

  // Reset try-phase state whenever we leave it (back arrow, refresh)
  useEffect(() => {
    if (phase !== 'try') {
      setTryStep('input');
      if (generatingTimerRef.current) {
        window.clearTimeout(generatingTimerRef.current);
        generatingTimerRef.current = null;
      }
    }
    return () => {
      if (generatingTimerRef.current) {
        window.clearTimeout(generatingTimerRef.current);
        generatingTimerRef.current = null;
      }
    };
  }, [phase]);

  const advance = () => {
    const next = PHASE_ORDER[phaseIndex + 1];
    if (next) setPhase(next);
  };

  const goBack = () => {
    const prev = PHASE_ORDER[phaseIndex - 1];
    if (prev) setPhase(prev);
  };

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...answers,
        topic: topicDraft || answers.topic || undefined,
        completedAt: new Date().toISOString(),
      }));
    } catch {
      /* private browsing — non-fatal */
    }
    trackEvent('welcome_onboarding_complete', { ...answers, hadTopic: !!topicDraft });
    onNavigate('signup');
  };

  const setAnswer = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    trackEvent('welcome_onboarding_answer', { question: key, value });
  };

  const startFakeGenerate = () => {
    setAnswer('topic', topicDraft);
    setTryStep('generating');
    trackEvent('welcome_onboarding_demo_generate', { topic: topicDraft });
    // ~6 seconds of pretend work then reveal the mocked pack
    generatingTimerRef.current = window.setTimeout(() => {
      setTryStep('reveal');
      trackEvent('welcome_onboarding_demo_reveal', { topic: topicDraft });
    }, 6000);
  };

  // Continue is enabled only when each question screen has a selection.
  const canContinue = (() => {
    switch (phase) {
      case 'q-source': return !!answers.source;
      case 'q-goal':   return !!answers.goal;
      case 'q-time':   return !!answers.studyTime;
      case 'try':      return tryStep === 'reveal';
      default:         return true;
    }
  })();

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />

      {/* Ambient brand orbs (mirror OnboardingPage's aha aesthetic) */}
      <div className="pointer-events-none absolute top-20 left-[-6%] h-72 w-72 rounded-full bg-violet-400/15 dark:bg-violet-500/10 blur-3xl welcome-orb" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 right-[-5%] h-80 w-80 rounded-full bg-fuchsia-400/12 dark:bg-fuchsia-500/10 blur-3xl welcome-orb-delay" aria-hidden />
      <div className="pointer-events-none absolute bottom-32 left-1/3 h-64 w-64 rounded-full bg-amber-300/10 dark:bg-amber-400/8 blur-3xl welcome-orb" style={{ animationDelay: '2s' }} aria-hidden />

      {/* Top bar — logo + progress + back arrow */}
      <div className="relative z-10 px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200/80 dark:border-stone-600 bg-white/80 dark:bg-stone-800/80 shadow-sm ring-1 ring-white/50 dark:ring-white/5">
              <img src="/main-logo.png" alt="WriteScholar" className="w-full h-full object-contain" loading="eager" width="120" height="120" />
            </div>
            <span className="hidden sm:inline text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              WriteScholar
            </span>
          </div>

          {phase !== 'welcome' && phase !== 'hype' && (
            <>
              <button
                onClick={goBack}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
                aria-label="Back"
              >
                ←
              </button>
              <div className="flex-1 h-3 bg-stone-200/80 dark:bg-stone-800/80 rounded-full overflow-hidden ring-1 ring-stone-300/40 dark:ring-stone-700/40">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-6 py-6 sm:py-10">
        {phase === 'welcome' && <WelcomeScreen />}
        {phase === 'hype'    && <HypeScreen />}
        {phase === 'q-source' && (
          <QuestionScreen
            question="How'd you find Scholar?"
            options={SOURCE_OPTIONS}
            selected={answers.source}
            onSelect={(id) => setAnswer('source', id)}
            mascotGif="/mascot-paper.webp"
          />
        )}
        {phase === 'q-goal' && (
          <QuestionScreen
            question="What grade are you chasing?"
            options={GOAL_OPTIONS}
            selected={answers.goal}
            onSelect={(id) => setAnswer('goal', id)}
            mascotGif="/mascot-laptop.webp"
          />
        )}
        {phase === 'q-time' && (
          <QuestionScreen
            question="How long can you study a day?"
            options={TIME_OPTIONS}
            selected={answers.studyTime}
            onSelect={(id) => setAnswer('studyTime', id)}
            mascotGif="/mascot-study.webp"
            twoColumn
          />
        )}
        {phase === 'achieve' && <AchieveScreen />}
        {phase === 'try' && (
          <TryScreen
            firstName={firstName}
            topic={topicDraft}
            setTopic={setTopicDraft}
            step={tryStep}
            onGenerate={startFakeGenerate}
          />
        )}
      </div>

      {/* Bottom CTA bar */}
      <div className="relative z-10 border-t border-stone-200/60 dark:border-stone-800/60 bg-white/85 dark:bg-stone-950/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-5 flex justify-end">
          <button
            onClick={phase === 'try' ? finish : advance}
            disabled={!canContinue}
            className={[
              'group relative inline-flex items-center justify-center gap-2',
              'px-10 py-4 rounded-2xl font-bold text-base sm:text-lg tracking-wide uppercase transition-all duration-200',
              canContinue
                ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-[0_8px_0_-2px_rgba(91,33,182,1),0_18px_30px_-12px_rgba(124,58,237,0.6)] hover:shadow-[0_8px_0_-2px_rgba(91,33,182,1),0_22px_36px_-12px_rgba(124,58,237,0.7)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_3px_0_-2px_rgba(91,33,182,1),0_8px_18px_-12px_rgba(124,58,237,0.5)]'
                : 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed',
            ].join(' ')}
          >
            {phase === 'try' ? 'Save my pack — sign up' : 'Continue'}
            {canContinue && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes welcomeOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(14px,-12px) scale(1.06); }
        }
        @keyframes welcomeOrbDelay {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-14px,10px) scale(1.04); }
        }
        .welcome-orb       { animation: welcomeOrb 16s ease-in-out infinite; }
        .welcome-orb-delay { animation: welcomeOrbDelay 18s ease-in-out infinite; }

        @keyframes welcomeFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .welcome-fade-up { animation: welcomeFadeUp 0.5s cubic-bezier(.22,1,.36,1) backwards; }

        @keyframes welcomeBubblePop {
          0%   { opacity: 0; transform: scale(0.85); }
          60%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .welcome-bubble-pop { animation: welcomeBubblePop 0.45s cubic-bezier(.22,1,.36,1) backwards; }

        @media (prefers-reduced-motion: reduce) {
          .welcome-orb, .welcome-orb-delay, .welcome-fade-up, .welcome-bubble-pop { animation: none; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Welcome (huge mascot + first speech bubble)
// ─────────────────────────────────────────────────────────────────────

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl welcome-fade-up">
      <SpeechBubble pointDown>
        Hi there! I'm{' '}
        <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-violet-300 bg-clip-text text-transparent">
          Scholar
        </span>
        .
      </SpeechBubble>
      <div className="mt-6 relative">
        <div className="pointer-events-none absolute inset-0 m-auto rounded-full bg-gradient-radial from-violet-400/40 via-violet-400/0 to-transparent blur-2xl" style={{ width: 320, height: 320 }} aria-hidden />
        <img
          src="/mascot-dance.webp"
          alt="Scholar mascot"
          width={280}
          height={280}
          className="relative w-[280px] h-[280px] object-contain drop-shadow-[0_24px_40px_rgba(124,58,237,0.4)]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Hype (excited mascot + party energy, no upward-line emoji)
// ─────────────────────────────────────────────────────────────────────

function HypeScreen() {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl welcome-fade-up">
      <SpeechBubble pointDown>
        Let's go{' '}
        <span className="bg-gradient-to-r from-amber-500 via-pink-500 to-fuchsia-600 bg-clip-text text-transparent font-black">
          change your grade
        </span>
        .
      </SpeechBubble>
      <div className="mt-6 relative">
        {/* Sparkle ring around the mascot */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 180;
          const y = Math.sin(angle) * 180;
          const colors = ['#FBBF24', '#D946EF', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FB923C', '#22D3EE'];
          return (
            <div
              key={i}
              className="absolute text-2xl pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(${x - 12}px, ${y - 12}px)`,
                color: colors[i],
                animation: `welcomeBubblePop 1.4s ease-in-out ${i * 110}ms infinite alternate`,
                textShadow: '0 0 12px currentColor',
              }}
              aria-hidden
            >
              {i % 2 === 0 ? '✨' : '⭐'}
            </div>
          );
        })}
        <div className="pointer-events-none absolute inset-0 m-auto rounded-full bg-gradient-radial from-fuchsia-400/45 via-violet-400/0 to-transparent blur-2xl" style={{ width: 340, height: 340 }} aria-hidden />
        <img
          src="/mascot-dance.webp"
          alt="Scholar dancing"
          width={280}
          height={280}
          className="relative w-[280px] h-[280px] object-contain drop-shadow-[0_24px_40px_rgba(217,70,239,0.45)]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Question screen (mascot left + speech + grid of cards)
// ─────────────────────────────────────────────────────────────────────

interface QuestionScreenProps {
  question: string;
  options: Array<{ id: string; label: string; emoji: string; blurb?: string }>;
  selected?: string;
  onSelect: (id: string) => void;
  mascotGif: string;
  twoColumn?: boolean;
}

function QuestionScreen({ question, options, selected, onSelect, mascotGif, twoColumn = false }: QuestionScreenProps) {
  return (
    <div className="w-full max-w-3xl flex flex-col welcome-fade-up">
      {/* Mascot + speech bubble */}
      <div className="flex items-end gap-4 mb-8">
        <img
          src={mascotGif}
          alt=""
          width={130}
          height={130}
          className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] object-contain shrink-0 drop-shadow-[0_14px_24px_rgba(124,58,237,0.30)]"
          aria-hidden
        />
        <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/70 rounded-2xl px-5 py-4 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] mb-3 ring-1 ring-white/50 dark:ring-white/5">
          <p className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50 leading-snug" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            {question}
          </p>
          <div className="absolute -left-2 bottom-5 w-4 h-4 bg-white/95 dark:bg-stone-900/90 border-l border-b border-stone-200/80 dark:border-stone-700/70 transform rotate-45" />
        </div>
      </div>

      {/* Choice grid */}
      <div className={`grid ${twoColumn ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={[
                'group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 welcome-fade-up',
                'active:translate-y-0.5',
                isSelected
                  ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.45)] ring-1 ring-violet-300/40'
                  : 'border-stone-200/80 dark:border-stone-700/70 bg-white/90 dark:bg-stone-900/80 hover:border-violet-300/70 dark:hover:border-violet-600/50 hover:shadow-md',
              ].join(' ')}
            >
              <span className="text-3xl shrink-0">{opt.emoji}</span>
              <span className="flex-1">
                <span className={`block font-bold text-base ${isSelected ? 'text-violet-900 dark:text-violet-100' : 'text-stone-900 dark:text-stone-100'}`}>
                  {opt.label}
                </span>
                {opt.blurb && (
                  <span className={`block text-xs font-semibold mt-0.5 ${isSelected ? 'text-violet-600 dark:text-violet-300' : 'text-stone-500 dark:text-stone-400'}`}>
                    {opt.blurb}
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.5)]">
                  <span className="text-white text-sm font-black">✓</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Achieve (3 feature rows + the closing pitch)
// ─────────────────────────────────────────────────────────────────────

function AchieveScreen() {
  return (
    <div className="w-full max-w-3xl flex flex-col welcome-fade-up">
      <div className="flex items-end gap-4 mb-8">
        <img
          src="/mascot-dance.webp"
          alt=""
          width={130}
          height={130}
          className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] object-contain shrink-0 drop-shadow-[0_14px_24px_rgba(217,70,239,0.30)]"
          aria-hidden
        />
        <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/70 rounded-2xl px-5 py-4 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] mb-3 ring-1 ring-white/50 dark:ring-white/5">
          <p className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50 leading-snug" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Here's what you'll get with{' '}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 dark:from-violet-300 dark:via-fuchsia-300 dark:to-violet-300 bg-clip-text text-transparent">
              WriteScholar
            </span>
            .
          </p>
          <div className="absolute -left-2 bottom-5 w-4 h-4 bg-white/95 dark:bg-stone-900/90 border-l border-b border-stone-200/80 dark:border-stone-700/70 transform rotate-45" />
        </div>
      </div>

      <div className="space-y-3">
        {ACHIEVE_FEATURES.map((feat, i) => (
          <div
            key={feat.title}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/70 shadow-[0_12px_36px_-16px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_36px_-18px_rgba(0,0,0,0.45)] ring-1 ring-white/50 dark:ring-white/5 welcome-fade-up"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-2xl shadow-[0_10px_24px_-8px_rgba(124,58,237,0.5)] shrink-0`}>
              {feat.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-50 leading-snug" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                {feat.title}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 leading-snug">{feat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> 7-day free trial</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> No card today</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Cancel anytime</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Try (paste a topic → fake generate → mocked pack reveal)
// ─────────────────────────────────────────────────────────────────────

interface TryScreenProps {
  firstName: string;
  topic: string;
  setTopic: (s: string) => void;
  step: 'input' | 'generating' | 'reveal';
  onGenerate: () => void;
}

function TryScreen({ firstName, topic, setTopic, step, onGenerate }: TryScreenProps) {
  if (step === 'input') {
    return <TryInputView topic={topic} setTopic={setTopic} onGenerate={onGenerate} />;
  }
  if (step === 'generating') {
    return <TryGeneratingView topic={topic} />;
  }
  return <TryRevealView topic={topic} firstName={firstName} />;
}

function TryInputView({ topic, setTopic, onGenerate }: { topic: string; setTopic: (s: string) => void; onGenerate: () => void }) {
  return (
    <div className="w-full max-w-3xl flex flex-col welcome-fade-up">
      <div className="flex items-end gap-4 mb-8">
        <img
          src="/mascot-paper.webp"
          alt=""
          width={130}
          height={130}
          className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] object-contain shrink-0 drop-shadow-[0_14px_24px_rgba(124,58,237,0.30)]"
          aria-hidden
        />
        <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/70 rounded-2xl px-5 py-4 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] mb-3 ring-1 ring-white/50 dark:ring-white/5">
          <p className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-50 leading-snug" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Try it now — what's a topic you're studying?
          </p>
          <div className="absolute -left-2 bottom-5 w-4 h-4 bg-white/95 dark:bg-stone-900/90 border-l border-b border-stone-200/80 dark:border-stone-700/70 transform rotate-45" />
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200/80 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/90 backdrop-blur-md p-5 sm:p-6 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.20)] dark:shadow-[0_18px_50px_-22px_rgba(0,0,0,0.55)] ring-1 ring-white/50 dark:ring-white/5">
        <label htmlFor="welcome-topic" className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Topic or notes
        </label>
        <textarea
          id="welcome-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. The French Revolution, mitochondria, Macbeth Act 3…"
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15 transition-all resize-none"
        />

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">Or try a sample:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!topic.trim()}
          className={[
            'mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-base transition-all',
            topic.trim()
              ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-[0_8px_0_-2px_rgba(91,33,182,1),0_18px_30px_-12px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_3px_0_-2px_rgba(91,33,182,1),0_8px_18px_-12px_rgba(124,58,237,0.5)]'
              : 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed',
          ].join(' ')}
        >
          ✨ Make my study pack
        </button>
        <p className="mt-2 text-center text-[11px] text-stone-500 dark:text-stone-400">No account needed yet — see what Scholar makes you.</p>
      </div>
    </div>
  );
}

const GENERATING_STEPS = [
  { icon: '📖', label: 'Reading your notes…' },
  { icon: '✏️', label: 'Writing the lesson…' },
  { icon: '🃏', label: 'Building flashcards…' },
  { icon: '❓', label: 'Generating quiz…' },
  { icon: '🎮', label: 'Loading the games…' },
];

function TryGeneratingView({ topic }: { topic: string }) {
  // Cycle through the steps so it feels like real work is happening.
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((i) => Math.min(i + 1, GENERATING_STEPS.length - 1));
    }, 1100);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center text-center welcome-fade-up">
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-0 m-auto rounded-full bg-gradient-radial from-violet-400/45 via-violet-400/0 to-transparent blur-2xl" style={{ width: 280, height: 280 }} aria-hidden />
        <img
          src="/mascot-laptop.webp"
          alt="Scholar working"
          width={200}
          height={200}
          className="relative w-[200px] h-[200px] object-contain drop-shadow-[0_24px_40px_rgba(124,58,237,0.4)]"
        />
      </div>

      <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50 mb-2 leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Scholar's making your{' '}
        <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
          {topic.length > 32 ? topic.slice(0, 32) + '…' : topic}
        </span>{' '}
        pack…
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">This usually takes about 60 seconds.</p>

      <div className="w-full max-w-md space-y-2">
        {GENERATING_STEPS.map((s, i) => {
          const done   = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div
              key={s.label}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-300',
                done
                  ? 'border-emerald-300/60 bg-emerald-50/70 dark:bg-emerald-950/20'
                  : active
                    ? 'border-violet-400 bg-white dark:bg-stone-900 shadow-[0_8px_22px_-10px_rgba(124,58,237,0.45)]'
                    : 'border-stone-200/80 dark:border-stone-700/70 bg-white/70 dark:bg-stone-900/50 opacity-60',
              ].join(' ')}
            >
              <span className="text-xl shrink-0">{s.icon}</span>
              <span className={`flex-1 text-left text-sm font-bold ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-800 dark:text-stone-100'}`}>
                {s.label}
              </span>
              {done && <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>}
              {active && (
                <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TryRevealView({ topic, firstName }: { topic: string; firstName: string }) {
  // Suppress the unused-firstName warning while keeping the prop wired
  // for future personalised copy.
  void firstName;
  return (
    <div className="w-full max-w-3xl flex flex-col welcome-fade-up">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 backdrop-blur px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 shadow-sm">
          <span className="text-emerald-500">✓</span>
          Pack ready
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Your{' '}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
            {topic.length > 32 ? topic.slice(0, 32) + '…' : topic}
          </span>{' '}
          study pack
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          A taste of what Scholar made you. Sign up below to save it + unlock the full pack.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '📖', label: 'Lesson',     count: '8 slides',  gradient: 'from-violet-500 to-purple-600' },
          { icon: '🃏', label: 'Flashcards', count: '18 cards',  gradient: 'from-pink-500 to-rose-600' },
          { icon: '❓', label: 'Quiz',       count: '12 q\'s',   gradient: 'from-amber-500 to-orange-600' },
          { icon: '🎮', label: 'Games',      count: '2 modes',   gradient: 'from-emerald-500 to-teal-600' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-200/80 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/90 backdrop-blur-md p-4 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.5)] ring-1 ring-white/50 dark:ring-white/5 welcome-fade-up"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-lg shadow-md mb-3`}>
              {card.icon}
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-50">{card.label}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold mt-0.5">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Sample card preview — gives them a real taste, not just stat tiles */}
      <div className="mt-5 rounded-3xl border border-stone-200/80 dark:border-stone-700/70 bg-white/95 dark:bg-stone-900/90 backdrop-blur-md p-5 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_50px_-22px_rgba(0,0,0,0.5)] ring-1 ring-white/50 dark:ring-white/5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-2">Sneak peek — first flashcard</p>
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border border-violet-200/60 dark:border-violet-800/40 px-5 py-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-2">Question</p>
          <p className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-50 leading-snug" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            What is the most important concept in {topic}?
          </p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Tap to flip · 17 more cards</p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm font-semibold text-stone-700 dark:text-stone-200">
        Sign up to <span className="text-violet-700 dark:text-violet-300">save this pack</span> and unlock all 8 tools.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MARK: - Speech bubble (welcome + hype, EB Garamond serif)
// ─────────────────────────────────────────────────────────────────────

interface SpeechBubbleProps {
  children: React.ReactNode;
  pointDown?: boolean;
}

function SpeechBubble({ children, pointDown = false }: SpeechBubbleProps) {
  return (
    <div className="relative bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/70 rounded-3xl px-7 py-5 shadow-[0_18px_45px_-15px_rgba(15,23,42,0.20)] dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.55)] max-w-md ring-1 ring-white/50 dark:ring-white/5 welcome-bubble-pop">
      <p
        className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50 text-center leading-snug"
        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
      >
        {children}
      </p>
      {pointDown && (
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white/95 dark:bg-stone-900/90 border-r border-b border-stone-200/80 dark:border-stone-700/70 transform rotate-45" />
      )}
    </div>
  );
}
