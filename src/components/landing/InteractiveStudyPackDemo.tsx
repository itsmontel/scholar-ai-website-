import { useState } from 'react';

type Tab = 'flashcards' | 'quiz' | 'lesson';

const CARD = {
  front: 'What is active recall?',
  back: 'Retrieving information from memory (e.g. flashcards, quizzes) instead of only re-reading — strengthens long-term retention.',
};

const QUIZ = {
  q: 'Which study strategy is most supported by research for long-term retention?',
  options: ['Cramming the night before', 'Spaced repetition', 'Highlighting only', 'Copying notes verbatim'],
  correct: 1,
};

const LESSON = [
  'Active recall beats passive review: test yourself instead of re-reading.',
  'Spaced repetition: revisit material over increasing intervals.',
  'Interleaving: mix topics so your brain distinguishes concepts.',
];

export type InteractiveStudyPackDemoVariant = 'full' | 'side-left' | 'side-right';

export default function InteractiveStudyPackDemo({
  variant = 'full',
}: {
  variant?: InteractiveStudyPackDemoVariant;
}) {
  const [tab, setTab] = useState<Tab>('flashcards');
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (variant === 'side-left') {
    return (
      <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/25 dark:to-stone-900/80 p-3 shadow-sm ring-1 ring-amber-100/80 dark:ring-amber-900/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-400 mb-2 text-center">Flashcards</p>
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          className="relative w-full min-h-[120px] rounded-xl border-2 border-violet-200/90 dark:border-violet-700/50 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-stone-900 p-3 shadow-md transition-transform duration-300 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-violet-400/80"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
            {flipped ? 'Back' : 'Front'}
          </p>
          <p className="text-[11px] text-stone-800 dark:text-stone-100 leading-snug text-center line-clamp-5">
            {flipped ? CARD.back : CARD.front}
          </p>
          <p className="text-[9px] text-violet-600/80 dark:text-violet-400/90 mt-2 text-center">Tap to flip</p>
        </button>
      </div>
    );
  }

  if (variant === 'side-right') {
    return (
      <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50/90 to-white dark:from-emerald-950/20 dark:to-stone-900/80 p-3 shadow-sm ring-1 ring-emerald-100/80 dark:ring-emerald-900/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400 mb-2 text-center">Quiz</p>
        <div className="rounded-lg border border-stone-200/90 dark:border-stone-600 bg-white/95 dark:bg-stone-900/50 p-2">
          <p className="text-[11px] font-medium text-stone-900 dark:text-stone-100 mb-2 leading-snug">{QUIZ.q}</p>
          <div className="space-y-1.5">
            {QUIZ.options.slice(0, 3).map((opt, i) => {
              const isSel = selected === i;
              const isCorrect = i === QUIZ.correct;
              const reveal = showAnswer;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    setShowAnswer(true);
                  }}
                  className={`w-full text-left text-[10px] px-2 py-1.5 rounded-md border transition-all ${
                    reveal && isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                      : reveal && isSel && !isCorrect
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100'
                        : isSel
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                          : 'border-stone-200 dark:border-stone-600 hover:border-violet-300/70'
                  }`}
                >
                  <span className="font-semibold text-stone-500 dark:text-stone-400 mr-1">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {showAnswer && (
            <p className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-2 font-medium leading-snug">
              Spaced repetition wins.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/25 dark:to-stone-900/80 p-4 sm:p-6 shadow-sm ring-1 ring-amber-100/80 dark:ring-amber-900/40">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          Preview your study pack
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Flip a card, answer a sample quiz, or skim a mini-lesson — all from one paste.
        </p>
      </div>

      <div className="flex rounded-xl border border-amber-200/90 dark:border-amber-800/60 bg-white/90 dark:bg-stone-800/80 p-1 mb-5">
        {(
          [
            { id: 'flashcards' as const, label: 'Flashcards' },
            { id: 'quiz' as const, label: 'Quiz' },
            { id: 'lesson' as const, label: 'Lesson' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setFlipped(false);
              setSelected(null);
              setShowAnswer(false);
            }}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              tab === id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'flashcards' && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="relative w-full max-w-md min-h-[160px] rounded-2xl border-2 border-violet-200/90 dark:border-violet-700/50 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-stone-900 p-6 shadow-md transition-transform duration-300 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-violet-400/80"
            style={{ perspective: 1000 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
              {flipped ? 'Back' : 'Front'}
            </p>
            <p className="text-sm sm:text-base text-stone-800 dark:text-stone-100 leading-relaxed text-center">
              {flipped ? CARD.back : CARD.front}
            </p>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/90 mt-4 text-center">Tap to flip</p>
          </button>
        </div>
      )}

      {tab === 'quiz' && (
        <div className="rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white/95 dark:bg-stone-900/50 p-4">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">{QUIZ.q}</p>
          <div className="space-y-2">
            {QUIZ.options.map((opt, i) => {
              const isSel = selected === i;
              const isCorrect = i === QUIZ.correct;
              const reveal = showAnswer;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    setShowAnswer(true);
                  }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${
                    reveal && isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                      : reveal && isSel && !isCorrect
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100'
                        : isSel
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                          : 'border-stone-200 dark:border-stone-600 hover:border-violet-300/70 dark:hover:border-violet-600/50'
                  }`}
                >
                  <span className="font-semibold text-stone-500 dark:text-stone-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {showAnswer && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-3 font-medium animate-in fade-in">
              Spaced repetition distributes practice over time — proven to boost retention.
            </p>
          )}
        </div>
      )}

      {tab === 'lesson' && (
        <div className="rounded-xl border border-stone-200/90 dark:border-stone-600 bg-white/95 dark:bg-stone-900/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">Mini-lesson</p>
          <ul className="space-y-2.5">
            {LESSON.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
