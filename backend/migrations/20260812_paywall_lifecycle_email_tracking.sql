-- Idempotency columns for the two lifecycle emails added alongside the
-- paywall changes:
--
--   1. Day-5 trial value recap  (notifyTrialValueRecap, hourly)
--      Usage recap + charge notice sent ~48h before the trial ends,
--      ahead of the existing 24h reminder.
--
--   2. Post-lapse winback       (notifyWinbacks, daily)
--      Half-price return offer sent ~14 days after a subscription
--      actually lapsed. This is where the 50% discount moved to after
--      being removed from signup.
--
-- Both crons stamp these on send so repeat ticks inside the eligibility
-- window can't email the same person twice.
--
-- Safe to re-run — uses IF NOT EXISTS.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_recap_email_sent_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS winback_email_sent_at TIMESTAMPTZ;

-- Partial indexes: both crons scan for a small pending subset, so
-- indexing only the un-emailed rows keeps the sweeps cheap as the
-- tables grow.
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_recap_pending
  ON subscriptions (current_period_end)
  WHERE status = 'trialing' AND trial_recap_email_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at
  ON subscriptions (canceled_at)
  WHERE status = 'canceled';
