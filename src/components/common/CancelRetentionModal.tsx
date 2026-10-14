/* ─── CancelRetentionModal ────────────────────────────────────────
 *
 * Recovery flow shown when a subscriber clicks "Cancel subscription".
 *
 *   Active subscriber:  pause 30 days → 50% off next month → confirm
 *   Trialing user:      50% off first month → confirm
 *
 * Credits: pausing keeps the balance (no new credits while paused);
 * cancelling resets it to 0 when the plan ends. Both steps say how many
 * credits are at stake, which is the strongest reason to pause instead.
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
import CreditCoin from './CreditCoin';
import { notifyCreditsChanged, parseCreditState, shortDate, type CreditState } from '../../utils/credits';

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
  const [credits, setCredits] = useState<CreditState | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${apiUrl}/subscriptions/usage`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCredits(parseCreditState(data.credits));
      } catch {
        /* the flow works without the number */
      }
    })();
    return () => { cancelled = true; };
  }, [open, apiUrl]);

  const savedCredits = credits?.remaining ?? 0;
  const rolledOver = credits?.rollover ?? 0;

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
      setSuccessMsg(
        savedCredits > 0
          ? `You're paused for 30 days. Your ${savedCredits} credits are safe until you're back.`
          : "You're paused for 30 days. We'll see you when you're back.",
      );
      notifyCreditsChanged();
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
          ? "Trial cancelled. You'll keep access until your trial period ends — no charge."
          : `Subscription cancelled. You'll keep Pro access until the end of your current billing period${savedCredits > 0 ? `, and your ${savedCredits} credits until then` : ''}.`,
      );
      setStep('success');
      notifyCreditsChanged();
      trackEvent('cancel_confirmed', { status: subscriptionStatus ?? null, credits: savedCredits });
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
              <img src="/mascot-sad.webp" alt="" width="88" height="88" className="mx-auto mb-2 w-[88px] h-[88px] object-contain" />
              <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {savedCredits > 0 ? <>Wait! You&apos;ve saved up <span className="text-[#A560E8]">{savedCredits} credits</span>.</> : 'Need a break?'}
              </h2>
              {rolledOver > 0 && (
                <p className="mt-1 text-[12.5px] font-bold text-stone-500 dark:text-stone-400">Including {rolledOver} that rolled over from earlier months.</p>
              )}
              <div className="mt-4 space-y-2.5 text-left">
                <div className="flex gap-3 items-start rounded-2xl border-2 border-b-4 border-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#A560E8] text-white" aria-hidden>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" /></svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#3C3C3C] dark:text-stone-100">Pause for 30 days <span className="ml-1 rounded-full bg-[#58CC02] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white align-middle">Keeps your credits</span></p>
                    <p className="mt-0.5 text-[12.5px] font-bold leading-snug text-stone-600 dark:text-stone-300">No charges while you&apos;re paused.{savedCredits > 0 ? ` All ${savedCredits} credits are waiting when you're back.` : ' Pick up right where you left off.'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start rounded-2xl border-2 border-stone-200 dark:border-stone-700 px-3.5 py-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE8E8] text-[#C62828]" aria-hidden>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#3C3C3C] dark:text-stone-100">Cancel</p>
                    <p className="mt-0.5 text-[12.5px] font-bold leading-snug text-stone-600 dark:text-stone-300">Your credits reset to <span className="text-[#C62828]">0</span> when your plan ends. Rejoining later starts from scratch.</p>
                  </div>
                </div>
              </div>
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
                  {busy ? 'Pausing…' : savedCredits > 0 ? 'Pause and keep my credits' : 'Yes, pause for 30 days'}
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
              <h2 id="retention-modal-title" className="text-[1.45rem] sm:text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#3C3C3C] dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                {savedCredits > 0
                  ? `Cancel and lose all ${savedCredits} credits?`
                  : isTrialing ? 'Cancel your free trial?' : 'Cancel subscription?'}
              </h2>
              {savedCredits > 0 && (
                <div className="mt-4 flex items-center justify-center gap-5 rounded-2xl border-2 border-[#F3DB93] bg-[#FFF6DB] dark:bg-[#F5B70A]/10 py-3.5">
                  <div className="flex flex-col items-center gap-1">
                    <CreditCoin size={40} />
                    <span className="text-[26px] leading-none font-black text-[#3C3C3C] dark:text-stone-100 tabular-nums">{savedCredits}</span>
                    <span className="text-[11px] font-extrabold text-[#6B4E00] dark:text-[#F5D670]">credits now</span>
                  </div>
                  <svg width="40" height="20" viewBox="0 0 34 18" fill="none" stroke="#C62828" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 9h28" /><path d="M23 2l7 7-7 7" /></svg>
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-10 w-10 rounded-full border-[3px] border-dashed border-stone-300 dark:border-stone-600" aria-hidden />
                    <span className="text-[26px] leading-none font-black text-[#C62828]">0</span>
                    <span className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400">after it ends</span>
                  </div>
                </div>
              )}
              <p className="mt-3 text-[13.5px] sm:text-sm font-bold text-stone-600 dark:text-stone-300 leading-relaxed">
                {isTrialing
                  ? "You'll keep access until your trial period ends, and you won't be charged."
                  : `You'll keep Pro access until ${shortDate(credits?.periodEnd ?? null) ?? 'the end of your current billing period'}, then drop back to the free plan.`}
                {savedCredits > 0
                  ? ` Your credits${rolledOver > 0 ? `, including the ${rolledOver} you rolled over,` : ''} reset to 0 then. Pausing keeps them.`
                  : ' You can resubscribe anytime.'}
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
                  {savedCredits > 0 ? `Keep my ${savedCredits} credits` : isTrialing ? 'Keep my trial' : 'Keep my plan'}
                </button>
                <button
                  type="button"
                  onClick={confirmFinalCancel}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-900 hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10 text-[#FF4B4B] text-[12.5px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#FF4B4B]/50 hover:border-[#FF4B4B] disabled:opacity-60 disabled:cursor-not-allowed active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {busy ? 'Cancelling…' : savedCredits > 0 ? 'Yes, cancel and reset to 0' : 'Yes, cancel anyway'}
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
