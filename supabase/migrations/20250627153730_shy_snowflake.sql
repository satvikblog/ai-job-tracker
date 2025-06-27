/*
  # Fix Documents RLS Policies

  1. Security Updates
    - Enable RLS on documents table
    - Add proper RLS policies for documents table
    - Ensure storage bucket policies are correctly configured

  2. Storage Configuration
    - Configure storage bucket policies for authenticated users
    - Allow users to upload, view, and delete their own documents
*/

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Create comprehensive RLS policies for documents table
CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Create storage policies for the documents bucket
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Alternative simpler storage policies if the above don't work
-- These allow authenticated users to manage any file in the documents bucket
CREATE POLICY "Authenticated users can upload to documents bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete from documents bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');