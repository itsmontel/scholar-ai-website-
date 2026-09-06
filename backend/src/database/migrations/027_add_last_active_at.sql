-- Backfill last_active_at from existing activity signals.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);

WITH doc_activity AS (
  SELECT user_id, MAX(updated_at) AS last_doc_at
  FROM documents
  GROUP BY user_id
),
analysis_activity AS (
  SELECT user_id, MAX(created_at) AS last_analysis_at
  FROM document_analyses
  GROUP BY user_id
),
merged AS (
  SELECT
    u.id AS user_id,
    GREATEST(
      COALESCE(u.last_login, u.created_at),
      COALESCE(d.last_doc_at, u.created_at),
      COALESCE(a.last_analysis_at, u.created_at),
      COALESCE(u.updated_at, u.created_at)
    ) AS inferred_last_active
  FROM users u
  LEFT JOIN doc_activity d ON d.user_id = u.id
  LEFT JOIN analysis_activity a ON a.user_id = u.id
)
UPDATE users u
SET last_active_at = m.inferred_last_active
FROM merged m
WHERE u.id = m.user_id
  AND (u.last_active_at IS NULL OR u.last_active_at < m.inferred_last_active);

UPDATE users
SET last_active_at = COALESCE(last_login, updated_at, created_at)
WHERE last_active_at IS NULL;
