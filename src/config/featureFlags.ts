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
 * FREEMIUM_PREVIEW: the conversion model for brand-new, never-trialed users.
 *
 *   true  = "preview, then paywall" (current). New free users can browse the
 *           real dashboard AND actually run each feature on their own input.
 *           They see a genuine preview of the result (analysis summary +
 *           how many fixes were found, study-pack lesson + a few cards, one
 *           full citation) but the full payoff is locked behind the trial /
 *           subscription. Value is demonstrated, not delivered.
 *
 *   false = the old hard paywall: a free, never-trialed user is blocked from
 *           every tool until they start the 7-day trial. (Set to false to
 *           instantly revert to the hard gate — all the plumbing stays wired.)
 *
 * Why true: a hard paywall asks for trust before we've earned it, so almost
 * nobody started the trial. Letting users feel the quality on their OWN work,
 * then hitting the lock at peak motivation, is what converts.
 */
export const FREEMIUM_PREVIEW = true;

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
