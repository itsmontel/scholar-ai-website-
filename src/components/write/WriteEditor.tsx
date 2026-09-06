import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
// NOTE: @tiptap/extension-table exposes Table/TableRow/TableHeader/
// TableCell as NAMED exports (no default). Importing the table as a
// default gives `undefined` → Table.configure() throws and the whole
// editor (and Documents page) fails to mount.
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, ImageRun, WidthType, ExternalHyperlink } from 'docx';
import { saveAs } from 'file-saver';
import { AnalyzerHighlights, setAnalyzerAnnotations, scrollToAnnotation } from '../documents/analyzerExtension';
import type { AnnotatorAnnotation } from '../documents/analyzerExtension';

/* ═══════════════════════════════════════════════════════════════
   WriteEditor — Word-style rich-text surface for the in-app
   writing tool. TipTap (ProseMirror) under the hood; toolbar
   styling matches the design reference: undo/redo · text-format
   dropdown · B I U S sub sup link · "comment" placeholder dot.

   Save flow:
   • parent owns the document id + title (renders the page chrome)
   • this component owns the editor state + autosave debounce
   • onSave is called with (html, text, wordCount) every ~1.2s
     after the user stops typing — parent persists to backend.

   Open flow:
   • initialHtml seeds the editor on mount; subsequent prop
     changes are ignored (editor becomes the source of truth)
     unless `key={documentId}` is used to force remount.
   ═══════════════════════════════════════════════════════════════ */

interface WriteEditorProps {
  /** HTML content to seed the editor on mount. Pass empty string for new docs. */
  initialHtml: string;
  /** Placeholder copy shown when the doc is empty. */
  placeholder?: string;
  /** Fired ~1.2s after the last keystroke with the editor's current content. */
  onSave: (payload: { html: string; text: string; wordCount: number }) => void;
  /** Optional: render extra controls in the toolbar's right side (e.g. "Analyze"). */
  toolbarRight?: React.ReactNode;
  /** Optional: tag rendered above the editor as a save-status pill. */
  saveStatus?: React.ReactNode;
  /**
   * Optional: analyzer annotations rendered as inline highlights via
   * the AnalyzerHighlights TipTap extension. Passing an empty array
   * (or undefined) clears any previous decorations.
   */
  annotations?: AnnotatorAnnotation[];
  /** Free-tier highlight gate: only show highlights in the first
   *  `annotationPreviewRatio` of the document (unused; colors are always shown).
   *  null/undefined = show all (paid). */
  annotationPreviewRatio?: number | null;
  /** Currently-highlighted annotation id (e.g. user clicked a panel card). */
  selectedAnnotationId?: string | null;
  /** Fires when the user clicks a highlighted span in the editor. */
  onAnnotationClick?: (annotationId: string) => void;
  /** Fires when the cursor enters / leaves a highlighted span. Used by the parent to render a hover tooltip card. */
  onAnnotationHover?: (annotationId: string | null, rect: DOMRect | null) => void;
  /** Fires once when the editor instance is ready. Lets the parent run imperative ops (apply-revision, scroll-to). */
  onEditorReady?: (editor: Editor) => void;
  /** Free-tier writing cap. null/undefined = unlimited (paid). At
   *  or above this word count, content-adding input is blocked
   *  (trim/delete still works) and an upgrade banner shows. */
  wordLimit?: number | null;
  /** Called from the upgrade banner / footer link. */
  onUpgrade?: () => void;
  /** Base filename for Word / text export (the document title). */
  exportFileName?: string;
  /** When true the host has hidden the global site header, so the
   *  sticky formatting toolbar pins to the viewport top (top-0)
   *  instead of below the header. Defaults to false (header present). */
  headerless?: boolean;
}

/* Autosave debounce window. 1.2s was the original; bumped to 3s
   to cut save volume ~60% with no perceptible UX hit (industry
   norm: Notion ~3s, Linear ~2s, Google Docs variable up to ~5s).
   ⌘S still force-saves immediately so users who want a hard save
   never wait. */
const AUTOSAVE_DEBOUNCE_MS = 3000;

/** Strip HTML, count whitespace-separated words. */
function countWords(plainText: string): number {
  const trimmed = plainText.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/* ─── Tiny SVG icons for the toolbar ───────────────────────── */
const Icon = {
  Undo: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-7 3.3L3 13" /></svg>),
  Redo: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 7 3.3L21 13" /></svg>),
  T: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 5h14" /><path d="M12 5v14" /></svg>),
  ChevDown: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="6 9 12 15 18 9" /></svg>),
  ChevUp: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="18 15 12 9 6 15" /></svg>),
  Bold: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>),
  Italic: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>),
  Underline: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 3v7a6 6 0 0 0 12 0V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>),
  Strike: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>),
  Code: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>),
  Sup: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><text x="3" y="18" fontSize="14" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">x</text><text x="13" y="11" fontSize="9" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">2</text></svg>),
  Sub: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><text x="3" y="16" fontSize="14" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">x</text><text x="13" y="20" fontSize="9" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">2</text></svg>),
  Link: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>),
  Comment: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="9" /></svg>),
  Sliders: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="9" y2="18" /><circle cx="17" cy="12" r="2" /><circle cx="12" cy="18" r="2" /></svg>),
  Feedback: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
  FeedbackOff: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h7" /><line x1="3" y1="3" x2="21" y2="21" /></svg>),
  Download: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>),
  Font: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 20h6M7 4l-3 12M7 4l3 12M5 12h4M14 20l5-12 5 12M15.5 16h7" /></svg>),
  Table: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M3 10h18M3 15h18M9 4v16M15 4v16" /></svg>),
  Image: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>),
  Quote: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M7 7h4v6a4 4 0 0 1-4 4M15 7h4v6a4 4 0 0 1-4 4" /></svg>),
  Cite: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /></svg>),
  Footnote: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><text x="2" y="17" fontSize="13" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">F</text><text x="12" y="11" fontSize="9" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">1</text></svg>),
};

/* ─── Toolbar button shells ─────────────────────────────────── */
function TBtn({
  active = false,
  disabled = false,
  onClick,
  title,
  children,
}: { active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-1.5 transition-colors ${
        active
          ? 'bg-[#A560E8]/12 text-[#7733B5] dark:text-[#C390F2]'
          : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function TDivider() {
  return <span className="mx-1 h-5 w-px bg-stone-200 dark:bg-stone-700" aria-hidden />;
}

/* ─── Heading-level dropdown ────────────────────────────────── */
function HeadingDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const items: { label: string; preview: string; isActive: () => boolean; apply: () => void }[] = [
    {
      label: 'Text',
      preview: 'text-base font-normal',
      isActive: () => editor.isActive('paragraph') && !editor.isActive('heading'),
      apply: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: 'Heading 1',
      preview: 'text-xl font-extrabold',
      isActive: () => editor.isActive('heading', { level: 1 }),
      apply: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'Heading 2',
      preview: 'text-lg font-bold',
      isActive: () => editor.isActive('heading', { level: 2 }),
      apply: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Heading 3',
      preview: 'text-base font-bold',
      isActive: () => editor.isActive('heading', { level: 3 }),
      apply: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Bullet list',
      preview: 'text-base font-normal',
      isActive: () => editor.isActive('bulletList'),
      apply: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      preview: 'text-base font-normal',
      isActive: () => editor.isActive('orderedList'),
      apply: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Quote',
      preview: 'text-base italic',
      isActive: () => editor.isActive('blockquote'),
      apply: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];
  const current = items.find((i) => i.isActive()) ?? items[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon.T />
        <span className="text-[13px] font-medium">{current.label}</span>
        {open ? <Icon.ChevUp /> : <Icon.ChevDown />}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.20)] py-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitemradio"
              aria-checked={item.isActive()}
              onClick={() => { item.apply(); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 ${item.preview} ${item.isActive() ? 'bg-[#A560E8]/8 text-[#7733B5] dark:text-[#C390F2]' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Font picker ───────────────────────────────────────────── */
const EDITOR_FONTS: { label: string; css: string }[] = [
  { label: 'Sans (default)', css: '' },
  { label: 'Serif', css: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { label: 'Nunito', css: '"Nunito", system-ui, sans-serif' },
  { label: 'Monospace', css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

function FontDropdown({ value, onChange }: { value: string; onChange: (css: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const current = EDITOR_FONTS.find((f) => f.css === value) ?? EDITOR_FONTS[0];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Writing font"
      >
        <Icon.Font />
        <span className="text-[13px] font-medium hidden sm:inline" style={{ fontFamily: current.css || undefined }}>{current.label}</span>
        {open ? <Icon.ChevUp /> : <Icon.ChevDown />}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 min-w-[190px] rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.20)] py-1">
          {EDITOR_FONTS.map((f) => (
            <button
              key={f.label}
              type="button"
              role="menuitemradio"
              aria-checked={f.css === value}
              onClick={() => { onChange(f.css); setOpen(false); }}
              style={{ fontFamily: f.css || undefined }}
              className={`w-full text-left px-3 py-1.5 text-[14px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 ${f.css === value ? 'bg-[#A560E8]/10 text-[#7733B5] dark:text-[#C390F2]' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Font size picker ──────────────────────────────────────── */
const EDITOR_FONT_SIZES: { key: string; label: string }[] = [
  { key: 'xs', label: 'Extra small' },
  { key: 'sm', label: 'Small' },
  { key: 'base', label: 'Default' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra large' },
];

/* ─── Export font mapping ───────────────────────────────────────
   The editor's writing font lives only in CSS (a font-family
   *stack*), so the .docx exporter never saw it — Word then fell
   back to its built-in default (Times New Roman). Map the chosen
   stack to a single Word-native family, and the size key to
   half-points (Word measures runs in half-points). */
function cssFontToDocx(css: string): string {
  switch (css) {
    case 'Georgia, "Times New Roman", serif': return 'Georgia';
    case '"Times New Roman", Times, serif': return 'Times New Roman';
    case 'Arial, Helvetica, sans-serif': return 'Arial';
    case '"Nunito", system-ui, sans-serif': return 'Nunito';
    case 'ui-monospace, SFMono-Regular, Menlo, monospace': return 'Consolas';
    // 'Sans (default)' / unknown → a clean, ubiquitous Word sans
    default: return 'Calibri';
  }
}
function sizeKeyToHalfPt(key: string): number {
  switch (key) {
    case 'xs': return 18; // 9pt
    case 'sm': return 20; // 10pt
    case 'lg': return 26; // 13pt
    case 'xl': return 30; // 15pt
    default: return 24;   // 12pt — standard academic essay size (MLA/APA/Chicago)
  }
}
// Set once at the top of every export so inlineRunsFromHtml() stamps
// every run with the editor's font + size. Per-run stamping is
// belt-and-braces: Google Docs and some viewers ignore
// <w:docDefaults>, so the document-default font alone isn't enough.
let EXPORT_FONT = 'Calibri';
let EXPORT_SIZE = 24;

function FontSizeDropdown({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const current =
    EDITOR_FONT_SIZES.find((s) => s.key === value) ??
    EDITOR_FONT_SIZES.find((s) => s.key === 'base') ??
    EDITOR_FONT_SIZES[0];
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Text size"
      >
        <span className="text-[15px] font-extrabold leading-none">A</span>
        <span className="text-[11px] font-extrabold leading-none">A</span>
        {open ? <Icon.ChevUp /> : <Icon.ChevDown />}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 min-w-[160px] rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.20)] py-1">
          {EDITOR_FONT_SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="menuitemradio"
              aria-checked={s.key === value}
              onClick={() => { onChange(s.key); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[14px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 ${s.key === value ? 'bg-[#A560E8]/10 text-[#7733B5] dark:text-[#C390F2]' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Export (Word / plain text) ────────────────────────────── */

// Inline (data:) image → docx ImageRun, scaled to a sane page width
// keeping aspect ratio. Remote URLs are skipped in v1.
async function imageRunFromSrc(src: string): Promise<ImageRun | null> {
  // Accept ANY base64 image data URI (mammoth/import can emit jpeg,
  // png, gif, etc.). Unknown subtypes still embed with a png type
  // hint so the bytes make it into the .docx.
  const m = (src || '').match(/^data:image\/([a-z0-9.+-]+);base64,(.+)$/i);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  const type = ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext === 'gif' ? 'gif' : ext === 'bmp' ? 'bmp' : 'png';
  // A corrupt/truncated base64 image must NOT abort the entire
  // export — skip the bad image, keep the document.
  let bytes: Uint8Array;
  try {
    const bin = atob(m[2]);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    return null;
  }
  const dims = await new Promise<{ w: number; h: number }>((res) => {
    const im = new window.Image();
    im.onload = () => res({ w: im.naturalWidth || 480, h: im.naturalHeight || 320 });
    im.onerror = () => res({ w: 480, h: 320 });
    im.src = src;
  });
  const maxW = 480;
  const scale = dims.w > maxW ? maxW / dims.w : 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ImageRun({ data: bytes, type: type as any, transformation: { width: Math.round(dims.w * scale), height: Math.round(dims.h * scale) } });
}

// Single source of truth for the .docx document settings. BOTH the
// in-editor export and the document-card "Download" go through this
// so a Word file is never the lib's Times-New-Roman / bold-italic
// default — it always carries explicit doc defaults + heading styles
// pinned to the editor's font/size. Verified against the generated
// word/styles.xml + document.xml.
function buildDocxDocument(children: (Paragraph | DocxTable)[]) {
  const B = EXPORT_SIZE;
  return new Document({
    styles: {
      default: {
        document: {
          // bold/italics explicitly false so the document baseline can
          // never inherit the lib's Strong/Heading defaults — body text
          // is hard-normal unless a run opts in.
          run: { font: EXPORT_FONT, size: B, bold: false, italics: false },
          paragraph: { spacing: { line: 312, after: 160 } },
        },
        heading1: { run: { font: EXPORT_FONT, size: Math.round(B * 1.9), bold: true, italics: false, color: '1A1A1A' }, paragraph: { spacing: { before: 240, after: 100 } } },
        heading2: { run: { font: EXPORT_FONT, size: Math.round(B * 1.5), bold: true, italics: false, color: '1A1A1A' }, paragraph: { spacing: { before: 220, after: 90 } } },
        heading3: { run: { font: EXPORT_FONT, size: Math.round(B * 1.22), bold: true, italics: false, color: '1A1A1A' }, paragraph: { spacing: { before: 200, after: 80 } } },
      },
    },
    numbering: {
      config: [{ reference: 'ws-ol', levels: [{ level: 0, format: 'decimal', text: '%1.' }] }],
    },
    sections: [{ properties: {}, children: children.length ? children : [new Paragraph({ children: [new TextRun({ text: '', font: EXPORT_FONT, size: B })] })] }],
  });
}

// ─── HTML → docx (used by the document-card Download) ──────────────
// Mirrors blockRuns/exportDocx but walks a parsed DOM instead of a
// live TipTap doc, so a saved document can be exported as a faithful
// Word file WITHOUT mounting the editor. Reuses EXPORT_FONT/SIZE.
function inlineRunsFromHtml(
  node: Node,
  ctx: { bold?: boolean; italics?: boolean; underline?: boolean; sup?: boolean; sub?: boolean; href?: string },
): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3 /* text */) {
      const text = child.textContent || '';
      if (!text) return;
      const run = new TextRun({
        text,
        font: EXPORT_FONT,
        size: EXPORT_SIZE,
        bold: !!ctx.bold,
        italics: !!ctx.italics,
        underline: ctx.underline || ctx.href ? {} : undefined,
        superScript: !!ctx.sup,
        subScript: !!ctx.sub,
        color: ctx.href ? '1155CC' : undefined,
      });
      out.push(ctx.href ? new ExternalHyperlink({ link: ctx.href, children: [run] }) : run);
      return;
    }
    if (child.nodeType !== 1 /* element */) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') { out.push(new TextRun({ break: 1, font: EXPORT_FONT, size: EXPORT_SIZE })); return; }
    const next = { ...ctx };
    // Tag implies bold/italic …
    if (tag === 'strong' || tag === 'b') next.bold = true;
    if (tag === 'em' || tag === 'i') next.italics = true;
    if (tag === 'u') next.underline = true;
    if (tag === 'sup') next.sup = true;
    if (tag === 'sub') next.sub = true;
    if (tag === 'a') next.href = el.getAttribute('href') || ctx.href;
    // … but inline style WINS. This is the real fix for "everything
    // exports bold+italic": pasting from Google Docs / Word wraps the
    // whole selection in <b style="font-weight:normal"> (and italic
    // equivalents). The tag alone said bold; the style says it's not.
    // Reading the style here cancels the fake bold/italic — and also
    // promotes genuinely-bold spans (font-weight:700) that have no <b>.
    const style = (el.getAttribute('style') || '').toLowerCase();
    const fw = /font-weight\s*:\s*([a-z0-9]+)/.exec(style)?.[1];
    if (fw) {
      if (fw === 'bold' || fw === 'bolder' || (/^\d+$/.test(fw) && parseInt(fw, 10) >= 600)) next.bold = true;
      else if (fw === 'normal' || fw === 'lighter' || (/^\d+$/.test(fw) && parseInt(fw, 10) < 600)) next.bold = false;
    }
    const fsv = /font-style\s*:\s*([a-z]+)/.exec(style)?.[1];
    if (fsv) {
      if (fsv === 'italic' || fsv === 'oblique') next.italics = true;
      else if (fsv === 'normal') next.italics = false;
    }
    if (/text-decoration[^;]*underline/.test(style)) next.underline = true;
    out.push(...inlineRunsFromHtml(el, next));
  });
  return out.length ? out : [new TextRun({ text: '', font: EXPORT_FONT, size: EXPORT_SIZE })];
}

async function htmlToDocxChildren(html: string): Promise<(Paragraph | DocxTable)[]> {
  const children: (Paragraph | DocxTable)[] = [];
  const docHtml = new DOMParser().parseFromString(html || '', 'text/html');
  const blocks = Array.from(docHtml.body.childNodes);
  const pushPara = (el: HTMLElement) =>
    children.push(new Paragraph({ spacing: { after: 160, line: 312 }, children: inlineRunsFromHtml(el, {}) }));
  for (const raw of blocks) {
    if (raw.nodeType === 3) {
      const t = (raw.textContent || '').trim();
      if (t) children.push(new Paragraph({ spacing: { after: 160, line: 312 }, children: [new TextRun({ text: t, font: EXPORT_FONT, size: EXPORT_SIZE })] }));
      continue;
    }
    if (raw.nodeType !== 1) continue;
    const el = raw as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      children.push(new Paragraph({
        heading: tag === 'h1' ? HeadingLevel.HEADING_1 : tag === 'h2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 100 },
        children: inlineRunsFromHtml(el, {}),
      }));
    } else if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      el.querySelectorAll(':scope > li').forEach((li) =>
        children.push(new Paragraph({
          ...(ordered ? { numbering: { reference: 'ws-ol', level: 0 } } : { bullet: { level: 0 } }),
          spacing: { after: 80 },
          children: inlineRunsFromHtml(li, {}),
        })));
    } else if (tag === 'blockquote') {
      children.push(new Paragraph({ indent: { left: 480 }, spacing: { after: 120 }, children: inlineRunsFromHtml(el, {}) }));
    } else if (tag === 'table') {
      const rows: DocxTableRow[] = [];
      el.querySelectorAll(':scope > tbody > tr, :scope > tr').forEach((tr) => {
        const cells: DocxTableCell[] = [];
        tr.querySelectorAll(':scope > td, :scope > th').forEach((td) => {
          const isHeader = td.tagName.toLowerCase() === 'th';
          cells.push(new DocxTableCell({
            children: [new Paragraph({ children: inlineRunsFromHtml(td as HTMLElement, {}) })],
            shading: isHeader ? { fill: 'F3EAFF' } : undefined,
          }));
        });
        if (cells.length) rows.push(new DocxTableRow({ children: cells }));
      });
      if (rows.length) children.push(new DocxTable({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    } else if (tag === 'img') {
      const ir = await imageRunFromSrc(el.getAttribute('src') || '');
      if (ir) children.push(new Paragraph({ spacing: { before: 120, after: 160 }, children: [ir] }));
    } else if (tag === 'p' || tag === 'div') {
      const img = el.querySelector(':scope > img');
      if (img && (el.textContent || '').trim() === '') {
        const ir = await imageRunFromSrc(img.getAttribute('src') || '');
        if (ir) { children.push(new Paragraph({ spacing: { before: 120, after: 160 }, children: [ir] })); continue; }
      }
      pushPara(el);
    } else {
      pushPara(el);
    }
  }
  return children;
}

/** Build + download a faithful .docx from saved HTML (no live editor). */
export async function exportHtmlAsDocx(html: string, fileBase: string, fontCss = '', sizeKey = 'base') {
  EXPORT_FONT = cssFontToDocx(fontCss);
  EXPORT_SIZE = sizeKeyToHalfPt(sizeKey);
  const children = await htmlToDocxChildren(html);
  const blob = await Packer.toBlob(buildDocxDocument(children));
  saveAs(blob, `${(fileBase || 'document').replace(/[^\w.-]+/g, '_')}.docx`);
}

// The in-editor "Export → Word" now goes through the exact same
// HTML→docx pipeline as the document-card Download. The old path
// walked the ProseMirror doc via blockRuns(), which is what made
// every run come out bold+italic; serialising to HTML first and
// reusing inlineRunsFromHtml() (bold only inside <strong>/<b>,
// italic only inside <em>/<i>) fixes that and means there is ONE
// export code path to reason about.
async function exportDocx(editor: Editor, fileBase: string, fontCss = '', sizeKey = 'base') {
  await exportHtmlAsDocx(editor.getHTML(), fileBase, fontCss, sizeKey);
}

function exportTxt(editor: Editor, fileBase: string) {
  const blob = new Blob([editor.getText()], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${(fileBase || 'document').replace(/[^\w.-]+/g, '_')}.txt`);
}

function ExportMenu({ editor, fileBase, fontCss, sizeKey }: { editor: Editor; fileBase: string; fontCss: string; sizeKey: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export / download"
      >
        <Icon.Download />
        <span className="text-[13px] font-medium hidden sm:inline">Export</span>
        {open ? <Icon.ChevUp /> : <Icon.ChevDown />}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.20)] py-1">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true); setErr(null);
              try {
                await exportDocx(editor, fileBase, fontCss, sizeKey);
                setOpen(false);
              } catch (e) {
                console.error('[Export] docx failed', e);
                setErr('Couldn’t build the Word file. Try “Plain text” or remove a large image, then retry.');
              }
              setBusy(false);
            }}
            className="w-full text-left px-3 py-1.5 text-[14px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-60"
          >
            {busy ? 'Preparing…' : 'Word (.docx)'}
          </button>
          <button
            type="button"
            onClick={() => { try { exportTxt(editor, fileBase); setOpen(false); } catch (e) { console.error('[Export] txt failed', e); setErr('Couldn’t build the text file.'); } }}
            className="w-full text-left px-3 py-1.5 text-[14px] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Plain text (.txt)
          </button>
          {err && (
            <p className="px-3 py-2 mt-1 text-[12px] font-bold text-[#FF4B4B] leading-snug">{err}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Table menu ────────────────────────────────────────────── */
const TABLE_GRID_ROWS = 8;
const TABLE_GRID_COLS = 10;

function TableMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  // Re-derived every render (shouldRerenderOnTransaction keeps this
  // fresh as the selection moves in/out of a table).
  const inTable = editor.isActive('table');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const can = (name: string) => { try { return !!(editor.can() as any)[name]?.(); } catch { return false; } };
  const run = (fn: () => void) => { fn(); setOpen(false); };
  const item = 'w-full text-left px-3 py-1.5 text-[13px] font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2';
  const sectionLabel = 'px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400';
  const insertTable = (rows: number, cols: number) =>
    run(() => editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run());

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 transition-colors ${inTable ? 'bg-[#F3EAFF] text-[#8A48C7] dark:bg-[#A560E8]/15 dark:text-[#C9A0F0]' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Table"
      >
        <Icon.Table />
        {open ? <Icon.ChevUp /> : <Icon.ChevDown />}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-[244px] rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.28)] py-2">
          {/* Size picker — hover to choose dimensions */}
          <p className={sectionLabel}>Insert table</p>
          <div
            className="px-3 pb-1"
            onMouseLeave={() => setHover({ r: 0, c: 0 })}
          >
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${TABLE_GRID_COLS}, 1fr)` }}
            >
              {Array.from({ length: TABLE_GRID_ROWS * TABLE_GRID_COLS }).map((_, i) => {
                const r = Math.floor(i / TABLE_GRID_COLS) + 1;
                const c = (i % TABLE_GRID_COLS) + 1;
                const on = r <= hover.r && c <= hover.c;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHover({ r, c })}
                    onClick={() => insertTable(r, c)}
                    aria-label={`${r} by ${c} table`}
                    className={`h-[15px] w-full rounded-[3px] border transition-colors ${on ? 'bg-[#A560E8] border-[#7733B5]' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-[#A560E8]/50'}`}
                  />
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] font-extrabold text-stone-500 dark:text-stone-400 tabular-nums">
              {hover.r > 0 ? `${hover.r} × ${hover.c}` : 'Pick a size'}
            </p>
          </div>

          {inTable && (
            <>
              <div className="my-1.5 border-t border-stone-100 dark:border-stone-800" />
              <p className={sectionLabel}>Rows</p>
              <button type="button" disabled={!can('addRowBefore')} className={item} onClick={() => run(() => editor.chain().focus().addRowBefore().run())}>Insert row above</button>
              <button type="button" disabled={!can('addRowAfter')} className={item} onClick={() => run(() => editor.chain().focus().addRowAfter().run())}>Insert row below</button>
              <button type="button" disabled={!can('deleteRow')} className={item} onClick={() => run(() => editor.chain().focus().deleteRow().run())}>Delete row</button>

              <p className={sectionLabel}>Columns</p>
              <button type="button" disabled={!can('addColumnBefore')} className={item} onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}>Insert column left</button>
              <button type="button" disabled={!can('addColumnAfter')} className={item} onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}>Insert column right</button>
              <button type="button" disabled={!can('deleteColumn')} className={item} onClick={() => run(() => editor.chain().focus().deleteColumn().run())}>Delete column</button>

              <p className={sectionLabel}>Cells & headers</p>
              <button type="button" disabled={!can('mergeCells')} className={item} onClick={() => run(() => editor.chain().focus().mergeCells().run())}>Merge selected cells</button>
              <button type="button" disabled={!can('splitCell')} className={item} onClick={() => run(() => editor.chain().focus().splitCell().run())}>Split cell</button>
              <button type="button" disabled={!can('toggleHeaderRow')} className={item} onClick={() => run(() => editor.chain().focus().toggleHeaderRow().run())}>Toggle header row</button>
              <button type="button" disabled={!can('toggleHeaderColumn')} className={item} onClick={() => run(() => editor.chain().focus().toggleHeaderColumn().run())}>Toggle header column</button>

              <div className="my-1.5 border-t border-stone-100 dark:border-stone-800" />
              <button type="button" disabled={!can('deleteTable')} className={`${item} text-[#FF4B4B] hover:text-[#FF4B4B] hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10`} onClick={() => run(() => editor.chain().focus().deleteTable().run())}>Delete table</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Citation insert ───────────────────────────────────────── */
const CITE_STYLES = ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE'];
type CiteResult = { citation: string; in_text_citation?: string; year?: string; type?: string };

function CitationInsertModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('APA');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<CiteResult[] | null>(null);
  const strip = (h: string) => (h || '').replace(/<[^>]+>/g, '').trim();

  const search = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ researchTopic: t, citationStyle: style, numberOfCitations: 6 }),
      });
      const json = await res.json();
      if (res.status === 429) { setErr(json?.message || "You've hit your citation search limit. Upgrade for more."); return; }
      if (!res.ok || json?.success === false) throw new Error(json?.message || `Search failed (${res.status})`);
      const data = json?.data ?? json;
      setResults(Array.isArray(data?.citations) ? data.citations : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not run that search.');
    } finally { setLoading(false); }
  };

  const insertRef = (c: CiteResult) => {
    const ref = strip(c.citation);
    if (ref) editor.chain().focus().insertContent(`<p>${ref.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).run();
    onClose();
  };
  const insertInText = (c: CiteResult) => {
    const t = (c.in_text_citation || '').trim();
    if (t) editor.chain().focus().insertContent(` ${t}`).run();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-1" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Insert a citation</h3>
        <p className="text-[13px] text-stone-500 dark:text-stone-400 font-medium mb-4">Find a real source and drop the formatted reference straight into your draft.</p>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          autoFocus
          placeholder="What are you citing? e.g. social media and adolescent sleep"
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 resize-none"
        />
        <div className="mt-3 flex items-center gap-2">
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="px-3 py-2 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[13px] font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40">
            {CITE_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" onClick={search} disabled={loading || !topic.trim()} className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">
            {loading ? 'Searching…' : 'Find sources'}
          </button>
        </div>
        {err && <p className="mt-3 text-[12px] font-bold text-[#D63A3A]">{err}</p>}
        {loading && <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />)}</div>}
        {!loading && results && (
          results.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500 text-center py-6">No sources found — try a broader topic.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {results.map((c, i) => (
                <div key={i} className="rounded-xl border-2 border-stone-200 dark:border-stone-700 p-3">
                  <p className="text-[12.5px] leading-relaxed text-stone-800 dark:text-stone-100">{strip(c.citation)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => insertRef(c)} className="px-3 py-1 rounded-lg bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[11px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all">Insert reference</button>
                    {c.in_text_citation && (
                      <button type="button" onClick={() => insertInText(c)} className="px-3 py-1 rounded-lg border-2 border-stone-200 dark:border-stone-700 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 hover:border-[#A560E8]/40 transition-colors">Insert in-text {c.in_text_citation}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        <button type="button" onClick={onClose} className="mt-5 w-full py-2 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 text-sm font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all">Close</button>
      </div>
    </div>
  );
}

/* ─── Main editor ───────────────────────────────────────────── */
export default function WriteEditor({
  initialHtml,
  placeholder = 'Start writing your essay…',
  onSave,
  toolbarRight,
  saveStatus,
  annotations,
  annotationPreviewRatio = null,
  selectedAnnotationId = null,
  onAnnotationClick,
  onAnnotationHover,
  onEditorReady,
  wordLimit = null,
  onUpgrade,
  exportFileName = 'document',
  headerless = false,
}: WriteEditorProps) {
  // Latest onSave kept in a ref so the debounce closure always
  // sees the freshest callback without re-creating the editor.
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Skip the very first onUpdate call (the one fired right after
  // the editor mounts and ingests `initialHtml`) so we don't
  // autosave the same content right back to the server.
  const skipNextUpdateRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dirty tracking so we can flush the pending autosave on exit
  // (unmount / tab close / tab hidden) instead of dropping the last
  // few seconds of typing when the debounce hasn't fired yet.
  const dirtyRef = useRef(false);
  const lastPayloadRef = useRef<{ html: string; text: string; wordCount: number } | null>(null);
  const flushSave = useCallback(() => {
    if (!dirtyRef.current || !lastPayloadRef.current) return;
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    dirtyRef.current = false;
    onSaveRef.current(lastPayloadRef.current);
  }, []);

  // Formatting toolbar can be collapsed for distraction-free
  // writing. Preference is remembered across sessions. The Analyze
  // button + save status stay visible either way.
  const [toolbarOpen, setToolbarOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('writescholar_editor_toolbar') !== 'off'; } catch { return true; }
  });
  const toggleToolbar = useCallback(() => {
    setToolbarOpen((v) => {
      const next = !v;
      try { localStorage.setItem('writescholar_editor_toolbar', next ? 'on' : 'off'); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Feedback marks stay visible (you can always see *where* the
  // notes are) but their interactivity — the hover tooltip and
  // click-to-open-in-panel — can be switched off so the underlined
  // text is just text you can edit without anything popping up.
  const [feedbackInteractive, setFeedbackInteractive] = useState<boolean>(() => {
    try { return localStorage.getItem('writescholar_feedback_interactive') !== 'off'; } catch { return true; }
  });
  const feedbackInteractiveRef = useRef(feedbackInteractive);
  useEffect(() => { feedbackInteractiveRef.current = feedbackInteractive; }, [feedbackInteractive]);
  // True for one tick when the selection change came from clicking a
  // mark *in the editor* (vs. a card in the side panel). Used to
  // suppress the auto-scroll so clicking to edit never yanks the
  // page to the feedback.
  const selectionFromEditorRef = useRef(false);
  const toggleFeedback = useCallback(() => {
    setFeedbackInteractive((v) => {
      const next = !v;
      try { localStorage.setItem('writescholar_feedback_interactive', next ? 'on' : 'off'); } catch { /* noop */ }
      if (!next) onAnnotationHover?.(null, null); // dismiss any open tooltip
      return next;
    });
  }, [onAnnotationHover]);

  // Wrappers handed to the extension. They respect the toggle and
  // tag editor-originated clicks so the scroll effect can ignore
  // them. The extension never consumes the click either way, so the
  // caret always lands and the text stays editable.
  const handleMarkClick = useCallback((id: string) => {
    if (!feedbackInteractiveRef.current) return;
    selectionFromEditorRef.current = true;
    onAnnotationClick?.(id);
  }, [onAnnotationClick]);
  const handleMarkHover = useCallback((id: string | null, rect: DOMRect | null) => {
    if (!feedbackInteractiveRef.current) { onAnnotationHover?.(null, null); return; }
    onAnnotationHover?.(id, rect);
  }, [onAnnotationHover]);

  // Live word count, updated on every keystroke (independent of the
  // debounced autosave) so the footer always reflects what's typed.
  const [wordCount, setWordCount] = useState(0);
  // Writing font — applied to the whole editor surface and
  // remembered across sessions.
  const [editorFont, setEditorFont] = useState<string>(() => {
    try { return localStorage.getItem('writescholar_editor_font') || ''; } catch { return ''; }
  });
  const changeFont = useCallback((css: string) => {
    setEditorFont(css);
    try { localStorage.setItem('writescholar_editor_font', css); } catch { /* noop */ }
  }, []);
  // Writing size — applied to the whole editor surface (headings
  // scale proportionally) and remembered across sessions.
  const [editorFontSize, setEditorFontSize] = useState<string>(() => {
    try { return localStorage.getItem('writescholar_editor_fontsize') || 'base'; } catch { return 'base'; }
  });
  const changeFontSize = useCallback((key: string) => {
    setEditorFontSize(key);
    try { localStorage.setItem('writescholar_editor_fontsize', key); } catch { /* noop */ }
  }, []);
  // Refs so the editorProps input handlers (created once at editor
  // construction) always see the latest count + free-tier cap.
  const wordCountRef = useRef(0);
  const wordLimitRef = useRef<number | null>(wordLimit);
  useEffect(() => { wordLimitRef.current = wordLimit; }, [wordLimit]);
  const setWords = useCallback((n: number) => { wordCountRef.current = n; setWordCount(n); }, []);
  // True once a free user is at/over their writing allowance.
  const limitReached = wordLimit != null && wordCount >= wordLimit;
  // Should this content-adding input be blocked right now?
  const atCap = () => wordLimitRef.current != null && wordCountRef.current >= wordLimitRef.current;

  const editor = useEditor({
    immediatelyRender: false,
    // TipTap v3 stopped re-rendering React on every transaction by
    // default — without this the toolbar never updates with the
    // selection, so isActive('table'/'bold'/…) is stale and the
    // table row/column/delete controls stay permanently disabled.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        // StarterKit ships its own underline, but we want the
        // dedicated extension so the editor.commands API exposes
        // toggleUnderline cleanly.
        link: false,
      }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', class: 'text-[#A560E8] underline underline-offset-2' },
      }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'ws-img' } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'ws-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      // AnalyzerHighlights — Phase-2 inline annotations. The
      // initial options snapshot is taken here; subsequent changes
      // are pushed via `setAnalyzerAnnotations()` in the effect
      // below so we don't have to recreate the editor each time
      // the analysis result lands.
      AnalyzerHighlights.configure({
        annotations: annotations ?? [],
        selectedAnnotationId: selectedAnnotationId ?? null,
        onAnnotationClick: handleMarkClick,
        onAnnotationHover: handleMarkHover,
        previewRatio: annotationPreviewRatio ?? null,
        onUpgrade,
      }),
    ],
    content: initialHtml || '',
    onCreate: ({ editor: ed }) => setWords(countWords(ed.getText())),
    editorProps: {
      attributes: {
        class:
          // Tailwind typography-ish styles with brand-purple links
          // and comfortable academic-essay defaults. `min-h-[60vh]`
          // keeps the editing surface tall on every viewport.
          'prose prose-stone dark:prose-invert max-w-none focus:outline-none ' +
          'min-h-[60vh] sm:min-h-[70vh] px-6 sm:px-10 lg:px-16 py-8 sm:py-10 ' +
          'leading-relaxed [&>p]:my-3 [&>h1]:mt-6 [&>h2]:mt-5 [&>h3]:mt-4 ' +
          'text-[15px] sm:text-base text-stone-800 dark:text-stone-100',
      },
      // ── Free-tier writing cap ──────────────────────────────
      // Once a free user hits the allowance we block input that
      // ADDS content (typing, paste, drop, Enter) but never block
      // deleting/selecting/navigating — they keep their work, can
      // trim it, and can still analyze. Paid users have wordLimit
      // null so atCap() is always false (no-op).
      handleTextInput: () => atCap(),
      handlePaste: () => atCap(),
      handleDrop: () => atCap(),
      handleKeyDown: (_view, event) => {
        if (!atCap()) return false;
        // Block only content-adding keys; allow editing/navigation.
        if (event.key === 'Enter' || event.key === 'Tab') return true;
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) return true;
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Word count is live — update it every keystroke, even on the
      // skipped first update, so the footer is never stale.
      setWords(countWords(ed.getText()));
      if (skipNextUpdateRef.current) {
        skipNextUpdateRef.current = false;
        return;
      }
      // Mark dirty + remember the latest content so an exit (unmount
      // / tab close) can flush it even before the debounce fires.
      {
        const text = ed.getText();
        lastPayloadRef.current = { html: ed.getHTML(), text, wordCount: countWords(text) };
        dirtyRef.current = true;
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const html = ed.getHTML();
        const text = ed.getText();
        dirtyRef.current = false;
        onSaveRef.current({ html, text, wordCount: countWords(text) });
      }, AUTOSAVE_DEBOUNCE_MS);
    },
  });

  // Flush any pending autosave when the editor unmounts (e.g. "Back
  // to all documents") OR the tab is closed/hidden — never silently
  // drop the last few seconds of typing.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushSave(); };
    window.addEventListener('beforeunload', flushSave);
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', flushSave);
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', onHide);
      flushSave();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [flushSave]);

  // Hand the editor instance up so the parent can run imperative
  // ops like applyAnnotationRevision(). Fires once, when ready.
  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Push annotation updates into the AnalyzerHighlights plugin via
  // its meta channel — avoids tearing down + rebuilding the editor
  // whenever the parent's analysis result changes. JSON.stringify
  // is the cheap dep-equality check that covers re-orders.
  useEffect(() => {
    if (!editor) return;
    setAnalyzerAnnotations(editor, annotations ?? [], selectedAnnotationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, JSON.stringify(annotations), selectedAnnotationId]);

  // Scroll to an annotation only when the user picked it from the
  // side panel (deliberate "take me there"). When the selection
  // came from clicking the mark in the editor, the user is already
  // there and editing — scrolling would yank the text away, so we
  // consume the one-shot flag and skip it.
  useEffect(() => {
    if (!editor || !selectedAnnotationId || !annotations) return;
    if (selectionFromEditorRef.current) {
      selectionFromEditorRef.current = false;
      return;
    }
    const target = annotations.find((a) => a.id === selectedAnnotationId);
    if (target) scrollToAnnotation(editor, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnnotationId]);

  // Force one save on Ctrl/Cmd+S even if the debounce hasn't fired.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!editor) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        const text = editor.getText();
        dirtyRef.current = false;
        onSaveRef.current({ html: editor.getHTML(), text, wordCount: countWords(text) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);

  // Link prompt — TipTap's setLink takes an href. Empty href clears.
  const promptForLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Image insert — read the file inline as a data URL so it persists
  // in the saved HTML with no backend change. Capped so a huge photo
  // doesn't bloat every autosave.
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const handleImageFile = useCallback((file: File) => {
    if (!editor) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) {
      window.alert('That image is over 4MB. Please use a smaller image (or insert it by URL).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const [citeOpen, setCiteOpen] = useState(false);

  // Footnote v1 — a superscript marker at the cursor + an
  // auto-numbered "Footnotes" list appended at the end. Numbering
  // is derived from the existing footnote lines so it survives
  // reloads. (True page-bottom footnotes need a paginated view.)
  const insertFootnote = useCallback(() => {
    if (!editor) return;
    const text = window.prompt('Footnote text');
    if (!text || !text.trim()) return;
    const existing = (editor.getText().match(/^\[\d+\]/gm) || []).length;
    const n = existing + 1;
    editor.chain().focus().insertContent({ type: 'text', marks: [{ type: 'superscript' }], text: `[${n}]` }).run();
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const block = (n === 1 ? '<h3>Footnotes</h3>' : '') + `<p>[${n}] ${esc(text.trim())}</p>`;
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, block).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      {/* ─── Toolbar ─────────────────────────────────────────── */}
      {/* Sticky formatting + Re-analyze / analyses-left / autosave bar.
          Pins below the global header normally; when the host hides
          the header (headerless editor view) it pins to the very top
          so there's no dead band where the header used to be. */}
      <div className={`sticky ${headerless ? 'top-0' : 'top-[3.5rem] sm:top-[4.25rem]'} z-20 flex flex-wrap items-center gap-1 px-3 sm:px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur`}>
        {/* Toggle — collapse the formatting toolbar for
            distraction-free writing. Analyze + save stay visible. */}
        <TBtn
          title={toolbarOpen ? 'Hide formatting toolbar' : 'Show formatting toolbar'}
          active={!toolbarOpen}
          onClick={toggleToolbar}
        >
          <Icon.Sliders />
        </TBtn>

        {/* Feedback interaction toggle — only when there's analysis
            on the page. Off = underlines stay but nothing pops up on
            hover/click, so annotated text is just editable text. */}
        {annotations && annotations.length > 0 && (
          <TBtn
            title={feedbackInteractive ? 'Feedback popups on — click to edit freely (hide hover/click)' : 'Feedback popups off — click to turn back on'}
            active={!feedbackInteractive}
            onClick={toggleFeedback}
          >
            {feedbackInteractive ? <Icon.Feedback /> : <Icon.FeedbackOff />}
          </TBtn>
        )}

        {toolbarOpen && (
          <>
            <TDivider />

            {/* Undo / redo */}
            <TBtn title="Undo (⌘Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Icon.Undo /></TBtn>
            <TBtn title="Redo (⌘⇧Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Icon.Redo /></TBtn>

            <TDivider />

            {/* Heading dropdown */}
            <HeadingDropdown editor={editor} />

            <TDivider />

            {/* Writing font + size */}
            <FontDropdown value={editorFont} onChange={changeFont} />
            <FontSizeDropdown value={editorFontSize} onChange={changeFontSize} />

            <TDivider />

            {/* B I U S */}
            <TBtn title="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Icon.Bold /></TBtn>
            <TBtn title="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Icon.Italic /></TBtn>
            <TBtn title="Underline (⌘U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Icon.Underline /></TBtn>
            <TBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Icon.Strike /></TBtn>
            <TBtn title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Icon.Code /></TBtn>

            {/* Sub / sup */}
            <TBtn title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}><Icon.Sup /></TBtn>
            <TBtn title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}><Icon.Sub /></TBtn>

            {/* Link */}
            <TBtn title="Link" active={editor.isActive('link')} onClick={promptForLink}><Icon.Link /></TBtn>

            <TDivider />

            {/* Table + image */}
            <TableMenu editor={editor} />
            <TBtn title="Insert image" onClick={() => imageInputRef.current?.click()}><Icon.Image /></TBtn>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
            />

            <TDivider />

            {/* Citation + footnote */}
            <TBtn title="Insert citation" onClick={() => setCiteOpen(true)}><Icon.Cite /></TBtn>
            <TBtn title="Insert footnote" onClick={insertFootnote}><Icon.Footnote /></TBtn>

            {/* Placeholder "comment" dot from the reference design.
                Keeps the visual real estate; wired to a no-op for now
                so a future "Add comment" extension can take this slot. */}
            <TBtn title="Comments coming soon" disabled onClick={() => {}}><Icon.Comment /></TBtn>

            <TDivider />

            {/* Export / download */}
            <ExportMenu editor={editor} fileBase={exportFileName} fontCss={editorFont} sizeKey={editorFontSize} />
          </>
        )}

        {/* Right side — analyze button + save status pushed flush right */}
        <div className="ml-auto flex items-center gap-2">
          {saveStatus}
          {toolbarRight}
        </div>
      </div>

      {/* ─── Free-tier writing cap banner ───────────────────────
          Shows once a free user hits the allowance. Non-blocking:
          they keep their text, can trim it, and can still analyze. */}
      {limitReached && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-6 py-2.5 border-b-2 border-[#A560E8]/30 bg-[#F3EAFF] dark:bg-[#A560E8]/15">
          <p className="text-[12px] sm:text-[13px] font-extrabold text-[#8A48C7] dark:text-[#C9A0F0] leading-snug">
            You've reached the free {wordLimit}-word writing limit. Upgrade to keep writing this draft.
          </p>
          <button
            type="button"
            onClick={() => onUpgrade?.()}
            className="sm:ml-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[11px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Upgrade to keep writing
          </button>
        </div>
      )}

      {/* ─── Editor surface ──────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900" data-fs={editorFontSize} style={editorFont ? { fontFamily: editorFont } : undefined}>
        <EditorContent editor={editor} />
      </div>

      {/* ─── Word count footer ───────────────────────────────────
          Quiet bottom-right counter, like Docs/Word. Sticky so it
          stays visible while scrolling a long draft. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 px-4 sm:px-6 py-1.5 border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur">
        {wordLimit != null ? (
          <>
            <span className={`text-[11px] font-extrabold tabular-nums ${limitReached ? 'text-[#8A48C7]' : wordCount >= wordLimit * 0.8 ? 'text-[#A560E8]' : 'text-stone-400 dark:text-stone-500'}`}>
              {wordCount.toLocaleString()} / {wordLimit.toLocaleString()} words
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-400">Free</span>
            <button
              type="button"
              onClick={() => onUpgrade?.()}
              className="text-[11px] font-extrabold text-[#A560E8] hover:text-[#8A48C7] hover:underline"
            >
              Upgrade
            </button>
          </>
        ) : (
          <span className="text-[11px] font-extrabold text-stone-400 dark:text-stone-500 tabular-nums">
            {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
          </span>
        )}
      </div>

      {/* Tiny scoped placeholder styling — TipTap's Placeholder
          extension just adds an `is-editor-empty` class; we hook
          the visible "ghost" text via CSS pseudo. */}
      <style>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(168 162 158);
          pointer-events: none;
          height: 0;
        }
        /* Writing size — the descendant selector (specificity 0,2,0)
           wins over the editor root's text-[15px]/sm:text-base
           utilities (0,1,0). Headings are em-based so they scale
           proportionally. */
        [data-fs="xs"]   .ProseMirror { font-size: 12px; }
        [data-fs="sm"]   .ProseMirror { font-size: 14px; }
        [data-fs="base"] .ProseMirror { font-size: 16px; }
        [data-fs="lg"]   .ProseMirror { font-size: 19px; }
        [data-fs="xl"]   .ProseMirror { font-size: 22px; }

        /* Tables */
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; overflow: hidden; table-layout: fixed; }
        .ProseMirror td, .ProseMirror th { border: 1px solid rgb(214 211 209); padding: 6px 10px; vertical-align: top; position: relative; min-width: 3rem; }
        .dark .ProseMirror td, .dark .ProseMirror th { border-color: rgb(68 64 60); }
        .ProseMirror th { background: #F3EAFF; font-weight: 800; text-align: left; }
        .dark .ProseMirror th { background: rgba(165,96,232,0.15); }
        .ProseMirror .selectedCell:after { content: ''; position: absolute; inset: 0; background: rgba(165,96,232,0.12); pointer-events: none; }
        .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #A560E8; cursor: col-resize; }
        .ProseMirror .tableWrapper { overflow-x: auto; }

        /* Images */
        .ProseMirror img.ws-img { max-width: 100%; height: auto; border-radius: 12px; margin: 0.75rem auto; display: block; }
        .ProseMirror img.ws-img.ProseMirror-selectednode { outline: 3px solid rgba(165,96,232,0.6); outline-offset: 2px; }
      `}</style>

      {citeOpen && <CitationInsertModal editor={editor} onClose={() => setCiteOpen(false)} />}
    </div>
  );
}
