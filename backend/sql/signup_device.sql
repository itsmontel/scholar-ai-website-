-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run.
--
-- Adds the column the backend uses to record which device a user signed up
-- on (mobile / tablet / desktop / unknown). Captured from the User-Agent
-- header at signup time and never updated afterward — it answers "what
-- device did they use to first reach us," not "what do they use now."
--
-- ─── ANALYTICS QUERIES YOU'LL WANT ─────────────────────────────────────
--
-- 1) Signups by device, last 30 days:
--    SELECT signup_device, COUNT(*) AS signups
--    FROM users
--    WHERE created_at > NOW() - INTERVAL '30 days'
--    GROUP BY signup_device
--    ORDER BY signups DESC;
--
-- 2) Mobile vs desktop trial-to-paid conversion rate (last 90 days):
--    SELECT
--      signup_device,
--      COUNT(*) AS total,
--      COUNT(*) FILTER (
--        WHERE subscription_plan IN ('pro','premium')
--          AND subscription_status = 'active'
--      ) AS paid,
--      ROUND(
--        100.0 * COUNT(*) FILTER (
--          WHERE subscription_plan IN ('pro','premium')
--            AND subscription_status = 'active'
--        ) / NULLIF(COUNT(*), 0), 1
--      ) AS conversion_pct
--    FROM users
--    WHERE created_at > NOW() - INTERVAL '90 days'
--    GROUP BY signup_device
--    ORDER BY paid DESC;
--
-- 3) Daily signups by device (campaign tracking):
--    SELECT DATE(created_at) AS day, signup_device, COUNT(*) AS signups
--    FROM users
--    WHERE created_at > NOW() - INTERVAL '14 days'
--    GROUP BY day, signup_device
--    ORDER BY day DESC, signups DESC;
--
-- ─── EXISTING USERS ────────────────────────────────────────────────────
--
-- Pre-existing users will have NULL in this column (they predate tracking).
-- That's fine — they're filtered out of meaningful device-cohort queries
-- with `WHERE signup_device IS NOT NULL` automatically.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signup_device VARCHAR(20);

-- Index helps grouping/filtering queries scale once you have many rows.
-- Cheap and one-time.
CREATE INDEX IF NOT EXISTS idx_users_signup_device
  ON users(signup_device);
