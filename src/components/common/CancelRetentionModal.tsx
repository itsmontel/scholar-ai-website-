/* ─── CancelRetentionModal ────────────────────────────────────────
 *
 * Recovery flow shown when a subscriber clicks "Cancel subscription".
 *
 *   Active subscriber:  pause 30 days → 50% off next month → confirm
 *   Trialing user:      50% off first month → confirm
 *
 * Trial users skip the pause step (pausing a trial is meaningless) but
 * DO get the discount — this is the single highest-intent moment to
 * spend it. They've used the product for a few days and are looking at
 * the first real charge, so halving it is the cheapest possible save.
 * This is also why the same code no longer auto-applies at signup: one
 * 50% coupon is worth much more here than as a front-door sweetener
 * given to everyone, including people who'd have paid full price.
 * (Previously trial users were sent straight to confirm, because the
 * signup coupon would have collided with this one.)
 *
 * Mounted by BillingPage and AccountPage. All API calls + state are
 * encapsulated here so the host page only needs to manage `open` and
 * provide an `onMutate` callback to refresh its own data when the
 * subscription state changes.
 */
import { useEffect, useState } from 'react';
import { trackEvent } from '../../utils/analytics';
import { FIRST_MONTH_PRICE, STANDARD_MONTHLY_PRICE } from '../../config/pricing';

interface CancelRetentionModalProps {
  /** Controls visibility. Parent toggles to true when the user clicks the cancel link. */
  open: boolean;
  /** Called when the modal closes (X click, backdrop click, "Keep my plan", or after success "Done"). */
  onClose: () => void;
  /** API base URL — defaults to VITE_API_URL but explicit prop keeps this component self-contained. */
  apiUrl: string;
  /** Called after any successful mutation (pause / discount / cancel) so the parent can refresh its UI. */
  onMutate?: () => void;
  /** User's current Stripe subscription_status. 'trialing' opens on the save offer. */
  subscriptionStatus?: string | null;
  /** Current plan — only used to quote the right prices in the save offer copy. */
  plan?: string | null;
}

type RetentionStep = 'pause' | 'discount' | 'confirm' | 'success';

export default function CancelRetentionModal({
  open,
  onClose,
  apiUrl,
  onMutate,
  subscriptionStatus,
  plan,
}: CancelRetentionModalProps) {
  // Quote real figures in the save-offer copy. The retention coupon is
  // 50% off one invoice, so these must stay in step with the coupon
  // configured as STRIPE_RETENTION_COUPON_ID.
  const planKey = (plan || 'pro').toLowerCase() === 'premium' ? 'premium' : 'pro';
  const STANDARD_PRICE = `$${STANDARD_MONTHLY_PRICE[planKey].toFixed(2)}`;
  const SAVE_OFFER_PRICE = `$${FIRST_MONTH_PRICE[planKey].toFixed(2)}`;
  // Trial users open on the save offer; active subscribers get the
  // pause step first (a break is a cheaper save than a discount).
  const isTrialing = subscriptionStatus === 'trialing';
  const initialStep: RetentionStep = isTrialing ? 'discount' : 'pause';
  const steps: RetentionStep[] = isTrialing ? ['discount', 'confirm'] : ['pause', 'discount', 'confirm'];

  const [step, setStep] = useState<RetentionStep>(initialStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset the modal to its initial step every time it re-opens — so
  // a user who pauses, then re-opens cancel, doesn't land at the
  // "success" screen from the previous run.
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setBusy(false);
      setError(null);
      setSuccessMsg(null);
      trackEvent('cancel_flow_view', { status: subscriptionStatus ?? null, entryStep: initialStep });
    }
  }, [open, initialStep, subscriptionStatus]);

  // Separate from the entry event so the save offer has its own
  // denominator — active subscribers can bail at the pause step and
  // never see it.
  useEffect(() => {
    if (!open || step !== 'discount') return;
    trackEvent('cancel_save_offer_view', { status: subscriptionStatus ?? null });
  }, [open, step, subscriptionStatus]);

  if (!open) return null;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const acceptPause = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiUrl}/subscriptions/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days: 30 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not pause subscription');
      setSuccessMsg("You're paused for 30 days. We'll see you when you're back.");
      setStep('success');
      onMutate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not pause subscription');
    } finally {
      setBusy(false);
    }
  };

  const acceptDiscount = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiUrl}/subscriptions/apply-retention-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not apply discount');
      setSuccessMsg(
        isTrialing
          ? `50% off locked in. When your trial ends you'll be charged ${SAVE_OFFER_PRICE} instead of ${STANDARD_PRICE} — then it's ${STANDARD_PRICE}/mo, cancel anytime.`
          : '50% off applied to your next invoice. Enjoy the half-price month on us.',
      );
      setStep('success');
      trackEvent('cancel_save_offer_accept', { status: subscriptionStatus ?? null });
      onMutate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply discount');
    } finally {
      setBusy(false);
    }
  };

  const confirmFinalCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiUrl}/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && typeof data.message === 'string' && data.message) || 'Could not cancel subscription');
      setSuccessMsg(
        isTrialing
          ? "Trial cancelled. You'll keep Pro access until your trial period ends — no charge."
          : "Subscription cancelled. You'll keep Pro access until the end of your current billing period.",
      );
      setStep('success');
      trackEvent('cancel_confirmed', { status: subscriptionStatus ?? null });
      onMutate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel subscription');
    } finally {
      setBusy(false);
    }
  };

  const showStepDots = step !== 'success';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retention-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 py-6 bg-black/55 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-md rounded-3xl border-2 border-b-4 border-[#A560E8]/45 bg-white dark:bg-stone-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Soft brand glows */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#A560E8]/18 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#FFC800]/18 blur-3xl" aria-hidden />

        <div className="relative px-6 sm:px-7 pt-7 pb-6">
          {showStepDots && (
            <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden>
              {steps.map((s) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? 'w-6 bg-[#A560E8]' : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* ─── Step 1: Pause for 30 days ─── */}
          {step === 'pause' && (
            <div className="text-center">
              <div className="text-5xl mb-3" aria-hidden>⏸️</div>
              <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                Need a break?
              </h2>
              <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                Pause WriteScholar Pro for <span className="text-[#A560E8]">30 days</span>. No charges during the pause — you keep all your work and pick up right where you left off.
              </p>
              {error && (
                <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                  {error}
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={acceptPause}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {busy ? 'Pausing…' : 'Yes, pause for 30 days'}
                </button>
                <button
                  type="button"
                  onClick={() => { setError(null); setStep('discount'); }}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  No thanks
                </button>
              </div>
            </div>
          )}

          {/* ─── Save offer: 50% off the next invoice ───
              For a trialing user "next invoice" is their first charge,
              so the copy leads with the concrete price rather than the
              percentage — the objection here is the £/$ figure. */}
          {step === 'discount' && (
            <div className="text-center">
              <div className="text-5xl mb-3" aria-hidden>🎁</div>
              <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {isTrialing ? (
                  <>Keep going for <span className="text-[#A560E8]">{SAVE_OFFER_PRICE}</span> your first month?</>
                ) : (
                  <>Stay for <span className="text-[#A560E8]">50% off</span> next month?</>
                )}
              </h2>
              <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                {isTrialing ? (
                  <>
                    Before you go — we&apos;ll halve your first month. You&apos;ll pay{' '}
                    <span className="text-[#A560E8]">{SAVE_OFFER_PRICE}</span> instead of {STANDARD_PRICE} when your
                    trial ends, then {STANDARD_PRICE}/mo. Cancel anytime.
                  </>
                ) : (
                  <>We&apos;ll knock 50% off your next invoice. Same Pro, half the price — on us.</>
                )}
              </p>
              {error && (
                <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                  {error}
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={acceptDiscount}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {busy ? 'Applying…' : isTrialing ? `Yes, keep me for ${SAVE_OFFER_PRICE}` : 'Yes, apply 50% off'}
                </button>
                <button
                  type="button"
                  onClick={() => { setError(null); setStep('confirm'); }}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  No thanks
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Final confirm ─── */}
          {step === 'confirm' && (
            <div className="text-center">
              <div className="text-5xl mb-3" aria-hidden>👋</div>
              <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {isTrialing ? 'Cancel your free trial?' : 'Cancel subscription?'}
              </h2>
              <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                {isTrialing
                  ? "You'll keep Pro access until your trial period ends — and you won't be charged. You can resubscribe anytime."
                  : "You'll keep Pro access until the end of your current billing period, then drop back to the free plan. You can resubscribe anytime."}
              </p>
              {error && (
                <div className="mt-4 rounded-xl bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 border-2 border-[#FF4B4B]/30 px-3 py-2 text-[12px] text-[#FF4B4B] font-bold">
                  {error}
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {isTrialing ? 'Keep my trial' : 'Keep my plan'}
                </button>
                <button
                  type="button"
                  onClick={confirmFinalCancel}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10 text-[#FF4B4B] text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#FF4B4B]/50 hover:border-[#FF4B4B] disabled:opacity-60 disabled:cursor-not-allowed active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {busy ? 'Cancelling…' : 'Yes, cancel anyway'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Success — terminal state ─── */}
          {step === 'success' && (
            <div className="text-center">
              <div className="text-5xl mb-3" aria-hidden>✅</div>
              <h2 id="retention-modal-title" className="text-[1.4rem] sm:text-[1.55rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                All set
              </h2>
              <p className="mt-2 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                {successMsg}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full py-3 px-4 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[13px] sm:text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
