/*
  # Create Job Leads Table

  1. New Tables
    - `job_leads`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `is_valid_opportunity` (boolean)
      - `job_title` (text)
      - `company_name` (text)
      - `location` (text)
      - `salary` (text)
      - `job_type` (text)
      - `deadline` (date)
      - `job_link` (text)
      - `recruiter_name` (text)
      - `email_snippet` (text)
      - `email_subject` (text)
      - `email_from` (text)
      - `email_to` (text)
      - `thread_id` (text)
      - `source` (text, default 'gmail')
      - `extracted_from` (text)
      - `parsed_by` (text)

  2. Security
    - No RLS policies (public read access for job opportunities)
    - Indexes for better performance
*/

-- Create job_leads table
CREATE TABLE IF NOT EXISTS job_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  is_valid_opportunity boolean,
  job_title text,
  company_name text,
  location text,
  salary text,
  job_type text,
  deadline date,
  job_link text,
  recruiter_name text,
  email_snippet text,
  email_subject text,
  email_from text,
  email_to text,
  thread_id text,
  source text DEFAULT 'gmail',
  extracted_from text,
  parsed_by text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_leads_valid_opportunity ON job_leads(is_valid_opportunity) WHERE is_valid_opportunity = true;
CREATE INDEX IF NOT EXISTS idx_job_leads_created_at ON job_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_job_leads_source ON job_leads(source);
CREATE INDEX IF NOT EXISTS idx_job_leads_location ON job_leads(location);
CREATE INDEX IF NOT EXISTS idx_job_leads_job_type ON job_leads(job_type);
CREATE INDEX IF NOT EXISTS idx_job_leads_company ON job_leads(company_name);

-- Disable RLS for public access to job opportunities
ALTER TABLE job_leads DISABLE ROW LEVEL SECURITY;

-- Insert some sample data for testing
INSERT INTO job_leads (
  is_valid_opportunity,
  job_title,
  company_name,
  location,
  salary,
  job_type,
  deadline,
  job_link,
  recruiter_name,
  source,
  email_subject,
  email_from
) VALUES 
(
  true,
  'Senior Software Engineer',
  'TechCorp Solutions',
  'San Francisco, CA',
  '$120,000 - $150,000',
  'Full-time',
  '2025-07-15',
  'https://techcorp.com/careers/senior-engineer',
  'Sarah Johnson',
  'linkedin',
  'Exciting Opportunity at TechCorp',
  'sarah.johnson@techcorp.com'
),
(
  true,
  'Frontend Developer',
  'StartupXYZ',
  'Remote',
  '$80,000 - $100,000',
  'Full-time',
  '2025-06-30',
  'https://startupxyz.com/jobs/frontend-dev',
  'Mike Chen',
  'gmail',
  'Frontend Developer Position',
  'mike.chen@startupxyz.com'
),
(
  true,
  'Data Scientist',
  'DataFlow Inc',
  'New York, NY',
  '$110,000 - $140,000',
  'Full-time',
  '2025-07-01',
  'https://dataflow.com/careers/data-scientist',
  'Emily Rodriguez',
  'website',
  'Data Science Role Available',
  'emily.r@dataflow.com'
),
(
  true,
  'DevOps Engineer',
  'CloudTech',
  'Austin, TX',
  '$95,000 - $125,000',
  'Contract',
  '2025-06-25',
  'https://cloudtech.com/jobs/devops',
  'Alex Thompson',
  'email',
  'DevOps Engineer Opportunity',
  'alex.thompson@cloudtech.com'
),
(
  true,
  'Product Manager',
  'InnovateCorp',
  'Seattle, WA',
  '$130,000 - $160,000',
  'Full-time',
  '2025-07-10',
  'https://innovatecorp.com/careers/pm',
  'Lisa Wang',
  'linkedin',
  'Product Manager Role',
  'lisa.wang@innovatecorp.com'
);