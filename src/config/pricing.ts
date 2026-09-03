/**
 * Pricing & discount policy — one place that decides WHERE the welcome
 * discount is allowed to appear.
 *
 * Current front-door offer: 50% off the first month (NEWCUSTOMER), no
 * free trial. Soft paywall, pricing, billing, and onboarding checkout
 * all read this flag so the story stays consistent.
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
 * true = 50% off first month is the front-door offer (current).
 */
export const WELCOME_DISCOUNT_AT_SIGNUP = true;

/** First-month price per plan when the discount IS applied. */
export const FIRST_MONTH_PRICE: Record<string, number> = { pro: 9.99, premium: 19.99 };

/** Standard recurring monthly price per plan. */
export const STANDARD_MONTHLY_PRICE: Record<string, number> = { pro: 19.99, premium: 39.99 };

/**
 * Length of the card-required free trial, in days.
 * 0 = no trial — charge the (possibly discounted) first invoice immediately.
 */
export const TRIAL_DAYS = 0;

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
    ? `${TRIAL_DAYS}-day free trial · $0 today · Cancel anytime`
    : `From $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`;
