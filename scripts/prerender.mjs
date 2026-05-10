/**
 * Build-time prerendering script for WriteScholar
 * Runs after `vite build`, uses Puppeteer to visit each route
 * and save the fully-rendered HTML to dist/
 */
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import handler from 'serve-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 34567;

const staticRoutes = [
  '/',
  '/features',
  '/pricing',
  '/about',
  '/why-students-choose',
  '/vs-quizlet-knowt',
  '/more-tools',
  '/focus-mode',
  '/blog',
  '/help',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/signup',
  // AI tools (essay analyzer first)
  '/tools/analyze',
  '/tools/citations',
  '/tools/study-pack',
  '/tools/summarizer',
  '/tools/quiz-generator',
  '/tools/create-flashcards',
  // Free tools
  '/tools/word-counter',
  '/tools/citation-generator',
  '/tools/grammar-checker',
  '/tools/readability-score',
  '/tools/thesis-generator',
  '/tools/essay-outline',
  '/tools/text-case-converter',
  '/tools/paraphrasing-tips',
  '/tools/gpa-calculator',
  '/tools/pomodoro-timer',
  '/tools/calculator',
  '/tools/converter',
  '/tools/crater-blast',
];

let blogSlugs = [];
try {
  const blogDataPath = path.resolve(__dirname, '../src/data/blogPosts.ts');
  const content = fs.readFileSync(blogDataPath, 'utf-8');
  const slugMatches = [...content.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
  blogSlugs = slugMatches.map((m) => m[1]);
  console.log(`Found ${blogSlugs.length} blog slugs`);
} catch (e) {
  console.warn('Could not auto-detect blog slugs:', e.message);
}

const blogRoutes = blogSlugs.map((s) => `/blog/${s}`);

/* Programmatic SEO pages — /study/[slug], /alternatives/[slug], /guides/[slug],
   /best/[slug]. Read directly from src/data/programmaticPages.ts so adding a
   new programmatic page automatically prerenders it on next build. */
let programmaticPaths = [];
try {
  const progDataPath = path.resolve(__dirname, '../src/data/programmaticPages.ts');
  const content = fs.readFileSync(progDataPath, 'utf-8');

  // Subjects (in SUBJECTS array)
  const subjectBlock = content.match(/const SUBJECTS:[\s\S]*?\];/);
  if (subjectBlock) {
    const slugs = [...subjectBlock[0].matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
    slugs.forEach((s) => programmaticPaths.push(`/study/${s}`));
  }

  // Alternative pages — type: 'alternative'
  const altMatches = [...content.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'alternative'/g)];
  altMatches.forEach((m) => programmaticPaths.push(`/alternatives/${m[1]}`));

  // Guide pages — slugs starting with 'how-to-'
  const guideBlock = content.match(/const ESSAY_GUIDES_META:[\s\S]*?(?=\nfunction essayGuidePage)/);
  if (guideBlock) {
    const slugs = [...guideBlock[0].matchAll(/slug:\s*'(how-to-[^']+)'/g)].map((m) => m[1]);
    slugs.forEach((s) => programmaticPaths.push(`/guides/${s}`));
  }

  // Best pages — type: 'best'
  const bestMatches = [...content.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'best'/g)];
  bestMatches.forEach((m) => programmaticPaths.push(`/best/${m[1]}`));

  console.log(`Found ${programmaticPaths.length} programmatic SEO pages`);
} catch (e) {
  console.warn('Could not auto-detect programmatic pages:', e.message);
}

// Process root last so we never serve prerendered homepage when capturing other routes
const allRoutes = [...staticRoutes.filter((r) => r !== '/'), ...blogRoutes, ...programmaticPaths, '/'];

async function prerender() {
  const server = createServer((req, res) => {
    return handler(req, res, {
      public: DIST,
      rewrites: [{ source: '**', destination: '/index.html' }],
    });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Static server running on http://localhost:${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    // Fallback: try system Chrome on macOS (e.g. when Puppeteer's Chromium is corrupted)
    const isMac = process.platform === 'darwin';
    const chromePath = isMac
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : null;
    if (chromePath) {
      if (fs.existsSync(chromePath)) {
        browser = await puppeteer.launch({
          headless: 'new',
          executablePath: chromePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }

  async function waitForRouteContent(page, route) {
    if (route === '/blog') {
      await page.waitForSelector('section[aria-label="Blog posts"] article', { timeout: 25000 });
      return;
    }
    if (route.startsWith('/blog/')) {
      await page.waitForSelector('article h1', { timeout: 25000 });
    }
  }

  for (const route of allRoutes) {
    const url = `http://localhost:${PORT}${route}`;
    console.log(`Prerendering: ${route}`);

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    try {
      await waitForRouteContent(page, route);
    } catch (e) {
      console.warn(`  ⚠️ Content wait for ${route}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 800));

    let html = await page.content();
    html = html.replace(/http:\/\/localhost:\d+/g, 'https://writescholar.com');

    // Homepage: replace Vite's dist/index.html with prerendered HTML. Other routes: write to dist/<route>/index.html
    const outputPath = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html');
    if (route !== '/') fs.mkdirSync(path.join(DIST, route), { recursive: true });
    fs.writeFileSync(outputPath, html);

    await page.close();
    console.log(`  ✅ Saved: ${route}`);
  }

  await browser.close();
  server.close();
  console.log(`\nPrerendered ${allRoutes.length} pages!`);
}

prerender().catch((err) => {
  console.error('Prerender failed:', err.message);
  console.warn('Build will continue. Deploying SPA without prerendered HTML. Fix Puppeteer/Chrome to enable prerendering.');
  process.exit(0);
});
