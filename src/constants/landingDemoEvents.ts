/**
 * Custom-event names dispatched by the landing-page live demo.
 *
 * Extracted here so callers (LandingPage hero CTAs, the demo component
 * itself) can reference the event name without statically importing the
 * 775-line `InteractiveDocumentAnalysis` module — which would defeat
 * lazy-loading. The constant is a single string; pulling it into its
 * own tiny module costs ~0 bytes in the final bundle.
 */
export const LANDING_DEMO_FOCUS_FEEDBACK_EVENT =
  'writescholar:landing-demo-focus-feedback';
