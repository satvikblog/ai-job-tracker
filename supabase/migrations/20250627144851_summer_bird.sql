/*
  # Document Storage Configuration

  Since the storage bucket "documents" has been manually created,
  this migration focuses on application-level database enhancements
  for document management.

  1. Enhancements to documents table
    - Add resume_content column for extracted text content
    - Add indexes for better performance
    - Update RLS policies if needed

  2. Functions for document management
    - Helper functions for document operations
*/

-- Add resume_content column to documents table if it doesn't exist
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

-- Create additional indexes for document management
CREATE INDEX IF NOT EXISTS idx_documents_resume_content 
ON documents USING gin(to_tsvector('english', COALESCE(resume_content, '')));

-- Create function to get document storage path
CREATE OR REPLACE FUNCTION get_document_storage_path(
  p_user_id uuid,
  p_file_type text,
  p_filename text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the storage path format: user_id/file_type/timestamp_filename
  RETURN p_user_id::text || '/' || p_file_type || '/' || 
         extract(epoch from now())::bigint || '_' || p_filename;
END;
$$;

-- Create function to extract file extension
CREATE OR REPLACE FUNCTION get_file_extension(filename text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(substring(filename from '\.([^.]*)$'));
END;
$$;

-- Create function to validate file type
CREATE OR REPLACE FUNCTION is_valid_document_type(filename text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  ext text;
BEGIN
  ext := get_file_extension(filename);
  RETURN ext IN ('pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp');
END;
$$;

-- Update documents table policies to ensure proper access
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own documents" ON documents;
  DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
  DROP POLICY IF EXISTS "Users can update own documents" ON documents;
  DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
  
  -- Recreate policies
  CREATE POLICY "Users can read own documents"
    ON documents
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own documents"
    ON documents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own documents"
    ON documents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own documents"
    ON documents
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Add helpful comments
COMMENT ON FUNCTION get_document_storage_path(uuid, text, text) IS 'Generates standardized storage path for document uploads';
COMMENT ON FUNCTION get_file_extension(text) IS 'Extracts file extension from filename';
COMMENT ON FUNCTION is_valid_document_type(text) IS 'Validates if file type is allowed for document uploads';