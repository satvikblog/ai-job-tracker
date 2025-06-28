import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { debounce } from 'lodash-es';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

type Document = Database['public']['Tables']['documents']['Row'];

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;

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
        resumeContent = await extractTextFromFile(file);
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

  // Extract text from any file type
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // For text files
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(content);
          };
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
          return;
        }
        
        // For PDF files
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
              
              let fullText = '';
              
              // Get total number of pages
              const numPages = pdf.numPages;
              
              // Extract text from each page
              for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(' ');
                
                fullText += pageText + '\n\n';
              }
              
              // Clean up the text
              fullText = fullText
                .replace(/\s+/g, ' ')
                .replace(/\s+\n/g, '\n')
                .replace(/\n\s+/g, '\n')
                .replace(/\n+/g, '\n\n')
                .trim();
              
              resolve(fullText);
            } catch (error) {
              console.error('Error parsing PDF:', error);
              reject(new Error('Failed to parse PDF content'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read PDF file'));
          reader.readAsArrayBuffer(file);
          return;
        }
        
        // For Word documents and other formats (basic text extraction)
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            // Simple text extraction - not ideal for Word docs
            const extractedText = content
              .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            resolve(extractedText);
          } catch (error) {
            reject(new Error('Failed to parse document content'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read document file'));
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
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