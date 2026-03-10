-- Focus Mode: blocked sites for paid users (Pro/Premium)
-- Used by Chrome extension to redirect users to unlock quiz before accessing addictive sites
CREATE TABLE IF NOT EXISTS focus_mode_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_domains JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_focus_mode_settings_user_id ON focus_mode_settings(user_id);
