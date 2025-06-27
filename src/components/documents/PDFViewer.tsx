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

  useEffect(() => {
    const fetchPdfContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if URL is valid
        if (!url || url.includes('your_supabase_project_url')) {
          throw new Error('Supabase configuration is not set up. Please check your environment variables.');
        }

        try {
          // Test if the URL is accessible
          const response = await fetch(url, { method: 'HEAD' });
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Document not found. The file may have been deleted or moved.');
            } else if (response.status === 403) {
              throw new Error('Access denied. Please check your Supabase storage permissions.');
            } else {
              throw new Error(`Failed to access document: ${response.status} ${response.statusText}`);
            }
          }
        } catch (fetchError: any) {
          if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to storage. Please check your internet connection and Supabase configuration.');
          }
          throw fetchError;
        }
        
        // For demonstration purposes, we'll simulate PDF text extraction
        // In a real implementation, you would use a PDF parsing library
        setTimeout(() => {
          // This is a placeholder for actual PDF content
          const extractedText = `
# ${fileName}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, 
nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt,
nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.

## Professional Experience

* Senior Software Engineer, ABC Company (2020-Present)
  - Developed and maintained web applications using React, Node.js, and PostgreSQL
  - Led a team of 5 developers to deliver projects on time and within budget
  - Implemented CI/CD pipelines using GitHub Actions

* Software Developer, XYZ Inc. (2018-2020)
  - Built RESTful APIs using Express.js and MongoDB
  - Collaborated with UX designers to implement responsive UI components
  - Reduced application load time by 40% through code optimization

## Skills

* Programming Languages: JavaScript, TypeScript, Python, Java
* Frameworks & Libraries: React, Node.js, Express, Django
* Databases: PostgreSQL, MongoDB, Redis
* Tools: Git, Docker, Kubernetes, AWS

## Education

* Bachelor of Science in Computer Science, University of Technology (2014-2018)
  - GPA: 3.8/4.0
  - Relevant coursework: Data Structures, Algorithms, Database Systems, Web Development
`;
          
          setPdfContent(extractedText);
          setLoading(false);
        }, 1500);
        
      } catch (error: any) {
        console.error('Error fetching PDF:', error);
        setError(error.message || 'Failed to load PDF');
        setLoading(false);
      }
    };

    fetchPdfContent();
  }, [url]);

  const handleCopyContent = () => {
    if (pdfContent) {
      navigator.clipboard.writeText(pdfContent);
      toast.success('PDF content copied to clipboard!');
    }
  };

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  return (
    <Card className="fixed inset-0 z-50 flex flex-col bg-dark-900/95 backdrop-blur-xl border-none rounded-none">
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
              {error?.includes('Supabase configuration') && (
                <div className="bg-warning-900/20 border border-warning-500/30 rounded-lg p-3 mb-4 text-left">
                  <p className="text-warning-400 text-sm">
                    <strong>Setup Required:</strong> Please ensure your <code>.env</code> file contains valid 
                    <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> values from your Supabase project.
                  </p>
                </div>
              )}
              <Button onClick={handleDownload} variant="primary">
                Download Instead
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-6 max-w-4xl mx-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
              {pdfContent}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}