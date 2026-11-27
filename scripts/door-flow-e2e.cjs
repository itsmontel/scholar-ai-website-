// Drives the landing pop-up behind "Start my essay", "Make my pack" and "Grade my essay" in Chrome,
// then checks the answers reach the app. Needs the dev server on :5173. Run: node scripts/door-flow-e2e.cjs
// Screenshots go to $SHOTS or the OS temp folder.
const path = require('path');
const os = require('os');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const SHOTS = process.env.SHOTS || os.tmpdir();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };
const ESSAY = Array.from({ length: 6 }, (_, i) => `Paragraph ${i + 1}. The Treaty of Versailles was harsh, but historians argue about how harsh it really was. Germany lost territory, paid reparations and accepted blame under Article 231. However, critics argue that the terms were no worse than those Germany imposed on Russia, and therefore the treaty should be judged against its time. Evidence from the period shows both views have support.`).join('\n\n');

async function landing(browser, { width = 1440, signedIn = false } = {}) {
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  const nav = [];
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument((s) => { try { localStorage.clear(); sessionStorage.clear(); if (s) { localStorage.setItem('authToken', 't'); localStorage.setItem('user', JSON.stringify({ id: 'u1', email: 'a@example.com', email_verified: true, onboarding_completed: true })); } } catch {} }, signedIn);
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes('/auth/google')) { nav.push('google'); return r.respond({ status: 200, contentType: 'text/html', body: '<p>google</p>' }); }
    if (u.includes('localhost:3001')) return r.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"success":true,"data":{}}' });
    r.continue();
  });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#hero-ask', { timeout: 150000 });
  await page.addStyleTag({ content: '*{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}' }).catch(() => {});
  await wait(800);
  return { page, errs, nav };
}
const dialogText = (page) => page.evaluate(() => { const d = document.querySelector('[aria-labelledby="door-flow-title"]'); return d ? d.innerText : ''; });
const clickIn = (page, re) => page.evaluate((s) => { const d = document.querySelector('[aria-labelledby="door-flow-title"]'); const r = new RegExp(s, 'i'); const b = [...d.querySelectorAll('button')].find((x) => r.test((x.textContent.trim() || x.getAttribute('aria-label') || '').replace(/\s+/g, ' ')) && !x.disabled); if (b) { b.click(); return true; } return false; }, re.source);
const pickMode = (page, label) => page.evaluate((l) => { const b = [...document.querySelectorAll('button[role=radio]')].find((x) => x.textContent.toLowerCase().includes(l.toLowerCase()) && x.getClientRects().length); b && b.click(); }, label);
const submitHero = (page) => page.evaluate(() => document.querySelector('#hero-ask').closest('form').requestSubmit());
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `door-${name}.png`) });
const heading = (page) => page.evaluate(() => (document.getElementById('door-flow-title') || {}).innerText || '');

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });

  // ── Start my essay
  {
    const { page, errs } = await landing(browser);
    console.log('\n── Start my essay');
    await pickMode(page, 'Essay'); await wait(200);
    await page.type('#hero-ask', 'To what extent was the Treaty of Versailles too harsh on Germany?');
    await submitHero(page); await wait(500);
    check('the pop-up opens on the essay kind, with the question shown', [await heading(page), /Your question/i.test(await dialogText(page)), /Treaty of Versailles/.test(await dialogText(page))], ['What kind of essay is it?', true, true]);
    check('nothing navigated yet', page.url(), 'http://localhost:5173/');
    await shot(page, 'essay-1-kind');
    await clickIn(page, /^Argumentative/); await wait(500);
    { const dt = await dialogText(page); check('then the citation style, with all six', [await heading(page), ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver'].every((c) => dt.includes(c))], ['Which citation style does your course use?', true]); }
    await clickIn(page, /^Harvard/); await wait(500);
    check('then the length', await heading(page), 'How many words does it need to be?');
    await clickIn(page, /^2,000/); await wait(500);
    check('then the rubric, which can be skipped', [await heading(page), /Skip, I have none/.test(await dialogText(page))], ['Do you have a rubric or brief?', true]);
    await clickIn(page, /^Back$/); await wait(400);
    check('Back returns to the length with 2,000 still chosen', [await heading(page), await page.evaluate(() => [...document.querySelectorAll('[aria-labelledby="door-flow-title"] button[aria-pressed=true]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()))], ['How many words does it need to be?', ['2,000words']]);
    await clickIn(page, /^2,000/); await wait(500);
    await clickIn(page, /^Skip, I have none/); await wait(500);
    const t = await dialogText(page);
    check('the last step shows the answers and the account buttons', [await heading(page), /Argumentative/.test(t), /Harvard/.test(t), /2,000 words/.test(t), /Continue with Google/.test(t), /Sign up with email/.test(t)], ['Your outline is ready to build', true, true, true, true, true]);
    await shot(page, 'essay-2-gate');
    await clickIn(page, /^Harvard/); await wait(400);
    check('an answer chip jumps back to that question', await heading(page), 'Which citation style does your course use?');
    await clickIn(page, /^Harvard/); await wait(400); await clickIn(page, /^2,000/); await wait(400); await clickIn(page, /^Skip/); await wait(400);
    await clickIn(page, /^Sign up with email/); await wait(900);
    const saved = await page.evaluate(() => ({ q: sessionStorage.getItem('writescholar_essay_question_draft'), auto: sessionStorage.getItem('writescholar_essay_autobuild'), pre: JSON.parse(sessionStorage.getItem('writescholar_essay_prefill') || 'null'), door: localStorage.getItem('ws_door') }));
    check('it goes to sign-up', /\/signup/.test(page.url()), true);
    check('with the question and answers saved for Start an essay', [saved.q, saved.auto, saved.pre && saved.pre.kind, saved.pre && saved.pre.cite, saved.pre && saved.pre.length], ['To what extent was the Treaty of Versailles too harsh on Germany?', '2000', 'Argumentative', 'Harvard', 2000]);
    check('no page errors (essay)', errs, []);
    await page.close();
  }

  // ── Make my pack
  {
    const { page, errs, nav } = await landing(browser);
    console.log('\n── Make my pack');
    await pickMode(page, 'Exam'); await wait(200);
    await page.type('#hero-ask', 'Statistics 101');
    await submitHero(page); await wait(500);
    check('the pop-up asks for the exam date', [await heading(page), /Statistics 101/.test(await dialogText(page))], ['When is the exam?', true]);
    await shot(page, 'pack-1-date');
    const d = new Date(Date.now() + 12 * 864e5); const iso = d.toISOString().slice(0, 10);
    await page.evaluate((v) => { const i = document.getElementById('door-flow-date'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); }, iso);
    await wait(200);
    await clickIn(page, /^Exam on/); await wait(600);
    const t = await dialogText(page);
    check('the last step shows the date and what the pack holds', [await heading(page), /Exam /.test(t), /Notes, a quiz, flashcards and games/.test(t)], ['Your study pack is ready to make', true, true]);
    await shot(page, 'pack-2-gate');
    await clickIn(page, /^Continue with Google/); await wait(900);
    const p2 = await browser.newPage(); await p2.setRequestInterception(true); p2.on('request', (r) => (r.url().startsWith('http://localhost:5173/') && r.resourceType() === 'document' ? r.respond({ status: 200, contentType: 'text/html', body: '<p>x</p>' }) : r.abort()));
    await p2.goto('http://localhost:5173/storage-check');
    const saved = await p2.evaluate(() => ({ topic: JSON.parse(localStorage.getItem('ws_landing_topic') || 'null'), auto: JSON.parse(localStorage.getItem('ws_landing_autostart') || 'null'), date: JSON.parse(localStorage.getItem('ws_landing_exam_date') || 'null') }));
    check('Google sign-in starts', nav.includes('google'), true);
    check('with the topic, the date and the make-it-now flag saved', [saved.topic && saved.topic.text, saved.auto && saved.auto.kind, saved.date && saved.date.value], ['Statistics 101', 'pack', iso]);
    check('no page errors (pack)', errs, []);
    await page.close();
  }

  // ── Grade my essay: pasted in the box, and empty
  {
    const { page, errs } = await landing(browser);
    console.log('\n── Grade my essay');
    await pickMode(page, 'Grade'); await wait(200);
    await page.evaluate((v) => { const i = document.getElementById('hero-ask'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); }, ESSAY);
    await wait(300);
    await submitHero(page); await wait(700);
    const t = await dialogText(page);
    check('it reads the essay on the device and goes straight to the last step', [await heading(page), /words in 6 paragraphs/.test(t), /Next: scoring thesis/.test(t)], ['Your essay is ready to grade', true, true]);
    await shot(page, 'grade-1-gate');
    await clickIn(page, /^Sign up with email/); await wait(800);
    check('it goes to sign-up with the essay saved and the grade-now flag', [/\/signup/.test(page.url()), await page.evaluate(() => (JSON.parse(localStorage.getItem('ws_landing_autostart') || '{}').kind))], [true, 'grade']);
    check('no page errors (grade)', errs, []);
    await page.close();
  }
  {
    const { page, errs } = await landing(browser, { width: 390 });
    console.log('\n── Grade with nothing pasted, on a phone');
    await pickMode(page, 'Grade'); await wait(200);
    await submitHero(page); await wait(600);
    check('it asks for the essay first', await heading(page), 'Paste your essay');
    await clickIn(page, /^Next$/); await wait(300);
    check('too short says so', /Paste at least 200 words/.test(await dialogText(page)), true);
    await shot(page, 'grade-2-phone-input');
    await page.evaluate(() => document.querySelector('[aria-label="Close"]').click()); await wait(400);
    check('Close shuts the pop-up', await page.evaluate(() => !!document.querySelector('[aria-labelledby="door-flow-title"]')), false);
    check('no page errors (phone)', errs, []);
    await page.close();
  }

  // ── Signed in: one button, straight to the account
  {
    const { page } = await landing(browser, { signedIn: true });
    console.log('\n── Signed in');
    await pickMode(page, 'Exam'); await wait(200);
    await page.type('#hero-ask', 'Cell respiration');
    await submitHero(page); await wait(500);
    await clickIn(page, /^No date yet/); await wait(600);
    const t = await dialogText(page);
    check('no sign-up buttons, one Make button', [/Continue with Google/.test(t), /Make my study pack/.test(t)], [false, true]);
    await page.close();
  }

  // ── After sign-up: the answers are used and the job starts by itself
  async function signedInApp(seed, pathName) {
    const user = { id: 'u-flow', email: 's@example.com', name: 'Maya', first_name: 'Maya', subscription_plan: 'free', plan: 'free', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
    const page = await browser.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument((u, sd) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-flow', '1'); for (const [k, v] of Object.entries(sd.local || {})) localStorage.setItem(k, v); for (const [k, v] of Object.entries(sd.session || {})) sessionStorage.setItem(k, v); }, user, seed);
    await page.setRequestInterception(true);
    const posts = [];
    page.on('request', (req) => {
      const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
      const p = url.split('/api')[1].split('?')[0];
      const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
      if (req.method() === 'POST') posts.push({ p, body: req.postData() || '' });
      const ok = (data) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (p === '/auth/me') return ok({ user });
      if (p === '/writing/usage') return ok({ paid: false, plansUsed: 0, plansLimit: 2, plansLeft: 2, helpsUsed: 0, helpsLimit: 10, helpsLeft: 10 });
      if (p === '/writing/plan') return ok({ title: 'T', wordTarget: 2000, theses: [1, 2, 3].map((n) => ({ thesis: `Thesis number ${n} is long enough.`, why: 'Because.', outline: [{ heading: 'Introduction', goal: 'Intro.', words: 200 }, { heading: 'Body', goal: 'Body.', words: 600 }] })) });
      return ok({ documents: [], packs: [] });
    });
    await page.goto(`http://localhost:5173${pathName}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 150000 });
    return { page, posts, errs };
  }
  {
    console.log('\n── After sign-up: Start an essay builds with the answers');
    const { page, posts, errs } = await signedInApp({ session: { writescholar_essay_question_draft: 'To what extent was the Treaty of Versailles too harsh on Germany?', writescholar_essay_autobuild: '2000', writescholar_essay_prefill: JSON.stringify({ kind: 'Argumentative', cite: 'Harvard', length: 2000, brief: '' }) }, local: { ws_door: 'essay' } }, '/documents');
    for (let i = 0; i < 40 && !posts.some((x) => x.p === '/writing/plan'); i++) { await page.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar:switchWorkspaceView', { detail: 'write' }))); await wait(1500); }
    const plan = posts.find((x) => x.p === '/writing/plan');
    const body = plan ? JSON.parse(plan.body) : {};
    check('the outline is built straight away, with the answers from the pop-up', [body.essayType, body.wordTarget, /Treaty of Versailles/.test(body.question || '')], ['Argumentative', 2000, true]);
    await wait(1200);
    check('the three arguments show, and the citation style is kept', [/Pick the argument you want to make/i.test(await page.evaluate(() => document.body.innerText)), await page.evaluate(() => localStorage.getItem('writescholar_editor_citation_style'))], [true, 'Harvard']);
    await page.screenshot({ path: path.join(SHOTS, 'door-essay-3-built.png') });
    check('no page errors (after sign-up, essay)', errs, []);
    await page.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
