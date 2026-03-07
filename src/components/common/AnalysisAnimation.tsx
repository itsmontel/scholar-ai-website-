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
  variant?: 'analyze' | 'citations' | 'lesson';
}

const analysisSteps = [
  { text: 'Reading document...', icon: '📄' },
  { text: 'Extracting text content...', icon: '📝' },
  { text: 'Processing language patterns...', icon: '🔍' },
  { text: 'Analyzing document structure...', icon: '📊' },
  { text: 'Evaluating writing quality...', icon: '✨' },
  { text: 'Identifying key insights...', icon: '💡' },
  { text: 'Generating recommendations...', icon: '📋' },
  { text: 'Creating annotations...', icon: '🏷️' },
  { text: 'Finalizing analysis...', icon: '✅' }
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

  const steps = variant === 'citations' ? citationSteps : variant === 'lesson' ? lessonSteps : analysisSteps;

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

    if (progress >= 90 && !isCycling) {
      setIsCycling(true);
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isComplete, onComplete, progress, isCycling, steps.length]);

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
                pose={variant === 'citations' ? 'studying' : 'analyzing'}
              />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {variant === 'citations' ? 'Finding Citations' : variant === 'lesson' ? 'Creating Your Lessons' : 'AI Analysis in Progress'}
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
                className={`h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out ${
                  isCycling ? 'animate-pulse' : ''
                }`}
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
            <div className="mt-6 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 w-full">
              <p className="text-sm text-blue-700 text-center">
                {variant === 'citations'
                  ? '💡 Tip: We search millions of peer-reviewed sources in your citation style.'
                  : variant === 'lesson'
                    ? '💡 Tip: One click = 3 unique lessons! Visual Cards, Step-by-Step, and Story Mode.'
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
