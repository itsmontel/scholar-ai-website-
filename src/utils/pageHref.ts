/**
 * Page key to public URL, for rendering real `<a href>` links.
 *
 * Why this exists: CTAs used to be `<button onClick={onNavigate(page)}>`, which
 * works for humans but is invisible to crawlers, so none of that internal
 * linking counted for SEO. Rendering an anchor with a correct href (and still
 * calling onNavigate on click to keep SPA navigation) gets both.
 *
 * Keep in sync with `pageUrlMap` in CompleteAcademicAIApp.tsx, which is the
 * authoritative map used for history pushes.
 */
const PAGE_HREF: Record<string, string> = {
  landing: '/',
  features: '/features',
  pricing: '/pricing',
  about: '/about',
  contact: '/contact',
  help: '/help',
  blog: '/blog',
  press: '/press',
  privacy: '/privacy',
  terms: '/terms',
  signup: '/signup',
  login: '/login',
  'focus-mode': '/focus-mode',
  'why-students-choose': '/why-students-choose',
  'study-tools-comparison': '/vs-quizlet-knowt',
  'more-tools': '/more-tools',
  'ai-essay-editor': '/ai-essay-editor',
  // Tools
  analyze: '/tools/analyze',
  citations: '/tools/citations',
  'study-pack': '/tools/study-pack',
  summarizer: '/tools/summarizer',
  'quiz-generator': '/tools/quiz-generator',
  'create-flashcards': '/tools/create-flashcards',
  'word-counter': '/tools/word-counter',
  'citation-generator-tool': '/tools/citation-generator',
  'grammar-checker': '/tools/grammar-checker',
  'readability-score': '/tools/readability-score',
  'thesis-generator': '/tools/thesis-generator',
  'essay-outline': '/tools/essay-outline',
  'text-case-converter': '/tools/text-case-converter',
  'paraphrasing-tips': '/tools/paraphrasing-tips',
  'gpa-calculator': '/tools/gpa-calculator',
  'pomodoro-timer': '/tools/pomodoro-timer',
  calculator: '/tools/calculator',
  converter: '/tools/converter',
  'crater-blast': '/tools/crater-blast',
};

/**
 * Resolve a page key (or an already-absolute path) to a public URL.
 * Values that already start with "/" pass through untouched, so callers can
 * pass full paths for routes without a page key (e.g. "/guides/how-to-...").
 */
export function hrefForPage(page: string): string {
  if (page.startsWith('/')) return page;
  return PAGE_HREF[page] ?? `/${page}`;
}
