import { useCallback, useEffect, useRef, useState } from 'react';
import PreviewStrip from './PreviewStrip';

/* ═══════════════════════════════════════════════════════════════
   StudyPacksPanel — notes → a full study pack (lesson, flashcards,
   quiz, crossword, arcade games). Generation + recents happen in
   the workspace; the interactive pack opens in the dedicated
   full-screen viewer (it needs the room — games etc.).
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DRAFT_KEY = 'writescholar_dashboard_draft';
const VIEWER_KEY = 'writescholar_study_pack_viewer';

function authHeaders(json = true): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type Recent = { id: string; title: string; created_at: string; questions: unknown };

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function StudyPacksPanel({ onNavigate }: { onNavigate: (page: string, slug?: string, options?: unknown) => void }) {
  const [notes, setNotes] = useState(() => {
    try { return sessionStorage.getItem(DRAFT_KEY) || ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [recents, setRecents] = useState<Recent[] | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).filter(Boolean).length : 0;

  const loadRecents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/analysis/quiz-history?limit=20`, { headers: authHeaders(false) });
      if (!res.ok) return;
      const json = await res.json();
      const rows = (json?.data ?? []) as Array<Record<string, unknown>>;
      setRecents(
        rows
          .filter((r) => r.quiz_type === 'study_pack')
          .slice(0, 8)
          .map((r) => ({
            id: String(r.id),
            title: String(r.title ?? 'Study pack'),
            created_at: String(r.created_at ?? new Date().toISOString()),
            questions: r.questions,
          })),
      );
    } catch { /* recents are best-effort */ }
  }, []);

  useEffect(() => { void loadRecents(); }, [loadRecents]);

  const openViewer = (data: unknown, title: string) => {
    try { sessionStorage.setItem(VIEWER_KEY, JSON.stringify({ data, title })); } catch { /* noop */ }
    onNavigate('study-pack-viewer', undefined, { studyPack: { data, title } });
  };

  const generate = async () => {
    const text = notes.trim();
    if (wordCount < 50 || loading) return;
    setLoading(true);
    setError(null);
    setUpgrade(false);
    try {
      const res = await fetch(`${API_URL}/analysis/generate-study-pack`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (res.status === 429) {
        setUpgrade(true);
        setError(json?.message || "You've used this month's study packs. Upgrade to make more.");
        return;
      }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Generation failed (${res.status})`);
      }
      try { localStorage.setItem('writescholar_has_study_pack', 'true'); } catch { /* noop */ }
      const title = text.split(/\s+/).slice(0, 6).join(' ') + (wordCount > 6 ? '…' : '');
      openViewer(json?.data, title || 'Study pack');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build that study pack.');
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file: File) => {
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/analysis/parse-document`, {
        method: 'POST',
        headers: authHeaders(false),
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Could not read that file.');
      const content = String(json?.data?.content ?? '');
      setNotes(content);
      try { sessionStorage.setItem(DRAFT_KEY, content); } catch { /* noop */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <div>
      <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Paste your notes or lecture material</label>
          <span className={`text-[11px] font-bold tabular-nums ${wordCount < 50 ? 'text-stone-400' : 'text-[#8A48C7]'}`}>{wordCount} words</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
          }}
          rows={8}
          placeholder="Drop in a chapter, your class notes, an article… at least 50 words. We'll turn it into a lesson, flashcards, a quiz, a crossword and arcade games."
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8]/40 resize-y"
        />
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }}
        />
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Upload a file
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={loading || wordCount < 50}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                </svg>
                Building your pack…
              </>
            ) : 'Generate study pack'}
          </button>
        </div>
        {wordCount > 0 && wordCount < 50 && (
          <p className="mt-2 text-[11px] font-bold text-stone-400">Add {50 - wordCount} more words to generate.</p>
        )}
      </div>

      {error && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${upgrade ? 'border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`text-sm font-extrabold ${upgrade ? 'text-[#8A48C7]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              See plans
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        <PreviewStrip
          title="Everything a study pack creates"
          subtitle="One paste of notes becomes a full lesson, flashcards, a quiz, a crossword and arcade games."
          aspect="aspect-[4/5]"
          items={[
            { kind: 'image', src: '/study-pack-previews/lesson-plan.png', label: 'Lesson' },
            { kind: 'video', src: '/writescholar-flashcards-demo.mp4', label: 'Flashcards' },
            { kind: 'video', src: '/writescholar-quiz-generator-demo.mp4', label: 'Quiz' },
            { kind: 'video', src: '/writescholar-crossword-demo.mp4', label: 'Crossword' },
            { kind: 'video', src: '/writescholar-crater-blast-demo.mp4', label: 'Crater Blast' },
            { kind: 'image', src: '/study-pack-previews/word-tower.png', label: 'Word Tower' },
            { kind: 'image', src: '/study-pack-previews/word-blitz.png', label: 'Word Blitz' },
          ]}
        />
      </div>

      {/* Recents */}
      <div className="mt-7">
        <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
          Your study packs
        </h2>
        {recents === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1].map((i) => <div key={i} className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
          </div>
        ) : recents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
            <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200">No study packs yet</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Generate your first one above. It takes about a minute.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recents.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openViewer(r.questions, r.title)}
                className="group flex items-center gap-3 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 text-left hover:-translate-y-0.5 hover:border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EAFF] dark:bg-[#A560E8]/15 text-[#A560E8]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5L21 12M3 16.5L12 21l9-4.5" /></svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-stone-800 dark:text-stone-100 truncate">{r.title}</span>
                  <span className="block text-[11px] font-bold text-stone-400 mt-0.5">{timeAgo(r.created_at)}</span>
                </span>
                <span className="text-stone-300 group-hover:text-[#A560E8] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
