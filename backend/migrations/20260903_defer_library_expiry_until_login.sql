-- ============================================================
-- DEFER 30-DAY LIBRARY EXPIRY UNTIL NEXT LOGIN
-- ============================================================
--
-- This is the only SQL you need. It also adds documents.expires_at, so
-- you do not need to run 20260903_documents_expires_at.sql.
--
-- Problem: backfilling expires_at = NOW() + 30 days (or counting 30
-- days from created_at) deletes docs/packs while the student is away.
--
-- Fix:
--   1. Track whether the 30-day clock has started per user.
--   2. Clear expiry on existing never-paid Free documents, study
--      packs (quizzes), citations, and lessons. NULL is not deleted.
--   3. The API stamps NOW() + 30 days on first authenticated request
--      after this (login, Google/Apple, or opening the app).
--
-- Paid / formerly paid users are unchanged (items stay permanent).
-- Users who already started the clock (flag set) are not reset.
--
-- IDEMPOTENT.
-- ============================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_expires_at_idx
  ON documents (expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN documents.expires_at IS
  'When this document is deleted for never-paid Free users. NULL = permanent (paid / formerly paid) OR clock not started yet (see users.free_library_expiry_started_at).';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_library_expiry_started_at TIMESTAMPTZ;

COMMENT ON COLUMN users.free_library_expiry_started_at IS
  'When the 30-day free-library clock started for this never-paid user. NULL = not started (existing items stay). Paid users may also get this set so we skip the check.';

-- Paid / formerly paid: keep everything.
UPDATE documents d
SET expires_at = NULL
FROM users u
WHERE d.user_id = u.id
  AND lower(coalesce(u.subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus');

UPDATE documents d
SET expires_at = NULL
FROM subscriptions s
WHERE d.user_id = s.user_id
  AND lower(s.status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid');

-- Never-paid Free users who have not come back yet: pause expiry.
UPDATE documents d
SET expires_at = NULL
FROM users u
WHERE d.user_id = u.id
  AND u.free_library_expiry_started_at IS NULL
  AND d.user_id NOT IN (
    SELECT id FROM users
    WHERE lower(coalesce(subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus')
    UNION
    SELECT user_id FROM subscriptions
    WHERE lower(status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid')
  );

UPDATE quizzes q
SET expires_at = NULL
FROM users u
WHERE q.user_id = u.id
  AND u.free_library_expiry_started_at IS NULL
  AND q.user_id NOT IN (
    SELECT id FROM users
    WHERE lower(coalesce(subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus')
    UNION
    SELECT user_id FROM subscriptions
    WHERE lower(status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid')
  );

UPDATE citation_searches c
SET expires_at = NULL
FROM users u
WHERE c.user_id = u.id
  AND u.free_library_expiry_started_at IS NULL
  AND c.user_id NOT IN (
    SELECT id FROM users
    WHERE lower(coalesce(subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus')
    UNION
    SELECT user_id FROM subscriptions
    WHERE lower(status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid')
  );

UPDATE lesson_plans l
SET expires_at = NULL
FROM users u
WHERE l.user_id = u.id
  AND u.free_library_expiry_started_at IS NULL
  AND l.user_id NOT IN (
    SELECT id FROM users
    WHERE lower(coalesce(subscription_plan, 'free')) IN ('pro', 'premium', 'starter', 'focus')
    UNION
    SELECT user_id FROM subscriptions
    WHERE lower(status) IN ('active', 'trialing', 'canceled', 'cancelled', 'past_due', 'paused', 'unpaid')
  );
