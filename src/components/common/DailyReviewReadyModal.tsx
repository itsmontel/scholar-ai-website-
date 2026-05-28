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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/55 backdrop-blur-sm animate-[fadeIn_0.35s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-review-ready-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-b-[5px] border-[#58CC02]/45 bg-white dark:bg-stone-900 shadow-[0_28px_60px_-24px_rgba(88,204,2,0.45)] animate-[slideUp_0.45s_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="h-2 bg-gradient-to-r from-[#58CC02] via-[#7AE018] to-[#46A302]" aria-hidden />

        <div className="pointer-events-none absolute -top-12 -right-10 w-36 h-36 rounded-full bg-[#58CC02]/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 -left-8 w-28 h-28 rounded-full bg-[#FFC800]/12 blur-2xl" aria-hidden />

        <div className="relative p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full overflow-hidden border-[3px] border-[#58CC02]/40 bg-[#E5F8D0] shadow-[0_8px_22px_-10px_rgba(88,204,2,0.45)]">
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E5F8D0] dark:bg-[#58CC02]/10 text-[#46A302] border-2 border-[#58CC02]/30 text-[11px] font-extrabold uppercase tracking-[0.16em] mb-3">
            <span aria-hidden>🎯</span>
            Daily review ready
          </span>

          <h2
            id="daily-review-ready-title"
            className="text-2xl sm:text-[1.75rem] font-extrabold leading-tight tracking-tight text-stone-900 dark:text-stone-50"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {greeting} daily review is ready!
          </h2>

          <p className="mt-2.5 text-sm sm:text-[15px] font-bold text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
            10 quick questions from your study materials. Takes about 3 minutes and keeps your streak alive.
          </p>

          {streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E5F8D0] border-2 border-[#58CC02]/35">
              <span className="text-xl leading-none" aria-hidden>🔥</span>
              <span className="text-sm font-extrabold text-[#46A302]">{streak}-day streak — don&apos;t break it!</span>
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#52BD02] text-white text-sm sm:text-base font-extrabold uppercase tracking-wide border-2 border-b-[4px] border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_10px_24px_-12px_rgba(88,204,2,0.65)]"
            >
              Start review
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-5 py-3 rounded-2xl text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
