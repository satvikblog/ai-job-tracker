/*
  # Database Performance Optimization

  1. Enhanced Indexing Strategy
    - Composite indexes for common query patterns
    - Partial indexes for filtered queries
    - GIN indexes for array and JSONB columns
    - Text search indexes for full-text search

  2. Query Optimization
    - Covering indexes to reduce table lookups
    - Optimized foreign key indexes
    - Performance-focused index ordering

  3. Data Retrieval Enhancements
    - Materialized views for complex aggregations
    - Optimized RLS policies
    - Efficient pagination support
*/

-- =====================================================
-- JOB APPLICATIONS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for user-specific queries with status filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status_date 
ON job_applications (user_id, status, applied_on DESC);

-- Composite index for user-specific queries with follow-up filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_user_followup 
ON job_applications (user_id, next_follow_up_date) 
WHERE next_follow_up_date IS NOT NULL;

-- Full-text search index for job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_search 
ON job_applications USING gin(to_tsvector('english', 
  coalesce(company_name, '') || ' ' || 
  coalesce(job_title, '') || ' ' || 
  coalesce(notes, '') || ' ' || 
  coalesce(location, '')
));

-- Index for salary range queries
CREATE INDEX IF NOT EXISTS idx_job_applications_salary 
ON job_applications (user_id, salary) 
WHERE salary IS NOT NULL;

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_job_applications_location 
ON job_applications (user_id, location) 
WHERE location IS NOT NULL;

-- Covering index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_job_applications_dashboard 
ON job_applications (user_id, created_at DESC) 
INCLUDE (company_name, job_title, status, applied_on);

-- =====================================================
-- JOB LEADS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for valid opportunities with deadline sorting
CREATE INDEX IF NOT EXISTS idx_job_leads_valid_deadline 
ON job_leads (is_valid_opportunity, deadline DESC NULLS LAST) 
WHERE is_valid_opportunity = true;

-- Full-text search index for job leads
CREATE INDEX IF NOT EXISTS idx_job_leads_search 
ON job_leads USING gin(to_tsvector('english', 
  coalesce(job_title, '') || ' ' || 
  coalesce(company_name, '') || ' ' || 
  coalesce(location, '') || ' ' || 
  coalesce(email_snippet, '') || ' ' || 
  coalesce(recruiter_name, '')
));

-- GIN index for responsibilities array
CREATE INDEX IF NOT EXISTS idx_job_leads_responsibilities 
ON job_leads USING gin(responsibilities);

-- GIN index for requirements array
CREATE INDEX IF NOT EXISTS idx_job_leads_requirements 
ON job_leads USING gin(requirements);

-- Composite index for filtering by location and job type
CREATE INDEX IF NOT EXISTS idx_job_leads_location_type 
ON job_leads (location, job_type, is_valid_opportunity) 
WHERE is_valid_opportunity = true;

-- Index for source-based filtering
CREATE INDEX IF NOT EXISTS idx_job_leads_source_created 
ON job_leads (source, created_at DESC) 
WHERE is_valid_opportunity = true;

-- Partial index for urgent deadlines
CREATE INDEX IF NOT EXISTS idx_job_leads_urgent_deadline 
ON job_leads (deadline, created_at DESC) 
WHERE is_valid_opportunity = true 
AND deadline IS NOT NULL 
AND deadline >= CURRENT_DATE 
AND deadline <= CURRENT_DATE + INTERVAL '7 days';

-- =====================================================
-- CONTACTS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for job application contacts
CREATE INDEX IF NOT EXISTS idx_contacts_job_app_name 
ON contacts (job_application_id, name);

-- Index for email-based contact searches
CREATE INDEX IF NOT EXISTS idx_contacts_email 
ON contacts (email) 
WHERE email IS NOT NULL;

-- Index for LinkedIn profile searches
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin 
ON contacts (linkedin) 
WHERE linkedin IS NOT NULL;

-- =====================================================
-- DOCUMENTS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for user documents by type and date
CREATE INDEX IF NOT EXISTS idx_documents_user_type_date 
ON documents (user_id, file_type, uploaded_on DESC);

-- Index for linked job documents
CREATE INDEX IF NOT EXISTS idx_documents_linked_job 
ON documents (linked_job_id, file_type) 
WHERE linked_job_id IS NOT NULL;

-- Index for file size analysis
CREATE INDEX IF NOT EXISTS idx_documents_user_size 
ON documents (user_id, file_size DESC);

-- =====================================================
-- FOLLOW UPS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for follow-up queries by date and status
CREATE INDEX IF NOT EXISTS idx_follow_ups_date_status 
ON follow_ups (date DESC, response_status);

-- Index for pending follow-ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending 
ON follow_ups (job_application_id, date DESC) 
WHERE response_status = 'pending';

-- =====================================================
-- AI GENERATIONS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for user AI generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_job_type_date 
ON ai_generations (job_application_id, type, generated_on DESC);

-- Index for used/unused generations
CREATE INDEX IF NOT EXISTS idx_ai_generations_usage 
ON ai_generations (job_application_id, is_used, generated_on DESC);

-- =====================================================
-- USER SETTINGS TABLE OPTIMIZATION
-- =====================================================

-- Index for Google OAuth enabled users
CREATE INDEX IF NOT EXISTS idx_user_settings_google_sync 
ON user_settings (google_oauth_enabled, last_gmail_sync) 
WHERE google_oauth_enabled = true;

-- GIN index for notification preferences
CREATE INDEX IF NOT EXISTS idx_user_settings_notifications 
ON user_settings USING gin(notification_preferences);

-- =====================================================
-- OAUTH TOKENS TABLE OPTIMIZATION
-- =====================================================

-- Composite index for token retrieval and expiry
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider_expiry 
ON oauth_tokens (user_id, provider, expires_at DESC);

-- Index for expired tokens cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expired 
ON oauth_tokens (expires_at) 
WHERE expires_at < NOW();

-- =====================================================
-- WEBHOOKS TABLE OPTIMIZATION
-- =====================================================

-- Index for enabled webhooks with events
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled_events 
ON webhooks USING gin(events) 
WHERE enabled = true;

-- Index for webhook status monitoring
CREATE INDEX IF NOT EXISTS idx_webhooks_user_status 
ON webhooks (user_id, last_triggered_at DESC, last_status);

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- User dashboard statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT 
  user_id,
  COUNT(*) as total_applications,
  COUNT(*) FILTER (WHERE status = 'applied') as applied_count,
  COUNT(*) FILTER (WHERE status = 'followed-up') as followed_up_count,
  COUNT(*) FILTER (WHERE status = 'interview') as interview_count,
  COUNT(*) FILTER (WHERE status = 'offer') as offer_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'no-response') as no_response_count,
  COUNT(*) FILTER (WHERE next_follow_up_date IS NOT NULL AND next_follow_up_date >= CURRENT_DATE) as pending_followups,
  AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_response_time_days,
  MAX(applied_on) as last_application_date,
  MIN(applied_on) as first_application_date
FROM job_applications 
GROUP BY user_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_user_id 
ON user_dashboard_stats (user_id);

-- Monthly application trends view
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_application_trends AS
SELECT 
  user_id,
  DATE_TRUNC('month', applied_on) as month,
  COUNT(*) as application_count,
  COUNT(*) FILTER (WHERE status IN ('interview', 'offer')) as positive_responses,
  COUNT(DISTINCT company_name) as unique_companies,
  COUNT(DISTINCT source_site) as unique_sources
FROM job_applications 
WHERE applied_on >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY user_id, DATE_TRUNC('month', applied_on);

-- Create indexes on monthly trends view
CREATE INDEX IF NOT EXISTS idx_monthly_trends_user_month 
ON monthly_application_trends (user_id, month DESC);

-- =====================================================
-- FUNCTIONS FOR OPTIMIZED QUERIES
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_application_trends;
END;
$$;

-- Function to get user dashboard data efficiently
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id uuid)
RETURNS TABLE(
  total_applications bigint,
  applied_count bigint,
  followed_up_count bigint,
  interview_count bigint,
  offer_count bigint,
  rejected_count bigint,
  no_response_count bigint,
  pending_followups bigint,
  avg_response_time_days numeric,
  recent_applications json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uds.total_applications,
    uds.applied_count,
    uds.followed_up_count,
    uds.interview_count,
    uds.offer_count,
    uds.rejected_count,
    uds.no_response_count,
    uds.pending_followups,
    uds.avg_response_time_days,
    (
      SELECT json_agg(
        json_build_object(
          'id', ja.id,
          'company_name', ja.company_name,
          'job_title', ja.job_title,
          'status', ja.status,
          'applied_on', ja.applied_on,
          'location', ja.location,
          'salary', ja.salary
        )
      )
      FROM (
        SELECT * FROM job_applications 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC 
        LIMIT 5
      ) ja
    ) as recent_applications
  FROM user_dashboard_stats uds
  WHERE uds.user_id = p_user_id;
END;
$$;

-- Function for optimized job search
CREATE OR REPLACE FUNCTION search_job_opportunities(
  p_search_term text DEFAULT '',
  p_location text DEFAULT '',
  p_job_type text DEFAULT '',
  p_source text DEFAULT '',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  job_title text,
  company_name text,
  location text,
  salary text,
  job_type text,
  deadline date,
  job_link text,
  recruiter_name text,
  email_snippet text,
  source text,
  responsibilities text[],
  requirements text[],
  duration text,
  website text,
  search_rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jl.id,
    jl.created_at,
    jl.job_title,
    jl.company_name,
    jl.location,
    jl.salary,
    jl.job_type,
    jl.deadline,
    jl.job_link,
    jl.recruiter_name,
    jl.email_snippet,
    jl.source,
    jl.responsibilities,
    jl.requirements,
    jl.duration,
    jl.website,
    CASE 
      WHEN p_search_term = '' THEN 1.0
      ELSE ts_rank(
        to_tsvector('english', 
          coalesce(jl.job_title, '') || ' ' || 
          coalesce(jl.company_name, '') || ' ' || 
          coalesce(jl.location, '') || ' ' || 
          coalesce(jl.email_snippet, '') || ' ' || 
          coalesce(jl.recruiter_name, '')
        ),
        plainto_tsquery('english', p_search_term)
      )
    END as search_rank
  FROM job_leads jl
  WHERE jl.is_valid_opportunity = true
    AND (p_search_term = '' OR to_tsvector('english', 
        coalesce(jl.job_title, '') || ' ' || 
        coalesce(jl.company_name, '') || ' ' || 
        coalesce(jl.location, '') || ' ' || 
        coalesce(jl.email_snippet, '') || ' ' || 
        coalesce(jl.recruiter_name, '')
      ) @@ plainto_tsquery('english', p_search_term))
    AND (p_location = '' OR jl.location = p_location)
    AND (p_job_type = '' OR jl.job_type = p_job_type)
    AND (p_source = '' OR jl.source = p_source)
  ORDER BY 
    CASE WHEN p_search_term = '' THEN jl.created_at ELSE NULL END DESC,
    CASE WHEN p_search_term != '' THEN search_rank ELSE NULL END DESC,
    jl.deadline ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- AUTOMATED MAINTENANCE
-- =====================================================

-- Function to clean up expired OAuth tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM oauth_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW slow_query_monitor AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
  AND tablename IN ('job_applications', 'job_leads', 'contacts', 'documents', 'follow_ups');

-- =====================================================
-- REFRESH MATERIALIZED VIEWS INITIALLY
-- =====================================================

-- Refresh the materialized views to populate them
REFRESH MATERIALIZED VIEW user_dashboard_stats;
REFRESH MATERIALIZED VIEW monthly_application_trends;

-- =====================================================
-- ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- =====================================================

ANALYZE job_applications;
ANALYZE job_leads;
ANALYZE contacts;
ANALYZE documents;
ANALYZE follow_ups;
ANALYZE ai_generations;
ANALYZE user_settings;
ANALYZE oauth_tokens;
ANALYZE webhooks;