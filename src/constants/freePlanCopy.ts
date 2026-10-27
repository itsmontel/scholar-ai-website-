/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * Credits: an essay analysis, a study pack and a citation search each
 * cost 1 credit. A free account has no credits. The way in is the $1
 * trial: $1 today for 7 days of Pro with 5 credits and everything
 * unlocked, then Pro bills $19.99/mo for 99 credits (Premium $39.99 for
 * 199). Unused paid credits roll over, up to 499. The writing editor and
 * the standalone utilities stay free.
 * See src/config/pricing.ts and backend/src/services/creditService.js.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Free writing tools · try everything for $1';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  'Write and organise for free. Try essay feedback, study packs and citations for $1: 7 days and 5 credits, everything unlocked.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  '$1 for 7 days · 5 credits · then $19.99/mo · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Try everything for $1: 7 days and 5 credits, with every comment and fix unlocked. Then Pro is $19.99/mo for 99 credits a month. Unused credits roll over. Cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  'Writing editor with no word limit',
  'Free study utilities (word counter, GPA, Pomodoro and more)',
  'Try everything for $1: 7 days, 5 credits',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  'Writing editor, no word limit',
  'Free study utilities',
  '$1 trial: 7 days, 5 credits',
  '3 documents/mo, 5k summarizer, 2MB storage',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Essay grades, comments and one-click fixes (Pro)',
  'Study packs, flashcards and study games (Pro)',
  'Monthly credits that roll over (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Creating an account is free. The writing editor and the standalone utilities (word counter, citation generator, GPA calculator, Pomodoro, and more) stay free. Essay feedback, study packs and citation searches use credits: try everything for $1, which gives you 7 days of Pro and 5 credits with every comment and fix unlocked. After that, Pro is $19.99/mo for 99 credits a month. Unused credits roll over, up to 499. Cancel anytime.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; no credits for AI essay analysis, study packs or citation searches (the $1, 7-day trial includes 5 credits); 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  'Writing editor with no word limit',
  '0 credits: try everything for $1 (7 days, 5 credits)',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '1 credit per study pack · 5 credits in the $1 trial';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '1 credit per analysis · 5 credits in the $1 trial';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '1 credit per search · 5 credits in the $1 trial';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Try everything for $1 · 7 days · cancel anytime';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get every green, amber and red highlight, comments, one-click fixes, a rubric breakdown and a grade estimate. Each analysis uses 1 credit, and the $1 trial includes 5.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Each pack uses 1 credit, and the $1 trial includes 5. Simpler utilities like the Pomodoro timer and GPA calculator stay free with no subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Every essay analysis, study pack and citation search costs 1 credit. Free: the writing editor and standalone utilities, no credits. Trial: $1 for 7 days with 5 credits and everything unlocked. Pro: $19.99/mo for 99 credits a month, every comment and fix, full study packs and games, all citation styles, PDF and Word export, and uploads up to 100MB. Premium: $39.99/mo for 199 credits a month, unlimited research-paper summarising, and 1GB of library storage. Unused credits roll over every month, up to 499.';
