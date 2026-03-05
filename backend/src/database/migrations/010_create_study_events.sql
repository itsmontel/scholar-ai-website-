-- Study events table for dashboard calendar
-- References users(id) - the app's custom users table, NOT auth.users
--
-- If you previously created this with REFERENCES auth.users(id), drop first:
--   DROP TABLE IF EXISTS study_events CASCADE;
-- Then run this migration.

CREATE TABLE IF NOT EXISTS study_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT DEFAULT 'other' CHECK (event_type IN ('exam', 'test', 'midterm', 'assignment', 'quiz', 'other')),
  course TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_events_user_id ON study_events(user_id);
CREATE INDEX IF NOT EXISTS idx_study_events_event_date ON study_events(event_date);
