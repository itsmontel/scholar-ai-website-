import { useState } from 'react';
import {
  CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY,
  LAST_TUTORIAL_CHECKOUT_PLAN_KEY,
} from '../../constants/paywallSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TRIAL_DAYS = 7;

interface StripeCancelTrialChoiceModalProps {
  open: boolean;
  userName: string;
  onClose: () => void;
  /** After successful redirect to Stripe */
  onStartTrialRedirect: () => void;
  /** After user confirms forfeiting trial (server recorded) */
  onForfeitComplete: () => void;
}

/**
 * Shown when user returns from Stripe cancel after opening checkout from the post-tutorial paywall.
 * Duolingo-style design: 3D borders, bold Nunito headings, mascot, solid hex colours.
 */
const StripeCancelTrialChoiceModal = ({
  open,
  userName,
  onClose,
  onStartTrialRedirect,
  onForfeitComplete,
}: StripeCancelTrialChoiceModalProps) => {
  const [busy, setBusy] = useState<'trial' | 'forfeit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const startTrial = async () => {
    setError(null);
    setBusy('trial');
    try {
      const token = localStorage.getItem('authToken');
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;
      const res = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType: 'pro',
          billingCycle: 'monthly',
          successUrl,
          cancelUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Could not start checkout');
      }
      const url = (data as { data?: { checkoutUrl?: string } }).data?.checkoutUrl;
      if (!url) throw new Error('No checkout URL returned');
      onStartTrialRedirect();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(null);
    }
  };

  const forfeitTrial = async () => {
    setError(null);
    setBusy('forfeit');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/subscriptions/decline-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Could not update your account');
      }
      try {
        sessionStorage.removeItem(CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY);
        sessionStorage.removeItem(LAST_TUTORIAL_CHECKOUT_PLAN_KEY);
      } catch {
        /* ignore */
      }
      onForfeitComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(null);
    }
  };

  const first = userName?.trim() || 'there';

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      {/* Modal — Duolingo card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-cancel-trial-title"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-[#E5E5E5] dark:border-stone-700 shadow-2xl overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-[#FF9600]" />

        <div className="px-6 sm:px-8 pt-5 pb-6 sm:pb-7">
          {/* Sad mascot */}
          <div className="flex justify-center mb-4">
            <div
              className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#FF9600] bg-[#FFF4E0]"
              style={{ boxShadow: '0 0 24px rgba(255,150,0,0.2)' }}
            >
              <img
                src="/mascot-sad.webp"
                alt=""
                width={80}
                height={80}
                className="object-contain w-20 h-20 sm:w-24 sm:h-24"
                loading="eager"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8E8] border-2 border-[#FF4B4B]/40 text-[#FF4B4B] text-[10px] font-extrabold uppercase tracking-[0.2em]">
              <span aria-hidden>&#x26A0;&#xFE0F;</span>
              Before you go
            </span>
          </div>

          {/* Heading */}
          <h2
            id="stripe-cancel-trial-title"
            className="text-xl sm:text-2xl font-extrabold text-center text-[#3C3C3C] dark:text-stone-50 mb-2 leading-tight"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Leave checkout without subscribing?
          </h2>

          {/* Body copy */}
          <p className="text-sm text-stone-500 dark:text-stone-400 font-bold leading-relaxed text-center mb-1.5">
            Hi {first}, you haven&apos;t completed your{' '}
            <span className="font-extrabold text-[#58CC02]">subscription</span> yet.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-bold leading-relaxed text-center mb-5">
            Subscribe to Pro to keep your higher limits. Cancel anytime.
          </p>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 px-3 py-2 text-sm text-[#FF4B4B] font-bold mb-4" role="alert">
              {error}
            </div>
          )}

          {/* CTA — Green trial button */}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void startTrial()}
            className="w-full py-3.5 rounded-2xl bg-[#58CC02] text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-2 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg mb-3"
          >
            {busy === 'trial' ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Opening checkout...
              </>
            ) : (
              <>
                Continue to checkout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Forfeit — orange narrow button, centered */}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void forfeitTrial()}
              className="text-center text-sm py-2.5 px-8 rounded-xl border-2 border-b-4 border-[#D97F00] bg-[#FF9600] hover:bg-[#E58800] active:border-b-2 active:translate-y-0.5 text-white font-extrabold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {busy === 'forfeit' ? 'Updating...' : 'Maybe later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCancelTrialChoiceModal;
