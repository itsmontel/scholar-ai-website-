/**
 * Shared visual language for dashboard + analysis activation coaches.
 * Keeps colors, elevation, and buttons consistent for a premium, cohesive tour.
 */

export const activationCoachCard =
  'rounded-2xl border border-violet-200/90 dark:border-violet-600/50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shadow-[0_24px_60px_-16px_rgba(91,33,182,0.22)] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)] ring-1 ring-violet-400/20 dark:ring-violet-500/25';

export const activationCoachKicker =
  'text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400';

export const activationCoachBody = 'text-sm text-stone-800 dark:text-stone-100 leading-relaxed';

export const activationCoachHint =
  'mt-2.5 text-sm font-semibold tracking-tight text-violet-800 dark:text-violet-200';

export const activationCoachMuted = 'text-xs text-stone-500 dark:text-stone-400 mt-2 leading-snug';

/** Primary CTA: matches app violet actions; strong focus ring for accessibility. */
export const activationCoachBtnPrimary =
  'inline-flex items-center justify-center min-w-[5.75rem] px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-violet-600/25 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

/** Step segment: completed = violet; upcoming = muted; current = brighter cap */
export function activationCoachSegmentClass(active: boolean, current: boolean): string {
  if (!active) {
    return 'h-1.5 flex-1 rounded-full bg-stone-200 transition-all duration-300 dark:bg-stone-600';
  }
  return [
    'h-1.5 flex-1 rounded-full transition-all duration-300 ease-out',
    current ? 'bg-violet-600 shadow-[0_0_12px_rgba(139,92,246,0.45)]' : 'bg-violet-400/90 dark:bg-violet-500/90',
  ].join(' ');
}
