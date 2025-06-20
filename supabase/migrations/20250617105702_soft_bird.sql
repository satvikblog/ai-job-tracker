/*
  # Multiple Webhooks Support

  1. New Tables
    - `webhooks` table for storing multiple webhook configurations per user
    
  2. Changes
    - Remove webhook URL from user_settings
    - Create dedicated webhooks table with multiple webhook support
    
  3. Security
    - No RLS policies (as requested)
    - Direct table access for development
*/

-- Create webhooks table for multiple webhook support
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  enabled boolean DEFAULT true,
  events text[] DEFAULT ARRAY['application_added', 'application_updated', 'interview_scheduled', 'offer_received'],
  headers jsonb DEFAULT '{}',
  send_form_fields boolean DEFAULT true,
  include_metadata boolean DEFAULT true,
  last_triggered_at timestamptz,
  last_status text,
  last_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled) WHERE enabled = true;

-- Add trigger for updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Remove n8n_webhook_url from user_settings if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'n8n_webhook_url'
  ) THEN
    ALTER TABLE user_settings DROP COLUMN n8n_webhook_url;
  END IF;
END $$;

-- Disable RLS on webhooks table
ALTER TABLE webhooks DISABLE ROW LEVEL SECURITY;