/*
  # Fix RLS Policies and Database Schema

  1. Security
    - Drop all existing policies to avoid conflicts
    - Enable RLS on all tables
    - Create comprehensive RLS policies for all tables
    
  2. Functions and Triggers
    - Create updated_at trigger function
    - Add triggers for timestamp management
*/

-- Drop ALL existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
    
    -- Drop all policies on job_applications
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'job_applications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON job_applications';
    END LOOP;
    
    -- Drop all policies on contacts
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contacts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON contacts';
    END LOOP;
    
    -- Drop all policies on documents
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'documents') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON documents';
    END LOOP;
    
    -- Drop all policies on follow_ups
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'follow_ups') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON follow_ups';
    END LOOP;
    
    -- Drop all policies on ai_generations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_generations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ai_generations';
    END LOOP;
    
    -- Drop all policies on user_settings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_settings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON user_settings';
    END LOOP;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Job applications policies
CREATE POLICY "Users can read own job applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job applications"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can read contacts for their job applications"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = contacts.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts for their job applications"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = contacts.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts for their job applications"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = contacts.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts for their job applications"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = contacts.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Follow-ups policies
CREATE POLICY "Users can read follow-ups for their job applications"
  ON follow_ups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = follow_ups.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert follow-ups for their job applications"
  ON follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = follow_ups.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update follow-ups for their job applications"
  ON follow_ups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = follow_ups.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete follow-ups for their job applications"
  ON follow_ups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = follow_ups.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- AI generations policies
CREATE POLICY "Users can read AI generations for their job applications"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI generations for their job applications"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI generations for their job applications"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete AI generations for their job applications"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- User settings policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle updated_at timestamps (in public schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers where missing
DO $$
BEGIN
    -- Drop existing triggers first to avoid conflicts
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
    DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
    
    -- Create triggers
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_job_applications_updated_at
        BEFORE UPDATE ON job_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;