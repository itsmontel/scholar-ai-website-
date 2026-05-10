/**
 * Homepage title + meta description.
 * Keep `index.html` `<title>`, `<meta name="description">`, og/twitter (`/og-image.png`), and JSON-LD in sync manually.
 *
 * Title rules:
 *   - ≤60 chars so Google doesn't truncate
 *   - Lead with the *emotional hook* ("Turn B Essays Into A's"), not a
 *     keyword. Compelling titles outperform keyword-stuffed ones on CTR by
 *     2-3x, and high CTR is itself a ranking signal. The keyword "AI"
 *     still appears, but as supporting context rather than the lead.
 *   - Mirrors the homepage H1 ("Turn your grades from B → A") so users
 *     who click see the same promise, reducing bounce.
 *   - Brand at the end (left-side pixels are premium SERP real estate).
 *
 * Description rules:
 *   - 150-160 chars (Google's mobile cutoff)
 *   - Lead with the result ("Paste your essay, ..."), not the feature
 *   - End with a friction-removal phrase ("Free, no credit card") to lift CTR
 */
export const LANDING_PAGE_TITLE =
  "Turn Your Grades from B to A with AI | WriteScholar";

export const LANDING_META_DESCRIPTION =
  "AI essay feedback + flashcards from your notes — designed to take your grades from B to A on essays AND exams. Free to start, no credit card needed.";
