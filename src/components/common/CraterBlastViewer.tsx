import { useState, useMemo } from 'react';

interface CraterBlastQuestion {
  id?: string;
  prompt: string;
  answers: string[];
  correctIndex: number;
}

interface CraterBlastViewerProps {
  questions: CraterBlastQuestion[];
  title?: string;
  onEnlarge?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CraterBlastViewer = ({ questions, onEnlarge }: CraterBlastViewerProps) => {
  const [displayedQuestions, setDisplayedQuestions] = useState(() => shuffle(questions).slice(0, Math.min(15, questions.length)));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = displayedQuestions[currentQuestion];
  const shuffledOptions = useMemo(() => question ? shuffle(question.answers) : [], [question?.prompt]);
  const correctIdx = question ? shuffledOptions.findIndex(a => a === question.answers[question.correctIndex]) : -1;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;
    const correctAnswer = question.answers[question.correctIndex];
    const isCorrect = selectedAnswer === correctAnswer;
    setUserAnswers(prev => [...prev, isCorrect]);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < displayedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setDisplayedQuestions(shuffle(questions).slice(0, Math.min(15, questions.length)));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setQuizComplete(false);
  };

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-stone-500 dark:text-stone-400">No questions to display</div>;
  }

  if (quizComplete) {
    const correct = userAnswers.filter(Boolean).length;
    const total = userAnswers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Crater Blast Complete</span>
          {onEnlarge && (
            <button
              onClick={onEnlarge}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
            >
              Play full game
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          )}
        </div>
        <div className="flex-1 rounded-2xl p-6 bg-slate-800/90 text-white text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-3xl mb-4">💥</div>
          <h3 className="text-xl font-bold mb-2">Nice work!</h3>
          <p className="text-4xl font-bold text-violet-300 mb-2">{percentage}%</p>
          <p className="text-slate-300 text-sm mb-6">{correct} out of {total} correct</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={resetQuiz} className="px-4 py-2.5 rounded-xl bg-slate-600 text-white font-medium hover:bg-slate-500">
              🔄 Retry
            </button>
            {onEnlarge && (
              <button onClick={onEnlarge} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium hover:from-rose-600 hover:to-pink-700">
                Play full arcade game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          Question {currentQuestion + 1} of {displayedQuestions.length}
        </span>
        {onEnlarge && (
          <button
            onClick={onEnlarge}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
          >
            Play full game
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full mb-4">
        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / displayedQuestions.length) * 100}%` }} />
      </div>
      <div className="flex-1 rounded-2xl p-4 sm:p-6 bg-slate-800/95 text-white overflow-auto border border-slate-700">
        <div className="bg-slate-700/50 rounded-xl px-4 py-3 mb-6">
          <p className="text-base sm:text-lg font-semibold text-center">{question.prompt}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {shuffledOptions.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = showResult && opt === question.answers[question.correctIndex];
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(opt)}
                disabled={showResult}
                className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${
                  isCorrect ? 'border-emerald-500 bg-emerald-500/30' :
                  isWrong ? 'border-red-500 bg-red-500/30' :
                  isSelected ? 'border-amber-400 bg-amber-500/20' :
                  'border-slate-600 hover:border-violet-400 hover:bg-slate-700/50'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {opt}
                {isCorrect && <span className="ml-2 text-emerald-400">✓</span>}
                {isWrong && <span className="ml-2 text-red-400">✗</span>}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold"
            >
              {currentQuestion < displayedQuestions.length - 1 ? 'Next →' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CraterBlastViewer;
