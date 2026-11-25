/**
 * Homepage title + meta description.
 * Keep `index.html` `<title>`, `<meta name="description">`, og/twitter
 * (`/og-image.png`), the JSON-LD and the <noscript> fallback in sync.
 *
 * The title, description, H1 and H2 tell one story so a searcher sees the
 * same promise on Google and on the page. Essay writing and grading is what people pay for, so the title and
 * description lead with it and study packs follow. The homepage has two doors:
 *   Title  "Free AI Essay Writer, Grader and Study Packs | WriteScholar"
 *   H1     "Study for any exam in minutes"   (exam door)
 *          "Turn B essays into A's"          (essay door)
 * Essay-grader search intent lives on /essay-grader, which keeps its own
 * title and H1.
 *
 * Title: 60 characters or fewer, leads with "Free", brand last.
 * Description: 150 to 160 characters, covers both doors, ends with the
 * risk reversal ("Free to start, no card.").
 */
export const LANDING_PAGE_TITLE =
  "Free AI Essay Writer, Grader and Study Packs | WriteScholar";

export const LANDING_META_DESCRIPTION =
  "Plan and write your essay with AI help, then get a professor-style grade and fixes. Study packs, flashcards and quizzes too. Free to start, no card needed.";
