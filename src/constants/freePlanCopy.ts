/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * Credits: an essay analysis, a study pack and a citation search each
 * cost 1 credit. A free account has no credits — the 3-day free trial
 * gives 3, then Pro is $19.99/mo for 99 credits (Premium $39.99 for
 * 199). Unused credits roll over each month, up to 499. The writing
 * editor and the standalone utilities stay free.
 * See src/config/pricing.ts and backend/src/services/creditService.js.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Free writing tools · start the 3-day trial for 3 credits';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  'Write and organise for free. Start the 3-day free trial to get 3 credits for essay feedback, study packs and citations.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  '3-day free trial · 3 credits · then $19.99/mo · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Try it free for 3 days with 3 credits, then $19.99/mo for 99 credits a month. Unused credits roll over. Cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  'Writing editor with no word limit',
  '3-day free trial with 3 credits',
  '1 credit = 1 essay analysis, study pack or citation search',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  'Writing editor, no word limit',
  '3-day free trial with 3 credits',
  '1 credit per analysis, study pack or citation search',
  '3 documents/mo, 5k summarizer, 2MB storage',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Monthly credits for essay feedback, study packs & citations (Pro)',
  'Credits that roll over month to month (Pro)',
  'Full source lists & export so your references are done (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Creating an account is free and takes no card. The writing editor and the standalone study utilities (word counter, citation generator, GPA calculator, Pomodoro, and more) stay free. Essay feedback, study packs and citation searches use credits: start the 3-day free trial to get 3 credits, then Pro is $19.99/mo for 99 credits a month. Unused credits roll over, up to 499.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; no credits for AI essay analysis, study packs or citation searches (the 3-day free trial includes 3 credits); 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  'Writing editor with no word limit',
  '0 credits: start the 3-day trial for 3',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '1 credit per study pack · 3 free credits with the 3-day trial';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '1 credit per analysis · 3 free credits with the 3-day trial';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '1 credit per search · 3 free credits with the 3-day trial';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Start your 3-day free trial · 3 credits · Cancel anytime';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get every green, amber, and red highlight, comments, suggested fixes and a grade estimate. Each analysis uses 1 credit, and the 3-day free trial includes 3.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Each pack uses 1 credit, and the 3-day free trial includes 3. Simpler utilities like the Pomodoro timer and GPA calculator stay free with no subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Every essay analysis, study pack and citation search costs 1 credit. Free: the writing editor and standalone utilities, no credits. Free trial: 3 days with 3 credits. Pro: $19.99/mo for 99 credits a month, all citation styles, PDF and Word export, uploads up to 100MB, and every study tool. Premium: $39.99/mo for 199 credits a month, unlimited research-paper summarising, and 1GB of library storage. Unused credits roll over every month, up to 499.';
