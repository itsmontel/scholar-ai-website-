import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { WORD_TOWER_WORD_BANK, WordTowerQuestion as BankQuestion } from '../../../data/wordTowerWordBank';
import { WORD_TOWER_MENTAL_MATH_BANK } from '../../../data/wordTowerMentalMathBank';

/* ────────────────────── Types ────────────────────── */

interface WordTowerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface TowerItem {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  prompt: string;
  items: TowerItem[];
}

interface FallingBlock {
  id: string;
  text: string;
  isCorrect: boolean;
  xPercent: number;
  fallDurationMs: number;
  spawnTime: number;
  status: 'falling' | 'caught' | 'dodged' | 'missed' | 'wrongCaught';
}

interface TowerBlock {
  id: string;
  text: string;
}

interface ScorePopup {
  id: string;
  points: number;
  x: number;
  y: number;
  color: string;
}

interface CollapsingBlock {
  id: string;
  text: string;
  yOffset: number;
  fx: number;
  fr: number;
  delayMs: number;
}

type GameState = 'menu' | 'loading' | 'ready' | 'playing' | 'collapsing' | 'gameover';
type InputMode = 'topic' | 'notes' | 'play-for-fun' | 'mental-math';

/* ────────────────────── Config ────────────────────── */

const MAX_MISTAKES = 7;
const BASE_FALL_DURATION = 7800;
const MIN_FALL_DURATION = 4600;
const SPEED_DECREASE_PER_3 = 115;
const PADDLE_WIDTH_PERCENT = 26;
const PADDLE_HEIGHT = 16;
const BLOCK_WIDTH = 102;
const BLOCK_HEIGHT = 46;
/** Gap between spawning each falling option in a round — higher = easier pacing. */
const SPAWN_INTERVAL_MS = 3150;
/** Pause after resolving all blocks before the next question spawns — higher = more breathing room. */
const NEXT_ROUND_DELAY_MS = 1700;
const BASE_SCORE = 100;
const SPEED_BONUS_TOP_HALF = 50;
const STREAK_BONUS_PER = 25;
const VISIBLE_TOWER_CAP = 8;
const PADDLE_BOTTOM_PX = 18;
const TOWER_BOTTOM_PX = 18 + PADDLE_HEIGHT + 12;
const LANE_CENTERS = [16, 38, 62, 84];

/* ────────────────────── Helpers ────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function vibrate(pattern: number | number[]) {
  try { (navigator as any).vibrate?.(pattern as any); } catch {}
}

function bankToQuestions(bank: BankQuestion[], prefix: string): Question[] {
  return bank.map((q, i) => ({
    id: `${prefix}-${i}`,
    prompt: q.prompt,
    items: q.items.map(it => ({ ...it })),
  }));
}

function glowColor(mistakes: number): string {
  if (mistakes <= 2) return 'transparent';
  if (mistakes <= 4) return 'rgba(250, 204, 21, 0.55)';
  if (mistakes <= 6) return 'rgba(249, 115, 22, 0.7)';
  return 'rgba(239, 68, 68, 0.9)';
}

/* ────────────────────── Component ────────────────────── */

const WordTowerPage = ({ onNavigate, user, onLogout }: WordTowerPageProps) => {
  const userPlan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
  const canUseStudyTools = user && (userPlan === 'pro' || userPlan === 'premium');
  const maxWords = canUseStudyTools ? 10000 : 5000;

  const [gameState, setGameState] = useState<GameState>('menu');
  const [inputMode, setInputMode] = useState<InputMode>('notes');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([]);
  const [towerBlocks, setTowerBlocks] = useState<TowerBlock[]>([]);
  const [collapsingBlocks, setCollapsingBlocks] = useState<CollapsingBlock[]>([]);

  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const [paddleXPercent, setPaddleXPercent] = useState(50);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [screenEffect, setScreenEffect] = useState<'' | 'shake' | 'badFlash'>('');
  const [paddleFlash, setPaddleFlash] = useState<'good' | 'bad' | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedFromSavedGame, setLoadedFromSavedGame] = useState(false);
  const [isPlayForFun, setIsPlayForFun] = useState(false);
  const [showMinimalUI, setShowMinimalUI] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const wordCount = inputMode === 'notes' ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;

  /* refs that the game loop reads */
  const mistakesRef = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const questionsAnsweredRef = useRef(0);
  const towerHeightLogicalRef = useRef(0);
  const currentQIdxRef = useRef(0);
  const fallDurationRef = useRef(BASE_FALL_DURATION);
  const questionsRef = useRef<Question[]>([]);
  const fallingBlocksRef = useRef<FallingBlock[]>([]);
  const paddleXRef = useRef(50);
  const gameActiveRef = useRef(false);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const towerContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const wobblePhaseRef = useRef(0);
  const lastFrameRef = useRef<number>(0);
  const spawnTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksThisRoundRef = useRef(0);
  const blocksResolvedThisRoundRef = useRef(0);
  const towerBlocksRef = useRef<TowerBlock[]>([]);
  const gameStateRef = useRef<GameState>('menu');

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { towerBlocksRef.current = towerBlocks; }, [towerBlocks]);

  /* ── Effects ── */

  useEffect(() => {
    const minimal = localStorage.getItem('writescholar_minimal_ui') === 'true';
    if (minimal) {
      localStorage.removeItem('writescholar_minimal_ui');
      setShowMinimalUI(true);
    }
  }, []);

  useEffect(() => {
    document.title = 'Word Tower | WriteScholar';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Word Tower — the AI-powered stacking study game. Build the tallest tower by catching correct answers. Don\'t let the tower fall!');
  }, []);

  useEffect(() => {
    if (!user && gameState === 'menu') setInputMode('play-for-fun');
  }, [user, gameState]);

  useEffect(() => {
    const saved = localStorage.getItem('savedWordTower');
    if (saved && gameState === 'menu') {
      try {
        const tool = JSON.parse(saved);
        const qs = tool.questions?.questions ?? (Array.isArray(tool.questions) ? tool.questions : []);
        if (qs.length > 0) {
          localStorage.removeItem('savedWordTower');
          questionsRef.current = shuffle(qs);
          setQuestions([...questionsRef.current]);
          setInputText(tool.questions?.sourceText || tool.title || '');
          setInputMode((tool.questions?.inputType || 'topic') as InputMode);
          setLoadedFromSavedGame(true);
          resetGameState();
          setGameState('ready');
        }
      } catch {
        localStorage.removeItem('savedWordTower');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      spawnTimersRef.current.forEach(t => clearTimeout(t));
      spawnTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (gameState === 'loading' || gameState === 'ready' || gameState === 'playing') {
      const scrollToTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      requestAnimationFrame(scrollToTop);
      const t = setTimeout(scrollToTop, 50);
      return () => clearTimeout(t);
    }
  }, [gameState]);

  /* ── State sync helper ── */
  const sync = useCallback((field: string, v: number) => {
    switch (field) {
      case 'mistakes': mistakesRef.current = v; setMistakes(v); break;
      case 'score': scoreRef.current = v; setScore(v); break;
      case 'streak': streakRef.current = v; setStreak(v); break;
      case 'longest': longestStreakRef.current = v; setLongestStreak(v); break;
      case 'qIdx': currentQIdxRef.current = v; setCurrentQIdx(v); break;
      case 'answered': questionsAnsweredRef.current = v; setQuestionsAnswered(v); break;
      case 'fall': fallDurationRef.current = v; break;
    }
  }, []);

  /* ── API ── */
  const fetchQuestions = async (): Promise<Question[] | null> => {
    const token = localStorage.getItem('authToken');
    if (!token) { setError('Please log in to generate AI questions.'); return null; }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/analysis/generate-tower-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ inputType: inputMode, content: inputText.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate questions');
    return data.data.questions as Question[];
  };

  /* ── Round flow ── */
  const advanceQuestion = useCallback(() => {
    if (!gameActiveRef.current) return;
    const next = (currentQIdxRef.current + 1) % questionsRef.current.length;
    if (next === 0) {
      questionsRef.current = shuffle(questionsRef.current);
      setQuestions([...questionsRef.current]);
    }
    sync('qIdx', next);
    sync('answered', questionsAnsweredRef.current + 1);
    if (questionsAnsweredRef.current % 3 === 0) {
      sync('fall', Math.max(MIN_FALL_DURATION, fallDurationRef.current - SPEED_DECREASE_PER_3));
    }
    advanceTimerRef.current = setTimeout(() => spawnRound(next), NEXT_ROUND_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync]);

  const spawnRound = useCallback((qIdx: number) => {
    if (!gameActiveRef.current) return;
    const qs = questionsRef.current;
    if (qs.length === 0) return;
    const q = qs[qIdx % qs.length];

    const items = shuffle(q.items);
    blocksThisRoundRef.current = items.length;
    blocksResolvedThisRoundRef.current = 0;

    const lanes = shuffle([0, 1, 2, 3]);
    items.forEach((item, i) => {
      const t = setTimeout(() => {
        if (!gameActiveRef.current) return;
        const lane = LANE_CENTERS[lanes[i % lanes.length]];
        const xPercent = clamp(lane + (Math.random() * 6 - 3), 8, 92);
        const block: FallingBlock = {
          id: `b-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          text: item.text,
          isCorrect: item.isCorrect,
          xPercent,
          fallDurationMs: fallDurationRef.current,
          spawnTime: performance.now(),
          status: 'falling',
        };
        fallingBlocksRef.current = [...fallingBlocksRef.current, block];
        setFallingBlocks([...fallingBlocksRef.current]);
      }, i * SPAWN_INTERVAL_MS);
      spawnTimersRef.current.push(t);
    });
  }, []);

  /* ── Mistake / collapse ── */
  const triggerCollapse = useCallback(() => {
    if (gameStateRef.current === 'collapsing' || gameStateRef.current === 'gameover') return;
    gameActiveRef.current = false;
    setGameState('collapsing');
    spawnTimersRef.current.forEach(t => clearTimeout(t));
    spawnTimersRef.current = [];
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setFallingBlocks([]);
    fallingBlocksRef.current = [];

    const blocks = towerBlocksRef.current.slice(-VISIBLE_TOWER_CAP);
    const collapsing: CollapsingBlock[] = blocks.map((b, i) => ({
      id: b.id,
      text: b.text,
      yOffset: -(blocks.length - 1 - i) * BLOCK_HEIGHT,
      fx: (Math.random() * 200 - 100),
      fr: (Math.random() * 180 - 90),
      delayMs: i * 60,
    }));
    setCollapsingBlocks(collapsing);

    setScreenEffect('shake');
    setTimeout(() => setScreenEffect(''), 600);
    vibrate([100, 50, 200]);

    setTimeout(() => {
      setGameState('gameover');
      setCollapsingBlocks([]);
    }, 1600);
  }, []);

  const addMistake = useCallback(() => {
    const nm = mistakesRef.current + 1;
    sync('mistakes', nm);
    sync('streak', 0);
    setScreenEffect('shake');
    setTimeout(() => setScreenEffect('badFlash'), 80);
    setTimeout(() => setScreenEffect(''), 700);
    vibrate(50);
    if (nm >= MAX_MISTAKES) {
      setTimeout(() => triggerCollapse(), 100);
    }
  }, [sync, triggerCollapse]);

  const handleCorrectAction = useCallback((block: FallingBlock, hitYRatio: number, gainBlock: boolean, popupX: number, popupY: number) => {
    const ns = streakRef.current + 1;
    let pts = BASE_SCORE;
    if (gainBlock && hitYRatio < 0.5) pts += SPEED_BONUS_TOP_HALF;
    pts += ns * STREAK_BONUS_PER;

    sync('score', scoreRef.current + pts);
    sync('streak', ns);
    if (ns > longestStreakRef.current) sync('longest', ns);

    if (gainBlock) {
      towerHeightLogicalRef.current += 1;
      setTowerBlocks(prev => [...prev, { id: block.id, text: block.text }]);
      setPaddleFlash('good');
      setTimeout(() => setPaddleFlash(null), 250);
    }

    const pid = `pop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setScorePopups(p => [...p, { id: pid, points: pts, x: popupX, y: popupY, color: '#10b981' }]);
    setTimeout(() => setScorePopups(p => p.filter(pp => pp.id !== pid)), 1100);
  }, [sync]);

  /* ── Block resolution ── */
  const resolveBlock = useCallback((block: FallingBlock, kind: 'caught' | 'missed', popupX: number, popupY: number, hitYRatio: number) => {
    if (!gameActiveRef.current) return;
    if (block.status !== 'falling') return;

    block.status = (kind === 'caught' && !block.isCorrect)
      ? 'wrongCaught'
      : (kind === 'caught' ? 'caught' : (block.isCorrect ? 'missed' : 'dodged'));

    fallingBlocksRef.current = fallingBlocksRef.current.filter(b => b.id !== block.id);
    setFallingBlocks([...fallingBlocksRef.current]);

    if (kind === 'caught' && block.isCorrect) {
      handleCorrectAction(block, hitYRatio, true, popupX, popupY);
    } else if (kind === 'caught' && !block.isCorrect) {
      setPaddleFlash('bad');
      setTimeout(() => setPaddleFlash(null), 250);
      addMistake();
    } else if (kind === 'missed' && block.isCorrect) {
      addMistake();
    } else {
      // correctly dodged a wrong block
      handleCorrectAction(block, 1, false, popupX, popupY);
    }

    blocksResolvedThisRoundRef.current += 1;
    if (blocksResolvedThisRoundRef.current >= blocksThisRoundRef.current) {
      blocksResolvedThisRoundRef.current = 0;
      blocksThisRoundRef.current = 0;
      if (gameActiveRef.current && mistakesRef.current < MAX_MISTAKES) {
        advanceQuestion();
      }
    }
  }, [handleCorrectAction, addMistake, advanceQuestion]);

  /* ── Game loop (rAF) ── */
  useEffect(() => {
    if (gameState !== 'playing') {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (!gameActiveRef.current) return;
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Wobble physics — apply directly to DOM, no React state churn
      const m = mistakesRef.current;
      const amp = m <= 2 ? 1 : Math.min(8, m * 1.3);
      const period = Math.max(600, 2000 - m * 200);
      wobblePhaseRef.current = (wobblePhaseRef.current + dt / period) % 1;
      const angle = amp * Math.sin(wobblePhaseRef.current * Math.PI * 2);
      const tower = towerContainerRef.current;
      if (tower && gameStateRef.current === 'playing') {
        tower.style.transform = `translateX(-50%) rotate(${angle.toFixed(3)}deg)`;
      }

      // Block fall + collision
      const area = playAreaRef.current;
      if (area) {
        const rect = area.getBoundingClientRect();
        const areaH = rect.height;
        const paddleY = areaH - PADDLE_BOTTOM_PX - PADDLE_HEIGHT / 2;
        const paddleX = paddleXRef.current;
        const halfPad = PADDLE_WIDTH_PERCENT / 2;
        const padLeft = paddleX - halfPad;
        const padRight = paddleX + halfPad;

        const toResolve: { block: FallingBlock; kind: 'caught' | 'missed'; x: number; y: number; ratio: number }[] = [];
        for (const b of fallingBlocksRef.current) {
          if (b.status !== 'falling') continue;
          const tRatio = (now - b.spawnTime) / b.fallDurationMs;
          const blockTop = -BLOCK_HEIGHT + tRatio * (areaH + BLOCK_HEIGHT);
          const blockCenterY = blockTop + BLOCK_HEIGHT / 2;
          const px = (b.xPercent / 100) * rect.width;

          // Catch detection — block center reaches paddle band and within paddle X range
          if (blockCenterY >= paddleY - 6 && blockCenterY <= paddleY + PADDLE_HEIGHT) {
            if (b.xPercent >= padLeft && b.xPercent <= padRight) {
              toResolve.push({ block: b, kind: 'caught', x: px, y: paddleY, ratio: tRatio });
              continue;
            }
          }
          // Missed (off bottom)
          if (tRatio >= 1.02) {
            toResolve.push({ block: b, kind: 'missed', x: px, y: areaH - 30, ratio: 1 });
          }
        }
        for (const r of toResolve) {
          resolveBlock(r.block, r.kind, r.x, r.y, r.ratio);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gameState, resolveBlock]);

  /* ── Pointer control ── */
  const updatePaddleFromClientX = useCallback((clientX: number) => {
    const a = playAreaRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const xPct = ((clientX - r.left) / r.width) * 100;
    const half = PADDLE_WIDTH_PERCENT / 2;
    const next = clamp(xPct, half, 100 - half);
    paddleXRef.current = next;
    setPaddleXPercent(next);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    updatePaddleFromClientX(e.clientX);
  }, [gameState, updatePaddleFromClientX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    if (e.touches[0]) updatePaddleFromClientX(e.touches[0].clientX);
  }, [gameState, updatePaddleFromClientX]);

  /* ── Start / Restart ── */
  const resetGameState = () => {
    sync('mistakes', 0);
    sync('score', 0);
    sync('streak', 0);
    sync('longest', 0);
    sync('qIdx', 0);
    sync('answered', 0);
    sync('fall', BASE_FALL_DURATION);
    towerHeightLogicalRef.current = 0;
    setTowerBlocks([]);
    setFallingBlocks([]);
    fallingBlocksRef.current = [];
    setCollapsingBlocks([]);
    setScorePopups([]);
    setScreenEffect('');
    setPaddleFlash(null);
    setShareCopied(false);
    blocksThisRoundRef.current = 0;
    blocksResolvedThisRoundRef.current = 0;
    paddleXRef.current = 50;
    setPaddleXPercent(50);
    spawnTimersRef.current.forEach(t => clearTimeout(t));
    spawnTimersRef.current = [];
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    gameActiveRef.current = true;
  };

  const handleStartFromReady = () => {
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0), 500);
  };

  const handleStartGame = async () => {
    if (!inputText.trim()) { setError('Please enter a topic or paste your notes.'); return; }
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!user || !token) {
      setIsLoading(true);
      setGameState('loading');
      await new Promise(r => setTimeout(r, 2000));
      setIsLoading(false);
      onNavigate('signup');
      return;
    }
    if (!canUseStudyTools) {
      onNavigate('pricing');
      return;
    }

    setIsLoading(true);
    setGameState('loading');
    setLoadedFromSavedGame(false);
    try {
      const qs = await fetchQuestions();
      if (!qs || qs.length === 0) throw new Error('No questions generated. Try different notes.');
      questionsRef.current = qs;
      setQuestions(qs);
      resetGameState();
      setGameState('ready');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setGameState('menu');
    } finally { setIsLoading(false); }
  };

  const handleStartPlayForFun = () => {
    setError(null);
    const qs = bankToQuestions(WORD_TOWER_WORD_BANK, 'wb');
    const shuffled = shuffle(qs);
    questionsRef.current = shuffled;
    setQuestions(shuffled);
    setInputText('General Knowledge');
    setIsPlayForFun(true);
    setLoadedFromSavedGame(false);
    resetGameState();
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0), 500);
  };

  const handleStartMentalMath = () => {
    setError(null);
    const qs = bankToQuestions(WORD_TOWER_MENTAL_MATH_BANK, 'mm');
    const shuffled = shuffle(qs);
    questionsRef.current = shuffled;
    setQuestions(shuffled);
    setInputText('Mental Math');
    setIsPlayForFun(true);
    setLoadedFromSavedGame(false);
    resetGameState();
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0), 500);
  };

  const handlePlayAgain = () => {
    questionsRef.current = shuffle(questionsRef.current);
    setQuestions([...questionsRef.current]);
    resetGameState();
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0), 500);
  };

  const handleNewTopic = () => {
    gameActiveRef.current = false;
    spawnTimersRef.current.forEach(t => clearTimeout(t));
    spawnTimersRef.current = [];
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setFallingBlocks([]);
    fallingBlocksRef.current = [];
    setTowerBlocks([]);
    setCollapsingBlocks([]);
    setInputText('');
    setError(null);
    setLoadedFromSavedGame(false);
    setIsPlayForFun(false);
    setGameState('menu');
  };

  const handleSaveGame = async () => {
    if (!user || questions.length === 0 || isSaving || saveSuccess) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setIsSaving(false); return; }
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/analysis/save-word-tower`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          questions,
          title: inputText.trim().slice(0, 80) || 'Word Tower Game',
          inputType: inputMode,
          sourceText: inputText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setSaveSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const floor = towerHeightLogicalRef.current;
    const url = typeof window !== 'undefined' ? window.location.origin + '/tools/word-tower' : '';
    const text = `🏗️ Word Tower — Floor ${floor} | Score ${scoreRef.current.toLocaleString()} | ${mistakesRef.current} close calls survived`;
    const payload = url ? `${text}\n${url}` : text;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: 'Word Tower', text, url });
        return;
      }
      await navigator.clipboard.writeText(payload);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  const currentQuestion = questions.length > 0 ? questions[currentQIdx % questions.length] : null;

  /* ═══════════════════ RENDER ═══════════════════ */

  const renderMenu = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)] overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div className="flex-shrink-0">
            <ScholarMascot size={100} animated={false} pose="default" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
              Word Tower
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-md leading-relaxed">
              Build a tower of knowledge. Catch correct answers, dodge wrong ones, and don't let the tower fall.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-200/60 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap gap-2">
              {(['notes', 'play-for-fun'] as const).map(mode => {
                const isLocked = mode === 'notes' && !canUseStudyTools;
                const labels = { 'notes': '📄 Study Notes', 'play-for-fun': '🎮 Play for Fun' };
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (isLocked) { onNavigate(user ? 'pricing' : 'signup'); return; }
                      setInputMode(mode);
                    }}
                    className={`flex-1 min-w-[120px] py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
                      inputMode === mode
                        ? 'bg-white text-stone-900 shadow-md border border-stone-200/80'
                        : isLocked
                          ? 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'
                    }`}
                    title={isLocked ? (user ? 'Upgrade to Pro to use Study Notes' : 'Sign up and upgrade to Pro to use Study Notes') : undefined}
                  >
                    {isLocked && <span className="text-xs">🔒</span>}
                    {labels[mode]}
                  </button>
                );
              })}
            </div>

            {inputMode === 'play-for-fun' ? (
              <div>
                <p className="text-stone-600 text-sm mb-4">Pick a game mode. No setup needed, just play!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleStartPlayForFun}
                    className="p-4 rounded-xl text-left border border-stone-200/80 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-200 group"
                  >
                    <span className="text-2xl mb-2 block">📚</span>
                    <span className="font-bold text-stone-800 group-hover:text-violet-700">General Knowledge</span>
                    <span className="text-xs text-stone-500 block mt-1">Mammals, planets, primes, more</span>
                  </button>
                  <button
                    onClick={handleStartMentalMath}
                    className="p-4 rounded-xl text-left border border-stone-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group"
                  >
                    <span className="text-2xl mb-2 block">🔢</span>
                    <span className="font-bold text-stone-800 group-hover:text-emerald-700">Mental Math</span>
                    <span className="text-xs text-stone-500 block mt-1">Even, odd, prime, multiples</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">Paste your revision notes</label>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Paste your revision notes here (min 20 words)..."
                  rows={5}
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 focus:bg-white transition-all text-sm resize-none"
                />
                <p className={`mt-2 text-xs ${wordCount < 20 ? 'text-amber-600' : wordCount > maxWords ? 'text-red-600' : 'text-stone-400'}`}>
                  {wordCount.toLocaleString()} words / {maxWords.toLocaleString()} max
                  {wordCount < 20 && wordCount > 0 && ' (min 20)'}
                </p>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {inputMode === 'notes' && (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={isLoading || !inputText.trim() || (inputMode === 'notes' && (wordCount < 20 || wordCount > maxWords))}
                  className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    background: inputText.trim()
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    boxShadow: inputText.trim() ? '0 10px 30px -5px rgba(99, 102, 241, 0.4)' : 'none',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <>🏗️ Start Stacking</>
                  )}
                </button>

                {!user && (
                  <p className="text-center text-sm text-stone-500">
                    <button onClick={() => onNavigate('login')} className="text-violet-600 font-semibold hover:underline">Log in</button> to generate AI questions
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-6 shadow-sm">
          <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm">?</span>
            How to Play
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { step: 1, text: 'Read the question at the top', icon: '👀' },
              { step: 2, text: 'Move the paddle to catch correct answers', icon: '🧱', accent: 'green' },
              { step: 3, text: 'Dodge wrong answers — let them fall', icon: '🚫', accent: 'red' },
              { step: 4, text: 'Mistakes wobble the tower. 7 = collapse', icon: '🏗️' },
            ].map(({ step, text, icon, accent }) => (
              <div key={step} className={`flex items-center gap-3 p-3 rounded-xl ${accent === 'green' ? 'bg-emerald-50/80 border border-emerald-100' : accent === 'red' ? 'bg-red-50/80 border border-red-100' : 'bg-stone-50 border border-stone-100'}`}>
                <span className="w-9 h-9 rounded-full bg-white shadow-sm border border-stone-200/80 flex items-center justify-center text-base shrink-0">{icon}</span>
                <span className="text-sm text-stone-700 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="relative flex-1 flex items-center justify-center px-4 py-20 overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />
      <div className="relative text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 mb-5 shadow-lg shadow-violet-600/20">
          <span className="text-3xl animate-pulse">🏗️</span>
        </div>
        <h2 className="text-lg font-bold text-stone-800 mb-1">Generating Tower...</h2>
        <p className="text-stone-500 text-sm">stacking your questions</p>
        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-500" style={{ animation: `lrqPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderReady = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)] flex items-center justify-center px-4 overflow-hidden">
      <WriteScholarEditorialBackgroundLayers position="absolute" />
      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl"
          style={{ background: 'linear-gradient(145deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)' }}>
          <span className="text-4xl">🏗️</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">Word Tower</h1>
        <p className="text-stone-600 text-sm mb-1 truncate max-w-full px-4" title={inputText}>
          {inputText.trim() || 'Saved game'}
        </p>
        <p className="text-stone-500 text-xs mb-8">{questions.length} questions ready</p>
        <button
          onClick={handleStartFromReady}
          className="inline-block px-12 py-3.5 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] transition-all"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)' }}
        >
          🏗️ Start Stacking
        </button>
        <button
          onClick={() => { setGameState('menu'); setInputText(''); setQuestions([]); questionsRef.current = []; setLoadedFromSavedGame(false); }}
          className="mt-6 block w-full max-w-xs mx-auto px-6 py-3 rounded-xl bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors"
        >
          ← Back to menu
        </button>
      </div>
    </div>
  );

  const renderGame = () => {
    const q = currentQuestion;
    const isCollapsing = gameState === 'collapsing';
    const towerVisible = towerBlocks.slice(-VISIBLE_TOWER_CAP);
    const towerStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: TOWER_BOTTOM_PX,
      left: '50%',
      transform: 'translateX(-50%)',
      transformOrigin: 'bottom center',
      transition: 'filter 0.3s ease',
      filter: mistakes >= 3 ? `drop-shadow(0 0 ${Math.min(28, mistakes * 4)}px ${glowColor(mistakes)})` : undefined,
      zIndex: 4,
    };

    return (
      <div
        className="relative flex-1 flex flex-col pb-24 sm:pb-0"
        style={screenEffect === 'shake' ? { animation: 'wtScreenShake 0.5s ease-in-out' } : undefined}
      >
        {/* Back button */}
        <div className="absolute top-0 left-0 z-20 p-2 sm:p-3">
          <button
            onClick={() => {
              gameActiveRef.current = false;
              spawnTimersRef.current.forEach(t => clearTimeout(t));
              spawnTimersRef.current = [];
              if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
              setFallingBlocks([]);
              fallingBlocksRef.current = [];
              if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true') {
                sessionStorage.removeItem('writescholar_return_to_study_pack_viewer');
                onNavigate('study-pack-viewer');
              } else {
                setGameState('menu');
              }
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
            aria-label="Back to menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* HUD */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-violet-500/10 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-slate-300 tabular-nums">
                Q{(currentQIdx % Math.max(1, questions.length)) + 1}/{questions.length}
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 tabular-nums flex items-center gap-1">
                <span>🧱</span> {towerHeightLogicalRef.current}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight" style={{ textShadow: '0 0 20px rgba(167, 139, 250, 0.4)' }}>
              {score.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 tabular-nums transition-colors ${
                streak >= 3
                  ? 'bg-violet-500/20 border-violet-400/40 text-violet-200'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
              }`}
                style={streak >= 3 ? { animation: 'lrqStreakFire 0.5s ease-in-out infinite' } : undefined}>
                {streak >= 3 && '🔥'}{streak}x
              </div>
              <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 tabular-nums transition-colors ${
                mistakes >= 5
                  ? 'bg-red-500/20 border-red-400/40 text-red-200'
                  : mistakes >= 3
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
              }`}>
                ⚠ {mistakes}/{MAX_MISTAKES}
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-sm px-4 py-4 border-b border-white/5">
          <p className="text-center text-base sm:text-lg font-semibold text-white max-w-2xl mx-auto leading-snug" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {q?.prompt || '...'}
          </p>
        </div>

        {/* Play Area */}
        <div
          ref={playAreaRef}
          className="flex-1 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, #4c1d95 0%, #1e1b4b 40%, #0f0a26 100%)',
            minHeight: '460px',
            touchAction: 'none',
            userSelect: 'none',
            cursor: 'none',
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
        >
          {/* Stars */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }, (_, i) => {
              const seed = i * 137.508;
              const size = (seed % 2) + 1;
              return (
                <div key={i} className="absolute rounded-full bg-white"
                  style={{
                    width: size,
                    height: size,
                    left: `${(seed * 7) % 100}%`,
                    top: `${(seed * 3) % 70}%`,
                    opacity: 0.2 + (seed % 4) * 0.15,
                    boxShadow: size > 1 ? '0 0 4px rgba(255,255,255,0.5)' : undefined,
                  }} />
              );
            })}
          </div>

          {/* Distant moon */}
          <div className="absolute pointer-events-none" style={{
            top: '8%', right: '10%',
            width: 60, height: 60, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fef3c7 0%, #fde68a 40%, #d97706 100%)',
            opacity: 0.35,
            boxShadow: '0 0 60px 20px rgba(254, 243, 199, 0.15)',
          }} />

          {screenEffect === 'badFlash' && (
            <div className="absolute inset-0 z-50 pointer-events-none" style={{ animation: 'wtBadFlash 0.6s ease-out forwards' }} />
          )}

          {/* Falling blocks */}
          {fallingBlocks.map(block => (
            <div
              key={block.id}
              data-bid={block.id}
              style={{
                position: 'absolute',
                left: `${block.xPercent}%`,
                top: -BLOCK_HEIGHT,
                transform: 'translateX(-50%)',
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                background: 'linear-gradient(180deg, #fffefb 0%, #f5f3ee 100%)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10,
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -2px 0 rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#1c1917',
                fontSize: block.text.length > 12 ? 11 : block.text.length > 8 ? 12 : 13,
                textAlign: 'center',
                lineHeight: 1.15,
                padding: '0 8px',
                animation: `wtFall ${block.fallDurationMs}ms linear forwards`,
                zIndex: 10,
                fontFamily: '"Inter", system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{block.text}</span>
            </div>
          ))}

          {/* Tower */}
          {!isCollapsing && (
            <div ref={towerContainerRef} style={towerStyle}>
              <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 2 }}>
                {towerVisible.map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      width: BLOCK_WIDTH - (i % 2) * 4,
                      height: BLOCK_HEIGHT,
                      background: i % 2 === 0
                        ? 'linear-gradient(180deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)'
                        : 'linear-gradient(180deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
                      border: '1px solid rgba(120, 53, 15, 0.25)',
                      borderRadius: 8,
                      boxShadow: '0 4px 10px -2px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(120, 53, 15, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#451a03',
                      fontSize: b.text.length > 12 ? 10 : b.text.length > 8 ? 11 : 12,
                      lineHeight: 1.1,
                      textAlign: 'center',
                      padding: '0 6px',
                      animation: i === towerVisible.length - 1 ? 'wtBlockSettle 280ms ease-out' : undefined,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsing tower */}
          {isCollapsing && (
            <div style={{ position: 'absolute', bottom: TOWER_BOTTOM_PX, left: '50%', transformOrigin: 'bottom center', transform: 'translateX(-50%)', animation: 'wtCollapseTilt 1.4s cubic-bezier(.7,.1,.85,.9) forwards', zIndex: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 2 }}>
                {collapsingBlocks.map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      width: BLOCK_WIDTH,
                      height: BLOCK_HEIGHT,
                      background: i % 2 === 0
                        ? 'linear-gradient(180deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)'
                        : 'linear-gradient(180deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
                      border: '1px solid rgba(120, 53, 15, 0.25)',
                      borderRadius: 8,
                      boxShadow: '0 4px 10px -2px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#451a03',
                      fontSize: 12,
                      animation: `wtBlockFallOff 1.1s ease-in ${b.delayMs}ms forwards`,
                      ['--fx' as any]: `${b.fx}px`,
                      ['--fr' as any]: `${b.fr}deg`,
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}
                  >
                    <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', padding: '0 6px' }}>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score popups */}
          {scorePopups.map(pop => (
            <div key={pop.id} className="absolute z-50 pointer-events-none font-black text-lg"
              style={{ left: pop.x, top: pop.y, color: pop.color, animation: 'wtScoreFloat 1.1s ease-out forwards', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
              +{pop.points}
            </div>
          ))}

          {/* Paddle */}
          <div
            style={{
              position: 'absolute',
              bottom: PADDLE_BOTTOM_PX,
              left: `${paddleXPercent}%`,
              transform: 'translateX(-50%)',
              width: `${PADDLE_WIDTH_PERCENT}%`,
              minWidth: 80,
              maxWidth: 240,
              height: PADDLE_HEIGHT,
              borderRadius: 999,
              background: paddleFlash === 'good'
                ? 'linear-gradient(180deg, #6ee7b7, #10b981 50%, #047857)'
                : paddleFlash === 'bad'
                  ? 'linear-gradient(180deg, #fca5a5, #dc2626 50%, #991b1b)'
                  : 'linear-gradient(180deg, #c4b5fd, #8b5cf6 50%, #6d28d9)',
              boxShadow: paddleFlash === 'good'
                ? '0 0 30px rgba(16, 185, 129, 0.6), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)'
                : paddleFlash === 'bad'
                  ? '0 0 30px rgba(220, 38, 38, 0.6), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)'
                  : '0 0 24px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
              animation: paddleFlash === 'good' ? 'wtCatchFlash 320ms ease-out' : 'wtPaddleGlow 2.4s ease-in-out infinite',
              border: '1px solid rgba(255,255,255,0.3)',
              transition: 'background 120ms ease-out, box-shadow 200ms ease-out',
              zIndex: 6,
            }}
          />

          {/* Floor / horizon */}
          <div className="absolute left-0 right-0 pointer-events-none" style={{
            bottom: 0,
            height: PADDLE_BOTTOM_PX,
            background: 'linear-gradient(180deg, transparent 0%, rgba(76, 29, 149, 0.4) 100%)',
            zIndex: 2,
          }} />
          <div className="absolute left-0 right-0 pointer-events-none" style={{
            bottom: PADDLE_BOTTOM_PX - 2,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(196, 181, 253, 0.6), transparent)',
            boxShadow: '0 0 8px rgba(167, 139, 250, 0.5)',
            zIndex: 3,
          }} />

          {fallingBlocks.length === 0 && gameState === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-500 text-sm animate-pulse">Blocks incoming...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    const floor = towerHeightLogicalRef.current;

    return (
      <div className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        <WriteScholarEditorialBackgroundLayers position="absolute" />
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
            <div className="px-6 py-8 text-center" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-3">
                <span className="text-3xl">🏗️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Tower Fell at Floor {floor}</h2>
              <div className="text-4xl font-black text-white mt-2 tabular-nums">{score.toLocaleString()}</div>
              <p className="text-white/60 text-sm mt-1">points</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: floor, label: 'Floor', color: 'text-emerald-600' },
                  { val: longestStreak, label: 'Best Streak', color: 'text-violet-500' },
                  { val: questionsAnswered, label: 'Questions', color: 'text-violet-600' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[11px] text-stone-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex gap-3">
                  <button onClick={handlePlayAgain}
                    className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-md shadow-violet-600/20 active:scale-[0.98] transition-all">
                    🏗️ Play Again
                  </button>
                  <button onClick={handleNewTopic}
                    className="flex-1 py-3.5 rounded-xl bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 active:scale-[0.98] transition-all border border-stone-200">
                    {isPlayForFun ? 'Back to Menu' : 'New Topic'}
                  </button>
                </div>

                <button onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-white text-stone-700 font-semibold hover:bg-stone-50 active:scale-[0.98] transition-all border border-stone-200 shadow-sm flex items-center justify-center gap-2">
                  {shareCopied ? '✓ Copied!' : '🔗 Share Score'}
                </button>

                {user && !isPlayForFun && (
                  <>
                    {loadedFromSavedGame ? (
                      <div className="w-full py-3 rounded-xl font-medium border flex items-center justify-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700">
                        ✓ Already saved to Saved Materials — replay anytime
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveGame}
                        disabled={isSaving || saveSuccess}
                        className="w-full py-3 rounded-xl font-semibold transition-all border flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                          background: saveSuccess ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'white',
                          color: saveSuccess ? 'white' : '#64748b',
                          borderColor: saveSuccess ? '#22c55e' : '#e2e8f0',
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
                    {error && (
                      <p className="text-red-600 text-sm text-center">{error}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      {!showMinimalUI && <Header onNavigate={onNavigate} user={user} onLogout={onLogout || (() => {})} currentPage="word-tower" />}
      {showMinimalUI && (gameState === 'menu' || gameState === 'loading' || gameState === 'ready' || gameState === 'gameover') && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur border-b border-stone-200">
          <button onClick={() => {
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('writescholar_return_to_study_pack_viewer') === 'true') {
              sessionStorage.removeItem('writescholar_return_to_study_pack_viewer');
              onNavigate('study-pack-viewer');
            } else {
              onNavigate('dashboard');
            }
          }} className="p-2 -ml-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors" aria-label="Back">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-semibold text-stone-700">Word Tower</span>
          <div className="w-9" />
        </div>
      )}
      {gameState === 'menu' && renderMenu()}
      {gameState === 'loading' && renderLoading()}
      {gameState === 'ready' && renderReady()}
      {(gameState === 'playing' || gameState === 'collapsing') && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
      {!showMinimalUI && gameState !== 'playing' && gameState !== 'collapsing' && <Footer onNavigate={onNavigate} />}
    </div>
  );
};

export default WordTowerPage;
