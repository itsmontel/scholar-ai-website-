import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   GamesPanel: the arcade. Pick one of your study packs at the top,
   then a game; the game opens loaded with that pack's questions.
   With no packs yet, Play opens the game's own start screen.
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PICK_KEY = 'ws_arcade_pack';

type Game = {
  key: string;
  name: string;
  tagline: string;
  /** Where Play goes when there is no pack to load. */
  fallbackPage: string;
  /** The game page, the key it reads its questions from, and the pack field that holds them. */
  page: string;
  storageKey: string;
  packField: 'craterBlast' | 'wordTower' | 'wordBlitz';
  quizType: string;
  video: string;
};

const GAMES: Game[] = [
  {
    key: 'crater-blast',
    name: 'Crater Blast',
    tagline: 'Blast the right answer before it lands.',
    fallbackPage: 'game-launcher-crater-blast',
    page: 'crater-blast',
    storageKey: 'savedCraterBlast',
    packField: 'craterBlast',
    quizType: 'crater_blast',
    video: '/writescholar-crater-blast-demo.mp4',
  },
  {
    key: 'word-tower',
    name: 'Word Tower',
    tagline: 'Stack right answers and build the tallest tower.',
    fallbackPage: 'game-launcher-word-tower',
    page: 'word-tower',
    storageKey: 'savedWordTower',
    packField: 'wordTower',
    quizType: 'word_tower',
    video: '/hero-word-tower.mp4',
  },
  {
    key: 'word-blitz',
    name: 'Word Blitz',
    tagline: 'Fill the blank against the clock.',
    fallbackPage: 'word-blitz',
    page: 'word-blitz',
    storageKey: 'savedWordBlitz',
    packField: 'wordBlitz',
    quizType: 'word_blitz',
    video: '/hero-word-blitz.mp4',
  },
];

type Pack = { id: string; title: string; data: Record<string, any> };

export default function GamesPanel({
  onNavigate,
  onOpenStudyPacks,
}: {
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  onOpenStudyPacks: () => void;
}) {
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [pickedId, setPickedId] = useState<string>(() => {
    try { return localStorage.getItem(PICK_KEY) || ''; } catch { return ''; }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/analysis/quiz-history?limit=30`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json().catch(() => null);
        const rows = (Array.isArray(json?.data) ? json.data : []) as Array<Record<string, any>>;
        const found = rows
          .filter((r) => r.quiz_type === 'study_pack' && r.questions && typeof r.questions === 'object' && !Array.isArray(r.questions))
          .map((r) => ({ id: String(r.id), title: String(r.title ?? 'Study pack'), data: r.questions as Record<string, any> }))
          .filter((pk) => GAMES.some((g) => pk.data[g.packField]));
        if (!cancelled) setPacks(found);
      } catch {
        if (!cancelled) setPacks([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const picked = packs?.find((pk) => pk.id === pickedId) ?? packs?.[0] ?? null;
  const pick = (id: string) => {
    setPickedId(id);
    try { localStorage.setItem(PICK_KEY, id); } catch { /* noop */ }
  };

  const play = (g: Game) => {
    const d = picked?.data[g.packField];
    if (!picked || !d) { onNavigate(g.fallbackPage); return; }
    try {
      localStorage.setItem(g.storageKey, JSON.stringify({
        title: picked.title,
        questions: { questions: d.questions, inputType: 'notes' },
        quiz_type: g.quizType,
      }));
    } catch { /* storage full: the game opens on its own start screen */ }
    onNavigate(g.page);
  };

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <section
        aria-label="Arcade"
        className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 py-6 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px]"
      >
        <span aria-hidden className="pointer-events-none absolute -right-[150px] -top-40 h-[480px] w-[480px] rounded-full bg-[#9652D3]" />
        <img src="/mascot-juggling-still.webp" alt="Scholar, the WriteScholar mascot" width={104} height={104} className="relative hidden h-[104px] w-[104px] shrink-0 object-contain sm:block" />
        <div className="relative min-w-0 flex-[1_1_320px]">
          <h1 className="m-0 text-[30px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
            Pick a <span className="text-[#FFD84D]">game</span>
          </h1>
          <p className="m-0 mt-1.5 text-[15px] font-bold text-[#F3EAFF] sm:text-[16.5px]">
            {packs && packs.length === 0 ? 'Make a study pack and every game fills with its questions.' : 'Every game uses the questions from the pack you choose.'}
          </p>
        </div>
        {packs && packs.length > 0 && picked && (
          <label className="relative flex min-w-0 flex-[1_1_300px] flex-col gap-0.5 rounded-[18px] border-b-[5px] border-[#D9C2F2] bg-white px-3.5 py-2.5 text-stone-900">
            <span className="text-[12px] font-black uppercase tracking-[0.14em] text-[#7733B5]">Playing with</span>
            <select
              value={picked.id}
              onChange={(e) => pick(e.target.value)}
              className="min-h-[36px] w-full min-w-0 truncate border-0 bg-transparent text-[17px] font-black text-stone-900 focus:outline-none"
            >
              {packs.map((pk) => <option key={pk.id} value={pk.id}>{pk.title}</option>)}
            </select>
          </label>
        )}
      </section>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const missing = !!picked && !picked.data[g.packField];
          return (
            <article key={g.key} className="flex flex-col overflow-hidden rounded-[24px] border border-[#E4D4F8] bg-white shadow-[0_16px_34px_-26px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900">
              <video
                src={`${g.video}#t=2`}
                className="block h-[190px] w-full bg-[#2A1540] object-cover"
                aria-label={`${g.name} preview`}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
              <div className="flex flex-1 flex-col gap-2 p-[18px]">
                <h3 className="m-0 text-[22px] font-black text-stone-900 dark:text-stone-50">{g.name}</h3>
                <p className="m-0 text-[15px] font-bold leading-[1.4] text-stone-600 dark:text-stone-400">
                  {missing ? 'This pack has no questions for this game. Pick another pack above.' : g.tagline}
                </p>
                <button
                  type="button"
                  onClick={() => play(g)}
                  disabled={missing}
                  className="mt-auto inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-[16px] border-2 border-b-[5px] border-[#46A302] bg-[#58CC02] text-[17px] font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Play
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3.5 rounded-[24px] border-2 border-dashed border-[#C9A0F0] bg-[#F7F1FF] px-5 py-[18px] dark:bg-[#A560E8]/10">
        <p className="m-0 min-w-0 flex-[1_1_320px] text-[16px] font-extrabold text-stone-900 dark:text-stone-100">
          {packs && packs.length === 0
            ? 'You have no study packs yet. Make one from any topic and it shows up here.'
            : 'Want to play with something else? Make a pack from any topic and it shows up here.'}
        </p>
        <button
          type="button"
          onClick={onOpenStudyPacks}
          className="inline-flex min-h-[50px] items-center whitespace-nowrap rounded-[14px] border-2 border-b-4 border-[#8A48C7] bg-[#A560E8] px-5 text-[15.5px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
        >
          Make a study pack
        </button>
      </div>
    </div>
  );
}
