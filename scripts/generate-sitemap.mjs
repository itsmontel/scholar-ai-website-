/**
 * Build-time sitemap generator.
 *
 * Reads `src/data/blogPosts.ts` for the canonical list of blog slugs +
 * publish dates, then writes a fresh `public/sitemap.xml` containing all
 * static routes + every blog post. This keeps the sitemap from drifting
 * out of sync whenever new posts are added.
 *
 * Wire into package.json `build` script BEFORE `vite build` so the
 * regenerated sitemap is copied into `dist/` by Vite's public-asset step.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BLOG_DATA_PATH = path.join(REPO_ROOT, 'src/data/blogPosts.ts');
const SITEMAP_OUT = path.join(REPO_ROOT, 'public/sitemap.xml');
const ORIGIN = 'https://writescholar.com';

// Today in ISO yyyy-mm-dd — used for routes that don't have an explicit
// lastmod (homepage, tools etc. — they change frequently with shipping).
const today = new Date().toISOString().slice(0, 10);

/* ─── Static routes ─────────────────────────────────────────── */
// Each route includes priority and changefreq (Google ignores both, but
// other crawlers like Bing still use them).
const staticRoutes = [
  { loc: '/',                                 priority: '1.0',  changefreq: 'weekly',  lastmod: today },
  { loc: '/features',                         priority: '0.9',  changefreq: 'monthly', lastmod: today },
  { loc: '/ai-essay-editor',                  priority: '0.97', changefreq: 'weekly',  lastmod: today },
  { loc: '/pricing',                          priority: '0.9',  changefreq: 'monthly', lastmod: today },
  { loc: '/about',                            priority: '0.6',  changefreq: 'monthly', lastmod: today },
  { loc: '/why-students-choose',              priority: '0.7',  changefreq: 'monthly', lastmod: today },
  { loc: '/vs-quizlet-knowt',                 priority: '0.9',  changefreq: 'weekly',  lastmod: today },
  { loc: '/more-tools',                       priority: '0.8',  changefreq: 'monthly', lastmod: today },
  { loc: '/help',                             priority: '0.7',  changefreq: 'monthly', lastmod: today },
  { loc: '/contact',                          priority: '0.5',  changefreq: 'monthly', lastmod: today },
  { loc: '/press',                            priority: '0.5',  changefreq: 'monthly', lastmod: today },
  { loc: '/focus-mode',                       priority: '0.9',  changefreq: 'weekly',  lastmod: today },
  { loc: '/blog',                             priority: '0.8',  changefreq: 'weekly',  lastmod: today },

  // AI tools
  { loc: '/tools/analyze',                    priority: '0.95', changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/citations',                  priority: '0.9',  changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/study-pack',                 priority: '0.92', changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/summarizer',                 priority: '0.9',  changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/quiz-generator',             priority: '0.95', changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/create-flashcards',          priority: '0.95', changefreq: 'weekly',  lastmod: today },

  // Free tools (high SEO value)
  { loc: '/tools/word-counter',               priority: '0.8',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/citation-generator',         priority: '0.85', changefreq: 'weekly',  lastmod: today },
  { loc: '/tools/grammar-checker',            priority: '0.85', changefreq: 'monthly', lastmod: today },
  { loc: '/tools/readability-score',          priority: '0.8',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/thesis-generator',           priority: '0.85', changefreq: 'monthly', lastmod: today },
  { loc: '/tools/essay-outline',              priority: '0.85', changefreq: 'monthly', lastmod: today },
  { loc: '/tools/text-case-converter',        priority: '0.7',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/paraphrasing-tips',          priority: '0.8',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/gpa-calculator',             priority: '0.85', changefreq: 'monthly', lastmod: today },
  { loc: '/tools/pomodoro-timer',             priority: '0.8',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/calculator',                 priority: '0.7',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/converter',                  priority: '0.7',  changefreq: 'monthly', lastmod: today },
  { loc: '/tools/crater-blast',               priority: '0.6',  changefreq: 'monthly', lastmod: today },

  // Legal — low priority, rarely changes
  { loc: '/privacy',                          priority: '0.3',  changefreq: 'yearly',  lastmod: '2026-01-01' },
  { loc: '/terms',                            priority: '0.3',  changefreq: 'yearly',  lastmod: '2026-01-01' },
];

/* ─── Read blog posts ─────────────────────────────────────────── */
function readBlogPosts() {
  const src = fs.readFileSync(BLOG_DATA_PATH, 'utf-8');
  // Match every BlogPostMeta object — extract slug + date pair from each.
  // The regex tolerates property order shuffling and whitespace.
  const slugDateRe = /\{\s*slug:\s*'([^']+)'[\s\S]*?date:\s*'([^']+)'/g;
  const posts = [];
  let m;
  while ((m = slugDateRe.exec(src)) !== null) {
    posts.push({ slug: m[1], date: m[2] });
  }
  return posts;
}

/* ─── Read programmatic SEO pages ─────────────────────────────── */
const PROGRAMMATIC_DATA_PATH = path.join(REPO_ROOT, 'src/data/programmaticPages.ts');

function readProgrammaticPages() {
  const src = fs.readFileSync(PROGRAMMATIC_DATA_PATH, 'utf-8');
  const pages = [];

  // Subject pages (built from SUBJECTS array). Match `slug: 'X', name: 'Y'`.
  // We just need the slug for the URL — type is inferred from being in SUBJECTS block.
  const subjectMatch = src.match(/const SUBJECTS:[\s\S]*?\];/);
  if (subjectMatch) {
    const slugs = [...subjectMatch[0].matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
    slugs.forEach((slug) => pages.push({ path: `/study/${slug}` }));
  }

  // Alternative pages — find ProgrammaticPageConfig objects with type: 'alternative'
  const altMatches = [...src.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'alternative'/g)];
  altMatches.forEach((m) => pages.push({ path: `/alternatives/${m[1]}` }));

  // Guide pages — read from ESSAY_GUIDES_META array
  const guideMatch = src.match(/const ESSAY_GUIDES_META:[\s\S]*?(?=\nfunction essayGuidePage)/);
  if (guideMatch) {
    const slugs = [...guideMatch[0].matchAll(/slug:\s*'(how-to-[^']+)'/g)].map((m) => m[1]);
    slugs.forEach((slug) => pages.push({ path: `/guides/${slug}` }));
  }

  // Best pages — find configs with type: 'best'
  const bestMatches = [...src.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'best'/g)];
  bestMatches.forEach((m) => pages.push({ path: `/best/${m[1]}` }));

  return pages;
}

/* ─── Build XML ───────────────────────────────────────────────── */
function urlEntry({ loc, priority, changefreq, lastmod }) {
  return `  <url><loc>${ORIGIN}${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>`;
}

function buildSitemap() {
  const blogPosts = readBlogPosts();
  console.log(`Found ${blogPosts.length} blog posts`);

  const programmaticPages = readProgrammaticPages();
  console.log(`Found ${programmaticPages.length} programmatic SEO pages`);

  const blogRoutes = blogPosts.map(({ slug, date }) => ({
    loc: `/blog/${slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: date,
  }));

  // Programmatic pages — moderate priority, weekly changefreq (we tweak content
  // on these pages as we improve them; "weekly" hints to Bing to recrawl).
  const programmaticRoutes = programmaticPages.map(({ path }) => ({
    loc: path,
    priority: '0.75',
    changefreq: 'weekly',
    lastmod: today,
  }));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <!-- Auto-generated by scripts/generate-sitemap.mjs from src/data/blogPosts.ts',
    '       and src/data/programmaticPages.ts. Do not edit by hand. -->',
    '  <!-- Main + Tool routes -->',
    ...staticRoutes
      .filter((r) => !r.loc.startsWith('/blog/') && r.loc !== '/privacy' && r.loc !== '/terms')
      .map(urlEntry),
    '',
    '  <!-- Blog posts (auto-synced from src/data/blogPosts.ts) -->',
    ...blogRoutes.map(urlEntry),
    '',
    '  <!-- Programmatic SEO pages (auto-synced from src/data/programmaticPages.ts) -->',
    ...programmaticRoutes.map(urlEntry),
    '',
    '  <!-- Legal -->',
    ...staticRoutes.filter((r) => r.loc === '/privacy' || r.loc === '/terms').map(urlEntry),
    '</urlset>',
    '',
  ];

  fs.writeFileSync(SITEMAP_OUT, lines.join('\n'));
  console.log(`✅ Wrote ${SITEMAP_OUT} with ${staticRoutes.length + blogRoutes.length + programmaticRoutes.length} URLs`);
}

buildSitemap();
