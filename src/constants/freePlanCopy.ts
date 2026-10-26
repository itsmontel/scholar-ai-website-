/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * Credits: an essay analysis, a study pack and a citation search each
 * cost 1 credit. A new account gets 3 free credits to use within 7 days
 * (no card). A free essay grade shows the letter grade, a rough bar per
 * rubric section and every
 * highlight; the comments, section scores and fixes are Pro. A free
 * study pack opens the lesson, the full quiz and the first 5 flashcards.
 * Pro is 50% off the first month ($9.99), then $19.99/mo for 99 credits
 * (Premium $39.99 for 199). Unused paid credits roll over, up to 499.
 * The writing editor and the standalone utilities stay free.
 * See src/config/pricing.ts and backend/src/services/creditService.js.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Free writing tools · 3 free credits for your first week';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  'Write and organise for free. New accounts get 3 free credits to use within 7 days: grade an essay or build a study pack, no card needed.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  '50% off your first month · then $19.99/mo · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Start with 3 free credits, no card. Pro is $9.99 for your first month, then $19.99/mo for 99 credits a month. Unused credits roll over. Cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  'Writing editor with no word limit',
  '3 free credits to use in your first 7 days',
  'Free grades show your grade and every highlight',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  'Writing editor, no word limit',
  '3 free credits, first 7 days',
  'Grade + highlights on every essay',
  '3 documents/mo, 5k summarizer, 2MB storage',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Every comment, section score and one-click fix (Pro)',
  'Full flashcard decks, the crossword and study games (Pro)',
  'Monthly credits that roll over (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Creating an account is free and takes no card. New accounts get 3 free credits to use within 7 days. A free essay grade shows your letter grade, a rough bar for each rubric section and every green, amber and red highlight; your exact score, the comments and the fixes come with Pro. A free study pack opens the lesson, the full quiz and the first 5 flashcards. The writing editor and the standalone utilities (word counter, citation generator, GPA calculator, Pomodoro, and more) stay free. Pro is $9.99 for your first month, then $19.99/mo for 99 credits a month. Unused credits roll over, up to 499.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; 3 free credits for AI essay analysis, study packs or citation searches, usable within 7 days of signing up, with comments, section scores, revisions, full flashcard decks and study games reserved for paid plans; 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  'Writing editor with no word limit',
  '3 free credits in your first 7 days',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '1 credit per study pack · free packs open the lesson and the full quiz';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '1 credit per analysis · free grades show every highlight';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '1 credit per search · 3 free credits in your first week';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  '3 free credits · no card needed · grade your essay in 60 seconds';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get a grade estimate, a rough bar for each rubric section and every green, amber and red highlight. Pro adds your exact score, the comments and one-click fixes. Each analysis uses 1 credit, and new accounts get 3 free.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Each pack uses 1 credit, and new accounts get 3 free: a free pack opens the lesson, the full quiz and the first 5 flashcards. Simpler utilities like the Pomodoro timer and GPA calculator stay free with no subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Every essay analysis, study pack and citation search costs 1 credit. Free: the writing editor, the standalone utilities and 3 free credits in your first 7 days, with grades showing every highlight and packs opening the lesson and quiz. Pro: $9.99 for your first month, then $19.99/mo for 99 credits a month, every comment and fix, full study packs and games, all citation styles, PDF and Word export, and uploads up to 100MB. Premium: $39.99/mo for 199 credits a month, unlimited research-paper summarising, and 1GB of library storage. Unused credits roll over every month, up to 499.';
