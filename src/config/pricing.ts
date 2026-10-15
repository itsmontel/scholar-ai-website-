/**
 * Pricing & discount policy — one place that decides WHERE the welcome
 * discount is allowed to appear.
 *
 * Current front-door offer: a 3-day free trial with 3 credits, then Pro
 * at $19.99/mo for 99 credits. No first-month discount at signup (it
 * would only discount the $0 trial invoice). Soft paywall, pricing,
 * billing, and onboarding checkout all read these values so the story
 * stays consistent.
 *
 * Exit (cancel flow / post-lapse winback) can still reuse the same
 * coupon as a save offer for users who already paid.
 *
 * Flip WELCOME_DISCOUNT_AT_SIGNUP to false to stop auto-applying the
 * code at acquisition (list price only). Set TRIAL_DAYS > 0 to bring
 * back a card-required free trial on checkout.
 */

/**
 * Stripe promotion code: 50% off, duration "once" (first invoice only).
 *   Pro     $19.99 → $9.99
 *   Premium $39.99 → $19.99
 * Must exist in Stripe Dashboard → Products → Coupons. The backend
 * re-verifies eligibility and silently strips the code for anyone with
 * prior subscription history, so an optimistic client can never produce
 * a wrongly-discounted charge.
 */
export const WELCOME_PROMO_CODE = 'NEWCUSTOMER';

/**
 * Whether acquisition surfaces auto-apply WELCOME_PROMO_CODE.
 * true = 50% off first month is the front-door offer. Off while the
 * 3-day trial is the front-door offer (current).
 */
export const WELCOME_DISCOUNT_AT_SIGNUP = false;

/** First-month price per plan when the discount IS applied. */
export const FIRST_MONTH_PRICE: Record<string, number> = { pro: 9.99, premium: 19.99 };

/** Standard recurring monthly price per plan. */
export const STANDARD_MONTHLY_PRICE: Record<string, number> = { pro: 19.99, premium: 39.99 };

/**
 * First-day flash offer: Pro monthly first month at this price for 24
 * hours. New accounts start at signup. Older accounts that have never
 * had a paid plan start the first time they come back. The backend owns
 * the deadline and applies the Stripe coupon (STRIPE_FLASH_COUPON_ID,
 * $15 off once); the client only displays the deadline returned from
 * /subscriptions/trial-eligibility.
 */
/**
 * Retired 2026-10-13. New customers get 50% off the first month
 * (WELCOME_PROMO_CODE) and nothing else. Mirrors FLASH_OFFER_ENABLED in
 * backend/src/services/subscriptionService.js; this copy hides the UI even
 * if the frontend ships before the backend does.
 */
export const FLASH_OFFER_ENABLED = false;
export const FLASH_FIRST_MONTH_PRICE = 4.99;
export const FLASH_OFFER_HOURS = 24;

/**
 * Length of the card-required free trial, in days.
 * 0 = no trial — charge the (possibly discounted) first invoice immediately.
 * Must match TRIAL_DAYS in backend/src/services/creditService.js.
 */
export const TRIAL_DAYS = 3;

/**
 * Credits. An essay analysis, a study pack and a citation search each
 * cost 1. Unused credits roll over each month, up to CREDIT_CAP.
 * Mirrors backend/src/services/creditService.js.
 */
export const TRIAL_CREDITS = 3;
export const MONTHLY_CREDITS: Record<string, number> = { pro: 99, premium: 199 };
export const CREDIT_CAP = 499;

/**
 * sessionStorage key set right before redirecting to Stripe, so the
 * post-checkout celebration knows whether it was the trial or a paid plan.
 */
export const CHECKOUT_OFFER_KEY = 'ws_checkout_offer';

/**
 * Promo code to send with a checkout session from an ACQUISITION surface.
 * Returns undefined when the discount is reserved for the exit offer, so
 * callers can spread the result straight into a request body:
 *
 *   ...(signupPromoCode(isNewCustomer, cycle) ?? {})
 */
export function signupPromoCode(
  newCustomer: boolean,
  billingCycle: 'monthly' | 'yearly'
): { promoCode: string } | undefined {
  if (!WELCOME_DISCOUNT_AT_SIGNUP) return undefined;
  // The coupon discounts one invoice — on yearly that would halve a
  // whole year rather than a month.
  if (billingCycle !== 'monthly') return undefined;
  if (!newCustomer) return undefined;
  return { promoCode: WELCOME_PROMO_CODE };
}

/**
 * Whether a surface should render discounted first-month pricing.
 * Keeps displayed prices honest about what Stripe will actually charge.
 */
export function showSignupDiscount(
  newCustomer: boolean,
  billingCycle: 'monthly' | 'yearly'
): boolean {
  return signupPromoCode(newCustomer, billingCycle) !== undefined;
}

/** Short CTA footnote for upgrade buttons / locked-content footers. */
export const UPGRADE_CTA_FOOTNOTE = WELCOME_DISCOUNT_AT_SIGNUP
  ? `50% off first month · then $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`
  : TRIAL_DAYS > 0
    ? `${TRIAL_DAYS}-day free trial · ${TRIAL_CREDITS} credits · $0 today · Cancel anytime`
    : `From $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`;
