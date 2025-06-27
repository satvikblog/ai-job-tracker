/*
  # Add career_page_company column to job_applications table

  1. Schema Changes
    - Add `career_page_company` column to `job_applications` table
    - Column will be optional (nullable) text field
    - Add index for better query performance

  2. Security
    - No RLS changes needed as existing policies will cover the new column
*/

-- Add career_page_company column to job_applications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_applications' AND column_name = 'career_page_company'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN career_page_company text;
  END IF;
END $$;

-- Add index for better query performance on career_page_company
CREATE INDEX IF NOT EXISTS idx_job_applications_career_page_company 
ON job_applications (career_page_company) 
WHERE career_page_company IS NOT NULL;