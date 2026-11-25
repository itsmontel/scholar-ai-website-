/**
 * Pricing and offer policy. One place that decides what the front door
 * sells and where any discount is allowed to appear.
 *
 * Current model (2026-11-18):
 *   Free      4 credits a month, no card. An essay grade (200 to 10,000 words)
 *             costs 2 credits and a study pack costs 1. The first essay
 *             an account grades comes back whole. Later free grades show
 *             the grade, score and every rubric score, with full feedback
 *             on the first quarter of the essay (cut on the server in
 *             analysisRedaction.js). Free study packs are complete and
 *             kept for 30 days.
 *   Pro       $19.99/mo, 99 credits. New subscribers pay $9.99 for the
 *             first month (WELCOME_PROMO_CODE).
 *   Premium   $39.99/mo, 199 credits. First month $19.99.
 *
 * The $1 trial and the card-required free trial are retired
 * (TRIAL_DAYS = 0). Citation searches are Pro only. The struck-through
 * "list price" is retired too (LAUNCH_OFFER_ENABLED = false): the only
 * struck-through price shown is the real monthly price next to the
 * first-month price.
 *
 * Exit (cancel flow / post-lapse winback) can still reuse the welcome
 * coupon as a save offer for users who already paid.
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
 * true (since 2026-11-18): $19.99 struck through, $9.99 first month.
 */
export const WELCOME_DISCOUNT_AT_SIGNUP = true;

/** First-month price per plan when the discount IS applied. */
export const FIRST_MONTH_PRICE: Record<string, number> = { pro: 9.99, premium: 19.99 };

/** Standard recurring monthly price per plan: what Stripe charges today. */
export const STANDARD_MONTHLY_PRICE: Record<string, number> = { pro: 19.99, premium: 39.99 };

/**
 * Student launch price.
 *
 * LIST_MONTHLY_PRICE is the price each plan moves to after launch and is
 * shown struck through next to today's price. It has to become the real
 * Stripe price at some point (set the end date and raise it), otherwise
 * the strike-through is a fictitious former price, which consumer
 * protection rules and both app stores treat as deceptive. Keep the
 * label honest: "launch price", not "was".
 */
export const LAUNCH_OFFER_ENABLED = false;
export const LIST_MONTHLY_PRICE: Record<string, number> = { pro: 39.99, premium: 59.99 };
export const LAUNCH_OFFER_LABEL = 'Student launch price';
export const LAUNCH_OFFER_FOOTNOTE = 'Lock in this price for as long as you stay subscribed.';

/** Whole-dollar saving per month against the list price, for badges. */
export function launchSaving(plan: 'pro' | 'premium'): number {
  return Math.round(LIST_MONTHLY_PRICE[plan] - STANDARD_MONTHLY_PRICE[plan]);
}

/** Percentage saving against the list price, rounded to a whole number. */
export function launchSavingPercent(plan: 'pro' | 'premium'): number {
  return Math.round((1 - STANDARD_MONTHLY_PRICE[plan] / LIST_MONTHLY_PRICE[plan]) * 100);
}

/**
 * Retired 2026-10-13. Mirrors FLASH_OFFER_ENABLED in
 * backend/src/services/subscriptionService.js; this copy hides the UI even
 * if the frontend ships before the backend does.
 */
export const FLASH_OFFER_ENABLED = false;
export const FLASH_FIRST_MONTH_PRICE = 4.99;
export const FLASH_OFFER_HOURS = 24;

/**
 * Length of the card-required trial, in days. 0 = no trial (current).
 * Must match TRIAL_DAYS in backend/src/services/creditService.js.
 */
export const TRIAL_DAYS = 0;
/** Charged to start the (retired) trial. Kept for old post-checkout copy. */
export const TRIAL_PRICE = 1;

/**
 * Credits. An essay analysis, a study pack and a citation search each
 * cost 1. Unused credits roll over each month, up to CREDIT_CAP.
 * Mirrors backend/src/services/creditService.js.
 */
export const TRIAL_CREDITS = 5;
/** Free accounts: credits per calendar month (grades or study packs), resetting on the 1st. */
export const FREE_CREDITS = 4;
/** Legacy: the free tier no longer expires after a week. */
export const FREE_CREDIT_DAYS = 0;
/** Free grades take essays in this range; Pro goes to 15,000 words. */
export const FREE_GRADE_MIN_WORDS = 200;
export const FREE_GRADE_MAX_WORDS = 10000;
export const PRO_GRADE_MAX_WORDS = 15000;
/**
 * Free study packs are complete: every flashcard, the crossword and the
 * games. false restores the old preview (FREE_PACK_FLASHCARDS cards, the
 * rest behind Pro).
 */
/**
 * Whether the landing page's two buttons open the "try it first" pop-up
 * (make a pack or grade an essay with no account, sign up to keep it).
 * Off since 2026-11-18: the buttons go to the sign-up page, as they did
 * until 4 November. Weekly sign-ups were 15 to 31 with that, and fell to
 * 8, 6 and 3 after the 5 November "paste first, then sign up" front door.
 * The pop-up flow is still in the code; set this to true to test it.
 */
export const TRY_BEFORE_SIGNUP = false;

export const FREE_PACKS_FULL = true;
export const FREE_PACK_FLASHCARDS = 5;

/**
 * Free for finals: until this moment free accounts get 9 credits a month
 * (not the usual 3) and whole essay reports. Mirrors FINALS_FREE_UNTIL in
 * backend/src/services/creditService.js; '' turns the banner off.
 */
export const FINALS_FREE_UNTIL = '2026-12-02T23:59:59Z';
export const FINALS_FREE_LABEL = '2 December';
export function finalsFreeActive(now: number = Date.now()): boolean {
  const end = Date.parse(FINALS_FREE_UNTIL);
  return Number.isFinite(end) && now < end;
}
export const MONTHLY_CREDITS: Record<string, number> = { pro: 99, premium: 199 };
export const CREDIT_CAP = 499;
/** What each action costs. Mirrors CREDIT_COSTS in backend/src/services/creditService.js. */
export const CREDIT_COSTS = { analysis: 2, studyPack: 1, citation: 1 } as const;
/**
 * Credit top-ups: a one-off purchase for any account. They last
 * TOPUP_MONTHS months, sit outside the rollover cap and are used after
 * the plan's own credits. Priced above the plans per credit on purpose.
 * Mirrors TOPUP_PACKS in backend/src/services/creditService.js.
 */
export const TOPUP_PACKS = [
  { id: 'small', credits: 25, price: 7.99 },
  { id: 'large', credits: 60, price: 14.99 },
] as const;
export const TOPUP_MONTHS = 12;

/**
 * sessionStorage key set right before redirecting to Stripe, so the
 * post-checkout celebration knows whether it was the trial or a paid plan.
 */
export const CHECKOUT_OFFER_KEY = 'ws_checkout_offer';

/** localStorage key holding the essay pasted on the landing page before sign-in. */
export const PENDING_ESSAY_KEY = 'ws_pending_essay';
/** sessionStorage flag: this analysis is the first free grade from the landing page. */
export const FREE_GRADE_FLOW_KEY = 'ws_free_grade_flow';

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
  // The coupon discounts one invoice: on yearly that would halve a
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
  : LAUNCH_OFFER_ENABLED
    ? `${LAUNCH_OFFER_LABEL}: $${STANDARD_MONTHLY_PRICE.pro}/mo, not $${LIST_MONTHLY_PRICE.pro} · Cancel anytime`
    : `From $${STANDARD_MONTHLY_PRICE.pro}/mo · Cancel anytime`;
