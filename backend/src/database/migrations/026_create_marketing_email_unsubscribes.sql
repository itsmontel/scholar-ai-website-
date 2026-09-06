-- Permanent marketing email blocklist.
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS marketing_email_unsubscribes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(50) DEFAULT 'unsubscribe_page',
    unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_email_unsubscribes_email
    ON marketing_email_unsubscribes(email);

-- Copy anyone already marked unsubscribed in the legacy table.
INSERT INTO marketing_email_unsubscribes (email, source, unsubscribed_at)
SELECT
    email,
    'legacy_email_subscriptions',
    COALESCE(unsubscribed_at, updated_at, CURRENT_TIMESTAMP)
FROM email_subscriptions
WHERE is_subscribed = false
ON CONFLICT (email) DO NOTHING;

ALTER TABLE IF EXISTS public.marketing_email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- View blocked emails in Supabase:
-- SELECT * FROM marketing_email_unsubscribes ORDER BY unsubscribed_at DESC;
