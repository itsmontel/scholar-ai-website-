/**
 * Pricing & discount policy — one place that decides WHERE the welcome
 * discount is allowed to appear.
 *
 * Current front-door offer (2026-10-27): a $1 trial. TRIAL_PRICE today
 * buys TRIAL_DAYS of Pro with TRIAL_CREDITS, everything unlocked; then
 * Pro bills at the full $19.99/mo. No discount code rides with it, and
 * there are no free credits (FREE_CREDITS = 0).
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
 * false while the $1 trial is the front-door offer (current).
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
 * Length of the card-required trial, in days. 0 = no trial.
 * Must match TRIAL_DAYS in backend/src/services/creditService.js.
 */
export const TRIAL_DAYS = 7;
/** Charged today to start the trial (backend TRIAL_FEE_CENTS). */
export const TRIAL_PRICE = 1;

/**
 * Credits. An essay analysis, a study pack and a citation search each
 * cost 1. Unused credits roll over each month, up to CREDIT_CAP.
 * Mirrors backend/src/services/creditService.js.
 */
export const TRIAL_CREDITS = 5;
/** Never-paid accounts: credits to use within FREE_CREDIT_DAYS of their first visit (0 = off, current). */
export const FREE_CREDITS = 0;
export const FREE_CREDIT_DAYS = 7;
/**
 * Free study packs open the full lesson and quiz plus this many
 * flashcards; the rest of the deck, the crossword and the games are Pro.
 */
export const FREE_PACK_FLASHCARDS = 5;
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
 * Onboarding Stripe Checkout always auto-applies NEWCUSTOMER on monthly
 * Pro/Premium. The backend strips it for anyone who has already trialed
 * or subscribed. Yearly is excluded so we do not halve a whole year.
 */
export function onboardingCheckoutPromo(
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): { promoCode: string } | undefined {
  if (billingCycle !== 'monthly') return undefined;
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
    ? `$${TRIAL_PRICE} for ${TRIAL_DAYS} days · ${TRIAL_CREDITS} credits · then $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`
    : `From $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`;
