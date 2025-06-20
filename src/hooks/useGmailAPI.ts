import { useState, useEffect } from 'react';
import { useGoogleOAuth } from './useGoogleOAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ body?: { data?: string }; mimeType?: string }>;
  };
  internalDate: string;
}

interface ParsedJobEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  companyName: string;
  jobTitle: string;
  content: string;
  isJobRelated: boolean;
  confidence: number;
}

export function useGmailAPI() {
  const [messages, setMessages] = useState<ParsedJobEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { 
    isAuthenticated, 
    getValidToken, 
    requestGooglePermissions, 
    revokeAccess,
    initializeGmailAPI 
  } = useGoogleOAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadLastSyncTime();
    }
  }, [isAuthenticated]);

  const loadLastSyncTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('user_settings')
        .select('last_gmail_sync')
        .eq('user_id', user.id)
        .single();

      if (settings?.last_gmail_sync) {
        setLastSyncTime(new Date(settings.last_gmail_sync));
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const updateLastSyncTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          last_gmail_sync: now.toISOString()
        });

      setLastSyncTime(now);
    } catch (error) {
      console.error('Error updating sync time:', error);
    }
  };

  const fetchJobEmails = async (maxResults: number = 50) => {
    if (!isAuthenticated) {
      toast.error('Please connect to Gmail first');
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        toast.error('Gmail access token expired. Please reconnect.');
        return;
      }

      // Ensure Gmail API is initialized
      await initializeGmailAPI();

      if (!window.gapi?.client?.gmail) {
        throw new Error('Gmail API not properly initialized');
      }

      // Build search query for job-related emails
      let query = 'from:(hr OR recruit OR noreply OR careers OR jobs OR hiring) OR subject:(application OR interview OR position OR job OR opportunity OR offer OR "thank you for applying")';
      
      // Add date filter if we have a last sync time
      if (lastSyncTime) {
        const dateFilter = Math.floor(lastSyncTime.getTime() / 1000);
        query += ` after:${dateFilter}`;
      }

      console.log('Gmail search query:', query);

      // Search for messages
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      if (!response.result.messages || response.result.messages.length === 0) {
        toast.info('No new job-related emails found');
        setMessages([]);
        await updateLastSyncTime();
        return;
      }

      // Fetch full message details in batches
      const messagePromises = response.result.messages.map(async (msg: any) => {
        try {
          const fullMessage = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });
          return fullMessage.result;
        } catch (error) {
          console.error(`Error fetching message ${msg.id}:`, error);
          return null;
        }
      });

      const fullMessages = (await Promise.all(messagePromises)).filter(Boolean) as GmailMessage[];
      
      // Parse and analyze emails
      const parsedEmails = await parseJobEmails(fullMessages);
      
      // Filter high-confidence job emails
      const jobEmails = parsedEmails.filter(email => email.confidence > 0.6);
      
      setMessages(jobEmails);
      await updateLastSyncTime();
      
      toast.success(`Found ${jobEmails.length} job-related emails`);
      
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      toast.error(`Failed to fetch emails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseJobEmails = async (messages: GmailMessage[]): Promise<ParsedJobEmail[]> => {
    return messages.map(message => {
      const headers = message.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = new Date(parseInt(message.internalDate)).toISOString();

      // Extract email content
      let content = extractEmailContent(message);
      
      // Analyze if email is job-related and extract information
      const analysis = analyzeJobEmail(subject, from, content);

      return {
        id: message.id,
        subject,
        from,
        date,
        companyName: analysis.companyName,
        jobTitle: analysis.jobTitle,
        content: content.substring(0, 1000), // Limit content length
        isJobRelated: analysis.isJobRelated,
        confidence: analysis.confidence
      };
    });
  };

  const extractEmailContent = (message: GmailMessage): string => {
    let content = '';

    // Try to get content from body
    if (message.payload.body?.data) {
      content = decodeBase64(message.payload.body.data);
    } 
    // Try to get content from parts
    else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.body?.data) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            content += decodeBase64(part.body.data) + '\n';
          }
        }
      }
    }

    // Clean up HTML tags and extra whitespace
    content = content
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return content;
  };

  const decodeBase64 = (data: string): string => {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (error) {
      console.error('Error decoding base64:', error);
      return '';
    }
  };

  const analyzeJobEmail = (subject: string, from: string, content: string) => {
    const text = `${subject} ${from} ${content}`.toLowerCase();
    
    // Job-related keywords with weights
    const jobKeywords = [
      { keyword: 'application', weight: 0.3 },
      { keyword: 'interview', weight: 0.4 },
      { keyword: 'position', weight: 0.3 },
      { keyword: 'job', weight: 0.2 },
      { keyword: 'opportunity', weight: 0.3 },
      { keyword: 'hiring', weight: 0.4 },
      { keyword: 'recruitment', weight: 0.4 },
      { keyword: 'candidate', weight: 0.3 },
      { keyword: 'resume', weight: 0.3 },
      { keyword: 'cv', weight: 0.3 },
      { keyword: 'offer', weight: 0.5 },
      { keyword: 'thank you for applying', weight: 0.6 },
      { keyword: 'next steps', weight: 0.4 },
      { keyword: 'phone screen', weight: 0.5 },
      { keyword: 'technical interview', weight: 0.5 },
      { keyword: 'onsite', weight: 0.4 },
      { keyword: 'final round', weight: 0.5 }
    ];

    // Calculate confidence score
    let confidence = 0;
    jobKeywords.forEach(({ keyword, weight }) => {
      if (text.includes(keyword)) {
        confidence += weight;
      }
    });

    // Boost confidence for HR/recruitment emails
    if (from.includes('hr') || from.includes('recruit') || from.includes('talent')) {
      confidence += 0.3;
    }

    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1);

    // Extract company name
    let companyName = '';
    const emailDomain = from.match(/@([^>]+)/)?.[1] || '';
    if (emailDomain && !['gmail', 'yahoo', 'outlook', 'hotmail'].some(d => emailDomain.includes(d))) {
      companyName = emailDomain.split('.')[0];
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    }

    // Try to extract company name from content
    if (!companyName) {
      const companyPatterns = [
        /at ([A-Z][a-zA-Z\s&]+?)(?:\s+is|,|\.|!)/g,
        /([A-Z][a-zA-Z\s&]+?) is hiring/g,
        /join ([A-Z][a-zA-Z\s&]+?)(?:\s+as|,|\.|!)/g
      ];

      for (const pattern of companyPatterns) {
        const match = content.match(pattern);
        if (match) {
          companyName = match[1].trim();
          break;
        }
      }
    }

    // Extract job title
    let jobTitle = '';
    const titlePatterns = [
      /(?:for|regarding|re:)\s+(.+?)\s+(?:position|role|job)/i,
      /(.+?)\s+(?:position|role|job)/i,
      /application.*?for\s+(.+)/i,
      /interview.*?for\s+(.+)/i,
      /offer.*?for\s+(.+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = subject.match(pattern);
      if (match) {
        jobTitle = match[1].trim();
        break;
      }
    }

    return {
      isJobRelated: confidence > 0.4,
      confidence,
      companyName,
      jobTitle
    };
  };

  const createApplicationFromEmail = (email: ParsedJobEmail) => {
    return {
      company_name: email.companyName || 'Unknown Company',
      job_title: email.jobTitle || 'Unknown Position',
      source_site: 'Gmail',
      applied_on: email.date.split('T')[0],
      status: 'applied' as const,
      notes: `Email from: ${email.from}\nSubject: ${email.subject}\n\nContent:\n${email.content}`,
      job_link: null,
      salary: null,
      location: null,
      next_follow_up_date: null
    };
  };

  return {
    isAuthenticated,
    loading,
    messages,
    lastSyncTime,
    requestGmailPermissions,
    fetchJobEmails,
    createApplicationFromEmail,
    revokeAccess
  };
}