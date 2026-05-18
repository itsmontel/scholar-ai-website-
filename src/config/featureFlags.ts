/**
 * Feature flags — set to false to re-enable
 * HIDE_FRIENDS: Hides all friends-related UI (landing sections, header, dashboard, friends page)
 * HIDE_STREAK_AND_BADGES: Hides streak + badge widgets, achievement toasts, and /badges
 * SKIP_ONBOARDING_STRIPE: After profile setup, finish onboarding without embedded Stripe (upgrade via billing / paywall)
 */
export const HIDE_FRIENDS = true;
export const HIDE_STREAK_AND_BADGES = false;
export const SKIP_ONBOARDING_STRIPE = false;

/**
 * Free-tier in-app writing editor allowance, in words.
 *   0  = no cap — everyone gets unlimited writing (current).
 *   >0 = free users are blocked from adding content past this many
 *        words (they can still trim/delete + analyze) and see an
 *        upgrade banner; Pro/Premium/Focus stay unlimited.
 * Writing is cheap to serve and is the funnel into the paid
 * analysis step, so the cap is OFF — set this back to e.g. 500 to
 * re-enable instantly (all the plumbing is still wired).
 */
export const FREE_EDITOR_WORD_LIMIT = 0;
