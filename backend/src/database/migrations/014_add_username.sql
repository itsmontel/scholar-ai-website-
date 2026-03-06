-- Add username field to users table
-- Usernames must be unique and are used for display in the friends system

-- Add username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Generate default usernames for existing users based on their email
-- Format: first part of email + random 4 digits
DO $$
DECLARE
    user_record RECORD;
    base_username VARCHAR(30);
    new_username VARCHAR(30);
    username_exists BOOLEAN;
    retry_count INTEGER;
    random_suffix VARCHAR(10);
BEGIN
    FOR user_record IN SELECT id, email FROM users WHERE username IS NULL LOOP
        -- Get base username from email (part before @)
        base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(user_record.email, '@', 1), '[^a-z0-9]', '', 'g'));
        -- Truncate to 20 chars to leave room for suffix
        base_username := LEFT(base_username, 20);
        
        retry_count := 0;
        LOOP
            IF retry_count = 0 THEN
                new_username := base_username;
            ELSE
                -- Add random 4-digit suffix
                random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
                new_username := base_username || random_suffix;
            END IF;
            
            SELECT EXISTS(SELECT 1 FROM users WHERE username = new_username) INTO username_exists;
            retry_count := retry_count + 1;
            
            IF NOT username_exists THEN
                EXIT;
            END IF;
            
            -- Safety limit
            IF retry_count > 100 THEN
                new_username := base_username || '_' || uuid_generate_v4()::TEXT;
                EXIT;
            END IF;
        END LOOP;
        
        UPDATE users SET username = new_username WHERE id = user_record.id;
        RAISE NOTICE 'Assigned username % to user %', new_username, user_record.id;
    END LOOP;
END $$;
