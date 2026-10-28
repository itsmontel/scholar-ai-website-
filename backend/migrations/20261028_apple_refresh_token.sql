-- Stores the Sign in with Apple refresh token so account deletion can revoke
-- it (App Store guideline 5.1.1(v)). Only set for users who sign in with Apple.
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_refresh_token TEXT;
