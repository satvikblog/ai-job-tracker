-- Disable RLS on documents table to allow unrestricted access during development
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on documents table
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

-- Add a record for the documents bucket
INSERT INTO storage_config (bucket_name, notes)
SELECT 'documents', 'Documents bucket for user file uploads - needs to be created manually in Supabase dashboard'
WHERE NOT EXISTS (
  SELECT 1 FROM storage_config WHERE bucket_name = 'documents'
);

-- Add helpful comment
COMMENT ON TABLE storage_config IS 'Tracks storage bucket configuration status - create the documents bucket in Supabase dashboard';

-- Create storage policies for the documents bucket (these will apply if the bucket exists)
DO $$
BEGIN
  -- Check if storage schema and objects table exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    -- Drop existing storage policies if they exist
    BEGIN
      DROP POLICY IF EXISTS "Allow public read access to documents bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to upload to documents bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to delete from documents bucket" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if policies don't exist
      NULL;
    END;
    
    -- Create permissive storage policies for development
    BEGIN
      -- Public read access
      CREATE POLICY "Allow public read access to documents bucket"
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'documents');
        
      -- Authenticated upload access
      CREATE POLICY "Allow authenticated users to upload to documents bucket"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documents');
        
      -- Authenticated delete access
      CREATE POLICY "Allow authenticated users to delete from documents bucket"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'documents');
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if policies can't be created
      NULL;
    END;
  END IF;
END $$;