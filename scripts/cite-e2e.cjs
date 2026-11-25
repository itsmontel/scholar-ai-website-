// Drives the real editor in Chrome: adds sources, checks numbering, ordering, style switching,
// undo, hand edits and removal. Needs the dev server on :5173. Run: node scripts/cite-e2e.cjs
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const user = { id: 'u-cite', email: 'student@example.com', name: 'Maya Lewis', first_name: 'Maya', subscription_plan: 'pro', plan: 'pro', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
const OUTLINE = [{ heading: 'Introduction', goal: 'Intro.', words: 150 }, { heading: 'Body', goal: 'Body.', words: 400 }];
const PLAN = { title: 'Test', wordTarget: 1500, theses: [{ thesis: 'Teenagers need more sleep to remember what they learn.', why: 'Because.', outline: OUTLINE }, { thesis: 'Schools should start later in the morning.', why: 'Because.', outline: OUTLINE }, { thesis: 'Sleep loss harms memory more than it harms mood.', why: 'Because.', outline: OUTLINE }] };

const failures = [];
let passed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else failures.push({ name, got, want });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((u) => {
    localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('ws_welcome_done2_u-cite', '1');
    try { localStorage.setItem('ws_promo_banner_dismissed', '1'); } catch {}
  }, user);
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
    const p = url.split('/api')[1].split('?')[0];
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
    const ok = (data) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    if (p === '/auth/me') return ok({ user });
    if (p === '/writing/usage') return ok({ paid: true, plansUsed: 0, plansLimit: 100, plansLeft: 100, helpsUsed: 0, helpsLimit: 500, helpsLeft: 500 });
    if (p === '/writing/plan') return ok({ ...PLAN });
    if (p === '/documents/upload') return ok({ document: { id: 'doc-1' } });
    if (/^\/documents\/doc-1\/content/.test(p)) return ok({});
    if (p === '/documents' || p === '/documents/') return ok({ documents: [] });
    if (/usage/.test(p)) return ok({ plan: 'pro', credits: { plan: 'pro', allowance: 99, rollover: 0, total: 99, used: 0, remaining: 99, cap: 499, nextTopUp: 99, periodEnd: '2026-12-20', topUp: 0 } });
    return ok({});
  });
  const click = (re, sel = 'button, a') => page.evaluate((s, sel) => { const r = new RegExp(s); const b = [...document.querySelectorAll(sel)].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && !x.disabled && (x.offsetParent !== null || getComputedStyle(x).position === 'fixed' || x.getClientRects().length > 0)); if (b) { b.click(); return true; } return false; }, re.source, sel);

  await page.goto('http://localhost:5173/documents', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 150000 }); await wait(2500);
  // The first load compiles on demand, so keep asking for the Write view until it shows.
  for (let i = 0; i < 60 && !(await page.$('#essay-question')); i++) {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar:switchWorkspaceView', { detail: 'write' }))); await wait(2000);
  }
  await page.type('#essay-question', 'How does sleep affect memory in teenagers?', { delay: 0 });
  await click(/^Start my essay/); await wait(500);
  await click(/^Argumentative/); await wait(400); await click(/^IEEE/); await wait(400); await click(/^1,500\s*words$/); await wait(500);
  await click(/^Build my outline/); await wait(1800);
  console.log('buttons now:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => `${b.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}${b.disabled ? ' [disabled]' : ''}`).filter((t) => /writ|outline|start/i.test(t)))));
  let clicked = false;
  for (let i = 0; i < 40 && !clicked; i++) { clicked = await click(/^Start writing/); if (!clicked) await wait(1000); }
  console.log('clicked Start writing:', clicked);
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console error]', m.text().slice(0, 200)); });
  try { await page.waitForSelector('.ProseMirror', { timeout: 30000 }); }
  catch (e) {
    await page.screenshot({ path: path.join(__dirname, 'cite-e2e-failed.png') });
    console.log('The editor did not open. Page said:', (await page.evaluate(() => document.body.innerText)).slice(0, 600));
    console.log('page errors:', JSON.stringify(errs), 'url:', page.url());
    process.exit(2);
  }
  await wait(1500);

  const ed = (fn, ...a) => page.evaluate(`(${fn.toString()})(...${JSON.stringify(a)})`);
  const state = () => page.evaluate(() => {
    const e = document.querySelector('.ProseMirror').editor;
    const paras = []; e.state.doc.forEach((n) => paras.push(n.textContent));
    const cites = [];
    e.state.doc.descendants((n) => { if (n.isText) { const m = n.marks.find((x) => x.type.name === 'citeRef'); if (m) cites.push(n.text); } return true; });
    const heading = []; e.state.doc.forEach((n) => { if (n.type.name === 'heading' && n.attrs.refStyle) heading.push(`${n.textContent}/${n.attrs.refStyle}`); });
    const list = []; e.state.doc.forEach((n) => { if (n.type.name === 'paragraph' && n.attrs.refData) list.push(n.textContent); });
    return { paras: paras.filter((t) => !/^\d+\. |^\[\d+\] /.test(t) || true), cites, heading, list };
  });
  const setDoc = (texts) => ed((texts) => { const e = document.querySelector('.ProseMirror').editor; e.commands.setContent(texts.map((t) => `<p>${t}</p>`).join('')); }, texts);
  /** Put the cursor at the end of the paragraph that starts with `start`, or at the very start of the document. */
  const cursorAfter = (start) => ed((start) => { const e = document.querySelector('.ProseMirror').editor; let pos = 1; if (start) e.state.doc.descendants((n, p) => { if (n.isTextblock && n.textContent.startsWith(start)) { pos = p + n.nodeSize - 1; return false; } return true; }); e.commands.setTextSelection(pos); }, start);
  const openCite = async () => { await click(/^Cite$/); await page.waitForSelector('[role=dialog][aria-labelledby="cite-title"]', { timeout: 5000 }); await wait(250); };
  const chooseStyle = async (name) => { await page.evaluate((n) => { const d = document.querySelector('[role=dialog]'); [...d.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.trim() === n).click(); }, name); await wait(300); };
  const addSource = async ({ kind = 'book', authors, year, title, publisher = '', place = '', journal = '', volume = '', issue = '', pages = '', url = '', page: pg = '' }) => {
    if (!(await page.$('#cite-authors'))) { await click(/^Add a new source/); await wait(300); }
    if (kind !== 'book') { await page.evaluate((k) => { const d = document.querySelector('[role=dialog]'); [...d.querySelectorAll('[role=group] button')].find((b) => b.textContent.trim() === k).click(); }, kind === 'journal' ? 'Journal article' : 'Web page'); await wait(200); }
    await page.click('#cite-authors', { clickCount: 3 }); await page.type('#cite-authors', authors);
    await page.type('#cite-year', year); await page.type('#cite-title-f', title);
    if (publisher) await page.type('#cite-pub', publisher);
    if (place) await page.type('#cite-place', place);
    if (journal) await page.type('#cite-journal', journal);
    if (volume) await page.type('#cite-vol', volume);
    if (issue) await page.type('#cite-issue', issue);
    if (pages) await page.type('#cite-pages', pages);
    if (url) await page.type(kind === 'website' ? '#cite-web' : '#cite-url', url);
    if (pg) { await page.click('#cite-page', { clickCount: 3 }); await page.type('#cite-page', pg); }
    await click(/^Add citation/); await wait(500);
  };
  const dialogText = () => page.evaluate(() => (document.querySelector('[role=dialog]') || {}).innerText || '');

  // ── 1. The style buttons ───────────────────────────────────────
  await setDoc(['Sleep helps memory.', 'Teenagers sleep less than they need.', 'Schools start too early.']);
  await cursorAfter('Sleep helps');
  await openCite();
  const chips = await page.evaluate(() => [...document.querySelectorAll('[role=dialog] fieldset button')].map((b) => b.textContent.trim()));
  check('six style buttons', chips, ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver']);
  check('IEEE is selected because it was chosen when starting the essay', await page.evaluate(() => [...document.querySelectorAll('[role=dialog] fieldset button[aria-pressed=true]')].map((b) => b.textContent.trim())), ['IEEE']);

  // ── 2. First source in IEEE ────────────────────────────────────
  await addSource({ authors: 'Matthew Walker', year: '2017', title: 'Why we sleep', publisher: 'Scribner', place: 'New York', page: '25' });
  let s = await state();
  check('first citation is [1, p. 25]', s.cites, ['[1, p. 25]']);
  check('heading', s.heading, ['References/IEEE']);
  check('first reference is numbered [1]', s.list, ['[1] M. Walker, Why we sleep. New York: Scribner, 2017.']);

  // ── 3. A second source cited LATER in the essay is [2] ─────────
  await cursorAfter('Teenagers sleep');
  await openCite();
  await addSource({ kind: 'journal', authors: 'Mary Carskadon\nChristine Acebo', year: '2011', title: 'Regulation of sleep in adolescence', journal: 'Journal of Adolescent Health', volume: '48', issue: '2', pages: '123-130', url: 'doi:10.1016/j.jadohealth.2010.10.001' });
  s = await state();
  check('second citation is [2]', s.cites, ['[1, p. 25]', '[2]']);
  check('two numbered references in order', s.list.map((t) => t.slice(0, 4)), ['[1] ', '[2] ']);

  // ── 4. A third source cited at the very START takes number 1 and pushes the others down ─
  await cursorAfter(null);
  await openCite();
  await addSource({ authors: 'Ann Lee', year: '2020', title: 'Early starts', publisher: 'Penguin' });
  s = await state();
  check('citation placed first is now [1]; the others move to [2] and [3]', s.cites, ['[1]', '[2, p. 25]', '[3]']);
  check('the list was reordered to follow the text', s.list.map((t) => t.slice(0, 22)), ['[1] A. Lee, Early star', '[2] M. Walker, Why we ', '[3] M. Carskadon and C']);

  // ── 5. Deleting a citation renumbers; undo brings it back ──────
  await ed(() => { const e = document.querySelector('.ProseMirror').editor; let r = null; e.state.doc.descendants((n, p) => { if (n.isText && n.text === '[1]') r = [p, p + n.nodeSize]; return true; }); e.chain().focus().deleteRange({ from: r[0], to: r[1] }).run(); });
  await wait(300);
  s = await state();
  check('after deleting the first citation the rest are [1] and [2]', s.cites, ['[1, p. 25]', '[2]']);
  check('the uncited source drops to the bottom of the list', s.list.map((t) => t.slice(0, 22)), ['[1] M. Walker, Why we ', '[2] M. Carskadon and C', '[3] A. Lee, Early star']);
  const trace = async (label) => { const t = await state(); console.log(`   [${label}] cites=${JSON.stringify(t.cites)} list=${JSON.stringify(t.list.map((x) => x.slice(0, 18)))}`); return t; };
  await trace('after delete');
  await ed(() => document.querySelector('.ProseMirror').editor.commands.undo()); await wait(300);
  s = await trace('after ONE undo');
  check('one undo restores the citation and every number together', s.cites, ['[1]', '[2, p. 25]', '[3]']);
  check('...and the list order', s.list.map((t) => t.slice(0, 22)), ['[1] A. Lee, Early star', '[2] M. Walker, Why we ', '[3] M. Carskadon and C']);
  await ed(() => document.querySelector('.ProseMirror').editor.commands.redo()); await wait(300);
  s = await trace('after redo');
  check('redo deletes it again with every number right', s.cites, ['[1, p. 25]', '[2]']);

  // ── 6. Switching styles rewrites the text and the list ─────────
  await setDoc(['Sleep helps memory.', 'Teenagers sleep less than they need.', 'Schools start too early.']);
  // Fresh doc without a list: rebuild two sources quickly in APA to test switching.
  await cursorAfter('Sleep helps'); await openCite(); await chooseStyle('APA');
  await addSource({ authors: 'Matthew Walker', year: '2017', title: 'Why we sleep', publisher: 'Scribner', page: '25' });
  await cursorAfter('Teenagers sleep'); await openCite();
  await addSource({ authors: 'W. E. B. Du Bois', year: '1903', title: 'The souls of Black folk', publisher: 'A. C. McClurg' });
  s = await state();
  check('APA in-text citations', s.cites, ['(Walker, 2017, p. 25)', '(Du Bois, 1903)']);
  check('APA list is alphabetical, with no numbers, under References', [s.heading, s.list], [['References/APA'], ['Du Bois, W. E. B. (1903). The souls of Black folk. A. C. McClurg.', 'Walker, M. (2017). Why we sleep. Scribner.']]);

  await openCite(); await chooseStyle('IEEE'); await click(/^Done/); await wait(400);
  s = await state();
  check('switch to IEEE: text becomes numbers in citation order', s.cites, ['[1, p. 25]', '[2]']);
  check('switch to IEEE: the list follows citation order (Walker first, then Du Bois)', s.list.map((t) => t.slice(0, 18)), ['[1] M. Walker, Why', '[2] W. E. B. Du Bo']);
  await openCite(); await chooseStyle('Vancouver'); await click(/^Done/); await wait(400);
  s = await state();
  check('switch to Vancouver: numbered "1." in the list', s.list.map((t) => t.slice(0, 16)), ['1. Walker M. Why', '2. Du Bois WEB. ']);
  await openCite(); await chooseStyle('MLA'); await click(/^Done/); await wait(400);
  s = await state();
  check('switch to MLA: back to author-page, Works Cited, alphabetical', [s.cites, s.heading, s.list.map((t) => t.slice(0, 14))], [['(Walker 25)', '(Du Bois)'], ['Works Cited/MLA'], ['Du Bois, W. E.', 'Walker, Matthe']]);
  await openCite(); await chooseStyle('IEEE'); await click(/^Done/); await wait(400);

  // ── 7. Typing inside a citation by hand stops it being managed ─
  await ed(() => { const e = document.querySelector('.ProseMirror').editor; let r = null; e.state.doc.descendants((n, p) => { if (n.isText && n.text === '[2]') r = p + n.nodeSize - 1; return true; }); e.chain().focus().setTextSelection(r).insertContent(', 5').run(); });
  await wait(300);
  s = await state();
  check('"[2, 5]" typed by hand is left as typed, not reverted', s.paras.some((t) => t.includes('[2, 5]')), true);
  check('...and is no longer a managed citation', s.cites, ['[1, p. 25]']);

  // ── 8. Removing a cited source takes its citations with it ─────
  await openCite();
  const dlg = await dialogText();
  check('the dialog says how often each source is cited', /Cited once in the text/.test(dlg), true);
  await click(/^Remove source/); await wait(300);
  check('removal asks first when the source is cited', /Yes, remove it and its citation/.test(await dialogText()), true);
  await click(/^Yes, remove it and its citation/); await wait(500);
  await click(/^Done/); await wait(300);
  s = await state();
  check('the removed source and its citation are gone; the other is [1]', [s.cites.length, s.list.length, s.list[0].slice(0, 22)], [0, 1, '[1] W. E. B. Du Bois, ']);
  check('no stray space left where the citation was', s.paras[0], 'Sleep helps memory.');

  // ── 9. Same author, same year: a and b ─────────────────────────
  await setDoc(['One.', 'Two.']);
  await cursorAfter('One.'); await openCite(); await chooseStyle('APA');
  await addSource({ authors: 'James Lull', year: '1995', title: 'Zebra studies', publisher: 'P' });
  s = await state(); check('a lone work has no letter', s.cites, ['(Lull, 1995)']);
  await cursorAfter('Two.'); await openCite();
  await addSource({ authors: 'James Lull', year: '1995', title: 'The art of listening', publisher: 'P' });
  s = await state();
  check('the second work makes both citations take letters (the earlier one is rewritten)', s.cites, ['(Lull, 1995b)', '(Lull, 1995a)']);
  check('...and the list carries the letters', s.list, ['Lull, J. (1995a). The art of listening. P.', 'Lull, J. (1995b). Zebra studies. P.']);
  await openCite();
  await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); [...d.querySelectorAll('button')].find((b) => /^Remove source/.test(b.textContent.trim())).click(); });
  await wait(300);
  check('removing one of them asks about its citation', /Yes, remove it/.test(await dialogText()), true);
  await click(/^Yes, remove it/); await wait(500); await click(/^Done/); await wait(300);
  s = await state();
  check('after removal the survivor drops its letter', s.cites.length === 1 && !/[ab]\)$/.test(s.cites[0]), true);

  // ── 10. A duplicate is refused ─────────────────────────────────
  await cursorAfter('One.'); await openCite();
  await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); const b = [...d.querySelectorAll('button')].find((x) => /^Add a new source/.test(x.textContent.trim())); b && b.click(); });
  await wait(300);
  const before = (await state()).list.length;
  await page.type('#cite-authors', 'Lull, James'); await page.type('#cite-year', '1995'); await page.type('#cite-title-f', 'zebra studies.');
  await click(/^Add citation/); await wait(400);
  check('the same source typed again is refused with a message', [/already in your essay/.test(await dialogText()), (await state()).list.length], [true, before]);
  await click(/^Cancel/); await wait(200);

  console.log(`\n${passed} passed, ${failures.length} failed. Page errors: ${JSON.stringify(errs)}`);
  await browser.close();
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
