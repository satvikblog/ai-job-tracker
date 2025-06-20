import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useWebhookIntegration } from './useWebhookIntegration';
import toast from 'react-hot-toast';

type FollowUp = Database['public']['Tables']['follow_ups']['Row'] & {
  job_applications?: Database['public']['Tables']['job_applications']['Row'];
};

export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const webhooks = useWebhookIntegration();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setFollowUps([]);
        return;
      }

      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          job_applications (
            *
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Filter to only include follow-ups for user's applications
      const userFollowUps = (data || []).filter(followUp => 
        followUp.job_applications?.user_id === user.id
      );
      
      setFollowUps(userFollowUps);
    } catch (error: any) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to load follow-ups');
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const addFollowUp = async (followUpData: Omit<Database['public']['Tables']['follow_ups']['Insert'], 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .insert([followUpData])
        .select(`
          *,
          job_applications (*)
        `)
        .single();

      if (error) throw error;

      // 📧 TRIGGER WEBHOOK - Follow-up Logged
      if (data.job_applications) {
        console.log('📧 Triggering webhook for follow-up logged:', data.job_applications.company_name);
        await webhooks.onFollowUpLogged(data.job_applications, data);
      }

      await fetchFollowUps();
      toast.success(`Follow-up logged successfully! ${webhooks.config?.enabled ? '(Webhook triggered)' : ''}`);
      return data;
    } catch (error: any) {
      console.error('Error adding follow-up:', error);
      toast.error('Failed to log follow-up');
      throw error;
    }
  };

  const updateFollowUp = async (id: string, updates: Partial<Database['public']['Tables']['follow_ups']['Update']>) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchFollowUps();
      toast.success('Follow-up updated successfully!');
    } catch (error: any) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
      throw error;
    }
  };

  return {
    followUps,
    loading,
    addFollowUp,
    updateFollowUp,
    refetch: fetchFollowUps,
  };
}