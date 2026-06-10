/**
 * Open the soft paywall (SoftPaywall modal in CompleteAcademicAIApp)
 * from any upgrade-intent CTA — locked-content clicks, "Upgrade to Pro"
 * buttons, limit-hit banners.
 *
 * Uses force=true because these are explicit user actions at peak
 * motivation: they must bypass the session-dismissal flag and the
 * weekly cooldown that only exist to stop unprompted nags.
 *
 * The paywall shows the NEWCUSTOMER first-month price ($9.99 Pro /
 * $19.99 Premium) for eligible new customers and starts Stripe
 * checkout directly — a much shorter path than bouncing the user out
 * to the pricing page.
 */
export function openUpgradePaywall(trigger: string) {
  window.dispatchEvent(
    new CustomEvent('writescholar-open-paywall', {
      detail: { force: true, trigger },
    })
  );
}
