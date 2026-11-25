/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * Free: 4 credits a month, no card. An essay grade costs 2 credits and a
 * study pack costs 1. The first essay a free account grades comes back whole,
 * every comment included. Later free grades return the estimated grade,
 * the /100 score and every rubric score, plus full feedback on the first
 * quarter of the essay (cut on the server in
 * backend/src/services/analysisRedaction.js). Free study packs are
 * complete (lesson, flashcards, quiz, crossword and games) and are kept
 * for 30 days. Rewrites, one-click fixes, the professor's rubric check,
 * and citation searches are Pro. Export (Word, PDF) and every citation style in the editor are free. The essay writer (outlines,
 * paragraph starters, paragraph checks, rewrites) is free and capped:
 * 2 outlines and 10 writing helps a month free, 100 and 500 on Pro, 250 and 1,000 on Premium.
 * Anyone can buy a credit top-up (TOPUP_PACKS in src/config/pricing.ts).
 * Pro: $19.99/mo for 99 credits, first month $9.99 for new subscribers.
 * Premium: $39.99/mo for 199 credits, first month $19.99.
 * Unused paid credits roll over, up to 499. The writing editor and the
 * standalone utilities stay free.
 * See src/config/pricing.ts and backend/src/services/creditService.js.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  '4 free credits a month: 2 essay grades or 4 study packs';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  '4 free credits a month for study packs and essay grades. Your first essay report is complete, every comment included. No card.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  'First month $9.99, then $19.99/mo · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Pro is $9.99 for your first month, then $19.99 a month, for 99 credits, feedback on your whole essay, every rewrite and one-click fixes. Unused credits roll over. Cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  '4 credits a month: an essay grade costs 2, a study pack 1',
  'Essay writer: 2 outlines and 10 writing helps a month',
  'Word and PDF export, and citations in all six styles',
  'Full study packs: flashcards, quiz, crossword and games',
  'Your first essay report in full, every comment',
  'Later grades: your grade, every rubric score and the first quarter of comments',
  'Free study utilities (word counter, GPA, Pomodoro and more)',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  '4 credits a month',
  'Essay writer with outlines',
  'Full study packs and games',
  'First essay report in full',
  'Free study utilities',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Every comment on every essay after your first (Pro)',
  'Rewrites and one-click fixes (Pro)',
  'More than 4 credits a month (Pro)',
  'Citation searches and the rubric check (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Yes. A free account gets 4 credits a month with no card, a study pack costs 1 credit and an essay grade costs 2. Study packs are complete: a lesson, flashcards, a quiz, a crossword and games. Your first essay report is complete too, with every comment. After that, a free grade shows the estimated grade, the score out of 100, every rubric score and the line-by-line feedback on the first quarter of your essay. Pro is $9.99 for your first month, then $19.99 a month, and adds feedback on every essay in full, the rewrites and one-click fixes, the check against your professor’s rubric and citation searches, with 99 credits a month that roll over up to 499. Cancel anytime.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '4 credits per calendar month, where an essay analysis (200 to 10,000 words) uses 2 credits and a study pack uses 1; the first essay analysis on an account is returned in full, later analyses return the grade, score and rubric scores with comments on the first portion of the essay; comments on the remainder, rewrites, one-click revisions, rubric alignment and citation searches require a paid plan; study packs are kept for 30 days; the essay writer allows 2 outlines and 10 writing helps per month; 3 documents per month; 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '4 credits a month for study packs and essay grades',
  'Full study packs, kept for 30 days',
  'Your first essay report in full',
  'Essays from 200 to 10,000 words',
  '3 documents per month',
  'Writing editor with no word limit',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '4 free credits a month · 1 credit per pack';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '4 free credits a month · your first report is complete';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  'Citation searches are part of Pro · 1 credit per search';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Free to try · No card · 4 credits a month';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually about a minute. Paste your essay and you get an estimated grade, a score for every rubric category, and green, amber and red highlights with comments. Your first report is free and complete. After that, a free grade shows the full feedback on the first quarter of your essay, and Pro opens the rest with the rewrites and one-click fixes.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Type an exam topic or add your notes and Study Pack builds a lesson, flashcards, a quiz, a crossword and arcade games. Free accounts get 4 credits a month and each pack costs 1. Simpler utilities like the Pomodoro timer and GPA calculator stay free with no account.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free: 4 credits a month for study packs and essay grades, with full study packs, your first essay report in full, the essay writer with Word and PDF export and all six citation styles, and the standalone utilities. Pro: $9.99 for your first month, then $19.99/mo, for 99 credits a month, feedback on every essay in full, every rewrite and one-click fix, the rubric check and uploads up to 100MB. Premium: $19.99 for your first month, then $39.99/mo, for 199 credits a month, unlimited research-paper summarising, and 1GB of library storage. An essay grade costs 2 credits, a study pack or citation search costs 1, and unused credits roll over every month, up to 499.';
