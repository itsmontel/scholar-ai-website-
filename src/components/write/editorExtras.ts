import { Extension, Mark, type Editor } from '@tiptap/react';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import { Fragment, type Mark as PmMark, type Node as PmNode } from '@tiptap/pm/model';
import {
  buildContext,
  compareSources,
  formatReference,
  inTextCitation,
  isCiteStyle,
  isNumbered,
  listHeading,
  referenceLabel,
  type CiteContext,
  type CiteStyle,
  type Source,
} from '../../utils/citations';

/**
 * Editor pieces that are not toolbar chrome: the self-building reference
 * list, find and replace, and the print-to-PDF export.
 */

/* ── Reference list ─────────────────────────────────────────────────
   Each reference is an ordinary paragraph that carries its source as a
   data attribute, under a heading that carries the citation style. So the
   list travels inside the saved document, and can be re-sorted or
   re-styled without any separate storage. */
export const RefAttrs = Extension.create({
  name: 'refAttrs',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          refData: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-ref'),
            renderHTML: (attrs: Record<string, unknown>) => (attrs.refData ? { 'data-ref': attrs.refData as string } : {}),
          },
          refStyle: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-ref-style'),
            renderHTML: (attrs: Record<string, unknown>) => (attrs.refStyle ? { 'data-ref-style': attrs.refStyle as string } : {}),
          },
          // The essay's outline (question, thesis, sections), carried on the
          // draft's first block so it is saved with the document.
          planData: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-essay-plan'),
            renderHTML: (attrs: Record<string, unknown>) => (attrs.planData ? { 'data-essay-plan': attrs.planData as string } : {}),
          },
        },
      },
    ];
  },
});

/** Marks an in-text citation with its source and page, so it can be re-written when the style changes. */
export const CiteMark = Mark.create({
  name: 'citeRef',
  inclusive: false,
  addAttributes() {
    return {
      refId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cite'),
        renderHTML: (attrs: Record<string, unknown>) => (attrs.refId ? { 'data-cite': attrs.refId as string } : {}),
      },
      page: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cite-page') || '',
        renderHTML: (attrs: Record<string, unknown>) => (attrs.page ? { 'data-cite-page': attrs.page as string } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: 'span[data-cite]' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', HTMLAttributes, 0]; },
});

/* ── Reading the document ───────────────────────────────────────── */
interface RefPara { pos: number; node: PmNode; source: Source }
interface RefScan {
  style: CiteStyle | null;
  /** The heading plus its reference paragraphs, when the list exists. */
  range: { from: number; to: number } | null;
  /** Where the heading ends and the first reference begins. */
  listFrom: number;
  paras: RefPara[];
}

/** Find the reference list: a heading that carries the style, then the paragraphs that carry sources. */
function scanReferences(doc: PmNode): RefScan {
  const paras: RefPara[] = [];
  let style: CiteStyle | null = null;
  let from = -1;
  let to = -1;
  let listFrom = -1;
  let inList = false;
  doc.forEach((node, pos) => {
    if (node.type.name === 'heading' && node.attrs.refStyle) {
      style = isCiteStyle(node.attrs.refStyle) ? node.attrs.refStyle : 'APA';
      from = pos;
      to = pos + node.nodeSize;
      listFrom = to;
      paras.length = 0;
      inList = true;
      return;
    }
    if (inList && node.type.name === 'paragraph' && node.attrs.refData) {
      try {
        const s = JSON.parse(String(node.attrs.refData)) as Source;
        if (s && typeof s.title === 'string') paras.push({ pos, node, source: s });
      } catch { /* a damaged entry is dropped rather than breaking the list */ }
      to = pos + node.nodeSize;
      return;
    }
    // Anything else ends the list (text the student typed after it is left alone).
    if (inList) inList = false;
  });
  return { style, range: from === -1 ? null : { from, to }, listFrom, paras };
}

export interface RefState {
  sources: Source[];
  style: CiteStyle | null;
  /** The heading plus its reference paragraphs, when the list exists. */
  range: { from: number; to: number } | null;
}

export function readReferences(editor: Editor): RefState {
  const scan = scanReferences(editor.state.doc);
  return { sources: scan.paras.map((p) => p.source), style: scan.style, range: scan.range };
}

/** One in-text citation in the essay. */
interface CiteRun { from: number; to: number; refId: string; page: string; text: string; marks: readonly PmMark[] }

/** Every in-text citation outside the reference list, in reading order. */
function readCitations(doc: PmNode, exclude: { from: number; to: number } | null): CiteRun[] {
  const found: Omit<CiteRun, 'text'>[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const mark = node.marks.find((m) => m.type.name === 'citeRef');
    if (!mark || !mark.attrs.refId) return true;
    if (exclude && pos >= exclude.from && pos < exclude.to) return true;
    const refId = String(mark.attrs.refId);
    const page = String(mark.attrs.page || '');
    const last = found[found.length - 1];
    // A citation split across text nodes (for example by bold) is one citation.
    if (last && last.to === pos && last.refId === refId && last.page === page) last.to = pos + node.nodeSize;
    else found.push({ from: pos, to: pos + node.nodeSize, refId, page, marks: node.marks });
    return true;
  });
  return found.map((r) => ({ ...r, text: doc.textBetween(r.from, r.to) }));
}

/** The ids of the sources in the order they are first cited. */
const firstSeen = (runs: { refId: string }[]) => runs.map((r) => r.refId).filter((id, i, all) => all.indexOf(id) === i);

/** The sources in the order they are first cited in the essay. */
export function citedOrder(editor: Editor): string[] {
  return firstSeen(readCitations(editor.state.doc, readReferences(editor).range));
}

/** The same, as it would be if `id` were cited at the cursor. */
export function citedOrderWith(editor: Editor, id: string): string[] {
  const at = editor.state.selection.from;
  const runs = readCitations(editor.state.doc, readReferences(editor).range);
  const before = runs.filter((r) => r.to <= at).map((r) => r.refId);
  const after = runs.filter((r) => r.to > at).map((r) => r.refId);
  return firstSeen([...before, id, ...after].map((refId) => ({ refId })));
}

/** How many times each source is cited in the essay. */
export function citationCounts(editor: Editor): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of readCitations(editor.state.doc, readReferences(editor).range)) counts.set(r.refId, (counts.get(r.refId) ?? 0) + 1);
  return counts;
}

/* ── Keeping citations in step with the list ────────────────────── */
const SKIP_SYNC = 'wsSkipCiteSync';

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when the citation reads as the one we wrote (apart from its number), so it is ours to update. */
function isManaged(run: CiteRun, source: Source, style: CiteStyle): boolean {
  const marker = 987654321;
  const sample = inTextCitation(source, style, run.page, { numbers: new Map([[source.id, marker]]) });
  return new RegExp(`^${escapeRe(sample).replace(String(marker), '\\d+')}$`).test(run.text);
}

const labelPattern = (style: CiteStyle) => (style === 'IEEE' ? /^\[\d+\]\s/ : /^\d+\.\s/);

/** The reference paragraph with its number put right (or added), keeping whatever else the student has done to it. */
function withLabel(node: PmNode, label: string, style: CiteStyle): PmNode {
  const m = node.textContent.match(labelPattern(style));
  const rest = node.content.cut(m ? m[0].length : 0);
  return node.type.create(node.attrs, Fragment.from(node.type.schema.text(label)).append(rest), node.marks);
}

type SyncEdit =
  | { kind: 'text'; from: number; to: number; text: string; marks: readonly PmMark[] }
  | { kind: 'detach'; from: number; to: number }
  | { kind: 'list'; from: number; to: number; nodes: PmNode[] };

/**
 * IEEE and Vancouver number sources by when they are first cited, so any edit
 * can change every number. This makes the in-text citations and the list agree
 * with the text as it now stands, or returns null when they already do.
 * A citation the student has typed into by hand stops being managed: it is left
 * exactly as they wrote it.
 */
export function syncNumbered(state: EditorState): Transaction | null {
  const scan = scanReferences(state.doc);
  if (!scan.style || !scan.range || !isNumbered(scan.style) || scan.paras.length === 0) return null;
  const style = scan.style;
  const sources = scan.paras.map((p) => p.source);
  const byId = new Map(sources.map((x) => [x.id, x]));
  const runs = readCitations(state.doc, scan.range);
  const ctx = buildContext(sources, style, firstSeen(runs));
  const markType = state.schema.marks.citeRef;
  const edits: SyncEdit[] = [];

  for (const run of runs) {
    const source = byId.get(run.refId);
    if (!source) continue;
    const want = inTextCitation(source, style, run.page, ctx);
    if (run.text === want) continue;
    if (isManaged(run, source, style)) edits.push({ kind: 'text', from: run.from, to: run.to, text: want, marks: run.marks });
    else edits.push({ kind: 'detach', from: run.from, to: run.to });
  }

  // The list: in citation order, each entry carrying its number.
  const number = (id: string) => ctx.numbers?.get(id) ?? 0;
  const wanted = [...scan.paras].sort((a, b) => number(a.source.id) - number(b.source.id));
  const inOrder = wanted.every((p, i) => p === scan.paras[i]);
  const labelled = scan.paras.every((p) => p.node.textContent.startsWith(referenceLabel(style, number(p.source.id))));
  if (!inOrder || !labelled) {
    edits.push({
      kind: 'list',
      from: scan.listFrom,
      to: scan.range.to,
      nodes: wanted.map((p) => withLabel(p.node, referenceLabel(style, number(p.source.id)), style)),
    });
  }

  if (edits.length === 0) return null;
  const tr = state.tr;
  // From the end of the document, so earlier positions stay valid as lengths change.
  for (const e of edits.sort((a, b) => b.from - a.from)) {
    if (e.kind === 'text') tr.replaceWith(e.from, e.to, state.schema.text(e.text, e.marks));
    else if (e.kind === 'detach') tr.removeMark(e.from, e.to, markType);
    else tr.replaceWith(e.from, e.to, Fragment.fromArray(e.nodes));
  }
  return tr;
}

/** Keeps IEEE and Vancouver numbers right as the essay is edited, inside the same undo step as the edit. */
export const NumberedCitations = Extension.create({
  name: 'numberedCitations',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('numberedCitations'),
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((t) => t.docChanged) || trs.some((t) => t.getMeta(SKIP_SYNC))) return null;
          return syncNumbered(state);
        },
      }),
    ];
  },
});

/**
 * Re-write in-text citations in `style`. With `onlyIds`, only those sources'
 * citations (used when adding or removing a source changes another source's
 * a/b letter). Returns how many were updated.
 */
export function restyleInText(editor: Editor, sources: Source[], style: CiteStyle, onlyIds?: Set<string>): number {
  const { range } = readReferences(editor);
  const runs = readCitations(editor.state.doc, range);
  const ctx = buildContext(sources, style, firstSeen(runs));
  const tr = editor.state.tr;
  let changed = 0;
  // From the end, so earlier positions stay valid as lengths change.
  for (const c of [...runs].reverse()) {
    if (onlyIds && !onlyIds.has(c.refId)) continue;
    const source = sources.find((s) => s.id === c.refId);
    if (!source) continue;
    const text = inTextCitation(source, style, c.page, ctx);
    if (c.text === text) continue;
    tr.replaceWith(c.from, c.to, editor.schema.text(text, c.marks));
    changed++;
  }
  // The list is rewritten straight after, so the numbered styles must not step in between.
  if (changed) editor.view.dispatch(tr.setMeta(SKIP_SYNC, true));
  return changed;
}

/** After sources are added or removed: update the citations whose a/b letter (or MLA short title) changed. */
export function refreshAuthorDate(editor: Editor, before: Source[], after: Source[], style: CiteStyle) {
  if (isNumbered(style)) return;
  const order = citedOrder(editor);
  const was = buildContext(before, style, order);
  const now = buildContext(after, style, order);
  const ids = new Set<string>();
  for (const s of after) {
    if ((was.suffixes?.get(s.id) ?? '') !== (now.suffixes?.get(s.id) ?? '') || !!was.needTitle?.has(s.id) !== !!now.needTitle?.has(s.id)) ids.add(s.id);
  }
  if (ids.size) restyleInText(editor, after, style, ids);
}

/** Rewrite the reference list in `style`: alphabetical, or in citation order with numbers. An empty list removes the section. */
export function writeReferences(editor: Editor, sources: Source[], style: CiteStyle) {
  const { range } = readReferences(editor);
  const ctx: CiteContext = buildContext(sources, style, firstSeen(readCitations(editor.state.doc, range)));
  const number = (id: string) => ctx.numbers?.get(id) ?? 0;
  const sorted = [...sources].sort(isNumbered(style) ? (a, b) => number(a.id) - number(b.id) : compareSources);
  const nodes = sorted.length === 0 ? [] : [
    { type: 'heading', attrs: { level: 2, refStyle: style }, content: [{ type: 'text', text: listHeading(style) }] },
    ...sorted.map((s) => {
      const label = referenceLabel(style, number(s.id));
      return {
        type: 'paragraph',
        attrs: { refData: JSON.stringify(s) },
        content: [
          ...(label ? [{ type: 'text', text: label }] : []),
          ...formatReference(s, style, ctx).map((seg) => ({ type: 'text', text: seg.text, ...(seg.italic ? { marks: [{ type: 'italic' }] } : {}) })),
        ],
      };
    }),
  ];
  const chain = editor.chain();
  if (range) {
    if (nodes.length) chain.insertContentAt(range, nodes, { updateSelection: false });
    else chain.deleteRange(range);
  } else if (nodes.length) {
    chain.insertContentAt(editor.state.doc.content.size, nodes, { updateSelection: false });
  }
  chain.run();
}

/** Put an in-text citation at the cursor, with a space before it when the text runs straight on. `sources` includes `source`. */
export function insertInText(editor: Editor, source: Source, sources: Source[], style: CiteStyle, page: string) {
  const { from } = editor.state.selection;
  const before = from > 1 ? editor.state.doc.textBetween(from - 1, from, '\n') : '';
  const ctx = buildContext(sources, style, citedOrderWith(editor, source.id));
  const text = inTextCitation(source, style, page, ctx);
  editor.chain().focus().insertContent([
    ...(before && !/\s/.test(before) ? [{ type: 'text', text: ' ' }] : []),
    { type: 'text', text, marks: [{ type: 'citeRef', attrs: { refId: source.id, page: page.trim() } }] },
  ]).run();
}

/** Delete every in-text citation of a source, and the space it leaves behind. Returns how many were removed. */
export function removeCitations(editor: Editor, refId: string): number {
  const { range } = readReferences(editor);
  const runs = readCitations(editor.state.doc, range).filter((r) => r.refId === refId);
  if (runs.length === 0) return 0;
  const tr = editor.state.tr;
  for (const r of [...runs].reverse()) {
    let from = r.from;
    const to = r.to;
    const doc = editor.state.doc;
    const prev = from > 0 ? doc.textBetween(Math.max(0, from - 1), from, '\n', '\n') : '';
    const next = to < doc.content.size ? doc.textBetween(to, Math.min(doc.content.size, to + 1), '\n', '\n') : '';
    // "as shown (Lull, 1995) by" → "as shown by"; "as shown (Lull, 1995)." → "as shown."
    if (/\s/.test(prev) && (next === '' || next === '\n' || /[\s.,;:!?)]/.test(next))) from -= 1;
    tr.delete(from, to);
  }
  editor.view.dispatch(tr);
  return runs.length;
}

/* ── Find and replace ───────────────────────────────────────────── */
export interface Match { from: number; to: number }

/** Every match of `query`, as document positions. A match never spans two paragraphs. */
export function findMatches(editor: Editor, query: string, matchCase: boolean): Match[] {
  const out: Match[] = [];
  const q = matchCase ? query : query.toLowerCase();
  if (!q) return out;
  editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // Build the block's text with a position for every character; an image
    // or line break takes one position and can never be part of a match.
    let text = '';
    const at: number[] = [];
    node.forEach((child, offset) => {
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) { text += child.text[i]; at.push(pos + 1 + offset + i); }
      } else {
        text += '￼';
        at.push(pos + 1 + offset);
      }
    });
    const hay = matchCase ? text : text.toLowerCase();
    let i = hay.indexOf(q);
    while (i !== -1) {
      out.push({ from: at[i], to: at[i + q.length - 1] + 1 });
      i = hay.indexOf(q, i + q.length);
    }
    return false;
  });
  return out;
}

export function selectMatch(editor: Editor, m: Match) {
  editor.chain().setTextSelection(m).scrollIntoView().run();
}

export function replaceMatch(editor: Editor, m: Match, text: string) {
  editor.chain().insertContentAt(m, text ? { type: 'text', text } : '', { updateSelection: true }).run();
}

/** Replace every match in one undo step. Works from the end so earlier positions stay valid. */
export function replaceAll(editor: Editor, matches: Match[], text: string): number {
  if (matches.length === 0) return 0;
  const tr = editor.state.tr;
  [...matches].sort((a, b) => b.from - a.from).forEach((m) => {
    if (text) tr.insertText(text, m.from, m.to);
    else tr.delete(m.from, m.to);
  });
  editor.view.dispatch(tr);
  return matches.length;
}

/* ── PDF ────────────────────────────────────────────────────────── */
/**
 * Open the browser's print dialog on a clean copy of the essay, where
 * "Save as PDF" produces the file. The browser does the layout, so fonts,
 * tables, images and every alphabet come out as they look in the editor.
 */
export function printAsPdf(html: string, title: string, fontCss: string, sizePt: number, lineHeight: number) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); throw new Error('Could not open the print view.'); }
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { margin: 2.54cm; }
    body { margin: 0; font-family: ${fontCss || 'Calibri, Arial, sans-serif'}; font-size: ${sizePt}pt; line-height: ${lineHeight}; color: #000; }
    h1 { font-size: 1.75em; margin: 0 0 0.5em; } h2 { font-size: 1.3em; margin: 1.1em 0 0.4em; } h3 { font-size: 1.1em; margin: 1em 0 0.3em; }
    h1, h2, h3 { line-height: 1.25; break-after: avoid; }
    p { margin: 0 0 0.75em; } ul, ol { margin: 0 0 0.75em; padding-left: 1.6em; } li > p { margin: 0; }
    blockquote { margin: 0.8em 0; padding-left: 1em; border-left: 3px solid #999; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; } td, th { border: 1px solid #777; padding: 5px 8px; vertical-align: top; text-align: left; } th { background: #eee; }
    img { max-width: 100%; height: auto; } a { color: #1155CC; }
    mark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    p[data-ref] { padding-left: 1.27cm; text-indent: -1.27cm; }
  </style></head><body>${html}</body></html>`);
  doc.close();
  const done = () => window.setTimeout(() => frame.remove(), 500);
  const win = frame.contentWindow;
  if (!win) { frame.remove(); throw new Error('Could not open the print view.'); }
  win.addEventListener('afterprint', done);
  // Give images and fonts a moment to load before the dialog measures the pages.
  window.setTimeout(() => { win.focus(); win.print(); }, 250);
}

/* ── Outline kept in the draft ──────────────────────────────────── */
/** The outline stored in the draft, as the JSON it was saved as, or null. */
export function readPlanData(editor: Editor): string | null {
  let found: string | null = null;
  editor.state.doc.forEach((node) => {
    if (!found && typeof node.attrs?.planData === 'string' && node.attrs.planData) found = node.attrs.planData;
  });
  return found;
}

/**
 * Keep exactly one copy of the outline on the draft's first block (or
 * none when `json` is null). Not an undo step, and a no-op when the draft
 * already matches. Returns true when the document was changed.
 */
export function syncPlanData(editor: Editor, json: string | null): boolean {
  const tr = editor.state.tr;
  let changed = false;
  let index = 0;
  editor.state.doc.forEach((node, pos) => {
    const holds = node.type.spec.attrs && 'planData' in node.type.spec.attrs;
    if (!holds) { index++; return; }
    const want = index === 0 ? json : null;
    if ((node.attrs.planData ?? null) !== want) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, planData: want });
      changed = true;
    }
    index++;
  });
  if (changed) editor.view.dispatch(tr.setMeta('addToHistory', false));
  return changed;
}
