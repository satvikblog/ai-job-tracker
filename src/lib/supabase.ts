import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zeiivnxtkcqwlnmtxyfd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWl2bnh0a2Nxd2xubXR4eWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzMyNzUsImV4cCI6MjA2NTY0OTI3NX0.lhahnsYyO9yEvnYTt-5fxZ6bxtDzqHSiOR0OABD_jSI';

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Warning: Using fallback Supabase credentials. This should not happen in production.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Warning: Invalid Supabase URL format. Using fallback URL.');
}

// Validate anon key format (basic JWT structure check)
if (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.split('.').length !== 3) {
  console.error('Warning: Invalid Supabase anon key format. Using fallback key.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'jobtracker-ai@1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Auth helpers
export const auth = supabase.auth;

// Storage helpers
export const storage = supabase.storage;

// Database helpers
export const db = supabase;

// Helper function to get current user ID
export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Test connection
export const testConnection = async () => {
  try {
    // Simple health check
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};
