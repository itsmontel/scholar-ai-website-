-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
-- Creates the table for blog newsletter signups. Your backend will save to this table.

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);

-- To list subscribers: SELECT * FROM newsletter_subscriptions ORDER BY subscribed_at DESC;
