import React from 'react';

const CHECK_PATH =
  'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z';

export interface FeatureTickRowProps {
  items: string[];
  /** Hero microcopy (default) vs study pack row (slightly larger) */
  variant?: 'hero' | 'prominent';
  className?: string;
}

export function FeatureTickRow({ items, variant = 'hero', className = '' }: FeatureTickRowProps) {
  const isProminent = variant === 'prominent';
  const labelClass = isProminent
    ? 'text-sm text-stone-600 dark:text-stone-400'
    : 'text-[11px] sm:text-xs text-stone-600 dark:text-stone-400';
  const wrapperClass = isProminent
    ? 'mb-6 sm:mb-8 max-w-3xl mx-auto'
    : 'mb-4 sm:mb-5 max-w-2xl mx-auto';

  return (
    <ul
      className={`flex flex-col sm:flex-row sm:flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2.5 w-full list-none ${wrapperClass} ${className}`}
      role="list"
    >
      {items.map((label) => (
        <li key={label} className={`flex items-center justify-center sm:justify-start gap-2.5 ${labelClass}`}>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
            aria-hidden
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d={CHECK_PATH} clipRule="evenodd" />
            </svg>
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
