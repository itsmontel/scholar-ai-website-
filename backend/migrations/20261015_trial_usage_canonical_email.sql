-- ============================================================
-- ONE FREE TRIAL PER INBOX
-- ============================================================
--
-- Run once in Supabase → SQL Editor. IDEMPOTENT.
--
-- trial_usage already remembers every email that has had a trial, and
-- deleting an account leaves it in place, so the same address can't
-- trial twice. But Gmail delivers sam+2@gmail.com and s.a.m@gmail.com to
-- sam@gmail.com, so those looked like new people. email_canonical stores
-- the inbox key (see backend/src/utils/canonicalEmail.js) and the trial
-- check matches on it too.
--
-- Until this runs, the backend falls back to exact-email matching.
-- ============================================================

ALTER TABLE public.trial_usage ADD COLUMN IF NOT EXISTS email_canonical VARCHAR(255);

-- Backfill: lowercase, drop "+tag", and for Gmail drop dots and use gmail.com.
WITH parts AS (
  SELECT id,
         split_part(split_part(lower(trim(email)), '@', 1), '+', 1) AS local_part,
         split_part(lower(trim(email)), '@', 2) AS domain
  FROM public.trial_usage
  WHERE email_canonical IS NULL
)
UPDATE public.trial_usage t
SET email_canonical = CASE
  WHEN p.domain IN ('gmail.com', 'googlemail.com') THEN replace(p.local_part, '.', '') || '@gmail.com'
  ELSE p.local_part || '@' || p.domain
END
FROM parts p
WHERE t.id = p.id;

-- Not unique: rows recorded before this change can share an inbox.
CREATE INDEX IF NOT EXISTS idx_trial_usage_email_canonical ON public.trial_usage (email_canonical);
