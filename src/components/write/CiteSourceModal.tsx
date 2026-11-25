import { useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { BTN_GREEN, BTN_WHITE, FONT } from '../landing/webStyle';
import {
  CITE_STYLES,
  authorProblem,
  buildContext,
  compareSources,
  emptySource,
  formatReference,
  inTextCitation,
  isNumbered,
  newSourceId,
  referenceLabel,
  sameSource,
  sourceProblem,
  styleNote,
  titleNote,
  type CiteStyle,
  type Source,
  type SourceKind,
} from '../../utils/citations';
import {
  citationCounts,
  citedOrder,
  citedOrderWith,
  insertInText,
  readReferences,
  refreshAuthorDate,
  removeCitations,
  restyleInText,
  writeReferences,
} from './editorExtras';

/**
 * Cite a source the student has read.
 *
 * They type its details; this formats the in-text citation and the
 * reference, puts the citation at the cursor and keeps the reference list at
 * the end of the essay in order. There is no source search here on purpose:
 * nothing is suggested, so nothing can be invented.
 */
export const CITE_STYLE_KEY = 'writescholar_editor_citation_style';

const KINDS: { key: SourceKind; label: string }[] = [
  { key: 'book', label: 'Book' },
  { key: 'journal', label: 'Journal article' },
  { key: 'website', label: 'Web page' },
];
const field = 'min-h-[46px] w-full rounded-[14px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-3.5 text-[15px] font-bold text-stone-900 placeholder:font-semibold placeholder:text-stone-400 focus:border-[#A560E8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50';
const label = 'mb-1 block text-[13px] font-black text-stone-700 dark:text-stone-200';
const help = 'm-0 mt-1 text-[13px] font-bold leading-[1.4] text-stone-500 dark:text-stone-400';
const chip = (on: boolean) =>
  `min-h-[44px] rounded-full border-2 border-b-4 px-4 text-[14.5px] transition-all active:translate-y-0.5 active:border-b-2 ${
    on ? 'border-[#8A48C7] bg-[#A560E8] font-black text-white' : 'border-[#E4D4F8] bg-[#F7F1FF] font-extrabold text-stone-900 hover:border-[#C9A0F0] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
  }`;

/** A stand-in id for the source being typed, so its number and letter can be previewed. */
const NEW_ID = '__new__';

function Reference({ source, style, ctx }: { source: Source; style: CiteStyle; ctx: ReturnType<typeof buildContext> }) {
  const n = ctx.numbers?.get(source.id);
  return (
    <>
      {isNumbered(style) && n !== undefined ? <span className="font-black">{referenceLabel(style, n)}</span> : null}
      {formatReference(source, style, ctx).map((seg, i) => (seg.italic ? <em key={i}>{seg.text}</em> : <span key={i}>{seg.text}</span>))}
    </>
  );
}

export default function CiteSourceModal({ editor, defaultStyle, onClose }: { editor: Editor; defaultStyle: CiteStyle; onClose: () => void }) {
  const existing = useMemo(() => readReferences(editor), [editor]);
  const [sources, setSources] = useState<Source[]>(existing.sources);
  const [style, setStyle] = useState<CiteStyle>(existing.style ?? defaultStyle);
  const [form, setForm] = useState<Source>(() => emptySource('book'));
  const [page, setPage] = useState('');
  const [adding, setAdding] = useState(existing.sources.length === 0);
  const [error, setError] = useState<string | null>(null);
  /** The source whose removal is waiting for a second click, because it is cited in the essay. */
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch: Partial<Source>) => { setForm((f) => ({ ...f, ...patch })); setError(null); };

  // What the essay cites now, so each source knows its number and its a/b letter.
  const counts = useMemo(() => citationCounts(editor), [editor, sources, style]);
  const order = useMemo(() => citedOrder(editor), [editor, sources, style]);
  const ctx = useMemo(() => buildContext(sources, style, order), [sources, style, order]);
  const listed = useMemo(
    () => [...sources].sort(isNumbered(style) ? (a, b) => (ctx.numbers?.get(a.id) ?? 0) - (ctx.numbers?.get(b.id) ?? 0) : compareSources),
    [sources, style, ctx],
  );

  // The source being typed, as it would look once added at the cursor.
  const draft = useMemo<Source>(() => ({ ...form, id: NEW_ID }), [form]);
  const draftCtx = useMemo(
    () => buildContext([...sources, draft], style, citedOrderWith(editor, NEW_ID)),
    [editor, sources, draft, style],
  );

  const changeStyle = (next: CiteStyle) => {
    setStyle(next);
    setConfirmId(null);
    try { localStorage.setItem(CITE_STYLE_KEY, next); } catch { /* noop */ }
    // Everything already in the essay is re-formatted straight away, so it
    // never shows two styles: the citations in the text first, then the list.
    if (sources.length > 0) { restyleInText(editor, sources, next); writeReferences(editor, sources, next); }
  };

  const add = () => {
    const problem = sourceProblem(form);
    if (problem) { setError(problem); return; }
    if (sources.some((x) => sameSource(x, form))) { setError('This source is already in your essay. Use "Cite" above to cite it again.'); return; }
    const source: Source = { ...form, id: newSourceId() };
    const next = [...sources, source];
    insertInText(editor, source, next, style, page);
    writeReferences(editor, next, style);
    // Two works by one author in one year now need a and b.
    refreshAuthorDate(editor, sources, next, style);
    try { localStorage.setItem(CITE_STYLE_KEY, style); } catch { /* noop */ }
    onClose();
  };

  const citeAgain = (s: Source) => { insertInText(editor, s, sources, style, page); onClose(); };

  const remove = (s: Source) => {
    const cited = counts.get(s.id) ?? 0;
    // A source that is cited takes its citations with it, so nothing in the text points at a missing reference.
    if (cited > 0 && confirmId !== s.id) { setConfirmId(s.id); return; }
    const next = sources.filter((x) => x.id !== s.id);
    if (cited > 0) removeCitations(editor, s.id);
    writeReferences(editor, next, style);
    refreshAuthorDate(editor, sources, next, style);
    setConfirmId(null);
    setSources(next);
    if (next.length === 0) setAdding(true);
  };

  const previewReady = form.title.trim().length > 0;
  const authorHint = !form.org ? authorProblem(form) : null;

  return (
    <div className="ws-fade fixed inset-0 z-[200] flex items-center justify-center bg-[#2A1540]/50 p-3 sm:p-4" onMouseDown={onClose} style={FONT}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cite-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="ws-pop flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white shadow-[0_30px_60px_-20px_rgba(42,21,64,0.6)] dark:bg-stone-900"
      >
        <div className="flex items-start gap-3 border-b border-[#EFE5FA] px-5 py-4 dark:border-stone-700">
          <div className="min-w-0 flex-1">
            <h2 id="cite-title" className="m-0 text-[22px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">Cite a source</h2>
            <p className="m-0 mt-0.5 text-[14px] font-bold text-stone-600 dark:text-stone-300">Type in a source you have read. It is formatted and added to your reference list.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <fieldset className="m-0 border-0 p-0">
            <legend className={label}>Citation style</legend>
            <div className="flex flex-wrap gap-2">
              {CITE_STYLES.map((s) => (
                <button key={s} type="button" aria-pressed={style === s} onClick={() => changeStyle(s)} className={chip(style === s)}>{s}</button>
              ))}
            </div>
            <p className={help}>{styleNote(style)}</p>
          </fieldset>

          <div>
            <label htmlFor="cite-page" className={label}>Page number for this citation <span className="font-bold text-stone-500">(optional)</span></label>
            <input id="cite-page" type="text" inputMode="text" value={page} onChange={(e) => setPage(e.target.value)} placeholder="25 or 25-27" className={`${field} max-w-[220px]`} />
          </div>

          {sources.length > 0 && (
            <section aria-label="Sources already in this essay" className="flex flex-col gap-2">
              <h3 className="m-0 text-[13px] font-black uppercase tracking-[0.1em] text-[#7733B5] dark:text-[#C9A0F0]">Already in this essay</h3>
              {listed.map((s) => {
                const cited = counts.get(s.id) ?? 0;
                const confirming = confirmId === s.id;
                return (
                  <div key={s.id} className="flex flex-col gap-2 rounded-[16px] border border-[#EFE5FA] bg-[#FBF8FF] p-3 dark:border-stone-700 dark:bg-stone-800">
                    <p className="m-0 text-[14px] font-semibold leading-[1.45] text-stone-800 dark:text-stone-100"><Reference source={s} style={style} ctx={ctx} /></p>
                    <p className="m-0 text-[12.5px] font-extrabold text-stone-500 dark:text-stone-400">{cited === 0 ? 'Not cited in the text yet' : cited === 1 ? 'Cited once in the text' : `Cited ${cited} times in the text`}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => citeAgain(s)} className={`${BTN_GREEN} min-h-[44px] rounded-xl px-4 text-[14.5px]`}>Cite {inTextCitation(s, style, page, buildContext(sources, style, citedOrderWith(editor, s.id)))}</button>
                      {confirming ? (
                        <>
                          <button type="button" onClick={() => remove(s)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-4 text-[14.5px] !text-[#B91C1C]`}>Yes, remove it and {cited === 1 ? 'its citation' : `its ${cited} citations`}</button>
                          <button type="button" onClick={() => setConfirmId(null)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-4 text-[14.5px]`}>Keep it</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => remove(s)} className={`${BTN_WHITE} min-h-[44px] rounded-xl px-4 text-[14.5px]`}>Remove source</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!adding && (
                <button type="button" onClick={() => setAdding(true)} className={`${BTN_WHITE} min-h-[48px] self-start rounded-[14px] px-4 text-[15px]`}>Add a new source</button>
              )}
            </section>
          )}

          {adding && (
            <section aria-label="New source" className="flex flex-col gap-3">
              {sources.length > 0 && <h3 className="m-0 text-[13px] font-black uppercase tracking-[0.1em] text-[#7733B5] dark:text-[#C9A0F0]">New source</h3>}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of source">
                {KINDS.map((k) => (
                  <button key={k.key} type="button" aria-pressed={form.kind === k.key} onClick={() => set({ kind: k.key })} className={chip(form.kind === k.key)}>{k.label}</button>
                ))}
              </div>

              <div>
                <label htmlFor="cite-authors" className={label}>Author <span className="font-bold text-stone-500">(one per line)</span></label>
                <textarea id="cite-authors" autoFocus rows={2} value={form.authors} onChange={(e) => set({ authors: e.target.value })} placeholder={form.org ? 'World Health Organization' : 'James Lull'} className={`${field} resize-y py-2.5 leading-[1.4]`} />
                {authorHint
                  ? <p role="alert" className="m-0 mt-1 text-[13.5px] font-extrabold text-[#B45309]">{authorHint}</p>
                  : !form.org && <p className={help}>For a surname with two parts, type it like this: García Márquez, Gabriel</p>}
                <label className="mt-1.5 flex min-h-[32px] cursor-pointer items-center gap-2 text-[14px] font-bold text-stone-700 dark:text-stone-200">
                  <input type="checkbox" checked={form.org} onChange={(e) => set({ org: e.target.checked })} className="h-[18px] w-[18px] accent-[#A560E8]" />
                  The author is an organisation
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                <div>
                  <label htmlFor="cite-year" className={label}>Year</label>
                  <input id="cite-year" type="text" inputMode="numeric" maxLength={9} value={form.year} onChange={(e) => set({ year: e.target.value })} placeholder="1995" className={field} />
                </div>
                <div>
                  <label htmlFor="cite-title-f" className={label}>{form.kind === 'book' ? 'Book title' : form.kind === 'journal' ? 'Article title' : 'Page title'}</label>
                  <input id="cite-title-f" type="text" value={form.title} onChange={(e) => set({ title: e.target.value })} className={field} />
                  <p className={help}>{titleNote(style)}</p>
                </div>
              </div>

              {form.kind === 'book' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cite-pub" className={label}>Publisher</label>
                    <input id="cite-pub" type="text" value={form.publisher} onChange={(e) => set({ publisher: e.target.value })} placeholder="Columbia University Press" className={field} />
                  </div>
                  <div>
                    <label htmlFor="cite-place" className={label}>City <span className="font-bold text-stone-500">(optional)</span></label>
                    <input id="cite-place" type="text" value={form.place ?? ''} onChange={(e) => set({ place: e.target.value })} placeholder="New York" className={field} />
                  </div>
                </div>
              )}

              {form.kind === 'journal' && (
                <>
                  <div>
                    <label htmlFor="cite-journal" className={label}>Journal</label>
                    <input id="cite-journal" type="text" value={form.container} onChange={(e) => set({ container: e.target.value })} className={field} />
                    {isNumbered(style) && <p className={help}>{style} uses the journal's standard short name, like N Engl J Med. Check your course guide.</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="cite-vol" className={label}>Volume</label>
                      <input id="cite-vol" type="text" value={form.volume} onChange={(e) => set({ volume: e.target.value })} className={field} />
                    </div>
                    <div>
                      <label htmlFor="cite-issue" className={label}>Issue</label>
                      <input id="cite-issue" type="text" value={form.issue} onChange={(e) => set({ issue: e.target.value })} className={field} />
                    </div>
                    <div>
                      <label htmlFor="cite-pages" className={label}>Pages</label>
                      <input id="cite-pages" type="text" value={form.pages} onChange={(e) => set({ pages: e.target.value })} placeholder="69-102" className={field} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cite-url" className={label}>DOI or link <span className="font-bold text-stone-500">(optional)</span></label>
                    <input id="cite-url" type="text" inputMode="url" value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="10.1037/xyz or https://doi.org/..." className={field} />
                  </div>
                </>
              )}

              {form.kind === 'website' && (
                <>
                  <div>
                    <label htmlFor="cite-site" className={label}>Website name</label>
                    <input id="cite-site" type="text" value={form.container} onChange={(e) => set({ container: e.target.value })} placeholder="BBC News" className={field} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                    <div>
                      <label htmlFor="cite-web" className={label}>Web address</label>
                      <input id="cite-web" type="text" inputMode="url" value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" className={field} />
                    </div>
                    <div>
                      <label htmlFor="cite-acc" className={label}>Date you read it</label>
                      <input id="cite-acc" type="text" value={form.accessed} onChange={(e) => set({ accessed: e.target.value })} placeholder="12 March 2026" className={field} />
                    </div>
                  </div>
                </>
              )}

              {previewReady && (
                <div aria-live="polite" className="flex flex-col gap-2 rounded-[16px] border border-[#BFE89A] bg-[#F4FCEB] p-3 dark:border-[#3F6B1C] dark:bg-[#1F2E14]">
                  <p className="m-0 text-[12px] font-black uppercase tracking-[0.1em] text-[#2F6B00] dark:text-[#8FE04A]">How it will look</p>
                  <p className="m-0 text-[14.5px] font-semibold leading-[1.45] text-stone-900 dark:text-stone-50"><span className="font-black">In your sentence:</span> {inTextCitation(draft, style, page, draftCtx)}</p>
                  <p className="m-0 text-[14.5px] font-semibold leading-[1.45] text-stone-900 dark:text-stone-50"><span className="font-black">In your list:</span> <Reference source={draft} style={style} ctx={draftCtx} /></p>
                </div>
              )}
              {error && <p role="alert" className="m-0 text-[14.5px] font-extrabold text-[#B91C1C]">{error}</p>}
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#EFE5FA] px-5 py-3.5 dark:border-stone-700">
          <p className="m-0 min-w-0 flex-[1_1_220px] text-[13px] font-bold leading-[1.4] text-stone-500 dark:text-stone-400">Formatted from what you type. Check it against your course guide.</p>
          <button type="button" onClick={onClose} className={`${BTN_WHITE} min-h-[50px] rounded-[14px] px-5 text-[15.5px]`}>{adding ? 'Cancel' : 'Done'}</button>
          {adding && <button type="button" onClick={add} className={`${BTN_GREEN} min-h-[50px] rounded-[14px] px-5 text-[15.5px]`}>Add citation</button>}
        </div>
      </div>
    </div>
  );
}
