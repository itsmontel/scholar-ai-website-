// Harder editor cases for numbered citations. Needs the dev server on :5173. Run: node scripts/cite-e2e-edge.cjs
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const user = { id: 'u-cite', email: 'student@example.com', name: 'Maya Lewis', first_name: 'Maya', subscription_plan: 'pro', plan: 'pro', email_verified: true, onboarding_completed: true, has_completed_onboarding: true, created_at: '2026-10-01T00:00:00Z', trial_used: true };
const OUTLINE = [{ heading: 'Introduction', goal: 'Intro.', words: 150 }, { heading: 'Body', goal: 'Body.', words: 400 }];
const PLAN = { title: 'Test', wordTarget: 1500, theses: [1, 2, 3].map((n) => ({ thesis: `Thesis number ${n} is long enough.`, why: 'Because.', outline: OUTLINE })) };
let passed = 0; const failures = [];
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (ok) passed++; else failures.push(name); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await page.setViewport({ width: 1440, height: 1200 });
  await page.evaluateOnNewDocument((u) => { localStorage.setItem('authToken', 't'); localStorage.setItem('token', 't'); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('ws_welcome_done2_u-cite', '1'); try { localStorage.setItem('ws_promo_banner_dismissed', '1'); } catch {} }, user);
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
  const click = (re) => page.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button, a')].find((x) => r.test((x.textContent || '').trim().replace(/\s+/g, ' ')) && !x.disabled && x.getClientRects().length > 0); if (b) { b.click(); return true; } return false; }, re.source);
  await page.goto('http://localhost:5173/documents', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 150000 });
  for (let i = 0; i < 60 && !(await page.$('#essay-question')); i++) { await page.evaluate(() => window.dispatchEvent(new CustomEvent('writescholar:switchWorkspaceView', { detail: 'write' }))); await wait(2000); }
  await page.type('#essay-question', 'How does sleep affect memory in teenagers?', { delay: 0 });
  await click(/^Start my essay/); await wait(500); await click(/^Argumentative/); await wait(400); await click(/^Vancouver/); await wait(400); await click(/^1,500\s*words$/); await wait(500); await click(/^Build my outline/);
  for (let i = 0; i < 40 && !(await click(/^Start writing/)); i++) await wait(1000);
  await page.waitForSelector('.ProseMirror', { timeout: 30000 }); await wait(1500);

  // Build a document with three sources and a list, written the way the editor stores one, then load it.
  const mkSrc = (id, authors, year, title) => ({ id, kind: 'book', authors, org: false, year, title, container: '', publisher: 'Pub', place: '', volume: '', issue: '', pages: '', url: '', accessed: '' });
  const S = [mkSrc('a', 'Ann Lee', '2001', 'Alpha'), mkSrc('b', 'Bo Chen', '2002', 'Beta'), mkSrc('c', 'Cy Diaz', '2003', 'Gamma')];
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
  const cite = (id, text, page = '') => `<span data-cite="${id}"${page ? ` data-cite-page="${page}"` : ''}>${text}</span>`;
  const list = (labels) => `<h2 data-ref-style="Vancouver">References</h2>` + labels.map(([n, s]) => `<p data-ref='${esc(JSON.stringify(s))}'>${n}. ${s.authors}. ${s.title}.</p>`).join('');
  const load = (html) => page.evaluate((h) => { document.querySelector('.ProseMirror').editor.commands.setContent(h); }, html);
  const read = () => page.evaluate(() => {
    const e = document.querySelector('.ProseMirror').editor; const cites = []; const paras = []; const list = [];
    e.state.doc.forEach((n) => { if (n.type.name === 'paragraph' && n.attrs.refData) list.push(n.textContent.slice(0, 12)); else if (n.type.name !== 'heading') paras.push(n.textContent); });
    e.state.doc.descendants((n) => { if (n.isText) { const m = n.marks.find((x) => x.type.name === 'citeRef'); if (m) cites.push(`${n.text}${n.marks.some((x) => x.type.name === 'bold') ? '*' : ''}`); } return true; });
    return { cites, paras, list };
  });

  // 1. A saved document whose numbers are stale is put right as soon as it opens.
  await load(`<p>One ${cite('b', '(7)')} and two ${cite('a', '(9)')} and three ${cite('c', '(2)')}.</p>` + list([[1, S[0]], [2, S[1]], [3, S[2]]]));
  await wait(300);
  let r = await read();
  check('a saved essay with stale numbers is corrected when opened', [r.cites, r.list], [['(1)', '(2)', '(3)'], ['1. Bo Chen. ', '2. Ann Lee. ', '3. Cy Diaz. ']]);

  // 2. The same source cited twice keeps one number.
  await load(`<p>First ${cite('a', '(1)')}. Then ${cite('b', '(2)')}. Again ${cite('a', '(1)')}.</p>` + list([[1, S[0]], [2, S[1]]]));
  await wait(200); r = await read();
  check('a source cited twice has one number in both places', r.cites, ['(1)', '(2)', '(1)']);

  // 3. Cut a paragraph that holds a citation and paste it before another: numbers follow the new order.
  await load(`<p>Alpha text ${cite('a', '(1)')}.</p><p>Beta text ${cite('b', '(2)')}.</p><p>Gamma text ${cite('c', '(3)')}.</p>` + list([[1, S[0]], [2, S[1]], [3, S[2]]]));
  await wait(200);
  await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let from = 0, to = 0; let i = 0; e.state.doc.forEach((n, pos) => { if (i === 2) { from = pos; to = pos + n.nodeSize; } i++; }); const node = e.state.doc.nodeAt(from); e.view.dispatch(e.state.tr.delete(from, to).insert(0, node)); });
  await wait(300); r = await read();
  check('moving the Gamma paragraph to the top makes its citation (1)', [r.paras.slice(0, 3), r.cites, r.list], [['Gamma text (1).', 'Alpha text (2).', 'Beta text (3).'], ['(1)', '(2)', '(3)'], ['1. Cy Diaz. ', '2. Ann Lee. ', '3. Bo Chen. ']]);

  // 4. A citation split by bold (two text nodes) is still one citation.
  await load(`<p>Text ${cite('a', '(1)').replace('(1)', '<strong>(</strong>1)')} and ${cite('b', '(2)')}.</p>` + list([[1, S[0]], [2, S[1]]]));
  await wait(200); r = await read();
  check('a citation partly in bold stays one citation', r.cites.length, 3);
  await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let from = 0; e.state.doc.descendants((n, p) => { if (n.isText && n.text.startsWith('Text ')) from = p; return true; }); e.chain().focus().setTextSelection(from + 1).insertContent([{ type: 'text', text: 'X ', marks: [] }]).run(); });
  await wait(200); r = await read();
  check('typing elsewhere leaves it intact', [r.paras[0], r.cites.length], ['TX ext (1) and (2).', 3]);

  // 5. Typing a number in the text next to a citation does not turn it into a citation.
  await load(`<p>Plain ${cite('a', '(1)')}</p>` + list([[1, S[0]]]));
  await wait(200);
  await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; let end = 0; e.state.doc.descendants((n, p) => { if (n.isTextblock && n.textContent.startsWith('Plain')) end = p + n.nodeSize - 1; return true; }); e.chain().focus().setTextSelection(end).insertContent(' and 22').run(); });
  await wait(200); r = await read();
  check('text typed right after a citation is not part of it', [r.cites, r.paras[0]], [['(1)'], 'Plain (1) and 22']);

  // 6. Deleting the whole reference list stops the numbering without errors.
  await load(`<p>Alpha ${cite('a', '(1)')}</p>`);
  await wait(200); r = await read();
  check('a citation with no list is left alone', [r.cites, errs.length], [['(1)'], 0]);

  // 7. Speed: 60 sources, 300 citations, one keystroke.
  const many = Array.from({ length: 60 }, (_, i) => mkSrc(`m${i}`, `Person${i} Name${i}`, `${1990 + (i % 30)}`, `Title ${i}`));
  const body = Array.from({ length: 300 }, (_, i) => `<p>Sentence ${i} ${cite(`m${(i * 7) % 60}`, '(1)')} end.</p>`).join('');
  await load(body + `<h2 data-ref-style="Vancouver">References</h2>` + many.map((s, i) => `<p data-ref='${esc(JSON.stringify(s))}'>${i + 1}. ${s.authors}. ${s.title}.</p>`).join(''));
  await wait(800);
  const ms = await page.evaluate(() => { const e = document.querySelector('.ProseMirror').editor; const t = []; for (let i = 0; i < 20; i++) { const a = performance.now(); e.commands.insertContentAt(2, 'x'); t.push(performance.now() - a); } t.sort((x, y) => x - y); return { median: t[10], worst: t[19] }; });
  console.log(`   keystroke with 300 citations and 60 sources: median ${ms.median.toFixed(1)} ms, worst ${ms.worst.toFixed(1)} ms`);
  check('typing stays fast with 300 citations (median under 30 ms)', ms.median < 30, true);
  r = await read();
  const numbers = r.cites.map((c) => +c.replace(/\D/g, ''));
  check('all 300 citations have a number between 1 and 60', numbers.every((n) => n >= 1 && n <= 60), true);
  check('the 60 list entries are numbered 1..60 in order', r.list.map((t) => parseInt(t, 10)).every((n, i) => n === i + 1), true);

  console.log(`\n${passed} passed, ${failures.length} failed. Page errors: ${JSON.stringify(errs)}`);
  await browser.close(); process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
