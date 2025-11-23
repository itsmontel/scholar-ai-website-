import React, { useState } from 'react';

const PromoBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white py-3 sm:py-4 px-4 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
        {/* Mobile: Compact text */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap">
          <span className="text-sm sm:text-base font-medium">
            <span className="hidden sm:inline">New users: Get </span>
            <span className="sm:hidden">Get </span>
            <span className="font-bold text-lg sm:text-xl bg-white/20 px-2 py-1 rounded">$10 OFF</span>
            <span className="hidden sm:inline"> on any plan</span>
            <span className="sm:hidden"> any plan</span>
          </span>
          <span className="bg-white text-orange-600 px-3 sm:px-4 py-1.5 rounded-md font-bold text-sm sm:text-base shadow-sm whitespace-nowrap">
            Use code: OFF10
          </span>
        </div>
        
        {/* Close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close banner"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;

