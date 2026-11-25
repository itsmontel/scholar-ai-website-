// Drives Start an essay in Chrome: the blank-draft route, with outlines left, with none left (free and paid),
// and when the limit is only found at the last step. Needs the dev server on :5173. Run: node scripts/blank-draft-e2e.cjs
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const QUESTION = 'How does sleep affect memory in teenagers? Discuss with reference to two studies.';
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };

async function scenario(browser, { name, paid, plansLeft, planFails, run }) {
  const user = { id: 'u-blank', email: 's@example.com', name: 'Maya Lewis', first_name: 'Maya', subscription_plan: paid ? 'pro' : 'free', plan: paid ? 'pro' : 'free', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  const events = []; page.on('console', (m) => { const t = m.text(); const g = t.match(/^\[analytics\] (\w+)/); if (g) events.push(g[1]); });
  await page.setViewport({ width: 1440, height: 1100 });
  await page.evaluateOnNewDocument((u) => { localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-blank', '1'); try { localStorage.setItem('ws_promo_banner_dismissed', '1'); } catch {} }, user);
  await page.setRequestInterception(true);
  const seen = { uploads: [], titles: [] };
  let left = plansLeft;
  page.on('request', async (req) => {
    const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
    const p = url.split('/api')[1].split('?')[0];
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
    const ok = (data) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    const usage = () => ({ paid, plansUsed: (paid ? 100 : 2) - left, plansLimit: paid ? 100 : 2, plansLeft: left, helpsUsed: 0, helpsLimit: paid ? 500 : 10, helpsLeft: paid ? 500 : 10 });
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    if (p === '/auth/me') return ok({ user });
    if (p === '/writing/usage') return ok(usage());
    if (p === '/writing/plan') {
      if (planFails) { left = 0; return req.respond({ status: 429, contentType: 'application/json', headers, body: JSON.stringify({ success: false, message: paid ? 'You have built 100 outlines this period. More arrive when your plan renews.' : 'You have built 2 outlines this month, which is the free limit. Pro gives you 100.', upgrade: !paid, usage: usage() }) }); }
      left = Math.max(0, left - 1);
      return ok({ title: 'T', wordTarget: 1500, theses: [1, 2, 3].map((n) => ({ thesis: `Thesis number ${n} is long enough.`, why: 'Because.', outline: [{ heading: 'Introduction', goal: 'Intro.', words: 150 }, { heading: 'Body', goal: 'Body.', words: 400 }] })), usage: usage() });
    }
    if (p === '/documents/upload') { const body = req.postData() || ''; const m = body.match(/name="title"\r\n\r\n([^\r]*)/); seen.titles.push(m ? m[1] : ''); seen.uploads.push(1); return ok({ document: { id: 'doc-1' } }); }
    if (/^\/documents\/doc-1\/content/.test(p)) return ok({});
    if (p === '/documents' || p === '/documents/') return ok({ documents: [] });
    if (/usage/.test(p)) return ok({ plan: user.plan, credits: { plan: user.plan, allowance: 4, rollover: 0, total: 4, used: 0, remaining: 4, cap: 499, nextTopUp: 4, periodEnd: '2026-12-20', topUp: 0 } });
    return ok({});
  });
  const click = (re) => page.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button, a')].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && !x.disabled && x.getClientRects().length > 0); if (b) { b.click(); return true; } return false; }, re.source);
  const text = () => page.evaluate(() => document.body.innerText);
  const disabled = (re) => page.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button')].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && x.getClientRects().length > 0); return b ? b.disabled : null; }, re.source);
  await page.goto('http://localhost:5173/documents', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 150000 });
  for (let i = 0; i < 60 && !(await page.$('#essay-question')); i++) { await page.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar:switchWorkspaceView', { detail: 'write' }))); await wait(2000); }
  await page.type('#essay-question', QUESTION, { delay: 0 });
  await wait(900);
  console.log(`\n── ${name}`);
  await run({ page, click, text, disabled, seen, check, wait, errs, events });
  await page.close();
  check(`${name}: no page errors`, errs, []);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });

  await scenario(browser, { name: 'outlines left: a quiet link offers the blank draft', paid: false, plansLeft: 2, run: async ({ page, click, text, disabled, seen, wait, events }) => {
    const t = await text();
    check('the link is there', /Skip the outline: start with a blank draft/.test(t), true);
    check('no warning while outlines are left', /free outlines this month/.test(t), false);
    check('Start my essay is available', await disabled(/^Start my essay/), false);
    await click(/Skip the outline/); await wait(2500);
    check('blank_draft_started fires from the link', events.includes('blank_draft_started'), true);
    const fields = await page.evaluate(() => [...document.querySelectorAll('input, textarea')].map((i) => i.value));
    check('a document was created, titled from the question', [seen.uploads.length, fields.includes('How does sleep affect memory in teenagers')], [1, true]);
    check('the editor opened', !!(await page.$('.ProseMirror')), true);
    check('with no outline rail', (await text()).includes('Your outline'), false);
  } });

  await scenario(browser, { name: 'free account, no outlines left', paid: false, plansLeft: 0, run: async ({ page, click, text, disabled, seen, wait, events }) => {
    const t = await text();
    check('outline_limit_hit fires once when the notice shows', events.filter((e) => e === 'outline_limit_hit').length, 1);
    check('says the free outlines are used and Pro gives more', /You have used your 2 free outlines this month\. Pro gives you far more\./.test(t), true);
    check('offers the blank draft and Pro', /Start with a blank draft/.test(t) && /See Pro/.test(t), true);
    check('Start my essay is switched off', await disabled(/^Start my essay/), true);
    check('the quiet link is not shown twice', /Skip the outline/.test(t), false);
    await click(/^Start with a blank draft/); await wait(2500);
    check('opens a draft', [seen.uploads.length, !!(await page.$('.ProseMirror'))], [1, true]);
  } });

  await scenario(browser, { name: 'paid account, no outlines left', paid: true, plansLeft: 0, run: async ({ text, disabled, click }) => {
    const t = await text();
    check('says more arrive when the plan renews', /You have built all 100 outlines for this period\. More arrive when your plan renews\./.test(t), true);
    check('no See Pro button for a paid account', /See Pro/.test(t), false);
    check('still offers the blank draft', /Start with a blank draft/.test(t), true);
    check('Start my essay is switched off', await disabled(/^Start my essay/), true);
  } });

  await scenario(browser, { name: 'last outline used: the re-roll button explains itself', paid: false, plansLeft: 1, run: async ({ page, click, text, disabled, wait }) => {
    const heading = () => page.evaluate(() => (document.querySelector('h1') || {}).innerText || '');
    const tap = async (re, next) => { await click(re); for (let i = 0; i < 20 && !next.test(await heading()); i++) await wait(150); };
    await tap(/^Start my essay/, /kind/i); await tap(/^Argumentative/, /citation style/i); await tap(/^APA/, /words/i); await tap(/^1,500\s*words$/, /rubric/i);
    await click(/^Build my outline/); await wait(2500);
    const t = await text();
    check('an outline was built', /Pick the argument you want to make/.test(t), true);
    check('the re-roll button is switched off', await disabled(/^Show three different ones/), true);
    check('and says why', /No outlines left this month\. Pick one of these and start writing\./.test(t), true);
    check('Start writing still works', await disabled(/^Start writing/), false);
  } });

  await scenario(browser, { name: 'limit found only at the last step', paid: false, plansLeft: 1, planFails: true, run: async ({ page, click, text, seen, wait }) => {
    // Each tap waits for the next question to show, so a click never lands on the footer's "APA citation guide" link.
    await page.evaluate(() => sessionStorage.setItem('ws_first_grade_pending', '0'));
    const heading = () => page.evaluate(() => (document.querySelector('h1') || {}).innerText || '');
    const tap = async (re, nextHeading) => { const hit = await click(re); for (let i = 0; i < 20 && !nextHeading.test(await heading()); i++) await wait(150); console.log(`   tap ${re} -> clicked=${hit}, heading now: ${await heading()}`); };
    await tap(/^Start my essay/, /kind/i); await tap(/^Argumentative/, /citation style/i); await tap(/^APA/, /words/i); await tap(/^1,500\s*words$/, /rubric/i);
    await click(/^Build my outline/);
    for (const ms of [300, 900, 1500]) { await wait(ms === 300 ? 300 : 600); console.log(`   +${ms}ms url=${page.url()} h1="${await page.evaluate(() => (document.querySelector('h1') || {}).innerText)}" alerts=${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText.slice(0, 90))))}`); }
    await wait(1000);
    const t = await text();
    if (!/free limit/.test(t)) console.log('   alerts:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText))), 'heading:', await page.evaluate(() => (document.querySelector('h1') || {}).innerText));
    check('shows the limit message', /free limit/.test(t), true);
    check('the error offers a blank draft as well as See Pro', /Start with a blank draft/.test(t) && /See Pro/.test(t), true);
    await click(/^Start with a blank draft/); await wait(2500);
    check('and it opens a draft', [seen.uploads.length, !!(await page.$('.ProseMirror'))], [1, true]);
  } });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
