/*
  # Create Documents Storage Bucket

  1. Storage Setup
    - Create documents bucket for file storage
    - Configure bucket settings for document uploads
    
  2. Note
    - Storage policies need to be configured through Supabase dashboard
    - This migration only creates the bucket structure
*/

-- Create the documents storage bucket
DO $$
BEGIN
  -- Check if bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    -- Insert the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'documents',
      'documents',
      false,
      52428800, -- 50MB limit
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]
    );
  END IF;
END $$;

-- Add a comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. Documents bucket created for user file storage.';