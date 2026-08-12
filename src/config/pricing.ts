/**
 * Pricing & discount policy — one place that decides WHERE the welcome
 * discount is allowed to appear.
 *
 * The rule we're running: fire ONE acquisition lever at a time.
 *
 *   Front door (onboarding, pricing, billing, soft paywall)
 *     → the 7-day free trial is the offer. Full price after: $19.99 Pro,
 *       $39.99 Premium. No coupon, because stacking a free week AND 50%
 *       off spends two levers on the same user and teaches people the
 *       list price isn't real.
 *
 *   Exit (cancel flow, post-lapse winback)
 *     → the same 50% code becomes a SAVE offer, spent only on users who
 *       have explicitly signalled they're leaving.
 *
 * History: the discount used to auto-apply at every checkout surface.
 * It converted poorly at the front door and gave margin away to users
 * who would have paid anyway, so it moved to the exit. Flip
 * WELCOME_DISCOUNT_AT_SIGNUP back to true to restore the old behaviour —
 * every surface reads this flag, so it's a one-line revert.
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
 * false = trial is the front-door offer (current).
 */
export const WELCOME_DISCOUNT_AT_SIGNUP = false;

/** First-month price per plan when the discount IS applied. */
export const FIRST_MONTH_PRICE: Record<string, number> = { pro: 9.99, premium: 19.99 };

/** Standard recurring monthly price per plan. */
export const STANDARD_MONTHLY_PRICE: Record<string, number> = { pro: 19.99, premium: 39.99 };

/** Length of the card-required free trial, in days. */
export const TRIAL_DAYS = 7;

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
