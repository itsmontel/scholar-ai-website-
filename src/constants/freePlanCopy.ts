/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * The gate model changed. With FREEMIUM_PREVIEW = false in
 * src/config/featureFlags.ts, a free, never-trialed user is BLOCKED from
 * the essay analyzer, citation finder, study packs and the writing
 * workspace until they start the card-required 7-day trial. The backend
 * `free` entry in PLAN_LIMITS still provisions one preview of each tool,
 * but the UI gate means a free user cannot reach it.
 *
 * So "no credit card" is NOT a true claim for the AI tools any more. It is
 * only true of (a) creating an account and (b) the standalone utilities
 * under /tools/* that need no AI call. Copy here reflects that. If you flip
 * FREEMIUM_PREVIEW back to true, revisit these strings, because they will
 * then be understating what free users get.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Free tools plus a 7-day Pro trial when you want the AI features';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION = 'Free account, free study utilities, upgrade for the AI tools';

/** Reusable trial line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  '7-day free trial · $0 today · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Free to sign up. Starting your 7-day Pro trial takes a card, $0 today, cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  '1 free essay analysis — grade, issues & top fixes (full report with Pro)',
  '1 free study pack — lesson + 4 flashcards (quiz & games with Pro)',
  '1 free citation search — 3 sources (full list with Pro)',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  '1 free analysis (grade + issues; fixes with Pro)',
  '1 free study pack (lesson + 4 cards; quiz & games with Pro)',
  '1 free citation search (3 sources; full list with Pro)',
  '3 documents/mo, 5k summarizer, 2MB storage',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Full fixes & one-click apply revisions (Pro)',
  'Quiz, games & full flashcard decks (Pro)',
  'Full citation lists & PDF/Word export (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Creating an account is free and takes no card. The study utilities are free to use with no subscription: word counter, citation generator, thesis helper, essay outline, grammar check, readability score, GPA calculator and the Pomodoro timer. The AI features are what Pro covers, so the essay analyzer, citation finder and study pack generator run on a 7-day free trial that asks for a card up front. You pay nothing during the trial, you can cancel any time inside it, and if you keep going your first month is $9.99 instead of $19.99.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; 1 one-time AI essay analysis preview (grade estimate, issue counts, and top suggestions — full annotations, rubric scores, and apply-revisions unlock with Pro); 1 one-time study pack preview (full lesson and first 4 flashcards — quiz, arcade games, full deck, and export unlock with Pro); 1 one-time citation search preview (first 3 sources — full list unlocks with Pro); 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  '1 free essay analysis — grade, issues & top suggestions (full fixes with Pro)',
  '1 free study pack — lesson + 4 flashcards (quiz & games with Pro)',
  '1 free citation search — 3 sources (full list with Pro)',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '1 free pack: full lesson + 4 flashcards — quiz, games & full deck with Pro';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '1 free analysis: grade estimate, issues & top fixes — full report with Pro';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '1 free search: 3 full sources — unlock the full list with Pro';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Start your 7-day free trial · $0 today · Cancel anytime';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get your estimated grade, what\'s wrong, and a ranked fix list. The analyzer is a Pro feature, so it runs on your 7-day free trial: $0 today, cancel any time inside the trial.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. It is part of Pro, so it runs on your 7-day free trial. The simpler study utilities, like the Pomodoro timer and GPA calculator, are free to use without a subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free account: the standalone utilities, so word counter, citation generator, thesis helper, essay outline, grammar check, readability score, GPA calculator and Pomodoro timer, with no card and no subscription. Pro: the AI features, so 99 combined analyses, study packs and citations per month, apply WriteScholar revisions into your draft, all citation styles, PDF and Word export, uploads up to 100MB, and every study tool unlocked. Pro starts with a 7-day free trial that asks for a card, charges nothing up front, and can be cancelled inside the trial. Premium: 5x the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage.';
