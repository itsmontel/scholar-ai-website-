import React, { useState, useEffect } from 'react';
import ScholarMascot from './ScholarMascot';

interface AnalysisAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  message?: string; // alias for text (backwards compat)
  className?: string;
  isPopup?: boolean;
  onComplete?: () => void;
  isComplete?: boolean;
  variant?: 'analyze' | 'citations' | 'lesson' | 'studyPack';
}

const analysisSteps = [
  { text: 'Reading your document...', icon: '📄' },
  { text: 'Extracting text content...', icon: '📝' },
  { text: 'Analyzing document structure...', icon: '📊' },
  { text: 'Assessing grammar and style...', icon: '✏️' },
  { text: 'Evaluating argument strength...', icon: '💪' },
  { text: 'Checking citation formatting...', icon: '📚' },
  { text: 'Identifying strengths and concerns...', icon: '🔍' },
  { text: 'Making relevant annotations...', icon: '🏷️' },
  { text: 'Generating improvement suggestions...', icon: '💡' },
  { text: 'Finalizing your feedback...', icon: '✅' }
];

const citationSteps = [
  { text: 'Finding relevant sources...', icon: '🔍' },
  { text: 'Searching academic databases...', icon: '📚' },
  { text: 'Matching your topic...', icon: '📄' },
  { text: 'Checking peer-reviewed journals...', icon: '📋' },
  { text: 'Filtering by relevance...', icon: '✨' },
  { text: 'Formatting citations...', icon: '🏷️' },
  { text: 'Verifying sources...', icon: '✅' },
  { text: 'Preparing your list...', icon: '📑' },
  { text: 'Almost ready...', icon: '💡' }
];

const lessonSteps = [
  { text: 'Reading your material...', icon: '📖' },
  { text: 'Creating visual cards...', icon: '🎨' },
  { text: 'Building step-by-step guide...', icon: '📋' },
  { text: 'Writing story mode...', icon: '📚' },
  { text: 'Extracting key concepts...', icon: '💡' },
  { text: 'Adding interactive elements...', icon: '✨' },
  { text: 'Generating quiz questions...', icon: '🎯' },
  { text: 'Finalizing lessons...', icon: '✅' },
  { text: 'Almost ready...', icon: '🚀' }
];

const studyPackSteps = [
  { text: 'Reading your notes...', icon: '📖' },
  { text: 'Creating your lesson...', icon: '🎓' },
  { text: 'Building flashcards...', icon: '🃏' },
  { text: 'Generating quiz questions...', icon: '📝' },
  { text: 'Building crossword puzzle...', icon: '🧩' },
  { text: 'Preparing Crater Blast...', icon: '💥' },
  { text: 'Finalizing study pack...', icon: '✨' },
  { text: 'Almost ready...', icon: '🚀' },
  { text: 'Your study pack is ready!', icon: '✅' }
];

const AnalysisAnimation: React.FC<AnalysisAnimationProps> = ({
  size = 'md',
  text,
  message,
  className = '',
  isPopup = false,
  onComplete,
  isComplete = false,
  variant = 'analyze'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [isCycling, setIsCycling] = useState(false);

  const displayText = text ?? message ?? 'Analyzing...';

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  };

  const steps = variant === 'citations' ? citationSteps 
    : variant === 'lesson' ? lessonSteps 
    : variant === 'studyPack' ? studyPackSteps 
    : analysisSteps;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isComplete) {
      setCurrentStep(steps.length - 1);
      setProgress(100);
      setIsCycling(false);
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isComplete, onComplete, steps.length]);

  useEffect(() => {
    if (!isComplete && progress >= 90) {
      setIsCycling(true);
    }
  }, [isComplete, progress]);

  useEffect(() => {
    if (isComplete) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          return 99;
        } else if (prev >= 90) {
          return Math.min(prev + 0.05, 99);
        } else if (prev >= 80) {
          return Math.min(prev + 0.1, 90);
        } else {
          const increment = prev < 20 ? 0.8 : prev < 50 ? 0.4 : prev < 70 ? 0.2 : 0.15;
          return Math.min(prev + increment, 80);
        }
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, [isComplete]);

  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center">
            {/* Scholar mascot — analyzing pose for paper/lesson, studying pose for citations */}
            <div className="relative mb-6 flex justify-center">
              <ScholarMascot
                size={140}
                animated={true}
                pose={variant === 'citations' ? 'studying' : variant === 'studyPack' ? 'studying' : 'analyzing'}
              />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {variant === 'citations' ? 'Finding Citations' 
                : variant === 'lesson' ? 'Creating Your Lessons' 
                : variant === 'studyPack' ? 'Creating Your Study Pack' 
                : 'AI Analysis in Progress'}
            </h3>
            
            {/* Current step with icon */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-lg">{steps[currentStep].icon}</span>
              <p className="text-gray-600">
                {steps[currentStep].text}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  variant === 'studyPack'
                    ? 'bg-amber-600'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                } ${isCycling ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            
            {/* Progress percentage */}
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-gray-400">{displayText}{dots}</span>
              <span className="font-semibold text-gray-900">
                {isComplete ? '100%' : `${Math.round(Math.min(progress, 100))}%`}
              </span>
            </div>

            {/* Helpful tip */}
            <div className={`mt-6 px-4 py-3 rounded-xl w-full ${
              variant === 'studyPack' ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'
            }`}>
              <p className={`text-sm text-center ${variant === 'studyPack' ? 'text-amber-800' : 'text-blue-700'}`}>
                {variant === 'citations'
                  ? '💡 Tip: We search millions of peer-reviewed sources in your citation style.'
                  : variant === 'lesson'
                    ? '💡 Tip: One click = 3 unique lessons! Visual Cards, Step-by-Step, and Story Mode.'
                    : variant === 'studyPack'
                      ? '💡 Tip: One generation = lesson, flashcards, quiz, crossword & Crater Blast!'
                      : '💡 Tip: Our AI analyzes structure, grammar, citations, and more!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Simplified inline version */}
      <div className="relative">
        <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg`}>
          <svg className="w-1/2 h-1/2 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-white mb-1">
          {steps[currentStep].text}
        </p>
        <p className="text-xs text-white/80">
          {displayText}{dots}
        </p>
      </div>

      <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-white rounded-full transition-all duration-300 ease-out ${
            isCycling ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default AnalysisAnimation;
