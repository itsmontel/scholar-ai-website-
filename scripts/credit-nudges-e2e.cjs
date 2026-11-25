// Checks the low-credit strip, the cost line, the out-of-credits choice and the Premium card in Chrome.
// Needs the dev server on :5173. Run: node scripts/credit-nudges-e2e.cjs  (screenshots go to $SHOTS or the OS temp folder)
const path = require('path'); const os = require('os');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const SHOTS = process.env.SHOTS || os.tmpdir();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };

async function open(browser, { plan = 'free', remaining, topUpMonths = 0, route = '/dashboard' }) {
  const paid0 = plan !== 'free';
  const user = { id: 'u-n', email: 's@example.com', name: 'Maya', first_name: 'Maya', subscription_plan: plan, subscriptionPlan: plan, subscriptionStatus: paid0 ? 'active' : 'free', plan, email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
  const paid = plan !== 'free';
  const credits = { plan, isTrial: false, isPaused: false, cancelAtPeriodEnd: false, allowance: paid ? 99 : 4, rollover: 0, total: paid ? 99 : 4, used: 0, remaining, cap: 499, nextTopUp: 0, wouldLoseAtRenewal: 0, periodEnd: '2026-12-20T00:00:00Z', daysUntilReset: 25, trialCredits: 3, trialDays: 3, freeCredits: paid ? 0 : 4, freeCreditDays: 0, freeResetsAt: '2026-12-20T00:00:00Z', freeExpiresAt: null, freeDaysLeft: null, freeExpired: false, topUp: 0, topUpExpiresAt: null, topUpMonths, analysisCost: 2 };
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  const events = []; page.on('console', (m) => { const g = m.text().match(/^\[analytics\] (\w+)/); if (g) events.push(g[1]); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.evaluateOnNewDocument((u) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.removeItem('ws_credit_strip_hidden'); localStorage.removeItem('ws_premium_card_hidden'); } localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-n', '1'); localStorage.setItem('ws_promo_banner_dismissed', '1'); }, user);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
    const p = url.split('/api')[1].split('?')[0];
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    const ok = (data, extra = {}) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data, ...extra }) });
    if (p === '/auth/me') return ok({ user });
    if (p === '/subscriptions/usage') return req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ plan, credits, analysesRemaining: remaining, daysUntilReset: 25 }) });
    return ok({ documents: [], packs: [] });
  });
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 300, { timeout: 150000 });
  await page.waitForFunction(() => document.querySelector('[role=status]') || document.body.innerText.includes('Maya'), { timeout: 20000 }).catch(() => {});
  await wait(3500);
  return { page, errs, events };
}
const text = (page) => page.evaluate(() => document.body.innerText);
const click = (page, re) => page.evaluate((s) => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button')].find((x) => r.test((x.textContent || x.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')) && x.getClientRects().length); if (b) { b.click(); return true; } return false; }, re.source);

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });

  { console.log('\n── Free account, 3 credits');
    const { page, errs } = await open(browser, { remaining: 3 });
    const t = await text(page);
    check('the strip shows the balance and the real costs', [/3 credits left this month/.test(t), /An essay grade uses 2, a study pack 1/.test(t), /(Dec 2[01]|2[01] Dec|Dec 19|19 Dec)/.test(t)], [true, true, true]);
    check('offers Go Pro with the first-month price, and Top up', [/Go Pro, \$9\.99 first month/.test(t), await click(page, /^Top up$/)], [true, true]);
    await wait(500);
    const t2 = await text(page);
    check('Top up opens the choice with a top-up, Pro and Premium', [/Buy 25 credits/.test(t2), /Go Pro/.test(t2), /Go Premium/.test(t2), /come back on (Dec 19|Dec 20|Dec 21|19 Dec|20 Dec|21 Dec)/i.test(t2)], [true, true, true, true]);
    await page.screenshot({ path: path.join(SHOTS, 'nudge-choice-free.png') });
    await page.keyboard.press('Escape'); await wait(300);
    await click(page, /Hide for today/); await wait(300);
    check('closing the strip hides it', /credits left this month/.test(await text(page)), false);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => document.body.innerText.length > 300); await wait(2500);
    check('and it stays hidden for the day', /credits left this month/.test(await text(page)), false);
    check('no page errors (free, 3)', errs, []); await page.close(); }

  { console.log('\n── Free account, plenty of credits');
    const { page } = await open(browser, { remaining: 4 });
    check('no strip at 4 credits', /credits left this month|out of credits/i.test(await text(page)), false); await page.close(); }

  { console.log('\n── Pro account, 2 credits left');
    const { page } = await open(browser, { plan: 'pro', remaining: 2 });
    const t = await text(page);
    check('the strip says Premium gives 199 instead of 99, and offers it', [/2 credits left/.test(t), /Premium gives you 199 a month instead of 99/.test(t), /See Premium/.test(t)], [true, true, true]);
    await page.screenshot({ path: path.join(SHOTS, 'nudge-strip-pro.png') }); await page.close(); }

  { console.log('\n── Billing: Pro that topped up two months running');
    const { page } = await open(browser, { plan: 'pro', remaining: 50, topUpMonths: 2, route: '/billing' });
    const t = await text(page);
    check('shows the Premium comparison with real numbers', [/You bought extra credits two months running/.test(t), /199 credits a month, 100 more than Pro, for \$20\.00 more/.test(t)], [true, true]);
    await page.screenshot({ path: path.join(SHOTS, 'nudge-premium-card.png') });
    await click(page, /^Keep Pro$/); await wait(300);
    check('Keep Pro hides it', /two months running/.test(await text(page)), false); await page.close(); }
  { const { page } = await open(browser, { plan: 'pro', remaining: 50, topUpMonths: 1, route: '/billing' });
    check('one month of top-ups is not enough to show it', /two months running/.test(await text(page)), false); await page.close(); }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
