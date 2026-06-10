import { useEffect, useState, useCallback } from 'react';
import {
  SOFT_PAYWALL_OPEN_KEY,
  SOFT_PAYWALL_DISMISSED_KEY,
  SOFT_PAYWALL_DISMISSED_AT_KEY,
  SOFT_PAYWALL_COOLDOWN_MS,
  LAST_CHANCE_PAYWALL_SHOWN_KEY,
  FIRST_PAYWALL_DISCOUNT_SHOWN_KEY,
  FIRST_SOFT_PAYWALL_FIRED_KEY,
  ONBOARDING_COMPLETED_AT_KEY,
  POST_ONBOARDING_PAYWALL_FALLBACK_MS,
  isSoftPaywallOnCooldown,
} from '../../constants/paywallSession';

interface PaywallDebugPanelProps {
  /** Logged-in user — panel hidden on logged-out / public pages. */
  user: {
    id?: string;
    plan?: string;
    onboardingCompleted?: boolean;
  } | null;
  /** Live value of the app's apiLimitPaywallOpen state. */
  paywallOpen: boolean;
  /** Current page so we can skip panel on landing/login/etc. */
  currentPage: string;
}

const HIDDEN_PAGES = new Set([
  'landing',
  'login',
  'signup',
  'auth-callback',
  'reset-password',
  'email-verification',
  'privacy',
  'terms',
  'help',
  'blog',
  'blog-post',
  'about',
  'features',
  'pricing',
  'contact',
  'programmatic',
  'press',
  'embed',
  'unsubscribe',
  'unlock-quiz',
]);

const PANEL_COLLAPSED_KEY = 'writescholar_paywall_debug_collapsed';

function fmtRemaining(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Dev-only diagnostic panel (bottom-left). Surfaces the live state of every
 * gate that decides whether the soft paywall opens after onboarding, and
 * exposes one-click resets so you can replay the flow without waiting out
 * the 7-day cooldown or clearing localStorage by hand.
 *
 * Rendered only when import.meta.env.DEV is true — never ships to prod.
 */
export const PaywallDebugPanel: React.FC<PaywallDebugPanelProps> = ({ user, paywallOpen, currentPage }) => {
  const [, setTick] = useState(0);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(PANEL_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Re-render every second so the cooldown countdown stays live.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Re-render on storage events (in case another tab resets state).
  useEffect(() => {
    const onStorage = () => setTick((n) => n + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      sessionStorage.setItem(PANEL_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  // Reset / trigger handlers ------------------------------------------------
  const resetCooldown = () => {
    try {
      localStorage.removeItem(SOFT_PAYWALL_DISMISSED_AT_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_DISMISSED_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_OPEN_KEY);
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] cooldown + dismissal flags cleared');
  };

  const resetLastChance = () => {
    try {
      localStorage.removeItem(LAST_CHANCE_PAYWALL_SHOWN_KEY);
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] last-chance "shown" flag cleared');
  };

  const resetWelcomeDiscount = () => {
    try {
      localStorage.removeItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY);
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] welcome-discount flag cleared — next paywall renders the discount UI');
  };

  const resetFirstFired = () => {
    try {
      localStorage.removeItem(FIRST_SOFT_PAYWALL_FIRED_KEY);
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] first-fired flag cleared — dashboard trigger can fire again');
  };

  const backdateOnboarding = () => {
    try {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      localStorage.setItem(ONBOARDING_COMPLETED_AT_KEY, String(eightDaysAgo));
      // Also clear the one-shot fired flag so the 7-day fallback can fire.
      localStorage.removeItem(FIRST_SOFT_PAYWALL_FIRED_KEY);
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] onboarding timestamp backdated 8 days — 7-day fallback now eligible');
  };

  // ─── One-click preview helpers ────────────────────────────────────
  // Both clear the cooldown + dismissal gates so the paywall actually
  // opens, then dispatch the listener event after a 50ms beat so the
  // storage writes have flushed before the listener reads them.

  const previewDiscountPaywall = () => {
    try {
      // Welcome-discount flag cleared ⇒ showDiscount = true at mount.
      localStorage.removeItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY);
      // Open the gates so the listener fires.
      localStorage.removeItem(SOFT_PAYWALL_DISMISSED_AT_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_DISMISSED_KEY);
      sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] preview: DISCOUNT paywall (NEWCUSTOMER + Save badge + strike price)');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('writescholar-open-paywall'));
    }, 50);
  };

  const previewPlainPaywall = () => {
    try {
      // Welcome-discount flag SET ⇒ showDiscount = false at mount, so
      // the plain-price BRANCH 3 variant renders.
      localStorage.setItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY, '1');
      // Open the gates so the listener fires.
      localStorage.removeItem(SOFT_PAYWALL_DISMISSED_AT_KEY);
      sessionStorage.removeItem(SOFT_PAYWALL_DISMISSED_KEY);
      sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] preview: PLAIN paywall ($19.99 Pro / $39.99 Premium, no discount UI)');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('writescholar-open-paywall'));
    }, 50);
  };

  const triggerPaywall = () => {
    console.log('[paywall-debug] dispatching writescholar-open-paywall');
    // Set the open flag so the listener doesn't bail early.
    try {
      sessionStorage.setItem(SOFT_PAYWALL_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('writescholar-open-paywall'));
  };

  const forceTriggerPaywall = () => {
    // Reset cooldown + dismissal then fire. Always opens.
    resetCooldown();
    // Small delay so the gates clear before the listener runs.
    window.setTimeout(triggerPaywall, 50);
  };

  const resetOnboardingLocal = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        console.warn('[paywall-debug] no `user` in localStorage to reset');
        return;
      }
      const parsed = JSON.parse(raw);
      parsed.onboardingCompleted = false;
      parsed.welcomeTutorialCompleted = false;
      localStorage.setItem('user', JSON.stringify(parsed));
      // Wipe the welcome-toast dismissal too so we can see it again.
      Object.keys(localStorage)
        .filter((k) => k.startsWith('writescholar_welcome_toast_seen_'))
        .forEach((k) => localStorage.removeItem(k));
      // Reset Last-chance + welcome-discount + first-fired + onboarding
      // timestamp so the user can replay the full onboarding → first
      // analysis/study pack → soft paywall (with discount) → Last-chance
      // → dashboard sequence end-to-end.
      try {
        localStorage.removeItem(LAST_CHANCE_PAYWALL_SHOWN_KEY);
        localStorage.removeItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY);
        localStorage.removeItem(FIRST_SOFT_PAYWALL_FIRED_KEY);
        localStorage.removeItem(ONBOARDING_COMPLETED_AT_KEY);
      } catch {
        /* ignore */
      }
      console.log('[paywall-debug] local onboardingCompleted cleared — reloading');
      window.location.reload();
    } catch (e) {
      console.error('[paywall-debug] resetOnboardingLocal failed', e);
    }
  };

  const resetWelcomeToast = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('writescholar_welcome_toast_seen_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setTick((n) => n + 1);
    console.log('[paywall-debug] welcome-toast dismissal cleared');
  };

  // Hide on logged-out + public pages
  if (!user?.id) return null;
  if (HIDDEN_PAGES.has(currentPage)) return null;

  // Live state read --------------------------------------------------------
  let dismissedAt = 0;
  try {
    const raw = localStorage.getItem(SOFT_PAYWALL_DISMISSED_AT_KEY);
    if (raw) dismissedAt = Number(raw) || 0;
  } catch {
    /* ignore */
  }
  const cooldownRemainingMs = dismissedAt > 0 ? Math.max(0, SOFT_PAYWALL_COOLDOWN_MS - (Date.now() - dismissedAt)) : 0;
  const onCooldown = isSoftPaywallOnCooldown();
  let dismissedThisSession = false;
  let openFlag = false;
  let lastChanceShown = false;
  let welcomeDiscountConsumed = false;
  let firstFired = false;
  let onboardedAt = 0;
  try {
    dismissedThisSession = sessionStorage.getItem(SOFT_PAYWALL_DISMISSED_KEY) === '1';
    openFlag = sessionStorage.getItem(SOFT_PAYWALL_OPEN_KEY) === '1';
    lastChanceShown = localStorage.getItem(LAST_CHANCE_PAYWALL_SHOWN_KEY) === '1';
    welcomeDiscountConsumed = localStorage.getItem(FIRST_PAYWALL_DISCOUNT_SHOWN_KEY) === '1';
    firstFired = localStorage.getItem(FIRST_SOFT_PAYWALL_FIRED_KEY) === '1';
    const rawOnboarded = localStorage.getItem(ONBOARDING_COMPLETED_AT_KEY);
    if (rawOnboarded) onboardedAt = Number(rawOnboarded) || 0;
  } catch {
    /* ignore */
  }
  const fallbackRemainingMs = onboardedAt > 0
    ? Math.max(0, POST_ONBOARDING_PAYWALL_FALLBACK_MS - (Date.now() - onboardedAt))
    : 0;
  const fallbackEligible = onboardedAt > 0 && fallbackRemainingMs === 0;
  const plan = (user.plan || 'free').toLowerCase();
  const planIsPaid = plan === 'pro' || plan === 'premium';

  // Collapsed pill ---------------------------------------------------------
  if (collapsed) {
    const dotColor = paywallOpen
      ? '#A560E8' // paywall open
      : planIsPaid
        ? '#1CB0F6' // paid — paywall won't fire
        : onCooldown
          ? '#FF9600' // cooldown blocking
          : '#58CC02'; // ready to fire
    return (
      <button
        type="button"
        onClick={() => persistCollapsed(false)}
        className="fixed bottom-4 left-4 z-[9996] inline-flex items-center gap-2 rounded-full bg-white dark:bg-stone-900 border-2 border-b-[3px] border-stone-200 dark:border-stone-700 pl-2 pr-3 py-1.5 shadow-md hover:shadow-lg transition-all"
        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
        aria-label="Open paywall debug panel"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden />
        <span className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200 tracking-wide">DEV · Paywall</span>
      </button>
    );
  }

  // Expanded panel ---------------------------------------------------------
  return (
    <div
      className="fixed bottom-4 left-4 z-[9996] w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-xl"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
      role="region"
      aria-label="Paywall debug panel"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-violet-600 dark:text-violet-400">
            Dev · Paywall flow
          </span>
        </div>
        <button
          type="button"
          onClick={() => persistCollapsed(true)}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Collapse panel"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 space-y-2 text-[11.5px] font-bold">
        <Row label="Page" value={currentPage} />
        <Row label="Plan" value={plan} valueClass={planIsPaid ? 'text-[#1CB0F6]' : 'text-stone-700 dark:text-stone-200'} />
        <Row
          label="Onboarding"
          value={user.onboardingCompleted ? 'done' : 'pending'}
          valueClass={user.onboardingCompleted ? 'text-[#58CC02]' : 'text-[#FF9600]'}
        />
        <Row
          label="Paywall open"
          value={paywallOpen ? 'YES' : 'no'}
          valueClass={paywallOpen ? 'text-[#A560E8]' : 'text-stone-500'}
        />
        <Row
          label="Session dismiss"
          value={dismissedThisSession ? 'set' : '—'}
          valueClass={dismissedThisSession ? 'text-[#FF4B4B]' : 'text-stone-500'}
        />
        <Row
          label="Open flag"
          value={openFlag ? 'set' : '—'}
          valueClass={openFlag ? 'text-[#58CC02]' : 'text-stone-500'}
        />
        <Row
          label="7-day cooldown"
          value={onCooldown ? `${fmtRemaining(cooldownRemainingMs)} left` : 'clear'}
          valueClass={onCooldown ? 'text-[#FF9600]' : 'text-[#58CC02]'}
        />
        <Row
          label="Last-chance seen"
          value={lastChanceShown ? 'yes' : 'no'}
          valueClass={lastChanceShown ? 'text-[#FF4B4B]' : 'text-[#58CC02]'}
        />
        <Row
          label="NEWCUSTOMER discount"
          value={welcomeDiscountConsumed ? 'consumed' : 'available'}
          valueClass={welcomeDiscountConsumed ? 'text-[#FF4B4B]' : 'text-[#58CC02]'}
        />
        <Row
          label="First fired"
          value={firstFired ? 'yes' : 'no'}
          valueClass={firstFired ? 'text-[#FF4B4B]' : 'text-[#58CC02]'}
        />
        <Row
          label="Onboarded"
          value={onboardedAt > 0 ? `${fmtRemaining(Date.now() - onboardedAt)} ago` : '—'}
          valueClass={onboardedAt > 0 ? 'text-stone-700 dark:text-stone-200' : 'text-stone-500'}
        />
        <Row
          label="7-day fallback"
          value={
            onboardedAt === 0
              ? '—'
              : fallbackEligible
                ? 'eligible'
                : `${fmtRemaining(fallbackRemainingMs)} left`
          }
          valueClass={
            onboardedAt === 0
              ? 'text-stone-500'
              : fallbackEligible
                ? 'text-[#58CC02]'
                : 'text-[#FF9600]'
          }
        />
      </div>

      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {/* Instant previews — one click each. Use these for visual QA. */}
        <DebugBtn label="Preview discount" tone="violet" onClick={previewDiscountPaywall} />
        <DebugBtn label="Preview plain" tone="blue" onClick={previewPlainPaywall} />
        {/* Gate-respecting + utility buttons below */}
        <DebugBtn label="Trigger paywall" tone="green" onClick={triggerPaywall} />
        <DebugBtn label="Force trigger" tone="orange" onClick={forceTriggerPaywall} />
        <DebugBtn label="Reset cooldown" tone="violet" onClick={resetCooldown} />
        <DebugBtn label="Reset welcome" tone="blue" onClick={resetWelcomeToast} />
        <DebugBtn label="Reset last-chance" tone="orange" onClick={resetLastChance} />
        <DebugBtn label="Reset NEWCUSTOMER" tone="green" onClick={resetWelcomeDiscount} />
        <DebugBtn label="Reset first fired" tone="violet" onClick={resetFirstFired} />
        <DebugBtn label="Backdate onboarding -8d" tone="blue" onClick={backdateOnboarding} />
        <DebugBtn
          label="Reset onboarding (full replay)"
          tone="red"
          onClick={resetOnboardingLocal}
          className="col-span-2"
        />
      </div>

      <p className="px-4 pb-3 text-[10px] font-bold text-stone-400 dark:text-stone-500 leading-snug">
        Dev-only — never renders in prod. Watch the console for{' '}
        <code className="font-mono">[soft-paywall]</code> traces.
      </p>
    </div>
  );
};

// Small helpers ------------------------------------------------------------
const Row: React.FC<{ label: string; value: string; valueClass?: string }> = ({ label, value, valueClass }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider text-[10px]">{label}</span>
    <span className={`tabular-nums ${valueClass || 'text-stone-700 dark:text-stone-200'}`}>{value}</span>
  </div>
);

const TONE_CLASSES: Record<string, { bg: string; hover: string; border: string }> = {
  violet: { bg: 'bg-[#A560E8]', hover: 'hover:bg-[#8A48C7]', border: 'border-[#8A48C7]' },
  green: { bg: 'bg-[#58CC02]', hover: 'hover:bg-[#46A302]', border: 'border-[#46A302]' },
  orange: { bg: 'bg-[#FF9600]', hover: 'hover:bg-[#D97F00]', border: 'border-[#D97F00]' },
  red: { bg: 'bg-[#FF4B4B]', hover: 'hover:bg-[#D93B3B]', border: 'border-[#D93B3B]' },
  blue: { bg: 'bg-[#1CB0F6]', hover: 'hover:bg-[#1899D6]', border: 'border-[#1899D6]' },
};

const DebugBtn: React.FC<{
  label: string;
  tone: keyof typeof TONE_CLASSES;
  onClick: () => void;
  className?: string;
}> = ({ label, tone, onClick, className = '' }) => {
  const t = TONE_CLASSES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-extrabold text-white rounded-lg border-2 border-b-[3px] active:border-b-2 active:translate-y-px transition-all px-2 py-1.5 ${t.bg} ${t.hover} ${t.border} ${className}`}
    >
      {label}
    </button>
  );
};

export default PaywallDebugPanel;
