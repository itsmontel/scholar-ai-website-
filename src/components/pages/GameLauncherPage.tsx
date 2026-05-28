import React, { useState, useEffect } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';

interface GameLauncherPageProps {
  gameType: 'crater_blast' | 'word_tower';
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface SavedGameEntry {
  id: string;
  title: string;
  question_count: number;
  questions: any[];
  created_at: string;
  expires_at: string | null;
}

const GAME_META = {
  crater_blast: {
    name: 'Crater Blast',
    emoji: '💥',
    desc: 'Blast the correct answer before it crashes! The faster you react, the higher your score.',
    color: '#FF4B4B',
    darkBorder: '#E04343',
    tint: '#FFE8E8',
    /** Page-level backdrop tints — used for the radial glows on the launcher hero. */
    backdropFrom: 'rgba(255,75,75,0.18)',
    backdropTo:   'rgba(255,150,0,0.10)',
    /** Decorative emojis that drift around the hero for vibe. */
    decorEmojis: ['💥', '🔥', '☄️', '⭐', '✨'],
    navPage: 'crater-blast',
    storageKey: 'savedCraterBlast',
    quizType: 'crater_blast',
    questionsKey: 'craterBlast',
  },
  word_tower: {
    name: 'Word Tower',
    emoji: '🗼',
    desc: 'Catch the correct blocks to build the tallest tower. Dodge the wrong ones or it all comes crashing down!',
    color: '#58CC02',
    darkBorder: '#46A302',
    tint: '#EAFFD6',
    backdropFrom: 'rgba(88,204,2,0.20)',
    backdropTo:   'rgba(28,176,246,0.10)',
    decorEmojis: ['🟩', '🟦', '🧱', '✨', '⬆️'],
    navPage: 'word-tower',
    storageKey: 'savedWordTower',
    quizType: 'word_tower',
    questionsKey: 'wordTower',
  },
} as const;

const GameLauncherPage: React.FC<GameLauncherPageProps> = ({ gameType, onNavigate, user, onLogout }) => {
  const meta = GAME_META[gameType];
  const [entries, setEntries] = useState<SavedGameEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudyPacks = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) { onNavigate('login'); return; }

        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        const items: SavedGameEntry[] = (data.data || [])
          .map((t: any) => {
            let gameQuestions: any[] = [];

            if (t.quiz_type === meta.quizType) {
              // Standalone game save (e.g. quiz_type === 'crater_blast')
              gameQuestions = Array.isArray(t.questions?.questions)
                ? t.questions.questions
                : Array.isArray(t.questions) ? t.questions : [];
            } else if (t.quiz_type === 'study_pack') {
              // Study pack — game questions are nested under craterBlast / wordTower
              const nested = t.questions?.[meta.questionsKey];
              gameQuestions = Array.isArray(nested?.questions) ? nested.questions : [];
            } else {
              return null;
            }

            if (gameQuestions.length === 0) return null;

            return {
              id: t.id,
              title: t.title || 'Untitled',
              question_count: gameQuestions.length,
              questions: gameQuestions,
              created_at: t.created_at,
              expires_at: t.expires_at,
            };
          })
          .filter(Boolean) as SavedGameEntry[];

        setEntries(items);
        // Pre-select all by default
        setSelected(new Set(items.map((e) => e.id)));
      } catch (err) {
        console.error('Game launcher fetch error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudyPacks();
  }, [gameType]);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const selectAll = () => setSelected(new Set(entries.map((e) => e.id)));
  const deselectAll = () => setSelected(new Set());

  const totalQuestions = entries
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + e.questions.length, 0);

  const handleStart = () => {
    const combined = entries
      .filter((e) => selected.has(e.id))
      .flatMap((e) => e.questions);

    if (combined.length === 0) return;

    localStorage.setItem(
      meta.storageKey === 'savedCraterBlast' ? 'savedCraterBlast' : 'savedWordTower',
      JSON.stringify({
        title: selected.size === 1
          ? entries.find((e) => selected.has(e.id))?.title
          : `${selected.size} Study Packs Combined`,
        questions: { questions: combined, inputType: 'notes' },
        quiz_type: meta.quizType,
      }),
    );
    localStorage.setItem('writescholar_minimal_ui', 'true');
    onNavigate(meta.navPage);
  };

  const handlePlayForFun = () => {
    // Navigate directly — the game page has its own built-in topic/fun modes
    onNavigate(meta.navPage);
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-stone-50 dark:bg-stone-950"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      {/* ──────────────────────────────────────────────────────────────
          Themed background layer — game-tinted radial glows + faint grid
          + floating decorative emojis. Per-game color so Crater Blast
          burns red/orange and Word Tower glows green/blue.
          ────────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {/* Top-left radial wash in the game's primary tint */}
        <div
          className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${meta.backdropFrom} 0%, transparent 65%)` }}
        />
        {/* Bottom-right radial wash in the secondary tint */}
        <div
          className="absolute -bottom-40 -right-32 w-[40rem] h-[40rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${meta.backdropTo} 0%, transparent 65%)` }}
        />
        {/* Subtle 32px dot grid for visual rhythm — fades on dark mode */}
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(120,113,108,0.18) 1px, transparent 1.6px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Floating decorative emojis — arranged so they orbit the hero
            without overlapping content. Hidden on small screens so the
            launcher stays distraction-free on phones. */}
        {meta.decorEmojis.map((e, i) => {
          // Spread them around the page using deterministic positions.
          const positions: React.CSSProperties[] = [
            { top: '6%',  left: '6%',  fontSize: '2.6rem', transform: 'rotate(-12deg)' },
            { top: '14%', right: '8%', fontSize: '2.2rem', transform: 'rotate(8deg)' },
            { top: '52%', left: '4%',  fontSize: '2.4rem', transform: 'rotate(14deg)' },
            { top: '60%', right: '5%', fontSize: '2.0rem', transform: 'rotate(-10deg)' },
            { bottom: '8%', left: '14%', fontSize: '2.2rem', transform: 'rotate(6deg)' },
          ];
          const pos = positions[i] || positions[0];
          // Stagger the float duration so they don't move in lockstep.
          const dur = 5 + (i * 0.8);
          return (
            <div
              key={`decor-${i}`}
              className="absolute hidden md:block opacity-30 dark:opacity-25 select-none"
              style={{
                ...pos,
                animation: `gameLauncherFloat ${dur}s ease-in-out ${i * 0.4}s infinite`,
              }}
            >
              {e}
            </div>
          );
        })}
        <style>{`
          @keyframes gameLauncherFloat {
            0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
            50%      { transform: translateY(-14px) rotate(var(--r, 0deg)); }
          }
        `}</style>
      </div>

      <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout}>
      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-xl text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-900/60 backdrop-blur-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>

        {/* Hero — chunky 3D icon tile with a soft glow halo behind it */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            {/* Soft halo behind the icon */}
            <div
              className="absolute inset-0 -m-6 rounded-full blur-2xl opacity-70"
              style={{ backgroundColor: `${meta.color}33` }}
              aria-hidden
            />
            <div
              className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl text-5xl border-2 border-b-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]"
              style={{ backgroundColor: meta.tint, borderColor: `${meta.color}55` }}
            >
              {meta.emoji}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 mb-2">
            {meta.name}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            {meta.desc}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 rounded-full animate-spin mb-4" style={{ borderColor: `${meta.color}30`, borderTopColor: meta.color }} />
            <p className="text-sm font-bold text-stone-400">Loading your study packs…</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-2xl border-2 border-b-4 border-[#FF4B4B]/40 bg-[#FFE8E8] dark:bg-[#FF4B4B]/10 p-5 text-center mb-6">
            <p className="text-[#FF4B4B] font-bold text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 rounded-xl border-2 border-b-4 border-stone-200 bg-white text-sm font-bold text-stone-700 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Study pack selection */}
            {entries.length > 0 ? (
              <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden mb-6 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.18)]">
                {/* Header */}
                <div className="px-5 py-4 border-b-2 border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">
                      Choose Your Study Packs
                    </h2>
                    <p className="text-xs font-bold text-stone-400 mt-0.5">
                      Pick which topics to include in your game
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide rounded-lg border-2 border-b-4 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide rounded-lg border-2 border-b-4 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="divide-y-2 divide-stone-100 dark:divide-stone-800">
                  {entries.map((entry) => {
                    const checked = selected.has(entry.id);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => toggle(entry.id)}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all ${
                          checked
                            ? 'bg-opacity-100'
                            : 'opacity-60 hover:opacity-80'
                        }`}
                        style={checked ? { backgroundColor: `${meta.tint}` } : undefined}
                      >
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 border-b-4 flex items-center justify-center transition-all ${
                            checked
                              ? 'text-white'
                              : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                          }`}
                          style={checked ? { backgroundColor: meta.color, borderColor: meta.darkBorder } : undefined}
                        >
                          {checked && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-stone-800 dark:text-stone-100 truncate">
                            {entry.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                              style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.tint}` }}
                            >
                              {meta.emoji} {entry.questions.length} question{entry.questions.length !== 1 ? 's' : ''}
                            </span>
                            {entry.created_at && (
                              <span className="text-[11px] font-bold text-stone-400">
                                {fmtDate(entry.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer — total + start */}
                <div className="px-5 py-4 border-t-2 border-stone-200 dark:border-stone-700 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
                  <div>
                    <p className="text-sm font-extrabold text-stone-800 dark:text-stone-100">
                      {selected.size} pack{selected.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs font-bold text-stone-400 mt-0.5">
                      {totalQuestions} total question{totalQuestions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={totalQuestions === 0}
                    className="px-6 py-3 rounded-xl text-white font-extrabold uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: meta.color, borderColor: meta.darkBorder }}
                  >
                    Start Game
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-8 text-center mb-6 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.18)]">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl border-2 border-b-4 mb-4"
                  style={{ backgroundColor: meta.tint, borderColor: `${meta.color}40` }}
                >
                  📦
                </div>
                <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 mb-2">
                  No saved study packs yet
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm mx-auto leading-relaxed">
                  Generate a study pack from your notes first, then come back here to play {meta.name} with your own material!
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem('writescholar_dashboard_tab', 'study_pack');
                    onNavigate('dashboard');
                  }}
                  className="px-5 py-2.5 rounded-xl text-white font-extrabold uppercase tracking-wide text-sm border-2 border-b-4 border-[#1899D6] bg-[#1CB0F6] active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Create a Study Pack
                </button>
              </div>
            )}

            {/* Play for Fun card */}
            <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 flex items-center gap-4 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.18)]">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFF4E0] dark:bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 flex items-center justify-center text-2xl">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-stone-800 dark:text-stone-100">Play for Fun</p>
                <p className="text-xs font-bold text-stone-400 mt-0.5">
                  Use built-in topics — capitals, math, flags & more
                </p>
              </div>
              <button
                onClick={handlePlayForFun}
                className="px-5 py-2.5 rounded-xl font-extrabold uppercase tracking-wide text-sm border-2 border-b-4 border-[#D97F00] bg-[#FF9600] text-white active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Play
              </button>
            </div>
          </>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  </div>
  );
};

export default GameLauncherPage;
