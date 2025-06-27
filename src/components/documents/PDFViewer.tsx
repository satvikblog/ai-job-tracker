import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Download, Copy, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

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
          // Test if the URL is accessible
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Document not found. The file may have been deleted or moved.');
            } else if (response.status === 403) {
              throw new Error('Access denied. Please check your Supabase storage permissions.');
            } else {
              throw new Error(`Failed to access document: ${response.status} ${response.statusText}`);
            }
          }
          
          // For text files, we can directly get the content
          if (isTextFile) {
            const text = await response.text();
            setPdfContent(text);
            setLoading(false);
            return;
          }
          
          // For PDFs and other documents, we need to fetch the actual content
          const blob = await response.blob();
          
          // Use PDF.js or other libraries for PDF parsing in a real implementation
          // For now, we'll extract text using a simple approach
          try {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                // This is a simplified approach - in a real app, use proper PDF parsing
                const text = e.target?.result as string;
                
                // Extract text content - this is a very basic extraction
                // In a real app, use PDF.js or a server-side parser
                let extractedText = '';
                
                if (fileName.toLowerCase().endsWith('.pdf')) {
                  // For PDFs, we'd normally use PDF.js
                  // This is a placeholder for actual PDF parsing
                  extractedText = extractTextFromBinaryData(text);
                } else {
                  // For other document types
                  extractedText = text;
                }
                
                setPdfContent(extractedText);
              } catch (parseError) {
                console.error('Error parsing document content:', parseError);
                setError('Failed to parse document content. Please try downloading instead.');
              } finally {
                setLoading(false);
              }
            };
            
            reader.onerror = () => {
              setError('Failed to read document content');
              setLoading(false);
            };
            
            reader.readAsText(blob);
          } catch (readError) {
            console.error('Error reading blob:', readError);
            throw new Error('Failed to read document content');
          }
        } catch (fetchError: any) {
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to storage. Please check your internet connection and Supabase configuration.');
          }
          throw fetchError;
        }
        
      } catch (error: any) {
        console.error('Error fetching PDF:', error);
        setError(error.message || 'Failed to load PDF');
        setLoading(false);
      }
    };

    fetchPdfContent();
  }, [url, fileName]);

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
    
    // Extract what looks like the actual content
    // This is very basic and won't work well for all PDFs
    const extractedText = textContent
      .split(' ')
      .slice(0, 1000)                       // Limit to first 1000 words
      .join(' ');
    
    return extractedText || `Could not extract text content from ${fileName}. Please download the file to view it.`;
  };

  const handleCopyContent = () => {
    if (pdfContent) {
      navigator.clipboard.writeText(pdfContent);
      toast.success('Content copied to clipboard!');
    }
  };

  const handleDownload = () => {
    window.open(url, '_blank');
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