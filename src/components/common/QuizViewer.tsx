import { useState, useMemo } from 'react';
import QuizMascotReaction from './QuizMascotReaction';

interface QuizQuestion {
  id?: number;
  type?: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizViewerProps {
  questions: QuizQuestion[];
  title?: string;
  onEnlarge?: (state?: { questionIndex?: number }) => void;
  initialQuestionIndex?: number;
}

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestionOptions(q: QuizQuestion): QuizQuestion {
  const opts = q.options || [];
  if (opts.length <= 1) return { ...q };
  const correctIdx = q.correctAnswer?.length === 1 && q.correctAnswer >= 'A' && q.correctAnswer <= 'Z'
    ? q.correctAnswer.charCodeAt(0) - 65
    : opts.findIndex(o => o === q.correctAnswer || o.startsWith(q.correctAnswer + '.') || o.startsWith(q.correctAnswer + ')'));
  const correctText = opts[Math.max(0, correctIdx)];
  const shuffled = shuffleArray(opts);
  return { ...q, options: shuffled, correctAnswer: correctText };
}

const QuizViewer = ({ questions, title, onEnlarge, initialQuestionIndex }: QuizViewerProps) => {
  const [displayedQuestions, setDisplayedQuestions] = useState<QuizQuestion[]>(() => {
    const base = initialQuestionIndex != null ? questions.slice(0, questions.length) : shuffleAndTake(questions, questions.length);
    return base.map(shuffleQuestionOptions);
  });
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    if (initialQuestionIndex == null || questions.length === 0) return 0;
    return Math.min(Math.max(0, initialQuestionIndex), questions.length - 1);
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ answer: string; isCorrect: boolean }[]>([]);
  /* Most recent answer's correctness — drives the mascot reaction popup. */
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);

  const question = displayedQuestions[currentQuestion];

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;
    const correctAns = question.correctAnswer;
    const options = question.options || [];
    let isCorrect = false;
    if (options.length > 0) {
      const correctIdx = correctAns?.length === 1 && correctAns >= 'A' && correctAns <= 'Z'
        ? correctAns.charCodeAt(0) - 65
        : options.findIndex(o => o === correctAns || o.startsWith(correctAns + '.') || o.startsWith(correctAns + ')'));
      const correctOption = options[Math.max(0, correctIdx)];
      isCorrect = selectedAnswer === correctOption || selectedAnswer === correctAns ||
        (correctAns?.length === 1 && selectedAnswer.charAt(0) === correctAns);
    } else {
      isCorrect = selectedAnswer === correctAns || selectedAnswer.toLowerCase() === correctAns?.toLowerCase();
    }
    setUserAnswers(prev => [...prev, { answer: selectedAnswer, isCorrect }]);
    setLastCorrect(isCorrect);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < displayedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setLastCorrect(null);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    const base = shuffleAndTake(questions, questions.length);
    setDisplayedQuestions(base.map(shuffleQuestionOptions));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setLastCorrect(null);
    setQuizComplete(false);
    setRetakeKey(k => k + 1);
  };

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>No questions to display</div>;
  }

  if (quizComplete) {
    const correct = userAnswers.filter(a => a.isCorrect).length;
    const total = userAnswers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    /* Score tier styling */
    const isGreat = percentage >= 80;
    const isOkay = percentage >= 50 && percentage < 80;
    const isLow = percentage < 50;

    const scoreColor = isGreat ? '#58CC02' : isOkay ? '#F59E0B' : '#FF4B4B';
    const scoreRingTrack = isGreat ? '#E5F8D0' : isOkay ? '#FEF3C7' : '#FFE0E0';
    const headingText = isGreat ? 'Amazing job!' : isOkay ? 'Nice effort!' : 'Keep practicing!';
    const subText = isGreat
      ? 'You crushed it! You really know your stuff!'
      : isOkay
        ? 'You\'re getting there -- a little more practice and you\'ll ace it!'
        : 'Don\'t worry, every expert was once a beginner. Try again!';

    /* Circumference for the score ring (r=54) */
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="p-4 flex flex-col min-h-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-extrabold tracking-wide uppercase" style={{ color: scoreColor }}>Quiz Complete</span>
          {onEnlarge && (
            <button
              onClick={() => onEnlarge?.({ questionIndex: currentQuestion })}
              className="text-xs px-3 py-1.5 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800/60 transition-colors flex items-center gap-1.5 font-bold border-b-2 border-sky-200 dark:border-sky-700"
            >
              Open full screen
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          )}
        </div>
        <div
          className="flex-1 rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-800 border-2 dark:border-gray-600 text-center overflow-auto"
          style={{ borderColor: scoreColor + '55' }}
        >
          {/* Mascot video -- only for great scores */}
          {isGreat && (
            <video
              src="/happymascot.mp4"
              autoPlay
              muted
              playsInline
              loop
              className="w-24 h-24 mx-auto mb-4 object-contain rounded-2xl border-4 shadow-lg overflow-hidden"
              style={{ borderColor: scoreColor }}
            />
          )}
          {isOkay && <div className="text-5xl mb-3 animate-bounce">💪</div>}
          {isLow && <div className="text-5xl mb-3">📚</div>}

          <h3 className="text-2xl font-extrabold dark:text-white mb-1">{headingText}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{subText}</p>

          {/* Animated score ring */}
          <div className="relative w-32 h-32 mx-auto mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke={scoreRingTrack} strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>{percentage}%</span>
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-6">{correct} out of {total} correct</p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-white border-b-4 transition-all hover:brightness-110 active:border-b-0 active:translate-y-1"
              style={{ backgroundColor: scoreColor, borderBottomColor: isGreat ? '#45A302' : isOkay ? '#D97706' : '#CC3333' }}
            >
              Retake
            </button>
            {onEnlarge && (
              <button
                onClick={() => onEnlarge?.({ questionIndex: currentQuestion })}
                className="px-6 py-3 rounded-2xl font-extrabold uppercase tracking-wide text-white border-b-4 border-sky-600 bg-sky-500 hover:bg-sky-400 transition-all active:border-b-0 active:translate-y-1"
              >
                Open full screen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const qType = question.type || 'multiple_choice';
  const options = question.options || [];
  const correctLetter = options.length > 0 && question.correctAnswer?.length === 1 && question.correctAnswer >= 'A' && question.correctAnswer <= 'Z'
    ? question.correctAnswer
    : options.find(o => o === question.correctAnswer) ? String.fromCharCode(65 + options.findIndex(o => o === question.correctAnswer)) : null;

  /* Shared option button builder */
  const renderOption = (opt: string, idx: number, letter: string, isSelected: boolean, isCorrect: boolean, isWrong: boolean, displayText?: string, label?: React.ReactNode) => (
    <button
      key={idx}
      onClick={() => handleAnswerSelect(opt)}
      disabled={showResult}
      className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 border-b-4 text-left flex items-center gap-3 transition-all text-sm font-bold ${
        isCorrect
          ? 'border-green-500 bg-green-500 text-white border-b-green-700'
          : isWrong
            ? 'border-red-500 bg-red-500 text-white border-b-red-700'
            : isSelected
              ? 'border-sky-400 bg-sky-400 text-white border-b-sky-600'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-gray-600 border-b-gray-300 dark:border-b-gray-500'
      } ${showResult ? 'cursor-default' : 'cursor-pointer active:border-b-2 active:translate-y-0.5'}`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
        isCorrect ? 'bg-white/30 text-white' : isWrong ? 'bg-white/30 text-white' : isSelected ? 'bg-white/30 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
      }`}>{label ?? letter}</span>
      <span className="flex-1 break-words">{displayText ?? opt}</span>
      {isCorrect && <span className="text-xl">&#10003;</span>}
      {isWrong && <span className="text-xl">&#10007;</span>}
    </button>
  );

  return (
    <div className="p-4 flex flex-col min-h-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-extrabold text-gray-500 dark:text-gray-400 tracking-wide">
          {currentQuestion + 1} / {displayedQuestions.length}
        </span>
        {onEnlarge && (
          <button
            onClick={() => onEnlarge?.({ questionIndex: currentQuestion })}
            className="text-xs px-3 py-1.5 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800/60 transition-colors flex items-center gap-1.5 font-bold border-b-2 border-sky-200 dark:border-sky-700"
          >
            Open full screen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentQuestion + 1) / displayedQuestions.length) * 100}%`,
            background: 'linear-gradient(90deg, #58CC02, #7CE830)',
          }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 rounded-3xl p-5 sm:p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 overflow-auto">
        {/* Question type badge */}
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold mb-4 uppercase tracking-wide ${
          qType === 'multiple_choice' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' :
          qType === 'true_false' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' :
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
        }`}>
          {qType === 'multiple_choice' ? (
            <><span>🔠</span> Multiple Choice</>
          ) : qType === 'true_false' ? (
            <><span>✅</span> True / False</>
          ) : (
            <><span>✏️</span> Fill in the Blank</>
          )}
        </span>

        <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 mb-5 leading-snug">{question.question}</h3>

        {/* Answer options */}
        <div className="space-y-3 mb-6">
          {qType === 'multiple_choice' && options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === opt || selectedAnswer === letter;
            const isCorrect = showResult && (opt === question.correctAnswer || letter === correctLetter);
            const isWrong = showResult && isSelected && !isCorrect;
            return renderOption(opt, idx, letter, isSelected, isCorrect, isWrong);
          })}
          {qType === 'true_false' && ['True', 'False'].map((opt, idx) => {
            const optLower = opt.toLowerCase();
            const isSelected = selectedAnswer === opt || selectedAnswer === optLower;
            const isCorrect = showResult && (question.correctAnswer?.toLowerCase() === optLower);
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button
                key={opt}
                onClick={() => handleAnswerSelect(optLower)}
                disabled={showResult}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 border-b-4 text-left flex items-center gap-3 transition-all font-bold ${
                  isCorrect
                    ? 'border-green-500 bg-green-500 text-white border-b-green-700'
                    : isWrong
                      ? 'border-red-500 bg-red-500 text-white border-b-red-700'
                      : isSelected
                        ? 'border-sky-400 bg-sky-400 text-white border-b-sky-600'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-gray-600 border-b-gray-300 dark:border-b-gray-500'
                } ${showResult ? 'cursor-default' : 'cursor-pointer active:border-b-2 active:translate-y-0.5'}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                  isCorrect ? 'bg-white/30 text-white' : isWrong ? 'bg-white/30 text-white' : isSelected ? 'bg-white/30 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                }`}>{opt === 'True' ? '✓' : '✗'}</span>
                <span>{opt}</span>
                {isCorrect && <span className="ml-auto text-xl">&#10003;</span>}
                {isWrong && <span className="ml-auto text-xl">&#10007;</span>}
              </button>
            );
          })}
          {qType === 'fill_blank' && options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === opt || selectedAnswer === letter;
            const isCorrect = showResult && (opt === question.correctAnswer || letter === correctLetter);
            const isWrong = showResult && isSelected && !isCorrect;
            const cleanText = opt.includes('. ') ? opt.split('. ')[1] || opt : opt;
            return renderOption(opt, idx, letter, isSelected, isCorrect, isWrong, cleanText);
          })}
        </div>

        {/* Mascot reaction — Duolingo-style happy/sad pop-in */}
        {showResult && lastCorrect !== null && (
          <div className="mb-4">
            <QuizMascotReaction
              variant="inline"
              state={lastCorrect ? 'correct' : 'wrong'}
              subMessage={lastCorrect ? undefined : `Correct answer: ${question.correctAnswer}`}
            />
          </div>
        )}

        {/* Explanation */}
        {showResult && question.explanation && (
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl mb-5 border-2 border-violet-200 dark:border-violet-700">
            <p className="text-xs font-extrabold text-violet-800 dark:text-violet-200 mb-1 uppercase tracking-wide">Explanation</p>
            <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">{question.explanation}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="px-6 py-3 rounded-2xl bg-green-500 text-white font-extrabold uppercase tracking-wide border-b-4 border-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition-all active:border-b-0 active:translate-y-1"
              style={{ backgroundColor: selectedAnswer ? '#58CC02' : undefined, borderBottomColor: selectedAnswer ? '#45A302' : undefined }}
            >
              Check
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold uppercase tracking-wide border-b-4 border-sky-700 transition-all active:border-b-0 active:translate-y-1"
            >
              {currentQuestion < displayedQuestions.length - 1 ? 'Continue' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizViewer;
