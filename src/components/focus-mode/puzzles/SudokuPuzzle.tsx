import { useState } from 'react';
import type { SudokuPuzzle as SudokuType } from '../../../utils/puzzles/sudoku';
import { isValidMove, isSudokuComplete } from '../../../utils/puzzles/sudoku';

interface SudokuPuzzleProps {
  puzzle: SudokuType;
  onComplete: () => void;
  onCancel: () => void;
}

export default function SudokuPuzzle({ puzzle, onComplete, onCancel }: SudokuPuzzleProps) {
  const [grid, setGrid] = useState<(number | null)[][]>(
    puzzle.initialGrid.map((row) => row.map((v) => v))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);

  const filledCount = grid.flat().filter((v) => v !== null).length;

  const handleCellClick = (row: number, col: number) => {
    if (puzzle.initialGrid[row][col] !== null) return;
    setSelectedCell([row, col]);
  };

  const enterNumber = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (puzzle.initialGrid[row][col] !== null) return;

    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? num : c))
    );
    setGrid(newGrid);

    const cellKey = `${row}-${col}`;
    if (isValidMove(puzzle, newGrid, row, col, num)) {
      setErrorCells((s) => {
        const next = new Set(s);
        next.delete(cellKey);
        return next;
      });
    } else {
      setErrorCells((s) => new Set(s).add(cellKey));
    }

    const allFilled = newGrid.every((r) => r.every((c) => c !== null));
    if (allFilled) {
      if (isSudokuComplete(puzzle, newGrid)) {
        setShowSuccess(true);
        setTimeout(onComplete, 1500);
      } else {
        setShowIncorrect(true);
        setTimeout(() => setShowIncorrect(false), 2000);
      }
    }
  };

  const clearCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (puzzle.initialGrid[row][col] !== null) return;
    setGrid((g) =>
      g.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? null : c)))
    );
    setErrorCells((s) => {
      const next = new Set(s);
      next.delete(`${row}-${col}`);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto p-6 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/60 dark:border-stone-700">
      <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">Sudoku 6×6</h2>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">Fill all cells with numbers 1-6</p>
      <p className="text-violet-600 dark:text-violet-400 font-semibold mb-4">{filledCount} / 36 cells filled</p>

      <div className="grid grid-cols-6 gap-0 border-2 border-stone-300 dark:border-stone-600 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-700/50">
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            const isGiven = puzzle.initialGrid[ri][ci] !== null;
            const isSelected =
              selectedCell?.[0] === ri && selectedCell?.[1] === ci;
            const hasError = errorCells.has(key);
            const isBoxTop = ri % 2 === 0;
            const isBoxLeft = ci % 3 === 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCellClick(ri, ci)}
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 md:w-[3.5rem] md:h-[3.5rem] flex items-center justify-center text-lg sm:text-xl font-bold
                  border border-stone-300 dark:border-stone-600
                  ${isSelected ? 'bg-violet-200 dark:bg-violet-800/60' : ''}
                  ${hasError ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : ''}
                  ${isGiven ? 'text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-800' : 'text-violet-600 dark:text-violet-400'}
                  ${isBoxTop ? 'border-t-2 border-t-stone-800 dark:border-t-stone-400' : ''}
                  ${isBoxLeft ? 'border-l-2 border-l-stone-800 dark:border-l-stone-400' : ''}
                `}
              >
                {cell ?? ''}
              </button>
            );
          })
        )}
      </div>

      <div className="flex gap-2 mt-6 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => enterNumber(n)}
            className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-3">
        <button
          type="button"
          onClick={clearCell}
          className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold text-sm"
        >
          Clear
        </button>
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
            <p className="text-xl font-bold text-stone-800 dark:text-stone-100">Puzzle Solved!</p>
          </div>
        </div>
      )}
      {showIncorrect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-8 text-center">
            <span className="text-5xl block mb-2">❌</span>
            <p className="text-xl font-bold text-stone-800 dark:text-stone-100">Incorrect Solution</p>
          </div>
        </div>
      )}
    </div>
  );
}
