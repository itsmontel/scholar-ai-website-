import { useEffect, useState } from 'react';
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
  /** Free accounts: essay grades granted per calendar month (3). */
  freeCredits: number;
  freeCreditDays: number;
  /** Free accounts: when the monthly grades reset (the 1st). */
  freeResetsAt: string | null;
  /** Legacy free week: when the free credits stopped working. Always null now. */
  freeExpiresAt: string | null;
  freeDaysLeft: number | null;
  freeExpired: boolean;
  /** Bought top-up credits still available (already included in `remaining`). */
  topUp: number;
  /** When the soonest top-up credits expire. */
  topUpExpiresAt: string | null;
  /** Months in the last two with a top-up bought. */
  topUpMonths: number;
  /** What grading an essay costs right now. */
  analysisCost: number;
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
    freeCreditDays: num(c.freeCreditDays, 0),
    freeResetsAt: typeof c.freeResetsAt === 'string' ? c.freeResetsAt : null,
    freeExpiresAt: typeof c.freeExpiresAt === 'string' ? c.freeExpiresAt : null,
    freeDaysLeft: typeof c.freeDaysLeft === 'number' ? c.freeDaysLeft : null,
    freeExpired: c.freeExpired === true,
    topUp: num(c.topUp),
    topUpExpiresAt: typeof c.topUpExpiresAt === 'string' ? c.topUpExpiresAt : null,
    topUpMonths: num(c.topUpMonths),
    analysisCost: num(c.analysisCost, 2),
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

const TOPUP_API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const topUpHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

/** Start Stripe Checkout for a credit top-up and send the browser there. Throws with a message to show. */
export async function buyTopUp(pack: string): Promise<void> {
  const origin = window.location.origin;
  let json: { success?: boolean; message?: string; data?: { url?: string } } | null = null;
  try {
    const res = await fetch(`${TOPUP_API}/subscriptions/topup-checkout`, {
      method: 'POST',
      headers: topUpHeaders(),
      body: JSON.stringify({
        pack,
        successUrl: `${origin}/dashboard?topup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}${window.location.pathname}`,
      }),
    });
    json = await res.json().catch(() => null);
  } catch {
    throw new Error('Could not reach WriteScholar. Check your connection and try again.');
  }
  if (!json?.success || !json.data?.url) throw new Error(json?.message || 'We could not start checkout. Please try again in a moment.');
  window.location.assign(json.data.url);
}

/**
 * Back from Stripe after buying a top-up (?topup=success&session_id=…):
 * add the credits and clean the address bar. Resolves with the credits
 * added, or null when there is nothing to confirm.
 */
export async function confirmTopUpFromUrl(): Promise<number | null> {
  let params: URLSearchParams;
  try { params = new URLSearchParams(window.location.search); } catch { return null; }
  if (params.get('topup') !== 'success') return null;
  const sessionId = params.get('session_id') || '';
  params.delete('topup');
  params.delete('session_id');
  try {
    const rest = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
  } catch { /* ignore */ }
  if (!sessionId) return null;
  try {
    const res = await fetch(`${TOPUP_API}/subscriptions/topup-confirm`, { method: 'POST', headers: topUpHeaders(), body: JSON.stringify({ sessionId }) });
    const json = await res.json().catch(() => null);
    notifyCreditsChanged();
    return json?.success && json.data?.paid ? Number(json.data.credits) || 0 : null;
  } catch {
    return null;
  }
}

/* ─── Shared credit state and the "get more" choice ─────────────── */


/** The signed-in account's credit state, refreshed after anything that spends a credit. */
export function useCreditState(): CreditState | null {
  const [state, setState] = useState<CreditState | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CREDITS_CHANGED_EVENT, bump);
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, bump);
  }, []);
  useEffect(() => {
    let alive = true;
    const token = (() => { try { return localStorage.getItem('authToken') || localStorage.getItem('token'); } catch { return null; } })();
    if (!token) return;
    fetch(`${TOPUP_API}/subscriptions/usage`, { headers: topUpHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setState(parseCreditState(d.credits)); })
      .catch(() => { /* the nudges just stay hidden */ });
    return () => { alive = false; };
  }, [version]);
  return state;
}

export const CREDIT_CHOICE_EVENT = 'writescholar-open-credit-choice';
/** Open the "top up or choose a plan" pop-up from anywhere. `need` is what the action costs. */
export function openCreditChoice(detail: { need?: number; source: string; heading?: string } = { source: 'unknown' }) {
  window.dispatchEvent(new CustomEvent(CREDIT_CHOICE_EVENT, { detail }));
}

/** Start Stripe Checkout for a plan (free accounts) or open the billing portal (paid accounts changing plan). */
export async function startPlanCheckout(planType: 'pro' | 'premium', newCustomer: boolean): Promise<void> {
  const origin = window.location.origin;
  const paid = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return isPaidCreditPlan(String(u.subscriptionPlan || u.subscription_plan || u.plan || 'free')); } catch { return false; } })();
  if (paid) {
    const res = await fetch(`${TOPUP_API}/subscriptions/billing-portal`, { method: 'POST', headers: topUpHeaders(), body: JSON.stringify({ returnUrl: `${origin}/billing` }) });
    const j = await res.json().catch(() => null);
    if (!j?.success || !j.url) throw new Error(j?.message || 'We could not open billing. Please try again.');
    window.location.assign(j.url);
    return;
  }
  const res = await fetch(`${TOPUP_API}/subscriptions/create-checkout-session`, {
    method: 'POST',
    headers: topUpHeaders(),
    body: JSON.stringify({
      planType,
      billingCycle: 'monthly',
      successUrl: `${origin}/dashboard?payment=success`,
      cancelUrl: `${origin}${window.location.pathname}`,
      ...(newCustomer ? { promoCode: 'NEWCUSTOMER' } : {}),
    }),
  });
  const j = await res.json().catch(() => null);
  if (!j?.success || !j.data?.checkoutUrl) throw new Error(j?.message || 'We could not start checkout. Please try again.');
  try { sessionStorage.setItem('ws_checkout_offer', JSON.stringify({ kind: 'paid', plan: planType })); } catch { /* ignore */ }
  window.location.assign(j.data.checkoutUrl);
}
