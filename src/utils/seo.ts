/**
 * Canonical URLs and primary meta tags — keep in sync with netlify.toml alias redirects.
 * Prefer https://writescholar.com, no trailing slash except homepage (/).
 */

export const SITE_ORIGIN = 'https://writescholar.com';

/** Social share image — single branded asset (`public/og-image.png`); used for all routes and blog posts. */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

function deriveOgImageAlt(title: string): string {
  const stripped = title.replace(/\s*\|\s*WriteScholar\s*$/i, '').trim();
  if (!stripped) return 'WriteScholar — AI essay feedback and study tools for students';
  return `${stripped} — WriteScholar`;
}

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
  '/study-pack': '/tools/study-pack',
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
 * Sets document title, meta description, canonical, Open Graph, and Twitter Card tags (including image + alt).
 */
export function applyPageSeoTags(opts: {
  title: string;
  description: string;
  /** Full URL; if omitted, derived from current location. */
  canonicalUrl?: string;
  /** Absolute image URL for og:image / twitter:image. Defaults to site OG asset. */
  ogImage?: string;
  /** Shown in link previews; defaults from title. */
  ogImageAlt?: string;
}): void {
  const canonicalUrl =
    opts.canonicalUrl ?? absoluteCanonicalUrl(window.location.pathname);

  const ogImage = opts.ogImage ?? DEFAULT_OG_IMAGE;
  const ogImageAlt = opts.ogImageAlt ?? deriveOgImageAlt(opts.title);

  document.title = opts.title;
  ensureCanonicalLink().setAttribute('href', canonicalUrl);

  setOrCreateMeta('meta[name="description"]', 'content', opts.description);
  setOrCreateMeta('meta[property="og:title"]', 'content', opts.title);
  setOrCreateMeta('meta[property="og:description"]', 'content', opts.description);
  setOrCreateMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setOrCreateMeta('meta[name="twitter:title"]', 'content', opts.title);
  setOrCreateMeta('meta[name="twitter:description"]', 'content', opts.description);

  setOrCreateMeta('meta[property="og:image"]', 'content', ogImage);
  setOrCreateMeta('meta[name="twitter:image"]', 'content', ogImage);
  setOrCreateMeta('meta[property="og:image:width"]', 'content', '1200');
  setOrCreateMeta('meta[property="og:image:height"]', 'content', '630');
  setOrCreateMeta('meta[property="og:image:alt"]', 'content', ogImageAlt);
  setOrCreateMeta('meta[name="twitter:image:alt"]', 'content', ogImageAlt);
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

/**
 * Tag the current route as `noindex, nofollow` so private routes (dashboard,
 * settings, account, etc.) are removed from Google's index even if they were
 * previously crawled. Idempotent — safe to call repeatedly.
 *
 * Pair with applyPageSeoTags(): set tags first, then call applyNoIndex() if
 * the route is private. The robots meta tag overrides the global "index,
 * follow" set in index.html.
 */
export function applyNoIndex(): void {
  setOrCreateMeta(
    'meta[name="robots"]',
    'content',
    'noindex, nofollow, noarchive, nosnippet'
  );
}

/**
 * Reset robots tag back to the indexable default. Call this when navigating
 * from a private route to a public one in the SPA so we don't accidentally
 * leave a noindex tag lingering.
 */
export function clearNoIndex(): void {
  setOrCreateMeta(
    'meta[name="robots"]',
    'content',
    'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
  );
}

/* ─── Schema.org JSON-LD helpers ───────────────────────────────────── */

export interface ProductSchemaInput {
  /** e.g. "AI Essay Checker" */
  name: string;
  /** Plain-text description (1-3 sentences). */
  description: string;
  /** Tool URL — e.g. https://writescholar.com/tools/analyze. Defaults to current canonical. */
  url?: string;
  /** Tool screenshot/og image URL. Defaults to site OG. */
  image?: string;
  /** "Free", "Freemium", or a $ amount. Defaults to Freemium. */
  priceLabel?: string;
  /** Star rating (e.g. 4.8). Optional. */
  ratingValue?: number;
  /** Review count. Required if ratingValue is set. */
  ratingCount?: number;
}

/**
 * Inject SoftwareApplication schema for a single tool page. Helps Google
 * show rich tool cards (name, rating, price) in search results.
 */
export function injectToolProductSchema(input: ProductSchemaInput): void {
  const url = input.url ?? absoluteCanonicalUrl(window.location.pathname);
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url,
    image,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WriteScholar',
      url: SITE_ORIGIN,
    },
  };
  if (input.ratingValue && input.ratingCount) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue,
      reviewCount: input.ratingCount,
    };
  }
  injectJsonLd('tool-product', data);
}

export interface ArticleSchemaInput {
  /** Post headline */
  title: string;
  /** Plain-text excerpt */
  description: string;
  /** ISO date — e.g. "2026-04-15" */
  datePublished: string;
  /** ISO date for last update; defaults to datePublished */
  dateModified?: string;
  /** Author name */
  author: string;
  /** Canonical URL of the post */
  url?: string;
  /** Hero image URL */
  image?: string;
}

/**
 * Inject Article schema for a single blog post. Required for Google News /
 * Discover eligibility and rich-result snippets.
 */
export function injectArticleSchema(input: ArticleSchemaInput): void {
  const url = input.url ?? absoluteCanonicalUrl(window.location.pathname);
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const dateModified = input.dateModified ?? input.datePublished;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    image: [image],
    datePublished: input.datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: input.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'WriteScholar',
      url: SITE_ORIGIN,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/main-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
  injectJsonLd('article', data);
}
