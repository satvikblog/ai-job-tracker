/*
  # Disable Storage Policies for Documents

  This migration disables RLS on the documents table and removes storage-related restrictions
  to allow unrestricted file uploads during development.

  Note: This is for development purposes. In production, proper RLS policies should be implemented.
*/

-- Disable RLS on documents table to allow unrestricted access
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on documents table
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Ensure the documents bucket exists (this should work without special permissions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If we can't create the bucket, that's okay - it might already exist
    -- or need to be created manually
    RAISE NOTICE 'Could not create documents bucket - may need manual creation';
END $$;

-- Add comment for documentation
COMMENT ON TABLE documents IS 'Document storage table with RLS disabled for development';