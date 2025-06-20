/*
  # Fix RLS Policies for Job Applications

  1. Security
    - Enable RLS on job_applications table
    - Add proper policies for CRUD operations
    - Ensure users can only access their own data

  2. Changes
    - Enable RLS on job_applications
    - Create policies for authenticated users
*/

-- Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete own job applications" ON job_applications;

-- Create policies for job_applications
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read contacts for their job applications" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for their job applications" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts for their job applications" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their job applications" ON contacts;

-- Create policies for contacts
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

-- Enable RLS on follow_ups table
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read follow-ups for their job applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can insert follow-ups for their job applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can update follow-ups for their job applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can delete follow-ups for their job applications" ON follow_ups;

-- Create policies for follow_ups
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

-- Enable RLS on other tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

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

-- Create policies for documents
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

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

-- Create policies for ai_generations
DROP POLICY IF EXISTS "Users can read AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can update AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can delete AI generations for their job applications" ON ai_generations;

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

-- Create policies for user_settings
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

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

-- Create policies for oauth_tokens
DROP POLICY IF EXISTS "Users can read own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete own oauth tokens" ON oauth_tokens;

CREATE POLICY "Users can read own oauth tokens"
  ON oauth_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth tokens"
  ON oauth_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth tokens"
  ON oauth_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth tokens"
  ON oauth_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for webhooks
DROP POLICY IF EXISTS "Users can read own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can insert own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can update own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can delete own webhooks" ON webhooks;

CREATE POLICY "Users can read own webhooks"
  ON webhooks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks"
  ON webhooks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);