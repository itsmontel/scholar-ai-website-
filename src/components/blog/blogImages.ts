/**
 * Mascot artwork for blog posts, served from public/blog/.
 *
 * Every post with artwork has three files, all derived from one 16:9 render:
 * - `<slug>.webp`       1200px hero at the top of the article (~30KB)
 * - `<slug>-card.webp`  640px thumbnail on the blog index (~13KB)
 * - `og/<slug>.jpg`     1200x630 share image for social cards (JPEG for
 *                       crawlers that still reject WebP)
 *
 * A post missing from this set falls back to its SVG card illustration and
 * the site-wide OG image, so adding a post never requires artwork first.
 */
const SLUGS_WITH_ART = new Set<string>([
  'how-to-study-for-finals',
  'can-professors-tell-if-you-used-chatgpt',
  'what-does-critically-evaluate-mean',
  'turn-lecture-notes-into-study-guide',
  'how-to-start-an-essay',
  'how-to-write-a-good-introduction',
  'how-to-write-an-essay-or-assignment',
  'first-week-of-college-freshman-tips',
  'first-college-paper-fall-semester',
  'college-admission-essay-grader',
  'how-accurate-are-ai-essay-graders',
  'grade-my-essay-before-submitting',
  'essay-checker-plagiarism-research-paper-help-google-searches',
  'check-essay-with-ai-professor-style-feedback',
  'block-websites-until-you-study-earn-screen-time',
  'how-to-avoid-plagiarism',
  'how-to-study-effectively-complete-guide',
  'students-who-get-as-dont-work-harder',
  'ai-study-tools-flashcards-quizzes-crosswords',
  'free-writing-tools-every-student-needs',
  'how-to-write-a-thesis-statement',
  'how-to-write-apa-research-paper',
  'citation-checker-academic-writing',
  'best-academic-writing-tools-for-students',
  'grammar-checker-academic-writing',
  'mla-vs-apa-vs-chicago-citation-style',
  'ai-writing-assistant-for-students',
]);

/** Intrinsic size of the hero files, so the browser reserves the box (no CLS). */
export const BLOG_HERO_SIZE = { width: 1200, height: 671 } as const;
export const BLOG_CARD_SIZE = { width: 640, height: 358 } as const;

export function hasBlogArt(slug: string): boolean {
  return SLUGS_WITH_ART.has(slug);
}

export function blogHeroSrc(slug: string): string {
  return `/blog/${slug}.webp`;
}

export function blogCardSrc(slug: string): string {
  return `/blog/${slug}-card.webp`;
}

/** Path only; callers prefix the site origin for og:image. */
export function blogOgPath(slug: string): string | null {
  return hasBlogArt(slug) ? `/blog/og/${slug}.jpg` : null;
}
