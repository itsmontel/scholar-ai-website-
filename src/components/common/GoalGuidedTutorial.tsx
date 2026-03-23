import { useState, useEffect, useCallback } from 'react';
import ScholarMascot from './ScholarMascot';

export type OnboardingGoal = 'essay' | 'citations' | 'study';

interface GoalGuidedTutorialProps {
  goal: OnboardingGoal;
  onComplete: () => void;
  /** For essay: word count - auto-advance step 1 when >= 200 */
  essayWordCount?: number;
  /** For summarizer/citations/study: whether they've entered text */
  hasInput?: boolean;
}

type TutorialStep = {
  instruction: string;
  detail: string;
  emoji: string;
  /** CSS selector for element to spotlight. Null = no spotlight (e.g. final step) */
  targetSelector: string | null;
  /** If true, advancing requires user to do the action (we show "Try it!" instead of "Next") */
  requireAction?: boolean;
};

const GOAL_CONFIG: Record<OnboardingGoal, { title: string; steps: TutorialStep[] }> = {
  essay: {
    title: "Let's get your essay feedback",
    steps: [
      { instruction: 'Paste your essay here', detail: 'Drop it in the box below — at least 200 words for professor-style feedback', emoji: '📝', targetSelector: '[data-tutorial-target="essay-input-wrapper"]' },
      { instruction: 'Click Analyze', detail: "Hit 'Analyze Text' when you're ready — we'll break down structure, clarity & tone", emoji: '✨', targetSelector: '[data-tutorial-target="essay-analyze-btn"]', requireAction: true },
    ],
  },
  citations: {
    title: "Let's find your citations",
    steps: [
      { instruction: 'Enter your topic', detail: "Type your research question or topic — we'll search academic sources", emoji: '📖', targetSelector: '[data-tutorial-target="citations-input"]' },
      { instruction: 'Pick style & search', detail: 'Choose APA, MLA, etc. then click Find Sources', emoji: '⚡', targetSelector: '[data-tutorial-target="citations-search-btn"]', requireAction: true },
    ],
  },
  study: {
    title: "Let's build your study tools",
    steps: [
      { instruction: 'Paste your notes', detail: 'Drop your textbook, notes, or article — one click generates a Study Pack (lesson & flashcards free; quiz, crossword & Crater Blast with Pro)', emoji: '📚', targetSelector: '[data-tutorial-target="study-input"]' },
      { instruction: 'Generate!', detail: 'Click the Generate button to create your study material', emoji: '🧠', targetSelector: '[data-tutorial-target="study-generate-btn"]', requireAction: true },
    ],
  },
};

const GoalGuidedTutorial = ({ goal, onComplete, essayWordCount = 0, hasInput = false }: GoalGuidedTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const config = GOAL_CONFIG[goal];
  const step = config.steps[currentStep];
  const isLastStep = currentStep === config.steps.length - 1;

  const updateTargetRect = useCallback(() => {
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  useEffect(() => {
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, step.targetSelector]);

  useEffect(() => {
    updateTargetRect();
    const timer = setTimeout(updateTargetRect, 100);
    window.addEventListener('scroll', updateTargetRect, true);
    window.addEventListener('resize', updateTargetRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updateTargetRect, true);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [updateTargetRect]);

  // Auto-advance essay step 1 when they've pasted 500+ words
  useEffect(() => {
    if (goal === 'essay' && currentStep === 0 && essayWordCount >= 500) {
      setCurrentStep(1);
    }
  }, [goal, currentStep, essayWordCount]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleTryIt = () => {
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
          el.focus();
        } else if (el instanceof HTMLElement) {
          el.focus();
        }
      }
    }
    if (isLastStep && !step.requireAction) {
      onComplete();
    } else if (!isLastStep) {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] animate-fadeIn">
      {/* Spotlight overlay — dims the page with a cutout over the target */}
      {targetRect && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute rounded-2xl border-4 border-violet-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
            style={{
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        </div>
      )}

      {/* Make the spotlighted element clickable — we need pointer-events to pass through.
          The overlay uses pointer-events-none, so clicks go through. The tooltip has pointer-events-auto. */}

      {/* Tooltip card — positioned near the spotlight */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-12 w-[calc(100%-2rem)] max-w-lg mx-4 pointer-events-auto">
        <div className="relative bg-white dark:bg-stone-800 rounded-3xl shadow-2xl border-2 border-violet-200 dark:border-violet-700/60 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-stone-100 dark:bg-stone-700">
            <div
              className="h-full bg-violet-600 hover:bg-violet-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / config.steps.length) * 100}%` }}
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <ScholarMascot size={72} animated={true} pose="pointing" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {step.instruction}
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
                  {step.detail}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-5">
                  {step.requireAction ? (
                    <>
                      <button
                        onClick={handleTryIt}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">{step.emoji}</span>
                        Try it now →
                      </button>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        Click the highlighted element above
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleTryIt}
                        className="px-5 py-2.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">{step.emoji}</span>
                        Focus & try
                      </button>
                      <button
                        onClick={handleNext}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 transition-all"
                      >
                        {isLastStep ? "I'm ready!" : 'Next'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
              <button onClick={onComplete} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium flex-shrink-0">
                Skip tutorial
              </button>
              <div className="flex justify-center gap-2 flex-1">
                {config.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === currentStep ? 'w-6 bg-violet-500' : i < currentStep ? 'w-2 bg-violet-300 dark:bg-violet-600' : 'w-2 bg-stone-200 dark:bg-stone-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GoalGuidedTutorial;
