-- Create document_analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('general', 'citation', 'grammar', 'plagiarism', 'comprehensive')),
    result TEXT NOT NULL,
    original_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_analyses_user_id ON document_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_created_at ON document_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analyses_type ON document_analyses(analysis_type);

-- Add RLS policies
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analyses
CREATE POLICY "Users can view own analyses" ON document_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own analyses
CREATE POLICY "Users can insert own analyses" ON document_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own analyses
CREATE POLICY "Users can update own analyses" ON document_analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own analyses
CREATE POLICY "Users can delete own analyses" ON document_analyses
    FOR DELETE USING (auth.uid() = user_id);
