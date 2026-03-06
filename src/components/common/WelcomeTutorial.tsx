import { useState, useEffect } from 'react';
import ScholarMascot from './ScholarMascot';

interface WelcomeTutorialProps {
  userName?: string;
  userId?: string;
  onComplete: () => void;
}

const WelcomeTutorial = ({ userName, userId, onComplete }: WelcomeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);

  const steps = [
    {
      title: userName ? `Welcome to WriteScholar, ${userName}!` : 'Welcome to WriteScholar!',
      subtitle: '',
      description: '',
      icon: '👋',
      features: [],
      isWelcomeStep: true,
      mascotPose: 'waving' as const,
    },
    {
      title: 'Generate Study Materials',
      subtitle: 'Turn any content into quizzes & flashcards',
      description: '',
      icon: '',
      features: [
        { emoji: '📚', text: 'Quizzes' },
        { emoji: '🃏', text: 'Flashcards' },
        { emoji: '🧩', text: 'Crosswords' },
      ],
      isWelcomeStep: false,
      mascotPose: 'studying' as const,
    },
    {
      title: 'Analyze Your Writing',
      subtitle: 'Get instant feedback on essays & papers',
      description: '',
      icon: '',
      features: [
        { emoji: '📝', text: 'Detailed feedback' },
        { emoji: '💡', text: 'Improvement tips' },
        { emoji: '📖', text: 'Citation finder' },
      ],
      mascotPose: 'pointing' as const,
    },
    {
      title: 'AI Humanizer & Summarizer',
      subtitle: 'Transform & condense content',
      description: '',
      icon: '',
      features: [
        { emoji: '🤖', text: 'Humanize AI text' },
        { emoji: '📋', text: 'Smart summaries' },
      ],
      mascotPose: 'thinking' as const,
    },
    {
      title: 'You\'re All Set!',
      subtitle: 'Ready to explore WriteScholar',
      description: '',
      icon: '',
      features: [],
      mascotPose: 'celebrating' as const,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    if (userId) {
      localStorage.setItem(`writescholar_welcome_tutorial_completed_${userId}`, 'true');
    }
    // Start dissolve animation
    setIsDissolving(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1000); // Match animation duration
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    if (userId) {
      const completed = localStorage.getItem(`writescholar_welcome_tutorial_completed_${userId}`);
      if (completed === 'true') {
        setIsVisible(false);
        onComplete();
      }
    }
  }, [userId, onComplete]);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Check if current step is the simple welcome step
  const isWelcomeStep = currentStep === 0 && step.features.length === 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm transition-all duration-1000 ${
      isDissolving ? 'opacity-0 backdrop-blur-none' : 'opacity-100 animate-fadeIn'
    }`}>
      <div 
        className={`relative w-full ${isWelcomeStep ? 'max-w-xl' : 'max-w-lg'} bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isDissolving ? 'opacity-0 scale-110 blur-xl' : isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {isWelcomeStep ? (
          /* Simple Welcome Step */
          <>
            {/* Slim purple header */}
            <div 
              className="relative h-12"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)' }}
            />

            {/* Content - mascot + welcome */}
            <div className="px-8 pt-6 pb-8 text-center">
              {/* Mascot - much bigger, hero of the page */}
              <div className="mb-6 flex justify-center">
                <ScholarMascot size={200} animated={true} />
              </div>
              <h2 
                className="text-2xl sm:text-3xl font-bold text-stone-800 mb-8"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {step.title}
              </h2>

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium"
                >
                  Skip tutorial
                </button>

                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  Let's go!
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Regular Tutorial Steps */
          <>
            {/* Header gradient with mascot */}
            <div 
              className="relative h-40 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)' }}
            >
              {/* Decorative circles */}
              <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10 blur-lg" />
              {/* Mascot with themed pose */}
              <div className="relative">
                <ScholarMascot size={120} animated={true} pose={step.mascotPose || 'default'} />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pt-6 pb-6">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-stone-400">
                  {currentStep + 1}/{steps.length}
                </span>
              </div>

              {/* Title & subtitle */}
              <div className={`text-center ${currentStep === steps.length - 1 ? 'mb-8' : 'mb-4'}`}>
                <h2 
                  className="text-2xl font-bold text-stone-800 mb-1"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {step.title}
                </h2>
                {step.subtitle && (
                  <p className="text-stone-500 text-sm">{step.subtitle}</p>
                )}
              </div>

              {/* Feature cards - simplified */}
              {step.features.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {step.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100"
                    >
                      <span className="text-lg">{feature.emoji}</span>
                      <span className="text-stone-700 text-sm font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className={`flex items-center ${currentStep === steps.length - 1 ? 'justify-center' : 'justify-between'}`}>
                {currentStep > 0 && currentStep !== steps.length - 1 ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                ) : currentStep === 0 ? (
                  <button
                    onClick={handleSkip}
                    className="text-stone-400 hover:text-stone-600 transition-colors text-sm font-medium"
                  >
                    Skip tutorial
                  </button>
                ) : (
                  <div /> // Spacer for final step
                )}

                <button
                  onClick={handleNext}
                  className={`px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 ${
                    currentStep === steps.length - 1 ? 'px-12' : ''
                  }`}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Get Started
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentStep(index);
                  setIsAnimating(false);
                }, 200);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-6 bg-violet-500' 
                  : index < currentStep 
                    ? 'bg-violet-300' 
                    : 'bg-stone-200'
              }`}
            />
          ))}
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

export default WelcomeTutorial;
