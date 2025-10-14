-- Add Google OAuth fields to users table
-- Migration: 007_add_google_oauth_fields.sql

-- Add google_id column for Google OAuth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add profile_picture column for Google profile pictures
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add name column (combining first_name and last_name functionality)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Make password_hash nullable for Google OAuth users
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Update existing users to have name field populated
UPDATE users 
SET name = COALESCE(
  NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
  email
)
WHERE name IS NULL;

