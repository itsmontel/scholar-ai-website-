import { useState } from 'react';
import type { MemoryGame } from '../../../utils/puzzles/memory';

interface MemoryPuzzleProps {
  game: MemoryGame;
  onComplete: () => void;
  onCancel: () => void;
}

export default function MemoryPuzzle({ game, onComplete, onCancel }: MemoryPuzzleProps) {
  const [cards, setCards] = useState(game.cards);
  const [firstIndex, setFirstIndex] = useState<number | null>(null);
  const [secondIndex, setSecondIndex] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [moves, setMoves] = useState(0);

  const isFlipped = (idx: number) =>
    cards[idx].isMatched || firstIndex === idx || secondIndex === idx;

  const handleTap = (idx: number) => {
    if (processing || cards[idx].isMatched || firstIndex === idx || secondIndex === idx) return;

    if (firstIndex === null) {
      setFirstIndex(idx);
      return;
    }
    if (secondIndex === null) {
      setSecondIndex(idx);
      setMoves((m) => m + 1);
      setProcessing(true);
      setTimeout(() => {
        const a = cards[firstIndex].value;
        const b = cards[idx].value;
        if (a === b) {
          const next = cards.map((c, i) =>
            i === firstIndex || i === idx ? { ...c, isMatched: true } : c
          );
          setCards(next);
          setMatchedPairs((p) => p + 1);
          if (matchedPairs + 1 >= game.totalPairs) {
            setShowSuccess(true);
            setTimeout(onComplete, 1500);
          }
        }
        setFirstIndex(null);
        setSecondIndex(null);
        setProcessing(false);
      }, 600);
    }
  };

  const gridCols = game.gridColumns;

  return (
    <div className="flex flex-col items-center w-full max-w-[min(440px,95vw)] mx-auto p-6 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/60 dark:border-stone-700">
      <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">Memory Match</h2>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">Find all {game.totalPairs} pairs to win</p>
      <div className="flex gap-8 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{matchedPairs}</p>
          <p className="text-xs text-stone-500">Pairs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-violet-600">{moves}</p>
          <p className="text-xs text-stone-500">Moves</p>
        </div>
      </div>

      <div
        className="grid gap-2 sm:gap-3 p-3 sm:p-4 bg-stone-100 dark:bg-stone-700/50 rounded-2xl w-full min-w-[300px] max-w-[400px]"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {cards.map((card, idx) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleTap(idx)}
            disabled={card.isMatched}
            className={`
              aspect-square flex items-center justify-center rounded-xl font-bold text-2xl sm:text-3xl md:text-4xl
              transition-all duration-300 min-w-0
              ${card.isMatched ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}
              ${isFlipped(idx) ? 'bg-white dark:bg-stone-200 shadow-inner' : 'bg-violet-600 hover:bg-violet-500 text-white/70'}
              ${!card.isMatched && !isFlipped(idx) ? 'hover:from-violet-400 hover:to-purple-500' : ''}
            `}
          >
            {(isFlipped(idx) || card.isMatched) ? card.value : '?'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-6 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-medium"
      >
        Cancel
      </button>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 text-center">
            <video
              src="/happymascot.mp4"
              autoPlay
              muted
              playsInline
              loop
              className="w-24 h-24 object-contain mx-auto mb-2 rounded-xl border-2 border-violet-300 dark:border-violet-500 shadow-lg overflow-hidden ring-2 ring-violet-400/30"
            />
            <p className="text-xl font-bold text-stone-800 dark:text-stone-100">All Pairs Found!</p>
            <p className="text-stone-500 mt-1">Completed in {moves} moves</p>
          </div>
        </div>
      )}
    </div>
  );
}
