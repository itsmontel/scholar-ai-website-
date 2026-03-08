-- Migration: Create trial_usage table
-- Purpose: Track emails that have used a free trial to prevent abuse
-- Even if a user deletes their account and re-registers with the same email,
-- they won't get another free trial

CREATE TABLE IF NOT EXISTS trial_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_plan VARCHAR(50) NOT NULL, -- 'pro' or 'premium'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on lowercase email to prevent duplicates regardless of case
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_usage_email_lower ON trial_usage(LOWER(email));

-- Index for quick lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_trial_usage_stripe_customer ON trial_usage(stripe_customer_id);

-- Comment explaining the table
COMMENT ON TABLE trial_usage IS 'Tracks emails that have used a free trial. Persists even if user account is deleted to prevent trial abuse.';
