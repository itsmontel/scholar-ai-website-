-- ============================================================
-- ONE ACCOUNT PER INBOX
-- ============================================================
--
-- Run once in Supabase → SQL Editor. IDEMPOTENT.
--
-- The free grade (3 a month) is tied to an account, so an account has
-- to mean one real inbox. Gmail delivers sam+2@gmail.com and
-- s.a.m@gmail.com to sam@gmail.com; users.email_canonical stores the
-- inbox key (same rule as trial_usage.email_canonical, see
-- backend/src/utils/canonicalEmail.js) and sign-up refuses a second
-- account for an inbox that already has one.
--
-- Until this runs, the backend falls back to exact-email matching.
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_canonical VARCHAR(255);

WITH parts AS (
  SELECT id,
         split_part(split_part(lower(trim(email)), '@', 1), '+', 1) AS local_part,
         split_part(lower(trim(email)), '@', 2) AS domain
  FROM public.users
  WHERE email_canonical IS NULL AND email IS NOT NULL
)
UPDATE public.users u
SET email_canonical = CASE
  WHEN p.domain IN ('gmail.com', 'googlemail.com') THEN replace(p.local_part, '.', '') || '@gmail.com'
  ELSE p.local_part || '@' || p.domain
END
FROM parts p
WHERE u.id = p.id;

-- Not unique: accounts created before this change can share an inbox.
CREATE INDEX IF NOT EXISTS idx_users_email_canonical ON public.users (email_canonical);
