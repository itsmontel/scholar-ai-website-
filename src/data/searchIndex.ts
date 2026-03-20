/**
 * Search index for header search - tools, pages, and blog posts.
 * Each item has: page id, optional slug (for blog), label, and keywords for matching.
 */

import { blogPostList } from './blogPosts';

export interface SearchItem {
  page: string;
  slug?: string;
  label: string;
  keywords: string[];
}

const TOOL_ITEMS: SearchItem[] = [
  { page: 'quiz-generator', label: 'Quiz Generator', keywords: ['quiz', 'quizzes', 'practice', 'test', 'questions'] },
  { page: 'create-flashcards', label: 'Flashcards', keywords: ['flashcard', 'flashcards', 'cards', 'study cards'] },
  { page: 'dashboard', label: 'Study Pack (Quiz, Crossword)', keywords: ['crossword', 'crosswords', 'puzzle', 'study pack'] },
  { page: 'summarizer', label: 'Summarizer', keywords: ['summarize', 'summarizer', 'summary', 'tldr'] },
  { page: 'analyze', label: 'Essay Analyzer', keywords: ['analyze', 'analysis', 'essay', 'feedback'] },
  { page: 'citations', label: 'Citation Finder', keywords: ['citation', 'citations', 'sources', 'apa', 'mla', 'references'] },
  { page: 'word-counter', label: 'Word Counter', keywords: ['word count', 'word counter', 'characters'] },
  { page: 'citation-generator-tool', label: 'Citation Generator', keywords: ['citation generator', 'citation', 'apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver', 'format', 'bibliography', 'references', 'cite'] },
  { page: 'grammar-checker', label: 'Grammar Checker', keywords: ['grammar', 'spell', 'spelling'] },
  { page: 'thesis-generator', label: 'Thesis Generator', keywords: ['thesis', 'thesis statement'] },
  { page: 'essay-outline', label: 'Essay Outline', keywords: ['outline', 'essay outline'] },
  { page: 'readability-score', label: 'Readability Score', keywords: ['readability', 'flesch'] },
  { page: 'paraphrasing-tips', label: 'Paraphrasing Tips', keywords: ['paraphrase', 'paraphrasing'] },
  { page: 'gpa-calculator', label: 'GPA Calculator', keywords: ['gpa', 'grade', 'calculator'] },
  { page: 'crater-blast', label: 'Crater Blast', keywords: ['crater blast', 'game', 'quiz game'] },
  { page: 'more-tools', label: 'More Tools', keywords: ['tools', 'all tools'] },
];

const PAGE_ITEMS: SearchItem[] = [
  { page: 'features', label: 'Features', keywords: ['features', 'what we offer'] },
  { page: 'focus-mode', label: 'Focus Mode', keywords: ['focus mode', 'block websites', 'earn screen time', 'block distracting sites', 'study before social media', 'block youtube', 'block tiktok'] },
  { page: 'pricing', label: 'Pricing', keywords: ['pricing', 'price', 'plans', 'subscription'] },
  { page: 'about', label: 'About', keywords: ['about', 'who we are'] },
  { page: 'blog', label: 'Blog', keywords: ['blog', 'articles'] },
  { page: 'help', label: 'Help Center', keywords: ['help', 'faq', 'support'] },
  { page: 'contact', label: 'Contact', keywords: ['contact', 'support'] },
  { page: 'why-students-choose', label: 'Why Students Choose', keywords: ['why', 'students', 'choose'] },
  { page: 'study-tools-comparison', label: 'vs Quizlet & Knowt', keywords: ['quizlet', 'knowt', 'comparison'] },
];

function getBlogSearchItems(): SearchItem[] {
  return blogPostList.map((post) => ({
    page: 'blog-post',
    slug: post.slug,
    label: post.title,
    keywords: [post.title, post.description, ...post.title.toLowerCase().split(/\s+/), ...post.description.toLowerCase().split(/\s+/)].filter(Boolean),
  }));
}

const ALL_ITEMS = [...TOOL_ITEMS, ...PAGE_ITEMS, ...getBlogSearchItems()];

function itemMatchesQuery(item: SearchItem, q: string): boolean {
  const labelLower = item.label.toLowerCase();
  if (labelLower === q || labelLower.startsWith(q) || labelLower.includes(q)) return true;
  if (item.keywords.some((kw) => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase()))) return true;
  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length > 0 && words.every((w) => labelLower.includes(w))) return true;
  return false;
}

export function searchSite(query: string): SearchItem | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const matches = searchSiteMultiple(query);
  return matches.length > 0 ? matches[0] : null;
}

/** Returns all matching items for dropdown, max 8 results. */
export function searchSiteMultiple(query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches: SearchItem[] = [];
  const seen = new Set<string>();

  // Exact and starts-with first
  for (const item of ALL_ITEMS) {
    if (seen.has(item.page + (item.slug || ''))) continue;
    const labelLower = item.label.toLowerCase();
    if (labelLower === q || labelLower.startsWith(q)) {
      matches.push(item);
      seen.add(item.page + (item.slug || ''));
    }
  }
  // Contains
  for (const item of ALL_ITEMS) {
    if (seen.has(item.page + (item.slug || ''))) continue;
    if (item.label.toLowerCase().includes(q)) {
      matches.push(item);
      seen.add(item.page + (item.slug || ''));
    }
  }
  // Keyword match
  for (const item of ALL_ITEMS) {
    if (seen.has(item.page + (item.slug || ''))) continue;
    if (itemMatchesQuery(item, q)) {
      matches.push(item);
      seen.add(item.page + (item.slug || ''));
    }
  }

  return matches.slice(0, 8);
}
