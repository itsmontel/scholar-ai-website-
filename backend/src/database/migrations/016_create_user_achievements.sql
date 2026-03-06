-- User achievements: stats and unlocked badges, synced across devices
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}',
  unlocked_badges JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Trigger to update updated_at (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_achievements_updated_at ON user_achievements;
CREATE TRIGGER user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
