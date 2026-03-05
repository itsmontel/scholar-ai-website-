-- Migration: Create user_streaks table for tracking daily activity streaks
-- A streak is maintained by completing at least one qualifying action per day

CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_activity_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Track individual daily activities for calendar view
CREATE TABLE IF NOT EXISTS streak_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'essay_analysis', 'quiz_generated', 'humanizer_used', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activities_user_date ON streak_activities(user_id, activity_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_activities_unique ON streak_activities(user_id, activity_date, activity_type);

-- Comments
COMMENT ON TABLE user_streaks IS 'Tracks user streak counts and longest streaks';
COMMENT ON TABLE streak_activities IS 'Records individual activities that contribute to streaks';
COMMENT ON COLUMN user_streaks.current_streak IS 'Number of consecutive days with activity';
COMMENT ON COLUMN user_streaks.longest_streak IS 'Highest streak ever achieved';
COMMENT ON COLUMN streak_activities.activity_type IS 'Type of action: essay_analysis, quiz_generated, flashcards_generated, crossword_generated, humanizer_used, summarizer_used, citation_search, document_upload';
