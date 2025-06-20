import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useWebhookIntegration } from './useWebhookIntegration';
import toast from 'react-hot-toast';

type JobApplication = Database['public']['Tables']['job_applications']['Row'] & {
  contacts?: Database['public']['Tables']['contacts']['Row'][];
};

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const webhooks = useWebhookIntegration();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('No authenticated user found');
        setApplications([]);
        return;
      }

      console.log('Fetching applications for user:', user.id);

      // Ensure user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', user.id);
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
          });
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
      } else if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      // Fetch applications
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          contacts (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      console.log('Fetched applications:', data?.length || 0);
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error in fetchApplications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const addApplication = async (applicationData: any) => {
    try {
      console.log('Adding application with data:', applicationData);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('Current user:', user.id);

      // Ensure profile exists before creating application
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Create profile if it doesn't exist
        console.log('Creating profile before adding application');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
          });
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
      } else if (profileError) {
        throw profileError;
      }

      // Clean the data for Supabase
      const cleanedData = {
        company_name: applicationData.company_name || '',
        job_title: applicationData.job_title || '',
        job_link: applicationData.job_link || null,
        source_site: applicationData.source_site || '',
        applied_on: applicationData.applied_on || new Date().toISOString().split('T')[0],
        status: applicationData.status || 'applied',
        next_follow_up_date: applicationData.next_follow_up_date || null,
        notes: applicationData.notes || null,
        salary: applicationData.salary || null,
        location: applicationData.location || null,
        user_id: user.id,
      };

      console.log('Cleaned data for Supabase:', cleanedData);

      const { data, error } = await supabase
        .from('job_applications')
        .insert([cleanedData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        throw error;
      }

      // Add contact if provided
      if (applicationData.contact_name && applicationData.contact_name.trim() && applicationData.contact_name !== 'N/A') {
        try {
          await supabase.from('contacts').insert({
            job_application_id: data.id,
            name: applicationData.contact_name,
            email: applicationData.contact_email && applicationData.contact_email !== 'N/A' ? applicationData.contact_email : null,
            linkedin: applicationData.contact_linkedin && applicationData.contact_linkedin !== 'N/A' ? applicationData.contact_linkedin : null,
            phone: applicationData.contact_phone && applicationData.contact_phone !== 'N/A' ? applicationData.contact_phone : null,
          });
        } catch (contactError) {
          console.error('Error adding contact (non-critical):', contactError);
          // Don't throw here as the main application was created successfully
        }
      }

      // 🚀 TRIGGER WEBHOOK - Application Added
      console.log('🚀 Triggering webhook for new application:', data.company_name);
      await webhooks.onApplicationAdded(data);

      await fetchApplications();
      toast.success('Application added successfully!');
      return data;
    } catch (error: any) {
      console.error('Error adding application:', error);
      
      // Provide more specific error messages
      if (error.code === '23503') {
        toast.error('Profile setup required. Please try again.');
      } else if (error.code === '42501') {
        toast.error('Permission denied. Please check your account.');
      } else if (error.message?.includes('duplicate')) {
        toast.error('This application already exists.');
      } else {
        toast.error(error.message || 'Failed to add application');
      }
      throw error;
    }
  };

  const updateApplication = async (id: string, updates: Partial<Database['public']['Tables']['job_applications']['Update']>) => {
    try {
      console.log('Updating application:', id, 'with updates:', updates);
      
      // Get current application for webhook comparison
      const currentApp = applications.find(app => app.id === id);
      const previousStatus = currentApp?.status;

      // First update the application
      const { error: updateError } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Get the updated application data
      const { data: updatedApp, error: fetchError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Fetch error after update:', fetchError);
        throw fetchError;
      }

      if (updatedApp) {
        // 📝 TRIGGER WEBHOOK - Application Updated
        if (updates.status && updates.status !== previousStatus) {
          console.log('📝 Triggering webhook for application update:', updatedApp.company_name);
          await webhooks.onApplicationUpdated(updatedApp, previousStatus);
          
          // Send specific event webhooks
          if (updates.status === 'interview') {
            console.log('🎯 Triggering interview scheduled webhook');
            await webhooks.onInterviewScheduled(updatedApp);
          } else if (updates.status === 'offer') {
            console.log('🎉 Triggering offer received webhook');
            await webhooks.onOfferReceived(updatedApp);
          }
        }
      }

      await fetchApplications();
      toast.success('Application updated successfully!');
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error(`Failed to update application: ${error.message}`);
      throw error;
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchApplications();
      toast.success('Application deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
      throw error;
    }
  };

  return {
    applications,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
    refetch: fetchApplications,
  };
}