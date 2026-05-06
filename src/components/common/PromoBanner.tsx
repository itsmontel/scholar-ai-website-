import { useState } from 'react';

interface PromoBannerProps {
  /** Promo code shown in the chip (also used to scope the dismissal cookie). */
  code: string;
  /** Tailwind max-width class applied to the inner container. */
  maxWidthClass?: string;
}

/**
 * "50% off your first month — use code MAY2026" banner with a dismiss button.
 * Dismissal persists in localStorage scoped per code, so swapping in a new
 * promo automatically re-shows the banner without users clearing storage.
 */
export default function PromoBanner({
  code,
  maxWidthClass = 'max-w-7xl',
}: PromoBannerProps) {
  const storageKey = `ws_promo_dismissed_${code}`;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* localStorage might be disabled — fall back to in-memory dismissal */
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Limited time promotion"
      className="relative overflow-hidden border-b border-violet-200/70 dark:border-violet-900/60 bg-gradient-to-r from-violet-50 via-white to-violet-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(124,58,237,0.10),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_120%_at_50%_50%,rgba(139,92,246,0.18),transparent_70%)]"
        aria-hidden
      />
      <div className={`relative mx-auto ${maxWidthClass} px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 pr-12 sm:pr-14`}>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Limited Time
          </span>
          <p className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-100">
            <span className="font-bold text-violet-700 dark:text-violet-300">50% off</span> your first month on monthly plans · use code{' '}
            <span className="inline-flex items-center rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-stone-900 px-2 py-0.5 font-mono font-bold text-violet-700 dark:text-violet-300 tracking-wide">
              {code}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss promotion"
          className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
