/**
 * Product analytics — event tracking for funnel and engagement.
 * Wires to PostHog when VITE_POSTHOG_KEY is set; otherwise no-ops in prod
 * and console-logs in dev so the funnel is still visible during development.
 */

import posthog from 'posthog-js';

/* ─── CORE FUNNEL ────────────────────────────────────────────────
 * These four are the conversion funnel. Read them in order to find
 * where users drop; everything else below is supporting detail.
 *
 *   signed_up → analysis_completed → trial_started → subscription_converted
 *
 * Each fires exactly once per user per step (see FUNNEL_ONCE_KEYS),
 * so the PostHog counts are directly comparable as a funnel.
 */
export type FunnelEvent =
  | 'signed_up'
  | 'analysis_completed'
  | 'trial_started'
  | 'subscription_converted';

export type AnalyticsEvent =
  | FunnelEvent
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
  | 'onboarding_aha_skip'
  | 'onboarding_aha_continue_dashboard'
  | 'onboarding_choose_trial'
  | 'onboarding_choose_free'
  // — Onboarding step events —
  | 'onboarding_intro_continue'
  | 'onboarding_celebrate_continue'
  | 'onboarding_survey_source_select'
  | 'onboarding_survey_goal_select'
  | 'onboarding_survey_complete'
  | 'onboarding_tour_essay_analyze'
  | 'onboarding_tour_flashcard_flip'
  | 'onboarding_tour_badge_unlock'
  | 'onboarding_choose_subscription'
  | 'onboarding_daily_review_intro_continue'
  // — Cancel / retention —
  | 'cancel_flow_view'
  | 'cancel_save_offer_view'
  | 'cancel_save_offer_accept'
  | 'cancel_confirmed'
  // — Dashboard —
  | 'dashboard_file_upload_start'
  | 'dashboard_file_upload_success'
  | 'dashboard_file_upload_error'
  | 'dashboard_file_parsed'
  | 'dashboard_analyze_text_start'
  | 'dashboard_citations_success'
  | 'dashboard_citations_error'
  | 'dashboard_study_pack_success'
  | 'dashboard_study_pack_error'
  | 'dashboard_tool_tab'
  | 'dashboard_game_launch'
  | 'dashboard_workspace_shortcut'
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

/* ─── Funnel step de-duplication ─────────────────────────────────
   A funnel is only readable if each step counts distinct users, so
   these fire once per user and then latch. The marker is keyed by
   user id, so signing in as someone else on the same browser still
   records their steps. Falls back to an anonymous key when logged
   out (only `signed_up` can reach that path). */
const FUNNEL_STORAGE_PREFIX = 'ws_funnel_';

function funnelKey(event: FunnelEvent, userId: string | null): string {
  return `${FUNNEL_STORAGE_PREFIX}${event}_${userId ?? 'anon'}`;
}

/**
 * Track a core funnel step exactly once per user.
 *
 * Use this for the four conversion milestones rather than `trackEvent`,
 * so PostHog counts stay comparable between steps. Repeat calls are
 * cheap no-ops, so it's safe to call from anywhere the step completes
 * (e.g. every analysis run, not just the first).
 *
 * Returns true when the event was actually sent.
 */
export function trackFunnelStep(event: FunnelEvent, properties?: Record<string, unknown>): boolean {
  try {
    const userId = getUserId();
    const key = funnelKey(event, userId);
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, new Date().toISOString());
    trackEvent(event, properties);
    return true;
  } catch (_) {
    // Storage unavailable (private mode / quota) — still send the event
    // rather than losing the step entirely; dedupe in PostHog instead.
    trackEvent(event, properties);
    return true;
  }
}
