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

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const analysisSteps = [
    'Reading document...',
    'Processing content...',
    'Analyzing structure...',
    'Generating insights...',
    'Creating annotations...',
    'Finalizing results...'
  ];

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through analysis steps
  useEffect(() => {
    if (isComplete) {
      // When complete, show final step and call onComplete
      setCurrentStep(analysisSteps.length - 1);
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isComplete, onComplete]);

  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Main AI Brain Animation */}
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-20"></div>
              
              {/* Middle rotating ring */}
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
              
              {/* Inner brain icon */}
              <div className={`relative ${sizeClasses.lg} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg`}>
                <svg 
                  className="w-1/2 h-1/2 text-white animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>

            {/* Analysis step text */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Analysis in Progress
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {analysisSteps[currentStep]}
              </p>
              <p className="text-xs text-gray-500">
                {text}{dots}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / analysisSteps.length) * 100}%`
                }}
              ></div>
            </div>

            {/* Floating particles around the modal */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    left: `${10 + i * 10}%`,
                    top: `${20 + (i % 3) * 20}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${1.2 + i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Main AI Brain Animation */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-20"></div>
        
        {/* Middle rotating ring */}
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
        
        {/* Inner brain icon */}
        <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg`}>
          <svg 
            className="w-1/2 h-1/2 text-white animate-pulse" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>

      {/* Analysis step text */}
      <div className="text-center">
        <p className="text-sm font-medium text-white mb-1">
          {analysisSteps[currentStep]}
        </p>
        <p className="text-xs text-white/80">
          {text}{dots}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"
          style={{
            width: `${((currentStep + 1) / analysisSteps.length) * 100}%`,
            transition: 'width 0.5s ease-in-out'
          }}
        ></div>
      </div>
    </div>
  );
};

export default AnalysisAnimation;