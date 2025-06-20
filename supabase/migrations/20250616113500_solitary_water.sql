/*
  # Initial Schema for AI Job Application Manager

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `job_applications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `company_name` (text)
      - `job_title` (text)
      - `job_link` (text)
      - `source_site` (text)
      - `applied_on` (date)
      - `status` (enum: applied, followed-up, rejected, no-response, offer, interview)
      - `next_follow_up_date` (date)
      - `notes` (text)
      - `salary` (text)
      - `location` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `job_application_id` (uuid, references job_applications)
      - `name` (text)
      - `email` (text)
      - `linkedin` (text)
      - `phone` (text)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `file_name` (text)
      - `file_type` (enum: resume, cover-letter, certificate, other)
      - `file_url` (text)
      - `file_size` (bigint)
      - `uploaded_on` (timestamp)
      - `linked_job_id` (uuid, references job_applications)
    
    - `follow_ups`
      - `id` (uuid, primary key)
      - `job_application_id` (uuid, references job_applications)
      - `date` (date)
      - `email_text` (text)
      - `response_status` (enum: positive, negative, no-reply, pending)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `ai_generations`
      - `id` (uuid, primary key)
      - `job_application_id` (uuid, references job_applications)
      - `type` (enum: resume, cover-letter)
      - `content` (text)
      - `generated_on` (timestamp)
      - `is_used` (boolean)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `openai_api_key` (text)
      - `gmail_integration_enabled` (boolean)
      - `n8n_webhook_url` (text)
      - `notification_preferences` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create custom types
CREATE TYPE application_status AS ENUM ('applied', 'followed-up', 'rejected', 'no-response', 'offer', 'interview');
CREATE TYPE file_type AS ENUM ('resume', 'cover-letter', 'certificate', 'other');
CREATE TYPE response_status AS ENUM ('positive', 'negative', 'no-reply', 'pending');
CREATE TYPE generation_type AS ENUM ('resume', 'cover-letter');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_link text,
  source_site text NOT NULL,
  applied_on date NOT NULL,
  status application_status DEFAULT 'applied',
  next_follow_up_date date,
  notes text,
  salary text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  linkedin text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type file_type NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  uploaded_on timestamptz DEFAULT now(),
  linked_job_id uuid REFERENCES job_applications(id) ON DELETE SET NULL
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  email_text text NOT NULL,
  response_status response_status DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  type generation_type NOT NULL,
  content text NOT NULL,
  generated_on timestamptz DEFAULT now(),
  is_used boolean DEFAULT false
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  openai_api_key text,
  gmail_integration_enabled boolean DEFAULT false,
  n8n_webhook_url text,
  notification_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
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

-- Create policies for job_applications
CREATE POLICY "Users can view own applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for contacts
CREATE POLICY "Users can manage contacts for own applications"
  ON contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = contacts.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- Create policies for documents
CREATE POLICY "Users can view own documents"
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

-- Create policies for follow_ups
CREATE POLICY "Users can manage follow_ups for own applications"
  ON follow_ups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = follow_ups.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- Create policies for ai_generations
CREATE POLICY "Users can manage ai_generations for own applications"
  ON ai_generations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    )
  );

-- Create policies for user_settings
CREATE POLICY "Users can view own settings"
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_on ON job_applications(applied_on);
CREATE INDEX IF NOT EXISTS idx_contacts_job_application_id ON contacts(job_application_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_follow_ups_job_application_id ON follow_ups(job_application_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(date);
CREATE INDEX IF NOT EXISTS idx_ai_generations_job_application_id ON ai_generations(job_application_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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