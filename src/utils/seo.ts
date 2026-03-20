/**
 * Canonical URLs and primary meta tags — keep in sync with netlify.toml alias redirects.
 * Prefer https://writescholar.com, no trailing slash except homepage (/).
 */

export const SITE_ORIGIN = 'https://writescholar.com';

/** Alternate public paths → single canonical path (matches sitemap / internal links). */
const PATH_ALIASES: Record<string, string> = {
  '/compare': '/why-students-choose',
  '/study-tools-comparison': '/vs-quizlet-knowt',
  '/compare-study-tools': '/vs-quizlet-knowt',
  '/focus': '/focus-mode',
  '/help-center': '/help',
  '/privacy-policy': '/privacy',
  '/terms-of-service': '/terms',
  '/word-counter': '/tools/word-counter',
  '/citation-generator-tool': '/tools/citation-generator',
  '/readability-score': '/tools/readability-score',
  '/paraphrasing-tips': '/tools/paraphrasing-tips',
  '/essay-outline': '/tools/essay-outline',
  '/text-case-converter': '/tools/text-case-converter',
  '/thesis-generator': '/tools/thesis-generator',
  '/grammar-checker': '/tools/grammar-checker',
  '/summarizer': '/tools/summarizer',
  '/quiz-generator': '/tools/quiz-generator',
  '/flashcard-generator': '/tools/create-flashcards',
  '/create-flashcards': '/tools/create-flashcards',
  '/crossword-generator': '/tools/crossword-generator',
  '/gpa-calculator': '/tools/gpa-calculator',
  '/pomodoro-timer': '/tools/pomodoro-timer',
  '/calculator': '/tools/calculator',
  '/converter': '/tools/converter',
  '/crater-blast': '/tools/crater-blast',
  '/lightning-reflex-quiz': '/tools/crater-blast',
  '/tools/lightning-reflex-quiz': '/tools/crater-blast',
  '/analyze': '/tools/analyze',
  '/citations': '/tools/citations',
  '/view-more-tools': '/more-tools',
  '/tools/more': '/more-tools',
  '/achievements': '/badges',
  '/tools/study-pack-viewer': '/study-pack-viewer',
};

/**
 * Normalize pathname: strip trailing slash (except root), apply alias map.
 */
export function getCanonicalPathname(pathname: string): string {
  let p = pathname.split('?')[0].split('#')[0] || '/';
  if (p.length > 1 && p.endsWith('/')) {
    p = p.replace(/\/+$/, '');
  }
  if (p !== '/' && PATH_ALIASES[p]) {
    return PATH_ALIASES[p];
  }
  return p || '/';
}

/** Absolute canonical URL for indexing (homepage keeps trailing slash). */
export function absoluteCanonicalUrl(pathname: string): string {
  const path = getCanonicalPathname(pathname);
  if (path === '/') {
    return `${SITE_ORIGIN}/`;
  }
  return `${SITE_ORIGIN}${path}`;
}

export function syncBrowserUrlToCanonical(): void {
  const path = window.location.pathname;
  const search = window.location.search;
  const canonicalPath = getCanonicalPathname(path);
  if (path !== canonicalPath) {
    window.history.replaceState(null, '', canonicalPath + search);
  }
}

function setOrCreateMeta(selector: string, attr: string, value: string): void {
  let el = document.querySelector(selector);
  if (el) {
    el.setAttribute(attr, value);
    return;
  }
  el = document.createElement('meta');
  const propMatch = selector.match(/property="([^"]+)"/);
  const nameMatch = selector.match(/name="([^"]+)"/);
  if (propMatch) {
    el.setAttribute('property', propMatch[1]);
  } else if (nameMatch) {
    el.setAttribute('name', nameMatch[1]);
  }
  el.setAttribute(attr, value);
  document.head.appendChild(el);
}

function ensureCanonicalLink(): HTMLLinkElement {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Sets document title, meta description, canonical, og:url, og:title/description, twitter:title/description.
 */
export function applyPageSeoTags(opts: {
  title: string;
  description: string;
  /** Full URL; if omitted, derived from current location. */
  canonicalUrl?: string;
}): void {
  const canonicalUrl =
    opts.canonicalUrl ?? absoluteCanonicalUrl(window.location.pathname);

  document.title = opts.title;
  ensureCanonicalLink().setAttribute('href', canonicalUrl);

  setOrCreateMeta('meta[name="description"]', 'content', opts.description);
  setOrCreateMeta('meta[property="og:title"]', 'content', opts.title);
  setOrCreateMeta('meta[property="og:description"]', 'content', opts.description);
  setOrCreateMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setOrCreateMeta('meta[name="twitter:title"]', 'content', opts.title);
  setOrCreateMeta('meta[name="twitter:description"]', 'content', opts.description);
}

const LD_NS = 'writescholar-structured-data';

export function injectJsonLd(id: string, data: Record<string, unknown>): void {
  removeJsonLd(id);
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = `${LD_NS}-${id}`;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function removeJsonLd(id: string): void {
  const el = document.getElementById(`${LD_NS}-${id}`);
  if (el?.parentNode) {
    el.parentNode.removeChild(el);
  }
}
