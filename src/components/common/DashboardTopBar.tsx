import { useEffect, useRef, useState } from 'react';
import { getResetsInText } from '../../utils/usageReset';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const POMODORO_STORAGE_KEY = 'writescholar_pomodoro';
const POMODORO_DEFAULT_WORK_MIN = 25;
const POMODORO_DEFAULT_BREAK_MIN = 5;
const POMODORO_WORK_PRESETS = [15, 25, 45, 60, 90] as const;
const POMODORO_BREAK_PRESETS = [5, 10, 15, 20] as const;

interface PomodoroState {
  mode: 'work' | 'break';
  endsAt: number | null; // epoch ms when current segment ends; null = paused
  remaining: number;     // seconds remaining when paused
  workMin: number;       // user-chosen work duration (minutes)
  breakMin: number;      // user-chosen break duration (minutes)
}

function clampMin(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(180, Math.max(1, Math.round(n)));
}

function loadPomodoro(): PomodoroState {
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) {
      return {
        mode: 'work',
        endsAt: null,
        remaining: POMODORO_DEFAULT_WORK_MIN * 60,
        workMin: POMODORO_DEFAULT_WORK_MIN,
        breakMin: POMODORO_DEFAULT_BREAK_MIN,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PomodoroState>;
    const workMin = clampMin(parsed.workMin as number, POMODORO_DEFAULT_WORK_MIN);
    const breakMin = clampMin(parsed.breakMin as number, POMODORO_DEFAULT_BREAK_MIN);
    const mode: 'work' | 'break' = parsed.mode === 'break' ? 'break' : 'work';
    return {
      mode,
      endsAt: typeof parsed.endsAt === 'number' ? parsed.endsAt : null,
      remaining: typeof parsed.remaining === 'number' ? parsed.remaining : (mode === 'work' ? workMin : breakMin) * 60,
      workMin,
      breakMin,
    };
  } catch {
    return {
      mode: 'work',
      endsAt: null,
      remaining: POMODORO_DEFAULT_WORK_MIN * 60,
      workMin: POMODORO_DEFAULT_WORK_MIN,
      breakMin: POMODORO_DEFAULT_BREAK_MIN,
    };
  }
}

function savePomodoro(s: PomodoroState) {
  try { localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function fmtMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

interface TopBarUsageStats {
  plan: string;
  uploadsRemaining: number;
  analysesRemaining: number;
  citationsRemaining: number;
  studyPacksRemaining: number;
  combinedActionsRemaining?: number;
  daysUntilReset?: number;
}

function usageLeftColor(n: number): string {
  if (n === -1) return 'text-[#8A48C7] dark:text-[#C9A0F0]';
  if (n <= 0) return 'text-red-600 dark:text-red-400';
  if (n <= 2) return 'text-amber-600 dark:text-amber-400';
  return 'text-[#8A48C7] dark:text-[#C9A0F0]';
}

function fmtUsageLeft(n: number): string {
  return n === -1 ? '∞' : String(n);
}

export default function DashboardTopBar({
  user,
  plan,
  onNavigate,
  onLogout,
  variant = 'dashboard',
}: {
  user?: Record<string, unknown> | null;
  plan: string;
  onNavigate: (page: string, slug?: string, options?: unknown) => void;
  onLogout?: () => void;
  /** Full bar on the documents dashboard; slim bar elsewhere. */
  variant?: 'dashboard' | 'compact';
}) {
  const isPaid = plan === 'pro' || plan === 'premium' || plan === 'focus';
  const isCompact = variant === 'compact';

  // ─── Usage stats (same /subscriptions/usage endpoint as Header) ─
  const [usageStats, setUsageStats] = useState<TopBarUsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingUsage(true);
      try {
        const res = await fetch(`${API_URL}/subscriptions/usage`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setUsageStats({
          plan: data.plan ?? 'free',
          uploadsRemaining: data.uploadsRemaining ?? 0,
          analysesRemaining: data.analysesRemaining ?? 0,
          citationsRemaining: data.citationsRemaining ?? 0,
          studyPacksRemaining: data.studyPacksRemaining ?? 0,
          combinedActionsRemaining: data.combinedActionsRemaining,
          daysUntilReset: data.daysUntilReset,
        });
      } catch { /* chip stays empty */ } finally {
        if (!cancelled) setLoadingUsage(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const usagePlan = (usageStats?.plan ?? plan).toLowerCase();
  const isPaidUsage = usagePlan === 'pro' || usagePlan === 'premium' || usagePlan === 'focus';
  const showCombined =
    isPaidUsage &&
    typeof usageStats?.combinedActionsRemaining === 'number';

  // ─── Login streak (powers the little 🔥N chip in the bar) ───
  const [loginStreak, setLoginStreak] = useState<{ currentStreak: number; hasActivityToday: boolean } | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${API_URL}/streaks`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (cancelled || !data?.data) return;
        setLoginStreak({
          currentStreak: data.data.currentStreak ?? 0,
          hasActivityToday: !!data.data.hasActivityToday,
        });
      } catch { /* chip stays hidden */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ─── Pomodoro state (persisted) ────────────────────────────────
  const [pomo, setPomo] = useState<PomodoroState>(() => loadPomodoro());
  const [, forceTick] = useState(0);
  const [pomoOpen, setPomoOpen] = useState(false);
  const pomoMenuRef = useRef<HTMLDivElement | null>(null);

  // 1Hz tick when running so the displayed remaining time updates.
  useEffect(() => {
    if (pomo.endsAt == null) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [pomo.endsAt]);

  // Auto-transition between work ↔ break when a segment finishes.
  // Fires a short audio chirp + browser notification (best-effort).
  useEffect(() => {
    if (pomo.endsAt == null) return;
    const msLeft = pomo.endsAt - Date.now();
    if (msLeft > 0) return;
    const nextMode = pomo.mode === 'work' ? 'break' : 'work';
    const nextSeconds = (nextMode === 'work' ? pomo.workMin : pomo.breakMin) * 60;
    const next: PomodoroState = { ...pomo, mode: nextMode, endsAt: null, remaining: nextSeconds };
    setPomo(next);
    savePomodoro(next);
    try {
      const AudioCtx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = nextMode === 'break' ? 660 : 880;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(); osc.stop(ctx.currentTime + 0.6);
      }
    } catch { /* sound failures are non-fatal */ }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(nextMode === 'break' ? 'Pomodoro complete' : 'Break over', {
          body: nextMode === 'break'
            ? `Take a ${pomo.breakMin}-minute break.`
            : `Back to work — ${pomo.workMin} minutes.`,
          silent: true,
        });
      }
    } catch { /* ignore */ }
  });

  // Close the Pomodoro popover on outside-click / Escape.
  useEffect(() => {
    if (!pomoOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pomoMenuRef.current && !pomoMenuRef.current.contains(e.target as Node)) setPomoOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPomoOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pomoOpen]);

  const displaySeconds = pomo.endsAt != null
    ? Math.max(0, Math.round((pomo.endsAt - Date.now()) / 1000))
    : pomo.remaining;
  const isRunning = pomo.endsAt != null;
  const segmentTotal = (pomo.mode === 'work' ? pomo.workMin : pomo.breakMin) * 60;
  const progress = 1 - (displaySeconds / segmentTotal);
  const pillColor = pomo.mode === 'work' ? '#A560E8' : '#58CC02';

  const togglePomo = () => {
    if (isRunning) {
      const remaining = displaySeconds;
      const next: PomodoroState = { ...pomo, endsAt: null, remaining };
      setPomo(next); savePomodoro(next);
    } else {
      const endsAt = Date.now() + displaySeconds * 1000;
      const next: PomodoroState = { ...pomo, endsAt, remaining: displaySeconds };
      setPomo(next); savePomodoro(next);
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          void Notification.requestPermission();
        }
      } catch { /* ignore */ }
    }
  };
  const resetPomo = () => {
    const remaining = (pomo.mode === 'work' ? pomo.workMin : pomo.breakMin) * 60;
    const next: PomodoroState = { ...pomo, endsAt: null, remaining };
    setPomo(next); savePomodoro(next);
  };
  const switchMode = (mode: 'work' | 'break') => {
    const remaining = (mode === 'work' ? pomo.workMin : pomo.breakMin) * 60;
    const next: PomodoroState = { ...pomo, mode, endsAt: null, remaining };
    setPomo(next); savePomodoro(next);
  };
  // Update the duration for the current (or specified) mode. Resets
  // the running segment so the new time takes effect immediately.
  const setDuration = (mode: 'work' | 'break', minutes: number) => {
    const m = clampMin(minutes, mode === 'work' ? POMODORO_DEFAULT_WORK_MIN : POMODORO_DEFAULT_BREAK_MIN);
    const newPomo: PomodoroState = {
      ...pomo,
      workMin: mode === 'work' ? m : pomo.workMin,
      breakMin: mode === 'break' ? m : pomo.breakMin,
    };
    if (pomo.mode === mode) {
      newPomo.endsAt = null;
      newPomo.remaining = m * 60;
    }
    setPomo(newPomo); savePomodoro(newPomo);
  };

  // ─── Avatar menu ──────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const fullName = typeof user?.name === 'string' ? user.name : '';
  const initials = (() => {
    const first = typeof user?.firstName === 'string' ? user.firstName : '';
    const last = typeof user?.lastName === 'string' ? user.lastName : '';
    if (first || last) return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}`.slice(0, 2) || '?';
    if (fullName) return fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
    const email = typeof user?.email === 'string' ? user.email : '';
    return (email[0] || '?').toUpperCase();
  })();

  const displayEmail = typeof user?.email === 'string' ? user.email : '';

  const displayUsername = (() => {
    const username = typeof user?.username === 'string' ? user.username.trim() : '';
    if (username) return username.startsWith('@') ? username.slice(1) : username;
    const first = typeof user?.firstName === 'string' ? user.firstName.trim() : '';
    if (first) return first;
    if (fullName) return fullName.split(/\s+/)[0] ?? 'Account';
    const email = typeof user?.email === 'string' ? user.email : '';
    return email.split('@')[0] || 'Account';
  })();

  const planBadgeLabel = (() => {
    if (usagePlan === 'premium') return 'Premium';
    if (usagePlan === 'focus') return 'Focus';
    if (usagePlan === 'pro') return 'Pro';
    return usagePlan.charAt(0).toUpperCase() + usagePlan.slice(1);
  })();

  return (
    <div className="inline-flex items-center gap-2 p-1.5 sm:p-2 rounded-[20px] bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border-2 border-stone-200/90 dark:border-stone-700 shadow-[0_14px_36px_-14px_rgba(40,30,60,0.28)]">
      {variant === 'dashboard' && (
        <>
          {/* Saved materials */}
          <button
            type="button"
            onClick={() => onNavigate('quiz-history')}
            className="group inline-flex items-center gap-2 pl-2.5 pr-3.5 sm:pl-3 sm:pr-4 h-10 sm:h-11 rounded-2xl bg-gradient-to-b from-[#FFD42E] to-[#FFC800] hover:from-[#FFDD55] hover:to-[#FFD52E] text-[#6B27A3] text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide border-2 border-b-[4px] border-[#C99800] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_6px_18px_-8px_rgba(255,200,0,0.6)]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6B27A3]/15">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </span>
            <span className="sm:hidden">Saved</span>
            <span className="hidden sm:inline">Saved Materials</span>
          </button>

          {/* Streak chip — mirrors the streak card in the dashboard */}
          {loginStreak && (
            <button
              type="button"
              onClick={() => onNavigate('account')}
              title={`${loginStreak.currentStreak}-day login streak`}
              className={`inline-flex items-center gap-1.5 px-3 h-10 sm:h-11 rounded-2xl text-[13px] sm:text-[14px] font-extrabold border-2 border-b-[3px] transition-all hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 ${
                loginStreak.hasActivityToday
                  ? 'bg-gradient-to-b from-[#FFE7B8] to-[#FFD888] text-[#B8530A] border-[#E08600] hover:from-[#FFEFCC] hover:to-[#FFDD99] shadow-[0_6px_16px_-8px_rgba(255,150,0,0.45)]'
                  : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:text-stone-700'
              }`}
            >
              <span className="text-[17px] leading-none" aria-hidden>{loginStreak.hasActivityToday ? '🔥' : '🕯️'}</span>
              <span className="tabular-nums">{loginStreak.currentStreak}</span>
            </button>
          )}
        </>
      )}

      {/* Upgrade (free) or plan badge (paid on compact pages) */}
      {!isPaid ? (
        <button
          type="button"
          onClick={() => onNavigate('pricing')}
          className="inline-flex items-center gap-1.5 px-3.5 h-10 sm:h-11 rounded-2xl bg-gradient-to-b from-[#65DC0F] to-[#58CC02] hover:from-[#6FEA15] hover:to-[#52BD02] text-white text-[12.5px] sm:text-[13px] font-extrabold uppercase tracking-wide border-2 border-b-[4px] border-[#3D8B00] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_6px_18px_-8px_rgba(88,204,2,0.55)]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Upgrade
        </button>
      ) : isCompact ? (
        <span className="inline-flex items-center gap-1.5 px-3.5 h-10 sm:h-11 rounded-2xl bg-gradient-to-b from-[#F3EAFF] to-[#E8D9FF] dark:from-[#A560E8]/25 dark:to-[#A560E8]/15 text-[#7733B5] dark:text-[#C9A0F0] text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#A560E8]/35">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14 2 9.4h7.6z" />
          </svg>
          {planBadgeLabel}
        </span>
      ) : null}

      {variant === 'dashboard' && (
        <>
          {/* Subtle divider before utility pills */}
          <span aria-hidden className="hidden sm:block w-px h-6 bg-stone-200 dark:bg-stone-700 mx-0.5" />

          {/* Pomodoro pill */}
          <div className="relative" ref={pomoMenuRef}>
        <button
          type="button"
          onClick={() => setPomoOpen((o) => !o)}
          title={`Pomodoro · ${pomo.mode === 'work' ? 'Focus' : 'Break'} · ${isRunning ? 'Running' : 'Paused'}`}
          className="inline-flex items-center gap-1.5 px-3 h-10 sm:h-11 rounded-2xl bg-white dark:bg-stone-800 text-[13px] sm:text-[14px] font-extrabold tabular-nums border-2 border-b-[3px] border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all"
          style={{ color: pillColor }}
        >
          {/* Progress ring + center dot indicating running state */}
          <span className="relative inline-flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="6" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                transform="rotate(-90 18 18)"
                strokeDasharray={`${Math.max(0, Math.min(1, progress)) * 94.247} 94.247`}
              />
            </svg>
            {isRunning && (
              <span
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: pillColor, boxShadow: `0 0 6px ${pillColor}` }}
                aria-hidden
              />
            )}
          </span>
          <span>{fmtMMSS(displaySeconds)}</span>
        </button>

        {pomoOpen && (
          <div className="absolute top-full right-0 mt-2 w-[300px] rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl p-4 z-50">
            {/* Mode tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 mb-3">
              {(['work', 'break'] as const).map((m) => {
                const active = pomo.mode === m;
                const min = m === 'work' ? pomo.workMin : pomo.breakMin;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold uppercase tracking-wider transition-colors ${
                      active
                        ? (m === 'work'
                            ? 'bg-[#A560E8] text-white'
                            : 'bg-[#58CC02] text-white')
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    {m === 'work' ? `Focus · ${min}m` : `Break · ${min}m`}
                  </button>
                );
              })}
            </div>

            {/* Big clock */}
            <p
              className="text-center font-extrabold tabular-nums leading-none"
              style={{ fontSize: '2.4rem', color: pillColor, fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              {fmtMMSS(displaySeconds)}
            </p>
            <p className="mt-1 text-center text-[11px] font-bold text-stone-500 dark:text-stone-400">
              {pomo.mode === 'work' ? 'Heads-down focus session' : 'Take a short break'}
            </p>

            {/* Duration presets — pick a quick length for the current mode */}
            <div className="mt-3.5">
              <p className="mb-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
                {pomo.mode === 'work' ? 'Focus length' : 'Break length'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(pomo.mode === 'work' ? POMODORO_WORK_PRESETS : POMODORO_BREAK_PRESETS).map((p) => {
                  const current = pomo.mode === 'work' ? pomo.workMin : pomo.breakMin;
                  const active = current === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDuration(pomo.mode, p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-all ${
                        active
                          ? 'text-white'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                      style={active ? { backgroundColor: pillColor, borderColor: pomo.mode === 'work' ? '#7733B5' : '#46A302' } : undefined}
                    >
                      {p}m
                    </button>
                  );
                })}

                {/* Custom input — accepts any 1–180 minute value */}
                <label className="inline-flex items-center gap-1 rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 focus-within:border-stone-400 dark:focus-within:border-stone-500">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={pomo.mode === 'work' ? pomo.workMin : pomo.breakMin}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n)) setDuration(pomo.mode, n);
                    }}
                    className="w-10 bg-transparent text-center tabular-nums font-extrabold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Custom minutes"
                  />
                  <span className="text-stone-400 dark:text-stone-500">m</span>
                </label>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePomo}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-[13px] font-extrabold uppercase tracking-wide border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all"
                style={{ backgroundColor: pillColor, borderColor: pomo.mode === 'work' ? '#7733B5' : '#46A302' }}
              >
                {isRunning ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M7 5v14l12-7z" /></svg>
                    Start
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetPomo}
                title="Reset"
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-2 border-stone-200 dark:border-stone-700 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold text-stone-400 dark:text-stone-500">
              {pomo.workMin} / {pomo.breakMin} Pomodoro · runs across pages, survives reload.
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Avatar menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className={
            isCompact
              ? 'inline-flex items-center gap-2 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 h-10 sm:h-11 max-w-[min(52vw,220px)] rounded-2xl bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-[12.5px] sm:text-[13px] font-extrabold border-2 border-b-[3px] border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all'
              : 'inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#B978F0] via-[#A560E8] to-[#7733B5] text-white text-[13px] sm:text-[14px] font-extrabold border-2 border-b-[4px] border-[#6B27A3] hover:-translate-y-0.5 active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_8px_22px_-10px_rgba(165,96,232,0.7)]'
          }
        >
          <span
            className={
              isCompact
                ? 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#B978F0] via-[#A560E8] to-[#7733B5] text-white text-[11px] font-extrabold'
                : ''
            }
          >
            {initials}
          </span>
          {isCompact && (
            <>
              <span className="truncate min-w-0">{displayUsername}</span>
              <svg className="w-3.5 h-3.5 shrink-0 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-[min(92vw,320px)] rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden z-50">
            {/* Profile header */}
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-br from-[#F3EAFF]/80 via-white to-white dark:from-[#A560E8]/10 dark:via-stone-900 dark:to-stone-900">
              {fullName && <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50 truncate">{fullName}</p>}
              {displayEmail && <p className="text-[11.5px] font-bold text-stone-500 dark:text-stone-400 truncate">{displayEmail}</p>}
              <span className="mt-1.5 inline-flex items-center rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8A48C7] dark:text-[#C9A0F0] capitalize">
                {usagePlan} plan
              </span>
            </div>

            {/* Monthly usage */}
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400 mb-2">This month</p>
              {loadingUsage ? (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
                  ))}
                </div>
              ) : usageStats ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 px-2.5 py-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Uploads</p>
                      <p className={`text-sm font-extrabold tabular-nums ${usageLeftColor(usageStats.uploadsRemaining)}`}>
                        {fmtUsageLeft(usageStats.uploadsRemaining)} <span className="text-[10px] font-bold text-stone-400">left</span>
                      </p>
                    </div>
                    {showCombined ? (
                      <div className="rounded-xl bg-[#F3EAFF]/60 dark:bg-[#A560E8]/15 border border-[#A560E8]/25 px-2.5 py-2">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Actions</p>
                        <p className={`text-sm font-extrabold tabular-nums ${usageLeftColor(usageStats.combinedActionsRemaining ?? 0)}`}>
                          {fmtUsageLeft(usageStats.combinedActionsRemaining ?? 0)} <span className="text-[10px] font-bold text-stone-400">left</span>
                        </p>
                        <p className="text-[8.5px] font-bold text-stone-400 leading-tight mt-0.5">Analyses · packs · cites</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 px-2.5 py-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Analyses</p>
                          <p className={`text-sm font-extrabold tabular-nums ${usageLeftColor(usageStats.analysesRemaining)}`}>
                            {fmtUsageLeft(usageStats.analysesRemaining)} <span className="text-[10px] font-bold text-stone-400">left</span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 px-2.5 py-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Citations</p>
                          <p className={`text-sm font-extrabold tabular-nums ${usageLeftColor(usageStats.citationsRemaining)}`}>
                            {fmtUsageLeft(usageStats.citationsRemaining)} <span className="text-[10px] font-bold text-stone-400">left</span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 px-2.5 py-2 col-span-2">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Study packs</p>
                          <p className={`text-sm font-extrabold tabular-nums ${usageLeftColor(usageStats.studyPacksRemaining)}`}>
                            {fmtUsageLeft(usageStats.studyPacksRemaining)} <span className="text-[10px] font-bold text-stone-400">left</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {usageStats.daysUntilReset != null && (
                    <p className="mt-2 text-center text-[10px] font-bold text-stone-400">
                      {getResetsInText(usageStats.daysUntilReset)}
                    </p>
                  )}
                  {!isPaidUsage && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onNavigate('pricing'); }}
                      className="mt-2.5 w-full py-2 rounded-xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-[11px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all"
                    >
                      Get more usage
                    </button>
                  )}
                </>
              ) : (
                <p className="text-[11px] font-bold text-stone-400">Couldn&apos;t load usage — try again later.</p>
              )}
            </div>

            {/* Account links */}
            <div className="py-1">
              {([
                { label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', page: 'account' },
                { label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', page: 'billing' },
                { label: 'Achievements', icon: 'M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 5 5 .5-3.75 3.5L18 17l-5-3-5 3 1.25-5L5.5 8.5l5-.5z', page: 'badges' },
                { label: 'Help & FAQ', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', page: 'help' },
              ] as const).map((item) => (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate(item.page); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
            {onLogout && (
              <>
                <div className="border-t border-stone-100 dark:border-stone-800" />
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
