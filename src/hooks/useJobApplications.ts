import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useWebhookIntegration } from './useWebhookIntegration';
import { debounce } from 'lodash-es';
import toast from 'react-hot-toast';

type JobApplication = Database['public']['Tables']['job_applications']['Row'] & {
  contacts?: Database['public']['Tables']['contacts']['Row'][];
};

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webhooks = useWebhookIntegration();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        setError('Authentication error');
        return;
      }
      
      if (!user) {
        console.log('No authenticated user found');
        setApplications([]);
        setLoading(false);
        return;
      }

      // Optimized fetch with minimal data and proper indexing
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          contacts (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Reasonable limit for initial load

      if (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to load applications');
        return;
      }

      setApplications(data || []);
    } catch (error: any) {
      console.error('Error in fetchApplications:', error);
      setError('Failed to load applications');
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = debounce(fetchApplications, 300);

  useEffect(() => {
    debouncedFetch();
    
    // Cleanup on unmount
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  // Ensure profile exists helper function
  const ensureProfile = async (user: any) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
          });
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  };

  const addApplication = async (applicationData: any) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Ensure profile exists
      await ensureProfile(user);

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

      const { data, error } = await supabase
        .from('job_applications')
        .insert([cleanedData])
        .select()
        .single();

      if (error) {
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
      await webhooks.onApplicationAdded(data);

      // Optimistically update the list instead of refetching
      setApplications(prev => [data, ...prev]);
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
      // Get current application for webhook comparison
      const currentApp = applications.find(app => app.id === id);
      const previousStatus = currentApp?.status;

      // Separate contact fields from job application fields
      const contactFields = ['contact_name', 'contact_email', 'contact_linkedin', 'contact_phone'];
      const contactData: any = {};
      const jobAppUpdates: any = {};
      
      // Split the updates into contact and job application data
      Object.keys(updates).forEach(key => {
        if (contactFields.includes(key)) {
          contactData[key.replace('contact_', '')] = (updates as any)[key];
        } else {
          jobAppUpdates[key] = (updates as any)[key];
        }
      });

      // First update the application
      const { error: updateError } = await supabase
        .from('job_applications')
        .update(jobAppUpdates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Handle contact information separately
      if (Object.keys(contactData).length > 0) {
        // Check if contact exists for this application
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('job_application_id', id)
          .maybeSingle();

        // Check if any contact data is provided
        const hasContactData = Object.values(contactData).some(value => 
          value && value.toString().trim() !== '' && value !== 'N/A'
        );

        if (hasContactData) {
          if (existingContact) {
            // Update existing contact
            await supabase
              .from('contacts')
              .update(contactData)
              .eq('id', existingContact.id);
          } else {
            // Create new contact
            await supabase
              .from('contacts')
              .insert({
                job_application_id: id,
                ...contactData
              });
          }
        } else if (existingContact) {
          // Delete existing contact if all fields are empty
          await supabase
            .from('contacts')
            .delete()
            .eq('id', existingContact.id);
        }
      }

      // Get the updated application data
      const { data: updatedApp, error: fetchError } = await supabase
        .from('job_applications')
        .select(`
          *,
          contacts (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (updatedApp) {
        // 📝 TRIGGER WEBHOOK - Application Updated
        if (jobAppUpdates.status && jobAppUpdates.status !== previousStatus) {
          await webhooks.onApplicationUpdated(updatedApp, previousStatus);
          
          // Send specific event webhooks
          if (jobAppUpdates.status === 'interview') {
            await webhooks.onInterviewScheduled(updatedApp);
          } else if (jobAppUpdates.status === 'offer') {
            await webhooks.onOfferReceived(updatedApp);
          }
        }
      }

      // Optimistically update the list
      setApplications(prev => 
        prev.map(app => app.id === id ? { ...app, ...updatedApp } : app)
      );
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

      // Optimistically update the list
      setApplications(prev => prev.filter(app => app.id !== id));
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
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    refetch: fetchApplications,
  };
}