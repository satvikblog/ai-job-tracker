/*
  # Storage Configuration Setup

  1. Functions
    - Create function to safely check bucket existence
    
  2. Storage Config
    - Add documents bucket configuration record
    - Track bucket setup status
    
  3. Comments
    - Add helpful documentation for storage setup
*/

-- Create a function to check if a bucket exists
CREATE OR REPLACE FUNCTION check_bucket_exists(bucket_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  bucket_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS(
    SELECT 1 FROM storage.buckets 
    WHERE id = bucket_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Check if the documents bucket record already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage_config 
    WHERE bucket_name = 'documents'
  ) THEN
    -- Add a record to our storage_config table
    INSERT INTO storage_config (bucket_name, notes)
    VALUES ('documents', 'Documents bucket for user file uploads - needs to be created manually in Supabase dashboard');
  END IF;
END $$;

-- Add helpful comment for users
COMMENT ON TABLE storage_config IS 'Tracks storage bucket configuration status - create the documents bucket in Supabase dashboard';

-- Add helpful comment on the function
COMMENT ON FUNCTION check_bucket_exists(text) IS 'Safely checks if a storage bucket exists without requiring elevated permissions';