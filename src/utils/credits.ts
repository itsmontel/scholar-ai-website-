/**
 * Credit balance as returned by GET /subscriptions/usage (`credits`).
 * See backend/src/services/creditService.js.
 */
export interface CreditState {
  plan: string;
  isTrial: boolean;
  isPaused: boolean;
  cancelAtPeriodEnd: boolean;
  /** Credits granted for this period (3 on the trial, 99 Pro, 199 Premium, 0 if it started paused). */
  allowance: number;
  /** Credits carried in from earlier periods. */
  rollover: number;
  /** allowance + rollover, never above cap. */
  total: number;
  used: number;
  remaining: number;
  cap: number;
  /** Credits added at the next renewal (0 when paused or cancelling). */
  nextTopUp: number;
  /** Credits that won't carry over at renewal (cap reached, or plan ending). */
  wouldLoseAtRenewal: number;
  periodEnd: string | null;
  daysUntilReset: number | null;
  trialCredits: number;
  trialDays: number;
  /** Free accounts: credits granted for the free week (0 once they have had a trial or plan). */
  freeCredits: number;
  freeCreditDays: number;
  /** When the free credits stop working. null when there are none. */
  freeExpiresAt: string | null;
  freeDaysLeft: number | null;
  freeExpired: boolean;
}

/** Fired after anything that spends a credit, so counters refresh. */
export const CREDITS_CHANGED_EVENT = 'writescholar-credits-changed';

export function notifyCreditsChanged() {
  try {
    window.dispatchEvent(new CustomEvent(CREDITS_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function parseCreditState(raw: unknown): CreditState | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  return {
    plan: typeof c.plan === 'string' ? c.plan : 'free',
    isTrial: c.isTrial === true,
    isPaused: c.isPaused === true,
    cancelAtPeriodEnd: c.cancelAtPeriodEnd === true,
    allowance: num(c.allowance),
    rollover: num(c.rollover),
    total: num(c.total),
    used: num(c.used),
    remaining: num(c.remaining),
    cap: num(c.cap, 499),
    nextTopUp: num(c.nextTopUp),
    wouldLoseAtRenewal: num(c.wouldLoseAtRenewal),
    periodEnd: typeof c.periodEnd === 'string' ? c.periodEnd : null,
    daysUntilReset: typeof c.daysUntilReset === 'number' ? c.daysUntilReset : null,
    trialCredits: num(c.trialCredits, 3),
    trialDays: num(c.trialDays, 3),
    freeCredits: num(c.freeCredits),
    freeCreditDays: num(c.freeCreditDays, 7),
    freeExpiresAt: typeof c.freeExpiresAt === 'string' ? c.freeExpiresAt : null,
    freeDaysLeft: typeof c.freeDaysLeft === 'number' ? c.freeDaysLeft : null,
    freeExpired: c.freeExpired === true,
  };
}

/** "6 days left" / "1 day left" / "Last day" for the free week. */
export function freeDaysLeftLabel(credits: Pick<CreditState, 'freeDaysLeft' | 'freeExpiresAt'>): string | null {
  if (!credits.freeExpiresAt || credits.freeDaysLeft == null) return null;
  const msLeft = Date.parse(credits.freeExpiresAt) - Date.now();
  if (Number.isFinite(msLeft) && msLeft > 0 && msLeft < 24 * 60 * 60 * 1000) return 'Last day';
  return credits.freeDaysLeft === 1 ? '1 day left' : `${credits.freeDaysLeft} days left`;
}

/** "Nov 3" */
export function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isPaidCreditPlan(plan: string): boolean {
  const p = plan.toLowerCase();
  return p === 'pro' || p === 'premium';
}

const CREDIT_SPENDING_PATH = /\/analysis\/(analyze|citation-search|citation-review|generate-study-pack)(\?|$)/;
let observerInstalled = false;

/**
 * Refresh credit counters after any request that spends a credit,
 * wherever in the app it was made (analyzer, study packs, citations,
 * editor panels). Watches fetch once; never touches the response.
 */
export function installCreditSpendObserver() {
  if (observerInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  observerInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (method === 'POST' && response.ok && CREDIT_SPENDING_PATH.test(url)) {
        window.setTimeout(notifyCreditsChanged, 0);
      }
    } catch {
      /* never break the request */
    }
    return response;
  };
}
