-- SQL to add index for newsletter subscription type queries
-- Run this in your Supabase SQL Editor if the email_subscriptions table already exists

-- Add index for subscription_type column (improves newsletter query performance)
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_type ON email_subscriptions(subscription_type);

-- Verify the table structure supports newsletter subscriptions
-- The subscription_type column should already exist with VARCHAR(50)
-- Valid types: 'marketing', 'newsletter', 'transactional', 'all'

-- To view all newsletter subscribers:
-- SELECT * FROM email_subscriptions WHERE subscription_type = 'newsletter' AND is_subscribed = true;

-- To count newsletter subscribers:
-- SELECT COUNT(*) FROM email_subscriptions WHERE subscription_type = 'newsletter' AND is_subscribed = true;
