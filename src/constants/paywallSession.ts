/** Legacy key; cleared on successful payment or logout. */
export const MANDATORY_CHECKOUT_PENDING_KEY = 'writescholar_mandatory_checkout_pending';

/** Set when user opens Stripe from the post-tutorial hard paywall; used to show trial choice after cancel. */
export const CHECKOUT_FROM_TUTORIAL_PAYWALL_KEY = 'writescholar_checkout_from_tutorial_paywall';

/**
 * localStorage: user dismissed, forfeited, or left for Stripe from the post-tutorial cancel modal — do not show again.
 */
export const TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY = 'writescholar_tutorial_checkout_cancel_modal_resolved';

/** @deprecated legacy key — treated same as RESOLVED in reads */
export const TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY = 'writescholar_tutorial_checkout_cancel_modal_seen';

/**
 * sessionStorage: post-tutorial Stripe cancel — modal must stay open until resolved (survives refresh).
 */
export const STRIPE_CANCEL_TRIAL_MODAL_PENDING_KEY = 'writescholar_stripe_cancel_trial_modal_pending';

/** True if user already finished the tutorial cancel flow (legacy "seen" counts as resolved). */
export function isTutorialCheckoutCancelModalResolved(): boolean {
  try {
    if (localStorage.getItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_RESOLVED_KEY) === '1') return true;
    if (localStorage.getItem(TUTORIAL_CHECKOUT_CANCEL_MODAL_SEEN_KEY) === '1') return true;
    return false;
  } catch {
    return false;
  }
}

/** Last Pro/Premium choice when opening checkout from tutorial paywall (restore on Stripe cancel modal). */
export const LAST_TUTORIAL_CHECKOUT_PLAN_KEY = 'writescholar_last_tutorial_checkout_plan';

/** Soft (API-limit) paywall was open — restore after refresh until dismissed or user upgrades. */
export const SOFT_PAYWALL_OPEN_KEY = 'writescholar_soft_paywall_open';

/**
 * sessionStorage: user explicitly dismissed the soft paywall — do NOT re-open in this session,
 * even if subsequent API calls return upgrade/limit flags.  Cleared on logout or new session.
 */
export const SOFT_PAYWALL_DISMISSED_KEY = 'writescholar_soft_paywall_dismissed';

/**
 * localStorage: timestamp (ms since epoch) of the most recent soft-paywall
 * dismissal. Persists across logout / new sessions / device-side refreshes.
 * Used to enforce a weekly cooldown so free users aren't slammed with the
 * paywall every login.
 */
export const SOFT_PAYWALL_DISMISSED_AT_KEY = 'writescholar_soft_paywall_dismissed_at';

/** Cooldown window — how long after a dismissal we stay quiet (free users). */
export const SOFT_PAYWALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Returns true if the user dismissed the soft paywall less than 7 days ago. */
export function isSoftPaywallOnCooldown(): boolean {
  try {
    const raw = localStorage.getItem(SOFT_PAYWALL_DISMISSED_AT_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || ts <= 0) return false;
    return Date.now() - ts < SOFT_PAYWALL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/** Marks the soft paywall as dismissed right now. Survives logout. */
export function markSoftPaywallDismissedNow(): void {
  try {
    localStorage.setItem(SOFT_PAYWALL_DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Post–activation tutorial hard paywall (Analysis page) — restore after refresh until checkout or dismiss. */
export const POST_ACTIVATION_PAYWALL_PENDING_KEY = 'writescholar_post_activation_paywall_pending';

/**
 * localStorage: set when the user has seen the Last-chance branch of
 * the soft paywall at least once. The Last-chance pitch is a one-shot
 * goodwill offer tied to first-time onboarding — after the user has
 * seen it (and either converted or dismissed), every subsequent
 * dismissal of the regular soft paywall skips Last-chance and closes
 * straight to the dashboard. Survives logout.
 */
export const LAST_CHANCE_PAYWALL_SHOWN_KEY = 'writescholar_last_chance_paywall_shown';

/**
 * localStorage: set once the user has been shown — and either
 * dismissed or proceeded to checkout from — the first post-onboarding
 * soft paywall with the NEWCUSTOMER welcome discount on it. Subsequent
 * soft paywalls read this flag and skip the one-shot extras ("Save $X
 * today only" urgency badge + Last-chance pop-up). The NEWCUSTOMER
 * first-month price itself remains visible for as long as the user is
 * still eligible (never trialed or subscribed) so the paywall matches
 * the pricing / billing pages.
 */
export const FIRST_PAYWALL_DISCOUNT_SHOWN_KEY = 'writescholar_first_paywall_discount_shown';

/**
 * localStorage: ms-since-epoch timestamp recorded when the user
 * finishes onboarding. Used by the dashboard's post-onboarding
 * soft-paywall trigger to compute "has 7 days elapsed since
 * onboarding?" — the fallback fire condition if the user never
 * creates an analysis or study pack.
 */
export const ONBOARDING_COMPLETED_AT_KEY = 'writescholar_onboarding_completed_at';

/**
 * localStorage: set when the first post-onboarding soft paywall
 * has fired (via either the "first analysis/study pack" trigger or
 * the 7-day fallback). After this is set, the dashboard's trigger
 * effect stays silent — all subsequent soft-paywall fires go
 * through the existing weekly-cooldown / restore-on-refresh paths.
 */
export const FIRST_SOFT_PAYWALL_FIRED_KEY = 'writescholar_first_soft_paywall_fired';

/** 7 days in ms — fallback window for the post-onboarding paywall
 *  trigger when the user hasn't actually used the product yet. */
export const POST_ONBOARDING_PAYWALL_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * localStorage: one-shot flag — the dashboard's first-run fast path
 * (auto-open the analyze tab + focus the essay box right after
 * onboarding) has already fired. Prevents yanking returning users
 * into the essay box on every visit.
 */
export const FIRST_RUN_FAST_PATH_DONE_KEY = 'writescholar_first_run_fast_path_done';

/** Per-user key — shared browsers must not block a new account's fast path. */
export function onboardingCompletedAtKey(userId: string): string {
  return `${ONBOARDING_COMPLETED_AT_KEY}_${userId}`;
}

export function firstRunFastPathDoneKey(userId: string): string {
  return `${FIRST_RUN_FAST_PATH_DONE_KEY}_${userId}`;
}

/** Record (or refresh) when this user finished onboarding. Always overwrites
 *  so re-onboarding or a second account on the same browser gets a fresh
 *  10-minute fast-path window. */
export function stampOnboardingCompletedAt(userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(onboardingCompletedAtKey(userId), String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function getOnboardingCompletedAt(userId: string): number {
  if (!userId) return 0;
  try {
    const ts = Number(localStorage.getItem(onboardingCompletedAtKey(userId)) || 0);
    return Number.isFinite(ts) && ts > 0 ? ts : 0;
  } catch {
    return 0;
  }
}

export function isFirstRunFastPathDone(userId: string): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(firstRunFastPathDoneKey(userId)) === '1';
  } catch {
    return true;
  }
}

export function markFirstRunFastPathDone(userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(firstRunFastPathDoneKey(userId), '1');
  } catch {
    /* ignore */
  }
}

/**
 * sessionStorage: set when the user lands via /dashboard?upgrade=1
 * (preview follow-up email CTA). Survives the login redirect so the
 * soft paywall can open once they're authenticated. Cleared after
 * the paywall fires or if they're already on a paid plan.
 */
export const EMAIL_UPGRADE_PENDING_KEY = 'writescholar_email_upgrade_pending';
