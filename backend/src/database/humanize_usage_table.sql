-- Run this in Supabase SQL Editor to create the humanize_usage table
CREATE TABLE IF NOT EXISTS humanize_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  words_count INTEGER NOT NULL DEFAULT 0,
  mode VARCHAR(20) DEFAULT 'standard',
  intensity VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_humanize_usage_user_month ON humanize_usage (user_id, created_at);

ALTER TABLE humanize_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own humanize usage" ON humanize_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to humanize_usage" ON humanize_usage
  FOR ALL USING (true) WITH CHECK (true);
