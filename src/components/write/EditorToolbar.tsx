import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import { findMatches, replaceAll, replaceMatch, selectMatch, type Match } from './editorExtras';

/**
 * The editor's formatting bar: one grouped row in the order a word processor
 * uses (undo, style, font, emphasis, colour, lists, alignment, insert, cite),
 * with the less common tools under "More". Every control acts on the live
 * selection and shows its current state.
 */
export const EDITOR_FONTS: { label: string; css: string }[] = [
  { label: 'Nunito', css: '' },
  { label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];
/** Size keys are stored per browser; the label is the point size used on screen and in exports. */
export const EDITOR_SIZES: { key: string; pt: number }[] = [
  { key: 'xs', pt: 10 },
  { key: 'sm', pt: 11 },
  { key: 'base', pt: 12 },
  { key: 'lg', pt: 14 },
  { key: 'xl', pt: 16 },
];
export const LINE_SPACINGS: { key: string; label: string; value: number }[] = [
  { key: '1', label: 'Single', value: 1.2 },
  { key: '1.5', label: '1.5', value: 1.6 },
  { key: '2', label: 'Double', value: 2 },
];
const TEXT_COLOURS = ['#1C1917', '#57534E', '#B91C1C', '#C2410C', '#15803D', '#1D4ED8', '#7733B5', '#BE185D'];
const HIGHLIGHTS = ['#FFF1B8', '#D7FFB8', '#CFE8FF', '#F3EAFF', '#FFD9D9'];

const I = {
  undo: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg>,
  redo: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></svg>,
  chev: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>,
  pen: <svg width="17" height="15" viewBox="0 0 24 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 3l6 6-9 9H5v-6l9-9z" /></svg>,
  bullets: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" /></svg>,
  numbers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4 4.5l1.5-1v5M3.5 15.5a1.5 1.5 0 013 0c0 1.5-3 2.5-3 4h3" strokeWidth="1.8" /></svg>,
  left: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h10M4 18h13" /></svg>,
  center: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M5.5 18h13" /></svg>,
  right: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M4 6h16M10 12h10M7 18h13" /></svg>,
  justify: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  link: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" /></svg>,
  image: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M5 18l5-5 4 4 2-2 3.5 3.5" /></svg>,
  quote: <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M4 17V12a5 5 0 015-5v2.5a2.5 2.5 0 00-2.5 2.5H9v5H4zm10 0V12a5 5 0 015-5v2.5a2.5 2.5 0 00-2.5 2.5H19v5h-5z" /></svg>,
  more: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>,
  tick: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>,
  up: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 15l6-6 6 6" /></svg>,
  down: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>,
};

/* ── Shells ─────────────────────────────────────────────────────── */
const keepSelection = (e: React.MouseEvent) => e.preventDefault();
const iconBtn = (active: boolean) =>
  `inline-flex h-10 min-w-[34px] shrink-0 items-center justify-center rounded-[10px] px-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
    active
      ? 'bg-[#A560E8] text-white'
      : 'text-stone-700 hover:bg-[#EADCFB] dark:text-stone-200 dark:hover:bg-stone-700'
  }`;
const pillBtn = 'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-white pl-2.5 pr-2 text-[14.5px] font-extrabold text-stone-900 shadow-[0_1px_0_#E4D4F8] transition-colors hover:bg-[#FBF8FF] dark:bg-stone-900 dark:text-stone-50 dark:shadow-none dark:hover:bg-stone-700';
const panel = 'absolute top-full z-40 mt-2 rounded-[16px] border border-[#E4D4F8] bg-white p-1.5 shadow-[0_24px_50px_-18px_rgba(42,21,64,0.5)] dark:border-stone-700 dark:bg-stone-900';
const menuItem = (on: boolean) =>
  `flex min-h-[40px] w-full items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 text-left text-[14.5px] ${
    on ? 'bg-[#F3EAFF] font-black text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]' : 'font-bold text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800'
  }`;
const Divider = () => <span aria-hidden className="h-6 w-px shrink-0 bg-[#DCC3F6] dark:bg-stone-600" />;

function Btn({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={keepSelection} onClick={onClick} className={iconBtn(active)}>
      {children}
    </button>
  );
}

/** A trigger with a panel under it. Closes on an outside click or Escape. */
function Pop({
  open,
  onOpenChange,
  trigger,
  align = 'left',
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' | 'dialog'; onMouseDown: (e: React.MouseEvent) => void }) => ReactNode;
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open, onOpenChange]);
  return (
    <div className="relative shrink-0" ref={ref}>
      {trigger({ onClick: () => onOpenChange(!open), 'aria-expanded': open, 'aria-haspopup': 'menu', onMouseDown: keepSelection })}
      {open && <div className={`${panel} ${align === 'right' ? 'right-0' : 'left-0'}`}>{children}</div>}
    </div>
  );
}

/* ── Find and replace ───────────────────────────────────────────── */
function FindBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Recomputed whenever the draft changes, so the count never goes stale.
  const version = editor.state.doc.content.size;
  const matches: Match[] = useMemo(() => findMatches(editor, query, matchCase), [editor, query, matchCase, version]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  useEffect(() => { setIndex(0); setNote(''); }, [query, matchCase]);

  const go = (to: number) => {
    if (matches.length === 0) return;
    const next = (to + matches.length) % matches.length;
    setIndex(next);
    selectMatch(editor, matches[next]);
  };
  const replaceOne = () => {
    if (matches.length === 0) return;
    const at = Math.min(index, matches.length - 1);
    replaceMatch(editor, matches[at], replacement);
    setNote('');
    // The list shifts down by one, so the same index is now the next match.
    window.setTimeout(() => {
      const left = findMatches(editor, query, matchCase);
      if (left.length) { const n = Math.min(at, left.length - 1); setIndex(n); selectMatch(editor, left[n]); }
    }, 0);
  };
  const replaceEvery = () => {
    const n = replaceAll(editor, matches, replacement);
    setNote(n === 0 ? '' : `Replaced ${n}`);
  };

  const input = 'h-10 min-w-0 flex-[1_1_150px] rounded-[10px] border-2 border-[#DCC3F6] bg-white px-3 text-[14.5px] font-bold text-stone-900 placeholder:font-semibold placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50';
  const small = 'inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] px-3 text-[14px] font-black text-[#7733B5] hover:bg-[#EADCFB] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#C9A0F0] dark:hover:bg-stone-700';
  return (
    <div role="search" aria-label="Find and replace" className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#E4D4F8] bg-[#F7F1FF] p-1.5 dark:border-stone-700 dark:bg-stone-800">
      <label htmlFor="ws-find" className="sr-only">Find</label>
      <input
        id="ws-find"
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey ? index - 1 : (matches.length && editor.state.selection.from === matches[index]?.from ? index + 1 : index)); } if (e.key === 'Escape') onClose(); }}
        placeholder="Find"
        className={input}
      />
      <span aria-live="polite" className="w-[64px] shrink-0 text-center text-[13px] font-extrabold tabular-nums text-stone-600 dark:text-stone-300">
        {query ? (matches.length ? `${Math.min(index, matches.length - 1) + 1} of ${matches.length}` : 'None') : ''}
      </span>
      <button type="button" aria-label="Previous match" disabled={matches.length === 0} onClick={() => go(index - 1)} className={small}>{I.up}</button>
      <button type="button" aria-label="Next match" disabled={matches.length === 0} onClick={() => go(index + 1)} className={small}>{I.down}</button>
      <label htmlFor="ws-replace" className="sr-only">Replace with</label>
      <input id="ws-replace" value={replacement} onChange={(e) => setReplacement(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); replaceOne(); } if (e.key === 'Escape') onClose(); }} placeholder="Replace with" className={input} />
      <button type="button" disabled={matches.length === 0} onClick={replaceOne} className={small}>Replace</button>
      <button type="button" disabled={matches.length === 0} onClick={replaceEvery} className={small}>Replace all</button>
      <label className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 px-1.5 text-[13.5px] font-extrabold text-stone-700 dark:text-stone-200">
        <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} className="h-4 w-4 accent-[#A560E8]" />
        Match case
      </label>
      {note && <span aria-live="polite" className="text-[13px] font-extrabold text-[#2F6B00] dark:text-[#8FE04A]">{note}</span>}
      <button type="button" aria-label="Close find and replace" onClick={onClose} className={`${small} ml-auto`}>{I.close}</button>
    </div>
  );
}

/* ── The bar ────────────────────────────────────────────────────── */
type Open = null | 'style' | 'font' | 'size' | 'colour' | 'highlight' | 'align' | 'link' | 'more';

export default function EditorToolbar({
  editor,
  font,
  onFont,
  sizeKey,
  onSize,
  spacing,
  onSpacing,
  onPickImage,
  tableMenu,
  onCite,
  onFootnote,
}: {
  editor: Editor;
  font: string;
  onFont: (css: string) => void;
  sizeKey: string;
  onSize: (key: string) => void;
  spacing: string;
  onSpacing: (key: string) => void;
  onPickImage: () => void;
  tableMenu: ReactNode;
  onCite: () => void;
  onFootnote: (text: string) => void;
}) {
  const [open, setOpen] = useState<Open>(null);
  const [finding, setFinding] = useState(false);
  const [href, setHref] = useState('');
  const [footnote, setFootnote] = useState<string | null>(null);
  const toggle = (name: Exclude<Open, null>) => (on: boolean) => setOpen(on ? name : null);
  const run = (fn: () => void) => { fn(); setOpen(null); };

  const openLink = useCallback(() => {
    setHref((editor.getAttributes('link').href as string | undefined) ?? '');
    setOpen('link');
  }, [editor]);

  // Ctrl/Cmd+K for a link and Ctrl/Cmd+F to find, while the cursor is in the essay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'k' && editor.isFocused) { e.preventDefault(); openLink(); }
      if (k === 'f' && editor.isFocused) { e.preventDefault(); setFinding(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, openLink]);

  const applyLink = () => {
    const raw = href.trim();
    if (!raw) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setOpen(null); return; }
    const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('/') || raw.startsWith('#') ? raw : `https://${raw}`;
    if (editor.state.selection.empty && !editor.isActive('link')) {
      // Nothing selected: the address itself becomes the linked text.
      editor.chain().focus().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setOpen(null);
  };

  const styles = [
    { label: 'Normal text', on: () => !editor.isActive('heading'), apply: () => editor.chain().focus().setParagraph().run(), cls: 'text-[15px] font-bold' },
    { label: 'Heading 1', on: () => editor.isActive('heading', { level: 1 }), apply: () => editor.chain().focus().setHeading({ level: 1 }).run(), cls: 'text-[21px] font-black' },
    { label: 'Heading 2', on: () => editor.isActive('heading', { level: 2 }), apply: () => editor.chain().focus().setHeading({ level: 2 }).run(), cls: 'text-[18px] font-black' },
    { label: 'Heading 3', on: () => editor.isActive('heading', { level: 3 }), apply: () => editor.chain().focus().setHeading({ level: 3 }).run(), cls: 'text-[16px] font-black' },
  ];
  const currentStyle = styles.find((s) => s.on()) ?? styles[0];
  const currentFont = EDITOR_FONTS.find((f) => f.css === font) ?? EDITOR_FONTS[0];
  const currentSize = EDITOR_SIZES.find((s) => s.key === sizeKey) ?? EDITOR_SIZES[2];
  const colour = (editor.getAttributes('textStyle').color as string | undefined) ?? '';
  const highlight = editor.isActive('highlight') ? ((editor.getAttributes('highlight').color as string | undefined) ?? HIGHLIGHTS[0]) : '';
  const aligns = [
    { key: 'left', label: 'Align left', icon: I.left },
    { key: 'center', label: 'Centre', icon: I.center },
    { key: 'right', label: 'Align right', icon: I.right },
    { key: 'justify', label: 'Justify', icon: I.justify },
  ];
  const currentAlign = aligns.find((a) => a.key !== 'left' && editor.isActive({ textAlign: a.key })) ?? aligns[0];

  return (
    <div className="px-2 pb-2">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-2xl border border-[#E4D4F8] bg-[#F7F1FF] p-1 dark:border-stone-700 dark:bg-stone-800">
        <Btn label="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>{I.undo}</Btn>
        <Btn label="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>{I.redo}</Btn>
        <Divider />

        <Pop open={open === 'style'} onOpenChange={toggle('style')} trigger={(p) => (
          <button type="button" title="Text style" aria-label={`Text style: ${currentStyle.label}`} {...p} className={pillBtn}>{currentStyle.label}{I.chev}</button>
        )}>
          <div role="menu" className="min-w-[190px]">
            {styles.map((s) => (
              <button key={s.label} type="button" role="menuitemradio" aria-checked={s.on()} onMouseDown={keepSelection} onClick={() => run(s.apply)} className={`${menuItem(s.on())} ${s.cls}`}>{s.label}</button>
            ))}
          </div>
        </Pop>

        <Pop open={open === 'font'} onOpenChange={toggle('font')} trigger={(p) => (
          <button type="button" title="Font" aria-label={`Font: ${currentFont.label}`} {...p} className={pillBtn}><span className="max-w-[80px] truncate" style={{ fontFamily: currentFont.css || undefined }}>{currentFont.label}</span>{I.chev}</button>
        )}>
          <div role="menu" className="min-w-[200px]">
            {EDITOR_FONTS.map((f) => (
              <button key={f.label} type="button" role="menuitemradio" aria-checked={f.css === font} onMouseDown={keepSelection} onClick={() => run(() => onFont(f.css))} style={{ fontFamily: f.css || undefined }} className={menuItem(f.css === font)}>{f.label}</button>
            ))}
            <p className="m-0 px-3 pb-1 pt-1.5 text-[12px] font-bold text-stone-500 dark:text-stone-400">Applies to the whole essay</p>
          </div>
        </Pop>

        <Pop open={open === 'size'} onOpenChange={toggle('size')} trigger={(p) => (
          <button type="button" title="Text size" aria-label={`Text size: ${currentSize.pt} point`} {...p} className={`${pillBtn} tabular-nums`}>{currentSize.pt}{I.chev}</button>
        )}>
          <div role="menu" className="min-w-[150px]">
            {EDITOR_SIZES.map((s) => (
              <button key={s.key} type="button" role="menuitemradio" aria-checked={s.key === sizeKey} onMouseDown={keepSelection} onClick={() => run(() => onSize(s.key))} className={`${menuItem(s.key === sizeKey)} tabular-nums`}>{s.pt} pt{s.key === 'base' ? ' (standard)' : ''}</button>
            ))}
          </div>
        </Pop>
        <Divider />

        <Btn label="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><span className="text-[18px] font-black leading-none">B</span></Btn>
        <Btn label="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><span className="font-serif text-[19px] font-bold italic leading-none">I</span></Btn>
        <Btn label="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><span className="text-[18px] font-extrabold leading-none underline">U</span></Btn>

        <Pop open={open === 'colour'} onOpenChange={toggle('colour')} trigger={(p) => (
          <button type="button" title="Text colour" aria-label="Text colour" {...p} className={`${iconBtn(false)} flex-col gap-px`}>
            <span className="text-[17px] font-black leading-none">A</span>
            <span className="h-1 w-[18px] rounded-sm" style={{ background: colour || '#7733B5' }} />
          </button>
        )}>
          <div className="w-[196px] p-1.5">
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Text colour">
              {TEXT_COLOURS.map((c) => (
                <button key={c} type="button" title={c} aria-label={`Colour ${c}`} aria-pressed={colour.toLowerCase() === c.toLowerCase()} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().setColor(c).run())} className="flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-white text-white shadow-[0_0_0_1px_#D6D3D1] dark:border-stone-900" style={{ background: c }}>{colour.toLowerCase() === c.toLowerCase() && I.tick}</button>
              ))}
            </div>
            <button type="button" onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().unsetColor().run())} className={`${menuItem(false)} mt-1.5`}>Automatic</button>
          </div>
        </Pop>

        <Pop open={open === 'highlight'} onOpenChange={toggle('highlight')} trigger={(p) => (
          <button type="button" title="Highlight" aria-label="Highlight" {...p} className={`${iconBtn(false)} flex-col gap-0.5`}>
            {I.pen}
            <span className="h-1 w-[18px] rounded-sm" style={{ background: highlight || '#FFC800' }} />
          </button>
        )}>
          <div className="w-[196px] p-1.5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Highlight colour">
              {HIGHLIGHTS.map((c) => (
                <button key={c} type="button" aria-label={`Highlight ${c}`} aria-pressed={highlight.toLowerCase() === c.toLowerCase()} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().setHighlight({ color: c }).run())} className="flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-white text-stone-800 shadow-[0_0_0_1px_#D6D3D1] dark:border-stone-900" style={{ background: c }}>{highlight.toLowerCase() === c.toLowerCase() && I.tick}</button>
              ))}
            </div>
            <button type="button" onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().unsetHighlight().run())} className={`${menuItem(false)} mt-1.5`}>No highlight</button>
          </div>
        </Pop>
        <Divider />

        <Btn label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>{I.bullets}</Btn>
        <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{I.numbers}</Btn>
        <Pop open={open === 'align'} onOpenChange={toggle('align')} trigger={(p) => (
          <button type="button" title="Alignment" aria-label={`Alignment: ${currentAlign.label}`} {...p} className={`${iconBtn(false)} gap-0.5 pl-1.5 pr-1`}>{currentAlign.icon}{I.chev}</button>
        )}>
          <div role="menu" className="min-w-[170px]">
            {aligns.map((a) => (
              <button key={a.key} type="button" role="menuitemradio" aria-checked={currentAlign.key === a.key} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().setTextAlign(a.key).run())} className={menuItem(currentAlign.key === a.key)}>{a.icon}{a.label}</button>
            ))}
          </div>
        </Pop>
        <Divider />

        <Pop open={open === 'link'} onOpenChange={(on) => (on ? openLink() : setOpen(null))} trigger={(p) => (
          <button type="button" title="Link (Ctrl+K)" aria-label="Link" {...p} aria-haspopup="dialog" aria-pressed={editor.isActive('link')} className={iconBtn(editor.isActive('link') && open !== 'link')}>{I.link}</button>
        )}>
          <form className="flex w-[min(340px,78vw)] flex-col gap-2.5 p-2" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
            <label htmlFor="ws-link" className="text-[12px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Link address</label>
            <input id="ws-link" type="text" inputMode="url" autoFocus value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://" className="h-[46px] rounded-xl border-2 border-[#DCC3F6] bg-[#FBF8FF] px-3 text-[15px] font-bold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50" />
            <div className="flex gap-2">
              <button type="submit" className="min-h-[44px] flex-1 rounded-xl border-2 border-b-4 border-[#46A302] bg-[#58CC02] text-[15px] font-black text-white active:translate-y-0.5 active:border-b-2">{editor.isActive('link') ? 'Update link' : 'Add link'}</button>
              {editor.isActive('link') && (
                <button type="button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setOpen(null); }} className="min-h-[44px] flex-1 rounded-xl border-2 border-b-4 border-[#E4D4F8] bg-white text-[15px] font-black text-[#7733B5] active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-900">Remove</button>
              )}
            </div>
          </form>
        </Pop>
        <Btn label="Insert image" onClick={onPickImage}>{I.image}</Btn>
        {tableMenu}
        <Divider />

        <button type="button" title="Cite a source" onMouseDown={keepSelection} onClick={onCite} className={`${pillBtn} font-black text-[#7733B5] dark:text-[#C9A0F0]`}>{I.quote}Cite</button>

        <div className="ml-auto">
          <Pop open={open === 'more'} onOpenChange={(on) => { setOpen(on ? 'more' : null); setFootnote(null); }} align="right" trigger={(p) => (
            <button type="button" title="More formatting" aria-label="More formatting" {...p} className={iconBtn(false)}>{I.more}</button>
          )}>
            {footnote === null ? (
              <div role="menu" className="min-w-[230px]">
                <button type="button" role="menuitemcheckbox" aria-checked={editor.isActive('strike')} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().toggleStrike().run())} className={menuItem(editor.isActive('strike'))}><span className="w-5 text-center line-through">S</span>Strikethrough</button>
                <button type="button" role="menuitemcheckbox" aria-checked={editor.isActive('superscript')} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().toggleSuperscript().run())} className={menuItem(editor.isActive('superscript'))}><span className="w-5 text-center">x<sup>2</sup></span>Superscript</button>
                <button type="button" role="menuitemcheckbox" aria-checked={editor.isActive('subscript')} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().toggleSubscript().run())} className={menuItem(editor.isActive('subscript'))}><span className="w-5 text-center">x<sub>2</sub></span>Subscript</button>
                <button type="button" role="menuitemcheckbox" aria-checked={editor.isActive('blockquote')} onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())} className={menuItem(editor.isActive('blockquote'))}><span className="flex w-5 justify-center">{I.quote}</span>Quote</button>
                <div className="my-1 border-t border-[#EFE5FA] dark:border-stone-700" />
                <div className="px-3 pb-1 pt-1.5">
                  <p className="m-0 text-[12px] font-black uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">Line spacing</p>
                  <div className="mt-1.5 flex gap-1.5" role="group" aria-label="Line spacing">
                    {LINE_SPACINGS.map((l) => (
                      <button key={l.key} type="button" aria-pressed={spacing === l.key} onClick={() => onSpacing(l.key)} className={`min-h-[40px] flex-1 rounded-[10px] border-2 text-[14px] ${spacing === l.key ? 'border-[#A560E8] bg-[#F3EAFF] font-black text-[#7733B5] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]' : 'border-[#E4D4F8] font-extrabold text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800'}`}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <div className="my-1 border-t border-[#EFE5FA] dark:border-stone-700" />
                <button type="button" role="menuitem" onMouseDown={keepSelection} onClick={() => setFootnote('')} className={menuItem(false)}><span className="w-5 text-center">x<sup>1</sup></span>Footnote</button>
                <button type="button" role="menuitem" onMouseDown={keepSelection} onClick={() => run(() => editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run())} className={menuItem(false)}><span className="w-5 text-center line-through decoration-2">T</span>Clear formatting</button>
                <button type="button" role="menuitem" onClick={() => { setOpen(null); setFinding(true); }} className={menuItem(false)}><span className="flex w-5 justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg></span>Find and replace</button>
              </div>
            ) : (
              <form className="flex w-[min(320px,78vw)] flex-col gap-2.5 p-2" onSubmit={(e) => { e.preventDefault(); if (footnote.trim()) { onFootnote(footnote.trim()); setFootnote(null); setOpen(null); } }}>
                <label htmlFor="ws-footnote" className="text-[12px] font-black uppercase tracking-[0.12em] text-[#7733B5] dark:text-[#C9A0F0]">Footnote text</label>
                <textarea id="ws-footnote" autoFocus rows={3} value={footnote} onChange={(e) => setFootnote(e.target.value)} className="resize-y rounded-xl border-2 border-[#DCC3F6] bg-[#FBF8FF] px-3 py-2 text-[15px] font-bold leading-[1.4] text-stone-900 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-50" />
                <div className="flex gap-2">
                  <button type="submit" disabled={!footnote.trim()} className="min-h-[44px] flex-1 rounded-xl border-2 border-b-4 border-[#46A302] bg-[#58CC02] text-[15px] font-black text-white active:translate-y-0.5 active:border-b-2 disabled:opacity-50">Add footnote</button>
                  <button type="button" onClick={() => setFootnote(null)} className="min-h-[44px] flex-1 rounded-xl border-2 border-b-4 border-[#E4D4F8] bg-white text-[15px] font-black text-[#7733B5] active:translate-y-0.5 active:border-b-2 dark:border-stone-600 dark:bg-stone-900">Back</button>
                </div>
              </form>
            )}
          </Pop>
        </div>
      </div>
      {finding && <FindBar editor={editor} onClose={() => { setFinding(false); editor.commands.focus(); }} />}
    </div>
  );
}
