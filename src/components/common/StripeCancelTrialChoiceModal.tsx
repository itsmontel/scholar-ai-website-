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
          trialPeriodDays: TRIAL_DAYS,
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
      <div aria-hidden className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-cancel-trial-title"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-600 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-950/5 p-6 sm:p-8"
      >
        <h2 id="stripe-cancel-trial-title" className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Leave checkout without subscribing?
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
          Hi {first}, you haven&apos;t started your <span className="font-semibold text-stone-800 dark:text-stone-200">{TRIAL_DAYS}-day free trial</span> yet.
          If you stay on the free plan now, you won&apos;t get this one-time trial again on this account.
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-500 mb-6">
          You can subscribe later, but there won&apos;t be a free trial again.
        </p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void startTrial()}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:pointer-events-none shadow-md shadow-violet-900/20 ring-1 ring-violet-900/10 transition-colors"
          >
            {busy === 'trial' ? 'Opening checkout...' : `Start my ${TRIAL_DAYS}-day free trial`}
          </button>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void forfeitTrial()}
          className="mt-4 w-full py-2.5 px-3 rounded-lg text-center text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/90 dark:hover:bg-stone-800/80 disabled:opacity-50 transition-colors"
        >
          {busy === 'forfeit' ? 'Updating...' : "I'm happy to lose my free trial"}
        </button>
      </div>
    </div>
  );
};

export default StripeCancelTrialChoiceModal;
