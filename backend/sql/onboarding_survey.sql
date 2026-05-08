-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
--
-- Creates a table to capture onboarding survey responses so we can see:
--   • Where users heard about WriteScholar (marketing channel attribution)
--   • What they're using it for       (use-case / goal signal)
--   • Which features excited them most (product roadmap signal)
--
-- One row per user (unique on user_id, upserted on every onboarding submission).

CREATE TABLE IF NOT EXISTS onboarding_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_source TEXT,
  use_goal TEXT,
  feature_interests TEXT[],
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT onboarding_survey_unique_user UNIQUE (user_id)
);

-- For existing tables, add the new column if it isn't there yet:
ALTER TABLE onboarding_survey_responses
  ADD COLUMN IF NOT EXISTS use_goal TEXT;

CREATE INDEX IF NOT EXISTS idx_onboarding_survey_user      ON onboarding_survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_survey_source    ON onboarding_survey_responses(referral_source);
CREATE INDEX IF NOT EXISTS idx_onboarding_survey_goal      ON onboarding_survey_responses(use_goal);
CREATE INDEX IF NOT EXISTS idx_onboarding_survey_submitted ON onboarding_survey_responses(submitted_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- USEFUL ANALYTICS QUERIES (copy/paste in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Top marketing channels — where new users are coming from:
--    SELECT referral_source, COUNT(*) AS users, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
--    FROM onboarding_survey_responses
--    WHERE referral_source IS NOT NULL
--    GROUP BY referral_source
--    ORDER BY users DESC;

-- 2) Top use-case goals — what users actually want to accomplish:
--    SELECT use_goal, COUNT(*) AS users, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
--    FROM onboarding_survey_responses
--    WHERE use_goal IS NOT NULL
--    GROUP BY use_goal
--    ORDER BY users DESC;

-- 3) Most-anticipated features — what to prioritise on the roadmap:
--    SELECT feature, COUNT(*) AS users
--    FROM onboarding_survey_responses, unnest(feature_interests) AS feature
--    GROUP BY feature
--    ORDER BY users DESC;

-- 4) Source × goal crosstab — which channels bring which kind of user:
--    SELECT referral_source, use_goal, COUNT(*) AS users
--    FROM onboarding_survey_responses
--    WHERE referral_source IS NOT NULL AND use_goal IS NOT NULL
--    GROUP BY referral_source, use_goal
--    ORDER BY referral_source, users DESC;

-- 5) Goal × feature crosstab — what features people pick by goal:
--    SELECT use_goal, feature, COUNT(*) AS users
--    FROM onboarding_survey_responses, unnest(feature_interests) AS feature
--    WHERE use_goal IS NOT NULL
--    GROUP BY use_goal, feature
--    ORDER BY use_goal, users DESC;

-- 6) Daily signups by source — see if a TikTok video pushed traffic:
--    SELECT DATE(submitted_at) AS day, referral_source, COUNT(*) AS users
--    FROM onboarding_survey_responses
--    GROUP BY day, referral_source
--    ORDER BY day DESC, users DESC;
