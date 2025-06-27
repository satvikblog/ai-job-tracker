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
          
          // Use FileReader to read the blob
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const text = e.target?.result as string;
              
              // For PDFs, extract text content properly
              if (fileName.toLowerCase().endsWith('.pdf')) {
                // Extract text from PDF content
                const extractedText = extractTextFromPDF(text);
                setPdfContent(extractedText);
              } else {
                // For other document types
                const extractedText = extractTextFromBinaryData(text);
                setPdfContent(extractedText);
              }
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
        } catch (fetchError: any) {
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to storage. Please check your internet connection and Supabase configuration.');
          }
          throw fetchError;
        }
        
      } catch (error: any) {
        console.error('Error fetching document:', error);
        setError(error.message || 'Failed to load document');
        setLoading(false);
      }
    };

    fetchPdfContent();
  }, [url, fileName, isTextFile]);

  // Function to extract text from PDF content
  const extractTextFromPDF = (data: string): string => {
    try {
      // Look for text content between stream and endstream tags
      const streamMatches = data.match(/stream([\s\S]*?)endstream/g);
      
      if (!streamMatches || streamMatches.length === 0) {
        return "Could not extract text content from PDF. The file may be encrypted or contain only images.";
      }
      
      // Process each stream to extract text
      let extractedText = '';
      for (const stream of streamMatches) {
        // Remove stream and endstream tags
        const content = stream.replace(/stream|endstream/g, '');
        
        // Clean up the content
        const cleanedContent = content
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Keep only printable ASCII
          .replace(/\s+/g, ' ')                 // Normalize whitespace
          .trim();
        
        if (cleanedContent.length > 50) {  // Only add substantial content
          extractedText += cleanedContent + '\n\n';
        }
      }
      
      // Further clean up the extracted text
      extractedText = extractedText
        .replace(/\\n/g, '\n')             // Convert escaped newlines
        .replace(/\\t/g, '\t')             // Convert escaped tabs
        .replace(/\\r/g, '')               // Remove escaped carriage returns
        .replace(/\\/g, '')                // Remove remaining backslashes
        .replace(/\s+/g, ' ')              // Normalize whitespace again
        .trim();
      
      // If we still don't have meaningful content, try a different approach
      if (extractedText.length < 100) {
        // Look for text between parentheses, which often contains actual text in PDFs
        const textMatches = data.match(/\(([^)]+)\)/g);
        if (textMatches && textMatches.length > 0) {
          extractedText = textMatches
            .map(match => match.substring(1, match.length - 1))
            .filter(text => text.length > 1)
            .join(' ')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '')
            .replace(/\\/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      
      return extractedText || "Could not extract meaningful text content from this PDF. The file may contain only images or be in a format that requires specialized parsing.";
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return "Error extracting text from PDF. Please download the file to view its contents.";
    }
  };

  // Function to extract text from binary data for non-PDF documents
  const extractTextFromBinaryData = (data: string): string => {
    try {
      // Remove non-printable characters and extract text-like content
      const textContent = data
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Keep only printable ASCII
        .replace(/\s+/g, ' ')                 // Normalize whitespace
        .split(' ')
        .filter(word => word.length > 1)      // Filter out single characters
        .join(' ');
      
      // Look for common document sections
      const sections = [
        'summary', 'objective', 'experience', 'education', 'skills', 
        'projects', 'certifications', 'references', 'publications'
      ];
      
      let structuredContent = '';
      
      // Try to extract sections
      for (const section of sections) {
        const regex = new RegExp(`(^|\\s)${section}[:\\s](.{10,500})`, 'gi');
        const matches = textContent.match(regex);
        
        if (matches && matches.length > 0) {
          for (const match of matches) {
            structuredContent += match + '\n\n';
          }
        }
      }
      
      // If we couldn't find structured content, return a reasonable portion of the text
      if (structuredContent.length < 100) {
        return textContent.substring(0, 2000);
      }
      
      return structuredContent;
    } catch (error) {
      console.error('Error extracting text from binary data:', error);
      return "Error extracting text from document. Please download the file to view its contents.";
    }
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