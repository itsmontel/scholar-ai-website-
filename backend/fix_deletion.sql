-- Final fix for document deletion issues
-- Run this in Supabase SQL Editor

-- Remove any conflicting triggers on document_analyses
DROP TRIGGER IF EXISTS update_document_analyses_updated_at ON document_analyses;

-- Ensure documents table has updated_at column
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Recreate the documents trigger properly
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure document_analyses foreign key is correct
ALTER TABLE document_analyses 
DROP CONSTRAINT IF EXISTS document_analyses_document_id_fkey;

ALTER TABLE document_analyses 
ADD CONSTRAINT document_analyses_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE SET NULL;

-- Make document_id nullable
ALTER TABLE document_analyses 
ALTER COLUMN document_id DROP NOT NULL;














