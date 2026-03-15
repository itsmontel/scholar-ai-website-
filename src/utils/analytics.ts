/**
 * Product analytics — event tracking for funnel and engagement.
 * Wire to PostHog, Mixpanel, Amplitude, etc. when ready.
 */

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
  | 'first_action_prompt_cta_click';

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
 * Track a product analytics event. Safe to call anywhere.
 * Extend with backend/third-party when analytics is set up.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  try {
    const payload = {
      event,
      userId: getUserId(),
      timestamp: new Date().toISOString(),
      ...properties,
    };
    // Console in dev for debugging
    if (import.meta.env?.DEV) {
      console.log('[analytics]', payload);
    }
    // Future: send to PostHog/Mixpanel/Amplitude
    // e.g. posthog.capture(event, payload);
  } catch (_) {}
}
