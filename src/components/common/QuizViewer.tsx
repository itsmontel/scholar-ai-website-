import { useState, useMemo } from 'react';

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
    const base = shuffleAndTake(questions, questions.length);
    setDisplayedQuestions(base.map(shuffleQuestionOptions));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setQuizComplete(false);
    setRetakeKey(k => k + 1);
  };

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-stone-500 dark:text-stone-400">No questions to display</div>;
  }

  if (quizComplete) {
    const correct = userAnswers.filter(a => a.isCorrect).length;
    const total = userAnswers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Quiz Complete</span>
          {onEnlarge && (
            <button
              onClick={() => onEnlarge?.({ questionIndex: currentQuestion })}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
            >
              Open full screen
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          )}
        </div>
        <div className="flex-1 rounded-2xl p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-center">
          <video
            src="/happymascot.mp4"
            autoPlay
            muted
            playsInline
            loop
            className="w-20 h-20 mx-auto mb-4 object-contain rounded-xl border-2 border-violet-300 dark:border-violet-500 shadow-lg overflow-hidden ring-2 ring-violet-400/30"
          />
          <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Quiz Complete!</h3>
          <p className="text-4xl font-bold bg-amber-600 hover:bg-amber-500 bg-clip-text text-transparent mb-2">{percentage}%</p>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{correct} out of {total} correct</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={resetQuiz} className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium hover:bg-stone-200 dark:hover:bg-stone-600">
              🔄 Retake
            </button>
            {onEnlarge && (
              <button onClick={() => onEnlarge?.({ questionIndex: currentQuestion })} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium hover:bg-violet-700">
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

  return (
    <div className="p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
          Question {currentQuestion + 1} of {displayedQuestions.length}
        </span>
        {onEnlarge && (
          <button
            onClick={() => onEnlarge?.({ questionIndex: currentQuestion })}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
          >
            Open full screen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full mb-4">
        <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / displayedQuestions.length) * 100}%` }} />
      </div>
      <div className="flex-1 rounded-2xl p-4 sm:p-6 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 overflow-auto">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3 ${
          qType === 'multiple_choice' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' :
          qType === 'true_false' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' :
          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
        }`}>
          {qType === 'multiple_choice' ? 'Multiple Choice' : qType === 'true_false' ? 'True/False' : 'Fill in the Blank'}
        </span>
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-4">{question.question}</h3>

        <div className="space-y-2 mb-6">
          {qType === 'multiple_choice' && options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === opt || selectedAnswer === letter;
            const isCorrect = showResult && (opt === question.correctAnswer || letter === correctLetter);
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(opt)}
                disabled={showResult}
                className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-2 transition-all text-sm ${
                  isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                  'border-stone-200 dark:border-stone-600 hover:border-amber-300'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-stone-200 dark:bg-stone-600'
                }`}>{letter}</span>
                <span className="flex-1 break-words">{opt}</span>
                {isCorrect && <span className="text-green-500">✓</span>}
                {isWrong && <span className="text-red-500">✗</span>}
              </button>
            );
          })}
          {qType === 'true_false' && ['True', 'False'].map((opt) => {
            const optLower = opt.toLowerCase();
            const isSelected = selectedAnswer === opt || selectedAnswer === optLower;
            const isCorrect = showResult && (question.correctAnswer?.toLowerCase() === optLower);
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button
                key={opt}
                onClick={() => handleAnswerSelect(optLower)}
                disabled={showResult}
                className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-2 transition-all ${
                  isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                  'border-stone-200 dark:border-stone-600 hover:border-amber-300'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-stone-200 dark:bg-stone-600'
                }`}>{opt === 'True' ? '✓' : '✗'}</span>
                <span>{opt}</span>
                {isCorrect && <span className="text-green-500">✓</span>}
                {isWrong && <span className="text-red-500">✗</span>}
              </button>
            );
          })}
          {qType === 'fill_blank' && options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === opt || selectedAnswer === letter;
            const isCorrect = showResult && (opt === question.correctAnswer || letter === correctLetter);
            const isWrong = showResult && isSelected && !isCorrect;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(opt)}
                disabled={showResult}
                className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-2 transition-all ${
                  isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  isWrong ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' :
                  'border-stone-200 dark:border-stone-600 hover:border-amber-300'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-stone-200 dark:bg-stone-600'
                }`}>{letter}</span>
                <span className="flex-1 break-words">{opt.includes('. ') ? opt.split('. ')[1] || opt : opt}</span>
                {isCorrect && <span className="text-green-500">✓</span>}
                {isWrong && <span className="text-red-500">✗</span>}
              </button>
            );
          })}
        </div>

        {showResult && question.explanation && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl mb-4 border border-violet-100 dark:border-violet-800">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 mb-1">Explanation</p>
            <p className="text-sm text-violet-700 dark:text-violet-300">{question.explanation}</p>
          </div>
        )}

        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold"
            >
              {currentQuestion < displayedQuestions.length - 1 ? 'Next →' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizViewer;
