import React, { useState } from 'react';

const PromoBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="sticky sm:relative top-0 left-0 right-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white py-2.5 sm:py-4 px-2 sm:px-4 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-4">
        {/* Mobile: Single line compact text */}
        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 text-center">
          <span className="text-xs sm:text-base font-medium whitespace-nowrap">
            <span className="hidden sm:inline">New users: Get </span>
            <span className="sm:hidden">Get </span>
            <span className="font-bold text-sm sm:text-xl bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">$10 OFF</span>
            <span className="hidden sm:inline"> on any plan</span>
            <span className="sm:hidden"> any plan</span>
          </span>
          <span className="bg-white text-orange-600 px-2 sm:px-4 py-1 sm:py-1.5 rounded-md font-bold text-xs sm:text-base shadow-sm whitespace-nowrap">
            Use code: OFF10
          </span>
        </div>
        
        {/* Close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close banner"
        >
          <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;

