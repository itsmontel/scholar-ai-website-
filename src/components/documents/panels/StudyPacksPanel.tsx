import { useCallback, useEffect, useRef, useState } from 'react';
import GenerationOverlay from '../../common/GenerationOverlay';
import { trackEvent } from '../../../utils/analytics';
import { openUpgradePaywall } from '../../../utils/paywall';
import { PACK_STEPS, nextStep, packKey, stepsDone, type PackStep } from '../../../utils/packProgress';

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
const TOPIC_EXAMPLES = ["Aristotle's ethics", 'Statistics 101', 'Cell respiration', 'The French Revolution'];

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
  const [mode, setMode] = useState<'notes' | 'topic'>(() => {
    try { return (sessionStorage.getItem(DRAFT_KEY) || '').trim() ? 'notes' : 'topic'; } catch { return 'topic'; }
  });
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

  const check = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
  );
  const makeButton = (
    <button
      type="button"
      onClick={generate}
      disabled={loading || !canGenerate}
      className="inline-flex min-h-[60px] items-center justify-center gap-2.5 whitespace-nowrap rounded-[18px] border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] px-[26px] text-[18px] font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Building your pack…' : 'Make my study pack'}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  );
  const pill = 'inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-[11px] text-[13px]';

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <GenerationOverlay open={loading} variant="studyPack" />

      {/* ── MAKE A PACK: purple banner with the topic box ─────────── */}
      <section
        aria-label="Make a study pack"
        className="relative overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 pb-6 pt-5 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px] sm:pb-[30px] sm:pt-[26px]"
      >
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[130px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#8A45C8]" />
        <div className="relative flex flex-col gap-[18px]">
          <div className="flex items-center gap-4">
            <img src="/mascot-pointing.webp" alt="Scholar, the WriteScholar mascot" width={104} height={104} className="h-[76px] w-[76px] shrink-0 object-contain sm:h-[104px] sm:w-[104px]" />
            <div className="min-w-0">
              <h1 className="m-0 text-[28px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
                What are we studying <span className="text-[#FFD84D]">next</span>?
              </h1>
              <p className="m-0 mt-1.5 text-[15px] font-bold text-[#F3EAFF] sm:text-[16.5px]">
                {mode === 'topic'
                  ? 'One line is enough. You get a lesson, flashcards, a quiz, a crossword and three games.'
                  : 'Paste your notes or add a file. You get a lesson, flashcards, a quiz, a crossword and three games.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[26px] border-b-[6px] border-[#D9C2F2] bg-white p-4 text-stone-900 shadow-[0_30px_50px_-22px_rgba(42,21,64,0.55)]">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }}
            />
            {mode === 'topic' ? (
              <>
                <div className="flex flex-wrap gap-3">
                  <label htmlFor="study-pack-topic-input" className="sr-only">What is the exam on?</label>
                  <input
                    id="study-pack-topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      try { sessionStorage.setItem(TOPIC_DRAFT_KEY, e.target.value); } catch { /* noop */ }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!loading && topicReady) void generate(); } }}
                    maxLength={200}
                    placeholder="A course, a chapter or one idea"
                    className="min-h-[60px] min-w-0 flex-[1_1_300px] rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] text-[18px] font-extrabold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
                  />
                  {makeButton}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {TOPIC_EXAMPLES.slice(0, 4).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setTopic(ex);
                        try { sessionStorage.setItem(TOPIC_DRAFT_KEY, ex); } catch { /* noop */ }
                      }}
                      className="min-h-[44px] rounded-full border-2 border-b-4 border-[#E4D4F8] bg-[#F7F1FF] px-3.5 text-[14px] font-extrabold text-stone-900 transition-all hover:-translate-y-0.5 hover:border-[#C9A0F0] active:translate-y-0.5 active:border-b-2"
                    >
                      {ex}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setMode('notes'); setError(null); }}
                    className="inline-flex min-h-[44px] items-center gap-[7px] px-1.5 text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594] sm:ml-auto"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
                    Use my notes or a file
                  </button>
                </div>
              </>
            ) : (
              <>
                <label htmlFor="study-pack-notes-input" className="sr-only">Your notes</label>
                <textarea
                  id="study-pack-notes-input"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    try { sessionStorage.setItem(DRAFT_KEY, e.target.value); } catch { /* noop */ }
                  }}
                  rows={7}
                  placeholder="Paste a chapter, your class notes or an article. At least 50 words."
                  className="w-full resize-y rounded-[18px] border-2 border-[#DCC3F6] bg-[#FBF8FF] px-[18px] py-3.5 text-[16px] font-bold text-stone-900 placeholder:text-stone-400 focus:border-[#A560E8] focus:outline-none focus:ring-4 focus:ring-[#A560E8]/20"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border-2 border-b-4 border-[#E4D4F8] bg-white px-4 text-[15px] font-black text-[#7733B5] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
                    Add a file
                  </button>
                  <span className={`text-[14px] font-extrabold ${notesReady ? 'text-[#3F8F00]' : 'text-stone-500'}`}>
                    {wordCount === 0 ? 'PDF, Word or text' : notesReady ? `${wordCount} words` : `${50 - wordCount} more words needed`}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setMode('topic'); setError(null); }}
                    className="min-h-[44px] px-1.5 text-[14.5px] font-black text-[#7733B5] underline hover:text-[#5F2594]"
                  >
                    Type a topic instead
                  </button>
                  <span className="sm:ml-auto">{makeButton}</span>
                </div>
              </>
            )}
          </div>
          <p className="m-0 text-[13.5px] font-bold text-[#F3EAFF]">Each pack uses 1 credit.</p>
        </div>
      </section>

      {error && (
        <div className={`rounded-2xl border-2 p-4 ${upgrade ? 'border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/10' : 'border-[#FF4B4B]/40 bg-[#FFF0F0] dark:bg-[#FF4B4B]/10'}`}>
          <p className={`text-sm font-extrabold ${upgrade ? 'text-[#7733B5]' : 'text-[#D63A3A]'}`}>{error}</p>
          {upgrade && (
            <button
              type="button"
              onClick={() => { trackEvent('upgrade_clicked', { source: 'study_pack_limit_error' }); openUpgradePaywall('study_pack_limit_error'); }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-b-[3px] border-[#7733B5] bg-[#A560E8] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-[#7733B5] active:translate-y-0.5 active:border-b-2"
            >
              See plans
            </button>
          )}
        </div>
      )}

      {/* ── YOUR PACKS: one row per pack, with its steps ──────────── */}
      {recents === null ? (
        <div className="flex flex-col gap-3.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-[98px] animate-pulse rounded-[24px] bg-stone-100 dark:bg-stone-800" />)}
        </div>
      ) : recents.length > 0 && (
        <>
          <div className="flex items-center gap-3.5">
            <h2 className="m-0 text-[22px] font-black tracking-[-0.01em] text-stone-900 dark:text-stone-50">Your packs</h2>
            <span aria-hidden className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
            <span className="text-[14.5px] font-extrabold text-stone-600 dark:text-stone-400">{recents.length} {recents.length === 1 ? 'pack' : 'packs'}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {recents.map((r) => {
              const q = (r.questions && typeof r.questions === 'object' && !Array.isArray(r.questions))
                ? r.questions as Record<string, unknown>
                : { questions: r.questions };
              const available = PACK_STEPS.filter((s) =>
                s.key === 'games' ? !!(q.wordBlitz || q.wordTower || q.craterBlast) : !!q[s.key]);
              const keys = available.map((s) => s.key);
              const done = stepsDone(packKey(r.title, r.created_at)).filter((s: PackStep) => keys.includes(s));
              const upNext = nextStep(done, keys);
              const state = done.length === 0 ? 'new' : upNext ? 'going' : 'finished';
              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-[18px] rounded-[24px] bg-white px-5 py-[18px] dark:bg-stone-900 ${state === 'going' ? 'border-2 border-[#A560E8] shadow-[0_20px_40px_-28px_rgba(90,45,140,0.7)]' : 'border border-[#E4D4F8] dark:border-stone-700'}`}
                >
                  <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5">
                    <h3 className="m-0 text-[20px] font-black leading-tight text-stone-900 dark:text-stone-50">{r.title}</h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {state === 'finished' ? (
                        <span className={`${pill} bg-[#E6F9D2] font-black text-[#14532D]`}>
                          {check}All {available.length} steps done
                        </span>
                      ) : available.map((s) => (
                        done.includes(s.key) ? (
                          <span key={s.key} className={`${pill} bg-[#E6F9D2] font-black text-[#14532D]`}>{check}{s.label}<span className="sr-only"> done</span></span>
                        ) : s.key === upNext && state === 'going' ? (
                          <span key={s.key} className={`${pill} bg-[#A560E8] font-black text-white`}>{s.label}<span className="sr-only"> is next</span></span>
                        ) : (
                          <span key={s.key} className={`${pill} bg-[#F3EAFF] font-extrabold text-[#5B2491] dark:bg-[#A560E8]/20 dark:text-[#C9A0F0]`}>{s.label}</span>
                        )
                      ))}
                      <span className="ml-1 text-[13px] font-bold text-stone-500 dark:text-stone-400">Made {timeAgo(r.created_at)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openViewer({ ...q, created_at: r.created_at }, r.title)}
                    className={`inline-flex min-h-[54px] shrink-0 items-center whitespace-nowrap rounded-[16px] border-2 border-b-[5px] px-[26px] text-[17px] font-black transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 ${
                      state === 'going' ? 'border-[#46A302] bg-[#58CC02] text-white'
                        : state === 'new' ? 'border-[#8A48C7] bg-[#A560E8] text-white'
                        : 'border-[#E4D4F8] bg-white text-[#7733B5] dark:border-stone-600 dark:bg-stone-900 dark:text-[#C9A0F0]'
                    }`}
                  >
                    {state === 'going' ? 'Continue' : state === 'finished' ? 'Review again' : 'Start'}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
