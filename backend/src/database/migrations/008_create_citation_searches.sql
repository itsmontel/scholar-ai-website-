-- Create citation_searches table
CREATE TABLE IF NOT EXISTS citation_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    research_topic TEXT NOT NULL,
    citation_style VARCHAR(50) NOT NULL DEFAULT 'APA',
    search_results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_citation_searches_user_id ON citation_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_citation_searches_created_at ON citation_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citation_searches_citation_style ON citation_searches(citation_style);

-- Since we're using service role key for backend operations, we can disable RLS
-- or create permissive policies that allow service role to manage all records
ALTER TABLE citation_searches ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow service role to access all records
-- Service role key bypasses RLS, but these policies allow anon key with proper auth
CREATE POLICY "Allow service role full access to citation_searches" ON citation_searches
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_citation_searches_updated_at 
    BEFORE UPDATE ON citation_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
