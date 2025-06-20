import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  // Show user-friendly error
  if (typeof window !== 'undefined') {
    const errorMessage = `
      🔧 Configuration Required
      
      Please set up your Supabase credentials:
      1. Copy .env.example to .env
      2. Add your Supabase URL and Anon Key
      3. Restart the development server
      
      Missing: ${!supabaseUrl ? 'VITE_SUPABASE_URL ' : ''}${!supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : ''}
    `;
    console.warn(errorMessage);
  }
}

// Use placeholder values if environment variables are missing (for development)
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient<Database>(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'jobtracker-ai@1.0.0',
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

// Test connection with better error handling
export const testConnection = async () => {
  try {
    // Check if we have valid environment variables
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl.includes('placeholder') || 
        supabaseUrl.includes('your_supabase_project_url') ||
        supabaseAnonKey.includes('placeholder') ||
        supabaseAnonKey.includes('your_supabase_anon_key')) {
      console.warn('⚠️ Using placeholder Supabase credentials');
      return false;
    }

    // Test the connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Initialize connection test
testConnection();