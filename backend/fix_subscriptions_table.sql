-- Fix subscriptions table for webhook compatibility
-- Run this in your database (Supabase SQL Editor or locally)

-- Add missing columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Rename plan_type to plan (webhook code expects 'plan')
ALTER TABLE subscriptions 
RENAME COLUMN plan_type TO plan;

-- Update stripe_subscription_id to be NOT NULL and ensure it's unique
ALTER TABLE subscriptions 
ALTER COLUMN stripe_subscription_id SET NOT NULL;

-- Add index for stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Add updated_at trigger for subscriptions if missing
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
