-- Track when we've sent the "your preview results are waiting" follow-up
-- email so the hourly cron in server.js (notifyPreviewFollowups) emails
-- each free user at most once, ever. Fired ~24h after a free user runs
-- their first preview (analysis / citation search / study pack) without
-- upgrading.
--
-- Safe to re-run — uses IF NOT EXISTS.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preview_followup_email_sent_at TIMESTAMPTZ;
