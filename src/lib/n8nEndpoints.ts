// N8N Integration Configuration for Railway Webhook

export const N8N_CONFIG = {
  // Your Railway N8N webhook URL
  WEBHOOK_URL: 'https://primary-production-130e0.up.railway.app/webhook-test/job-application-received',
  
  // Response endpoint (Supabase Edge Function)
  RESPONSE_ENDPOINT: 'https://zeiivnxtkcqwlnmtxyfd.supabase.co/functions/v1/n8n-response',

  // Timeout settings
  PROCESSING_TIMEOUT: 70000, // 70 seconds
  POLL_INTERVAL: 1000, // 1 second
  
  // Progress settings
  PROGRESS_DURATION: 65, // 65 seconds for progress bar
  
  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
    'User-Agent': 'JobTracker-AI/1.0',
    'X-Request-Source': 'jobtracker-ai'
  }
};

// Types for N8N integration
export interface N8NWebhookPayload {
  type: 'resume' | 'cover-letter';
  user_id: string;
  user_email: string;
  request_id: string;
  timestamp: string;
  data: {
    company_name: string;
    job_title: string;
    job_description: string;
    selected_job_id?: string;
    // Cover letter specific
    hiring_manager?: string;
    tone?: string;
    personal_experience?: string;
    why_company?: string;
  };
}

export interface N8NResponsePayload {
  request_id: string;
  type: 'resume' | 'cover-letter';
  status: 'success' | 'error';
  content?: string;
  error_message?: string;
  processing_time?: number;
  metadata?: {
    keywords_found?: string[];
    ats_score?: number;
    suggestions_count?: number;
  };
}