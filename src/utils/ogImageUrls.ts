import { DEFAULT_OG_IMAGE } from './seo';

/** Absolute OG image URL for a `currentPage` key in CompleteAcademicAIApp. */
export function ogImageUrlForPage(_pageKey: string): string {
  return DEFAULT_OG_IMAGE;
}

/** Blog posts use the same site-wide share image as all other pages. */
export function ogImageUrlForBlogPost(_slug: string): string {
  return DEFAULT_OG_IMAGE;
}
