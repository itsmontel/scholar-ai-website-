/**
 * Canonical copy for the Free plan.
 * Import from here anywhere pricing, billing, account, or marketing
 * surfaces describe what free users get. Keeps messaging aligned with
 * the actual product gates.
 *
 * ─── IMPORTANT: read before editing ───────────────────────────────────
 * With FREEMIUM_PREVIEW = true, free users can run essay analysis and
 * study packs twice each and see a genuine partial result (~50% of essay
 * annotations / half the pack unlocked).
 * Unlocking the rest is a paid Pro checkout — currently 50% off the first
 * month (NEWCUSTOMER), no free trial (see src/config/pricing.ts).
 */

/** One-line summary for account headers, chips, etc. */
export const FREE_PLAN_SUMMARY_SHORT =
  'Free previews of essay feedback, study packs & citations — unlock Pro at 50% off';

/** Subtitle under pricing / billing Free cards */
export const FREE_PLAN_DESCRIPTION =
  'Try essay analysis and study packs twice for free. Unlock the full report with Pro — 50% off your first month.';

/** Reusable upgrade line. Use this wherever a CTA needs a friction note. */
export const TRIAL_CTA_FOOTNOTE =
  '50% off first month · then $19.99/mo · Cancel anytime';

/** Slightly longer version where there is room for the honest detail. */
export const TRIAL_CTA_FOOTNOTE_LONG =
  'Free to try. Unlock Pro at 50% off your first month ($9.99), then $19.99/mo — cancel anytime.';

/** Bullet list for pricing cards, billing plan picker, landing pricing grid */
export const FREE_PLAN_FEATURE_BULLETS = [
  '2 free essay analyses — first half of annotations free (full markup with Pro)',
  '2 free study packs — lesson + half the flashcards & quiz (games with Pro)',
  '1 free citation search — 3 sources (full list with Pro)',
  '3 documents/mo, 5k-word summarizer, 2MB storage',
] as const;

/** Shorter bullets where space is tight (billing sidebar) */
export const FREE_PLAN_FEATURE_BULLETS_COMPACT = [
  '2 free analyses (first half free; full markup with Pro)',
  '2 free study packs (lesson + half the cards & quiz; games with Pro)',
  '1 free citation search (3 sources; full list with Pro)',
  '3 documents/mo, 5k summarizer, 2MB storage',
] as const;

/** “What you don’t get” row on the pricing page Free card */
export const FREE_PLAN_LIMITATIONS = [
  'Second half of annotations & one-click apply revisions (Pro)',
  'Quiz, games & full flashcard decks (Pro)',
  'Full citation lists & PDF/Word export (Pro)',
] as const;

/** FAQ / long-form answer */
export const FREE_PLAN_FAQ_ANSWER =
  'Creating an account is free and takes no card. You get two free essay analyses (first half of line-by-line feedback), two free study packs (lesson plus the first half of the flashcards and quiz), and one citation search that shows three sources. Unlock the rest with Pro — new customers get 50% off the first month ($9.99 instead of $19.99), then the regular rate. Standalone study utilities (word counter, citation generator, GPA calculator, Pomodoro, and more) stay free with no subscription.';

/** Legal / Terms of Service single bullet */
export const FREE_PLAN_TERMS_BULLET =
  '3 documents per month; 2 one-time AI essay analysis previews (first ~50% of annotations free — full markup, rubric scores, and apply-revisions unlock with Pro); 2 one-time study pack previews (full lesson and first half of flashcards and quiz — arcade games, remaining cards/questions, and export unlock with Pro); 1 one-time citation search preview (first 3 sources — full list unlocks with Pro); 5,000 words/month for the Paper Summarizer; 2MB total document library storage';

/** Account page “What’s included” bullets */
export const FREE_PLAN_ACCOUNT_BULLETS = [
  '3 documents per month',
  '2 free essay analyses — first half of annotations (full markup with Pro)',
  '2 free study packs — lesson + half the flashcards & quiz (games with Pro)',
  '1 free citation search — 3 sources (full list with Pro)',
  '5,000 Paper Summarizer words per month',
  '2MB document library storage',
] as const;

/** Study-pack-specific one-liner */
export const FREE_PLAN_STUDY_PACK_LINE =
  '2 free packs: full lesson + half the flashcards & quiz — games & the rest with Pro';

/** Analysis-specific one-liner */
export const FREE_PLAN_ANALYSIS_LINE =
  '2 free analyses: first half of feedback free — full markup with Pro';

/** Citations-specific one-liner */
export const FREE_PLAN_CITATIONS_LINE =
  '1 free search: 3 full sources — unlock the full list with Pro';

/** Landing CTA footnote */
export const FREE_PLAN_LANDING_CTA =
  'Start free — see half your feedback · Pro from $9.99 first month';

/** Landing FAQ: analysis timing */
export const FREE_PLAN_FAQ_ANALYSIS_TIMING =
  'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get your estimated grade plus the first half of line-by-line feedback free. Unlock the rest of the markup with Pro — 50% off your first month for new customers.';

/** Landing FAQ: study tools */
export const FREE_PLAN_FAQ_STUDY_TOOLS =
  'Yes. Study Pack turns any notes into a lesson, flashcards, quiz, crossword, and arcade games. Your free preview includes the lesson plus the first half of the flashcards and quiz; games and the rest of the deck unlock with Pro (50% off first month for new customers). Simpler utilities like the Pomodoro timer and GPA calculator stay free with no subscription.';

/** Landing FAQ: Free vs Pro vs Premium */
export const FREE_PLAN_FAQ_PLAN_COMPARE =
  'Free: two essay analyses and two study packs (half the essay markup; study-pack lesson + half the cards and quiz), one citation search (3 sources), plus standalone utilities with no card. Pro: full markup and apply-revisions, 99 combined analyses / study packs / citations per month, all citation styles, PDF and Word export, uploads up to 100MB, and every study tool unlocked — new customers get 50% off the first month ($9.99), then $19.99/mo. Premium: 5x the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage.';
