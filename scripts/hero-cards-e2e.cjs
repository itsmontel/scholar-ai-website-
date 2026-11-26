// The landing hero's two cards, and the first dashboard screen after sign-up. Needs the dev server on :5173.
// Run: node scripts/hero-cards-e2e.cjs  (screenshots go to $SHOTS or the OS temp folder)
const path = require('path'); const os = require('os');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const SHOTS = process.env.SHOTS || os.tmpdir();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };

async function page(browser, { width = 1440, signedIn = false, route = '/', seed = {} }) {
  const p = await browser.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.setViewport({ width, height: 1000 });
  const user = { id: 'u-h', email: 's@example.com', name: 'Maya', first_name: 'Maya', subscription_plan: 'free', subscriptionPlan: 'free', plan: 'free', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
  await p.evaluateOnNewDocument((s, u, sd) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); if (s) { localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-h', '1'); localStorage.setItem('ws_promo_banner_dismissed', '1'); } for (const [k, v] of Object.entries(sd)) localStorage.setItem(k, v); }, signedIn, user, seed);
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
    const pth = url.split('/api')[1].split('?')[0];
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    const ok = (data) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    if (pth === '/auth/me') return ok({ user });
    if (pth === '/writing/usage') return ok({ paid: false, plansUsed: 0, plansLimit: 2, plansLeft: 2, helpsUsed: 0, helpsLimit: 10, helpsLeft: 10 });
    return ok({ documents: [], packs: [] });
  });
  await p.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForFunction(() => document.body.innerText.length > 300, { timeout: 150000 });
  await p.addStyleTag({ content: '*{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}' }).catch(() => {});
  await wait(1500);
  return { p, errs };
}
const clickText = (p, re) => p.evaluate((s) => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button')].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && x.getClientRects().length); if (b) { b.click(); return true; } return false; }, re.source);
const store = (p) => p.evaluate(() => ({ door: localStorage.getItem('ws_door'), view: sessionStorage.getItem('writescholar_ws_pending_view') }));

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });

  { console.log('\n── Hero, desktop');
    const { p, errs } = await page(browser, {});
    const t = await p.evaluate(() => document.body.innerText);
    check('two cards, no box', [/I have an essay/.test(t), /I have an exam/.test(t), !!(await p.$('#hero-ask'))], [true, true, false]);
    await p.screenshot({ path: path.join(SHOTS, 'hero-cards-desktop.png') });
    await clickText(p, /^Write or grade my essay/); await wait(900);
    const s = await store(p);
    check('essay card goes to sign-up and remembers the essay door', [/\/signup/.test(p.url()), s.door], [true, 'essay']);
    check('no page errors', errs, []); await p.close(); }
  { const { p } = await page(browser, {});
    await clickText(p, /^Study for my exam/); await wait(900);
    check('exam card goes to sign-up and remembers the exam door', [/\/signup/.test(p.url()), (await store(p)).door], [true, 'exam']); await p.close(); }
  { const { p } = await page(browser, {});
    await p.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar-hero-ask', { detail: { ask: 'write' } }))); await wait(900);
    check('a button further down the page goes to sign-up too', /\/signup/.test(p.url()), true); await p.close(); }
  { const { p } = await page(browser, { signedIn: true });
    await clickText(p, /^Study for my exam/); await wait(1200);
    check('signed in: straight to the dashboard', /\/dashboard/.test(p.url()), true); await p.close(); }

  { console.log('\n── Hero, phone');
    const { p, errs } = await page(browser, { width: 390 });
    const o = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    check('no sideways scroll, both cards visible', [o, /I have an essay/.test(await p.evaluate(() => document.body.innerText)), /I have an exam/.test(await p.evaluate(() => document.body.innerText))], [false, true, true]);
    await p.screenshot({ path: path.join(SHOTS, 'hero-cards-phone.png') });
    check('no page errors (phone)', errs, []); await p.close(); }

  { console.log('\n── After sign-up: the first dashboard screen');
    const { p, errs } = await page(browser, { signedIn: true, route: '/dashboard', seed: { ws_door: 'essay' } });
    await p.waitForFunction(() => /where are you with your essay/i.test(document.body.innerText), { timeout: 20000 }).catch(() => {});
    const t = await p.evaluate(() => document.body.innerText);
    check('essay door: where are you with your essay, with both ways in', [/where are you with your essay/i.test(t), /I have not started/.test(t), /I have a draft/.test(t)], [true, true, true]);
    await p.screenshot({ path: path.join(SHOTS, 'first-screen-essay.png') });
    check('no page errors (essay home)', errs, []); await p.close(); }
  { const { p, errs } = await page(browser, { signedIn: true, route: '/dashboard', seed: { ws_door: 'exam' } });
    await p.waitForFunction(() => /what are we studying/i.test(document.body.innerText), { timeout: 20000 }).catch(() => {});
    const t = await p.evaluate(() => document.body.innerText);
    check('exam door: the study pack box leads', [/what are we studying/i.test(t), /Make my study pack/.test(t)], [true, true]);
    await p.screenshot({ path: path.join(SHOTS, 'first-screen-exam.png') });
    check('no page errors (exam home)', errs, []); await p.close(); }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
