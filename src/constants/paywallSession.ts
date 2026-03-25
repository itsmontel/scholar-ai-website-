/** Legacy key; cleared on successful payment or logout. */
export const MANDATORY_CHECKOUT_PENDING_KEY = 'writescholar_mandatory_checkout_pending';

/** Set when user opens Stripe from the post-tutorial hard paywall; used to show trial choice after cancel. */
export const CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY = 'writescholar_checkout_from_tutorial_paywall';

/**
 * localStorage: user dismissed, forfeited, or left for Stripe from the post-tutorial cancel modal — do not show again.
 */
export const TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY = 'writescholar_tutorial_checkout_cancel_modal_resolved';

/** @deprecated legacy key — treated same as RESOLVED in reads */
export const TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY = 'writescholar_tutorial_checkout_cancel_modal_seen';

/**
 * sessionStorage: post-tutorial Stripe cancel — modal must stay open until resolved (survives refresh).
 */
export const STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY = 'writescholar_stripe_cancel_trial_modal_pending';

/** True if user already finished the tutorial cancel flow (legacy "seen" counts as resolved). */
export function isTutorialCheckoutCancelModalResolved(): boolean {
  try {
    if (localStorage.getItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY) === '1') return true;
    if (localStorage.getItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY) === '1') return true;
    return false;
  } catch {
    return false;
  }
}

/** Last Pro/Premium choice when opening checkout from tutorial paywall (restore on Stripe cancel modal). */
export const LAST_TUTORIAL_CHECKOUT_PLAN_KEY = 'writescholar_last_tutorial_checkout_plan';

/** Soft (API-limit) paywall was open — restore after refresh until dismissed or user upgrades. */
export const SOFT_PAYWALL_OPEN_KEY = 'writescholar_soft_paywall_open';

/** Post–activation tutorial hard paywall (Analysis page) — restore after refresh until checkout or dismiss. */
export const POST_ACTIVATION_PAYWALL_PENDING_KEY = 'writescholar_post_activation_paywall_pending';
