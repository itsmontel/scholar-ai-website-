-- Track when we've sent the "trial ending in ~24h" reminder email so
-- the hourly cron in server.js (notifyTrialsEndingSoon) only fires
-- once per subscription, even if the cron runs multiple times during
-- the eligibility window.
--
-- Safe to re-run — uses IF NOT EXISTS.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_ending_email_sent_at TIMESTAMPTZ;

-- Partial index keeps the eligibility query fast even when the
-- subscriptions table grows — the cron only ever cares about
-- trialing rows that haven't been emailed yet, which is a tiny
-- subset of total rows.
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_email_pending
  ON subscriptions (current_period_end)
  WHERE status = 'trialing' AND trial_ending_email_sent_at IS NULL;
