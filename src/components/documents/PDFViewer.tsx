import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Download, Copy, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
          
          // For PDFs, use PDF.js
          if (fileName.toLowerCase().endsWith('.pdf')) {
            const arrayBuffer = await response.arrayBuffer();
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
          const text = await response.text();
          
          // Simple cleaning for non-PDF documents
          const cleanedText = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          setPdfContent(cleanedText);
          
        } catch (fetchError: any) {
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to storage. Please check your internet connection and Supabase configuration.');
          }
          throw fetchError;
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