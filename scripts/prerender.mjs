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
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 34567;

const staticRoutes = [
  '/',
  '/features',
  '/essay-grader',
  '/pricing',
  '/about',
  '/why-students-choose',
  '/vs-quizlet-knowt',
  '/more-tools',
  '/focus-mode',
  '/blog',
  '/help',
  '/contact',
  '/press',
  '/privacy',
  '/terms',
  '/unsubscribe',
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

  // Word-count guides — slug is derived from the `words` field, matching
  // the wordCountGuidePage factory.
  const wordCountBlock = content.match(/const WORD_COUNT_GUIDES_META:[\s\S]*?(?=\nfunction wordCountGuidePage)/);
  if (wordCountBlock) {
    const counts = [...wordCountBlock[0].matchAll(/^\s*words:\s*(\d+),/gm)].map((m) => m[1]);
    counts.forEach((n) => programmaticPaths.push(`/guides/how-long-is-a-${n}-word-essay`));
  }

  // Best pages — type: 'best'
  const bestMatches = [...content.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'best'/g)];
  bestMatches.forEach((m) => programmaticPaths.push(`/best/${m[1]}`));

  // Top-level landing pages — type: 'landing', served at /[slug]
  const landingMatches = [...content.matchAll(/slug:\s*'([^']+)'[\s\S]{0,200}?type:\s*'landing'/g)];
  landingMatches.forEach((m) => programmaticPaths.push(`/${m[1]}`));

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
      // Without this, serve-handler would serve pages already prerendered
      // in this run (foo.html) instead of the fresh SPA shell.
      cleanUrls: false,
      rewrites: [{ source: '**', destination: '/index.html' }],
    });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Static server running on http://localhost:${PORT}`);

  // Netlify caches node_modules between builds but not ~/.cache, so the
  // Chrome that puppeteer downloads on install vanishes and every launch
  // failed silently. .puppeteerrc.cjs keeps the browser inside
  // node_modules/.cache; this makes sure it is there (a no-op once cached).
  if (process.env.NETLIFY) {
    execSync('npx puppeteer browsers install', { stdio: 'inherit' });
  }

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
    if (route.startsWith('/blog')) {
      // Blog data loads after first paint; the page's own h1 means it's in.
      await page.waitForSelector('#root h1', { timeout: 25000 });
    }
  }

  const wrongCanonical = [];
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

    // Auto-scroll to the bottom and back so every scroll-reveal block fires
    // and lazy media loads BEFORE we capture the DOM — otherwise the saved
    // HTML ships with below-fold sections stuck at opacity-0.
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += 600;
          window.scrollTo(0, y);
          if (y < document.documentElement.scrollHeight) {
            setTimeout(step, 40);
          } else {
            window.scrollTo(0, 0);
            resolve(undefined);
          }
        };
        step();
      });
    });

    await new Promise((r) => setTimeout(r, 800));

    let html = await page.content();
    html = html.replace(/http:\/\/localhost:\d+/g, 'https://writescholar.com');

    // index.html's <noscript> fallback describes the homepage. Every other
    // route now ships its own rendered content, so drop it there.
    if (route !== '/') {
      html = html.replace(/<noscript>\s*<h1>[\s\S]*?<\/noscript>/, '');
    }

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (route !== '/' && canonical === 'https://writescholar.com/') {
      wrongCanonical.push(route);
    }

    // Homepage replaces Vite's dist/index.html. Other routes go to
    // dist/<route>.html: Netlify serves that at /<route> as-is, whereas a
    // dist/<route>/index.html gets 301'd to /<route>/, which contradicts the
    // slashless canonical URL.
    const outputPath = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route}.html`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    await page.close();
    console.log(`  ✅ Saved: ${route}`);
  }

  await browser.close();
  server.close();
  console.log(`\nPrerendered ${allRoutes.length} pages!`);
  if (wrongCanonical.length) {
    console.warn(`⚠️ ${wrongCanonical.length} routes still point their canonical at the homepage: ${wrongCanonical.join(', ')}`);
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err.message);
  // Without prerendered HTML every URL serves the homepage shell, whose
  // canonical tells Google each page is a copy of the homepage. That shipped
  // silently for months, so on Netlify a failure now fails the deploy (the
  // previous deploy stays live). Set PRERENDER_OPTIONAL=1 to ship anyway.
  if (process.env.NETLIFY && !process.env.PRERENDER_OPTIONAL) {
    process.exit(1);
  }
  console.warn('Build will continue. Deploying SPA without prerendered HTML. Fix Puppeteer/Chrome to enable prerendering.');
  process.exit(0);
});
