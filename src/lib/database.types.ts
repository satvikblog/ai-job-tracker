export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          company_name: string
          job_title: string
          job_link: string | null
          source_site: string
          applied_on: string
          status: 'applied' | 'followed-up' | 'rejected' | 'no-response' | 'offer' | 'interview'
          next_follow_up_date: string | null
          notes: string | null
          salary: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          job_title: string
          job_link?: string | null
          source_site: string
          applied_on: string
          status?: 'applied' | 'followed-up' | 'rejected' | 'no-response' | 'offer' | 'interview'
          next_follow_up_date?: string | null
          notes?: string | null
          salary?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          job_title?: string
          job_link?: string | null
          source_site?: string
          applied_on?: string
          status?: 'applied' | 'followed-up' | 'rejected' | 'no-response' | 'offer' | 'interview'
          next_follow_up_date?: string | null
          notes?: string | null
          salary?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          job_application_id: string
          name: string
          email: string | null
          linkedin: string | null
          phone: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_application_id: string
          name: string
          email?: string | null
          linkedin?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_application_id?: string
          name?: string
          email?: string | null
          linkedin?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: 'resume' | 'cover-letter' | 'certificate' | 'other'
          file_url: string
          file_size: number
          uploaded_on: string
          linked_job_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: 'resume' | 'cover-letter' | 'certificate' | 'other'
          file_url: string
          file_size?: number
          uploaded_on?: string
          linked_job_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: 'resume' | 'cover-letter' | 'certificate' | 'other'
          file_url?: string
          file_size?: number
          uploaded_on?: string
          linked_job_id?: string | null
        }
      }
      follow_ups: {
        Row: {
          id: string
          job_application_id: string
          date: string
          email_text: string
          response_status: 'positive' | 'negative' | 'no-reply' | 'pending'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_application_id: string
          date: string
          email_text: string
          response_status?: 'positive' | 'negative' | 'no-reply' | 'pending'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_application_id?: string
          date?: string
          email_text?: string
          response_status?: 'positive' | 'negative' | 'no-reply' | 'pending'
          notes?: string | null
          created_at?: string
        }
      }
      ai_generations: {
        Row: {
          id: string
          job_application_id: string
          type: 'resume' | 'cover-letter'
          content: string
          generated_on: string
          is_used: boolean
        }
        Insert: {
          id?: string
          job_application_id: string
          type: 'resume' | 'cover-letter'
          content: string
          generated_on?: string
          is_used?: boolean
        }
        Update: {
          id?: string
          job_application_id?: string
          type?: 'resume' | 'cover-letter'
          content?: string
          generated_on?: string
          is_used?: boolean
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          openai_api_key: string | null
          gmail_integration_enabled: boolean
          notification_preferences: Json
          google_oauth_enabled: boolean
          google_client_id: string | null
          last_gmail_sync: string | null
          ai_provider: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          openai_api_key?: string | null
          gmail_integration_enabled?: boolean
          notification_preferences?: Json
          google_oauth_enabled?: boolean
          google_client_id?: string | null
          last_gmail_sync?: string | null
          ai_provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          openai_api_key?: string | null
          gmail_integration_enabled?: boolean
          notification_preferences?: Json
          google_oauth_enabled?: boolean
          google_client_id?: string | null
          last_gmail_sync?: string | null
          ai_provider?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          enabled: boolean
          events: string[]
          headers: Json
          send_form_fields: boolean
          include_metadata: boolean
          last_triggered_at: string | null
          last_status: string | null
          last_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          enabled?: boolean
          events?: string[]
          headers?: Json
          send_form_fields?: boolean
          include_metadata?: boolean
          last_triggered_at?: string | null
          last_status?: string | null
          last_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          enabled?: boolean
          events?: string[]
          headers?: Json
          send_form_fields?: boolean
          include_metadata?: boolean
          last_triggered_at?: string | null
          last_status?: string | null
          last_response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      oauth_tokens: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          scope: string | null
          token_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          token_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          token_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      store_oauth_token: {
        Args: {
          p_user_id: string
          p_provider: string
          p_access_token: string
          p_refresh_token?: string
          p_expires_at?: string
          p_scope?: string
        }
        Returns: string
      }
      get_oauth_token: {
        Args: {
          p_user_id: string
          p_provider: string
        }
        Returns: {
          access_token: string
          refresh_token: string
          expires_at: string
          is_expired: boolean
        }[]
      }
    }
    Enums: {
      application_status: 'applied' | 'followed-up' | 'rejected' | 'no-response' | 'offer' | 'interview'
      file_type: 'resume' | 'cover-letter' | 'certificate' | 'other'
      response_status: 'positive' | 'negative' | 'no-reply' | 'pending'
      generation_type: 'resume' | 'cover-letter'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}