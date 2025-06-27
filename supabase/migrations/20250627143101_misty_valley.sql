/*
  # Add resume_content column to documents table

  1. Changes
    - Add resume_content column to documents table for AI analysis
    - Add index for full-text search on resume content
    
  2. Purpose
    - Store extracted text content from resume files
    - Enable AI analysis of resume content
    - Support PDF parsing functionality
*/

-- Add resume_content column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'resume_content'
  ) THEN
    ALTER TABLE documents ADD COLUMN resume_content text;
    COMMENT ON COLUMN documents.resume_content IS 'Extracted text content from resume files for AI analysis';
  END IF;
END $$;

-- Create full-text search index on resume_content
CREATE INDEX IF NOT EXISTS idx_documents_resume_content 
ON documents USING gin(to_tsvector('english', COALESCE(resume_content, '')));