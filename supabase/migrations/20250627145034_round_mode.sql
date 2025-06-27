/*
  # Enable Row Level Security on documents table

  1. Security Changes
    - Enable RLS on `documents` table to enforce existing policies
    - This will allow the existing INSERT, SELECT, UPDATE, DELETE policies to take effect
    - Users will be able to manage their own documents based on user_id matching auth.uid()

  The table already has proper RLS policies defined but RLS was not enabled.
  This migration simply enables RLS to make those policies active.
*/

-- Enable Row Level Security on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;