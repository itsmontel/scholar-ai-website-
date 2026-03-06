-- Friends System Migration
-- Creates friend codes, friends relationships, and share requests

-- Add friend_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_code VARCHAR(12) UNIQUE;

-- Generate friend codes for existing users who don't have one
-- Using a function to generate random 8-character alphanumeric codes
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(12) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users with friend codes
DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR(12);
    code_exists BOOLEAN;
    retry_count INTEGER;
BEGIN
    FOR user_record IN SELECT id FROM users WHERE friend_code IS NULL LOOP
        retry_count := 0;
        LOOP
            new_code := generate_friend_code();
            SELECT EXISTS(SELECT 1 FROM users WHERE friend_code = new_code) INTO code_exists;
            retry_count := retry_count + 1;
            IF code_exists THEN
                RAISE NOTICE 'Friend code collision: % already exists (user %), retrying (attempt %)', new_code, user_record.id, retry_count;
            ELSE
                EXIT;
            END IF;
        END LOOP;
        UPDATE users SET friend_code = new_code WHERE id = user_record.id;
    END LOOP;
END $$;

-- Make friend_code NOT NULL after backfill
ALTER TABLE users ALTER COLUMN friend_code SET NOT NULL;

-- Create trigger to auto-generate friend code for new users (with collision retry + logging)
CREATE OR REPLACE FUNCTION set_friend_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(12);
    code_exists BOOLEAN;
    retry_count INTEGER := 0;
BEGIN
    IF NEW.friend_code IS NULL THEN
        LOOP
            new_code := generate_friend_code();
            SELECT EXISTS(SELECT 1 FROM users WHERE friend_code = new_code) INTO code_exists;
            retry_count := retry_count + 1;
            IF code_exists THEN
                RAISE NOTICE 'Friend code collision: % already exists for new user, retrying (attempt %)', new_code, retry_count;
            ELSE
                NEW.friend_code := new_code;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_friend_code ON users;
CREATE TRIGGER trigger_set_friend_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_friend_code();

-- Friends table (stores friend relationships)
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Indexes for friends table
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Trigger for updated_at on friends
DROP TRIGGER IF EXISTS update_friends_updated_at ON friends;
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Friend share requests table (for sharing quizzes/flashcards/crosswords)
CREATE TABLE IF NOT EXISTS friend_share_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (sender_id != receiver_id)
);

-- Indexes for friend_share_requests table
CREATE INDEX IF NOT EXISTS idx_friend_share_requests_sender_id ON friend_share_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_share_requests_receiver_id ON friend_share_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_share_requests_quiz_id ON friend_share_requests(quiz_id);
CREATE INDEX IF NOT EXISTS idx_friend_share_requests_status ON friend_share_requests(status);

-- Trigger for updated_at on friend_share_requests
DROP TRIGGER IF EXISTS update_friend_share_requests_updated_at ON friend_share_requests;
CREATE TRIGGER update_friend_share_requests_updated_at BEFORE UPDATE ON friend_share_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Blocked users table (for blocking friends from adding you)
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Indexes for blocked_users table
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);
