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
          // For text files, read directly
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            resumeContent = await readTextFile(file);
          } 
          // For PDFs
          else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            resumeContent = await extractTextFromPDF(file);
          }
          // For other document types
          else {
            resumeContent = await extractTextFromFile(file);
          }
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

  // Function to read text file directly
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          resolve(content);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read text file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Function to extract text from PDF file
  const extractTextFromPDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (!arrayBuffer) {
            throw new Error('Failed to read file');
          }
          
          // Convert ArrayBuffer to string
          const data = new Uint8Array(arrayBuffer as ArrayBuffer);
          let str = '';
          for (let i = 0; i < data.length; i++) {
            str += String.fromCharCode(data[i]);
          }
          
          // Extract text from PDF content
          const extractedText = extractPDFTextContent(str);
          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read PDF file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Function to extract text content from PDF data
  const extractPDFTextContent = (data: string): string => {
    try {
      // First attempt: Look for text content between BT and ET tags (Begin Text/End Text)
      const textMatches = data.match(/BT[\s\S]*?ET/g);
      let extractedText = '';
      
      if (textMatches && textMatches.length > 0) {
        // Process each text block
        for (const textBlock of textMatches) {
          // Extract text strings (usually in parentheses)
          const stringMatches = textBlock.match(/\((.*?)\)/g);
          if (stringMatches) {
            for (const match of stringMatches) {
              // Remove parentheses and handle escapes
              const text = match.substring(1, match.length - 1)
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')');
              
              if (text.trim().length > 0) {
                extractedText += text + ' ';
              }
            }
          }
        }
      }
      
      // Second attempt: If first method didn't yield good results, try extracting text objects
      if (extractedText.trim().length < 100) {
        const textObjectMatches = data.match(/\/(T[a-zA-Z0-9*]+)\s+(\d+)\s+Tf[\s\S]*?\[(.*?)\]/g);
        if (textObjectMatches && textObjectMatches.length > 0) {
          extractedText = '';
          for (const match of textObjectMatches) {
            const contentMatches = match.match(/\[(.*?)\]/);
            if (contentMatches && contentMatches[1]) {
              extractedText += contentMatches[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\(\d{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
                .replace(/[()\\]/g, '') + ' ';
            }
          }
        }
      }
      
      // Third attempt: Extract text from streams
      if (extractedText.trim().length < 100) {
        const streamMatches = data.match(/stream([\s\S]*?)endstream/g);
        if (streamMatches && streamMatches.length > 0) {
          extractedText = '';
          for (const stream of streamMatches) {
            // Extract content between stream and endstream
            const content = stream.replace(/stream|endstream/g, '');
            
            // Clean up the content - keep only printable ASCII and basic whitespace
            const cleanedContent = content
              .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (cleanedContent.length > 50) {
              extractedText += cleanedContent + '\n\n';
            }
          }
        }
      }
      
      // Fourth attempt: Extract text from parentheses
      if (extractedText.trim().length < 100) {
        const parenthesesMatches = data.match(/\(([^)]+)\)/g);
        if (parenthesesMatches && parenthesesMatches.length > 0) {
          extractedText = '';
          for (const match of parenthesesMatches) {
            const text = match.substring(1, match.length - 1)
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')');
            
            if (text.trim().length > 1) {
              extractedText += text + ' ';
            }
          }
        }
      }
      
      // Final cleanup
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .replace(/\n+/g, '\n\n')
        .trim();
      
      // If we still don't have meaningful content, provide a fallback message
      if (extractedText.trim().length < 50) {
        return "Could not extract meaningful text content from this PDF. The file may be scanned, contain only images, or use a format that requires specialized parsing.";
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return "Error extracting text from PDF. Please download the file to view its contents.";
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
    try {
      // For binary data, just return the raw text content with minimal processing
      // This works better for most document formats than trying to be too clever
      return data
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Keep only printable ASCII
        .replace(/\s+/g, ' ')                 // Normalize whitespace
        .trim()
        .substring(0, 10000);  // Limit to first 10,000 characters
    } catch (error) {
      console.error('Error extracting text from binary data:', error);
      return "Error extracting text from document. Please try a different file format.";
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