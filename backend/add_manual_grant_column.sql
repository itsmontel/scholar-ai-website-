-- Add manual_grant flag to users for comped Pro/Premium accounts.
-- Run in Supabase SQL Editor.
--
-- When manual_grant = true, reconcileSubscriptions() skips the row, so the
-- daily cron will not downgrade them even if their Stripe subscription is
-- canceled or absent. Use for partner deals, lifetime comps, and refunds
-- where you want to preserve paid access.
--
-- ⚠️  Supabase's SQL editor pre-validates the entire script before running it,
-- so we can't reference `manual_grant` later in the same script before it
-- exists. Run STEP 1 first, then STEP 2 separately.

------------------------------------------------------------
-- STEP 1 — run this first. Adds the column.
------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS manual_grant BOOLEAN NOT NULL DEFAULT false;

------------------------------------------------------------
-- STEP 2 — run this in a SEPARATE editor session, after STEP 1
-- has succeeded. Adds the index and backfills any old sentinel rows.
------------------------------------------------------------

-- CREATE INDEX IF NOT EXISTS idx_users_manual_grant
--   ON users(manual_grant)
--   WHERE manual_grant = true;
--
-- UPDATE users
--    SET manual_grant = true,
--        subscription_status = 'active'
--  WHERE subscription_status = 'manual';
