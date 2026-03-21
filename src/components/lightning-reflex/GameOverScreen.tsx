interface GameOverScreenProps {
  score: number;
  correctCount: number;
  longestStreak: number;
  bestScore: number;
  onRestart: () => void;
  onPlayAgain: () => void;
  hasQuestions: boolean;
}

export default function GameOverScreen({
  score,
  correctCount,
  longestStreak,
  bestScore,
  onRestart,
  onPlayAgain,
  hasQuestions,
}: GameOverScreenProps) {
  return (
    <div className="text-center p-10 max-w-[500px]">
      <h1 className="text-2xl font-bold mb-4 text-white">Game Over</h1>
      <p className="text-stone-300 mb-6 leading-relaxed">
        Final score: <strong>{score}</strong>
        <br />
        Best score: <strong>{bestScore}</strong>
        <br />
        Correct: {correctCount} | Longest streak: {longestStreak}
      </p>
      <button
        onClick={onRestart}
        className="px-7 py-3.5 text-base font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all"
      >
        New Game
      </button>
      {hasQuestions && (
        <button
          onClick={onPlayAgain}
          className="ml-3 px-7 py-3.5 text-base font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all"
        >
          Play Again (same questions)
        </button>
      )}
    </div>
  );
}
