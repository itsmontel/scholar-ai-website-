-- ============================================================
-- 30-DAY DOCUMENT EXPIRY FOR NEVER-PAID FREE USERS
-- ============================================================
--
-- Run once in Supabase → SQL editor.
--
-- Matches study packs / citations: Free users who have never paid
-- lose documents 30 days after creation. expires_at NULL = keep
-- forever (current Pro/Premium users, and anyone who has ever paid).
--
-- Existing never-paid Free docs are left with expires_at NULL until
-- the user next opens the app (see 20260903_defer_library_expiry_until_login.sql).
-- New uploads still get created_at + 30 days from the API.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS.
-- ============================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_expires_at_idx
  ON documents (expires_at)
  WHERE expires_at IS NOT NULL;

-- Current paid users: keep everything.
UPDATE documents d
SET expires_at = NULL
FROM users u
WHERE d.user_id = u.id
  AND lower(coalesce(u.subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus');

-- Anyone with a real subscription row: keep everything (churned paid).
UPDATE documents d
SET expires_at = NULL
FROM subscriptions s
WHERE d.user_id = s.user_id
  AND lower(s.status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid');

-- Remaining never-paid Free docs: leave expires_at NULL. Cleanup jobs
-- skip NULL, so libraries stay until first authenticated request after
-- this change, which stamps NOW() + 30 days.

COMMENT ON COLUMN documents.expires_at IS
  'When this document is deleted for never-paid Free users. NULL = permanent (paid / formerly paid) OR clock not started yet (see users.free_library_expiry_started_at).';
