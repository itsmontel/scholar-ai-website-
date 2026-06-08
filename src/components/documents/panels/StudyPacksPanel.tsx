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
const TOPIC_DRAFT_KEY = 'writescholar_dashboard_topic_draft';
const VIEWER_KEY = 'writescholar_study_pack_viewer';

// Quick-fill suggestions for "from a topic" mode.
const TOPIC_EXAMPLES = ["Plato's philosophy", 'Psych 101', 'The French Revolution', 'Photosynthesis', 'Supply and demand'];

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
  // 'notes' = paste/upload notes (default). 'topic' = type a subject and we
  // write the notes + build the whole pack from it.
  const [mode, setMode] = useState<'notes' | 'topic'>('notes');
  const [topic, setTopic] = useState(() => {
    try { return sessionStorage.getItem(TOPIC_DRAFT_KEY) || ''; } catch { return ''; }
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
    if (loading) return;
    const isTopic = mode === 'topic';
    const text = notes.trim();
    const trimmedTopic = topic.trim();
    if (isTopic ? trimmedTopic.length < 2 : wordCount < 50) return;
    setLoading(true);
    setError(null);
    setUpgrade(false);
    try {
      const res = await fetch(`${API_URL}/analysis/generate-study-pack`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(isTopic ? { inputType: 'topic', topic: trimmedTopic } : { text }),
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
      const notesTitle = text.split(/\s+/).slice(0, 6).join(' ') + (wordCount > 6 ? '…' : '');
      const title = (json?.data?.quiz?.title as string) || (isTopic ? trimmedTopic : notesTitle);
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
      <div className="relative overflow-hidden rounded-3xl border-2 border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-[0_16px_38px_-26px_rgba(255,150,0,0.55)]">
        <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#FF9600]/12 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3 mb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4E0] dark:bg-[#FF9600]/15 text-[#FF9600] border-2 border-[#FF9600]/30 text-lg" aria-hidden>📚</span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Make a study pack</h2>
            <p className="text-[12px] font-bold text-stone-500 dark:text-stone-400 leading-snug">Paste notes or pick a topic — get a lesson, flashcards, a quiz, a crossword &amp; arcade games.</p>
          </div>
        </div>
        {/* Choose how to build the pack: paste your own notes, or type a
            topic and we write the notes for you. */}
        <div className="relative flex gap-1.5 p-1 mb-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={() => { setMode('notes'); setError(null); }}
            aria-pressed={mode === 'notes'}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-extrabold transition-all ${
              mode === 'notes'
                ? 'bg-white dark:bg-stone-900 text-[#FF9600] border-2 border-[#FF9600]'
                : 'text-stone-500 dark:text-stone-400 border-2 border-transparent'
            }`}
          >
            <span>📝</span> Paste notes
          </button>
          <button
            type="button"
            onClick={() => { setMode('topic'); setError(null); }}
            aria-pressed={mode === 'topic'}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-extrabold transition-all ${
              mode === 'topic'
                ? 'bg-white dark:bg-stone-900 text-[#FF9600] border-2 border-[#FF9600]'
                : 'text-stone-500 dark:text-stone-400 border-2 border-transparent'
            }`}
          >
            <span>✨</span> From a topic
          </button>
        </div>
        {mode === 'notes' ? (
          <>
            <div className="relative flex items-center justify-between mb-2">
              <label className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Paste your notes or lecture material</label>
              <span className={`text-[11px] font-bold tabular-nums ${wordCount < 50 ? 'text-stone-400' : 'text-[#B85F00]'}`}>{wordCount} words</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
              }}
              rows={8}
              placeholder="Drop in a chapter, your class notes, an article… at least 50 words. We'll turn it into a lesson, flashcards, a quiz, a crossword and arcade mode."
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9600]/40 focus:border-[#FF9600]/40 resize-y"
            />
          </>
        ) : (
          <>
            <label htmlFor="study-pack-topic-input" className="block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">What do you want to study?</label>
            <input
              id="study-pack-topic-input"
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                try { sessionStorage.setItem(TOPIC_DRAFT_KEY, e.target.value); } catch { /* noop */ }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!loading && topic.trim().length >= 2) void generate(); } }}
              maxLength={200}
              placeholder="e.g. Plato's philosophy, Psych 101, the French Revolution"
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9600]/40 focus:border-[#FF9600]/40"
            />
            <p className="mt-2 text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-snug">Type any subject, topic or course. We&apos;ll write the notes, then build the whole pack from them.</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-400">Try:</span>
              {TOPIC_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setTopic(ex);
                    try { sessionStorage.setItem(TOPIC_DRAFT_KEY, ex); } catch { /* noop */ }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-[#FF9600]/30 text-[#B85F00] dark:text-[#FF9600] text-[11px] font-extrabold transition-all hover:border-[#FF9600] active:translate-y-0.5"
                >
                  {ex}
                </button>
              ))}
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }}
        />
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          {mode === 'notes' && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:border-[#FF9600]/40 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Upload a file
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading || (mode === 'notes' ? wordCount < 50 : topic.trim().length < 2)}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9600] hover:bg-[#B85F00] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#B85F00] active:border-b-2 active:translate-y-0.5 transition-all"
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
        {mode === 'notes' && wordCount > 0 && wordCount < 50 && (
          <p className="mt-2 text-[11px] font-bold text-stone-400">Add {50 - wordCount} more words to generate.</p>
        )}
      </div>

      {error && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${upgrade ? 'border-[#FF9600]/40 bg-[#FFF4E0] dark:bg-[#FF9600]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`text-sm font-extrabold ${upgrade ? 'text-[#B85F00]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF9600] hover:bg-[#B85F00] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#B85F00] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              See plans
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        <PreviewStrip
          title="Everything a study pack creates"
          subtitle="One paste of notes becomes a full lesson, flashcards, a quiz, a crossword and arcade mode."
          aspect="aspect-[4/5]"
          tint="#FF9600"
          tintShadowRgb="255,150,0"
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
          <div className="rounded-2xl border-2 border-dashed border-[#FF9600]/30 dark:border-[#FF9600]/25 bg-[#FFFBF5] dark:bg-[#FF9600]/5 p-8 text-center">
            <img src="/mascot-juggling.webp" alt="" aria-hidden loading="lazy" decoding="async" className="mx-auto w-16 h-16 object-contain mb-2" />
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
                className="group flex items-center gap-3 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 text-left hover:-translate-y-0.5 hover:border-[#FF9600]/40 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E0] dark:bg-[#FF9600]/15 text-[#FF9600]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5L21 12M3 16.5L12 21l9-4.5" /></svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-stone-800 dark:text-stone-100 truncate">{r.title}</span>
                  <span className="block text-[11px] font-bold text-stone-400 mt-0.5">{timeAgo(r.created_at)}</span>
                </span>
                <span className="text-stone-300 group-hover:text-[#FF9600] transition-colors">
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
