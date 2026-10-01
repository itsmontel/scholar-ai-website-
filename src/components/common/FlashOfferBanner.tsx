import { useEffect, useRef, useState } from 'react';
import {
  FLASH_FIRST_MONTH_PRICE,
  STANDARD_MONTHLY_PRICE,
  WELCOME_PROMO_CODE,
} from '../../config/pricing';
import type { FlashOffer } from '../../hooks/useFlashOffer';
import { trackEvent } from '../../utils/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const NUNITO = { fontFamily: '"Nunito", system-ui, sans-serif' } as const;
const PRO_PRICE = STANDARD_MONTHLY_PRICE.pro;
const PERCENT_OFF = Math.round((1 - FLASH_FIRST_MONTH_PRICE / PRO_PRICE) * 100);

interface FlashOfferBannerProps {
  offer: FlashOffer;
  variant: 'hero' | 'strip';
  /** Fallback when checkout can't be started (e.g. network error). */
  onNavigatePricing: () => void;
}

async function startFlashCheckout(): Promise<string | null> {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planType: 'pro',
      billingCycle: 'monthly',
      promoCode: WELCOME_PROMO_CODE,
      successUrl: `${window.location.origin}/dashboard?payment=success`,
      cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
    }),
  });
  const data = await res.json().catch(() => null);
  return data?.success && data.data?.checkoutUrl ? data.data.checkoutUrl : null;
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.5L13.5 2Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function TimeTile({ value, label, urgent }: { value: string; label: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`relative flex h-[64px] w-[58px] sm:h-[84px] sm:w-[76px] items-center justify-center overflow-hidden rounded-2xl border-2 border-b-[5px] ${
          urgent ? 'border-[#B91C1C] bg-[#FF4B4B] text-white' : 'border-[#E5E5E5] bg-white text-[#3C3C3C]'
        }`}
      >
        <div className={`absolute inset-x-0 top-1/2 h-px ${urgent ? 'bg-white/25' : 'bg-black/[0.06]'}`} aria-hidden />
        <span key={value} className="ws-flash-tick text-[34px] sm:text-[46px] font-black tabular-nums leading-none" style={NUNITO}>
          {value}
        </span>
      </div>
      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70" style={NUNITO}>
        {label}
      </span>
    </div>
  );
}

export default function FlashOfferBanner({ offer, variant, onNavigatePricing }: FlashOfferBannerProps) {
  const [loading, setLoading] = useState(false);
  const viewed = useRef(false);
  const urgent = offer.msLeft > 0 && offer.msLeft < 60 * 60 * 1000;

  useEffect(() => {
    if (!offer.active || viewed.current) return;
    viewed.current = true;
    trackEvent('flash_offer_view', { variant, ms_left: offer.msLeft });
  }, [offer.active, offer.msLeft, variant]);

  if (!offer.active) return null;

  const handleClaim = async () => {
    if (loading) return;
    trackEvent('flash_offer_cta_click', { variant, ms_left: offer.msLeft });
    setLoading(true);
    try {
      const url = await startFlashCheckout();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      console.error('Flash offer checkout failed:', err);
    }
    setLoading(false);
    onNavigatePricing();
  };

  if (variant === 'strip') {
    return (
      <div
        role="region"
        aria-label="First-day offer"
        className="relative z-30 overflow-hidden border-b-2 border-[#D4A300] bg-[#FFC800]"
      >
        <div className="ws-flash-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" aria-hidden />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 text-center sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-extrabold text-[#3C3C3C]" style={NUNITO}>
            <BoltIcon className="h-4 w-4 text-[#5A4500]" />
            Pro for <span className="text-[#5A4500]">${FLASH_FIRST_MONTH_PRICE}</span> your first month
            <span className="hidden sm:inline text-[#5A4500]/70 line-through">${PRO_PRICE}</span>
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-lg border-2 border-b-[3px] px-2 py-0.5 font-mono text-[12px] font-extrabold tabular-nums ${
              urgent ? 'border-[#B91C1C] bg-[#FF4B4B] text-white' : 'border-[#1A1A1A] bg-[#3C3C3C] text-[#FFC800]'
            }`}
          >
            Ends in {offer.hours}:{offer.minutes}:{offer.seconds}
          </span>
          <button
            type="button"
            onClick={handleClaim}
            disabled={loading}
            className="inline-flex items-center rounded-xl border-2 border-b-[3px] border-[#E5E5E5] bg-white px-3 py-1 text-[11px] font-extrabold text-[#3C3C3C] transition-all hover:bg-[#FFFBEA] active:translate-y-px active:border-b-2 disabled:opacity-70"
          >
            {loading ? 'Opening…' : 'Claim it'}
          </button>
        </div>
        <FlashOfferStyles />
      </div>
    );
  }

  return (
    <section
      aria-label="First-day offer"
      className="relative overflow-hidden rounded-3xl border-2 border-b-[6px] border-[#2A0D4D] bg-gradient-to-br from-[#2A0D4D] via-[#5A1B8E] to-[#A560E8] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_85%_0%,rgba(255,200,0,0.28),transparent_60%),radial-gradient(ellipse_50%_70%_at_0%_100%,rgba(255,255,255,0.12),transparent_60%)]"
        aria-hidden
      />
      <div className="ws-flash-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" aria-hidden />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-8 lg:p-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="ws-flash-pulse inline-flex items-center gap-1.5 rounded-full border-2 border-b-[3px] border-[#D4A300] bg-[#FFC800] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#3C3C3C]"
              style={NUNITO}
            >
              <BoltIcon className="h-3.5 w-3.5" />
              24-hour flash sale
            </span>
            <span className="text-[12px] font-extrabold text-white/75" style={NUNITO}>
              One day only
            </span>
          </div>

          <h2 className="mt-4 text-[30px] sm:text-[40px] font-black leading-[1.05] tracking-tight" style={NUNITO}>
            Get Pro for <span className="text-[#FFC800]">${FLASH_FIRST_MONTH_PRICE}</span>
            <span className="block text-[20px] sm:text-[24px] font-extrabold text-white/90">your entire first month</span>
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="text-[18px] font-extrabold text-white/60 line-through decoration-2 decoration-[#FF4B4B]" style={NUNITO}>
              ${PRO_PRICE}
            </span>
            <span className="rounded-lg border-2 border-b-[3px] border-[#46A302] bg-[#58CC02] px-2 py-0.5 text-[12px] font-black text-white" style={NUNITO}>
              {PERCENT_OFF}% OFF
            </span>
            <span className="text-[12px] font-bold text-white/70" style={NUNITO}>
              Best price you will ever see
            </span>
          </div>

          <ul className="mt-4 grid gap-1.5 text-[13px] sm:text-[14px] font-bold text-white/90" style={NUNITO}>
            {[
              'See every comment and fix on your essay',
              'Walk into exams with full flashcards and quizzes',
              'Every reference done right, in seconds',
            ].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#58CC02] text-white">
                  <CheckIcon />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-col items-center rounded-2xl border-2 border-white/15 bg-black/20 px-4 py-5 sm:px-6 backdrop-blur-sm">
          <img
            src="/mascot-celebrating.webp"
            alt=""
            width={56}
            height={56}
            className="pointer-events-none absolute top-1.5 right-2 hidden h-14 w-14 object-contain sm:block"
            loading="lazy"
          />
          <p
            className={`text-[12px] font-black uppercase tracking-[0.16em] ${urgent ? 'text-[#FFB4B4]' : 'text-[#FFC800]'}`}
            style={NUNITO}
          >
            {urgent ? 'Last hour. Ends in' : 'Offer ends in'}
          </p>
          <div className={`mt-3 flex items-start gap-1.5 sm:gap-2.5 ${urgent ? 'ws-flash-shake' : ''}`}>
            <TimeTile value={offer.hours} label="Hours" urgent={urgent} />
            <span className="mt-4 sm:mt-6 text-[28px] sm:text-[36px] font-black text-white/60" aria-hidden>:</span>
            <TimeTile value={offer.minutes} label="Min" urgent={urgent} />
            <span className="mt-4 sm:mt-6 text-[28px] sm:text-[36px] font-black text-white/60" aria-hidden>:</span>
            <TimeTile value={offer.seconds} label="Sec" urgent={urgent} />
          </div>

          <button
            type="button"
            onClick={handleClaim}
            disabled={loading}
            className="mt-5 w-full rounded-2xl border-2 border-b-[5px] border-[#D4A300] bg-[#FFC800] px-5 py-3.5 text-[16px] sm:text-[17px] font-black uppercase tracking-wide text-[#3C3C3C] transition-all hover:brightness-105 active:translate-y-[3px] active:border-b-2 disabled:opacity-70"
            style={NUNITO}
          >
            {loading ? 'Opening checkout…' : `Claim my $${FLASH_FIRST_MONTH_PRICE} month`}
          </button>
          <p className="mt-2.5 text-center text-[11px] sm:text-[12px] font-bold leading-snug text-white/70" style={NUNITO}>
            Then ${PRO_PRICE}/mo. Cancel anytime. When the timer hits zero, this offer is gone for good.
          </p>
        </div>
      </div>
      <FlashOfferStyles />
    </section>
  );
}

function FlashOfferStyles() {
  return (
    <style>{`
      @keyframes wsFlashShine { 0% { transform: translateX(0) skewX(-18deg); } 100% { transform: translateX(450%) skewX(-18deg); } }
      .ws-flash-shine { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent); animation: wsFlashShine 3.6s ease-in-out infinite; }
      @keyframes wsFlashTick { 0% { transform: translateY(-35%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      .ws-flash-tick { animation: wsFlashTick 220ms cubic-bezier(0.34, 1.56, 0.64, 1); }
      @keyframes wsFlashPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .ws-flash-pulse { animation: wsFlashPulse 1.6s ease-in-out infinite; }
      @keyframes wsFlashShake { 0%, 92%, 100% { transform: translateX(0); } 94% { transform: translateX(-3px); } 96% { transform: translateX(3px); } 98% { transform: translateX(-2px); } }
      .ws-flash-shake { animation: wsFlashShake 2.5s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .ws-flash-shine, .ws-flash-tick, .ws-flash-pulse, .ws-flash-shake { animation: none; } }
    `}</style>
  );
}
