-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run.
--
-- Adds the column the backend uses to remember whether a user's paid-plan
-- Google Ads conversion has already been fired client-side. Without this,
-- the next /auth/me load would re-fire the conversion every page reload
-- and bloat your dashboard with phantom conversions.
--
-- ─── HOW THE FLAG IS USED ──────────────────────────────────────────────
--
-- Computed by /api/auth/me as `paidConversionPending`:
--   plan IN ('pro','premium')  AND  subscription_status = 'active'
--   AND  paid_conversion_fired_at IS NULL
--
-- When the frontend sees `paidConversionPending: true`, it fires
-- gtag('event', 'conversion', ...) for the Paid Plan label, then POSTs
-- /api/users/mark-paid-conversion-fired which sets this column to NOW().
-- That flips paidConversionPending to false on every subsequent page load.
--
-- ─── WHY THIS COLUMN IS NULLABLE (NOT BOOLEAN) ─────────────────────────
--
-- Storing the timestamp instead of a boolean lets us audit when the
-- conversion fired, which is useful for debugging "why didn't this user's
-- conversion show up in Google Ads?" — you can check whether it fired,
-- and when, without crawling logs.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS paid_conversion_fired_at TIMESTAMPTZ;

-- Optional index — only useful if you ever query "users whose paid
-- conversion hasn't fired yet" for analytics. Cheap to keep.
CREATE INDEX IF NOT EXISTS idx_users_paid_conversion_pending
  ON users(id)
  WHERE paid_conversion_fired_at IS NULL;
