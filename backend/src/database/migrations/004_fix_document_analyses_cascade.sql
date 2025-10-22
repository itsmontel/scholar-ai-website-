-- Fix document_analyses foreign key constraint
-- Change from CASCADE to SET NULL when documents are deleted
-- This ensures analysis counts don't decrease when documents are deleted

-- Drop the existing foreign key constraint
ALTER TABLE document_analyses 
DROP CONSTRAINT IF EXISTS document_analyses_document_id_fkey;

-- Add the new constraint with SET NULL behavior
ALTER TABLE document_analyses 
ADD CONSTRAINT document_analyses_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE SET NULL;

-- Make document_id nullable since it can now be set to NULL
ALTER TABLE document_analyses 
ALTER COLUMN document_id DROP NOT NULL;









