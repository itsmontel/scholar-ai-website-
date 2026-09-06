import { useState } from 'react';
import { WELCOME_DISCOUNT_AT_SIGNUP, WELCOME_PROMO_CODE } from '../../config/pricing';

interface PromoBannerProps {
  /** Promo code shown in the chip (also used to scope the dismissal cookie). */
  code?: string;
  /**
   * `gold` — landing reveal (Duolingo yellow #FFC800).
   * `app` — purple strip at the top of the dashboard.
   */
  variant?: 'gold' | 'app';
  onCta?: () => void;
  ctaLabel?: string;
}

/**
 * First-month discount banner. Landing uses brand gold; the dashboard
 * keeps the purple workspace strip.
 */
export default function PromoBanner({
  code = WELCOME_PROMO_CODE,
  variant = 'app',
  onCta,
  ctaLabel = 'Claim 50% off',
}: PromoBannerProps) {
  const storageKey = `ws_promo_dismissed_${variant}_${code}`;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  if (!WELCOME_DISCOUNT_AT_SIGNUP || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* localStorage might be disabled */
    }
    setDismissed(true);
  };

  const isGold = variant === 'gold';

  return (
    <div
      role="region"
      aria-label="First month discount"
      className={
        isGold
          ? 'relative overflow-hidden border-b-2 border-[#D4A300] bg-[#FFC800]'
          : 'relative z-30 overflow-hidden border-b-2 border-[#7733B5] bg-gradient-to-r from-[#A560E8] via-[#8A48C7] to-[#7733B5]'
      }
    >
      {!isGold && (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_140%_at_50%_0%,rgba(255,255,255,0.16),transparent_62%)]"
          aria-hidden
        />
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 pr-11 sm:pr-12">
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-center">
          <p
            className={`text-[12px] sm:text-[13px] font-extrabold ${isGold ? 'text-[#3C3C3C]' : 'text-white'}`}
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            <span className={isGold ? 'text-[#5A4500]' : 'text-white'}>50% off</span>
            {' '}your first month
            {' '}
            <span
              className={
                isGold
                  ? 'inline-flex items-center rounded-md border-2 border-b-[3px] border-[#D4A300] bg-white px-1.5 py-0.5 font-mono font-extrabold tracking-wide text-[11px] text-[#5A4500]'
                  : 'inline-flex items-center rounded-md border-2 border-b-[3px] border-[#5A1B8E]/40 bg-white px-1.5 py-0.5 font-mono font-extrabold tracking-wide text-[11px] text-[#7733B5]'
              }
            >
              {code}
            </span>
          </p>
          {onCta && (
            <button
              type="button"
              onClick={onCta}
              className={
                isGold
                  ? 'inline-flex items-center rounded-xl bg-[#3C3C3C] px-2.5 py-1 text-[11px] font-extrabold text-[#FFC800] hover:bg-[#2A2A2A] border-2 border-b-[3px] border-[#1A1A1A] active:border-b-2 active:translate-y-px transition-all'
                  : 'inline-flex items-center rounded-xl bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#7733B5] border-2 border-b-[3px] border-[#E9DBFF] hover:bg-[#FBF7FF] active:border-b-2 active:translate-y-px transition-all'
              }
            >
              {ctaLabel}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss promotion"
          className={
            isGold
              ? 'absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-[#5A4500]/70 hover:text-[#5A4500] hover:bg-[#5A4500]/10 transition-colors'
              : 'absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors'
          }
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
