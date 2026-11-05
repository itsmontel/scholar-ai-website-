/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * Free: 1 essay grade a month, no card. A free grade returns the
 * estimated grade, the /100 score and every rubric score, plus full
 * feedback (every highlight and comment) on the first quarter of the
 * essay and the written reasoning on 2 of the 6 rubric sections. The
 * rest of the essay's comments, the other rubric reasoning, the rewrites,
 * one-click fixes, the professor's rubric check, export, study packs and
 * citation searches are Pro. Cut on the server in
 * backend/src/services/analysisRedaction.js.
 * Pro: $19.99/mo for 99 credits (student launch price, list $39.99).
 * Premium: $39.99/mo for 199 credits (launch price, list $59.99).
 * Unused paid credits roll over, up to 499. The writing editor and the
 * standalone utilities stay free.
 * See src/config/pricing.ts and backend/src/services/creditService.js.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  '1 free essay grade a month';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  'Grade 1 essay a month for free: your estimated grade, every rubric score and full feedback on the first part of your essay. No card.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  'Student launch price: $19.99/mo, not $39.99 · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Pro is $19.99 a month at the student launch price (list price $39.99) for 99 credits, feedback on your whole essay, every rewrite and one-click fixes. Unused credits roll over. Cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  '1 essay grade a month: your grade and every rubric score',
  'Full feedback on the first quarter of your essay',
  'Essays from 200 to 10,000 words',
  'Writing editor with no word limit',
  'Free study utilities (word counter, GPA, Pomodoro and more)',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  '1 essay grade a month',
  'Your grade and every rubric score',
  'Writing editor, no word limit',
  'Free study utilities',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Feedback on the rest of your essay (Pro)',
  'Rewrites and one-click fixes (Pro)',
  'Study packs, flashcards and study games (Pro)',
  'Citation searches, rubric check and export (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Yes. A free account grades 1 essay a month, between 200 and 10,000 words, with no card. You see the estimated grade, the score out of 100, every rubric score, and the full line-by-line feedback on the first quarter of your essay. Pro ($19.99 a month at the student launch price, list price $39.99) adds the feedback on the rest of your essay, the rewrites and one-click fixes, the check against your professor’s rubric, Word export, study packs and citation searches, with 99 credits a month that roll over up to 499. Cancel anytime.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '1 essay analysis per calendar month (200 to 10,000 words) returning the grade, score and rubric scores, with comments on the first portion of the essay; comments on the remainder, rewrites, one-click revisions, rubric alignment, export, study packs and citation searches require a paid plan; 3 documents per month; 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '1 essay grade per month (grade and every rubric score)',
  'Full feedback on the first quarter of each graded essay',
  'Essays from 200 to 10,000 words',
  '3 documents per month',
  'Writing editor with no word limit',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  'Study packs are part of Pro · 1 credit per pack';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '1 free grade a month · Pro unlocks your whole essay';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  'Citation searches are part of Pro · 1 credit per search';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Free grade in 60 seconds · No card · 1 a month';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Paste your essay and you get an estimated grade, a score for every rubric category, and green, amber and red highlights with comments. Your first grade each month is free and shows the full feedback on the first quarter of your essay. Pro opens the rest, with the rewrites and one-click fixes.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, a quiz, a crossword and arcade games. Study packs are part of Pro (1 credit per pack). Simpler utilities like the Pomodoro timer and GPA calculator stay free with no subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free: 1 essay grade a month with the grade, score and every rubric score, plus full feedback on the first quarter of the essay, the writing editor and the standalone utilities. Pro: $19.99/mo at the student launch price (list $39.99) for 99 credits a month, feedback on the whole essay, every rewrite and one-click fix, the rubric check, full study packs and games, all citation styles, PDF and Word export, and uploads up to 100MB. Premium: $39.99/mo (list $59.99) for 199 credits a month, unlimited research-paper summarising, and 1GB of library storage. Every essay analysis, study pack and citation search costs 1 credit, and unused credits roll over every month, up to 499.';
