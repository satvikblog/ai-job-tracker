import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
type Webhook = Database['public']['Tables']['webhooks']['Row'];

export function useWebhookIntegration() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const createWebhook = async (webhookData: Omit<Database['public']['Tables']['webhooks']['Insert'], 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      setLoading(true);

      console.log('Creating webhook with data:', webhookData);

      // Ensure events is an array
      const events = Array.isArray(webhookData.events) ? webhookData.events : [];
      
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          ...webhookData,
          events,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await loadWebhooks();
      toast.success('Webhook created successfully!');
      return data;
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      toast.error(error.message || 'Failed to create webhook');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Database['public']['Tables']['webhooks']['Update']>) => {
    try {
      setLoading(true);

      console.log('Updating webhook with data:', updates);

      // Ensure events is an array
      if (updates.events) {
        updates.events = Array.isArray(updates.events) ? updates.events : [];
      }

      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await loadWebhooks();
      toast.success('Webhook updated successfully!');
    } catch (error: any) {
      console.error('Error updating webhook:', error);
      toast.error(error.message || 'Failed to update webhook');
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadWebhooks();
      toast.success('Webhook deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete webhook');
    } finally {
      setLoading(false);
    }
  };

  const sendWebhook = async (event: string, application: JobApplication, additionalData?: any) => {
    const activeWebhooks = webhooks.filter(webhook => 
      webhook.enabled && webhook.events.includes(event)
    );

    if (activeWebhooks.length === 0) {
      console.log(`No active webhooks for event: ${event}`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Send to all active webhooks
    const webhookPromises = activeWebhooks.map(async (webhook) => {
      try {
        // Prepare payload exactly as your n8n workflow expects
        const payload = {
          company_name: application.company_name || '',
          job_title: application.job_title || '',
          job_link: application.job_link || '',
          source_site: application.source_site || '',
          applied_on: application.applied_on || '',
          status: application.status || '',
          next_follow_up_date: application.next_follow_up_date || '',
          notes: application.notes || '',
          salary: application.salary || '',
          location: application.location || '',
          user_id: user.id,
          user_email: user.email || '',
          event_type: event,
          timestamp: new Date().toISOString(),
          application_id: application.id,
          ...(additionalData || {})
        };

        console.log(`Sending webhook "${webhook.name}" for ${event}:`, payload);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'JobTracker-AI/1.0'
          },
          body: JSON.stringify(payload)
        });

        const responseText = response.ok 
          ? await response.text().catch(() => 'OK') 
          : await response.text().catch(() => 'Error');

        // Update webhook status
        await supabase
          .from('webhooks')
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status: response.ok ? 'success' : 'failed',
            last_response: responseText.substring(0, 1000) // Limit response length
          })
          .eq('id', webhook.id);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }

        console.log(`✅ Webhook "${webhook.name}" sent successfully for event: ${event}`);
        return { webhook, success: true, response: responseText };

      } catch (error: any) {
        console.error(`❌ Webhook "${webhook.name}" failed:`, error);
        
        // Update webhook status with error
        await supabase
          .from('webhooks')
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status: 'failed',
            last_response: error.message.substring(0, 1000)
          })
          .eq('id', webhook.id);

        return { webhook, success: false, error: error.message };
      }
    });

    const results = await Promise.all(webhookPromises);
    
    // Show summary toast
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (successCount > 0 && failCount === 0) {
      console.log(`✅ ${successCount} webhook(s) triggered successfully for ${event.replace('_', ' ')}`);
    } else if (successCount > 0 && failCount > 0) {
      console.log(`⚠️ ${successCount} webhook(s) succeeded, ${failCount} failed for ${event.replace('_', ' ')}`);
    } else if (failCount > 0) {
      console.log(`❌ All ${failCount} webhook(s) failed for ${event.replace('_', ' ')}`);
    }

    // Reload webhooks to get updated status
    await loadWebhooks();
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) {
      toast.error('Webhook not found');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create test application data
      const testApplication: JobApplication = {
        id: 'test-' + Date.now(),
        user_id: user.id,
        company_name: 'Test Company',
        job_title: 'Test Position',
        job_link: 'https://example.com/job/test',
        source_site: 'Test Source',
        applied_on: new Date().toISOString().split('T')[0],
        status: 'applied',
        next_follow_up_date: null,
        notes: 'This is a test webhook from JobTracker AI',
        salary: '$50,000 - $70,000',
        location: 'Remote',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await sendWebhook('test_webhook', testApplication, {
        test: true,
        message: `Test webhook for "${webhook.name}"`
      });

      toast.success(`Test webhook sent to "${webhook.name}" successfully!`);
    } catch (error: any) {
      toast.error(`Test webhook failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const onApplicationAdded = async (application: JobApplication) => {
    console.log('🚀 Application added, triggering webhooks:', application.company_name);
    await sendWebhook('application_added', application);
  };

  const onApplicationUpdated = async (application: JobApplication, previousStatus?: string) => {
    console.log('📝 Application updated, triggering webhooks:', application.company_name, 'Status:', previousStatus, '->', application.status);
    await sendWebhook('application_updated', application, { previous_status: previousStatus });
  };

  const onFollowUpDue = async (application: JobApplication) => {
    console.log('⏰ Follow-up due, triggering webhooks:', application.company_name);
    await sendWebhook('follow_up_due', application, {
      follow_up_date: application.next_follow_up_date
    });
  };

  const onInterviewScheduled = async (application: JobApplication) => {
    console.log('🎯 Interview scheduled, triggering webhooks:', application.company_name);
    await sendWebhook('interview_scheduled', application, {
      interview_status: 'scheduled'
    });
  };

  const onOfferReceived = async (application: JobApplication) => {
    console.log('🎉 Offer received, triggering webhooks:', application.company_name);
    await sendWebhook('offer_received', application, {
      offer_status: 'received',
      salary_offered: application.salary
    });
  };

  const onFollowUpLogged = async (application: JobApplication, followUp: FollowUp) => {
    console.log('📧 Follow-up logged, triggering webhooks:', application.company_name);
    await sendWebhook('follow_up_logged', application, {
      follow_up_id: followUp.id,
      follow_up_date: followUp.date,
      response_status: followUp.response_status,
      email_content: followUp.email_text
    });
  };

  return {
    webhooks,
    loading,
    loadWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    // Event handlers
    onApplicationAdded,
    onApplicationUpdated,
    onFollowUpDue,
    onInterviewScheduled,
    onOfferReceived,
    onFollowUpLogged
  };
}