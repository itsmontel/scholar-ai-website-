/**
 * Google Tag (gtag.js) wrapper for Google Ads conversion tracking.
 *
 * ─── HOW TO ENABLE ─────────────────────────────────────────────────────
 *
 * 1. In Google Ads: Tools → Conversions → "+ New conversion action" → Website.
 *    Create three conversion actions:
 *      • "Signup"        — counts when a user creates an account
 *      • "Trial started" — counts when a user enters card details / starts trial
 *      • "Paid plan"     — counts when a user becomes paid (post-trial)
 *
 * 2. After creating each, Google shows you a "send_to" value like
 *    AW-1234567890/AbC_DefGhi. Split that on the "/":
 *      - The first half (AW-1234567890) is your GOOGLE_ADS_ID — same for all.
 *      - The second half (AbC_DefGhi) is the per-conversion LABEL — different
 *        for each conversion action.
 *
 * 3. Paste the values into the constants below. Once GOOGLE_ADS_ID is non-
 *    empty, gtag.js auto-injects on app load and conversions start firing.
 *    Until then, every helper is a clean no-op (no script injection, no
 *    network calls, no console errors) so it's safe to deploy unconfigured.
 *
 * ─── WHERE EVENTS FIRE ─────────────────────────────────────────────────
 *
 *   trackSignupConversion()  → src/components/CompleteAcademicAIApp.tsx
 *                              inside handleSignUp (after JWT exchange).
 *   trackTrialConversion()   → src/components/pages/OnboardingPage.tsx
 *                              after /subscriptions/sync-checkout-session
 *                              returns success.
 *   trackPaidConversion()    → not wired client-side. Trial→paid happens
 *                              on Stripe's side (server webhook). To track
 *                              this accurately, wire it through Google Ads
 *                              Offline Conversions API from the backend
 *                              webhook handler — out of scope here.
 *
 * ─── ANALYTICS-vs-ADS NOTE ─────────────────────────────────────────────
 *
 * The same gtag.js script powers Google Analytics 4 (GA4). If you also
 * want GA4 set up, paste your GA4 measurement ID into GA4_MEASUREMENT_ID
 * below (format: G-XXXXXXXX). The helper will configure both when both
 * IDs are set.
 */

// ─── Configuration — REPLACE THESE TO ENABLE ─────────────────────────────

/** Google Ads account/conversion ID. Format: 'AW-XXXXXXXXXX'. */
const GOOGLE_ADS_ID = 'AW-18025808263';

/** Per-conversion labels from Google Ads → Conversions → install tag. */
const CONVERSION_LABELS = {
  /** Fires on account creation (handleSignUp). */
  signup: 'kn7hCJKx5qocEIeDsJND',
  /** Fires when user starts a paid trial via Stripe (sync-checkout-session). */
  trial: 'H1K8CK3qzaocEIeDsJND',
  /**
   * Fires when a trial converts to a paid subscription. Currently unwired
   * client-side — Stripe charges the card 7 days after trial start via a
   * server-side webhook the browser never sees. To track this accurately,
   * wire it through the Google Ads Offline Conversions API from the
   * backend Stripe webhook handler. Label is stored here so when that
   * server-side wiring happens, the value is in one place.
   */
  paid: 'VdFNCMiu56ocEIeDsJND',
};

/** Google Analytics 4 measurement ID. Format: 'G-XXXXXXXX'. Optional. */
const GA4_MEASUREMENT_ID = '';

// ─── Internals ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let bootstrapped = false;

/**
 * Lazily inject the gtag.js script and call `config` for whichever IDs
 * are set. Runs once at module import time; subsequent calls are no-ops.
 * Skipped entirely on the server (no `window`) and when neither ID is set,
 * so this module costs zero bytes of network / zero console noise until
 * the user actually configures it.
 */
function bootstrap(): void {
  if (bootstrapped) return;
  if (typeof window === 'undefined') return;
  if (!GOOGLE_ADS_ID && !GA4_MEASUREMENT_ID) return;

  bootstrapped = true;
  const primaryId = GOOGLE_ADS_ID || GA4_MEASUREMENT_ID;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    (window.dataLayer as unknown[]).push(args);
  };

  window.gtag('js', new Date());
  if (GOOGLE_ADS_ID) window.gtag('config', GOOGLE_ADS_ID);
  if (GA4_MEASUREMENT_ID) window.gtag('config', GA4_MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(script);
}

bootstrap();

/**
 * Fire a Google Ads conversion event. Internal — use the named
 * track* helpers below rather than calling this directly so that
 * unwired conversions stay obvious in code review.
 */
function fireConversion(
  label: string,
  options: { value?: number; currency?: string; transactionId?: string } = {},
): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!GOOGLE_ADS_ID || !label) return;

  window.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value: options.value ?? 0,
    currency: options.currency ?? 'USD',
    ...(options.transactionId ? { transaction_id: options.transactionId } : {}),
  });
}

// ─── Public conversion helpers ──────────────────────────────────────────

/**
 * Fire the "signup" conversion. Call after the user successfully creates
 * an account (frontend has the JWT in hand, backend has stored the user).
 * No value attached — signups are zero-revenue events.
 */
export function trackSignupConversion(): void {
  fireConversion(CONVERSION_LABELS.signup);
}

/**
 * Fire the "trial started" conversion. Call after Stripe checkout
 * returns successfully and the user's plan flips from free → trial.
 *
 * @param planValue Optional plan price for value-based bidding (Pro=19.99,
 *                  Premium=39.99). Passing it lets Google's auto-bidding
 *                  see which trials are higher-value.
 * @param sessionId Stripe checkout session ID, used as transaction_id to
 *                  prevent duplicate counting if the page reloads.
 */
export function trackTrialConversion(planValue?: number, sessionId?: string): void {
  fireConversion(CONVERSION_LABELS.trial, {
    value: planValue,
    transactionId: sessionId,
  });
}

/**
 * Fire the "paid plan" conversion. Currently unwired — see module
 * docstring for why (Stripe webhook handles trial→paid on the server).
 */
export function trackPaidConversion(planValue?: number, sessionId?: string): void {
  fireConversion(CONVERSION_LABELS.paid, {
    value: planValue,
    transactionId: sessionId,
  });
}
