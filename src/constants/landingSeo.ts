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
 *   - End with a risk-reversal phrase to lift CTR. The front-door offer
 *     is the $1, 7-day trial (src/config/pricing.ts), so say that.
 */
export const LANDING_PAGE_TITLE =
  "AI Essay Grader — Turn B Essays Into A's | WriteScholar";

export const LANDING_META_DESCRIPTION =
  "Get a professor-style grade and line-by-line fixes on your essay, plus study packs and citations. Try everything for $1 for 7 days.";
