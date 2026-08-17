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
 *   - End with a risk-reversal phrase to lift CTR. This used to say
 *     "Preview free", which stopped being true when the trial gate went
 *     live (FREEMIUM_PREVIEW = false). Promising a free preview that a
 *     visitor cannot reach is the most expensive kind of bounce, so the
 *     phrase is now the trial terms, which are genuinely reassuring:
 *     nothing is charged up front and it can be cancelled.
 */
export const LANDING_PAGE_TITLE =
  "AI Essay Grader — Turn B Essays Into A's | WriteScholar";

export const LANDING_META_DESCRIPTION =
  "Write your essay in a real editor and get a professor-style grade, a full rubric, and one-click fixes. 7-day free trial, $0 today, cancel anytime.";
