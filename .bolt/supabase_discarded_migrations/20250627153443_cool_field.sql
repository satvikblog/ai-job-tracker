-- Disable RLS on documents table to allow unrestricted access
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on documents table
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on documents
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'documents') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON documents';
  END LOOP;
END $$;

-- Create a simple storage_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name text NOT NULL UNIQUE,
  is_configured boolean DEFAULT false,
  configured_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add a record for the documents bucket
INSERT INTO storage_config (bucket_name, notes)
VALUES ('documents', 'Documents bucket for user file uploads - create the documents bucket in Supabase dashboard')
ON CONFLICT (bucket_name) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE storage_config IS 'Tracks storage bucket configuration status - create the documents bucket in Supabase dashboard';