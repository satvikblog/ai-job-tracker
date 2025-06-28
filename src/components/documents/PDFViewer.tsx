import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Download, Copy, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;

interface PDFViewerProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PDFViewer({ url, fileName, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isTextFile, setIsTextFile] = useState(false);

  useEffect(() => {
    const fetchPdfContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if URL is valid
        if (!url) {
          throw new Error('Invalid document URL');
        }

        // Check if it's a text file
        setIsTextFile(fileName.toLowerCase().endsWith('.txt'));

        try {
          // Extract the file path from the Supabase storage URL
          let filePath = '';
          if (url.includes('/storage/v1/object/public/')) {
            // Public bucket URL format
            const urlParts = url.split('/storage/v1/object/public/');
            if (urlParts.length > 1) {
              const pathParts = urlParts[1].split('/');
              if (pathParts.length > 1) {
                filePath = pathParts.slice(1).join('/'); // Remove bucket name, keep file path
              }
            }
          } else if (url.includes('/storage/v1/object/sign/')) {
            // Signed URL format
            const urlParts = url.split('/storage/v1/object/sign/');
            if (urlParts.length > 1) {
              const pathParts = urlParts[1].split('?')[0].split('/');
              if (pathParts.length > 1) {
                filePath = pathParts.slice(1).join('/'); // Remove bucket name, keep file path
              }
            }
          }

          if (!filePath) {
            throw new Error('Unable to extract file path from URL');
          }

          // Download the file using Supabase client with proper authentication
          const { data, error: downloadError } = await supabase.storage
            .from('documents')
            .download(filePath);

          if (downloadError) {
            console.error('Supabase storage error:', downloadError);
            if (downloadError.message.includes('not found')) {
              throw new Error('Document not found. The file may have been deleted or moved.');
            } else if (downloadError.message.includes('access')) {
              throw new Error('Access denied. Please check your permissions.');
            } else {
              throw new Error(`Storage error: ${downloadError.message}`);
            }
          }

          if (!data) {
            throw new Error('No data received from storage');
          }

          // For text files, read as text
          if (isTextFile) {
            const text = await data.text();
            setPdfContent(text);
            setLoading(false);
            return;
          }
          
          // For PDFs, use PDF.js
          if (fileName.toLowerCase().endsWith('.pdf')) {
            const arrayBuffer = await data.arrayBuffer();
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
            
            setPdfContent(fullText);
            setLoading(false);
            return;
          }
          
          // For other document types, try to read as text
          const text = await data.text();
          
          // Simple cleaning for non-PDF documents
          const cleanedText = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          setPdfContent(cleanedText);
          
        } catch (fetchError: any) {
          console.error('Error in fetchPdfContent:', fetchError);
          
          if (fetchError.message.includes('Unable to extract file path')) {
            throw new Error('Invalid storage URL format. Please contact support.');
          } else if (fetchError.message.includes('Storage error')) {
            throw fetchError;
          } else if (fetchError.message.includes('not found')) {
            throw new Error('Document not found. The file may have been deleted or moved.');
          } else if (fetchError.message.includes('access')) {
            throw new Error('Access denied. Please check your permissions.');
          } else {
            throw new Error('Unable to load document. Please try again or contact support.');
          }
        }
        
      } catch (error: any) {
        console.error('Error fetching document:', error);
        setError(error.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchPdfContent();
  }, [url, fileName, isTextFile]);

  const handleCopyContent = () => {
    if (pdfContent) {
      navigator.clipboard.writeText(pdfContent);
      toast.success('Content copied to clipboard!');
    }
  };

  const handleDownload = async () => {
    try {
      // Extract file path from URL for download
      let filePath = '';
      if (url.includes('/storage/v1/object/public/')) {
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          if (pathParts.length > 1) {
            filePath = pathParts.slice(1).join('/');
          }
        }
      } else if (url.includes('/storage/v1/object/sign/')) {
        const urlParts = url.split('/storage/v1/object/sign/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('?')[0].split('/');
          if (pathParts.length > 1) {
            filePath = pathParts.slice(1).join('/');
          }
        }
      }

      if (filePath) {
        // Create a signed URL for download
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 60); // 60 seconds expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          toast.error('Failed to create download link');
          return;
        }

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        } else {
          toast.error('Failed to create download link');
        }
      } else {
        // Fallback to original URL
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-dark-900/95 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white truncate max-w-md">
              {fileName}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              leftIcon={<Copy className="w-4 h-4" />}
              disabled={loading || !!error}
            >
              Copy Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading document content...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-error-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-error-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to Load Document</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <Button onClick={handleDownload} variant="primary">
                  Download Instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-dark-800 rounded-lg p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                {pdfContent}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}