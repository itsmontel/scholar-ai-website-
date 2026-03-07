import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import { CRATER_BLAST_WORD_BANK } from '../../../data/craterBlastWordBank';

/* ────────────────────── Types ────────────────────── */

interface LightningReflexQuizPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface Question {
  id: string;
  prompt: string;
  answers: string[];
  correctIndex: number;
}

interface Crater {
  id: string;
  text: string;
  answerIndex: number;
  isCorrect: boolean;
  xPercent: number;
  fallDurationMs: number;
  status: 'falling' | 'correct' | 'wrong' | 'missed';
  frozenTop?: number;
}

interface ProjData {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetCrater: Crater | null;
  startTime: number;
  duration: number;
}

interface ScorePopup {
  id: string;
  points: number;
  x: number;
  y: number;
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  isCorrect: boolean;
}

type GameState = 'menu' | 'loading' | 'ready' | 'playing' | 'gameover';
type InputMode = 'topic' | 'notes' | 'play-for-fun';

/* ────────────────────── Config ────────────────────── */

const INITIAL_LIVES = 3;
const BASE_FALL_DURATION = 12000;
const MIN_FALL_DURATION = 6000;
const SPEED_DECREASE_PER_5 = 600;
const BASE_SCORE = 100;
const MAX_REACTION_BONUS = 200;
const STREAK_BONUS_PER = 10;
const ROUND_DELAY_MS = 0;

const CRATER_SIZE = 96;
const LANE_CENTERS = [14, 37, 63, 86];

const TOPIC_SUGGESTIONS = [
  'Capital Cities', 'The Solar System', 'Human Body', 'World History',
  'Famous Scientists', 'English Vocabulary', 'Math Basics', 'Geography',
];

/* ────────────────────── Helpers ────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computePoints(reactionMs: number, streak: number) {
  const reactionBonus = Math.max(0, MAX_REACTION_BONUS - Math.floor(reactionMs / 25));
  const streakBonus = streak * STREAK_BONUS_PER;
  return { base: BASE_SCORE, reactionBonus, streakBonus, total: BASE_SCORE + reactionBonus + streakBonus };
}

/* ────────────────────── Component ────────────────────── */

const LightningReflexQuizPage = ({ onNavigate, user, onLogout }: LightningReflexQuizPageProps) => {
  const userPlan = (user?.plan || user?.subscription_plan || 'free').toLowerCase();
  const canUseStudyTools = user && (userPlan === 'starter' || userPlan === 'premium');

  const [gameState, setGameState] = useState<GameState>('menu');
  const [inputMode, setInputMode] = useState<InputMode>('notes');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [craters, setCraters] = useState<Crater[]>([]);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [fallDuration, setFallDuration] = useState(BASE_FALL_DURATION);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [screenEffect, setScreenEffect] = useState('');
  const [timerKey, setTimerKey] = useState(0);

  const [cannonAngle, setCannonAngle] = useState(0);
  const [projPos, setProjPos] = useState<{ x: number; y: number } | null>(null);
  const [cannonFiring, setCannonFiring] = useState(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedFromSavedGame, setLoadedFromSavedGame] = useState(false);
  const [isPlayForFun, setIsPlayForFun] = useState(false);
  const [showMinimalUI, setShowMinimalUI] = useState(false);
  const [questionResults, setQuestionResults] = useState<{question: Question, isCorrect: boolean, userAnswerIndex: number | null}[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const minimal = localStorage.getItem('writescholar_minimal_ui') === 'true';
    if (minimal) {
      localStorage.removeItem('writescholar_minimal_ui');
      setShowMinimalUI(true);
    }
  }, []);

  const livesRef = useRef(INITIAL_LIVES);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const correctCountRef = useRef(0);
  const longestStreakRef = useRef(0);
  const currentQIdxRef = useRef(0);
  const fallDurationRef = useRef(BASE_FALL_DURATION);
  const questionsRef = useRef<Question[]>([]);
  const cratersRef = useRef<Crater[]>([]);
  const roundResolvedRef = useRef(false);
  const roundStartRef = useRef(0);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const gameActiveRef = useRef(false);
  const projDataRef = useRef<ProjData | null>(null);
  const projRafRef = useRef<number | null>(null);
  const handleHitRef = useRef<(crater: Crater, x: number, y: number) => void>(() => {});

  useEffect(() => {
    document.title = 'Crater Blast | WriteScholar';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Crater Blast — the AI-powered quiz shooter. Blast the correct falling crater before it lands. Build streaks, beat your high score!');
  }, []);

  // Default to Play for Fun when not logged in (so locked-out users can play immediately)
  useEffect(() => {
    if (!user && gameState === 'menu') {
      setInputMode('play-for-fun');
    }
  }, [user, gameState]);

  useEffect(() => {
    const saved = localStorage.getItem('savedCraterBlast');
    if (saved && gameState === 'menu') {
      try {
        const tool = JSON.parse(saved);
        const qs = tool.questions?.questions ?? (Array.isArray(tool.questions) ? tool.questions : []);
        if (qs.length > 0) {
          localStorage.removeItem('savedCraterBlast');
          questionsRef.current = shuffle(qs);
          setQuestions([...questionsRef.current]);
          setInputText(tool.questions?.sourceText || tool.title || '');
          setInputMode((tool.questions?.inputType || 'topic') as InputMode);
          setLoadedFromSavedGame(true);
          resetGameState();
          setGameState('ready');
        }
      } catch {
        localStorage.removeItem('savedCraterBlast');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
      if (projRafRef.current) cancelAnimationFrame(projRafRef.current);
    };
  }, []);

  // Scroll to top when game starts (loading/ready/playing) so content isn't at footer
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

  const sync = useCallback((field: string, v: number) => {
    switch (field) {
      case 'lives': livesRef.current = v; setLives(v); break;
      case 'score': scoreRef.current = v; setScore(v); break;
      case 'streak': streakRef.current = v; setStreak(v); break;
      case 'correct': correctCountRef.current = v; setCorrectCount(v); break;
      case 'longest': longestStreakRef.current = v; setLongestStreak(v); break;
      case 'qIdx': currentQIdxRef.current = v; setCurrentQIdx(v); break;
      case 'fall': fallDurationRef.current = v; setFallDuration(v); break;
    }
  }, []);

  /* ── API ── */
  const fetchQuestions = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { setError('Please log in to generate AI questions.'); return null; }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/analysis/generate-reflex-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ inputType: inputMode, content: inputText.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate questions');
    return data.data.questions as Question[];
  };

  /* ── Game lifecycle ── */
  const spawnRound = useCallback((qIdx: number, dur: number) => {
    if (!gameActiveRef.current) return;
    const qs = questionsRef.current;
    if (qs.length === 0) return;
    const q = qs[qIdx % qs.length];
    const lanes = shuffle([0, 1, 2, 3]);

    const newCraters: Crater[] = q.answers.map((ans, i) => ({
      id: `c-${Date.now()}-${i}`,
      text: ans,
      answerIndex: i,
      isCorrect: i === q.correctIndex,
      xPercent: LANE_CENTERS[lanes[i]] + (Math.random() * 4 - 2),
      fallDurationMs: dur + (Math.random() * 400 - 200),
      status: 'falling' as const,
    }));

    cratersRef.current = newCraters;
    roundResolvedRef.current = false;
    roundStartRef.current = Date.now();
    setCraters(newCraters);
    setTimerKey(k => k + 1);
  }, []);

  const advanceQuestion = useCallback(() => {
    if (!gameActiveRef.current) return;
    const next = (currentQIdxRef.current + 1) % questionsRef.current.length;
    if (next === 0) {
      questionsRef.current = shuffle(questionsRef.current);
      setQuestions([...questionsRef.current]);
    }
    sync('qIdx', next);
    if (ROUND_DELAY_MS > 0) {
      transitionRef.current = setTimeout(() => spawnRound(next, fallDurationRef.current), ROUND_DELAY_MS);
    } else {
      spawnRound(next, fallDurationRef.current);
    }
  }, [spawnRound, sync]);

  const endGame = useCallback(() => {
    gameActiveRef.current = false;
    setCraters([]);
    setProjPos(null);
    projDataRef.current = null;
    setGameState('gameover');
  }, []);

  const loseLife = useCallback(() => {
    const nl = livesRef.current - 1;
    sync('lives', nl);
    sync('streak', 0);
    setScreenEffect('shake');
    setTimeout(() => setScreenEffect('red'), 80);
    setTimeout(() => setScreenEffect(''), 700);
    if (nl <= 0) { setTimeout(() => endGame(), 800); }
    else { advanceQuestion(); }
  }, [advanceQuestion, endGame, sync]);

  /* ── Projectile hit ── */
  const handleProjectileHit = useCallback((crater: Crater, hitX: number, hitY: number) => {
    if (roundResolvedRef.current || !gameActiveRef.current) return;
    roundResolvedRef.current = true;

    const currentQ = questionsRef.current[currentQIdxRef.current % questionsRef.current.length];
    setQuestionResults(prev => [...prev, { question: currentQ, isCorrect: crater.isCorrect, userAnswerIndex: crater.answerIndex }]);

    const reactionMs = Date.now() - roundStartRef.current;
    const eid = `exp-${Date.now()}`;
    setExplosions(prev => [...prev, { id: eid, x: hitX, y: hitY, isCorrect: crater.isCorrect }]);
    setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== eid)), 800);

    if (crater.isCorrect) {
      const ns = streakRef.current + 1;
      const { total } = computePoints(reactionMs, ns);
      sync('score', scoreRef.current + total);
      sync('streak', ns);
      sync('correct', correctCountRef.current + 1);
      if (ns > longestStreakRef.current) sync('longest', ns);
      if ((correctCountRef.current) % 5 === 0) {
        sync('fall', Math.max(MIN_FALL_DURATION, fallDurationRef.current - SPEED_DECREASE_PER_5));
      }

      const pid = `pop-${Date.now()}`;
      setScorePopups(p => [...p, { id: pid, points: total, x: hitX, y: hitY }]);
      setTimeout(() => setScorePopups(p => p.filter(pp => pp.id !== pid)), 1100);

      setCraters(prev => prev.map(c =>
        c.id === crater.id ? { ...c, status: 'correct' as const, frozenTop: hitY - CRATER_SIZE / 2 } : { ...c, status: 'missed' as const }
      ));
      setTimeout(() => advanceQuestion(), 60);
    } else {
      setCraters(prev => {
        const correct = prev.find(c => c.isCorrect);
        return prev.map(c => {
          if (c.id === crater.id) return { ...c, status: 'wrong' as const, frozenTop: hitY - CRATER_SIZE / 2 };
          if (c.id === correct?.id) {
            const el = playAreaRef.current?.querySelector(`[data-cid="${correct.id}"]`) as HTMLElement | null;
            const pr = playAreaRef.current?.getBoundingClientRect();
            let ft: number | undefined;
            if (el && pr) ft = el.getBoundingClientRect().top - pr.top;
            return { ...c, status: 'correct' as const, frozenTop: ft };
          }
          return { ...c, status: 'missed' as const };
        });
      });
      setTimeout(() => loseLife(), 60);
    }
  }, [advanceQuestion, loseLife, sync]);

  handleHitRef.current = handleProjectileHit;

  /* ── Fire cannon (rAF projectile) ── */
  const fireCannon = useCallback((targetX: number, targetY: number) => {
    if (roundResolvedRef.current || !gameActiveRef.current || projDataRef.current) return;
    const area = playAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const cannonX = rect.width / 2;
    const cannonY = rect.height - 40;

    let hitCrater: Crater | null = null;
    let bestDist = CRATER_SIZE * 1.2;

    cratersRef.current.forEach(cr => {
      if (cr.status !== 'falling') return;
      const el = area.querySelector(`[data-cid="${cr.id}"]`) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left - rect.left + r.width / 2;
      const cy = r.top - rect.top + r.height / 2;
      const d = Math.sqrt((targetX - cx) ** 2 + (targetY - cy) ** 2);
      if (d < bestDist) { bestDist = d; hitCrater = cr; }
    });

    let endX = targetX, endY = targetY;
    if (hitCrater) {
      const el = area.querySelector(`[data-cid="${(hitCrater as Crater).id}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        endX = r.left - rect.left + r.width / 2;
        endY = r.top - rect.top + r.height / 2;
      }
    }

    const dist = Math.sqrt((endX - cannonX) ** 2 + (endY - cannonY) ** 2);
    const duration = Math.max(120, dist * 0.7);

    setCannonFiring(true);
    setTimeout(() => setCannonFiring(false), 350);

    const data: ProjData = { startX: cannonX, startY: cannonY, targetX: endX, targetY: endY, targetCrater: hitCrater, startTime: performance.now(), duration };
    projDataRef.current = data;
    setProjPos({ x: cannonX, y: cannonY });

    const animate = () => {
      const d = projDataRef.current;
      if (!d) { setProjPos(null); return; }
      const t = Math.min(1, (performance.now() - d.startTime) / d.duration);
      const x = d.startX + (d.targetX - d.startX) * t;
      const y = d.startY + (d.targetY - d.startY) * t;
      setProjPos({ x, y });

      if (t >= 1) {
        projDataRef.current = null;
        setProjPos(null);
        if (d.targetCrater) handleHitRef.current(d.targetCrater, d.targetX, d.targetY);
      } else {
        projRafRef.current = requestAnimationFrame(animate);
      }
    };
    projRafRef.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const a = playAreaRef.current;
    if (!a || gameState !== 'playing') return;
    const r = a.getBoundingClientRect();
    const angle = Math.atan2(e.clientX - r.left - r.width / 2, r.height - 40 - (e.clientY - r.top)) * (180 / Math.PI);
    setCannonAngle(Math.max(-65, Math.min(65, angle)));
  }, [gameState]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (gameState !== 'playing' || roundResolvedRef.current || projDataRef.current) return;
    const a = playAreaRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    fireCannon(e.clientX - r.left, e.clientY - r.top);
  }, [gameState, fireCannon]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const a = playAreaRef.current;
    if (!a || gameState !== 'playing') return;
    const r = a.getBoundingClientRect();
    const t = e.touches[0];
    const angle = Math.atan2(t.clientX - r.left - r.width / 2, r.height - 40 - (t.clientY - r.top)) * (180 / Math.PI);
    setCannonAngle(Math.max(-65, Math.min(65, angle)));
  }, [gameState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (gameState !== 'playing' || roundResolvedRef.current || projDataRef.current) return;
    const a = playAreaRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const t = e.changedTouches[0];
    fireCannon(t.clientX - r.left, t.clientY - r.top);
  }, [gameState, fireCannon]);

  const handleCraterAnimEnd = useCallback((_craterId: string, isCorrect: boolean) => {
    if (roundResolvedRef.current || !gameActiveRef.current) return;
    if (!isCorrect) return;
    roundResolvedRef.current = true;
    
    const currentQ = questionsRef.current[currentQIdxRef.current % questionsRef.current.length];
    setQuestionResults(prev => [...prev, { question: currentQ, isCorrect: false, userAnswerIndex: null }]);

    setCraters(prev => prev.map(c => ({ ...c, status: c.status === 'falling' ? 'missed' as const : c.status })));
    loseLife();
  }, [loseLife]);

  /* ── Start / Restart ── */
  const handleStartGame = async () => {
    if (!inputText.trim()) { setError('Please enter a topic or paste your notes.'); return; }
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!user || !token) {
      setIsLoading(true);
      setGameState('loading');
      await new Promise(r => setTimeout(r, 2500));
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
      if (!qs || qs.length === 0) throw new Error('No questions generated. Try a different topic.');
      questionsRef.current = qs;
      setQuestions(qs);
      resetGameState();
      setGameState('playing');
      window.scrollTo(0, 0);
      setTimeout(() => spawnRound(0, BASE_FALL_DURATION), 500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setGameState('menu');
    } finally { setIsLoading(false); }
  };

  const resetGameState = () => {
    sync('lives', INITIAL_LIVES); sync('score', 0); sync('streak', 0);
    sync('correct', 0); sync('longest', 0); sync('qIdx', 0); sync('fall', BASE_FALL_DURATION);
    setScorePopups([]); setScreenEffect(''); setExplosions([]);
    setProjPos(null); projDataRef.current = null;
    setQuestionResults([]); setShowResults(false);
    gameActiveRef.current = true;
  };

  const handlePlayAgain = () => {
    questionsRef.current = shuffle(questionsRef.current);
    setQuestions([...questionsRef.current]);
    resetGameState();
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0, BASE_FALL_DURATION), 500);
  };

  const handleStartFromReady = () => {
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0, BASE_FALL_DURATION), 500);
  };

  const handleNewTopic = () => {
    gameActiveRef.current = false;
    setCraters([]); setProjPos(null); projDataRef.current = null;
    setInputText(''); setError(null); setLoadedFromSavedGame(false); setIsPlayForFun(false); setGameState('menu');
  };

  const handleStartPlayForFun = () => {
    setError(null);
    const qs = CRATER_BLAST_WORD_BANK.map((q, i) => ({
      id: `wb-${i}`,
      prompt: q.prompt,
      answers: q.answers,
      correctIndex: q.correctIndex,
    }));
    const shuffled = shuffle(qs);
    questionsRef.current = shuffled;
    setQuestions(shuffled);
    setInputText('General Knowledge');
    setIsPlayForFun(true);
    setLoadedFromSavedGame(false);
    resetGameState();
    setGameState('playing');
    window.scrollTo(0, 0);
    setTimeout(() => spawnRound(0, BASE_FALL_DURATION), 500);
  };

  const handleSaveGame = async () => {
    if (!user || questions.length === 0 || isSaving || saveSuccess) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setIsSaving(false); return; }
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/analysis/save-crater-blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          questions,
          title: inputText.trim().slice(0, 80) || 'Crater Blast Game',
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

  const currentQuestion = questions.length > 0 ? questions[currentQIdx % questions.length] : null;

  /* ═══════════════════ RENDER ═══════════════════ */

  const renderMenu = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)]" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 50%, #EDEBE8 100%)' }}>
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #78716c 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mb-6 shadow-xl"
            style={{
              background: 'linear-gradient(145deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
              boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}>
            <span className="text-4xl sm:text-5xl drop-shadow-sm">⚡</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
            Crater Blast
          </h1>
          <p className="text-stone-600 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            AI-generated quiz craters fall from the sky. Aim your cannon and blast the correct answer before it lands.
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-200/60 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex bg-stone-50 rounded-xl p-1.5 border border-stone-100">
              {(['notes', 'topic', 'play-for-fun'] as const).map(mode => {
                const isLocked = (mode === 'notes' || mode === 'topic') && !canUseStudyTools;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (isLocked) {
                        onNavigate(user ? 'pricing' : 'signup');
                        return;
                      }
                      setInputMode(mode);
                    }}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
                      inputMode === mode
                        ? 'bg-white text-stone-900 shadow-md border border-stone-200/80'
                        : isLocked
                          ? 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'
                    }`}
                    title={isLocked ? (user ? 'Upgrade to Starter or Premium to use Study Notes and Topic' : 'Sign up for Starter or Premium to use Study Notes and Topic') : undefined}
                  >
                    {isLocked && <span className="text-xs">🔒</span>}
                    {mode === 'topic' ? '📝 Topic' : mode === 'notes' ? '📄 Study Notes' : '🎮 Play for Fun'}
                  </button>
                );
              })}
            </div>

            {inputMode === 'play-for-fun' ? (
              <div>
                <p className="text-stone-600 text-sm mb-4">Blast craters with trivia questions. No setup needed, just play!</p>
                <button
                  onClick={handleStartPlayForFun}
                  className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  🎮 Play for Fun
                </button>
              </div>
            ) : inputMode === 'topic' ? (
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">What do you want to study?</label>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStartGame()}
                  placeholder="e.g. Capital Cities, WW2, Biology..."
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all text-base"
                />
                <p className="mt-2 text-xs text-stone-400 mb-3">Quick picks:</p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_SUGGESTIONS.map(t => (
                    <button key={t} onClick={() => setInputText(t)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                      {t}
                    </button>
                  ))}
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
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/80 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all text-sm resize-none"
                />
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {inputMode !== 'play-for-fun' && (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    background: inputText.trim()
                      ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
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
                    <>💥 Start Blasting</>
                  )}
                </button>

                {!user && (
                  <p className="text-center text-sm text-stone-500">
                    <button onClick={() => onNavigate('login')} className="text-blue-600 font-semibold hover:underline">Log in</button> to generate AI questions
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* How to play */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-6 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">?</span>
            How to Play
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { step: 1, text: 'Answer craters fall from the sky', icon: '🌑' },
              { step: 2, text: 'Tap or click to fire your cannon', icon: '🎯' },
              { step: 3, text: 'Hit the correct answer to score points', icon: '✅', accent: 'green' },
              { step: 4, text: 'Wrong hit or miss costs a life', icon: '❤️', accent: 'red' },
            ].map(({ step, text, icon, accent }) => (
              <div key={step} className={`flex items-center gap-3 p-3 rounded-xl ${accent === 'green' ? 'bg-emerald-50/80 border border-emerald-100' : accent === 'red' ? 'bg-red-50/80 border border-red-100' : 'bg-stone-50 border border-stone-100'}`}>
                <span className="w-9 h-9 rounded-full bg-white shadow-sm border border-stone-200/80 flex items-center justify-center text-base shrink-0">{icon}</span>
                <span className="text-sm text-stone-700 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['AI-Powered', '20 Questions', 'Endless Rounds', 'Mobile Friendly'].map((badge, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-white/80 border border-stone-200/60 text-xs font-medium text-stone-600 shadow-sm">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center px-4 py-20" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-5 shadow-lg shadow-blue-600/20">
          <span className="text-3xl animate-pulse">⚡</span>
        </div>
        <h2 className="text-lg font-bold text-stone-800 mb-1">Generating Craters...</h2>
        <p className="text-stone-500 text-sm">loading your targets</p>
        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-500" style={{ animation: `lrqPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderReady = () => (
    <div className="relative flex-1 min-h-[calc(100vh-200px)] flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 50%, #EDEBE8 100%)' }}>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl"
          style={{ background: 'linear-gradient(145deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)' }}>
          <span className="text-4xl">💥</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-2">Crater Blast</h1>
        <p className="text-stone-600 text-sm mb-1 truncate max-w-full px-4" title={inputText}>
          {inputText.trim() || 'Saved game'}
        </p>
        <p className="text-stone-500 text-xs mb-8">{questions.length} questions ready</p>
        <button
          onClick={handleStartFromReady}
          className="w-full max-w-xs mx-auto py-4 rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.99] transition-all"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)' }}
        >
          💥 Start Game
        </button>
        <button
          onClick={() => { setGameState('menu'); setInputText(''); setQuestions([]); questionsRef.current = []; setLoadedFromSavedGame(false); }}
          className="mt-4 text-sm text-stone-500 hover:text-stone-700 font-medium"
        >
          ← Choose different topic
        </button>
      </div>
    </div>
  );

  const renderGame = () => {
    const q = currentQuestion;
    const streakFire = streak >= 3;

    return (
      <div className="flex-1 flex flex-col" style={screenEffect === 'shake' ? { animation: 'lrqScreenShake 0.5s ease-in-out' } : undefined}>
        {/* HUD */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700/50 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Q{(currentQIdx % questions.length) + 1}/{questions.length}</span>
              <span className="text-xs font-medium text-emerald-400">✅ {correctCount}</span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{score.toLocaleString()}</div>
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold flex items-center gap-1 ${streakFire ? 'text-orange-400' : 'text-slate-500'}`}
                style={streakFire ? { animation: 'lrqStreakFire 0.5s ease-in-out infinite' } : undefined}>
                {streakFire && '🔥'}{streak}x
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <span key={i} className={`text-base transition-all duration-300 ${i >= lives ? 'opacity-20 grayscale' : ''}`}>❤️</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="h-1 bg-slate-800 relative overflow-hidden">
          <div key={timerKey} className="h-full absolute left-0 top-0"
            style={{ background: 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)', animation: `lrqTimerShrink ${fallDuration}ms linear forwards` }} />
        </div>

        {/* Question */}
        <div className="bg-slate-800/95 backdrop-blur-sm px-4 py-3">
          <p className="text-center text-base sm:text-lg font-semibold text-white max-w-2xl mx-auto">{q?.prompt || '...'}</p>
        </div>

        {/* Play Area */}
        <div
          ref={playAreaRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #334155 100%)', minHeight: '380px', touchAction: 'none', userSelect: 'none' }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Stars (memoized positions via key) */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }, (_, i) => {
              const seed = i * 137.508;
              return (
                <div key={i} className="absolute rounded-full bg-white"
                  style={{ width: (seed % 2) + 1, height: (seed % 2) + 1, left: `${(seed * 7) % 100}%`, top: `${(seed * 3) % 75}%`, opacity: 0.15 + (seed % 4) * 0.1 }} />
              );
            })}
          </div>

          {screenEffect === 'red' && (
            <div className="absolute inset-0 z-50 pointer-events-none" style={{ animation: 'lrqRedFlash 0.6s ease-out forwards' }} />
          )}

          {/* Danger zone */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(239,68,68,0.12), transparent)' }} />

          {/* Craters */}
          {craters.map(crater => {
            const isFalling = crater.status === 'falling';
            const isOk = crater.status === 'correct';
            const isBad = crater.status === 'wrong';

            const wrapStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${crater.xPercent}%`,
              transform: 'translateX(-50%)',
              zIndex: 10,
            };

            if (isFalling) {
              wrapStyle.animation = `lrqFall ${crater.fallDurationMs}ms linear forwards`;
            } else if (isOk) {
              wrapStyle.top = crater.frozenTop != null ? `${crater.frozenTop}px` : '40%';
            } else if (isBad) {
              wrapStyle.top = crater.frozenTop != null ? `${crater.frozenTop}px` : '40%';
            } else {
              wrapStyle.opacity = 0;
              wrapStyle.pointerEvents = 'none';
              wrapStyle.top = crater.frozenTop != null ? `${crater.frozenTop}px` : '40%';
            }

            let bg = 'radial-gradient(circle at 38% 32%, #64748b 0%, #475569 25%, #334155 55%, #1e293b 100%)';
            let border = 'rgba(100,116,139,0.5)';
            let glow = '0 6px 20px rgba(0,0,0,0.5), inset 0 -5px 12px rgba(0,0,0,0.5), inset 0 3px 8px rgba(255,255,255,0.08)';
            let txt = '#e2e8f0';

            if (isOk) {
              bg = 'radial-gradient(circle at 38% 32%, #86efac 0%, #4ade80 20%, #22c55e 50%, #15803d 100%)';
              border = 'rgba(34,197,94,0.8)';
              glow = '0 0 25px rgba(34,197,94,0.6), inset 0 -5px 12px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.2)';
              txt = '#ffffff';
            } else if (isBad) {
              bg = 'radial-gradient(circle at 38% 32%, #fca5a5 0%, #f87171 20%, #ef4444 50%, #b91c1c 100%)';
              border = 'rgba(239,68,68,0.8)';
              glow = '0 0 25px rgba(239,68,68,0.6), inset 0 -5px 12px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.15)';
              txt = '#ffffff';
            }

            return (
              <div key={crater.id} data-cid={crater.id} style={wrapStyle}
                onAnimationEnd={() => { if (isFalling) handleCraterAnimEnd(crater.id, crater.isCorrect); }}
                className="select-none">
                <div style={{
                  width: CRATER_SIZE,
                  height: CRATER_SIZE,
                  borderRadius: '50%',
                  background: bg,
                  border: `3px solid ${border}`,
                  boxShadow: glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center' as const,
                  overflow: 'hidden' as const,
                  animation: isFalling
                    ? 'lrqCraterBob 3s ease-in-out infinite'
                    : isOk  ? 'lrqCraterCorrect 0.45s ease-out forwards'
                    : isBad ? 'lrqCraterWrong 0.45s ease-out forwards'
                    : undefined,
                }}>
                  {/* Crater inner ring */}
                  <div className="absolute inset-[6px] rounded-full pointer-events-none" style={{
                    border: `1.5px solid ${isOk ? 'rgba(255,255,255,0.25)' : isBad ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }} />
                  {/* Specular highlight */}
                  <div className="absolute top-[8px] left-[12px] w-[18px] h-[10px] rounded-full pointer-events-none" style={{
                    background: `radial-gradient(ellipse, ${isOk ? 'rgba(255,255,255,0.35)' : isBad ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)'} 0%, transparent 100%)`,
                  }} />
                  <span style={{
                    color: txt,
                    fontWeight: 700,
                    fontSize: crater.text.length > 14 ? '8.5px' : crater.text.length > 10 ? '10px' : crater.text.length > 7 ? '11px' : '12px',
                    lineHeight: 1.25,
                    textAlign: 'center' as const,
                    maxWidth: `${Math.floor(CRATER_SIZE * 0.68)}px`,
                    wordBreak: 'break-word' as const,
                    overflowWrap: 'anywhere' as const,
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                    position: 'relative',
                    zIndex: 2,
                    display: 'block',
                  }}>
                    {crater.text}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Explosions */}
          {explosions.map(exp => (
            <div key={exp.id}>
              <div className="absolute pointer-events-none z-40" style={{
                left: exp.x, top: exp.y, width: 70, height: 70, borderRadius: '50%',
                background: exp.isCorrect
                  ? 'radial-gradient(circle, rgba(34,197,94,0.9) 0%, rgba(34,197,94,0.3) 50%, transparent 75%)'
                  : 'radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(239,68,68,0.3) 50%, transparent 75%)',
                animation: 'lrqExplosion 0.6s ease-out forwards',
              }} />
              <div className="absolute pointer-events-none z-40 rounded-full" style={{
                left: exp.x, top: exp.y, width: 50, height: 50,
                border: `2px solid ${exp.isCorrect ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'}`,
                background: 'transparent',
                animation: 'lrqExpRing 0.5s ease-out forwards',
              }} />
            </div>
          ))}

          {/* Score popups */}
          {scorePopups.map(pop => (
            <div key={pop.id} className="absolute z-50 pointer-events-none font-black text-xl"
              style={{ left: pop.x, top: pop.y, color: '#4ade80', animation: 'lrqScoreFloat 1.1s ease-out forwards', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
              +{pop.points}
            </div>
          ))}

          {/* Projectile */}
          {projPos && (
            <div className="absolute z-30 pointer-events-none" style={{
              left: projPos.x - 8,
              top: projPos.y - 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fef08a 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)',
              boxShadow: '0 0 12px 5px #fbbf24, 0 0 30px 12px rgba(245,158,11,0.5), 0 0 50px 20px rgba(245,158,11,0.2)',
              animation: 'lrqProjGlow 0.15s ease-in-out infinite',
            }} />
          )}

          {/* Cannon */}
          <div className="absolute bottom-0 left-1/2 z-20"
            style={{ transform: 'translateX(-50%)', animation: cannonFiring ? 'lrqCannonRecoil 0.3s ease-out' : undefined }}>

            {/* Smoke particles */}
            {cannonFiring && [0, 1, 2, 3, 4].map(i => (
              <div key={i} className="absolute rounded-full pointer-events-none"
                style={{
                  left: '50%',
                  top: '-30px',
                  width: 10 + i * 2,
                  height: 10 + i * 2,
                  marginLeft: -(5 + i),
                  background: 'rgba(180,180,180,0.4)',
                  animation: `lrqSmoke ${0.5 + i * 0.08}s ease-out forwards`,
                  animationDelay: `${i * 0.04}s`,
                  ['--sx' as any]: `${(i - 2) * 8}px`,
                }} />
            ))}

            {/* Muzzle flash */}
            {cannonFiring && (
              <div className="absolute pointer-events-none" style={{
                left: '50%', top: '-30px', width: 30, height: 30,
                background: 'radial-gradient(circle, rgba(254,240,138,0.9) 0%, rgba(251,191,36,0.6) 40%, transparent 70%)',
                animation: 'lrqMuzzleFlash 0.25s ease-out forwards',
              }} />
            )}

            {/* Barrel */}
            <div style={{
              transform: `rotate(${cannonAngle}deg)`,
              transformOrigin: 'center bottom',
              transition: 'transform 0.06s ease-out',
            }}>
              <div style={{
                width: 10, height: 50, margin: '0 auto',
                borderRadius: '4px 4px 0 0',
                background: 'linear-gradient(90deg, #374151, #6b7280 30%, #9ca3af 50%, #6b7280 70%, #374151)',
                boxShadow: 'inset 2px 0 3px rgba(255,255,255,0.15), inset -2px 0 3px rgba(0,0,0,0.4)',
              }} />
              <div style={{
                width: 16, height: 6, margin: '-2px auto 0',
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #1f2937, #4b5563 50%, #1f2937)',
              }} />
            </div>

            {/* Base */}
            <div style={{
              width: 50, height: 22, margin: '-1px auto 0',
              borderRadius: '12px 12px 0 0',
              background: 'linear-gradient(180deg, #6b7280, #4b5563 40%, #374151 70%, #1f2937)',
              boxShadow: '0 -2px 8px rgba(255,255,255,0.05), 0 4px 15px rgba(0,0,0,0.6)',
            }} />
            <div style={{
              width: 70, height: 10, margin: '-1px auto 0',
              borderRadius: '6px 6px 0 0',
              background: 'linear-gradient(180deg, #4b5563, #1f2937)',
            }} />
          </div>

          {craters.length === 0 && gameState === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-500 text-sm animate-pulse">Targets incoming...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    if (showResults) {
      return (
        <div className="flex-1 flex flex-col px-4 py-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-900">Game Review</h2>
            <button onClick={() => setShowResults(false)} className="px-4 py-2 rounded-lg bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors">
              Back to Score
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden mb-8">
            <div className="divide-y divide-stone-100">
              {questionResults.map((res, idx) => (
                <div key={idx} className={`p-4 sm:p-5 flex gap-4 ${res.isCorrect ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${res.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {res.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">{res.question.prompt}</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {res.question.answers.map((ans, i) => (
                        <div key={i} className={`px-3 py-2 rounded-lg text-sm border ${
                          i === res.question.correctIndex 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-800 font-medium'
                            : i === res.userAnswerIndex
                            ? 'bg-red-100 border-red-200 text-red-800 font-medium'
                            : 'bg-white border-stone-200 text-stone-600'
                        }`}>
                          {ans}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const totalAnswered = correctCount + (INITIAL_LIVES - lives);
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
            <div className="px-6 py-8 text-center" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-3">
                <span className="text-3xl">💥</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Game Over</h2>
              <div className="text-4xl font-black text-white mt-2 tabular-nums">{score.toLocaleString()}</div>
              <p className="text-white/60 text-sm mt-1">points</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: correctCount, label: 'Hits', color: 'text-green-600' },
                  { val: longestStreak, label: 'Best Streak', color: 'text-orange-500' },
                  { val: `${accuracy}%`, label: 'Accuracy', color: 'text-blue-600' },
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
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all">
                    💥 Play Again
                  </button>
                  <button onClick={handleNewTopic}
                    className="flex-1 py-3.5 rounded-xl bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 active:scale-[0.98] transition-all border border-stone-200">
                    {isPlayForFun ? 'Back to Menu' : 'New Topic'}
                  </button>
                </div>
                {questionResults.length > 0 && (
                  <button onClick={() => { setShowResults(true); window.scrollTo(0, 0); }}
                    className="w-full py-3 rounded-xl bg-white text-stone-700 font-semibold hover:bg-stone-50 active:scale-[0.98] transition-all border border-stone-200 shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Review Questions
                  </button>
                )}
                {user && !isPlayForFun && (
                  <>
                    {loadedFromSavedGame ? (
                      <div className="w-full py-3 rounded-xl font-medium border flex items-center justify-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700">
                        ✓ Already saved to Saved Tools — replay anytime
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
                          '✓ Saved to Saved Tools'
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      {!showMinimalUI && <Header onNavigate={onNavigate} user={user} onLogout={onLogout || (() => {})} currentPage="crater-blast" />}
      {showMinimalUI && (gameState === 'menu' || gameState === 'loading' || gameState === 'ready' || gameState === 'gameover') && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur border-b border-stone-200">
          <button onClick={() => onNavigate('dashboard')} className="p-2 -ml-2 text-stone-500 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-semibold text-stone-700">Crater Blast</span>
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

export default LightningReflexQuizPage;
