-- Allow 'citation_review' as a valid analysis_type in document_analyses
-- Citation reviews are now saved to count toward the combined actions pool (Pro/Premium)

-- Drop the existing CHECK constraint if it exists (from migration 003)
ALTER TABLE document_analyses
DROP CONSTRAINT IF EXISTS document_analyses_analysis_type_check;

-- Add constraint that includes citation_review
ALTER TABLE document_analyses
ADD CONSTRAINT document_analyses_analysis_type_check
CHECK (analysis_type IN ('general', 'citation', 'grammar', 'plagiarism', 'comprehensive', 'citation_review'));
