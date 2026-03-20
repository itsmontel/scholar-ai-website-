-- Per-domain mode: 'block' (default) or 'daily_limit'
-- When daily_limit: daily_limit_minutes specifies max minutes per day
-- Structure: { "youtube.com": { "mode": "daily_limit", "dailyLimitMinutes": 60 }, "reddit.com": { "mode": "block" } }
ALTER TABLE focus_mode_settings ADD COLUMN IF NOT EXISTS domain_settings JSONB DEFAULT '{}'::jsonb;
