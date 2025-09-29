-- Simple fix for document_analyses cascade issue
-- Only run this if the table already exists

-- Drop existing constraint
ALTER TABLE document_analyses 
DROP CONSTRAINT IF EXISTS document_analyses_document_id_fkey;

-- Make document_id nullable
ALTER TABLE document_analyses 
ALTER COLUMN document_id DROP NOT NULL;

-- Add new constraint with SET NULL
ALTER TABLE document_analyses 
ADD CONSTRAINT document_analyses_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE SET NULL;

