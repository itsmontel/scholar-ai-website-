-- Add welcome_tutorial_completed flag to users table
-- Persists across browsers/devices/incognito
--
-- IMPORTANT: This updates public.users (the app's custom table), NOT auth.users.
-- In Supabase dashboard, check Table Editor → public → users.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS welcome_tutorial_completed BOOLEAN DEFAULT false;
