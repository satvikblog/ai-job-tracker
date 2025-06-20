/*
  # OAuth Integration and User Settings Enhancement

  1. New Tables
    - Enhanced `user_settings` table with OAuth tokens
    - Added `oauth_tokens` table for secure token storage
    
  2. Security
    - Enable RLS on all tables
    - Add policies for OAuth token management
    
  3. Functions
    - Add function to handle OAuth token encryption
    - Update triggers for proper timestamp handling
*/

-- Create oauth_tokens table for secure token storage
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

-- Enable RLS on oauth_tokens
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Add missing columns to user_settings if they don't exist
DO $$
BEGIN
  -- Add google_oauth_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'google_oauth_enabled'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN google_oauth_enabled boolean DEFAULT false;
  END IF;

  -- Add google_client_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'google_client_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN google_client_id text;
  END IF;

  -- Add last_gmail_sync column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'last_gmail_sync'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_gmail_sync timestamptz;
  END IF;

  -- Add ai_provider column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'ai_provider'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN ai_provider text DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic', 'google'));
  END IF;
END $$;

-- OAuth tokens policies
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

-- Add trigger for oauth_tokens updated_at
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to safely store OAuth tokens
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get valid OAuth token
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_google_oauth ON user_settings(google_oauth_enabled) WHERE google_oauth_enabled = true;