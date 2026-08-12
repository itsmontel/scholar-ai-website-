import { useCallback, useEffect, useRef, useState } from 'react';
import PreviewStrip from './PreviewStrip';
import GenerationOverlay from '../../common/GenerationOverlay';
import { trackEvent } from '../../../utils/analytics';
import { openUpgradePaywall } from '../../../utils/paywall';

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
        setError(json?.message || "You've hit your study pack limit. Upgrade to make more.");
        return;
      }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Generation failed (${res.status})`);
      }
      try { localStorage.setItem('writescholar_has_study_pack', 'true'); } catch { /* noop */ }
      trackEvent('preview_ran', { feature: 'study_pack', input: isTopic ? 'topic' : 'notes' });
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

  const notesReady = wordCount >= 50;
  const topicReady = topic.trim().length >= 2;
  const canGenerate = mode === 'notes' ? notesReady : topicReady;

  return (
    <div>
      <GenerationOverlay open={loading} variant="studyPack" />

      {/* ── CREATOR CARD — premium gradient frame ─────────────────── */}
      <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-[#C79BF2] via-[#A560E8] to-[#7733B5] shadow-[0_28px_60px_-30px_rgba(165,96,232,0.7)]">
        <div className="relative overflow-hidden rounded-[26px] bg-white dark:bg-stone-900 p-5 sm:p-7">
          {/* Ambient glow + faint grid texture */}
          <div className="pointer-events-none absolute -top-24 -right-20 w-64 h-64 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#FFC800]/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(120,113,108,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.8) 1px, transparent 1px)', backgroundSize: '26px 26px' }} aria-hidden />

          {/* Header */}
          <div className="relative flex items-center gap-3.5 mb-5">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#BD8BF0] to-[#A560E8] text-white text-xl border-2 border-b-[3px] border-[#7733B5] shadow-[0_10px_24px_-10px_rgba(165,96,232,0.9)]" aria-hidden>
              📚
              <span className="absolute -top-1.5 -right-1.5 text-[#FFC800] text-sm motion-safe:animate-pulse">✦</span>
            </span>
            <div className="min-w-0">
              <h2 className="text-[19px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>Make a study pack</h2>
              <p className="text-[12.5px] font-semibold text-stone-500 dark:text-stone-400 leading-snug">Paste notes or pick a topic — get a lesson, flashcards, a quiz, a crossword &amp; arcade games.</p>
            </div>
          </div>

          {/* Mode segmented control — sliding pill */}
          <div className="relative flex p-1.5 mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700">
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-white dark:bg-stone-900 border-2 border-[#A560E8] shadow-[0_6px_16px_-8px_rgba(165,96,232,0.8)] transition-transform duration-300 ease-out"
              style={{ transform: mode === 'topic' ? 'translateX(calc(100% + 0.25rem))' : 'translateX(0)' }}
            />
            <button
              type="button"
              onClick={() => { setMode('notes'); setError(null); }}
              aria-pressed={mode === 'notes'}
              className={`relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-extrabold transition-colors ${mode === 'notes' ? 'text-[#A560E8]' : 'text-stone-500 dark:text-stone-400'}`}
            >
              <span>📝</span> Paste notes
            </button>
            <button
              type="button"
              onClick={() => { setMode('topic'); setError(null); }}
              aria-pressed={mode === 'topic'}
              className={`relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-extrabold transition-colors ${mode === 'topic' ? 'text-[#A560E8]' : 'text-stone-500 dark:text-stone-400'}`}
            >
              <span>✨</span> From a topic
            </button>
          </div>

          {mode === 'notes' ? (
            <>
              <div className="relative flex items-center justify-between mb-2">
                <label className="text-[13px] font-extrabold text-stone-700 dark:text-stone-200">Paste your notes or lecture material</label>
                <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold tabular-nums px-2 py-0.5 rounded-full transition-colors ${notesReady ? 'text-[#7733B5] bg-[#F3EAFF] dark:bg-[#A560E8]/15' : 'text-stone-400 bg-stone-100 dark:bg-stone-800'}`}>
                  {notesReady && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                  {wordCount} words
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
                }}
                rows={8}
                placeholder="Drop in a chapter, your class notes, an article… at least 50 words. We'll turn it into a lesson, flashcards, a quiz, a crossword and arcade mode."
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 focus:border-[#A560E8] resize-y transition-all"
              />
            </>
          ) : (
            <>
              <label htmlFor="study-pack-topic-input" className="block text-[13px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">What do you want to study?</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-500" aria-hidden>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" /></svg>
                </span>
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
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/80 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20 focus:border-[#A560E8] transition-all"
                />
              </div>
              <p className="mt-2 text-[11px] font-bold text-stone-400 dark:text-stone-500 leading-snug">Type any subject, topic or course. We&apos;ll write the notes, then build the whole pack from them.</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-stone-400">Try:</span>
                {TOPIC_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setTopic(ex);
                      try { sessionStorage.setItem(TOPIC_DRAFT_KEY, ex); } catch { /* noop */ }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-[#A560E8]/30 text-[#7733B5] dark:text-[#A560E8] text-[11px] font-extrabold transition-all hover:border-[#A560E8] hover:-translate-y-0.5 active:translate-y-0"
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
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2.5">
            {mode === 'notes' && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-b-[3px] border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:border-[#A560E8]/50 hover:text-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
                Upload a file
              </button>
            )}
            <button
              type="button"
              onClick={generate}
              disabled={loading || !canGenerate}
              className="group sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#A560E8] to-[#9450D8] hover:from-[#9450D8] hover:to-[#7733B5] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] enabled:hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_12px_28px_-12px_rgba(165,96,232,0.9)]"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity={0.3} strokeWidth={3} />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Building your pack…
                </>
              ) : (
                <>
                  <span>✨</span> Generate study pack
                  <svg className="w-4 h-4 transition-transform group-enabled:group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </>
              )}
            </button>
          </div>
          {mode === 'notes' && wordCount > 0 && !notesReady && (
            <p className="mt-2.5 text-[11px] font-bold text-stone-400">Add {50 - wordCount} more words to generate.</p>
          )}

          {/* What you'll get — value reinforcement chips */}
          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-stone-400 mr-0.5">You'll get</span>
            {['🎓 Lesson', '🃏 Flashcards', '📝 Quiz', '🧩 Crossword', '🎮 Games'].map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-full bg-[#FBF8FF] dark:bg-[#A560E8]/10 border border-[#A560E8]/25 text-[11px] font-extrabold text-[#7733B5] dark:text-[#A560E8]">{c}</span>
            ))}
            <span className="w-full mt-1 text-[10.5px] font-bold text-stone-400 dark:text-stone-500">
              Free preview: lesson + 4 flashcards · Quiz &amp; games with Pro
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${upgrade ? 'border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`text-sm font-extrabold ${upgrade ? 'text-[#7733B5]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_limit_error' }); openUpgradePaywall('study_pack_limit_error'); }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-xs font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              See plans
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        <PreviewStrip
          title="Everything a study pack creates"
          subtitle="One paste becomes a full pack — free users preview the lesson and first 4 flashcards; Pro unlocks quiz, games, and the full deck."
          aspect="aspect-[4/5]"
          tint="#A560E8"
          tintShadowRgb="165,96,232"
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
          <div className="rounded-2xl border-2 border-dashed border-[#A560E8]/30 dark:border-[#A560E8]/25 bg-[#FBF8FF] dark:bg-[#A560E8]/5 p-8 text-center">
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
