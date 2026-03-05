-- Run this in Supabase Dashboard → SQL Editor
-- Adds expires_at column for citation retention (free: 7 days, paid: permanent)

ALTER TABLE citation_searches 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_citation_searches_expires_at 
ON citation_searches(expires_at) 
WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN citation_searches.expires_at IS 
'Expiration timestamp. NULL = never expires (paid users). Free users: 7-day expiration.';
