-- Add quiz bank columns to lesson_plans table
-- This stores pre-generated quiz questions (15 questions, user sees 6 at a time)

-- Add quiz_bank column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_plans' AND column_name = 'quiz_bank'
    ) THEN
        ALTER TABLE lesson_plans ADD COLUMN quiz_bank JSONB;
    END IF;
END $$;

-- Add quiz_display_count column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_plans' AND column_name = 'quiz_display_count'
    ) THEN
        ALTER TABLE lesson_plans ADD COLUMN quiz_display_count INTEGER DEFAULT 6;
    END IF;
END $$;

COMMENT ON COLUMN lesson_plans.quiz_bank IS 'Stores quiz question bank (15 questions) generated with the lesson';
COMMENT ON COLUMN lesson_plans.quiz_display_count IS 'Number of random questions to show per quiz attempt (default 6)';
