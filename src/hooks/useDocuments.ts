import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { debounce } from 'lodash-es';
import toast from 'react-hot-toast';

type Document = Database['public']['Tables']['documents']['Row'];

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_on', { ascending: false })
        .limit(100); // Reasonable limit

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = debounce(fetchDocuments, 300);

  useEffect(() => {
    debouncedFetch();
    
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  const uploadDocument = async (file: File, fileType: Document['file_type'], linkedJobId?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Simple file path without categorization
      const filePath = `${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size,
          linked_job_id: linkedJobId,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically update the list
      setDocuments(prev => [data, ...prev]);
      toast.success('Document uploaded successfully!');
      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document: ' + error.message);
      throw error;
    }
  };

  const deleteDocument = async (id: string, fileUrl?: string) => {
    try {
      // Get document details first to get the storage path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Try to delete from storage if URL exists
      if (document?.file_url) {
        try {
          // Extract the path from the URL
          const url = new URL(document.file_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
          
          if (pathMatch && pathMatch[1]) {
            const storagePath = pathMatch[1];
            await supabase.storage
              .from('documents')
              .remove([storagePath]);
          }
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }

      // Optimistically update the list
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}