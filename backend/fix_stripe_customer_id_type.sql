-- Fix stripe_customer_id column type from UUID to VARCHAR
-- Stripe customer IDs are strings like 'cus_xxxxx', not UUIDs

ALTER TABLE users 
ALTER COLUMN stripe_customer_id TYPE VARCHAR(255) USING stripe_customer_id::VARCHAR;

-- Also fix in subscriptions table if it exists there
ALTER TABLE subscriptions 
ALTER COLUMN stripe_customer_id TYPE VARCHAR(255) USING stripe_customer_id::VARCHAR;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'stripe_customer_id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id';
