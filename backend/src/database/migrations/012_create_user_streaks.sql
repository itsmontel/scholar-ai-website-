-- Streak: login only. One row per day the user logged in.
-- Drop old tables if they exist (from previous migration attempt)
DROP TABLE IF EXISTS streak_activities CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;

CREATE TABLE user_login_dates (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, login_date)
);

CREATE INDEX idx_user_login_dates_user_id ON user_login_dates(user_id);
CREATE INDEX idx_user_login_dates_login_date ON user_login_dates(login_date);
