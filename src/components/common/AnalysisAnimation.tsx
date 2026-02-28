import React, { useState, useEffect } from 'react';

interface AnalysisAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  isPopup?: boolean;
  onComplete?: () => void;
  isComplete?: boolean;
}

const AnalysisAnimation: React.FC<AnalysisAnimationProps> = ({
  size = 'md',
  text = 'Analyzing...',
  className = '',
  isPopup = false,
  onComplete,
  isComplete = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [isCycling, setIsCycling] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isComplete) {
      setCurrentStep(analysisSteps.length - 1);
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
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isComplete, onComplete, progress, isCycling]);

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
            {/* Cute character analyzing */}
            <div className="relative mb-6">
              <div className="w-24 h-24 relative">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="48" fill="#EEF2FF" stroke="#E0E7FF" strokeWidth="2"/>
                  
                  {/* Character body */}
                  <path d="M35 75 Q30 90 35 98 L65 98 Q70 90 65 75" fill="#3B82F6" />
                  
                  {/* Neck */}
                  <rect x="44" y="62" width="12" height="15" fill="#FCD9B6" />
                  
                  {/* Head */}
                  <ellipse cx="50" cy="42" rx="22" ry="24" fill="#FCD9B6" />
                  
                  {/* Hair */}
                  <path d="M28 36 Q26 20 38 14 Q50 8 62 14 Q74 20 72 36 Q70 26 58 20 Q50 16 42 20 Q32 26 28 36" fill="#4A3728" />
                  <path d="M28 36 Q22 44 28 52" fill="#4A3728" />
                  <path d="M72 36 Q78 44 72 52" fill="#4A3728" />
                  
                  {/* Glasses */}
                  <ellipse cx="40" cy="42" rx="10" ry="9" fill="none" stroke="#374151" strokeWidth="2.5" />
                  <ellipse cx="60" cy="42" rx="10" ry="9" fill="none" stroke="#374151" strokeWidth="2.5" />
                  <path d="M50 42 L52 42" stroke="#374151" strokeWidth="2.5" />
                  <path d="M30 40 L24 38" stroke="#374151" strokeWidth="2.5" />
                  <path d="M70 40 L76 38" stroke="#374151" strokeWidth="2.5" />
                  
                  {/* Eyes - looking at document */}
                  <ellipse cx="40" cy="43" rx="3" ry="4" fill="#1F2937" />
                  <ellipse cx="60" cy="43" rx="3" ry="4" fill="#1F2937" />
                  <circle cx="41" cy="42" r="1" fill="white" />
                  <circle cx="61" cy="42" r="1" fill="white" />
                  
                  {/* Eyebrows - focused */}
                  <path d="M32 34 Q40 30 48 34" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M52 34 Q60 30 68 34" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
                  
                  {/* Smile */}
                  <path d="M42 54 Q50 60 58 54" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
                  
                  {/* Cheeks */}
                  <ellipse cx="30" cy="48" rx="4" ry="3" fill="#FECACA" opacity="0.5" />
                  <ellipse cx="70" cy="48" rx="4" ry="3" fill="#FECACA" opacity="0.5" />
                </svg>
                
                {/* Animated sparkles around character */}
                <div className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0s' }}>✨</div>
                <div className="absolute -top-2 left-2 w-3 h-3 text-blue-400 animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>
                <div className="absolute top-4 -right-3 w-3 h-3 text-purple-400 animate-pulse" style={{ animationDelay: '0.6s' }}>✨</div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI Analysis in Progress
            </h3>
            
            {/* Current step with icon */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-lg">{analysisSteps[currentStep].icon}</span>
              <p className="text-gray-600">
                {analysisSteps[currentStep].text}
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
              <span className="text-gray-400">{text}{dots}</span>
              <span className="font-semibold text-gray-900">
                {isComplete ? '100%' : `${Math.round(Math.min(progress, 100))}%`}
              </span>
            </div>

            {/* Helpful tip */}
            <div className="mt-6 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 w-full">
              <p className="text-sm text-blue-700 text-center">
                💡 Tip: Our AI analyzes structure, grammar, citations, and more!
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
          {analysisSteps[currentStep].text}
        </p>
        <p className="text-xs text-white/80">
          {text}{dots}
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
