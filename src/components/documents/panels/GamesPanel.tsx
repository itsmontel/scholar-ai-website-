/* ═══════════════════════════════════════════════════════════════
   GamesPanel — in-workspace launcher for the arcade study games.
   Each card shows the real game (looping demo video / screenshot)
   in a purple frame so users see exactly what they're playing.
   The games themselves are full-screen, so "Play" hands off to
   the dedicated game screen (never the old dashboard).
   ═══════════════════════════════════════════════════════════════ */

type Game = {
  key: string;
  name: string;
  tagline: string;
  page: string;
  media: { kind: 'video' | 'image'; src: string };
};

const GAMES: Game[] = [
  {
    key: 'crater-blast',
    name: 'Crater Blast',
    tagline: 'Fast-fire recall. Blast the right answer before it lands.',
    page: 'game-launcher-crater-blast',
    media: { kind: 'video', src: '/writescholar-crater-blast-demo.mp4' },
  },
  {
    key: 'word-tower',
    name: 'Word Tower',
    tagline: 'Stack correct answers and build the tallest tower you can.',
    page: 'game-launcher-word-tower',
    media: { kind: 'image', src: '/study-pack-previews/word-tower.png' },
  },
  {
    key: 'word-blitz',
    name: 'Word Blitz',
    tagline: 'Fill the blank against the clock. Recall under pressure.',
    page: 'word-blitz',
    media: { kind: 'image', src: '/study-pack-previews/word-blitz.png' },
  },
];

export default function GamesPanel({
  onNavigate,
  onOpenStudyPacks,
}: {
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  onOpenStudyPacks: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g) => (
          <div
            key={g.key}
            className="group flex flex-col rounded-3xl overflow-hidden border-2 border-b-4 border-[#A560E8] bg-white dark:bg-stone-900 hover:-translate-y-1 transition-all shadow-[0_12px_30px_-18px_rgba(165,96,232,0.5)] hover:shadow-[0_26px_50px_-20px_rgba(165,96,232,0.55)]"
          >
            <div className="relative aspect-[16/11] w-full bg-stone-950">
              {g.media.kind === 'video' ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  aria-label={`${g.name} preview`}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                >
                  <source src={g.media.src} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={g.media.src}
                  alt={`${g.name} preview`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              )}
            </div>
            <div className="flex-1 flex flex-col p-5 border-t-2 border-[#A560E8]/30">
              <p className="text-lg font-extrabold text-stone-900 dark:text-stone-50" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>{g.name}</p>
              <p className="mt-1 text-[13px] font-bold text-stone-500 dark:text-stone-400 leading-snug flex-1">{g.tagline}</p>
              <button
                type="button"
                onClick={() => onNavigate(g.page)}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Play
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border-2 border-[#A560E8]/25 bg-[#F3EAFF] dark:bg-[#A560E8]/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[#7733B5] dark:text-[#C9A0F0]">Play with your own material</p>
          <p className="mt-1 text-[13px] font-bold text-stone-600 dark:text-stone-300 leading-snug">
            Generate a study pack from your notes and every game is automatically loaded with questions from your content.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStudyPacks}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A560E8] hover:bg-[#7733B5] text-white text-sm font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
        >
          Make a study pack
        </button>
      </div>
    </div>
  );
}
