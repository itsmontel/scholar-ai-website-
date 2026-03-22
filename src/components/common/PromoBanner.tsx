import React, { useState } from 'react';

interface PromoBannerProps {
  embedded?: boolean;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ embedded = false }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      className={`relative left-0 right-0 w-full border-b border-violet-200/70 dark:border-violet-900/50 bg-gradient-to-r from-[#f4f6fb] via-white to-violet-50/60 dark:from-stone-950 dark:via-stone-900 dark:to-violet-950/30 ${embedded ? '' : 'shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset]'}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_120%_at_50%_-30%,rgba(91,33,182,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_120%_at_50%_-20%,rgba(109,40,217,0.12),transparent_50%)]" aria-hidden />
      <div className="relative max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 py-2 sm:py-2.5 px-3 sm:px-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap text-stone-800 dark:text-stone-100">
          <span className="text-[11px] sm:text-sm font-medium leading-snug">
            New users: Get{' '}
            <span className="font-semibold text-violet-800 dark:text-violet-200">$10 off</span> your first month —{' '}
            <span className="text-stone-600 dark:text-stone-400">code</span>{' '}
            <span className="font-mono font-semibold text-sm sm:text-[0.9375rem] rounded-md bg-violet-100/90 dark:bg-violet-950/70 text-violet-900 dark:text-violet-100 px-1.5 py-0.5 border border-violet-200/80 dark:border-violet-700/60">
              OFF10
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800/80 transition-colors ml-1"
          aria-label="Close banner"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
