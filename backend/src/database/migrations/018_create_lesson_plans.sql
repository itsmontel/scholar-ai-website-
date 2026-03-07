-- Lesson Plans table for Interactive Lessons
-- Stores lesson plans with slides, similar to quizzes table

CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    lesson_style VARCHAR(50) DEFAULT 'visual', -- 'visual', 'stepByStep', 'story'
    slide_count INTEGER DEFAULT 0,
    slides JSONB NOT NULL, -- Stores the lesson slides array
    quiz_bank JSONB, -- Stores quiz question bank (15 questions, user sees 6 at a time)
    quiz_display_count INTEGER DEFAULT 6, -- How many questions to show per quiz attempt
    estimated_read_time INTEGER DEFAULT 5, -- in minutes
    source_word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE -- NULL for permanent (paid users), 30 days for free users
);

-- Indexes for lesson_plans table
CREATE INDEX IF NOT EXISTS idx_lesson_plans_user_id ON lesson_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_created_at ON lesson_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_expires_at ON lesson_plans(expires_at);

-- Lesson usage tracking table
CREATE TABLE IF NOT EXISTS lesson_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    words_count INTEGER DEFAULT 0,
    lesson_style VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lesson_usage_user_id ON lesson_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_usage_created_at ON lesson_usage(created_at);
