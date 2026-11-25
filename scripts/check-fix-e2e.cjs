// Drives highlight-to-check, "Show me" and "Fix it for me" in Chrome with a mocked API.
// Needs the dev server on :5173. Run: node scripts/check-fix-e2e.cjs  (screenshots go to $SHOTS or the OS temp folder)
const path = require('path');
const os = require('os');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const SHOTS = process.env.SHOTS || os.tmpdir();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };

const P1 = "Peele builds fear out of moments that would look harmless in another film. At the garden party, guests squeeze Chris's arm and ask about his golf swing. None of these lines is a threat on its own, yet the camera holds on his face until each one feels like one. The horror comes from repetition, and this shows racism.";
const P2 = 'The Armitages never insult Chris. Their racism arrives as praise.';
const CHECK = {
  kind: 'check', verdict: 'nearly', summary: 'You make a clear point about horror, but the paragraph needs one more step to prove it.',
  working: 'Your opening, "fear out of moments that would look harmless", states the point well.',
  fixes: [
    { issue: 'The garden party needs one quoted line.', how: 'Quote what a guest says and explain why it unsettles Chris.', quote: 'None of these lines is a threat on its own' },
    { issue: 'The link to your thesis is vague.', how: 'Say how the repetition shows admiration hiding racism.', quote: 'and this shows racism' },
    { issue: 'There is no source yet.', how: 'Add one critic who reads the film this way.', quote: '' },
  ],
};
const FIXED = 'The horror comes from repetition, which shows how admiration can hide racism [a line from the film].';
const OUTLINE = [{ heading: 'Introduction', goal: 'Intro.', words: 150 }, { heading: 'Horror as a mirror', goal: 'Show how small slights become threats.', words: 400 }];
const PLAN = { title: 'Race and Horror', wordTarget: 1500, theses: [1, 2, 3].map((n) => ({ thesis: `Get Out shows racism hiding behind admiration, version ${n}.`, why: 'Because.', outline: OUTLINE })) };

async function open(browser, { width = 1440, route }) {
  const user = { id: 'u-fix', email: 's@example.com', name: 'Maya Lewis', first_name: 'Maya', subscription_plan: 'pro', plan: 'pro', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await page.setViewport({ width, height: width > 800 ? 1000 : 844, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((u) => { localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-fix', '1'); try { localStorage.setItem('ws_promo_banner_dismissed', '1'); sessionStorage.setItem('ws_first_grade_pending', '0'); } catch {} }, user);
  await page.evaluateOnNewDocument(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}'; document.head.appendChild(st); }); });
  await page.setRequestInterception(true);
  const calls = [];
  page.on('request', async (req) => {
    const url = req.url(); if (!url.includes('localhost:3001')) return req.continue();
    const p = url.split('/api')[1].split('?')[0];
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
    const ok = (data) => req.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    const usage = { paid: true, plansUsed: 0, plansLimit: 100, plansLeft: 100, helpsUsed: 3, helpsLimit: 500, helpsLeft: 497 };
    if (p === '/auth/me') return ok({ user });
    if (p === '/writing/usage') return ok(usage);
    if (p === '/writing/plan') return ok({ ...PLAN, usage });
    if (p === '/writing/help') {
      const b = JSON.parse(req.postData() || '{}'); calls.push(b);
      await wait(250);
      if (b.kind === 'check') return ok({ ...CHECK, usage });
      if (b.kind === 'next' && /Hall/.test(b.selection || '')) return ok({ kind: 'next', sofar: 'You have applied Hall but given no source yet.', moves: [{ what: "Back up Hall's theory with a source", starter: 'Hall argues that meaning is made through power [your source].' }, { what: 'Explain what it shows', starter: 'This matters because…' }], questions: ['Which book by Hall will you use?', 'What page?'], usage });
      if (b.kind === 'next') return ok({ kind: 'next', sofar: 'You have made your point about horror.', moves: [{ what: 'Give one example from the film', starter: 'At the garden party, for example,' }, { what: 'Explain what it shows', starter: 'This matters because…' }], questions: ['Which scene shows it best?', 'What does it show about Chris?'], usage });
      if (b.kind === 'fix') return ok({ kind: 'fix', replacement: FIXED, why: 'Names what the repetition shows, so the point links to the thesis.', usage });
      return ok({ kind: b.kind, replacement: 'A clearer line.', why: 'Shorter.', usage });
    }
    if (p === '/documents/upload') return ok({ document: { id: 'doc-1' } });
    if (/^\/documents\/doc-1\/content/.test(p)) return ok({});
    if (p === '/documents' || p === '/documents/') return ok({ documents: [] });
    if (/usage/.test(p)) return ok({ plan: 'pro', credits: { plan: 'pro', allowance: 99, rollover: 0, total: 99, used: 0, remaining: 99, cap: 499, nextTopUp: 99, periodEnd: '2026-12-20', topUp: 0 } });
    return ok({});
  });
  const click = (re, scope = 'body') => page.evaluate((s, scope) => { const r = new RegExp(s); const b = [...document.querySelector(scope).querySelectorAll('button, a')].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && !x.disabled && x.getClientRects().length > 0); if (b) { b.click(); return true; } return false; }, re.source, scope);
  await page.goto('http://localhost:5173/documents', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 150000 });
  for (let i = 0; i < 60 && !(await page.$('#essay-question')); i++) { await page.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar:switchWorkspaceView', { detail: 'write' }))); await wait(2000); }
  await page.type('#essay-question', 'How does Get Out represent race in modern America?', { delay: 0 });
  await wait(600);
  if (route === 'blank') {
    await click(/Skip the outline/);
  } else {
    const heading = () => page.evaluate(() => (document.querySelector('h1') || {}).innerText || '');
    const tap = async (re, next) => { await click(re); for (let i = 0; i < 20 && !next.test(await heading()); i++) await wait(150); };
    await tap(/^Start my essay/, /kind/i); await tap(/^Argumentative/, /citation style/i); await tap(/^APA/, /words/i); await tap(/^1,500\s*words$/, /rubric/i);
    await click(/^Build my outline/);
    for (let i = 0; i < 40 && !(await click(/^Start writing/)); i++) await wait(500);
  }
  await page.waitForSelector('.ProseMirror', { timeout: 30000 }); await wait(1500);
  return { page, click, calls, errs };
}

const docText = (page) => page.evaluate(() => document.querySelector('.ProseMirror').editor.getText());
const selected = (page) => page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; const { from, to } = e.state.selection; return e.state.doc.textBetween(from, to, ' '); });
/** Select the paragraph that starts with `start`, the way a student drags across it. */
const selectPara = (page, start) => page.evaluate((start) => {
  const e = document.querySelector('.ProseMirror').editor; let r = null;
  e.state.doc.descendants((n, p) => { if (n.type.name === 'paragraph' && n.textContent.startsWith(start)) { r = { from: p + 1, to: p + n.nodeSize - 1 }; return false; } return true; });
  e.chain().focus().setTextSelection(r).run();
}, start);
const cardText = (page) => page.evaluate(() => (document.querySelector('[role=dialog][aria-label="Notes on this passage"]') || {}).innerText || '');

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });

  // ── A. A blank draft: highlight a paragraph, check it, see a quote, fix one sentence.
  {
    const { page, click, calls, errs } = await open(browser, { route: 'blank' });
    console.log('\n── blank draft, highlight to check');
    await page.evaluate((p1, p2) => document.querySelector('.ProseMirror').editor.commands.setContent(`<p>${p1}</p><p>${p2}</p>`), P1, P2);
    await selectPara(page, 'The Armitages'); await wait(400);
    const shortBar = await page.evaluate(() => [...document.querySelectorAll('[role=toolbar][aria-label="Help with the selected text"] button')].map((b) => b.innerText.trim()));
    check('a short sentence shows only the rewrites', shortBar, ['Make it clearer', 'Shorten', 'More formal']);
    await selectPara(page, 'Peele builds'); await wait(400);
    const bar = await page.evaluate(() => [...document.querySelectorAll('[role=toolbar][aria-label="Help with the selected text"] button')].map((b) => b.innerText.trim()));
    check('a paragraph of 40+ words offers Check this first, then the rewrites', bar, ['Check this', 'Clearer', 'Shorter', 'More formal']);
    await page.screenshot({ path: path.join(SHOTS, 'fix-1-bar.png') });
    await click(/^Check this/, '[role=toolbar][aria-label="Help with the selected text"]'); await wait(900);
    let t = await cardText(page);
    check('the check card opens over the passage', /Notes on this passage/i.test(t) && /Nearly there/i.test(t), true);
    check('the selected paragraph was what got checked', calls[calls.length - 1]?.kind === 'check' && calls[calls.length - 1]?.selection === P1, true);
    check('fixes with a quote show it, with Show me and Fix it for me', [(t.match(/Show me/g) || []).length, (t.match(/Fix it for me/g) || []).length, /“None of these lines is a threat on its own”/.test(t)], [2, 2, true]);
    await page.screenshot({ path: path.join(SHOTS, 'fix-2-card.png') });

    await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); [...d.querySelectorAll('button')].filter((b) => /Show me/.test(b.textContent))[0].click(); });
    await wait(400);
    check('Show me selects the quoted words in the essay', await selected(page), 'None of these lines is a threat on its own');
    check('...and the card stays open', /Notes on this passage/.test(await cardText(page)), true);

    await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); [...d.querySelectorAll('button')].filter((b) => /Fix it for me/.test(b.textContent))[1].click(); });
    await wait(900);
    const fixCall = calls[calls.length - 1];
    check('Fix it for me sends just that sentence and the problem', [fixCall.kind, fixCall.selection, /link to your thesis is vague/.test(fixCall.instruction)], ['fix', 'The horror comes from repetition, and this shows racism.', true]);
    t = await cardText(page);
    check('the suggestion is shown before anything changes', [/Suggested sentence/i.test(t), /Fill in the part in \[brackets\]/.test(t), (await docText(page)).includes(FIXED)], [true, true, false]);
    await page.screenshot({ path: path.join(SHOTS, 'fix-3-preview.png') });
    await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); [...d.querySelectorAll('button')].find((b) => /^Use this$/.test(b.textContent.trim())).click(); });
    await wait(500);
    const after = await docText(page);
    check('Use this replaces only that sentence', [after.includes(FIXED), after.includes('and this shows racism'), after.includes('None of these lines is a threat on its own')], [true, false, true]);
    t = await cardText(page);
    check('the card counts the fix and marks it done', [/1 of 3 fixed/.test(t), /Fixed in your essay/.test(t), /Check it again/.test(t)], [true, true, true]);
    await page.screenshot({ path: path.join(SHOTS, 'fix-4-done.png') });

    const before = calls.length;
    await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); [...d.querySelectorAll('button')].find((b) => /Check it again/.test(b.textContent)).click(); });
    await wait(900);
    const again = calls[before];
    check('Check it again reads the paragraph as it is now', [again?.kind, again?.selection?.includes(FIXED), again?.selection?.includes('The Armitages')], ['check', true, false]);

    // A quote that is no longer in the essay.
    await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let r = null; e.state.doc.descendants((n, p) => { if (n.isText && n.text.includes('None of these lines')) { const i = n.text.indexOf('None of these lines'); r = { from: p + i, to: p + i + 'None of these lines is a threat on its own'.length }; } return true; }); e.view.dispatch(e.state.tr.insertText('Each remark seems polite', r.from, r.to)); });
    await wait(200);
    await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); [...d.querySelectorAll('button')].filter((b) => /Show me/.test(b.textContent))[0].click(); });
    await wait(300);
    check('a quote that was edited away says so instead of failing', /That sentence has changed since the check/.test(await cardText(page)), true);
    check('page errors (blank draft)', errs, []);
    await page.close();
  }

  // ── B. An outline draft: the rail's "Check this paragraph" gets the same quote and fix.
  {
    const { page, calls, errs } = await open(browser, { route: 'outline' });
    console.log('\n── outline draft, the rail check');
    await page.evaluate((p1) => { const e = document.querySelector('.ProseMirror').editor; e.commands.setContent(`<h2>Introduction</h2><p>Short intro.</p><h2>Horror as a mirror</h2><p>${p1}</p>`); let pos = 0; e.state.doc.descendants((n, p) => { if (n.textContent.startsWith('Peele')) pos = p + 2; return true; }); e.chain().focus().setTextSelection(pos).run(); }, P1);
    await wait(600);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]') || document.body; [...a.querySelectorAll('button')].find((b) => /Check this paragraph/.test(b.textContent)).click(); });
    await wait(900);
    const railText = await page.evaluate(() => (document.querySelector('aside[aria-label="Your outline"]') || document.body).innerText);
    check('the rail check shows quotes with Show me and Fix it for me', [/“and this shows racism”/.test(railText), (railText.match(/Fix it for me/g) || []).length >= 2], [true, true]);
    check('the rail check sends the paragraph with its outline goal', [calls[calls.length - 1].kind, calls[calls.length - 1].goal], ['check', 'Show how small slights become threats.']);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]') || document.body; [...a.querySelectorAll('button')].filter((b) => /Fix it for me/.test(b.textContent))[1].click(); });
    await wait(900);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]') || document.body; [...a.querySelectorAll('button')].find((b) => /^Use this$/.test(b.textContent.trim())).click(); });
    await wait(500);
    check('the fix lands in the essay from the rail too', (await docText(page)).includes(FIXED), true);
    const aside = await page.$('aside[aria-label="Your outline"]');
    if (aside) await aside.screenshot({ path: path.join(SHOTS, 'fix-5-rail.png') });
    check('page errors (outline draft)', errs, []);
    await page.close();
  }

  // ── D. A paragraph that is already started gets "what next", not two ways to open it.
  {
    const { page, calls, errs } = await open(browser, { route: 'outline' });
    console.log('\n── help me with a started paragraph');
    const STARTED = 'Peele builds fear out of moments that would look harmless in another film.';
    await page.evaluate((t) => { const e = document.querySelector('.ProseMirror').editor; e.commands.setContent(`<h2>Introduction</h2><p>Short.</p><h2>Horror as a mirror</h2><p>${t}</p>`); let pos = 0; e.state.doc.descendants((n, p) => { if (n.textContent.startsWith('Peele')) pos = p + 2; return true; }); e.chain().focus().setTextSelection(pos).run(); }, STARTED);
    await wait(700);
    const rail = () => page.evaluate(() => (document.querySelector('aside[aria-label="Your outline"]') || document.body).innerText);
    let t = await rail();
    check('a started paragraph offers "What should I write next?"', [/What should I write next\?/.test(t), /Help me start this paragraph/.test(t)], [true, false]);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]') || document.body; [...a.querySelectorAll('button')].find((b) => /What should I write next/.test(b.textContent)).click(); });
    await wait(900);
    const call = calls[calls.length - 1];
    check('it sends the paragraph as written so far, as a "next" request', [call.kind, call.selection], ['next', STARTED]);
    t = await rail();
    { const a = await page.$('aside[aria-label="Your outline"]'); if (a) await a.screenshot({ path: path.join(SHOTS, 'next-1-card.png') }); }
    check('the card says what is done and what to write next, not two openings', [/So far/i.test(t), /You have made your point about horror/.test(t), /What to write next/i.test(t), /Two ways to open it/i.test(t)], [true, true, true, false]);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]') || document.body; [...a.querySelectorAll('button')].find((b) => /^Add this$/.test(b.textContent.trim())).click(); });
    await wait(500);
    const text = await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let r = ''; e.state.doc.descendants((n) => { if (n.type.name === 'paragraph' && n.textContent.startsWith('Peele')) r = n.textContent; return true; }); return r; });
    check('Add this carries on the same paragraph', text, `${STARTED} At the garden party, for example, `);
    t = await rail();
    check('after adding: a confirmation, the questions stay, and Undo is offered', [/Added\. Finish the sentence/.test(t), /Which scene shows it best\?/.test(t), /Undo/.test(t), /What comes after this\?/.test(t)], [true, true, true, true]);
    { const a = await page.$('aside[aria-label="Your outline"]'); if (a) await a.screenshot({ path: path.join(SHOTS, 'next-2-added.png') }); }
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]'); [...a.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Undo').click(); });
    await wait(400);
    const undone = await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let r = ''; e.state.doc.descendants((n) => { if (n.type.name === 'paragraph' && n.textContent.startsWith('Peele')) r = n.textContent; return true; }); return r; });
    check('Undo takes the words back out and brings the ideas back', [undone, /What to write next/i.test(await rail())], [STARTED, true]);
    // The second idea trails off with dots: they are shown but not pasted in.
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]'); [...a.querySelectorAll('button')].filter((b) => /^Add this$/.test(b.textContent.trim()))[1].click(); });
    await wait(400);
    const dots = await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let r = ''; e.state.doc.descendants((n) => { if (n.type.name === 'paragraph' && n.textContent.startsWith('Peele')) r = n.textContent; return true; }); return r; });
    check('a starter that trails off goes in without the dots', dots, `${STARTED} This matters because `);
    // The paragraph's place in the essay and its citations go with the request.
    check('it says where the paragraph sits and how many citations it has', [call.place && call.place.index, call.place && call.place.total, call.place && call.place.citations, call.place && /Horror as a mirror/.test(call.place.outline.join('|'))], [1, 2, 0, true]);
    // A move that needs a source: the placeholder is selected and Cite a source opens the Cite tool.
    const HALL = 'The Armitages praise Chris, and Hall says representation builds how people are seen.';
    await page.evaluate((t) => { const e = document.querySelector('.ProseMirror').editor; e.commands.setContent(`<h2>Introduction</h2><p>Short.</p><h2>Horror as a mirror</h2><p>${t}</p>`); let pos = 0; e.state.doc.descendants((n, p) => { if (n.textContent.startsWith('The Armitages')) pos = p + 2; return true; }); e.chain().focus().setTextSelection(pos).run(); }, HALL);
    await wait(600);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]'); [...a.querySelectorAll('button')].find((b) => /What should I write next|What comes after this/.test(b.textContent)).click(); });
    await wait(900);
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]'); [...a.querySelectorAll('button')].find((b) => /^Add this$/.test(b.textContent.trim())).click(); });
    await wait(500);
    const sel = await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; const { from, to } = e.state.selection; return e.state.doc.textBetween(from, to, ''); });
    t = await rail();
    check('the [your source] spot is selected and the card asks for a source', [sel, /Now back it up with a source/.test(t), /Cite a source/.test(t)], ['[your source]', true, true]);
    { const a = await page.$('aside[aria-label="Your outline"]'); if (a) await a.screenshot({ path: path.join(SHOTS, 'next-3-source.png') }); }
    await page.evaluate(() => { const a = document.querySelector('aside[aria-label="Your outline"]'); [...a.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cite a source').click(); });
    await wait(700);
    check('Cite a source opens the Cite tool', await page.evaluate(() => !!document.querySelector('[role="dialog"]') && /cite/i.test(document.querySelector('[role="dialog"]').innerText)), true);
    await page.keyboard.press('Escape'); await wait(300);
    // A section with almost nothing in it still gets the opening help.
    await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let pos = 0; e.state.doc.descendants((n, p) => { if (n.type.name === 'paragraph' && n.textContent === 'Short.') pos = p + 2; return true; }); e.chain().focus().setTextSelection(pos).run(); });
    await wait(500);
    t = await rail();
    check('a nearly empty paragraph still gets "Help me start this paragraph"', /Help me start this paragraph/.test(t), true);
    check('page errors (started paragraph)', errs, []);
    await page.close();
  }

  // ── C. On a phone the four buttons wrap into two rows inside the screen.
  {
    const { page, errs } = await open(browser, { route: 'blank', width: 390 });
    console.log('\n── phone');
    await page.evaluate((p1) => document.querySelector('.ProseMirror').editor.commands.setContent(`<p>${p1}</p>`), P1);
    await selectPara(page, 'Peele builds'); await wait(500);
    const box = await page.evaluate(() => { const b = document.querySelector('[role=toolbar][aria-label="Help with the selected text"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), rows: new Set([...b.querySelectorAll('button')].map((x) => Math.round(x.getBoundingClientRect().top))).size }; });
    check('the bar fits the screen in two rows', !!box && box.left >= 0 && box.right <= 390 && box.rows === 2, true);
    await page.screenshot({ path: path.join(SHOTS, 'fix-6-phone-bar.png') });
    await page.evaluate(() => { const b = document.querySelector('[role=toolbar][aria-label="Help with the selected text"]'); [...b.querySelectorAll('button')].find((x) => /Check this/.test(x.textContent)).click(); });
    await wait(900);
    const card = await page.evaluate(() => { const d = document.querySelector('[role=dialog][aria-label="Notes on this passage"]'); if (!d) return null; const r = d.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
    check('the card fits the phone screen', !!card && card.left >= 0 && card.right <= 390 && card.top >= 0 && card.bottom <= 844, true);
    await page.screenshot({ path: path.join(SHOTS, 'fix-7-phone-card.png') });
    check('page errors (phone)', errs, []);
    await page.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
