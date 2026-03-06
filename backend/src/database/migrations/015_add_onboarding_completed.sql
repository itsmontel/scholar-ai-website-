-- Add onboarding_completed flag to users table
-- This allows onboarding status to persist across browsers and devices

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Mark existing users who have completed onboarding as done
-- (anyone who has logged in at least once is considered past onboarding)
UPDATE users
SET onboarding_completed = true
WHERE last_login IS NOT NULL;
