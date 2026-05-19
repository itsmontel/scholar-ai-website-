/* ═══════════════════════════════════════════════════════════════
   AnalyzerHighlights — a TipTap extension that decorates the editor
   with coloured marks for each analyzer annotation, and surfaces a
   click handler so the side panel can react.

   Why a Decoration plugin (not a Mark)?
     • Annotations are a *view-only* overlay. They don't belong in
       the saved document — they regenerate every time the user
       hits "Analyze" — so storing them as marks would pollute
       getHTML() and confuse downstream consumers.
     • Decorations live entirely in plugin state; the underlying
       doc is untouched. We can swap the whole annotation set in
       one transaction, no diff needed.
     • Click handling routes through the plugin's `handleClick`
       hook rather than per-element listeners, so we get correct
       behaviour even if the DOM gets re-rendered by TipTap.

   Position mapping — the analyzer returns startIndex/endIndex as
   PLAIN-TEXT character offsets (matches the string we sent in via
   `editor.getText()`). ProseMirror positions count nodes too, so
   we walk the doc once per render and convert.
   ═══════════════════════════════════════════════════════════════ */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';

export type AnnotationType = 'strong' | 'improve' | 'concern';

export interface AnnotatorAnnotation {
  id: string;
  type: AnnotationType;
  startIndex: number;
  endIndex: number;
  /** Original matched text — used as a fallback if positions drift. */
  text: string;
  /** Optional — analyzer comment, surfaced as the hover tooltip body. */
  comment?: string;
  /** Optional — analyzer suggestion, surfaced as the tooltip footer + Apply target. */
  suggestion?: string;
  /** Free tier — true when this annotation sits in the locked
   *  (second-half) region: comment blurred, suggestion hidden, Apply
   *  gated. Computed by the host from document position. */
  locked?: boolean;
}

export interface AnalyzerHighlightsOptions {
  /** Current annotation set. Empty array clears all decorations. */
  annotations: AnnotatorAnnotation[];
  /** Highlighted annotation id (e.g. user clicked a card in the panel). */
  selectedAnnotationId: string | null;
  /** Fires when the user clicks any decorated span in the editor. */
  onAnnotationClick?: (annotationId: string) => void;
  /** Fires when the user hovers over a decorated span (with bounding rect for tooltip positioning). */
  onAnnotationHover?: (annotationId: string | null, rect: DOMRect | null) => void;
  /** Free-tier divider: a "you've seen 50% — upgrade" marker is
   *  injected into the doc at this fraction (e.g. 0.5 = halfway).
   *  Highlights are NOT hidden — the second half stays visible but
   *  locked (handled per-annotation via `annotation.locked`).
   *  null/undefined = no divider (paid). */
  previewRatio?: number | null;
  /** Click handler for the divider's "Upgrade to Pro" button. */
  onUpgrade?: () => void;
}

const PLUGIN_KEY = new PluginKey<{
  annotations: AnnotatorAnnotation[];
  selectedAnnotationId: string | null;
  decorations: DecorationSet;
}>('writescholar-analyzer-highlights');

/** Tailwind-y class lookup per type. Inline the ring colour because
 *  the selected state needs to *win* over the base mark colour. */
function classFor(type: AnnotationType, selected: boolean): string {
  const base =
    type === 'strong'
      ? 'bg-[#E5F8D0]/60 dark:bg-[#58CC02]/15 underline decoration-[#58CC02] decoration-2 underline-offset-4 cursor-pointer'
      : type === 'improve'
        ? 'bg-[#FFF4E0]/70 dark:bg-[#FF9600]/15 underline decoration-[#FF9600] decoration-2 underline-offset-4 cursor-pointer'
        : 'bg-[#FFE8E8]/70 dark:bg-[#FF4B4B]/15 underline decoration-[#FF4B4B] decoration-2 underline-offset-4';
  return selected ? `${base} ring-2 ring-[#A560E8] ring-offset-1 ring-offset-white dark:ring-offset-stone-900 rounded` : base;
}

/**
 * Walks the document once and builds a sorted array of
 *   { node, pmFrom, plainFrom, plainTo }
 * spans for every text node, plus the running plain-text offset
 * accounting for TipTap's `getText()` block-separator (default `\n\n`).
 *
 * Lets us map plain-text offsets to PM positions in O(log n) per
 * lookup instead of re-walking for every annotation.
 */
function buildPlainOffsetIndex(doc: PmNode, blockSep = '\n\n') {
  const spans: { pmFrom: number; pmTo: number; plainFrom: number; plainTo: number }[] = [];
  let plainCursor = 0;
  let lastBlockStart: number | null = null;

  doc.descendants((node, pos) => {
    if (node.isText) {
      const text = node.text ?? '';
      const pmFrom = pos;
      const pmTo = pos + text.length;
      spans.push({ pmFrom, pmTo, plainFrom: plainCursor, plainTo: plainCursor + text.length });
      plainCursor += text.length;
      return false;
    }
    if (node.isBlock) {
      // Insert the block separator BEFORE every block after the first
      // one — mirrors the way `node.textBetween(..., blockSep)` joins.
      if (lastBlockStart !== null && pos > lastBlockStart) {
        plainCursor += blockSep.length;
      }
      lastBlockStart = pos;
      return true;
    }
    return true;
  });
  return spans;
}

/** Map a plain-text offset → ProseMirror position via the precomputed index. */
function plainToPm(spans: ReturnType<typeof buildPlainOffsetIndex>, plainOffset: number): number | null {
  // Binary search for the span that contains `plainOffset`.
  let lo = 0;
  let hi = spans.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = spans[mid];
    if (plainOffset < s.plainFrom) hi = mid - 1;
    else if (plainOffset > s.plainTo) lo = mid + 1;
    else return s.pmFrom + (plainOffset - s.plainFrom);
  }
  return null;
}

function decorationsFromAnnotations(
  doc: PmNode,
  annotations: AnnotatorAnnotation[],
  selectedAnnotationId: string | null,
  previewRatio: number | null = null,
  onUpgrade?: () => void,
): DecorationSet {
  if (!annotations.length) return DecorationSet.empty;
  const spans = buildPlainOffsetIndex(doc);
  // Total plain length of the CURRENT doc — used only to place the
  // free-tier "50% preview" divider. Highlights are NOT hidden; the
  // second half stays visible but locked per-annotation downstream.
  const totalPlain = spans.length ? spans[spans.length - 1].plainTo : 0;
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const decorations: Decoration[] = [];
  for (const ann of annotations) {
    // Free tier: second-half ("locked") annotations get NO inline
    // highlight in the editor. They still appear in the side panel
    // (blurred) and the 50% divider below marks the boundary.
    if (ann.locked) continue;
    let from = plainToPm(spans, ann.startIndex);
    let to = plainToPm(spans, ann.endIndex);
    // The stored offsets drift: nested blocks (lists / blockquotes)
    // over-count block separators, analyzer-vs-editor whitespace can
    // differ, and any edit shifts everything after it. So only trust
    // the offset range when the text it covers EXACTLY matches the
    // annotation snippet; otherwise relocate by searching for the
    // snippet itself (the source of truth for what to highlight).
    // Without this the highlight lands short or misses part of the
    // span entirely.
    let trusted = false;
    if (from != null && to != null && to > from) {
      const here = doc.textBetween(from, Math.min(to, doc.content.size), '\n\n');
      const a = norm(here);
      const b = norm(ann.text || '');
      trusted = !!b && a === b;
    }
    if (!trusted && ann.text) {
      const found = findTextRangeInDoc(doc, ann.text, from ?? undefined);
      if (found) {
        from = found.from;
        to = found.to;
      }
    }
    if (from == null || to == null || to <= from) continue;
    decorations.push(
      Decoration.inline(from, Math.min(to, doc.content.size), {
        class: classFor(ann.type, ann.id === selectedAnnotationId),
        // Stash the id on the DOM so handleClick can recover it
        // without needing a separate per-decoration callback table.
        'data-annotation-id': ann.id,
      }),
    );
  }

  // Free-tier "you've reached 50%" divider, injected into the doc at
  // the preview boundary. Highlights past it stay visible but locked.
  if (
    previewRatio != null &&
    previewRatio > 0 &&
    previewRatio < 1 &&
    totalPlain > 0
  ) {
    const cut = Math.floor(totalPlain * previewRatio);
    let markerPos = plainToPm(spans, cut);
    if (markerPos == null) {
      const s = spans.find((sp) => sp.plainFrom >= cut);
      markerPos = s ? s.pmFrom : spans.length ? spans[spans.length - 1].pmTo : null;
    }
    if (markerPos != null) {
      const pos = Math.max(0, Math.min(markerPos, doc.content.size));
      decorations.push(
        Decoration.widget(
          pos,
          () => {
            const wrap = document.createElement('div');
            wrap.contentEditable = 'false';
            wrap.className = 'ws-preview-divider my-7 select-none';
            const inner = document.createElement('div');
            inner.className =
              'relative rounded-2xl border-2 border-dashed border-[#A560E8]/50 bg-[#F3EAFF]/70 dark:bg-[#A560E8]/10 px-5 py-4 text-center';
            const h = document.createElement('p');
            h.className =
              'text-[13px] font-extrabold text-[#7733B5] dark:text-[#C9A0F0]';
            h.textContent = "You've reached the 50% free preview";
            const sub = document.createElement('p');
            sub.className =
              'mt-1 text-[12px] font-bold text-stone-500 dark:text-stone-400';
            sub.textContent =
              'Feedback and one-click fixes for the rest of your paper are locked. Upgrade to Pro to unlock them all.';
            inner.appendChild(h);
            inner.appendChild(sub);
            if (onUpgrade) {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.textContent = 'Upgrade to Pro';
              btn.className =
                'mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all';
              btn.addEventListener('mousedown', (e) => e.preventDefault());
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpgrade();
              });
              inner.appendChild(btn);
            }
            wrap.appendChild(inner);
            return wrap;
          },
          { side: 1, key: 'ws-preview-divider' },
        ),
      );
    }
  }

  return DecorationSet.create(doc, decorations);
}

export const AnalyzerHighlights = Extension.create<AnalyzerHighlightsOptions>({
  name: 'analyzerHighlights',
  addOptions() {
    return {
      annotations: [],
      selectedAnnotationId: null,
      onAnnotationClick: undefined,
      previewRatio: null,
      onUpgrade: undefined,
    };
  },
  addProseMirrorPlugins() {
    const optsRef = this.options;
    return [
      new Plugin({
        key: PLUGIN_KEY,
        state: {
          init: (_, { doc }) => ({
            annotations: optsRef.annotations,
            selectedAnnotationId: optsRef.selectedAnnotationId,
            decorations: decorationsFromAnnotations(doc, optsRef.annotations, optsRef.selectedAnnotationId, optsRef.previewRatio ?? null, optsRef.onUpgrade),
          }),
          apply(tr, prev) {
            // Allow imperative refresh via meta — we trigger this
            // from `setAnalyzerAnnotations()` below.
            const meta = tr.getMeta(PLUGIN_KEY) as { annotations?: AnnotatorAnnotation[]; selectedAnnotationId?: string | null } | undefined;
            if (meta) {
              const next = {
                annotations: meta.annotations ?? prev.annotations,
                selectedAnnotationId: meta.selectedAnnotationId !== undefined ? meta.selectedAnnotationId : prev.selectedAnnotationId,
              };
              return {
                ...next,
                decorations: decorationsFromAnnotations(tr.doc, next.annotations, next.selectedAnnotationId, optsRef.previewRatio ?? null, optsRef.onUpgrade),
              };
            }
            // Doc changed → re-map decorations against the new doc.
            if (tr.docChanged) {
              return {
                ...prev,
                decorations: decorationsFromAnnotations(tr.doc, prev.annotations, prev.selectedAnnotationId, optsRef.previewRatio ?? null, optsRef.onUpgrade),
              };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            return PLUGIN_KEY.getState(state)?.decorations ?? null;
          },
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement | null;
            const el = target?.closest('[data-annotation-id]') as HTMLElement | null;
            if (!el) return false;
            const id = el.getAttribute('data-annotation-id');
            if (id && optsRef.onAnnotationClick) {
              optsRef.onAnnotationClick(id);
            }
            // NEVER consume the click. Returning true here used to
            // swallow the event so ProseMirror never placed the
            // caret — which made annotated text feel un-editable.
            // Return false so the click also positions the cursor
            // and the user can just type.
            return false;
          },
          // Hover tooltip: emit (id, rect) when the cursor enters
          // a decoration; emit (null, null) when it leaves. The
          // parent renders the actual tooltip element.
          handleDOMEvents: {
            mouseover(_view, event) {
              const target = event.target as HTMLElement | null;
              const el = target?.closest('[data-annotation-id]') as HTMLElement | null;
              if (!el) return false;
              const id = el.getAttribute('data-annotation-id');
              if (id && optsRef.onAnnotationHover) {
                optsRef.onAnnotationHover(id, el.getBoundingClientRect());
              }
              return false;
            },
            mouseout(_view, event) {
              const target = event.target as HTMLElement | null;
              const el = target?.closest('[data-annotation-id]') as HTMLElement | null;
              if (!el) return false;
              // Only clear if the relatedTarget is OUTSIDE the same span
              // (otherwise mousing over child text fires false leaves).
              const next = event.relatedTarget as Node | null;
              if (next && el.contains(next)) return false;
              if (optsRef.onAnnotationHover) {
                optsRef.onAnnotationHover(null, null);
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

/**
 * Imperative helper — push a new annotation set into the plugin
 * without recreating the editor. Call from your component when the
 * analyzer response lands. The plugin re-builds its decoration set
 * via the meta path; the doc itself is untouched.
 */
export function setAnalyzerAnnotations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any,
  annotations: AnnotatorAnnotation[],
  selectedAnnotationId: string | null = null,
) {
  if (!editor || editor.isDestroyed) return;
  const tr = editor.state.tr.setMeta(PLUGIN_KEY, { annotations, selectedAnnotationId });
  editor.view.dispatch(tr);
}

/**
 * Locate a literal text string in the current doc and return its
 * ProseMirror range. Used both for revert (find the replacement we
 * inserted) and as the scroll fallback (find the annotation's
 * snippet when its stored offsets have drifted after edits).
 *
 * `nearPmFrom` biases selection toward the occurrence closest to a
 * known position — matters when the same phrase appears twice.
 */
function findTextRangeInDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  search: string,
  nearPmFrom?: number,
): { from: number; to: number } | null {
  const needle = (search ?? '').trim();
  if (!needle) return null;
  const spans = buildPlainOffsetIndex(doc);
  // Reconstruct the plain text the SAME way buildPlainOffsetIndex
  // counts it (text nodes joined, `\n\n` between blocks) so plain
  // indices line up with the span table.
  let plain = '';
  let lastBlockStart: number | null = null;
  doc.descendants((node: { isText: boolean; text?: string; isBlock: boolean }, pos: number) => {
    if (node.isText) { plain += node.text ?? ''; return false; }
    if (node.isBlock) {
      if (lastBlockStart !== null && pos > lastBlockStart) plain += '\n\n';
      lastBlockStart = pos;
      return true;
    }
    return true;
  });

  // Collect occurrences as { index, length }. Try an exact match
  // first; if none, retry with a whitespace-tolerant regex so a
  // snippet that differs from the editor copy only by spacing or
  // line breaks still resolves (otherwise its highlight silently
  // vanishes / clips). Then pick the hit nearest nearPmFrom.
  const hits: { index: number; length: number }[] = [];
  let idx = plain.indexOf(needle);
  while (idx !== -1) {
    hits.push({ index: idx, length: needle.length });
    idx = plain.indexOf(needle, idx + 1);
  }
  if (hits.length === 0) {
    const flexible = needle
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    try {
      const re = new RegExp(flexible, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(plain)) !== null) {
        hits.push({ index: m.index, length: m[0].length });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    } catch {
      /* malformed regex — fall through to "not found" */
    }
  }
  if (hits.length === 0) return null;

  let best = hits[0];
  if (nearPmFrom != null && hits.length > 1) {
    let bestDist = Infinity;
    for (const h of hits) {
      const pm = plainToPm(spans, h.index);
      if (pm == null) continue;
      const dist = Math.abs(pm - nearPmFrom);
      if (dist < bestDist) { bestDist = dist; best = h; }
    }
  }
  const from = plainToPm(spans, best.index);
  const to = plainToPm(spans, best.index + best.length);
  if (from == null || to == null || to <= from) return null;
  return { from, to };
}

/**
 * Scroll the editor so the annotation's span is centred in view.
 *
 * Reliability strategy (the prior version sometimes did nothing):
 *   1. Map the stored plain offsets → PM position.
 *   2. Verify the text actually at that range loosely matches the
 *      annotation snippet. If the user edited the doc, offsets
 *      drift and the old code silently scrolled to the wrong place
 *      (or `from` was null and it bailed).
 *   3. On mismatch / null, fall back to a literal text search for
 *      `annotation.text` — robust to edits above the span.
 *   4. Scroll the actual DOM element with `block: 'center'` rather
 *      than relying on ProseMirror's `scrollIntoView()` which only
 *      fires when the position is already off-screen and needs the
 *      editor focused.
 */
export function scrollToAnnotation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any,
  annotation: AnnotatorAnnotation,
) {
  if (!editor || editor.isDestroyed) return;
  const doc = editor.state.doc;
  const spans = buildPlainOffsetIndex(doc);

  let from = plainToPm(spans, annotation.startIndex);
  const offTo = plainToPm(spans, annotation.endIndex);

  // Validate: does the text at the mapped range still match?
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  let valid = false;
  if (from != null && offTo != null && offTo > from) {
    const here = doc.textBetween(from, Math.min(offTo, doc.content.size), '\n\n');
    valid = !!annotation.text && norm(here).includes(norm(annotation.text).slice(0, 24));
  }
  if (!valid) {
    const found = findTextRangeInDoc(doc, annotation.text, from ?? undefined);
    if (found) from = found.from;
  }
  if (from == null) return;

  const pos = Math.max(1, Math.min(from, doc.content.size - 1));
  try {
    const domAt = editor.view.domAtPos(pos);
    const node = domAt?.node as Node | undefined;
    const el = node
      ? (node.nodeType === 3 ? (node.parentElement as HTMLElement | null) : (node as HTMLElement))
      : null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  } catch {
    /* fall through to PM scroll */
  }
  editor.commands.setTextSelection({ from: pos, to: pos });
  editor.commands.scrollIntoView();
}

/**
 * Replace the annotation's span with clean replacement prose
 * (fetched from /api/analysis/inline-revision — NOT the advisory
 * `suggestion` field). Returns `{ ok, originalText }` so the
 * caller can stash the original for a later revert.
 *
 * Range resolution mirrors scrollToAnnotation: try stored offsets,
 * validate, fall back to a literal text search for the snippet so
 * edits above the span don't make us splice the wrong place.
 */
export function applyAnnotationRevision(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any,
  annotation: AnnotatorAnnotation,
  replacement: string,
): { ok: boolean; originalText: string } {
  if (!editor || editor.isDestroyed) return { ok: false, originalText: '' };
  const clean = (replacement ?? '').trim();
  if (!clean) return { ok: false, originalText: '' };
  const doc = editor.state.doc;
  const spans = buildPlainOffsetIndex(doc);

  let from = plainToPm(spans, annotation.startIndex);
  let to = plainToPm(spans, annotation.endIndex);
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  let valid = false;
  if (from != null && to != null && to > from) {
    const here = doc.textBetween(from, Math.min(to, doc.content.size), '\n\n');
    valid = !!annotation.text && norm(here) === norm(annotation.text);
  }
  if (!valid) {
    const found = findTextRangeInDoc(doc, annotation.text, from ?? undefined);
    if (!found) return { ok: false, originalText: '' };
    from = found.from;
    to = found.to;
  }
  if (from == null || to == null || to <= from) return { ok: false, originalText: '' };
  const safeTo = Math.min(to, doc.content.size);
  const originalText = doc.textBetween(from, safeTo, '\n\n');
  // Plain-text replace: drop any inline marks in the original span
  // (italic / link) — same behaviour as accepting a Word/Docs
  // tracked-change. Triggers a normal transaction → autosave fires.
  editor.chain().focus().insertContentAt({ from, to: safeTo }, clean).run();
  return { ok: true, originalText };
}

/**
 * Locate a span by anchoring on its first + last few words. Survives
 * edits *inside* the revision (the common reason an exact search
 * fails) as long as the start and end are roughly intact. Reuses
 * findTextRangeInDoc so there's no position-mapping duplication.
 */
function findRangeByAnchors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  text: string,
): { from: number; to: number } | null {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 6) return null; // too short to anchor safely
  const k = Math.min(6, Math.max(3, Math.floor(words.length / 4)));
  const prefix = words.slice(0, k).join(' ');
  const suffix = words.slice(-k).join(' ');
  const p = findTextRangeInDoc(doc, prefix);
  if (!p) return null;
  const s = findTextRangeInDoc(doc, suffix, p.to);
  if (!s || s.to <= p.from) return null;
  return { from: p.from, to: s.to };
}

/**
 * Undo a previously-applied revision: find the inserted replacement
 * and swap the original back.
 *   1. Exact text search (handles edits *elsewhere* — positions
 *      shift but the inserted phrase is intact).
 *   2. Prefix/suffix anchor (handles edits *inside* the revision).
 * Returns false only if neither can locate it; the caller still
 * resets the UI so the user is never stuck.
 */
export function revertAnnotationRevision(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any,
  replacementText: string,
  originalText: string,
): boolean {
  if (!editor || editor.isDestroyed) return false;
  const doc = editor.state.doc;
  const found = findTextRangeInDoc(doc, replacementText) || findRangeByAnchors(doc, replacementText);
  if (!found) return false;
  editor.chain().focus().insertContentAt({ from: found.from, to: found.to }, originalText).run();
  return true;
}
