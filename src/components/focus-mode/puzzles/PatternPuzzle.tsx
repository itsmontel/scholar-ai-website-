import { useState, useEffect } from 'react';
import type { PatternSequence, PatternElement } from '../../../utils/puzzles/pattern';
import { PATTERN_COLORS, PATTERN_ICONS } from '../../../utils/puzzles/pattern';

interface PatternPuzzleProps {
  sequence: PatternSequence;
  onComplete: () => void;
  onCancel: () => void;
}

type GameState = 'showing' | 'showingReady' | 'input' | 'success' | 'failure';

export default function PatternPuzzle({ sequence, onComplete, onCancel }: PatternPuzzleProps) {
  const [gameState, setGameState] = useState<GameState>('showing');
  const [showIndex, setShowIndex] = useState(0);
  const [displayElement, setDisplayElement] = useState<PatternElement | null>(null);
  const [userInput, setUserInput] = useState<PatternElement[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [currentSequence] = useState<PatternElement[]>(sequence.elements);

  useEffect(() => {
    if (gameState !== 'showing') return;
    if (showIndex >= currentSequence.length) {
      setGameState('showingReady');
      return;
    }
    setDisplayElement(currentSequence[showIndex]);
    const t = setTimeout(() => setShowIndex((i) => i + 1), 1500);
    return () => clearTimeout(t);
  }, [gameState, showIndex, currentSequence]);

  useEffect(() => {
    if (gameState !== 'showingReady') return;
    const t = setTimeout(() => setGameState('input'), 1500);
    return () => clearTimeout(t);
  }, [gameState]);

  const addElement = (el: PatternElement) => {
    const idx = userInput.length;
    if (idx >= currentSequence.length) return;
    if (el === currentSequence[idx]) {
      const next = [...userInput, el];
      setUserInput(next);
      if (next.length === currentSequence.length) {
        setGameState('success');
        setTimeout(onComplete, 1500);
      }
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      setGameState('failure');
      setTimeout(() => {
        setUserInput([]);
        if (newAttempts > 0) {
          setShowIndex(0);
          setDisplayElement(null);
          setGameState('showing');
        }
      }, 1500);
    }
  };

  const continueWithAttemptsLeft = () => {
    setShowIndex(0);
    setDisplayElement(null);
    setUserInput([]);
    setGameState('showing');
  };

  const retryNewPattern = () => {
    setShowIndex(0);
    setDisplayElement(null);
    setUserInput([]);
    setAttemptsLeft(3);
    setGameState('showing');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[min(640px,95vw)] mx-auto p-6 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/60 dark:border-stone-700">
      <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">Pattern Challenge</h2>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
        {gameState === 'showing'
          ? 'Watch carefully as each symbol appears...'
          : gameState === 'showingReady'
          ? 'Get ready to solve!'
          : gameState === 'input'
          ? 'Tap the symbols in the correct order'
          : gameState === 'success'
          ? 'You did it!'
          : attemptsLeft > 0
          ? 'Wrong! Try again'
          : 'Out of attempts'}
      </p>

      {gameState === 'showing' && (
        <div className="flex flex-col items-center gap-6">
          <div
            key={showIndex}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl font-bold animate-pattern-symbol-pop"
            style={{
              backgroundColor: displayElement ? PATTERN_COLORS[displayElement] : undefined,
              color: displayElement ? 'white' : undefined,
            }}
          >
            {displayElement ? PATTERN_ICONS[displayElement] : '?'}
          </div>
          <p className="text-stone-500 text-sm">
            Item {Math.min(showIndex + 1, sequence.length)} of {sequence.length}
          </p>
        </div>
      )}

      {gameState === 'showingReady' && (
        <div className="flex flex-col items-center gap-6">
          <div
            key="ready"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl font-bold animate-pattern-symbol-pop bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300 border-2 border-stone-300 dark:border-stone-500"
          >
            ?
          </div>
          <p className="text-stone-500 text-sm font-medium">
            Get ready to solve!
          </p>
        </div>
      )}

      {gameState === 'input' && (
        <div className="w-full space-y-6">
          {userInput.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {userInput.map((el, i) => (
                <div
                  key={i}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl"
                  style={{ backgroundColor: PATTERN_COLORS[el], color: 'white' }}
                >
                  {PATTERN_ICONS[el]}
                </div>
              ))}
            </div>
          )}
          <p className="text-center text-violet-600 font-semibold">
            {userInput.length} / {sequence.length} correct
          </p>
          <p className="text-center text-stone-500 text-sm">
            Attempts: {Array(3).fill(0).map((_, i) => (i < attemptsLeft ? '●' : '○')).join(' ')}
          </p>
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {(['circle', 'square', 'triangle', 'diamond', 'star', 'heart', 'hexagon', 'pentagon'] as PatternElement[]).map(
              (el) => (
                <button
                  key={el}
                  type="button"
                  onClick={() => addElement(el)}
                  className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-3xl sm:text-4xl border-2 font-bold hover:scale-105 transition"
                  style={{
                    borderColor: PATTERN_COLORS[el],
                    color: PATTERN_COLORS[el],
                  }}
                >
                  {PATTERN_ICONS[el]}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {(gameState === 'failure' || gameState === 'success') && (
        <div className="text-center">
          {gameState === 'success' ? (
            <>
              <video
                src="/happymascot.mp4"
                autoPlay
                muted
                playsInline
                loop
                className="w-24 h-24 object-contain mx-auto mb-2 rounded-xl border-2 border-violet-300 dark:border-violet-500 shadow-lg overflow-hidden ring-2 ring-violet-400/30"
              />
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">Perfect Memory!</p>
            </>
          ) : attemptsLeft > 0 ? (
            <>
              <span className="text-5xl block mb-2">❌</span>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">Wrong Order!</p>
              <p className="text-stone-500 mt-1">You have {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left</p>
              <button
                type="button"
                onClick={continueWithAttemptsLeft}
                className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <span className="text-5xl block mb-2">❌</span>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">Out of Attempts!</p>
              <button
                type="button"
                onClick={retryNewPattern}
                className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500"
              >
                New Pattern
              </button>
            </>
          )}
        </div>
      )}

      {gameState !== 'success' && gameState !== 'failure' && gameState !== 'showingReady' && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-medium"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
