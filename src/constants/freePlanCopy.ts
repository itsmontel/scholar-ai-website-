/**
 * Canonical copy for the Free plan — freemium preview model.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates (preview on your own work, full payoff on Pro).
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Preview analyses, study packs & citations on your own work — no credit card';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION = 'Try every feature free — see real results on your own work';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  '2 free essay analyses — grade, issues & top fixes (full report with Pro)',
  '2 free study packs — lesson + 4 flashcards (quiz & games with Pro)',
  '2 free citation searches — 3 sources each (full list with Pro)',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  '2 free analyses (grade + issues; fixes with Pro)',
  '2 free study packs (lesson + 4 cards; quiz & games with Pro)',
  '2 free citation searches (3 sources each; full list with Pro)',
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
  'The free plan lets you run each feature on your own work and see a real preview — no credit card required. You get 2 free essay analyses (grade estimate, what\'s wrong, and top suggestions; full line-by-line fixes and one-click apply unlock with Pro), 2 free study pack generations (full lesson plus the first 4 flashcards; quiz, arcade games, and the full deck unlock with Pro), and 2 free citation searches (first 3 sources shown fully each; unlock the complete list with Pro). Also included: 3 documents per month, 5,000 Paper Summarizer words, and 2MB document library storage.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; 2 one-time AI essay analysis previews (grade estimate, issue counts, and top suggestions — full annotations, rubric scores, and apply-revisions unlock with Pro); 2 one-time study pack previews (full lesson and first 4 flashcards — quiz, arcade games, full deck, and export unlock with Pro); 2 one-time citation search previews (first 3 sources each — full list unlocks with Pro); 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  '2 free essay analyses — grade, issues & top suggestions (full fixes with Pro)',
  '2 free study packs — lesson + 4 flashcards (quiz & games with Pro)',
  '2 free citation searches — 3 sources each (full list with Pro)',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '2 free packs: full lesson + 4 flashcards — quiz, games & full deck with Pro';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '2 free analyses: grade estimate, issues & top fixes — full report with Pro';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '2 free searches: 3 full sources each — unlock the full list with Pro';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Free previews on your own work — no credit card';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get your estimated grade, what\'s wrong, and a ranked fix list. Free includes 2 one-time analysis previews; unlock every fix and one-click apply with Pro.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Free users get the full lesson and first 4 flashcards as a preview; quiz, games, and the full deck unlock with Pro.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free: preview analyses, study packs, and citations on your own work (2 one-time previews each) — see grade estimates, issues, lessons, and sample sources before upgrading. Pro: 99 combined full analyses, study packs & citations per month, apply WriteScholar revisions into your draft, all citation styles, PDF and Word export, uploads up to 100MB, and every study tool unlocked. Premium: 5× the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage.';
