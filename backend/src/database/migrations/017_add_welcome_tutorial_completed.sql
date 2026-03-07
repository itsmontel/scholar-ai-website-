-- Add welcome_tutorial_completed flag to users table
-- Persists across browsers/devices/incognito

ALTER TABLE users
ADD COLUMN IF NOT EXISTS welcome_tutorial_completed BOOLEAN DEFAULT false;
