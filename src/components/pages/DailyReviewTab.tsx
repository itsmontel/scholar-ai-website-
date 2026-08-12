import { useState, useEffect, useCallback } from 'react';
import GenerationOverlay from '../common/GenerationOverlay';

/* ═══════════════════════════════════════════════════════════════
   Daily Review Tab — Duolingo-style daily practice
   Pulls quiz + flashcard items from the user's saved study packs,
   presents a short review session, and tracks streaks.
   ═══════════════════════════════════════════════════════════════ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── types ──────────────────────────────────────────────────────
interface QuizQuestion {
  id?: number;
  type?: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceTitle?: string;
}

interface FlashCard {
  id?: number;
  front: string;
  back: string;
  sourceTitle?: string;
}

interface StudyTool {
  id: string;
  title: string;
  quiz_type: string;
  questions: QuizQuestion[] | FlashCard[] | any;
}

type ReviewItem =
  | { type: 'quiz'; data: QuizQuestion }
  | { type: 'flashcard'; data: FlashCard };

interface QuestionResult {
  item: ReviewItem;
  isCorrect: boolean;
  userAnswer?: string;
}

// ── streak helpers ─────────────────────────────────────────────
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // ISO date string YYYY-MM-DD
  totalReviews: number;
  totalCorrect: number;
}

const getToday = () => new Date().toISOString().slice(0, 10);

const getStreakKey = (userId?: string) =>
  `writescholar_daily_review_streak_${userId || 'anon'}`;

const loadStreak = (userId?: string): StreakData => {
  try {
    const raw = localStorage.getItem(getStreakKey(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null, totalReviews: 0, totalCorrect: 0 };
};

const saveStreak = (data: StreakData, userId?: string) => {
  localStorage.setItem(getStreakKey(userId), JSON.stringify(data));
};

const isStreakAlive = (streak: StreakData): boolean => {
  if (!streak.lastCompletedDate) return false;
  const last = new Date(streak.lastCompletedDate);
  const now = new Date(getToday());
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
};

const hasCompletedToday = (streak: StreakData): boolean =>
  streak.lastCompletedDate === getToday();

// ── XP calculation ─────────────────────────────────────────────
const calcXP = (correct: number, total: number, streak: number): number => {
  const base = correct * 10;
  const bonus = streak >= 7 ? 20 : streak >= 3 ? 10 : 0;
  const perfect = correct === total && total > 0 ? 15 : 0;
  return base + bonus + perfect;
};

// ── correct answer encouragements (Duolingo-style) ─────────────
const CORRECT_MESSAGES = [
  'Great work!', 'Nice job!', 'You got it!', 'Excellent!', 'Nailed it!',
  'Spot on!', 'Amazing!', 'Well done!', 'Brilliant!', 'Correct!',
  'You\'re on fire!', 'Keep it up!', 'Perfect!', 'Way to go!', 'Awesome!',
];
const WRONG_MESSAGES = [
  'Not quite — keep going!', 'Almost there!', 'Don\'t worry, you\'ll get it!',
  'Good try!', 'Learning is the goal!', 'Next time!',
];
const getRandomMsg = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// ── motivational messages ──────────────────────────────────────
const getResultMessage = (pct: number): { title: string; sub: string; mascot: string } => {
  if (pct === 100) return { title: 'Perfect score!', sub: 'You nailed every single question!', mascot: '/mascot-celebrating.webp' };
  if (pct >= 80) return { title: 'Great job!', sub: 'You really know your stuff.', mascot: '/mascot-jumping-joy.webp' };
  if (pct >= 60) return { title: 'Nice work!', sub: 'Keep reviewing and you\'ll master it.', mascot: '/mascot-dance.webp' };
  if (pct >= 40) return { title: 'Good effort!', sub: 'Practice makes perfect — come back tomorrow!', mascot: '/mascot-study.webp' };
  return { title: 'Keep going!', sub: 'Every review session makes you stronger.', mascot: '/mascot-thinking.webp' };
};

// ── component ──────────────────────────────────────────────────
interface DailyReviewTabProps {
  user: any;
  onNavigate: (page: string, slug?: string, options?: any) => void;
  onSwitchTool?: (tool: string) => void;
}

type Phase = 'home' | 'loading' | 'playing' | 'results';

const QUESTION_COUNT = 10;

const DailyReviewTab = ({ user, onNavigate, onSwitchTool }: DailyReviewTabProps) => {
  const userId = user?.id || user?._id;
  const firstName = user?.firstName?.split(' ')[0] || user?.name?.split(' ')[0] || '';

  // streak
  const [streak, setStreak] = useState<StreakData>(() => loadStreak(userId));
  const completedToday = hasCompletedToday(streak);

  // review session state
  const [phase, setPhase] = useState<Phase>('home');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [inSessionStreak, setInSessionStreak] = useState(0);
  const [bestSessionStreak, setBestSessionStreak] = useState(0);
  const [noContent, setNoContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // ── fetch & prepare review items ─────────────────────────────
  const startReview = async () => {
    setPhase('loading');
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsFlipped(false);
    setQuestionResults([]);
    setInSessionStreak(0);
    setBestSessionStreak(0);
    setNoContent(false);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setNoContent(true); setPhase('home'); return; }

      const res = await fetch(`${API_URL}/analysis/quiz-history`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) { setNoContent(true); setPhase('home'); return; }

      const data = await res.json();
      const tools: StudyTool[] = data.data || [];

      const allItems: ReviewItem[] = [];

      // Helper to push quiz questions (skip fill_blank — correctAnswer stores a letter, not the real answer)
      const pushQuizQuestions = (questions: any[], title: string, limit = 4) => {
        if (!Array.isArray(questions)) return;
        questions
          .filter(q => q?.question && q.type !== 'fill_blank' && (q.options?.length || q.correctAnswer))
          .slice(0, limit)
          .forEach(q => allItems.push({ type: 'quiz', data: { ...q, sourceTitle: title } }));
      };

      // Helper to push flashcards
      const pushFlashcards = (cards: any[], title: string, limit = 4) => {
        if (!Array.isArray(cards)) return;
        cards
          .filter((c: any) => c && (c.front || c.term) && (c.back || c.definition))
          .slice(0, limit)
          .forEach((c: any) => allItems.push({
            type: 'flashcard',
            data: { front: c.front || c.term, back: c.back || c.definition, sourceTitle: title },
          }));
      };

      tools.slice(0, 25).forEach(tool => {
        const t = tool.quiz_type;
        const title = tool.title || 'Study material';

        if (t === 'study_pack') {
          // Study packs nest quiz/flashcard data inside the questions object
          const pack = tool.questions as any;
          if (pack?.quiz?.questions) pushQuizQuestions(pack.quiz.questions, title);
          if (pack?.flashcards?.cards) pushFlashcards(pack.flashcards.cards, title);
          // crater_blast and wordTower inside study packs
          if (pack?.craterBlast?.questions) {
            const cbq = Array.isArray(pack.craterBlast.questions) ? pack.craterBlast.questions : pack.craterBlast.questions?.questions;
            pushQuizQuestions(cbq, title, 3);
          }
          if (pack?.wordTower?.questions) {
            const wtq = Array.isArray(pack.wordTower.questions) ? pack.wordTower.questions : pack.wordTower.questions?.questions;
            pushQuizQuestions(wtq, title, 3);
          }
        } else if (t === 'flashcards') {
          pushFlashcards(tool.questions as any[], title);
        } else if (t === 'crossword' || t === 'lesson') {
          // Skip — crosswords and lessons don't have quiz-style questions
        } else if (t === 'crater_blast' || t === 'word_tower') {
          // Nested: tool.questions may be { questions: [...] }
          const q = tool.questions;
          if (Array.isArray(q)) pushQuizQuestions(q, title);
          else if (q && typeof q === 'object' && Array.isArray((q as any).questions)) pushQuizQuestions((q as any).questions, title);
        } else {
          // Regular quiz types: mixed, multiple_choice, true_false, fill_blank
          if (Array.isArray(tool.questions)) pushQuizQuestions(tool.questions as any[], title);
        }
      });

      if (allItems.length === 0) { setNoContent(true); setPhase('home'); return; }

      const shuffled = allItems.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(QUESTION_COUNT, shuffled.length));

      if (selected.length === 0) { setNoContent(true); setPhase('home'); return; }

      // Let the build animation breathe so it doesn't flash for a frame.
      await new Promise((r) => setTimeout(r, 1100));

      setReviewItems(selected);
      setPhase('playing');
    } catch {
      setNoContent(true);
      setPhase('home');
    }
  };

  // ── answer helpers ───────────────────────────────────────────
  const isCorrectAnswer = (answer: string, item: ReviewItem): boolean => {
    if (item.type !== 'quiz') return false;
    const { correctAnswer, options } = item.data;
    if (options && options.length > 0) {
      const letter = correctAnswer?.toString().toUpperCase();
      if (letter && letter >= 'A' && letter <= 'Z') {
        const idx = letter.charCodeAt(0) - 65;
        return answer === options[idx];
      }
    }
    return answer?.toLowerCase() === correctAnswer?.toLowerCase();
  };

  const getCorrectText = (item: ReviewItem): string => {
    if (item.type !== 'quiz') return '';
    const { correctAnswer, options } = item.data;
    if (options?.length) {
      const letter = correctAnswer?.toString().toUpperCase();
      if (letter && letter >= 'A' && letter <= 'Z') {
        const idx = letter.charCodeAt(0) - 65;
        return options[idx] ?? correctAnswer ?? '';
      }
    }
    return correctAnswer ?? '';
  };

  const handleQuizAnswer = (answer: string) => {
    if (answered) return;
    setSelectedAnswer(answer);
    setAnswered(true);
    const item = reviewItems[currentIndex];
    const correct = isCorrectAnswer(answer, item);
    setQuestionResults(prev => [...prev, { item, isCorrect: correct, userAnswer: answer }]);
    setFeedbackMsg(correct ? getRandomMsg(CORRECT_MESSAGES) : getRandomMsg(WRONG_MESSAGES));
    if (correct) {
      setScore(s => s + 1);
      setInSessionStreak(s => {
        const n = s + 1;
        setBestSessionStreak(b => Math.max(b, n));
        return n;
      });
    } else {
      setInSessionStreak(0);
    }
  };

  const handleFlashcardKnew = (knew: boolean) => {
    const item = reviewItems[currentIndex];
    setQuestionResults(prev => [...prev, { item, isCorrect: knew }]);
    if (knew) {
      setScore(s => s + 1);
      setInSessionStreak(s => {
        const n = s + 1;
        setBestSessionStreak(b => Math.max(b, n));
        return n;
      });
    } else {
      setInSessionStreak(0);
    }
    goToNext();
  };

  const goToNext = useCallback(() => {
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(i => i + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setIsFlipped(false);
      setFeedbackMsg('');
    } else {
      // session complete — update streak
      const today = getToday();
      setStreak(prev => {
        const alive = isStreakAlive(prev);
        const alreadyDone = prev.lastCompletedDate === today;
        const newCurrent = alreadyDone ? prev.currentStreak : alive ? prev.currentStreak + 1 : 1;
        const updated: StreakData = {
          currentStreak: newCurrent,
          longestStreak: Math.max(prev.longestStreak, newCurrent),
          lastCompletedDate: today,
          totalReviews: prev.totalReviews + 1,
          totalCorrect: prev.totalCorrect + score + (isCorrectAnswer(selectedAnswer || '', reviewItems[currentIndex]) ? 1 : 0),
        };
        saveStreak(updated, userId);
        return updated;
      });
      setShowConfetti(true);
      setPhase('results');
    }
  }, [currentIndex, reviewItems.length, score, selectedAnswer, userId]);

  // ── render helpers ───────────────────────────────────────────
  const progress = reviewItems.length > 0 ? ((currentIndex) / reviewItems.length) * 100 : 0;
  const currentItem = reviewItems[currentIndex];
  const pct = reviewItems.length > 0 ? Math.round((score / reviewItems.length) * 100) : 0;

  // confetti cleanup
  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  /* ═══════════════════════════════════════════════════════════
     HOME — streak card + start button
     ═══════════════════════════════════════════════════════════ */
  if (phase === 'home') {
    const alive = isStreakAlive(streak);
    const displayStreak = alive ? streak.currentStreak : 0;

    return (
      <section className="space-y-5">
        {/* Hero card — premium gradient frame */}
        <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-[#C79BF2] via-[#A560E8] to-[#7733B5] shadow-[0_28px_60px_-30px_rgba(165,96,232,0.7)]">
          <div className="relative overflow-hidden rounded-[26px] bg-white dark:bg-stone-900 p-6 sm:p-8 lg:p-10">
            {/* Ambient glow + faint grid texture */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#FFC800]/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(120,113,108,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.8) 1px, transparent 1px)', backgroundSize: '26px 26px' }} aria-hidden />

            {/* Mascot */}
            <img
              src="/mascot-study.webp"
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="hidden lg:block pointer-events-none absolute top-5 right-7 w-24 h-auto z-10 drop-shadow-[0_14px_28px_rgba(165,96,232,0.35)]"
            />

            <div className="relative text-center max-w-lg mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F3EAFF] to-[#E9DBFF] dark:from-[#A560E8]/15 dark:to-[#A560E8]/5 text-[#7733B5] border-2 border-[#A560E8]/30 text-[11px] font-extrabold uppercase tracking-[0.12em] mb-4 shadow-[0_6px_16px_-10px_rgba(165,96,232,0.9)]">
                <span aria-hidden className="motion-safe:animate-pulse">🎯</span>
                Daily Review
              </span>

              <h2
                className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-stone-50"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                {completedToday ? (
                  <>You&apos;re done for today! <span className="text-[#A560E8]">🎉</span></>
                ) : firstName ? (
                  <>Ready to review, <span className="text-[#A560E8]">{firstName}</span>?</>
                ) : (
                  <>Ready for your <span className="text-[#A560E8]">daily review</span>?</>
                )}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-bold">
                {completedToday
                  ? 'Come back tomorrow to keep your streak going.'
                  : `${QUESTION_COUNT} questions from your study materials. Takes ~3 minutes.`}
              </p>

              {/* Streak + Stats row */}
              <div className="flex items-center justify-center gap-3 mt-6">
                {/* Streak badge */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-b-4 ${
                  displayStreak > 0
                    ? 'bg-[#F3EAFF] border-[#A560E8]/40 dark:bg-[#A560E8]/10'
                    : 'bg-stone-50 border-stone-200 dark:bg-stone-800 dark:border-stone-700'
                }`}>
                  <span className="text-2xl" aria-hidden>{displayStreak > 0 ? '🔥' : '❄️'}</span>
                  <div className="text-left">
                    <p className={`text-lg font-extrabold leading-none ${displayStreak > 0 ? 'text-[#A560E8]' : 'text-stone-400'}`}>
                      {displayStreak}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      day streak
                    </p>
                  </div>
                </div>

                {/* Total reviews */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-b-4 bg-[#F3EAFF] border-[#A560E8]/30 dark:bg-[#A560E8]/10">
                  <span className="text-2xl" aria-hidden>📊</span>
                  <div className="text-left">
                    <p className="text-lg font-extrabold leading-none text-[#A560E8]">
                      {streak.totalReviews}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      reviews
                    </p>
                  </div>
                </div>

                {/* Longest streak */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-b-4 bg-[#F3EAFF] border-[#A560E8]/30 dark:bg-[#A560E8]/10">
                  <span className="text-2xl" aria-hidden>🏆</span>
                  <div className="text-left">
                    <p className="text-lg font-extrabold leading-none text-[#A560E8]">
                      {streak.longestStreak}
                    </p>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      best streak
                    </p>
                  </div>
                </div>
              </div>

              {/* Start button */}
              <div className="mt-8">
                {noContent ? (
                  <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-stone-50 dark:bg-stone-800 p-5">
                    <img src="/mascot-thinking.webp" alt="" aria-hidden loading="lazy" className="w-16 h-auto mx-auto mb-3" />
                    <p className="text-sm font-extrabold text-stone-700 dark:text-stone-200 mb-1">No study materials yet</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-bold mb-4">
                      Create some quizzes or flashcards first, then your daily review will be ready!
                    </p>
                    <button
                      type="button"
                      onClick={() => onSwitchTool ? onSwitchTool('study_pack') : onNavigate('dashboard')}
                      className="px-6 py-2.5 bg-[#A560E8] text-white font-extrabold rounded-xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all text-sm"
                    >
                      Create a study pack →
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startReview}
                    className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-[#A560E8] to-[#7733B5] hover:from-[#9450D8] hover:to-[#A560E8] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#7733B5] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all text-lg tracking-tight shadow-[0_14px_30px_-12px_rgba(165,96,232,0.9)]"
                    style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                  >
                    {completedToday ? 'Practice again' : 'Start review'}
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Week calendar */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-4 sm:p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500 mb-3">This week</p>
          <div className="flex items-center justify-between gap-1">
            {(() => {
              const today = new Date();
              const dayOfWeek = today.getDay(); // 0=Sun
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - dayOfWeek);

              return ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const dateStr = d.toISOString().slice(0, 10);
                const isToday = dateStr === getToday();
                const isPast = d < today && !isToday;
                // Check if this day was completed (simple: if within streak range from lastCompleted going back)
                let isDone = false;
                if (streak.lastCompletedDate) {
                  const lastDate = new Date(streak.lastCompletedDate);
                  const dayDiff = Math.floor((lastDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                  isDone = dayDiff >= 0 && dayDiff < streak.currentStreak;
                }

                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">{label}</span>
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-extrabold border-2 transition-all ${
                      isDone
                        ? 'bg-[#A560E8] border-[#7733B5] text-white border-b-4'
                        : isToday
                          ? completedToday
                            ? 'bg-[#A560E8] border-[#7733B5] text-white border-b-4'
                            : 'bg-[#F3EAFF] border-[#A560E8] text-[#A560E8] border-b-4'
                          : isPast
                            ? 'bg-stone-100 border-stone-200 text-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-600'
                            : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-500'
                    }`}>
                      {isDone || (isToday && completedToday) ? '✓' : d.getDate()}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Tip card */}
        <div className="rounded-2xl bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-b-4 border-[#A560E8]/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden>💡</span>
            <div>
              <p className="text-sm font-extrabold text-[#A560E8] mb-0.5">Pro tip</p>
              <p className="text-xs text-stone-600 dark:text-stone-300 font-bold leading-relaxed">
                The more study packs you create, the better your daily reviews get. Each review pulls from all your materials using spaced repetition to focus on what you need to practice most.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════════════════════ */
  if (phase === 'loading') {
    return (
      <>
        <GenerationOverlay open variant="dailyReview" />
        {/* Soft placeholder behind the overlay */}
        <section className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-10 sm:p-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-[#A560E8]/30 border-t-[#A560E8] rounded-full animate-spin" />
            <p className="text-stone-600 dark:text-stone-400 font-extrabold" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
              Preparing your review...
            </p>
          </div>
        </section>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RESULTS — celebration screen
     ═══════════════════════════════════════════════════════════ */
  if (phase === 'results') {
    const msg = getResultMessage(pct);
    const xp = calcXP(score, reviewItems.length, streak.currentStreak);

    return (
      <section className="space-y-5">
        <div className="relative rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
          {/* Confetti burst */}
          {showConfetti && (
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
              {Array.from({ length: 40 }).map((_, i) => {
                const colors = ['#A560E8', '#A560E8', '#A560E8', '#FF4B4B', '#A560E8', '#FFD700'];
                const color = colors[i % colors.length];
                const left = Math.random() * 100;
                const delay = Math.random() * 0.5;
                const size = 6 + Math.random() * 8;
                const rotation = Math.random() * 360;
                return (
                  <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                      left: `${left}%`,
                      top: '-10px',
                      width: size,
                      height: size,
                      backgroundColor: color,
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      transform: `rotate(${rotation}deg)`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${1.5 + Math.random()}s`,
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="relative p-6 sm:p-10 text-center z-10">
            {/* Mascot */}
            <img
              src={msg.mascot}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="w-24 sm:w-32 h-auto mx-auto mb-4"
            />

            <h2
              className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-50 mb-1"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {msg.title}
            </h2>
            <p className="text-base text-stone-500 dark:text-stone-400 font-bold mb-6">
              {msg.sub}
            </p>

            {/* Score + XP + Streak row */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 flex-wrap">
              {/* Score */}
              <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/40">
                <p className="text-3xl font-extrabold text-[#A560E8]">{score}/{reviewItems.length}</p>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">correct</p>
              </div>

              {/* XP earned */}
              <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/40">
                <p className="text-3xl font-extrabold text-[#A560E8]">+{xp}</p>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">XP earned</p>
              </div>

              {/* Streak */}
              <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-[#FFE8E8] border-2 border-b-4 border-[#FF4B4B]/40">
                <p className="text-3xl font-extrabold text-[#FF4B4B]">🔥 {streak.currentStreak}</p>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">day streak</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPhase('home')}
                className="px-8 py-3.5 bg-[#A560E8] text-white font-extrabold rounded-2xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all text-base"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Done
              </button>
              <button
                type="button"
                onClick={startReview}
                className="px-8 py-3.5 bg-white text-stone-700 dark:text-stone-200 font-extrabold rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all text-base"
              >
                Practice again
              </button>
            </div>
          </div>
        </div>

        {/* Review breakdown */}
        {questionResults.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-4 sm:p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500 mb-3">Review breakdown</p>
            <div className="space-y-2">
              {questionResults.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 ${
                    r.isCorrect
                      ? 'bg-[#F3EAFF]/50 border-[#A560E8]/30'
                      : 'bg-[#FFE8E8]/50 border-[#FF4B4B]/30'
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-extrabold ${
                    r.isCorrect ? 'bg-[#A560E8]' : 'bg-[#FF4B4B]'
                  }`}>
                    {r.isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-stone-800 dark:text-stone-100 line-clamp-2">
                      {r.item.type === 'quiz' ? r.item.data.question : r.item.data.front}
                    </p>
                    {!r.isCorrect && r.item.type === 'quiz' && (
                      <p className="text-xs text-[#A560E8] font-bold mt-0.5">
                        Correct: {getCorrectText(r.item)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     PLAYING — question/flashcard display
     ═══════════════════════════════════════════════════════════ */
  return (
    <section className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-stone-500 dark:text-stone-400">
            Question {currentIndex + 1} of {reviewItems.length}
          </span>
          <div className="flex items-center gap-3">
            {inSessionStreak >= 2 && (
              <span className="text-xs font-extrabold text-[#A560E8]">🔥 {inSessionStreak} in a row!</span>
            )}
            <span className="text-xs font-extrabold text-[#A560E8]">{score} correct</span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700">
          <div
            className="h-full rounded-full bg-[#A560E8] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentItem && (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
          {/* Type badge */}
          <div className={`px-4 py-2 flex items-center justify-between ${
            currentItem.type === 'quiz' ? 'bg-[#F3EAFF]' : 'bg-[#F3EAFF]'
          }`}>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
              currentItem.type === 'quiz' ? 'text-[#A560E8]' : 'text-[#A560E8]'
            }`}>
              {currentItem.type === 'quiz'
                ? (currentItem.data.type === 'true_false' ? '🔵 True or False' : '🔵 Multiple Choice')
                : '💜 Flashcard Recall'}
            </span>
            {currentItem.data.sourceTitle && (
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 truncate ml-2 max-w-[200px]">
                from: {currentItem.data.sourceTitle}
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7">
            {/* ── Quiz question ── */}
            {currentItem.type === 'quiz' && (
              <>
                <h3
                  className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 leading-snug mb-5"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {currentItem.data.question}
                </h3>

                {/* Options — True/False or Multiple Choice */}
                {(() => {
                  const qType = currentItem.data.type;
                  const hasOptions = currentItem.data.options && currentItem.data.options.length > 0;
                  const options = hasOptions ? currentItem.data.options! : ['True', 'False'];
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  const isTF = qType === 'true_false' || (!hasOptions && options.length === 2);

                  return (
                    <div className={isTF ? 'grid grid-cols-2 gap-3' : 'space-y-2.5'}>
                      {options.map((opt, i) => {
                        const isSelected = selectedAnswer === opt;
                        const correctText = getCorrectText(currentItem);
                        const isCorrectOpt = opt === correctText || opt.toLowerCase() === correctText.toLowerCase();

                        let btnClass = 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-[#A560E8] hover:bg-[#F3EAFF]/30';
                        if (answered) {
                          if (isCorrectOpt) {
                            btnClass = 'bg-[#F3EAFF] border-[#A560E8] dark:bg-[#A560E8]/10';
                          } else if (isSelected && !isCorrectOpt) {
                            btnClass = 'bg-[#FFE8E8] border-[#FF4B4B] dark:bg-[#FF4B4B]/10';
                          } else {
                            btnClass = 'bg-stone-50 border-stone-200 dark:bg-stone-800 dark:border-stone-700 opacity-50';
                          }
                        }

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuizAnswer(opt)}
                            disabled={answered}
                            className={`w-full flex items-center ${isTF ? 'justify-center' : ''} gap-3 px-4 py-3.5 rounded-xl border-2 border-b-4 text-left transition-all ${btnClass} ${!answered ? 'active:border-b-2 active:translate-y-0.5 cursor-pointer' : ''}`}
                          >
                            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold border-2 ${
                              answered && isCorrectOpt
                                ? 'bg-[#A560E8] border-[#7733B5] text-white'
                                : answered && isSelected && !isCorrectOpt
                                  ? 'bg-[#FF4B4B] border-[#E04343] text-white'
                                  : 'bg-stone-100 border-stone-200 text-stone-500 dark:bg-stone-700 dark:border-stone-600 dark:text-stone-300'
                            }`}>
                              {answered && isCorrectOpt ? '✓' : answered && isSelected ? '✗' : isTF ? (opt === 'True' ? 'T' : 'F') : letters[i]}
                            </span>
                            <span className="flex-1 text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Duolingo-style feedback banner */}
                {answered && (() => {
                  const wasCorrect = questionResults[questionResults.length - 1]?.isCorrect;
                  return (
                    <div className={`mt-5 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 p-5 sm:p-7 ${
                      wasCorrect
                        ? 'bg-[#F3EAFF] border-t-2 border-[#A560E8]/30'
                        : 'bg-[#FFE8E8] border-t-2 border-[#FF4B4B]/30'
                    }`}>
                      <div className="flex items-start gap-3 mb-4">
                        {/* Big icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold border-2 border-b-4 ${
                          wasCorrect
                            ? 'bg-[#A560E8] border-[#7733B5]'
                            : 'bg-[#FF4B4B] border-[#E04343]'
                        }`}>
                          {wasCorrect ? '✓' : '✗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-lg font-extrabold ${wasCorrect ? 'text-[#A560E8]' : 'text-[#FF4B4B]'}`}
                            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                          >
                            {feedbackMsg}
                          </p>
                          {!wasCorrect && (
                            <p className="text-sm font-bold text-[#FF4B4B]/80 mt-0.5">
                              Correct answer: <span className="text-[#FF4B4B] font-extrabold">{getCorrectText(currentItem)}</span>
                            </p>
                          )}
                          {wasCorrect && currentItem.type === 'quiz' && currentItem.data.explanation && (
                            <p className="text-sm font-bold text-[#3C3C3C]/70 mt-1 leading-relaxed">
                              {currentItem.data.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={goToNext}
                        className={`w-full py-3.5 font-extrabold rounded-xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all text-base ${
                          wasCorrect
                            ? 'bg-[#A560E8] border-[#7733B5] text-white'
                            : 'bg-[#FF4B4B] border-[#E04343] text-white'
                        }`}
                        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                      >
                        {currentIndex < reviewItems.length - 1 ? 'Continue' : 'See results'}
                      </button>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ── Flashcard ── */}
            {currentItem.type === 'flashcard' && (
              <>
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[180px] sm:min-h-[220px] rounded-2xl border-2 border-b-4 p-6 flex items-center justify-center cursor-pointer transition-all ${
                    isFlipped
                      ? 'bg-[#F3EAFF] border-[#A560E8]/40'
                      : 'bg-[#F3EAFF] border-[#A560E8]/40'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-2">
                      {isFlipped ? 'Answer' : 'Term'} · tap to flip
                    </p>
                    <p
                      className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 leading-snug"
                      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                    >
                      {isFlipped ? currentItem.data.back : currentItem.data.front}
                    </p>
                  </div>
                </div>

                {isFlipped && (
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFlashcardKnew(false)}
                      className="flex-1 max-w-[180px] py-3 bg-[#FFE8E8] text-[#FF4B4B] font-extrabold rounded-xl border-2 border-b-4 border-[#FF4B4B]/40 active:border-b-2 active:translate-y-0.5 transition-all text-sm"
                    >
                      Still learning
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlashcardKnew(true)}
                      className="flex-1 max-w-[180px] py-3 bg-[#F3EAFF] text-[#A560E8] font-extrabold rounded-xl border-2 border-b-4 border-[#A560E8]/40 active:border-b-2 active:translate-y-0.5 transition-all text-sm"
                    >
                      Got it! ✓
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DailyReviewTab;
