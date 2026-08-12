/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * The model: there is no standalone free tier to settle into. Each AI
 * feature gets ONE lifetime preview — the essay analysis is spent during
 * onboarding, on the user's own work, before they're asked for a card.
 * After that the trial is the only way forward. These numbers mirror the
 * `free` entry in PLAN_LIMITS (backend/src/services/subscriptionService.js);
 * change both together or the copy will promise runs the API refuses.
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'One free preview of each tool on your own work — no credit card';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION = 'Try it free — see a real result on your own work';

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
  'When you sign up you analyse one of your own essays free — no credit card — and see a real grade estimate, what\'s wrong, and your top fixes. That\'s the free plan: one lifetime preview of each tool, so you can judge the product on your own work before paying. You get 1 free essay analysis (full line-by-line fixes and one-click apply unlock with Pro), 1 free study pack generation (full lesson plus the first 4 flashcards; quiz, arcade games, and the full deck unlock with Pro), and 1 free citation search (first 3 sources shown fully; the complete list unlocks with Pro). Also included: 3 documents per month, 5,000 Paper Summarizer words, and 2MB document library storage. Beyond that, Pro starts with a 7-day free trial.';

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
  'Analyse your first essay free — no credit card';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get your estimated grade, what\'s wrong, and a ranked fix list. Your first analysis is free when you sign up; unlock every fix and one-click apply with Pro.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Free users get the full lesson and first 4 flashcards as a preview; quiz, games, and the full deck unlock with Pro.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free: one lifetime preview of each tool on your own work — analyse an essay, build a study pack, run a citation search — so you can see grade estimates, issues, lessons, and sample sources before paying. Pro: 99 combined full analyses, study packs & citations per month, apply WriteScholar revisions into your draft, all citation styles, PDF and Word export, uploads up to 100MB, and every study tool unlocked. Pro starts with a 7-day free trial. Premium: 5× the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage.';
