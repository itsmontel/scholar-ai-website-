-- Add expires_at column to citation_searches table for retention policy
-- Free users: citations expire after 7 days
-- Pro/Premium users: citations never expire (null)

ALTER TABLE citation_searches 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_citation_searches_expires_at 
ON citation_searches(expires_at) 
WHERE expires_at IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN citation_searches.expires_at IS 
'Expiration timestamp for citation searches. NULL means never expires (paid users). 
Free users have 7-day expiration.';
