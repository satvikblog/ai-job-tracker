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

-- Add a record to our storage_config table
INSERT INTO storage_config (bucket_name, notes)
VALUES ('documents', 'Documents bucket for user file uploads - needs to be created manually in Supabase dashboard')
ON CONFLICT (bucket_name) DO UPDATE
SET notes = 'Documents bucket for user file uploads - needs to be created manually in Supabase dashboard';

-- Add helpful comment for users
COMMENT ON TABLE storage_config IS 'Tracks storage bucket configuration status - create the documents bucket in Supabase dashboard';