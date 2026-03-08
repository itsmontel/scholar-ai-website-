-- Run this in Supabase Dashboard → SQL Editor
-- Purpose: Prevent free trial abuse when users delete their account and re-register with the same email.
-- The trial_usage table stores emails that have used a trial. It is NEVER deleted when a user deletes
-- their account, so re-registering with the same email will not grant another free trial.

-- Create trial_usage table (idempotent)
CREATE TABLE IF NOT EXISTS trial_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_plan VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique index on lowercase email (prevents duplicates regardless of case)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_usage_email_lower ON trial_usage(LOWER(email));

-- Index for lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_trial_usage_stripe_customer ON trial_usage(stripe_customer_id);

COMMENT ON TABLE trial_usage IS 'Tracks emails that have used a free trial. Persists even if user account is deleted to prevent trial abuse.';
