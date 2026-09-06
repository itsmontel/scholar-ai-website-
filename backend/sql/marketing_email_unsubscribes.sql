-- Permanent marketing blocklist — emails that must never receive promo blasts again.
-- Run in Supabase: Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS marketing_email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'unsubscribe_page',
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_email_unsubscribes_email
  ON marketing_email_unsubscribes(email);

-- Backfill from legacy email_subscriptions flags (safe to re-run)
INSERT INTO marketing_email_unsubscribes (email, source, unsubscribed_at)
SELECT email, 'legacy_email_subscriptions', COALESCE(unsubscribed_at, updated_at, NOW())
FROM email_subscriptions
WHERE is_subscribed = false
ON CONFLICT (email) DO NOTHING;

-- List everyone who opted out:
-- SELECT email, source, unsubscribed_at FROM marketing_email_unsubscribes ORDER BY unsubscribed_at DESC;
