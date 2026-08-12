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
 *   true  = "preview, then paywall". New free users can browse the real
 *           dashboard AND actually run each feature on their own input.
 *           They see a genuine preview of the result (analysis summary +
 *           how many fixes were found, study-pack lesson + a few cards, one
 *           full citation) but the full payoff is locked behind the trial /
 *           subscription. Value is demonstrated, not delivered.
 *
 *   false = the hard trial gate (current). A free, never-trialed user is
 *           blocked from the core AI tools — Essay Analyzer, Citation Finder,
 *           Study Packs, and the writing workspace — until they start the
 *           card-required 7-day trial. Standalone free utilities under
 *           /tools/* (word counter, GPA calc, pomodoro, etc.) stay open.
 *
 * History: we ran the hard gate before → almost nobody started the trial, so
 * we switched to freemium preview. Freemium then converted very few users to
 * PAID, so we're re-testing the hard gate: force the 7-day card-on-file trial
 * as the only way to reach the core product. Flip back to true to restore the
 * preview model — all the plumbing stays wired either way.
 */
export const FREEMIUM_PREVIEW = false;

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
