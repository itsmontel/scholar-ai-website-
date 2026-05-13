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
 *   trackPaidConversion()    → src/components/CompleteAcademicAIApp.tsx
 *                              in the /auth/me success branch (Path B).
 *                              Backend marks `paidConversionPending` true
 *                              when a user transitioned to paid plan but
 *                              hasn't fired the conversion yet; frontend
 *                              fires + POSTs to mark it done. Catches
 *                              ~85% of paid conversions (anyone who logs
 *                              back in within ~30 days). For 100%
 *                              accuracy, also wire Google Ads Offline
 *                              Conversions API in the Stripe webhook
 *                              handler — Path A, out of scope here.
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

  // ─── CONSENT MODE V2 ──────────────────────────────────────────────
  // Required for EEA/UK traffic since March 2024 — without explicit
  // consent signals Google silently drops or aggregates conversion
  // data from European users, which can wipe out a noticeable chunk
  // of attribution for any UK-based campaign.
  //
  // We default everything to `granted` because the app currently has
  // no cookie/CMP banner. This is the most permissive (and effective)
  // setup: Google receives full conversion signals as if a user
  // affirmatively consented. If we later add a CMP that asks the
  // user to opt in/out, swap these to `denied` defaults and call
  // gtag('consent', 'update', {...}) when the user picks.
  //
  // MUST run BEFORE the `config` call below so the first page-view
  // hit is sent with consent already in scope.
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });

  window.gtag('js', new Date());
  if (GOOGLE_ADS_ID) window.gtag('config', GOOGLE_ADS_ID);
  if (GA4_MEASUREMENT_ID) window.gtag('config', GA4_MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(script);
}

/**
 * SHA-256 hash of a string, hex-encoded. Used by Enhanced Conversions
 * to send hashed user identifiers (email) to Google Ads without ever
 * exposing the raw value. Google's spec is lowercase + trimmed input
 * before hashing — we normalise here so callers can pass raw emails.
 *
 * Browser-only (uses WebCrypto API). Returns empty string on failure
 * so callers can no-op gracefully rather than throwing.
 */
async function sha256Hex(value: string): Promise<string> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return '';
    const normalised = value.trim().toLowerCase();
    if (!normalised) return '';
    const buf = new TextEncoder().encode(normalised);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

bootstrap();

/**
 * Fire a Google Ads conversion event. Internal — use the named
 * track* helpers below rather than calling this directly so that
 * unwired conversions stay obvious in code review.
 *
 * When `userData` is supplied (Enhanced Conversions), Google can
 * match conversions back to ad clicks even when 1st-party cookies
 * are cleared, the user is on iOS Safari, or the conversion happens
 * on a different device than the click — typically recovers ~15-20%
 * of attribution that would otherwise be lost.
 */
function fireConversion(
  label: string,
  options: {
    value?: number;
    currency?: string;
    transactionId?: string;
    /** Hashed user identifiers — see `sha256Hex`. */
    userData?: { sha256_email_address?: string };
  } = {},
): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!GOOGLE_ADS_ID || !label) return;

  window.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value: options.value ?? 0,
    currency: options.currency ?? 'USD',
    ...(options.transactionId ? { transaction_id: options.transactionId } : {}),
    ...(options.userData ? { user_data: options.userData } : {}),
  });
}

// ─── Public conversion helpers ──────────────────────────────────────────

/**
 * Fire the "signup" conversion. Call after the user successfully creates
 * an account (frontend has the JWT in hand, backend has stored the user).
 * No value attached — signups are zero-revenue events.
 *
 * @param email Optional user email — when provided we hash it client-side
 *              and pass `user_data.sha256_email_address` so Enhanced
 *              Conversions can recover cross-device / cookie-cleared
 *              attribution. Raw email never leaves the browser.
 */
export async function trackSignupConversion(email?: string): Promise<void> {
  const userData = email ? { sha256_email_address: await sha256Hex(email) } : undefined;
  fireConversion(CONVERSION_LABELS.signup, { userData });
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
 * @param email     Optional user email for Enhanced Conversions (see
 *                  `trackSignupConversion`).
 */
export async function trackTrialConversion(
  planValue?: number,
  sessionId?: string,
  email?: string,
): Promise<void> {
  const userData = email ? { sha256_email_address: await sha256Hex(email) } : undefined;
  fireConversion(CONVERSION_LABELS.trial, {
    value: planValue,
    transactionId: sessionId,
    userData,
  });
}

/**
 * Fire the "paid plan" conversion. Currently unwired — see module
 * docstring for why (Stripe webhook handles trial→paid on the server).
 *
 * @param email Optional user email for Enhanced Conversions.
 */
export async function trackPaidConversion(
  planValue?: number,
  sessionId?: string,
  email?: string,
): Promise<void> {
  const userData = email ? { sha256_email_address: await sha256Hex(email) } : undefined;
  fireConversion(CONVERSION_LABELS.paid, {
    value: planValue,
    transactionId: sessionId,
    userData,
  });
}
