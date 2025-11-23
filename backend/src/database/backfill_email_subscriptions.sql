-- Backfill Email Subscriptions Table
-- This script adds existing users to the email_subscriptions table
-- Run this AFTER creating the email_subscriptions table

-- Step 1: Insert all existing users who have free plans or no paid subscription
-- Only add users who haven't explicitly unsubscribed
INSERT INTO email_subscriptions (email, user_id, is_subscribed, subscription_type, created_at, updated_at)
SELECT 
    u.email,
    u.id,
    true, -- is_subscribed
    'marketing', -- subscription_type
    u.created_at, -- Use user's original signup date
    CURRENT_TIMESTAMP -- updated_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN email_subscriptions es ON LOWER(TRIM(u.email)) = LOWER(TRIM(es.email))
WHERE 
    -- Only users with free plan or no active paid subscription
    (u.subscription_plan = 'free' OR u.subscription_plan IS NULL OR s.id IS NULL)
    -- Don't add if already exists in email_subscriptions
    AND es.id IS NULL
    -- Make sure email exists and is not empty
    AND u.email IS NOT NULL
    AND TRIM(u.email) != ''
ON CONFLICT (email) DO NOTHING;

-- Step 2: Show summary of what was added
SELECT 
    'Backfill Summary' as info,
    COUNT(*) as total_in_email_subscriptions,
    COUNT(*) FILTER (WHERE is_subscribed = true) as subscribed_count,
    COUNT(*) FILTER (WHERE is_subscribed = false) as unsubscribed_count,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as users_with_accounts,
    COUNT(*) FILTER (WHERE user_id IS NULL) as emails_without_accounts
FROM email_subscriptions;

-- Step 3: Show users who should be in the list but aren't (for verification)
SELECT 
    u.id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
    u.created_at as user_created_at,
    'Not in email_subscriptions' as status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN email_subscriptions es ON LOWER(TRIM(u.email)) = LOWER(TRIM(es.email))
WHERE 
    (u.subscription_plan = 'free' OR u.subscription_plan IS NULL OR s.id IS NULL)
    AND es.id IS NULL
    AND u.email IS NOT NULL
    AND TRIM(u.email) != ''
ORDER BY u.created_at DESC
LIMIT 20; -- Show first 20 for verification
