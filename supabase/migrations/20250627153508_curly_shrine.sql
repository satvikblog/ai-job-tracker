-- Disable RLS on documents table to allow unrestricted access
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on documents table using a simpler approach
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Create a simple storage_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name text NOT NULL,
  is_configured boolean DEFAULT false,
  configured_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Check if the record already exists before inserting
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage_config WHERE bucket_name = 'documents') THEN
    INSERT INTO storage_config (bucket_name, notes)
    VALUES ('documents', 'Documents bucket for user file uploads - create the documents bucket in Supabase dashboard');
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE storage_config IS 'Tracks storage bucket configuration status - create the documents bucket in Supabase dashboard';