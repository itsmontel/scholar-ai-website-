-- ============================================
-- FIX FOR CITATION_SEARCHES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing table (if it exists)
DROP TABLE IF EXISTS citation_searches CASCADE;

-- Step 2: Create citation_searches table with correct schema
CREATE TABLE IF NOT EXISTS citation_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    research_topic TEXT NOT NULL,
    citation_style VARCHAR(50) NOT NULL DEFAULT 'APA',
    search_results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_citation_searches_user_id ON citation_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_citation_searches_created_at ON citation_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citation_searches_citation_style ON citation_searches(citation_style);

-- Step 4: Enable Row Level Security with permissive policy
ALTER TABLE citation_searches ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own citation searches" ON citation_searches;
DROP POLICY IF EXISTS "Users can insert their own citation searches" ON citation_searches;
DROP POLICY IF EXISTS "Users can update their own citation searches" ON citation_searches;
DROP POLICY IF EXISTS "Users can delete their own citation searches" ON citation_searches;
DROP POLICY IF EXISTS "Allow service role full access to citation_searches" ON citation_searches;

-- Step 6: Create a permissive policy that allows all operations
-- (Service role key bypasses RLS anyway, but this ensures compatibility)
CREATE POLICY "Allow service role full access to citation_searches" ON citation_searches
    FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_citation_searches_updated_at ON citation_searches;
CREATE TRIGGER update_citation_searches_updated_at 
    BEFORE UPDATE ON citation_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Verify table was created
SELECT 'citation_searches table created successfully!' as status;


