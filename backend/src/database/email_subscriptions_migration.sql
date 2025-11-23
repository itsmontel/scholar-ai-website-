-- Email Subscriptions Table Migration
-- Run this SQL in your Supabase SQL Editor to create the email_subscriptions table

-- Create email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_subscribed BOOLEAN DEFAULT true,
    subscription_type VARCHAR(50) DEFAULT 'marketing', -- 'marketing', 'transactional', 'all'
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_is_subscribed ON email_subscriptions(is_subscribed);

-- Create trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: The update_updated_at_column() function should already exist from your main schema.sql
-- If you get an error about the function not existing, run this first:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

