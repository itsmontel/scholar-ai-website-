/**
 * Product analytics — event tracking for funnel and engagement.
 * Wires to PostHog when VITE_POSTHOG_KEY is set; otherwise no-ops in prod
 * and console-logs in dev so the funnel is still visible during development.
 */

import posthog from 'posthog-js';

export type AnalyticsEvent =
  | 'tutorial_start'
  | 'tutorial_complete'
  | 'tutorial_skip'
  | 'paywall_view'
  | 'paywall_dismiss'
  | 'paywall_start_trial'
  | 'first_analysis'
  | 'first_study_pack'
  | 'first_citation'
  | 'first_humanize'
  | 'first_summary'
  | 'onboarding_complete'
  | 'first_action_prompt_view'
  | 'first_action_prompt_dismiss'
  | 'first_action_prompt_cta_click'
  | 'activation_tutorial_nav_analysis'
  | 'activation_tutorial_mock_results'
  | 'activation_tutorial_preview'
  // — Aha-moment onboarding funnel —
  | 'onboarding_profile_view'
  | 'onboarding_profile_complete'
  | 'onboarding_aha_view'
  | 'onboarding_aha_generate'
  | 'onboarding_aha_complete'
  | 'onboarding_choose_trial'
  | 'onboarding_choose_free'
  // — Freemium preview funnel: signup → preview_ran → lock_viewed →
  //   upgrade_clicked → checkout_started → (Stripe webhook = paid).
  //   Read these five in order to find where users drop. —
  | 'preview_ran'
  | 'lock_viewed'
  | 'upgrade_clicked'
  | 'checkout_started';

let initialized = false;

function initIfNeeded(): boolean {
  if (initialized) return true;
  const key = import.meta.env?.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return false;
  try {
    const apiHost = (import.meta.env?.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';
    posthog.init(key, {
      api_host: apiHost,
      // Capture pageviews + clicks automatically. Disable session recording by
      // default to keep cost down — flip on per-environment if you want it.
      capture_pageview: true,
      autocapture: true,
      disable_session_recording: true,
      persistence: 'localStorage+cookie',
    });
    initialized = true;
    return true;
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[analytics] PostHog init failed:', e);
    return false;
  }
}

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id ?? null;
    }
  } catch (_) {}
  return null;
}

/**
 * Identify the current user to PostHog. Call on login + signup.
 * Safe to call multiple times — PostHog dedupes.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (!initIfNeeded()) return;
  try {
    posthog.identify(userId, properties);
  } catch (_) {}
}

/**
 * Reset PostHog identity on logout so the next user starts fresh.
 */
export function resetAnalytics(): void {
  if (!initialized) return;
  try {
    posthog.reset();
  } catch (_) {}
}

/**
 * Track a product analytics event. Safe to call anywhere.
 * Sends to PostHog if configured; otherwise logs to console in dev.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  try {
    const userId = getUserId();
    const payload = {
      userId,
      timestamp: new Date().toISOString(),
      ...properties,
    };
    if (import.meta.env?.DEV) {
      console.log('[analytics]', event, payload);
    }
    if (initIfNeeded()) {
      posthog.capture(event, payload);
    }
  } catch (_) {}
}
