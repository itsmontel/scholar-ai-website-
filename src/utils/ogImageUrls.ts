import { ogRoutes } from '../data/ogRoutes';
import { DEFAULT_OG_IMAGE, SITE_ORIGIN } from './seo';

const pageKeyToUrl = new Map<string, string>(
  ogRoutes.map((r) => [r.pageKey, `${SITE_ORIGIN}/og/${r.file}.png`])
);

/** Absolute OG image URL for a `currentPage` key in CompleteAcademicAIApp. */
export function ogImageUrlForPage(pageKey: string): string {
  return pageKeyToUrl.get(pageKey) ?? DEFAULT_OG_IMAGE;
}

/** Per-post OG image (generated as /public/og/blog-{slug}.png). */
export function ogImageUrlForBlogPost(slug: string): string {
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return DEFAULT_OG_IMAGE;
  }
  return `${SITE_ORIGIN}/og/blog-${slug}.png`;
}
