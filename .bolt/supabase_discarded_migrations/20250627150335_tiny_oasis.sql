-- Create documents storage bucket without using storage.policies table
-- This migration creates a storage bucket for documents and sets it to private

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, false, 52428800, '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png}')
ON CONFLICT (id) DO NOTHING;

-- Note: Storage bucket policies need to be created through the Supabase dashboard
-- or using the Supabase CLI. The SQL approach used in previous migrations doesn't work
-- because we don't have direct access to modify storage.policies.

-- For reference, the following policies should be created manually:
/*
  1. Allow users to upload their own documents:
     - Operation: INSERT
     - Target roles: authenticated
     - Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  
  2. Allow users to view their own documents:
     - Operation: SELECT
     - Target roles: authenticated
     - Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  
  3. Allow users to delete their own documents:
     - Operation: DELETE
     - Target roles: authenticated
     - Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
*/

-- Add helpful comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';