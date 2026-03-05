interface HUDProps {
  lives: number;
  score: number;
  streak: number;
  correctCount: number;
}

export default function HUD({ lives, score, streak, correctCount }: HUDProps) {
  return (
    <div className="flex justify-between items-center px-4 py-3 w-full max-w-[90vw]">
      <span>❤️ {lives}</span>
      <span>Score: {score}</span>
      <span>Streak: {streak}</span>
      <span>Correct: {correctCount}</span>
    </div>
  );
}
