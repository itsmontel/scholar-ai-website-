-- ============================================================
-- CREDITS: MONTHLY ROLLOVER (CAP 499)
-- ============================================================
--
-- Run once in Supabase → SQL Editor. IDEMPOTENT.
--
-- Every essay analysis, study pack and citation search costs 1 credit.
--   Trial    3 credits for the 3-day trial
--   Pro      99 credits a month
--   Premium  199 credits a month
--
-- Unused credits carry into the next billing period, up to 499 in
-- total. Trial credits carry into the first paid month. A paused
-- subscription gets no new credits but keeps what it has. Cancelling
-- resets the balance to 0 when the plan ends.
--
-- Credits used are still counted from document_analyses,
-- citation_searches and quiz_usage (quiz_type = 'study_pack'). These
-- columns only remember what was carried in, and which period it was
-- carried into:
--
--   credits_rollover          credits carried into the current period
--   credits_period_start      start of the period the rollover belongs to
--   credits_period_allowance  credits granted for that period (3, 99, 199 or 0)
--
-- Until this runs, the API treats every balance as having no rollover.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credits_rollover INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credits_period_start TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credits_period_allowance INTEGER;

-- The onboarding now asks a few more questions. Keep the answers so
-- the dashboard can recommend where to start.
ALTER TABLE onboarding_survey_responses
  ADD COLUMN IF NOT EXISTS answers JSONB;
