import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { N8N_RAILWAY_CONFIG } from '../lib/n8nConfig';
import toast from 'react-hot-toast';

interface N8NRequest {
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

export function useN8NIntegration() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendToN8N = async (
    type: 'resume' | 'cover-letter',
    data: any,
    webhookUrl: string
  ): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const requestId = generateRequestId();
    
    const payload: N8NRequest = {
      type,
      user_id: user.id,
      user_email: user.email || '',
      request_id: requestId,
      timestamp: new Date().toISOString(),
      data
    };

    console.log('🚀 Sending to N8N Railway:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobTracker-AI/1.0',
        'X-Request-Source': 'jobtracker-ai',
        'X-Railway-Domain': 'tracker.satvik.live'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`N8N Railway webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return requestId;
  };

  const startProgressTimer = (duration: number = 240) => {
    setTimeRemaining(duration);
    setProgress(0);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
      
      setProgress(prev => {
        const newProgress = ((duration - timeRemaining + 1) / duration) * 100;
        return Math.min(newProgress, 95); // Cap at 95% until we get response
      });
    }, 1000);

    return interval;
  };

  const generateContent = async (
    type: 'resume' | 'cover-letter',
    formData: any
  ) => {
    try {
      setLoading(true);
      setGeneratedContent('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the Railway webhook URL directly
      const webhookUrl = N8N_RAILWAY_CONFIG.WEBHOOK_URL;
      
      // Send request to N8N
      const requestId = await sendToN8N(type, formData, webhookUrl);
      setCurrentRequestId(requestId);
      
      // Start progress timer
      const timer = startProgressTimer(65);
      
      // Start polling for response
      const pollForResponse = async () => {
        const maxAttempts = 240; // 70 seconds max wait
        let attempts = 0;
        
        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            clearInterval(timer);
            setLoading(false);
            setProgress(100);
            throw new Error('Request timed out. Please try again.');
          }
          
          attempts++;
          
          // Check if we received a response
          const response = await checkForResponse(requestId);
          
          if (response) {
            clearInterval(timer);
            setProgress(100);
            setTimeRemaining(0);
            
            if (response.status === 'success' && response.content) {
              setGeneratedContent(response.content);
              toast.success(`${type === 'resume' ? 'Resume suggestions' : 'Cover letter'} generated successfully!`);
            } else {
              throw new Error(response.error_message || 'Generation failed');
            }
            
            setLoading(false);
            return;
          }
          
          // Continue polling
          setTimeout(poll, 1000);
        };
        
        poll();
      };
      
      pollForResponse();
      
    } catch (error: any) {
      console.error('Error generating content:', error);
      setLoading(false);
      setProgress(0);
      setTimeRemaining(0);
      toast.error(error.message || 'Failed to generate content');
      throw error;
    }
  };

  const checkForResponse = async (requestId: string) => {
    try {
      // Check our database for the response
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for response:', error);
        return null;
      }

      if (data && data.content) {
        return {
          request_id: requestId,
          type: data.type,
          status: 'success',
          content: data.content
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking for response:', error);
      return null;
    }
  };

  const resetState = () => {
    setLoading(false);
    setProgress(0);
    setTimeRemaining(0);
    setGeneratedContent('');
    setCurrentRequestId(null);
  };

  return {
    loading,
    progress,
    timeRemaining,
    generatedContent,
    currentRequestId,
    generateContent,
    resetState,
    setGeneratedContent
  };
}
