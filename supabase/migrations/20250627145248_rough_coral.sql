/*
  # Fix Documents Table RLS Policies

  1. Security Updates
    - Drop existing conflicting policies on documents table
    - Create new policies that properly handle user authentication
    - Ensure policies work with the auth.uid() function correctly

  2. Policy Changes
    - Allow authenticated users to insert their own documents
    - Allow authenticated users to read their own documents  
    - Allow authenticated users to update their own documents
    - Allow authenticated users to delete their own documents
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Create new policies that properly reference auth.uid()
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

-- Ensure RLS is enabled on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Also ensure the storage bucket has proper policies
-- Note: This needs to be done in the Supabase dashboard under Storage > Policies
-- or via the Supabase CLI, but we'll add a comment for reference

/*
  Storage Bucket Policy needed (to be created in Supabase dashboard):
  
  Policy name: "Users can upload their own documents"
  Allowed operation: INSERT
  Target roles: authenticated
  Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  
  Policy name: "Users can view their own documents"  
  Allowed operation: SELECT
  Target roles: authenticated
  Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  
  Policy name: "Users can delete their own documents"
  Allowed operation: DELETE  
  Target roles: authenticated
  Policy definition: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
*/