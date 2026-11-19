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
  created_at?: string;
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

// ── which packs feed the review ────────────────────────────────
// The student ticks the packs they still need. A pack they have never
// touched is in by default while it is recent, and out once it is older
// than PACK_MAX_AGE_DAYS, so last semester's material drops out on its own.
// Kept in this browser only.
const PACK_MAX_AGE_DAYS = 60;
const PICKS_KEY = 'ws_review_packs';
type PackPicks = { on: string[]; off: string[] };

const loadPicks = (): PackPicks => {
  try {
    const raw = JSON.parse(localStorage.getItem(PICKS_KEY) || 'null');
    if (raw && Array.isArray(raw.on) && Array.isArray(raw.off)) return raw;
  } catch { /* ignore */ }
  return { on: [], off: [] };
};

const ageInDays = (iso?: string): number => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86_400_000) : 0;
};

const isOldPack = (tool: StudyTool) => ageInDays(tool.created_at) > PACK_MAX_AGE_DAYS;

const isPicked = (tool: StudyTool, picks: PackPicks): boolean => {
  if (picks.off.includes(tool.id)) return false;
  if (picks.on.includes(tool.id)) return true;
  return !isOldPack(tool);
};

/** Crosswords and lessons have nothing to quiz on, so they are never listed. */
const canReview = (tool: StudyTool) => tool.quiz_type !== 'crossword' && tool.quiz_type !== 'lesson';

const madeAgo = (iso?: string): string => {
  const d = ageInDays(iso);
  if (d <= 0) return 'Made today';
  if (d === 1) return 'Made yesterday';
  if (d < 14) return `Made ${d} days ago`;
  if (d < 60) return `Made ${Math.floor(d / 7)} weeks ago`;
  return `Made ${Math.floor(d / 30)} months ago`;
};

const packSize = (tool: StudyTool): string => {
  const q = tool.questions as any;
  if (tool.quiz_type === 'study_pack' && q && typeof q === 'object') {
    const cards = Array.isArray(q.flashcards?.cards) ? q.flashcards.cards.length : 0;
    const questions = Array.isArray(q.quiz?.questions) ? q.quiz.questions.length : 0;
    const parts = [cards ? `${cards} ${cards === 1 ? 'card' : 'cards'}` : '', questions ? `${questions} ${questions === 1 ? 'question' : 'questions'}` : ''].filter(Boolean);
    return parts.join(', ');
  }
  const n = Array.isArray(q) ? q.length : Array.isArray(q?.questions) ? q.questions.length : 0;
  return n ? `${n} ${n === 1 ? 'item' : 'items'}` : '';
};

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

  // The student's packs, and which of them feed the review.
  const [tools, setTools] = useState<StudyTool[] | null>(null);
  const [picks, setPicks] = useState<PackPicks>(loadPicks);
  const loadTools = useCallback(async (): Promise<StudyTool[] | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const res = await fetch(`${API_URL}/analysis/quiz-history`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const list = ((data.data || []) as StudyTool[]).filter(canReview).slice(0, 25).map((t) => ({ ...t, id: String(t.id) }));
      setTools(list);
      return list;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => { void loadTools(); }, [loadTools]);
  const togglePack = (tool: StudyTool) => {
    setPicks((prev) => {
      const nowOn = !isPicked(tool, prev);
      const next: PackPicks = {
        on: nowOn ? [...prev.on.filter((x) => x !== tool.id), tool.id] : prev.on.filter((x) => x !== tool.id),
        off: nowOn ? prev.off.filter((x) => x !== tool.id) : [...prev.off.filter((x) => x !== tool.id), tool.id],
      };
      try { localStorage.setItem(PICKS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    setNoContent(false);
  };
  const pickedCount = tools ? tools.filter((t) => isPicked(t, picks)).length : 0;

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
      const loaded = tools ?? await loadTools();
      if (!loaded) { setNoContent(true); setPhase('home'); return; }
      const chosen = loaded.filter((t) => isPicked(t, picks));

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

      chosen.forEach(tool => {
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

    const hasPacks = !!tools && tools.length > 0;
    const nonePicked = hasPacks && pickedCount === 0;
    const card = 'rounded-[24px] border border-[#E4D4F8] bg-white shadow-[0_16px_34px_-26px_rgba(90,45,140,0.55)] dark:border-stone-700 dark:bg-stone-900';
    const flame = (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2c1 3.5 4 5 4 9a4 4 0 0 1-1 2.6C15 11 13.5 10 13 8.5 11 10.5 8 12.5 8 16a5 5 0 0 0 9.5 2c.3 3-2.2 4-5.5 4-4 0-7-2.7-7-7C5 9.5 10 7 12 2z" /></svg>
    );

    // Monday to Sunday of this week.
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === getToday();
      let isDone = false;
      if (streak.lastCompletedDate) {
        const dayDiff = Math.round((new Date(streak.lastCompletedDate).getTime() - new Date(dateStr).getTime()) / 86_400_000);
        isDone = dayDiff >= 0 && dayDiff < streak.currentStreak;
      }
      return { label, isToday, isDone };
    });
    const weekDone = week.filter((d) => d.isDone).length;

    return (
      <section className="flex flex-col gap-6" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        {/* ── TODAY ─────────────────────────────────────────────── */}
        <div className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-[30px] bg-gradient-to-b from-[#A863EA] via-[#8E48CF] to-[#6A2AA6] px-5 py-6 text-white shadow-[0_30px_60px_-34px_rgba(90,45,140,0.8)] sm:px-[30px] sm:py-7">
          <span aria-hidden className="pointer-events-none absolute -right-40 -top-[120px] h-[520px] w-[520px] rounded-full bg-[#9652D3]" />
          <div className="relative flex min-w-0 flex-[3_1_420px] flex-col items-start gap-3">
            <span className={`inline-flex min-h-[34px] items-center gap-[7px] rounded-full px-[13px] text-[14.5px] font-black ${displayStreak > 0 ? 'bg-[#FFC800] text-[#3D2F00]' : 'bg-[#5A1F8F] text-white'}`}>
              {displayStreak > 0 && flame(16)}
              {displayStreak > 0 ? `${displayStreak} day streak` : 'No streak yet'}
            </span>
            <h1 className="m-0 text-[28px] font-black leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
              {completedToday ? (
                <>Done for <span className="text-[#FFD84D]">today</span>{firstName ? `, ${firstName}` : ''}</>
              ) : (
                <>Ready for today&apos;s <span className="text-[#FFD84D]">review</span>{firstName ? `, ${firstName}` : ''}?</>
              )}
            </h1>
            <p className="m-0 text-[15px] font-bold text-[#F3EAFF] sm:text-[16.5px]">
              {completedToday
                ? 'Come back tomorrow to keep your streak going.'
                : !hasPacks && tools
                  ? 'Your review is built from your study packs. Make one to get started.'
                  : nonePicked
                    ? 'No packs are ticked below. Tick at least one to review.'
                    : `Up to ${QUESTION_COUNT} questions and cards from ${pickedCount === 1 ? 'the pack' : `the ${pickedCount} packs`} you picked. ${displayStreak > 0 ? `Do it today to make it ${displayStreak + 1} days.` : 'About 3 minutes.'}`}
            </p>
            {(!hasPacks && tools) || noContent ? (
              <button
                type="button"
                onClick={() => (onSwitchTool ? onSwitchTool('study_pack') : onNavigate('dashboard'))}
                className="mt-1 inline-flex min-h-[62px] items-center gap-2.5 whitespace-nowrap rounded-[20px] border-2 border-b-[6px] border-[#46A302] bg-[#58CC02] px-[30px] text-[19px] font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
              >
                Make a study pack
              </button>
            ) : (
              <button
                type="button"
                onClick={startReview}
                disabled={nonePicked}
                className="mt-1 inline-flex min-h-[62px] items-center gap-2.5 whitespace-nowrap rounded-[20px] border-2 border-b-[6px] border-[#46A302] bg-[#58CC02] px-[30px] text-[19px] font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:active:translate-y-0.5 enabled:active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completedToday ? 'Practise again' : 'Start today\'s review'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            )}
            {noContent && hasPacks && (
              <p className="m-0 text-[14.5px] font-extrabold text-[#FFE9A6]">The packs you ticked have no questions or cards to review. Tick another, or make a new pack.</p>
            )}
          </div>
          <img src={completedToday ? '/mascot-celebrating-still.webp' : '/mascot-pointing.webp'} alt="Scholar, the WriteScholar mascot" width={170} height={170} className="relative mx-auto hidden h-[170px] w-[170px] shrink-0 object-contain sm:block" />
        </div>

        {/* ── REVIEWING FROM ────────────────────────────────────── */}
        {hasPacks && tools && (
          <div className={`${card} flex flex-col gap-3 px-[22px] py-5`}>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="m-0 text-[22px] font-black text-stone-900 dark:text-stone-50">Reviewing from</h2>
              <span className="text-[14.5px] font-extrabold text-stone-600 dark:text-stone-400">
                {pickedCount} of {tools.length} {tools.length === 1 ? 'pack' : 'packs'}. Untick anything you no longer need.
              </span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {tools.map((tool) => {
                const on = isPicked(tool, picks);
                const leftOut = !on && isOldPack(tool) && !picks.off.includes(tool.id);
                const size = packSize(tool);
                return (
                  <li key={tool.id}>
                    <label className={`flex min-h-[64px] cursor-pointer flex-wrap items-center gap-3.5 rounded-[18px] px-4 py-3 focus-within:ring-4 focus-within:ring-[#A560E8]/30 ${on ? 'border-2 border-[#A560E8] bg-[#FBF8FF] dark:bg-[#A560E8]/15' : 'border border-[#E4D4F8] bg-white dark:border-stone-700 dark:bg-stone-900'}`}>
                      <input type="checkbox" checked={on} onChange={() => togglePack(tool)} className="sr-only" />
                      {on ? (
                        <span aria-hidden className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#58CC02] text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                        </span>
                      ) : (
                        <span aria-hidden className="h-[34px] w-[34px] shrink-0 rounded-[11px] border-[3px] border-[#C9A0F0] bg-white dark:bg-stone-900" />
                      )}
                      <span className="min-w-0 flex-[1_1_260px]">
                        <span className={`block truncate text-[17px] font-black leading-tight ${on ? 'text-stone-900 dark:text-stone-50' : 'text-stone-600 dark:text-stone-400'}`}>{tool.title || 'Study pack'}</span>
                        <span className="block text-[13.5px] font-bold text-stone-600 dark:text-stone-400">{madeAgo(tool.created_at)}.{size ? ` ${size}.` : ''}</span>
                      </span>
                      {leftOut && (
                        <span className="whitespace-nowrap rounded-full bg-[#FFF1C2] px-2.5 py-[3px] text-[12.5px] font-black text-[#5A4500]">Left out: older than {PACK_MAX_AGE_DAYS} days</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="m-0 text-[14px] font-bold text-stone-600 dark:text-stone-400">New packs are added for you. Packs older than {PACK_MAX_AGE_DAYS} days are left out until you tick them.</p>
          </div>
        )}

        {/* ── THIS WEEK ─────────────────────────────────────────── */}
        <div className={`${card} flex flex-col gap-3.5 px-[22px] py-5`}>
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-[22px] font-black text-stone-900 dark:text-stone-50">This week</h2>
            <span className="ml-auto text-[14.5px] font-extrabold text-stone-600 dark:text-stone-400">{weekDone} of 7 days done</span>
          </div>
          <ol className="m-0 flex list-none gap-2 p-0">
            {week.map((d) => (
              <li key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                {d.isDone ? (
                  <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#58CC02] text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
                    <span className="sr-only">Done</span>
                  </span>
                ) : d.isToday ? (
                  <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[3px] border-dashed border-[#A560E8] bg-[#F7F1FF] text-[12px] font-black text-[#5B2491] dark:bg-[#A560E8]/15 dark:text-[#C9A0F0]">Now</span>
                ) : (
                  <span className="h-[46px] w-[46px] rounded-full bg-[#F3EAFF] dark:bg-stone-800" />
                )}
                <span className={`text-[13.5px] font-black ${d.isToday ? 'text-[#5B2491] dark:text-[#C9A0F0]' : 'text-stone-600 dark:text-stone-400'}`}>{d.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── NUMBERS ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-[18px]">
          <div className="flex flex-[1_1_150px] flex-col gap-0.5 rounded-[24px] border border-[#F1DC8A] bg-[#FFF7DA] p-[18px]">
            <span className="text-[38px] font-black leading-none text-[#5A4500]">{displayStreak}</span>
            <span className="text-[14.5px] font-extrabold text-[#5A4500]">day streak</span>
          </div>
          <div className={`${card} flex flex-[1_1_150px] flex-col gap-0.5 p-[18px]`}>
            <span className="text-[38px] font-black leading-none text-stone-900 dark:text-stone-50">{streak.totalReviews}</span>
            <span className="text-[14.5px] font-extrabold text-stone-600 dark:text-stone-400">{streak.totalReviews === 1 ? 'review done' : 'reviews done'}</span>
          </div>
          <div className={`${card} flex flex-[1_1_150px] flex-col gap-0.5 p-[18px]`}>
            <span className="text-[38px] font-black leading-none text-stone-900 dark:text-stone-50">{streak.longestStreak}</span>
            <span className="text-[14.5px] font-extrabold text-stone-600 dark:text-stone-400">best streak</span>
          </div>
          <div className="flex flex-[2_1_300px] items-center gap-3.5 rounded-[24px] border-2 border-dashed border-[#C9A0F0] bg-[#F7F1FF] p-[18px] dark:bg-[#A560E8]/10">
            <img src="/mascot-study-still.webp" alt="" width={64} height={64} className="h-16 w-16 shrink-0 object-contain" />
            <p className="m-0 text-[15px] font-extrabold leading-[1.4] text-stone-900 dark:text-stone-100">A few minutes every day beats one long session the night before.</p>
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
