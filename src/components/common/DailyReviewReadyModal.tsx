const PROMPT_KEY_PREFIX = 'writescholar_daily_review_prompt_';
const STREAK_KEY_PREFIX = 'writescholar_daily_review_streak_';

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasCompletedDailyReviewToday(userId: string): boolean {
  try {
    const raw = localStorage.getItem(`${STREAK_KEY_PREFIX}${userId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { lastCompletedDate?: string };
    return parsed.lastCompletedDate === getTodayISO();
  } catch {
    return false;
  }
}

export function wasDailyReviewPromptShownToday(userId: string): boolean {
  try {
    return localStorage.getItem(`${PROMPT_KEY_PREFIX}${userId}`) === getTodayISO();
  } catch {
    return false;
  }
}

export function markDailyReviewPromptShown(userId: string): void {
  try {
    localStorage.setItem(`${PROMPT_KEY_PREFIX}${userId}`, getTodayISO());
  } catch {
    /* ignore */
  }
}

/** True when the user has at least one saved study pack (daily review source material). */
export async function userHasStudyPacks(): Promise<boolean> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${API_URL}/analysis/quiz-history?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;

    const data = await res.json().catch(() => null);
    const rows: unknown[] = Array.isArray(data) ? data : (data?.data ?? data?.quizzes ?? []);
    return rows.some(
      (row) => row && typeof row === 'object' && (row as { quiz_type?: string }).quiz_type === 'study_pack',
    );
  } catch {
    return false;
  }
}

function readReviewStreak(userId: string): number {
  try {
    const raw = localStorage.getItem(`${STREAK_KEY_PREFIX}${userId}`);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { currentStreak?: number; lastCompletedDate?: string };
    const today = getTodayISO();
    if (!parsed.lastCompletedDate) return 0;
    const last = new Date(parsed.lastCompletedDate);
    const now = new Date(today);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;
    return typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0;
  } catch {
    return 0;
  }
}

interface DailyReviewReadyModalProps {
  userName?: string;
  userId: string;
  onStart: () => void;
  onDismiss: () => void;
}

/** Once-per-day nudge when the user's daily review is ready. */
export default function DailyReviewReadyModal({
  userName,
  userId,
  onStart,
  onDismiss,
}: DailyReviewReadyModalProps) {
  const streak = readReviewStreak(userId);
  const greeting = userName ? `${userName}, your` : 'Your';

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[120] w-[min(100vw-2rem,20.5rem)] animate-[dailyReviewIn_0.4s_cubic-bezier(0.16,1,0.3,1)]"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="daily-review-ready-title"
        className="relative overflow-hidden rounded-2xl border-2 border-b-[4px] border-[#58CC02]/45 bg-white dark:bg-stone-900 shadow-[0_18px_40px_-18px_rgba(88,204,2,0.5),0_12px_28px_-16px_rgba(0,0,0,0.35)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-[#58CC02] via-[#7AE018] to-[#46A302]" aria-hidden />

        <div className="pointer-events-none absolute -top-10 -right-8 w-24 h-24 rounded-full bg-[#58CC02]/15 blur-2xl" aria-hidden />

        <div className="relative px-4 pt-3.5 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 border-[#58CC02]/40 bg-[#E5F8D0] shadow-[0_6px_14px_-8px_rgba(88,204,2,0.5)]">
              <video
                src="/dashboardlogo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E5F8D0] dark:bg-[#58CC02]/10 text-[#46A302] border border-[#58CC02]/30 text-[10px] font-extrabold uppercase tracking-[0.14em]">
                <span aria-hidden>🎯</span>
                Daily review
              </span>

              <h2
                id="daily-review-ready-title"
                className="mt-1.5 text-[15px] font-extrabold leading-snug tracking-tight text-stone-900 dark:text-stone-50"
              >
                {greeting} review is ready!
              </h2>

              <p className="mt-1 text-[12px] font-bold text-stone-500 dark:text-stone-400 leading-snug">
                10 quick questions · ~3 min
                {streak > 0 ? (
                  <>
                    {' · '}
                    <span className="text-[#46A302]">🔥 {streak}-day streak</span>
                  </>
                ) : null}
              </p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 -mt-0.5 -mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#58CC02] hover:bg-[#52BD02] text-white text-[12px] font-extrabold uppercase tracking-wide border-2 border-b-[3px] border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Start review
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-2 rounded-xl text-[12px] font-bold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dailyReviewIn {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
