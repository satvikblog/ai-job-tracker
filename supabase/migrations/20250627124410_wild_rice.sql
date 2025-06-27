/*
  # Create AI Resume Table and Trigger

  1. New Tables
    - `ai_resume`
      - `id` (uuid, primary key)
      - `linkedin_job_id` (uuid, references linkedin_jobs)
      - `title` (text, from linkedin_jobs.title)
      - `company_name` (text, from linkedin_jobs.company_name)
      - `description` (text, from linkedin_jobs.description)
      - Additional fields for Resume Generator:
      - `user_id` (uuid, references profiles)
      - `resume_content` (text, AI-generated resume content)
      - `keywords_extracted` (text[], extracted keywords from job description)
      - `skills_required` (text[], required skills)
      - `experience_level` (text, seniority level)
      - `ats_score` (integer, ATS optimization score)
      - `suggestions_count` (integer, number of suggestions generated)
      - `is_processed` (boolean, whether AI processing is complete)
      - `processing_status` (text, current processing status)
      - `generated_at` (timestamp, when AI content was generated)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Triggers
    - Auto-populate from linkedin_jobs table on INSERT/UPDATE
    - Update timestamps automatically

  3. Security
    - Enable RLS with proper policies
    - Users can only access their own AI resume data

  4. Indexes
    - Performance indexes for common queries
*/

-- Create AI Resume table
CREATE TABLE IF NOT EXISTS ai_resume (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_job_id uuid REFERENCES linkedin_jobs(id) ON DELETE CASCADE,
  title text,
  company_name text,
  description text,
  -- Additional fields for Resume Generator
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  resume_content text,
  keywords_extracted text[] DEFAULT '{}',
  skills_required text[] DEFAULT '{}',
  experience_level text,
  ats_score integer DEFAULT 0,
  suggestions_count integer DEFAULT 0,
  is_processed boolean DEFAULT false,
  processing_status text DEFAULT 'pending',
  generated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_resume_linkedin_job_id ON ai_resume(linkedin_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_resume_user_id ON ai_resume(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_resume_is_processed ON ai_resume(is_processed);
CREATE INDEX IF NOT EXISTS idx_ai_resume_processing_status ON ai_resume(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_resume_created_at ON ai_resume(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_resume_ats_score ON ai_resume(ats_score DESC);

-- GIN index for keywords and skills arrays
CREATE INDEX IF NOT EXISTS idx_ai_resume_keywords ON ai_resume USING gin(keywords_extracted);
CREATE INDEX IF NOT EXISTS idx_ai_resume_skills ON ai_resume USING gin(skills_required);

-- Full-text search index for resume content
CREATE INDEX IF NOT EXISTS idx_ai_resume_content_search ON ai_resume USING gin(to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(company_name, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(resume_content, '')
));

-- Enable RLS
ALTER TABLE ai_resume ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own AI resume data"
  ON ai_resume
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI resume data"
  ON ai_resume
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI resume data"
  ON ai_resume
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI resume data"
  ON ai_resume
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_resume_updated_at
  BEFORE UPDATE ON ai_resume
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to populate AI Resume from LinkedIn Jobs
CREATE OR REPLACE FUNCTION populate_ai_resume_from_linkedin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new record into ai_resume table
  INSERT INTO ai_resume (
    linkedin_job_id,
    title,
    company_name,
    description,
    experience_level,
    processing_status
  ) VALUES (
    NEW.id,
    NEW.title,
    NEW.company_name,
    NEW.description,
    NEW.seniority,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on linkedin_jobs table
CREATE TRIGGER trigger_populate_ai_resume
  AFTER INSERT ON linkedin_jobs
  FOR EACH ROW
  EXECUTE FUNCTION populate_ai_resume_from_linkedin();

-- Function to update AI Resume when LinkedIn Jobs are updated
CREATE OR REPLACE FUNCTION update_ai_resume_from_linkedin()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing record in ai_resume table
  UPDATE ai_resume SET
    title = NEW.title,
    company_name = NEW.company_name,
    description = NEW.description,
    experience_level = NEW.seniority,
    updated_at = now()
  WHERE linkedin_job_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger on linkedin_jobs table
CREATE TRIGGER trigger_update_ai_resume
  AFTER UPDATE ON linkedin_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_resume_from_linkedin();

-- Populate existing LinkedIn jobs into AI Resume table
INSERT INTO ai_resume (
  linkedin_job_id,
  title,
  company_name,
  description,
  experience_level,
  processing_status
)
SELECT 
  id,
  title,
  company_name,
  description,
  seniority,
  'pending'
FROM linkedin_jobs
WHERE NOT EXISTS (
  SELECT 1 FROM ai_resume WHERE linkedin_job_id = linkedin_jobs.id
);

-- Function to extract keywords from job description
CREATE OR REPLACE FUNCTION extract_job_keywords(job_description text)
RETURNS text[] AS $$
DECLARE
  keywords text[];
  tech_keywords text[] := ARRAY[
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python', 'java', 'c++', 'c#',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
    'git', 'github', 'gitlab', 'agile', 'scrum', 'kanban', 'jira',
    'api', 'rest', 'graphql', 'microservices', 'serverless',
    'machine learning', 'ai', 'data science', 'analytics', 'big data',
    'cybersecurity', 'devops', 'ci/cd', 'testing', 'automation',
    'frontend', 'backend', 'full-stack', 'mobile', 'ios', 'android',
    'html', 'css', 'sass', 'webpack', 'npm', 'yarn'
  ];
  keyword text;
  description_lower text;
BEGIN
  description_lower := lower(job_description);
  keywords := ARRAY[]::text[];
  
  FOREACH keyword IN ARRAY tech_keywords
  LOOP
    IF position(keyword IN description_lower) > 0 THEN
      keywords := array_append(keywords, keyword);
    END IF;
  END LOOP;
  
  RETURN keywords;
END;
$$ LANGUAGE plpgsql;

-- Function to extract required skills from job description
CREATE OR REPLACE FUNCTION extract_required_skills(job_description text)
RETURNS text[] AS $$
DECLARE
  skills text[];
  soft_skills text[] := ARRAY[
    'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
    'analytical thinking', 'critical thinking', 'project management', 'time management',
    'adaptability', 'creativity', 'innovation', 'attention to detail',
    'presentation skills', 'mentoring', 'coaching', 'strategic thinking'
  ];
  skill text;
  description_lower text;
BEGIN
  description_lower := lower(job_description);
  skills := ARRAY[]::text[];
  
  FOREACH skill IN ARRAY soft_skills
  LOOP
    IF position(skill IN description_lower) > 0 THEN
      skills := array_append(skills, skill);
    END IF;
  END LOOP;
  
  RETURN skills;
END;
$$ LANGUAGE plpgsql;

-- Function to process AI Resume data (extract keywords and skills)
CREATE OR REPLACE FUNCTION process_ai_resume_data(resume_id uuid)
RETURNS void AS $$
DECLARE
  resume_record ai_resume%ROWTYPE;
  extracted_keywords text[];
  extracted_skills text[];
BEGIN
  -- Get the resume record
  SELECT * INTO resume_record FROM ai_resume WHERE id = resume_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI Resume record not found with id: %', resume_id;
  END IF;
  
  -- Extract keywords and skills
  extracted_keywords := extract_job_keywords(resume_record.description);
  extracted_skills := extract_required_skills(resume_record.description);
  
  -- Update the record with extracted data
  UPDATE ai_resume SET
    keywords_extracted = extracted_keywords,
    skills_required = extracted_skills,
    processing_status = 'keywords_extracted',
    updated_at = now()
  WHERE id = resume_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get AI Resume data for a specific LinkedIn job
CREATE OR REPLACE FUNCTION get_ai_resume_for_job(job_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  company_name text,
  description text,
  keywords_extracted text[],
  skills_required text[],
  experience_level text,
  ats_score integer,
  processing_status text,
  is_processed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.title,
    ar.company_name,
    ar.description,
    ar.keywords_extracted,
    ar.skills_required,
    ar.experience_level,
    ar.ats_score,
    ar.processing_status,
    ar.is_processed
  FROM ai_resume ar
  WHERE ar.linkedin_job_id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update AI Resume with generated content
CREATE OR REPLACE FUNCTION update_ai_resume_content(
  resume_id uuid,
  content text,
  ats_score integer DEFAULT 0,
  suggestions_count integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  UPDATE ai_resume SET
    resume_content = content,
    ats_score = ats_score,
    suggestions_count = suggestions_count,
    is_processed = true,
    processing_status = 'completed',
    generated_at = now(),
    updated_at = now()
  WHERE id = resume_id;
END;
$$ LANGUAGE plpgsql;

-- Process existing records to extract keywords and skills
DO $$
DECLARE
  resume_record RECORD;
BEGIN
  FOR resume_record IN SELECT id FROM ai_resume WHERE processing_status = 'pending'
  LOOP
    PERFORM process_ai_resume_data(resume_record.id);
  END LOOP;
END $$;

-- Add comment to table
COMMENT ON TABLE ai_resume IS 'AI Resume generation data sourced from LinkedIn jobs with additional processing fields';
COMMENT ON COLUMN ai_resume.linkedin_job_id IS 'Reference to the source LinkedIn job';
COMMENT ON COLUMN ai_resume.keywords_extracted IS 'Technical keywords extracted from job description';
COMMENT ON COLUMN ai_resume.skills_required IS 'Required skills extracted from job description';
COMMENT ON COLUMN ai_resume.ats_score IS 'ATS optimization score (0-100)';
COMMENT ON COLUMN ai_resume.processing_status IS 'Current processing status: pending, keywords_extracted, processing, completed, error';
COMMENT ON COLUMN ai_resume.is_processed IS 'Whether AI processing is complete';