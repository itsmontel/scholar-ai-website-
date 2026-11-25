/**
 * Homepage title + meta description.
 * Keep `index.html` `<title>`, `<meta name="description">`, og/twitter
 * (`/og-image.png`), the JSON-LD and the <noscript> fallback in sync.
 *
 * The title, description, H1 and H2 tell one story so a searcher sees the
 * same promise on Google and on the page. Since 2026-11-18 the homepage
 * has two doors and opens on the exam one:
 *   Title  "Free AI Study Packs and Essay Grader | WriteScholar"
 *   H1     "Study for any exam in minutes"   (exam door, the default)
 *          "Turn B essays into A's"          (essay door)
 * Essay-grader search intent lives on /essay-grader, which keeps its own
 * title and H1.
 *
 * Title: 60 characters or fewer, leads with "Free", brand last.
 * Description: 150 to 160 characters, covers both doors, ends with the
 * risk reversal ("Free to start, no card.").
 */
export const LANDING_PAGE_TITLE =
  "Free AI Study Packs, Essay Writer and Grader | WriteScholar";

export const LANDING_META_DESCRIPTION =
  "Turn an exam topic into flashcards, a quiz and study games. Plan and write an essay from its question, then get it graded. Free to start, no card needed.";
