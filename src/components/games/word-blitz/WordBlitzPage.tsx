/**
 * WordBlitzPage.tsx
 *
 * Word Blitz — 60-second fill-in-the-blank speedrun.
 *
 * The third game in the WriteScholar lineup, mirroring the architecture
 * of LightningReflexQuizPage (Crater Blast) and WordTowerPage. Same:
 *
 *   - Page shell (Header / Footer / WriteScholarEditorialBackgroundLayers)
 *   - Five-state machine (menu / loading / ready / playing / gameover)
 *   - Five sub-render functions
 *   - Plan gating, save/load flow, my-packs flow, minimal-UI flag
 *   - Ref-mirrored game state for closures
 *   - Score popup spawn/cleanup pattern
 *
 * Word Blitz-specific:
 *   - 60-second timer instead of lives — game ends when clock hits 0
 *   - Cloze sentence + 4 answer buttons (no falling blocks / projectiles)
 *   - +1 / +2 (speed bonus under 2s) / -1 (wrong) / 0 (skip) scoring
 *   - Score CAN go negative — displayed in red
 *   - Position-randomization safety: no 3-in-a-row same correct slot
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import { WORD_BLITZ_TRIVIA_BANK } from '../../../data/wordBlitzTriviaBank';
import { WORD_BLITZ_VOCAB_BANK } from '../../../data/wordBlitzVocabBank';
import { WORD_BLITZ_QUOTES_BANK } from '../../../data/wordBlitzQuotesBank';
import { WORD_BLITZ_MENTAL_MATH_BANK } from '../../../data/wordBlitzMentalMathBank';
import type { WordBlitzBankQuestion } from '../../../data/wordBlitzTriviaBank';

/* ────────────────────── Types ────────────────────── */

interface WordBlitzPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface WordBlitzQuestion {
  id: string;
  /** Sentence with the literal "{{blank}}" token. */
  sentence: string;
  correctAnswer: string;
  distractors: string[];
}

interface AnswerItem {
  text: string;
  isCorrect: boolean;
}

interface QuestionResult {
  question: WordBlitzQuestion;
  /** null when skipped or timed out without choosing. */
  chosenAnswer: string | null;
  isCorrect: boolean;
  reactionMs: number | null;
}

interface ScorePopup {
  id: string;
  text: string;     // "+1", "+2", "-1"
  color: 'green' | 'red';
  /** Pixel coords inside the play area (relative to its top-left). */
  x: number;
  y: number;
}

interface SavedPack {
  id: string;
  title: string;
  questions: WordBlitzQuestion[];
  created_at: string;
}

type GameState = 'menu' | 'loading' | 'ready' | 'playing' | 'gameover';
type InputMode = 'topic' | 'notes' | 'play-for-fun' | 'mental-math' | 'vocabulary' | 'quotes' | 'my-packs';

/* ────────────────────── Config ────────────────────── */

const GAME_DURATION_MS = 60_000;
const SPEED_BONUS_THRESHOLD_MS = 2_000;
const CORRECT_FLASH_MS = 100;
const WRONG_FLASH_MS = 200;
const WRONG_SHOW_CORRECT_MS = 250;
const SCORE_POPUP_LIFE_MS = 900;
const READY_COUNTDOWN_SECONDS = 3;

const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

/* ────────────────────── Helpers ────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffle a 4-item answer array with the safety rule that the correct
 * answer can't land in the same slot 3 times in a row. Falls through
 * after 10 attempts so a degenerate run of bad random draws can't lock
 * the game.
 */
function shufflePreventingPattern(items: AnswerItem[], lastTwoCorrectPositions: number[]): { shuffled: AnswerItem[]; correctPos: number } {
  let shuffled = shuffle(items);
  let correctPos = shuffled.findIndex(it => it.isCorrect);
  let attempts = 0;
  while (
    lastTwoCorrectPositions.length === 2
    && lastTwoCorrectPositions[0] === correctPos
    && lastTwoCorrectPositions[1] === correctPos
    && attempts < 10
  ) {
    shuffled = shuffle(items);
    correctPos = shuffled.findIndex(it => it.isCorrect);
    attempts++;
  }
  return { shuffled, correctPos };
}

/** Map a play-for-fun bank entry to an internal WordBlitzQuestion. */
function bankToQuestion(b: WordBlitzBankQuestion, idx: number, prefix: string): WordBlitzQuestion {
  return {
    id: `${prefix}-${idx}`,
    sentence: b.sentence,
    correctAnswer: b.correctAnswer,
    distractors: [...b.distractors],
  };
}

function vibrate(pattern: number | number[]) {
  try { (navigator as any).vibrate?.(pattern); } catch { /* ignore */ }
}

/* ────────────────────── Component ────────────────────── */

const WordBlitzPage = ({ onNavigate, user, onLogout }: WordBlitzPageProps) => {
  const userPlan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
  const canUseStudyTools = !!user && (userPlan === 'pro' || userPlan === 'premium');
  const maxWords = canUseStudyTools ? 10000 : 5000;

  /* — Top-level state — */

  const [gameState, setGameState] = useState<GameState>('menu');
  const [inputMode, setInputMode] = useState<InputMode>('notes');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<WordBlitzQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<AnswerItem[]>([]);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_MS);

  const [flashState, setFlashState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [flashedButtonIndex, setFlashedButtonIndex] = useState<number | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [screenShake, setScreenShake] = useState(false);

  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);

  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [loadedFromSavedGame, setLoadedFromSavedGame] = useState(false);
  const [isPlayForFun, setIsPlayForFun] = useState(false);
  const [showMinimalUI, setShowMinimalUI] = useState(false);

  const [studyPacks, setStudyPacks] = useState<SavedPack[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
  const [packsLoading, setPacksLoading] = useState(false);
  const [packsFetched, setPacksFetched] = useState(false);

  /* — Refs (current-state mirrors for closures + timers) — */

  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);
  const skipCountRef = useRef(0);
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const currentQIdxRef = useRef(0);
  const questionsRef = useRef<WordBlitzQuestion[]>([]);
  const currentAnswersRef = useRef<AnswerItem[]>([]);
  const gameActiveRef = useRef(false);
  const roundResolvedRef = useRef(false);
  const questionStartTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const lastTwoCorrectPositionsRef = useRef<number[]>([]);

  const playAreaRef = useRef<HTMLDivElement | null>(null);
  const tickerRef = useRef<number | null>(null);
  const questionResultsRef = useRef<QuestionResult[]>([]);

  const advanceTimerRef = useRef<number | null>(null);
  const correctRevealTimerRef = useRef<number | null>(null);
  const readyTimerRef = useRef<number | null>(null);

  /* — Sync helper (writes ref + state in lockstep) — */

  const sync = useCallback((field: 'score' | 'correct' | 'wrong' | 'skip' | 'streak' | 'longest' | 'qIdx', v: number) => {
    switch (field) {
      case 'score':   scoreRef.current = v;          setScore(v); break;
      case 'correct': correctCountRef.current = v;   setCorrectCount(v); break;
      case 'wrong':   wrongCountRef.current = v;     setWrongCount(v); break;
      case 'skip':    skipCountRef.current = v;      setSkipCount(v); break;
      case 'streak':  streakRef.current = v;         setStreak(v); break;
      case 'longest': longestStreakRef.current = v;  setLongestStreak(v); break;
      case 'qIdx':    currentQIdxRef.current = v;    setCurrentQIdx(v); break;
    }
  }, []);

  /* — Word count for notes mode — */

  const wordCount = inputMode === 'notes' ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;

  /* — Document title + scroll-to-top on phase change — */

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Word Blitz — 60-Second Fill-in-the-Blank Speedrun | WriteScholar';
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', "Word Blitz — the 60-second AI-powered fill-in-the-blank speedrun. Read the sentence, tap the right word. How many can you get in a minute?");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [gameState]);

  /* — Minimal-UI flag (one-shot) — */

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const minimal = localStorage.getItem('writescholar_minimal_ui') === 'true';
    if (minimal) {
      localStorage.removeItem('writescholar_minimal_ui');
      setShowMinimalUI(true);
    }
  }, []);

  /* — Saved game load (one-shot, on mount) — */

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('savedWordBlitz');
    if (!saved) return;
    try {
      const tool = JSON.parse(saved);
      const qs = tool.questions?.questions ?? (Array.isArray(tool.questions) ? tool.questions : []);
      if (qs.length > 0) {
        localStorage.removeItem('savedWordBlitz');
        const cleaned: WordBlitzQuestion[] = qs
          .filter((q: any) => q && typeof q.sentence === 'string' && typeof q.correctAnswer === 'string' && Array.isArray(q.distractors))
          .map((q: any, i: number) => ({
            id: q.id || `saved-${i}`,
            sentence: q.sentence,
            correctAnswer: q.correctAnswer,
            distractors: q.distractors.slice(0, 3),
          }));
        if (cleaned.length === 0) return;
        questionsRef.current = shuffle(cleaned);
        setQuestions([...questionsRef.current]);
        setInputText(tool.questions?.sourceText || tool.title || '');
        setInputMode((tool.questions?.inputType || 'topic') as InputMode);
        setLoadedFromSavedGame(true);
        resetGameState();
        setGameState('ready');
      }
    } catch {
      localStorage.removeItem('savedWordBlitz');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* — My-Packs fetch — */

  useEffect(() => {
    if (inputMode !== 'my-packs' || packsFetched || packsLoading || !user) return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;
    setPacksLoading(true);
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/analysis/quiz-history`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load packs');
        const items: SavedPack[] = (data.data || [])
          .map((t: any) => {
            // Accept saved Word Blitz games + study packs that include Word Blitz questions.
            // Backend stores standalone saves with quiz_type='word_blitz' and study packs
            // bundle the questions under data.wordBlitz (camelCase, mirroring craterBlast/wordTower).
            let qs: any[] = [];
            if (t.quiz_type === 'word_blitz') {
              qs = Array.isArray(t.questions?.questions) ? t.questions.questions : Array.isArray(t.questions) ? t.questions : [];
            } else if (t.quiz_type === 'study_pack') {
              const nested = t.questions?.wordBlitz;
              qs = Array.isArray(nested?.questions) ? nested.questions : [];
            } else {
              return null;
            }
            if (qs.length === 0) return null;
            return {
              id: t.id,
              title: t.title || 'Untitled',
              questions: qs,
              created_at: t.created_at,
            };
          })
          .filter(Boolean) as SavedPack[];
        setStudyPacks(items);
        setSelectedPacks(new Set(items.map(p => p.id)));
      } catch {
        // Silent — empty state UI handles the fallback.
      } finally {
        setPacksLoading(false);
        setPacksFetched(true);
      }
    })();
  }, [inputMode, packsFetched, packsLoading, user]);

  /* — Mount cleanup — */

  useEffect(() => {
    return () => {
      gameActiveRef.current = false;
      if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (correctRevealTimerRef.current) clearTimeout(correctRevealTimerRef.current);
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    };
  }, []);

  /* ─────────── AI fetch ─────────── */

  const fetchQuestions = useCallback(async (): Promise<WordBlitzQuestion[] | null> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      setError('Please log in to generate AI questions.');
      return null;
    }
    const res = await fetch(`${apiUrl}/analysis/generate-word-blitz-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inputType: inputMode, content: inputText.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to generate questions');
    const raw: any[] = data?.data?.questions || [];
    return raw
      .filter(q => q && typeof q.sentence === 'string' && q.sentence.includes('{{blank}}') && typeof q.correctAnswer === 'string' && Array.isArray(q.distractors) && q.distractors.length === 3)
      .map((q, i) => ({
        id: q.id || `ai-${i}`,
        sentence: q.sentence,
        correctAnswer: q.correctAnswer,
        distractors: q.distractors.slice(0, 3),
      }));
  }, [inputMode, inputText]);

  /* ─────────── Game state lifecycle ─────────── */

  function resetGameState() {
    sync('score', 0);
    sync('correct', 0);
    sync('wrong', 0);
    sync('skip', 0);
    sync('streak', 0);
    sync('longest', 0);
    sync('qIdx', 0);
    setTimeRemaining(GAME_DURATION_MS);
    setCurrentAnswers([]);
    currentAnswersRef.current = [];
    setFlashState('none');
    setFlashedButtonIndex(null);
    setRevealCorrect(false);
    setScorePopups([]);
    setScreenShake(false);
    setQuestionResults([]);
    questionResultsRef.current = [];
    setShowResults(false);
    setShareCopied(false);
    setSaveSuccess(false);
    setReadyCountdown(null);
    lastTwoCorrectPositionsRef.current = [];
    gameActiveRef.current = true;
    roundResolvedRef.current = false;
    if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (correctRevealTimerRef.current) { clearTimeout(correctRevealTimerRef.current); correctRevealTimerRef.current = null; }
    if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null; }
  }

  /* ─────────── Question advance ─────────── */

  const spawnRound = useCallback((idx: number) => {
    if (!gameActiveRef.current) return;
    const qs = questionsRef.current;
    if (qs.length === 0) return;
    const q = qs[idx % qs.length];
    const items: AnswerItem[] = [
      { text: q.correctAnswer, isCorrect: true },
      ...q.distractors.map(d => ({ text: d, isCorrect: false })),
    ];
    const { shuffled, correctPos } = shufflePreventingPattern(items, lastTwoCorrectPositionsRef.current);
    lastTwoCorrectPositionsRef.current = [...lastTwoCorrectPositionsRef.current.slice(-1), correctPos];
    setCurrentAnswers(shuffled);
    currentAnswersRef.current = shuffled;
    questionStartTimeRef.current = performance.now();
    setFlashState('none');
    setFlashedButtonIndex(null);
    setRevealCorrect(false);
    roundResolvedRef.current = false;
  }, []);

  const advanceQuestion = useCallback(() => {
    if (!gameActiveRef.current) return;
    const next = (currentQIdxRef.current + 1) % Math.max(1, questionsRef.current.length);
    sync('qIdx', next);
    spawnRound(next);
  }, [spawnRound, sync]);

  /* ─────────── Score popup spawn (matches Crater Blast pattern) ─────────── */

  const spawnPopup = useCallback((text: string, color: 'green' | 'red', x: number, y: number) => {
    const id = `pop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setScorePopups(p => [...p, { id, text, color, x, y }]);
    setTimeout(() => setScorePopups(p => p.filter(pp => pp.id !== id)), SCORE_POPUP_LIFE_MS);
  }, []);

  /* ─────────── Answer / Skip handlers ─────────── */

  const handleAnswerClick = useCallback((idx: number, btnEl: HTMLButtonElement | null) => {
    if (!gameActiveRef.current) return;
    if (roundResolvedRef.current) return;
    if (flashState !== 'none') return;
    roundResolvedRef.current = true;

    const reactionMs = performance.now() - questionStartTimeRef.current;
    const chosen = currentAnswersRef.current[idx];
    if (!chosen) return;

    setFlashedButtonIndex(idx);

    // Compute popup spawn point inside playAreaRef.
    let popupX = 0, popupY = 0;
    if (btnEl && playAreaRef.current) {
      const btnRect = btnEl.getBoundingClientRect();
      const areaRect = playAreaRef.current.getBoundingClientRect();
      popupX = btnRect.left - areaRect.left + btnRect.width / 2 - 16;
      popupY = btnRect.top - areaRect.top - 8;
    }

    // Append to results regardless of correctness.
    const q = questionsRef.current[currentQIdxRef.current];
    const result: QuestionResult = {
      question: q,
      chosenAnswer: chosen.text,
      isCorrect: chosen.isCorrect,
      reactionMs,
    };
    questionResultsRef.current = [...questionResultsRef.current, result];
    setQuestionResults(prev => [...prev, result]);

    if (chosen.isCorrect) {
      const points = reactionMs < SPEED_BONUS_THRESHOLD_MS ? 2 : 1;
      sync('score', scoreRef.current + points);
      sync('correct', correctCountRef.current + 1);
      const newStreak = streakRef.current + 1;
      sync('streak', newStreak);
      if (newStreak > longestStreakRef.current) sync('longest', newStreak);
      setFlashState('correct');
      spawnPopup(`+${points}`, 'green', popupX, popupY);
      vibrate(20);
      advanceTimerRef.current = window.setTimeout(advanceQuestion, CORRECT_FLASH_MS);
    } else {
      sync('score', scoreRef.current - 1);
      sync('wrong', wrongCountRef.current + 1);
      sync('streak', 0);
      setFlashState('wrong');
      setScreenShake(true);
      spawnPopup('-1', 'red', popupX, popupY);
      vibrate([30, 40, 30]);
      // After the red flash, surface the correct answer for a quick reveal
      // so the player learns from the miss.
      correctRevealTimerRef.current = window.setTimeout(() => {
        setScreenShake(false);
        setRevealCorrect(true);
      }, WRONG_FLASH_MS);
      advanceTimerRef.current = window.setTimeout(advanceQuestion, WRONG_FLASH_MS + WRONG_SHOW_CORRECT_MS);
    }
  }, [flashState, spawnPopup, sync, advanceQuestion]);

  const handleSkip = useCallback(() => {
    if (!gameActiveRef.current) return;
    if (roundResolvedRef.current) return;
    if (flashState !== 'none') return;
    roundResolvedRef.current = true;
    const q = questionsRef.current[currentQIdxRef.current];
    const result: QuestionResult = {
      question: q,
      chosenAnswer: null,
      isCorrect: false,
      reactionMs: performance.now() - questionStartTimeRef.current,
    };
    questionResultsRef.current = [...questionResultsRef.current, result];
    setQuestionResults(prev => [...prev, result]);
    sync('skip', skipCountRef.current + 1);
    sync('streak', 0);
    advanceQuestion();
  }, [flashState, sync, advanceQuestion]);

  /* ─────────── Game timer (rAF loop) ─────────── */

  const endGame = useCallback(() => {
    if (!gameActiveRef.current) return;
    gameActiveRef.current = false;
    if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (correctRevealTimerRef.current) { clearTimeout(correctRevealTimerRef.current); correctRevealTimerRef.current = null; }
    setFlashState('none');
    // 400ms freeze before transition so the last popup can finish.
    setTimeout(() => setGameState('gameover'), 400);
  }, []);

  // Last-3-second tick for haptics
  const lastHapticSecRef = useRef<number>(-1);

  useEffect(() => {
    if (gameState !== 'playing') return;
    gameStartTimeRef.current = performance.now();
    lastHapticSecRef.current = -1;
    const tick = () => {
      if (!gameActiveRef.current) return;
      const elapsed = performance.now() - gameStartTimeRef.current;
      const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
      setTimeRemaining(remaining);
      // Haptic on each of the last 3 seconds (only fires once per second).
      const remainingSec = Math.ceil(remaining / 1000);
      if (remainingSec <= 3 && remainingSec >= 1 && remainingSec !== lastHapticSecRef.current) {
        lastHapticSecRef.current = remainingSec;
        vibrate(30);
      }
      if (remaining <= 0) {
        endGame();
        return;
      }
      tickerRef.current = requestAnimationFrame(tick);
    };
    tickerRef.current = requestAnimationFrame(tick);
    return () => { if (tickerRef.current) cancelAnimationFrame(tickerRef.current); };
  }, [gameState, endGame]);

  /* ─────────── Start handlers ─────────── */

  const startWithBank = useCallback((bank: WordBlitzBankQuestion[], prefix: string, mode: InputMode) => {
    const cleaned = shuffle(bank).map((b, i) => bankToQuestion(b, i, prefix));
    questionsRef.current = cleaned;
    setQuestions(cleaned);
    setInputMode(mode);
    setIsPlayForFun(true);
    setLoadedFromSavedGame(false);
    resetGameState();
    setGameState('playing');
    // Kick off ready countdown phase before the first round.
    startReadyCountdown(() => spawnRound(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnRound]);

  const startReadyCountdown = useCallback((onDone: () => void) => {
    let n = READY_COUNTDOWN_SECONDS;
    setReadyCountdown(n);
    const step = () => {
      n -= 1;
      if (n <= 0) {
        setReadyCountdown(null);
        gameStartTimeRef.current = performance.now();
        onDone();
        return;
      }
      setReadyCountdown(n);
      readyTimerRef.current = window.setTimeout(step, 1000);
    };
    readyTimerRef.current = window.setTimeout(step, 1000);
  }, []);

  const handleStartGame = useCallback(async () => {
    setError(null);
    if (!inputText.trim()) {
      setError('Please paste some notes or enter a topic first.');
      return;
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!user || !token) {
      setIsLoading(true);
      setTimeout(() => onNavigate('signup'), 2200);
      return;
    }
    if (!canUseStudyTools) { onNavigate('pricing'); return; }
    if (inputMode === 'notes' && (wordCount < 20 || wordCount > maxWords)) {
      setError(wordCount < 20 ? 'Notes must be at least 20 words.' : `Notes exceed ${maxWords.toLocaleString()} words.`);
      return;
    }
    setIsLoading(true);
    setGameState('loading');
    try {
      const qs = await fetchQuestions();
      if (!qs || qs.length === 0) throw new Error('No questions generated. Try different notes.');
      questionsRef.current = qs;
      setQuestions(qs);
      setIsPlayForFun(false);
      resetGameState();
      setGameState('ready');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      setGameState('menu');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, user, canUseStudyTools, inputMode, wordCount, maxWords, onNavigate, fetchQuestions]);

  const handleStartPlayForFun = () => startWithBank(WORD_BLITZ_TRIVIA_BANK, 'trivia', 'play-for-fun');
  const handleStartVocab = () => startWithBank(WORD_BLITZ_VOCAB_BANK, 'vocab', 'vocabulary');
  const handleStartQuotes = () => startWithBank(WORD_BLITZ_QUOTES_BANK, 'quote', 'quotes');
  const handleStartMath = () => startWithBank(WORD_BLITZ_MENTAL_MATH_BANK, 'math', 'mental-math');

  const handleStartFromPacks = useCallback(() => {
    const all = studyPacks
      .filter(p => selectedPacks.has(p.id))
      .flatMap(p => p.questions);
    if (all.length === 0) return;
    const cleaned = shuffle(all).filter(q => q && typeof q.sentence === 'string' && q.sentence.includes('{{blank}}') && q.correctAnswer && Array.isArray(q.distractors));
    if (cleaned.length === 0) {
      setError('Selected packs have no Word Blitz questions.');
      return;
    }
    questionsRef.current = cleaned;
    setQuestions(cleaned);
    setIsPlayForFun(false);
    resetGameState();
    setGameState('ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyPacks, selectedPacks]);

  const handleStartFromReady = useCallback(() => {
    if (questionsRef.current.length === 0) return;
    resetGameState();
    setGameState('playing');
    startReadyCountdown(() => spawnRound(0));
  }, [spawnRound, startReadyCountdown]);

  const handlePlayAgain = useCallback(() => {
    if (questionsRef.current.length === 0) { setGameState('menu'); return; }
    resetGameState();
    setGameState('playing');
    startReadyCountdown(() => spawnRound(0));
  }, [spawnRound, startReadyCountdown]);

  const handleNewTopic = useCallback(() => {
    gameActiveRef.current = false;
    setGameState('menu');
    setInputText('');
    setQuestions([]);
    questionsRef.current = [];
    setLoadedFromSavedGame(false);
    setIsPlayForFun(false);
    setError(null);
  }, []);

  /* ─────────── Save / Share ─────────── */

  const handleSaveGame = useCallback(async () => {
    if (!user || isPlayForFun) return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/analysis/save-word-blitz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          questions: questionsRef.current,
          title: inputText.trim().slice(0, 80) || 'Word Blitz Game',
          inputType: inputMode,
          sourceText: inputText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save');
      setSaveSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to save game.');
    } finally {
      setIsSaving(false);
    }
  }, [user, isPlayForFun, inputText, inputMode]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/word-blitz` : '';
    const text = `⚡ Word Blitz — Score: ${scoreRef.current} | ${correctCountRef.current} right, ${wrongCountRef.current} wrong, ${skipCountRef.current} skipped`;
    const payload = url ? `${text}\n${url}` : text;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: 'Word Blitz', text, url });
        return;
      }
      await navigator.clipboard.writeText(payload);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* user cancelled or no clipboard */ }
  }, []);

  /* ═══════════════════ RENDER HELPERS ═══════════════════ */

  /** Render a sentence with the {{blank}} replaced by either a styled
   *  empty pill or the chosen/correct word filled in (during flash). */
  const renderSentence = (sentence: string, fill: string | null = null, fillColor: 'green' | 'red' | 'neutral' = 'neutral') => {
    const parts = sentence.split('{{blank}}');
    const blank = fill ? (
      <span
        className={`inline-block px-2 py-0.5 mx-1 rounded-md align-middle font-extrabold ${
          fillColor === 'green' ? 'bg-[#EAFFD6] text-[#46A302] border-2 border-[#58CC02]/50'
          : fillColor === 'red' ? 'bg-[#FFE8E8] text-[#FF4B4B] border-2 border-[#FF4B4B]/50'
          : 'bg-stone-200 text-stone-700 border-2 border-stone-300'
        }`}
      >
        {fill}
      </span>
    ) : (
      <span className="inline-block min-w-[80px] mx-1 px-2 py-0.5 bg-stone-200 dark:bg-stone-700 rounded-md align-middle border-2 border-stone-300 dark:border-stone-600">
        &nbsp;
      </span>
    );
    return (
      <p className="text-xl sm:text-2xl leading-relaxed text-stone-900 dark:text-stone-100 font-semibold">
        {parts[0]}{blank}{parts[1] ?? ''}
      </p>
    );
  };

  /* ═══════════════════ RENDER ═══════════════════ */

  const renderMenu = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)] overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div className="flex-shrink-0">
            <img src="/mascot-juggling.webp" alt="WriteScholar mascot" className="w-[100px] h-[100px] object-contain rounded-2xl" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
              Word Blitz
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-md leading-relaxed">
              60 seconds. Read fast. Tap faster. Fill-in-the-blank speedrun powered by your notes — or our trivia banks.
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap gap-2">
              {(['notes', 'my-packs', 'play-for-fun'] as const).map(mode => {
                const isLocked = (mode === 'notes' && !canUseStudyTools) || (mode === 'my-packs' && !user);
                const labels: Record<string, string> = { notes: '📄 Study Notes', 'my-packs': '📦 My Packs', 'play-for-fun': '🎮 Play for Fun' };
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (isLocked) { onNavigate(user ? 'pricing' : 'signup'); return; }
                      setInputMode(mode);
                    }}
                    className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-1 ${
                      inputMode === mode
                        ? 'bg-[#FF9600] text-white border-2 border-b-4 border-[#D97F00]'
                        : isLocked
                          ? 'bg-white text-stone-400 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 hover:text-stone-600'
                          : 'bg-white text-stone-500 border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 hover:text-stone-700'
                    }`}
                    title={isLocked ? (user ? 'Upgrade to Pro to use Study Notes' : 'Sign up and upgrade to Pro to use Study Notes') : undefined}
                  >
                    {isLocked && <span className="text-xs">🔒</span>}
                    {labels[mode]}
                  </button>
                );
              })}
            </div>

            {inputMode === 'play-for-fun' || inputMode === 'mental-math' || inputMode === 'vocabulary' || inputMode === 'quotes' ? (
              <div>
                <p className="text-stone-600 text-sm mb-4">Pick a game mode. No setup needed, just play!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleStartPlayForFun}
                    className="p-4 rounded-xl text-left bg-white border-2 border-b-4 border-stone-300 hover:border-[#A560E8] active:border-b-2 active:translate-y-0.5 transition-all duration-150 group"
                  >
                    <span className="text-2xl mb-2 block">📚</span>
                    <span className="font-extrabold text-stone-800 uppercase tracking-wide text-sm group-hover:text-[#A560E8]">Trivia</span>
                    <span className="text-xs text-stone-500 font-bold block mt-1">Cloze sentences across many topics</span>
                  </button>
                  <button
                    onClick={handleStartVocab}
                    className="p-4 rounded-xl text-left bg-white border-2 border-b-4 border-stone-300 hover:border-[#1CB0F6] active:border-b-2 active:translate-y-0.5 transition-all duration-150 group"
                  >
                    <span className="text-2xl mb-2 block">📖</span>
                    <span className="font-extrabold text-stone-800 uppercase tracking-wide text-sm group-hover:text-[#1CB0F6]">Vocabulary</span>
                    <span className="text-xs text-stone-500 font-bold block mt-1">Pick the right word for the sentence</span>
                  </button>
                  <button
                    onClick={handleStartQuotes}
                    className="p-4 rounded-xl text-left bg-white border-2 border-b-4 border-stone-300 hover:border-[#FF4B4B] active:border-b-2 active:translate-y-0.5 transition-all duration-150 group"
                  >
                    <span className="text-2xl mb-2 block">💬</span>
                    <span className="font-extrabold text-stone-800 uppercase tracking-wide text-sm group-hover:text-[#FF4B4B]">Famous Quotes</span>
                    <span className="text-xs text-stone-500 font-bold block mt-1">Finish the line — Shakespeare, MLK, more</span>
                  </button>
                  <button
                    onClick={handleStartMath}
                    className="p-4 rounded-xl text-left bg-white border-2 border-b-4 border-stone-300 hover:border-[#58CC02] active:border-b-2 active:translate-y-0.5 transition-all duration-150 group"
                  >
                    <span className="text-2xl mb-2 block">🔢</span>
                    <span className="font-extrabold text-stone-800 uppercase tracking-wide text-sm group-hover:text-[#58CC02]">Mental Math</span>
                    <span className="text-xs text-stone-500 font-bold block mt-1">Add, multiply, percentages, fractions</span>
                  </button>
                </div>
              </div>
            ) : inputMode === 'my-packs' ? (
              <div>
                {packsLoading ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-8 h-8 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: '#FF960020', borderTopColor: '#FF9600' }} />
                    <p className="text-sm font-bold text-stone-400">Loading study packs…</p>
                  </div>
                ) : studyPacks.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="text-3xl mb-3 block">📦</span>
                    <p className="font-extrabold text-stone-700 mb-1">No saved Word Blitz games yet</p>
                    <p className="text-sm text-stone-500 mb-4">Create a study pack from your notes first!</p>
                    <button
                      onClick={() => { localStorage.setItem('writescholar_dashboard_tab', 'study_pack'); onNavigate('dashboard'); }}
                      className="px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      Create Study Pack
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-stone-600">Select packs to play</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedPacks(new Set(studyPacks.map(p => p.id)))} className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide rounded-lg border-2 border-stone-200 text-stone-500 hover:bg-stone-50 active:translate-y-px transition-all">All</button>
                        <button onClick={() => setSelectedPacks(new Set())} className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide rounded-lg border-2 border-stone-200 text-stone-500 hover:bg-stone-50 active:translate-y-px transition-all">None</button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {studyPacks.map(pack => {
                        const checked = selectedPacks.has(pack.id);
                        return (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => setSelectedPacks(prev => { const next = new Set(prev); if (next.has(pack.id)) next.delete(pack.id); else next.add(pack.id); return next; })}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${checked ? 'bg-[#FFF4E0] border-2 border-[#FF9600]/30' : 'bg-stone-50 border-2 border-stone-200 opacity-60 hover:opacity-80'}`}
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#FF9600] border-[#D97F00] text-white' : 'border-stone-300 bg-white'}`}>
                              {checked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-stone-800 truncate">{pack.title}</p>
                              <p className="text-[11px] text-stone-400 font-bold mt-0.5">{pack.questions.length} question{pack.questions.length !== 1 ? 's' : ''}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleStartFromPacks}
                      disabled={selectedPacks.size === 0}
                      className="w-full mt-4 py-3.5 rounded-xl text-white font-extrabold text-sm uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#FF9600] border-[#D97F00]"
                    >
                      ⚡ Start Word Blitz · {studyPacks.filter(p => selectedPacks.has(p.id)).reduce((s, p) => s + p.questions.length, 0)} questions
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2">Paste your revision notes</label>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Paste your revision notes here (min 20 words)..."
                  rows={5}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 bg-stone-50/80 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9600]/20 focus:border-[#FF9600] focus:bg-white transition-all text-sm resize-none"
                />
                <p className={`mt-2 text-xs ${wordCount < 20 ? 'text-amber-600' : wordCount > maxWords ? 'text-red-600' : 'text-stone-400'}`}>
                  {wordCount.toLocaleString()} words / {maxWords.toLocaleString()} max
                  {wordCount < 20 && wordCount > 0 && ' (min 20)'}
                </p>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 text-[#FF4B4B] font-bold text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {inputMode === 'notes' && (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={isLoading || !inputText.trim() || (inputMode === 'notes' && (wordCount < 20 || wordCount > maxWords))}
                  className={`w-full py-4 rounded-xl text-white font-extrabold text-base uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                    inputText.trim() ? 'bg-[#FF9600] border-[#D97F00]' : 'bg-stone-300 border-stone-400 dark:bg-stone-600 dark:border-stone-700'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <>⚡ Start Word Blitz</>
                  )}
                </button>

                {!user && (
                  <p className="text-center text-sm text-stone-500">
                    <button onClick={() => onNavigate('login')} className="text-[#1CB0F6] font-bold hover:underline">Log in</button> to generate AI questions
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* How to play */}
        <div className="mt-8 bg-white dark:bg-stone-900 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 p-6">
          <h2 className="font-extrabold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF4E0] text-[#FF9600] flex items-center justify-center text-sm">?</span>
            How to Play
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { step: 1, text: 'Read the sentence — one word is missing', icon: '📖' },
              { step: 2, text: 'Tap the right word from the 4 options', icon: '👆' },
              { step: 3, text: 'Under 2 seconds = +2 (speed bonus!)', icon: '⚡', accent: 'green' as const },
              { step: 4, text: 'Wrong = −1 · Skip = 0 · Beat the clock', icon: '⏱️', accent: 'red' as const },
            ].map(({ step, text, icon, accent }) => (
              <div key={step} className={`flex items-center gap-3 p-3 rounded-xl ${accent === 'green' ? 'bg-[#EAFFD6] border-2 border-[#58CC02]/30' : accent === 'red' ? 'bg-[#FFE8E8] border-2 border-[#FF4B4B]/30' : 'bg-stone-50 border-2 border-stone-200'}`}>
                <span className="w-9 h-9 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center text-base shrink-0">{icon}</span>
                <span className="text-sm text-stone-700 font-bold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['60-Second Speedrun', 'AI-Powered', 'Speed Bonus', 'Mobile Friendly'].map((badge, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-white text-xs font-bold text-stone-600 border-2 border-b-4 border-stone-200">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="relative flex-1 flex items-center justify-center px-4 py-20 overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />
      <div className="relative text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF9600] border-2 border-b-4 border-[#D97F00] mb-5">
          <span className="text-3xl animate-pulse">⚡</span>
        </div>
        <h2 className="text-lg font-bold text-stone-800 mb-1">Generating questions…</h2>
        <p className="text-stone-500 text-sm">prepping your speedrun</p>
        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#FF9600]" style={{ animation: `wbPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderReady = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)] flex items-center justify-center px-4 overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />
      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 border-2 border-b-4 border-[#D97F00]" style={{ background: '#FF9600' }}>
          <span className="text-4xl">⚡</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">Word Blitz</h1>
        <p className="text-stone-600 text-sm mb-1 truncate max-w-full px-4" title={inputText}>
          {inputText.trim() || 'Saved game'}
        </p>
        <p className="text-stone-500 text-xs mb-8">{questions.length} questions ready · 60-second clock</p>
        <button
          onClick={handleStartFromReady}
          className="inline-block px-12 py-3.5 rounded-xl text-white font-extrabold text-base uppercase tracking-wide bg-[#FF9600] border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all duration-150"
        >
          ⚡ Start Word Blitz
        </button>
        <button
          onClick={() => { setGameState('menu'); setInputText(''); setQuestions([]); questionsRef.current = []; setLoadedFromSavedGame(false); }}
          className="mt-6 block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold uppercase tracking-wide border-2 border-b-4 border-stone-300 dark:border-stone-500 active:border-b-2 active:translate-y-0.5 transition-all duration-150"
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderGame = () => {
    const currentQ = questionsRef.current[currentQIdxRef.current];
    if (!currentQ) return null;
    const seconds = Math.ceil(timeRemaining / 1000);
    const isCriticalTime = seconds <= 10;
    const isNegative = score < 0;
    const fillForBlank: { fill: string | null; color: 'green' | 'red' | 'neutral' } = (() => {
      if (revealCorrect) return { fill: currentQ.correctAnswer, color: 'green' };
      if (flashState === 'correct' && flashedButtonIndex !== null) return { fill: currentAnswers[flashedButtonIndex]?.text || null, color: 'green' };
      if (flashState === 'wrong' && flashedButtonIndex !== null) return { fill: currentAnswers[flashedButtonIndex]?.text || null, color: 'red' };
      return { fill: null, color: 'neutral' };
    })();

    return (
      <div className="relative flex-1 flex flex-col overflow-hidden" style={{ overscrollBehavior: 'contain' }}>
        {/* HUD bar */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between gap-4 border-b-2 border-slate-700">
          <button
            onClick={() => {
              gameActiveRef.current = false;
              if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true') {
                sessionStorage.removeItem('writescholar_return_to_study_pack_viewer');
                onNavigate('study-pack-viewer');
              } else {
                setGameState('menu');
              }
            }}
            className="text-white/70 hover:text-white p-2 -ml-2"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-2xl font-black tabular-nums leading-none ${isCriticalTime ? 'text-[#FF4B4B] animate-pulse' : 'text-white'}`}>
                0:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">Time</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-black tabular-nums leading-none ${isNegative ? 'text-[#FF4B4B]' : 'text-[#58CC02]'}`}>
                {score}
              </div>
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">Score</div>
            </div>
            <div className="hidden sm:block text-center">
              <div className="text-lg font-black tabular-nums leading-none text-[#FF9600]">{streak}</div>
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">Streak</div>
            </div>
          </div>
          <div className="w-9" />
        </div>

        {/* Timer bar (visual) */}
        <div className="h-1.5 bg-slate-800 relative">
          <div
            className={`h-full absolute left-0 top-0 transition-all duration-100 ${isCriticalTime ? 'bg-[#FF4B4B]' : 'bg-[#FF9600]'}`}
            style={{ width: `${(timeRemaining / GAME_DURATION_MS) * 100}%` }}
          />
        </div>

        {/* Play area */}
        <div
          ref={playAreaRef}
          className={`relative flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10 select-none ${screenShake ? 'wb-shake' : ''}`}
          style={{ background: 'radial-gradient(ellipse at center, #fff8e1 0%, #ffeec1 60%, #fde0a0 100%)', userSelect: 'none' }}
        >
          {/* Ready countdown overlay */}
          {readyCountdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
              <div key={readyCountdown} className="text-white font-black text-[120px] sm:text-[160px] tabular-nums" style={{ animation: 'wbPop 0.85s ease-out' }}>
                {readyCountdown === 0 ? 'GO!' : readyCountdown}
              </div>
            </div>
          )}

          {/* Sentence */}
          <div className="w-full max-w-xl mx-auto text-center mb-8 sm:mb-10">
            {renderSentence(currentQ.sentence, fillForBlank.fill, fillForBlank.color)}
          </div>

          {/* Answer grid */}
          <div className="w-full max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentAnswers.map((ans, idx) => {
              const isFlashed = flashedButtonIndex === idx;
              const isCorrectFlash = isFlashed && flashState === 'correct';
              const isWrongFlash = isFlashed && flashState === 'wrong';
              const isRevealedCorrect = revealCorrect && ans.isCorrect;
              const variantClass =
                isCorrectFlash || isRevealedCorrect ? 'bg-[#58CC02] text-white border-[#46A302]'
                : isWrongFlash ? 'bg-[#FF4B4B] text-white border-[#E04343]'
                : 'bg-white text-stone-800 border-stone-300 hover:border-[#FF9600] hover:-translate-y-0.5';
              return (
                <button
                  key={`${currentQIdxRef.current}-${idx}`}
                  onClick={(e) => handleAnswerClick(idx, e.currentTarget)}
                  disabled={flashState !== 'none'}
                  className={`min-h-[72px] sm:min-h-[80px] px-5 py-4 rounded-2xl text-base sm:text-lg font-extrabold border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all duration-150 shadow-sm disabled:cursor-default ${variantClass}`}
                  style={{ userSelect: 'none' }}
                >
                  {ans.text}
                </button>
              );
            })}
          </div>

          {/* Skip link */}
          <div className="mt-6 sm:mt-8">
            <button
              onClick={handleSkip}
              disabled={flashState !== 'none'}
              className="text-stone-400 hover:text-stone-600 italic text-sm font-bold underline-offset-4 hover:underline disabled:opacity-50"
            >
              skip →
            </button>
          </div>

          {/* Score popups */}
          {scorePopups.map(pop => (
            <div
              key={pop.id}
              className="absolute z-40 pointer-events-none font-black text-2xl tabular-nums"
              style={{
                left: pop.x,
                top: pop.y,
                color: pop.color === 'green' ? '#46A302' : '#E04343',
                animation: `wbScoreFloat ${SCORE_POPUP_LIFE_MS}ms ease-out forwards`,
                textShadow: '0 2px 6px rgba(255,255,255,0.6)',
              }}
            >
              {pop.text}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes wbScoreFloat {
            0%   { opacity: 0; transform: translateY(0) scale(0.8); }
            20%  { opacity: 1; transform: translateY(-6px) scale(1.05); }
            100% { opacity: 0; transform: translateY(-44px) scale(1); }
          }
          @keyframes wbPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50%      { transform: scale(1.4); opacity: 1; }
          }
          @keyframes wbPop {
            0%   { transform: scale(0.4); opacity: 0; }
            45%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes wbShakeKf {
            0%, 100% { transform: translateX(0); }
            25%      { transform: translateX(-6px); }
            50%      { transform: translateX(6px); }
            75%      { transform: translateX(-3px); }
          }
          .wb-shake { animation: wbShakeKf 200ms ease-in-out; }
        `}</style>
      </div>
    );
  };

  const renderGameOver = () => {
    if (showResults) {
      return (
        <div className="flex-1 flex flex-col px-4 py-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-stone-900">Game Review</h2>
            <button onClick={() => setShowResults(false)} className="px-4 py-2 rounded-xl bg-white text-stone-700 font-bold border-2 border-b-4 border-stone-300 active:border-b-2 active:translate-y-0.5 transition-colors">
              Back to Score
            </button>
          </div>
          <div className="bg-white rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden mb-8">
            <div className="divide-y divide-stone-100">
              {questionResults.map((res, idx) => (
                <div key={idx} className={`p-4 sm:p-5 flex gap-4 ${res.chosenAnswer === null ? 'bg-stone-50' : res.isCorrect ? 'bg-[#EAFFD6]/30' : 'bg-[#FFE8E8]/30'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${res.chosenAnswer === null ? 'bg-stone-200 text-stone-600' : res.isCorrect ? 'bg-[#EAFFD6] text-[#58CC02]' : 'bg-[#FFE8E8] text-[#FF4B4B]'}`}>
                    {res.chosenAnswer === null ? '–' : res.isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-900 mb-2">
                      {res.question.sentence.replace('{{blank}}', '_____')}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="px-3 py-2 rounded-lg text-sm border-2 bg-[#EAFFD6] border-[#58CC02]/30 text-[#46A302] font-bold">
                        ✓ {res.question.correctAnswer}
                      </div>
                      {res.chosenAnswer && !res.isCorrect && (
                        <div className="px-3 py-2 rounded-lg text-sm border-2 bg-[#FFE8E8] border-[#FF4B4B]/30 text-[#FF4B4B] font-bold">
                          ✗ {res.chosenAnswer}
                        </div>
                      )}
                      {res.chosenAnswer === null && (
                        <div className="px-3 py-2 rounded-lg text-sm border-2 bg-stone-100 border-stone-200 text-stone-500 font-bold">
                          – Skipped
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const totalAttempted = correctCount + wrongCount;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const reactionTimes = questionResults.filter(r => r.chosenAnswer !== null && r.reactionMs != null).map(r => r.reactionMs!) ;
    const avgReactionMs = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;
    const isNegative = score < 0;

    return (
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        <WriteScholarEditorialBackgroundLayers position="absolute" />
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="px-6 py-8 text-center" style={{ background: '#1e293b' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/20 mb-3">
                <span className="text-3xl">⚡</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Time's up!</h2>
              <div className={`text-4xl font-black mt-2 tabular-nums ${isNegative ? 'text-[#FF4B4B]' : score === 0 ? 'text-white/60' : 'text-[#58CC02]'}`}>
                {score}
              </div>
              <p className="text-white/60 text-sm mt-1">{score === 1 || score === -1 ? 'point' : 'points'}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: correctCount, label: 'Correct', color: 'text-green-600' },
                  { val: wrongCount, label: 'Wrong', color: 'text-red-600' },
                  { val: `${accuracy}%`, label: 'Accuracy', color: 'text-[#A560E8]' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-stone-50 border-2 border-b-4 border-stone-200">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: longestStreak, label: 'Best Streak', color: 'text-[#FF9600]' },
                  { val: skipCount, label: 'Skipped', color: 'text-stone-500' },
                  { val: avgReactionMs > 0 ? `${(avgReactionMs / 1000).toFixed(1)}s` : '—', label: 'Avg Speed', color: 'text-[#1CB0F6]' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-stone-50 border-2 border-b-4 border-stone-200">
                    <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex gap-3">
                  <button onClick={handlePlayAgain}
                    className="flex-1 py-3.5 rounded-xl bg-[#FF9600] text-white font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all duration-150">
                    ⚡ Play Again
                  </button>
                  <button onClick={handleNewTopic}
                    className="flex-1 py-3.5 rounded-xl bg-white text-stone-700 font-bold uppercase tracking-wide border-2 border-b-4 border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all duration-150">
                    {isPlayForFun ? 'Back to Menu' : 'New Topic'}
                  </button>
                </div>
                <button onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-white text-stone-700 font-bold border-2 border-b-4 border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2">
                  {shareCopied ? '✓ Copied!' : '🔗 Share Score'}
                </button>
                {questionResults.length > 0 && (
                  <button onClick={() => { setShowResults(true); window.scrollTo(0, 0); }}
                    className="w-full py-3 rounded-xl bg-white text-stone-700 font-bold border-2 border-b-4 border-stone-300 active:border-b-2 active:translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Review Questions
                  </button>
                )}
                {user && !isPlayForFun && (
                  <>
                    {loadedFromSavedGame ? (
                      <div className="w-full py-3 rounded-xl font-bold border-2 border-[#58CC02]/30 flex items-center justify-center gap-2 bg-[#EAFFD6] text-[#46A302]">
                        ✓ Already saved to Saved Materials — replay anytime
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveGame}
                        disabled={isSaving || saveSuccess}
                        className="w-full py-3 rounded-xl font-bold transition-all border-2 border-b-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                          background: saveSuccess ? '#58CC02' : 'white',
                          color: saveSuccess ? 'white' : '#64748b',
                          borderColor: saveSuccess ? '#46A302' : '#e2e8f0',
                        }}
                      >
                        {isSaving ? (
                          <span className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                        ) : saveSuccess ? (
                          '✓ Saved to Saved Materials'
                        ) : (
                          '💾 Save Game to Replay Later'
                        )}
                      </button>
                    )}
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════ FRAME ═══════════════════ */

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      {!showMinimalUI && <Header onNavigate={onNavigate} user={user} onLogout={onLogout || (() => {})} currentPage="word-blitz" />}
      {showMinimalUI && (gameState === 'menu' || gameState === 'loading' || gameState === 'ready' || gameState === 'gameover') && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur border-b border-stone-200">
          <button
            onClick={() => {
              if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true') {
                sessionStorage.removeItem('writescholar_return_to_study_pack_viewer');
                onNavigate('study-pack-viewer');
              } else {
                onNavigate('dashboard');
              }
            }}
            className="p-2 -ml-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-bold text-stone-700">Word Blitz</span>
          <div className="w-9" />
        </div>
      )}
      {gameState === 'menu' && renderMenu()}
      {gameState === 'loading' && renderLoading()}
      {gameState === 'ready' && renderReady()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
      {!showMinimalUI && gameState !== 'playing' && <Footer onNavigate={onNavigate} />}
    </div>
  );
};

export default WordBlitzPage;
