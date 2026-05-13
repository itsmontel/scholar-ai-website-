import { useEffect, useState } from 'react';

interface DashboardWelcomeToastProps {
  /** Only show on the dashboard page. */
  currentPage: string;
  /** Logged-in user — must have completed onboarding. */
  user: {
    id?: string;
    firstName?: string;
    name?: string;
    onboardingCompleted?: boolean;
  } | null;
  /** True when the soft paywall is currently open — suppress the toast while it is. */
  paywallOpen: boolean;
  /** Navigate to the upload / analyze flow when the CTA is clicked. */
  onNavigate: (page: string) => void;
}

const SEEN_KEY_PREFIX = 'writescholar_welcome_toast_seen_';
// Short on purpose: the toast is a quick "welcome aboard" nudge, not a
// reading task. 4s gives the user enough time to register the greeting
// and notice the green CTA without lingering on screen.
const AUTO_HIDE_MS = 4_000;
const ENTRY_DELAY_MS = 700;

/**
 * Small Duolingo-style "welcome to the dashboard" toast that pops in the
 * bottom-right corner after a brand-new user finishes onboarding (and either
 * dismisses or completes the soft paywall). One-shot per user — persisted in
 * localStorage so it doesn't re-appear on later sessions.
 */
export const DashboardWelcomeToast: React.FC<DashboardWelcomeToastProps> = ({
  currentPage,
  user,
  paywallOpen,
  onNavigate,
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const seenKey = user?.id ? `${SEEN_KEY_PREFIX}${user.id}` : null;
  const firstName =
    user?.firstName?.trim() ||
    (user?.name?.trim() && !user.name.includes('@') ? user.name.trim().split(/\s+/)[0] ?? '' : '');

  // Gate: only on dashboard, only for onboarded users, only when paywall is closed,
  // and only if this user hasn't dismissed the toast before.
  useEffect(() => {
    if (currentPage !== 'dashboard') return;
    if (!user?.id || !user?.onboardingCompleted) return;
    if (paywallOpen) return;
    if (!seenKey) return;
    try {
      if (localStorage.getItem(seenKey) === '1') return;
    } catch {
      /* ignore */
    }

    const t = window.setTimeout(() => setVisible(true), ENTRY_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [currentPage, user?.id, user?.onboardingCompleted, paywallOpen, seenKey]);

  // Auto-hide after AUTO_HIDE_MS so it doesn't linger forever.
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => handleDismiss(), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const persistSeen = () => {
    if (!seenKey) return;
    try {
      localStorage.setItem(seenKey, '1');
    } catch {
      /* ignore */
    }
  };

  const handleDismiss = () => {
    setLeaving(true);
    persistSeen();
    window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 320);
  };

  const handleCta = () => {
    persistSeen();
    onNavigate('analyze');
  };

  if (!visible) return null;

  const greeting = firstName ? `You're in, ${firstName}!` : "You're in!";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9997] max-w-[360px] w-[calc(100vw-2.5rem)] sm:w-auto"
      style={{
        fontFamily: '"Nunito", system-ui, sans-serif',
        animation: leaving
          ? 'welcomeToastOut 0.3s cubic-bezier(0.4,0,1,1) forwards'
          : 'welcomeToastIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      {/* Soft halo behind the card for extra lift on the dashboard bg */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#A560E8]/20 via-[#58CC02]/10 to-[#FF9600]/15 blur-2xl opacity-70 pointer-events-none"
      />

      <div className="relative rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_22px_50px_-12px_rgba(124,58,237,0.42)] dark:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.75)] overflow-hidden">
        {/* Multi-colour Duolingo gradient stripe across the top */}
        <div
          aria-hidden
          className="h-1.5 bg-gradient-to-r from-[#58CC02] via-[#A560E8] to-[#FF9600]"
        />

        {/* Decorative sparkles inside the card — slow, low-opacity */}
        <span
          aria-hidden
          className="absolute top-5 left-[68px] text-[11px] opacity-70 animate-bounce"
          style={{ animationDuration: '2.6s' }}
        >
          ✨
        </span>
        <span
          aria-hidden
          className="absolute top-9 left-[92px] text-[8px] opacity-50 animate-bounce"
          style={{ animationDuration: '3.2s', animationDelay: '0.6s' }}
        >
          ⭐
        </span>

        {/* Close button */}
        <button
          type="button"
          aria-label="Dismiss welcome message"
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors border-2 border-b-[3px] border-transparent hover:border-stone-200 dark:hover:border-stone-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-4 pt-4 pr-3">
          <div className="flex items-start gap-3.5 pr-6">
            {/* Mascot tile — actual celebrating mascot image with a
                violet 3D border and soft gradient halo. Mirrors the
                Duolingo mascot-card pattern used elsewhere in the app
                (auth side panel, soft paywall, last-chance branch). */}
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#A560E8]/30 to-[#58CC02]/25 blur-md"
              />
              <div
                className="relative w-14 h-14 rounded-2xl border-2 border-b-[3px] flex items-center justify-center overflow-hidden bg-[#F3EAFF] dark:bg-[#A560E8]/15"
                style={{ borderColor: '#A560E8' }}
              >
                <img
                  src="/mascot-celebrating.webp"
                  alt=""
                  aria-hidden
                  width={56}
                  height={56}
                  className="object-contain w-12 h-12"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {/* Small green check badge bottom-right of the mascot */}
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#58CC02] border-2 border-b-[3px] border-[#46A302] text-white flex items-center justify-center shadow-md"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              {/* Welcome eyebrow badge — green Duolingo pill */}
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5F8D0] dark:bg-[#58CC02]/20 border border-[#46A302]/40 text-[#46A302] dark:text-[#58CC02] text-[9px] font-extrabold uppercase tracking-[0.16em]">
                  Welcome
                </span>
              </div>

              <p className="font-extrabold text-[15px] text-stone-800 dark:text-stone-100 leading-tight mb-1">
                {greeting}
              </p>
              <p className="text-[12.5px] font-bold text-stone-500 dark:text-stone-400 leading-snug">
                Drop in an essay or notes. Your first study pack is one click away.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCta}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white text-[12.5px] font-extrabold px-3.5 py-2 border-2 border-b-[3px] border-[#46A302] shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:border-b-2 transition-all"
                >
                  Get started
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[12px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 px-2 py-2 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes welcomeToastIn {
          0%   { opacity: 0; transform: translateY(22px) scale(0.9); }
          55%  { transform: translateY(-4px) scale(1.03); }
          80%  { transform: translateY(1px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes welcomeToastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(14px) scale(0.96); }
        }
      `}</style>
    </div>
  );
};

export default DashboardWelcomeToast;
