import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './index.css';

// Hardcoded Supabase credentials for Vercel deployment
const SUPABASE_URL = 'https://zeiivnxtkcqwlnmtxyfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWl2bnh0a2Nxd2xubXR4eWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzMyNzUsImV4cCI6MjA2NTY0OTI3NX0.lhahnsYyO9yEvnYTt-5fxZ6bxtDzqHSiOR0OABD_jSI';

// Configure PDF.js worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Log environment variable status for debugging
console.log('Environment check:');
console.log('- Supabase URL from env:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- Supabase Anon Key from env:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- Using fallback credentials:', SUPABASE_URL ? 'Yes' : 'No');

// Only test connection if environment variables are properly configured
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
