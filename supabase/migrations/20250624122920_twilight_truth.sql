/*
  # Add request_id to ai_generations table

  1. Changes
    - Add request_id column to ai_generations table for N8N integration
    - Add index for faster lookups by request_id
    - Update table to support N8N workflow responses
*/

-- Add request_id column to ai_generations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_generations' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE ai_generations ADD COLUMN request_id text;
  END IF;
END $$;

-- Create index for request_id lookups
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);

-- Update the table comment
COMMENT ON COLUMN ai_generations.request_id IS 'Unique request ID for N8N workflow integration';