/*
  # Add OpenRouter API Key to User Settings

  1. Changes
    - Add openrouter_api_key column to user_settings table
    - Update ai_provider check constraint to include 'openrouter'
    
  2. Purpose
    - Support direct integration with OpenRouter API
    - Allow users to store their OpenRouter API key securely
*/

-- Add openrouter_api_key column to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'openrouter_api_key'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN openrouter_api_key text;
  END IF;
END $$;

-- Update ai_provider check constraint to include 'openrouter'
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_ai_provider_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_ai_provider_check 
  CHECK (ai_provider = ANY (ARRAY['openai'::text, 'anthropic'::text, 'google'::text, 'gemini'::text, 'openrouter'::text]));

-- Add comment to the new column
COMMENT ON COLUMN user_settings.openrouter_api_key IS 'OpenRouter API Key for direct integration with deepseek/deepseek-r1-0528:free model';