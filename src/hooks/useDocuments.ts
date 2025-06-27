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
      
      // Create a simple file path without user ID for easier access
      const filePath = `${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      let storageData, storageError;
      
      try {
        const result = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        storageData = result.data;
        storageError = result.error;
      } catch (error) {
        console.error('Storage upload error:', error);
        throw new Error('Failed to upload to storage: ' + (error as Error).message);
      }

      if (storageError) throw storageError;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      // Extract text content from document if it's a resume or cover letter
      let resumeContent = null;
      if (fileType === 'resume' || fileType === 'cover-letter') {
        try {
          resumeContent = await extractTextFromFile(file);
        } catch (extractError) {
          console.warn('Could not extract text from file:', extractError);
          // Continue even if extraction fails
        }
      }

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
          resume_content: resumeContent
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

  // Function to extract text from file
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Process the content based on file type
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            // For text files, use the content directly
            resolve(content);
          } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // For PDFs, extract text from binary data
            // This is a simplified approach - in a real app, use PDF.js
            const extractedText = extractTextFromBinaryData(content);
            resolve(extractedText);
          } else {
            // For Word docs and other formats
            // In a real app, you'd use specific libraries for each format
            const extractedText = extractTextFromBinaryData(content);
            resolve(extractedText);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      
      // Read the file
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        // For binary files like PDFs and Word docs
        reader.readAsBinaryString(file);
      }
    });
  };
  
  // Function to extract text from binary data
  const extractTextFromBinaryData = (data: string): string => {
    // This is a very simplified approach to extract text from binary data
    // In a real implementation, use a proper PDF parsing library
    
    // Remove non-printable characters and extract text-like content
    const textContent = data
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Keep only printable ASCII
      .replace(/\s+/g, ' ')                 // Normalize whitespace
      .split(' ')
      .filter(word => word.length > 1)      // Filter out single characters
      .join(' ');
    
    return textContent;
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
          const pathname = url.pathname;
          
          // The path in storage is after /object/documents/
          const pathParts = pathname.split('/');
          const storageIndex = pathParts.indexOf('object');
          const bucketIndex = pathParts.indexOf('documents');
          
          if (storageIndex !== -1 && bucketIndex !== -1 && bucketIndex > storageIndex) {
            // Get the filename which is everything after 'documents/'
            const filename = pathParts.slice(bucketIndex + 1).join('/');
          
            if (filename) {
              console.log('Attempting to delete file:', filename);
              await supabase.storage
                .from('documents')
                .remove([filename]);
            }
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