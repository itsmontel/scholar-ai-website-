-- Add quiz customization and unlock duration to focus_mode_settings
ALTER TABLE focus_mode_settings ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 5;
ALTER TABLE focus_mode_settings ADD COLUMN IF NOT EXISTS pass_threshold INTEGER DEFAULT 4;
ALTER TABLE focus_mode_settings ADD COLUMN IF NOT EXISTS unlock_duration_ms BIGINT DEFAULT 1800000;
