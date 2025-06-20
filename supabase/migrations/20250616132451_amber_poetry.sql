/*
  # Enable RLS and Create Policies for Job Application Manager

  1. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Ensure proper user isolation

  2. Tables Updated
    - profiles: Users can read/write their own profile
    - job_applications: Users can CRUD their own applications
    - contacts: Users can CRUD contacts for their applications
    - documents: Users can CRUD their own documents
    - follow_ups: Users can CRUD follow-ups for their applications
    - ai_generations: Users can CRUD AI generations for their applications
    - user_settings: Users can CRUD their own settings
*/

-- Enable RLS on all tables
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