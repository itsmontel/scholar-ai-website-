import React, { useState } from 'react';

const PromoBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="sticky sm:relative top-0 left-0 right-0 text-white py-2 sm:py-2.5 px-2 sm:px-4 z-30 bg-gradient-to-r from-indigo-600 to-violet-600">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-center">
          <span className="text-xs sm:text-sm font-medium">
            <span className="hidden sm:inline">🎉 Get </span>
            <span className="sm:hidden">🎉 </span>
            <span className="font-semibold text-indigo-200">50% off</span>
            <span className="sm:hidden"> first month</span>
            <span className="hidden sm:inline"> your first month on any monthly plan</span>
          </span>
          <span className="text-indigo-200/70 hidden sm:inline">•</span>
          <span className="bg-white/15 text-white px-2.5 sm:px-3 py-1 rounded-md font-medium text-xs sm:text-sm">
            Code: <span className="text-indigo-200 font-bold">OFF50</span>
          </span>
        </div>
        
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 hover:bg-white/15 rounded transition-colors ml-2"
          aria-label="Close banner"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;

