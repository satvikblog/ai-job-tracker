import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './index.css';

// Configure PDF.js worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Log environment variable status for debugging
console.log('Environment check:');
console.log('- Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

// Only test connection if environment variables are properly configured
if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  try {
    // Dynamically import supabase to avoid initialization errors
    import('./lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('Supabase connection successful');
        }
      });
    }).catch((error) => {
      console.error('Failed to initialize Supabase:', error.message);
    });
  } catch (error: any) {
    console.error('Supabase initialization error:', error.message);
  }
} else {
  console.warn('Supabase not configured. Please set up your .env file with valid credentials.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
