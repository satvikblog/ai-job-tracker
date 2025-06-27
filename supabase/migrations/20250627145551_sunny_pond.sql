/*
  # Fix Storage RLS Policies for Documents Bucket

  1. Changes
    - Create proper RLS policies for the documents storage bucket
    - Ensure users can only access their own files
    - Fix the path structure to match what's used in the application
*/

-- Create policies for the documents storage bucket
BEGIN;

-- First, let's make sure we have the right bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    -- Insert the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false);
  END IF;
END $$;

-- Drop any existing policies to avoid conflicts
DO $$
DECLARE
  _policy record;
BEGIN
  FOR _policy IN 
    SELECT policy_name 
    FROM storage.policies 
    WHERE bucket_id = 'documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', _policy.policy_name);
  END LOOP;
END $$;

-- Create new policies with proper auth.uid() checks
-- Policy for users to read their own files
CREATE POLICY "Allow users to read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to insert their own files
CREATE POLICY "Allow users to insert their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

COMMIT;