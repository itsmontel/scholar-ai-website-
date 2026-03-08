-- Run this in Supabase SQL Editor to add onboarding and tutorial columns.
-- When onboarding_completed = true: user never sees onboarding again.
-- When welcome_tutorial_completed = true: user never sees tutorial again.
-- false = show onboarding/tutorial; true = never show again.

-- Add onboarding_completed (default false = not done)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add welcome_tutorial_completed (default false = not done)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS welcome_tutorial_completed BOOLEAN DEFAULT false;

-- Optional: mark existing paying users as past onboarding
-- UPDATE users SET onboarding_completed = true WHERE subscription_plan IN ('pro', 'premium') AND subscription_status = 'active';
