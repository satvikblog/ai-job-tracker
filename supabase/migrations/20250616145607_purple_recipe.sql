/*
  # Simple Database Setup - No RLS

  This migration creates all necessary tables and functions without Row Level Security
  for easier development and testing.

  1. Tables
    - profiles: User profile information
    - job_applications: Job application tracking
    - contacts: Contact information for applications
    - documents: File storage references
    - follow_ups: Follow-up tracking
    - ai_generations: AI-generated content
    - user_settings: User preferences and API keys
    - oauth_tokens: OAuth token storage

  2. Functions
    - update_updated_at_column: Automatic timestamp updates
    - store_oauth_token: Secure OAuth token management
    - get_oauth_token: Retrieve OAuth tokens

  3. No RLS Policies
    - All tables are accessible without restrictions for development
*/

-- Create update function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_link text,
  source_site text NOT NULL,
  applied_on date NOT NULL,
  status text DEFAULT 'applied' CHECK (status IN ('applied', 'followed-up', 'rejected', 'no-response', 'offer', 'interview')),
  next_follow_up_date date,
  notes text,
  salary text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  linkedin text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('resume', 'cover-letter', 'certificate', 'other')),
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  uploaded_on timestamptz DEFAULT now(),
  linked_job_id uuid REFERENCES job_applications(id) ON DELETE SET NULL
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  date date NOT NULL,
  email_text text NOT NULL,
  response_status text DEFAULT 'pending' CHECK (response_status IN ('positive', 'negative', 'no-reply', 'pending')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- AI generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('resume', 'cover-letter')),
  content text NOT NULL,
  generated_on timestamptz DEFAULT now(),
  is_used boolean DEFAULT false
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  openai_api_key text,
  gmail_integration_enabled boolean DEFAULT false,
  n8n_webhook_url text,
  notification_preferences jsonb DEFAULT '{}',
  google_oauth_enabled boolean DEFAULT false,
  google_client_id text,
  last_gmail_sync timestamptz,
  ai_provider text DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic', 'google')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft', 'github')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  token_type text DEFAULT 'Bearer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

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
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- OAuth token management functions
CREATE OR REPLACE FUNCTION store_oauth_token(
  p_user_id uuid,
  p_provider text,
  p_access_token text,
  p_refresh_token text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_scope text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  token_id uuid;
BEGIN
  INSERT INTO oauth_tokens (
    user_id,
    provider,
    access_token,
    refresh_token,
    expires_at,
    scope
  ) VALUES (
    p_user_id,
    p_provider,
    p_access_token,
    p_refresh_token,
    p_expires_at,
    p_scope
  )
  ON CONFLICT (user_id, provider) 
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at,
    scope = EXCLUDED.scope,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_oauth_token(
  p_user_id uuid,
  p_provider text
) RETURNS TABLE (
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  is_expired boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.access_token,
    ot.refresh_token,
    ot.expires_at,
    (ot.expires_at IS NOT NULL AND ot.expires_at < now()) as is_expired
  FROM oauth_tokens ot
  WHERE ot.user_id = p_user_id 
    AND ot.provider = p_provider;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS on all tables for development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete own job applications" ON job_applications;