import { useCallback, useEffect, useRef, useState } from 'react';
import WriteEditor from './WriteEditor';
import mammoth from 'mammoth';

/* ═══════════════════════════════════════════════════════════════
   WritePage — dashboard "Write" tool. Two views:
   1. HUB    — recent docs grid + "+ New document" + DOCX upload.
   2. EDITOR — title input + WriteEditor + save-status pill +
               "Analyze" button (UI only for now; analyzer hook-up
               is the Phase-2 follow-up).

   Save flow:
   • Brand-new doc → first onSave POSTs to /api/documents/upload
     to mint a row, then subsequent saves PUT /content.
   • Existing doc → every onSave PUTs to /api/documents/:id/content.
   • UI state: 'idle' | 'saving' | 'saved' | 'error' — pill in
     the toolbar reflects the current state.
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type DocSummary = {
  id: string;
  title: string;
  wordCount: number;
  updatedAt: string;
  lastEditedAt?: string | null;
};

type DocFull = DocSummary & {
  contentHtml: string | null;
  contentText: string | null;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface WritePageProps {
  /** Optional: open this doc immediately on mount. */
  initialDocumentId?: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* ─── HUB list view ─────────────────────────────────────────── */
function WriteHub({
  docs,
  loading,
  onNew,
  onOpen,
  onUpload,
}: {
  docs: DocSummary[];
  loading: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
  onUpload: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-[#A560E8]">Write</p>
          <h1 className="dash-serif mt-1 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50">
            Your writing workspace
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-medium leading-snug max-w-xl">
            Draft essays, paste in research, or open one of your existing uploads. Autosaves while you type.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            Import .docx
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_22px_-8px_rgba(165,96,232,0.55)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
            </svg>
            New document
          </button>
        </div>
      </div>

      {/* Recent grid */}
      <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">Recent documents</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-stone-500 dark:text-stone-400">Loading your documents…</div>
        ) : docs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-[#F3EAFF] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#A560E8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
              </svg>
            </div>
            <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">No documents yet</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Hit "New document" to start your first draft.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onOpen(d.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8] border border-[#A560E8]/20" aria-hidden>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V8.83a2 2 0 00-.59-1.42l-3.83-3.83A2 2 0 0014.17 3H6a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-[15px] font-extrabold text-stone-800 dark:text-stone-100 truncate">{d.title || 'Untitled'}</p>
                      <p className="text-[11px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 mt-0.5">
                        {d.wordCount.toLocaleString()} words · edited {timeAgo(d.lastEditedAt || d.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-[#A560E8] transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── EDITOR view (title + WriteEditor + analyze + status) ──── */
function WriteEditorView({
  docId,
  initialTitle,
  initialHtml,
  onTitleSave,
  onContentSave,
  onBack,
  onAnalyze,
}: {
  docId: string;
  initialTitle: string;
  initialHtml: string;
  onTitleSave: (title: string) => Promise<void>;
  onContentSave: (payload: { html: string; text: string; wordCount: number }) => Promise<void>;
  onBack: () => void;
  onAnalyze: () => void;
}) {
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const titleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Title autosave (debounced 1.2s).
  useEffect(() => {
    if (title === initialTitle) return;
    if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current);
    titleSaveTimerRef.current = setTimeout(() => { void onTitleSave(title); }, 1200);
    return () => { if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleContentSave = useCallback(async (payload: { html: string; text: string; wordCount: number }) => {
    setSaveStatus('saving');
    try {
      await onContentSave(payload);
      setSavedAt(new Date());
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [onContentSave]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top row — back + title */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-extrabold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          All docs
        </button>
      </div>

      <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden">
        {/* Title input — borderless, looks like the doc heading */}
        <div className="px-6 sm:px-10 lg:px-16 pt-8 pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Document title"
            className="w-full bg-transparent border-0 outline-none focus:outline-none text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-50 placeholder:text-stone-300 dark:placeholder:text-stone-700"
          />
        </div>

        {/* Editor + toolbar */}
        <WriteEditor
          key={docId} /* remount when switching docs so initialHtml seeds cleanly */
          initialHtml={initialHtml}
          onSave={handleContentSave}
          saveStatus={
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                saveStatus === 'saving'
                  ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  : saveStatus === 'saved'
                    ? 'bg-[#E5F8D0] text-[#46A302]'
                    : saveStatus === 'error'
                      ? 'bg-[#FFE8E8] text-[#FF4B4B]'
                      : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
              }`}
              aria-live="polite"
            >
              {saveStatus === 'saving' && (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Saving…
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
                  Saved {savedAt ? timeAgo(savedAt.toISOString()) : ''}
                </>
              )}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && 'Autosave on'}
            </span>
          }
          toolbarRight={
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-wider border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze
            </button>
          }
        />
      </div>
    </div>
  );
}

/* ─── Page shell ────────────────────────────────────────────── */
export default function WritePage({ initialDocumentId }: WritePageProps = {}) {
  const [view, setView] = useState<'hub' | 'editor'>(initialDocumentId ? 'editor' : 'hub');
  const [openDocId, setOpenDocId] = useState<string | null>(initialDocumentId ?? null);
  const [openDoc, setOpenDoc] = useState<DocFull | null>(null);
  const [docList, setDocList] = useState<DocSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load recent doc list on hub mount. */
  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${API_URL}/documents`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load documents');
      const json = await res.json();
      const docs = (json?.data?.documents ?? json?.documents ?? []) as Array<Record<string, unknown>>;
      setDocList(docs.map((d) => ({
        id: String(d.id),
        title: String(d.title ?? 'Untitled'),
        wordCount: Number(d.wordCount ?? d.word_count ?? 0),
        updatedAt: String(d.updatedAt ?? d.updated_at ?? new Date().toISOString()),
        lastEditedAt: (d.lastEditedAt ?? d.last_edited_at ?? null) as string | null,
      })));
    } catch (e) {
      console.error('[Write] list load error', e);
      setError('Could not load your recent documents.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'hub') void refreshList();
  }, [view, refreshList]);

  /* Load a specific doc when opening the editor view. */
  useEffect(() => {
    if (view !== 'editor' || !openDocId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/documents/${openDocId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load document');
        const json = await res.json();
        const d = json?.data?.document;
        if (cancelled) return;
        setOpenDoc({
          id: String(d.id),
          title: String(d.title ?? 'Untitled'),
          wordCount: Number(d.wordCount ?? 0),
          updatedAt: String(d.updatedAt ?? new Date().toISOString()),
          lastEditedAt: (d.lastEditedAt ?? null) as string | null,
          contentHtml: (d.contentHtml ?? null) as string | null,
          contentText: (d.content_text ?? null) as string | null,
        });
      } catch (e) {
        console.error('[Write] doc load error', e);
        setError('Could not load that document.');
      }
    })();
    return () => { cancelled = true; };
  }, [view, openDocId]);

  /* CREATE flow — first save mints a row via /upload. */
  const createNewDoc = useCallback(async (initial?: { title?: string; html?: string; text?: string }) => {
    const title = initial?.title ?? 'Untitled';
    const text = initial?.text ?? '';
    const html = initial?.html ?? '';
    try {
      const fd = new FormData();
      // Pasted-text endpoint — backend doesn't require a real file.
      fd.append('title', title);
      fd.append('content', text);
      const res = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const json = await res.json();
      const id = String(json?.data?.document?.id ?? json?.document?.id);
      if (!id) throw new Error('No document id returned');
      // Persist HTML immediately so the new row already has formatting.
      if (html) {
        await fetch(`${API_URL}/documents/${id}/content`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentHtml: html, contentText: text, wordCount: text ? text.trim().split(/\s+/).filter(Boolean).length : 0 }),
        });
      }
      return id;
    } catch (e) {
      console.error('[Write] create error', e);
      setError('Could not create a new document.');
      return null;
    }
  }, []);

  const handleNewDoc = useCallback(async () => {
    const id = await createNewDoc({ title: 'Untitled', html: '', text: '' });
    if (id) {
      setOpenDocId(id);
      setOpenDoc({ id, title: 'Untitled', wordCount: 0, updatedAt: new Date().toISOString(), lastEditedAt: null, contentHtml: '', contentText: '' });
      setView('editor');
    }
  }, [createNewDoc]);

  /* DOCX import via mammoth.js. Falls through to createNewDoc with the parsed HTML. */
  const handleUpload = useCallback(async (file: File) => {
    try {
      let html = '';
      let text = '';
      if (file.name.toLowerCase().endsWith('.docx')) {
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        html = result.value;
        const textRes = await mammoth.extractRawText({ arrayBuffer: buf });
        text = textRes.value;
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
        html = `<p>${text.replace(/\n+/g, '</p><p>')}</p>`;
      } else {
        setError('Only .docx and .txt files can be imported into the editor.');
        return;
      }
      const title = file.name.replace(/\.(docx|txt)$/i, '');
      const id = await createNewDoc({ title, html, text });
      if (id) {
        setOpenDocId(id);
        setOpenDoc({ id, title, wordCount: text ? text.trim().split(/\s+/).filter(Boolean).length : 0, updatedAt: new Date().toISOString(), lastEditedAt: null, contentHtml: html, contentText: text });
        setView('editor');
      }
    } catch (e) {
      console.error('[Write] import error', e);
      setError('Could not read that file. Try saving it as .docx or .txt.');
    }
  }, [createNewDoc]);

  /* Open existing doc. */
  const handleOpenDoc = useCallback((id: string) => {
    setOpenDocId(id);
    setOpenDoc(null); // clears stale, triggers loader
    setView('editor');
  }, []);

  /* Title save. */
  const handleTitleSave = useCallback(async (newTitle: string) => {
    if (!openDocId) return;
    try {
      await fetch(`${API_URL}/documents/${openDocId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setOpenDoc((prev) => (prev ? { ...prev, title: newTitle } : prev));
    } catch (e) {
      console.error('[Write] title save error', e);
    }
  }, [openDocId]);

  /* Content save. */
  const handleContentSave = useCallback(async (payload: { html: string; text: string; wordCount: number }) => {
    if (!openDocId) return;
    const res = await fetch(`${API_URL}/documents/${openDocId}/content`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentHtml: payload.html, contentText: payload.text, wordCount: payload.wordCount }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  }, [openDocId]);

  /* Phase-1 stub — analyzer integration is the next session. */
  const handleAnalyze = useCallback(() => {
    alert('Analyzer integration coming next. The editor is saving your draft now — we\'ll wire it through to your existing rubric + annotations in the next pass.');
  }, []);

  if (view === 'editor' && openDocId) {
    if (!openDoc) {
      return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-stone-500">Loading document…</div>;
    }
    return (
      <WriteEditorView
        docId={openDoc.id}
        initialTitle={openDoc.title}
        initialHtml={openDoc.contentHtml || (openDoc.contentText ? `<p>${openDoc.contentText.replace(/\n+/g, '</p><p>')}</p>` : '')}
        onTitleSave={handleTitleSave}
        onContentSave={handleContentSave}
        onBack={() => { setView('hub'); setOpenDocId(null); setOpenDoc(null); }}
        onAnalyze={handleAnalyze}
      />
    );
  }

  return (
    <>
      <WriteHub
        docs={docList}
        loading={listLoading}
        onNew={handleNewDoc}
        onOpen={handleOpenDoc}
        onUpload={handleUpload}
      />
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border-2 border-[#FF4B4B] bg-white dark:bg-stone-900 px-4 py-2 text-sm font-extrabold text-[#FF4B4B] shadow-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 text-[11px] font-bold text-stone-500 underline">dismiss</button>
        </div>
      )}
    </>
  );
}
