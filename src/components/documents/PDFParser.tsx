import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Upload, Check, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFParserProps {
  onParsedContent: (content: string) => void;
  onClose?: () => void;
}

export function PDFParser({ onParsedContent, onClose }: PDFParserProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedContent, setParsedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize PDF.js when component mounts
    const initializePdfJs = async () => {
      try {
        await pdfjsLib.getDocument({ data: new Uint8Array(0) }).promise.catch(() => {
          // This will fail, but it initializes the library
          console.log('PDF.js initialized');
        });
      } catch (error) {
        console.log('PDF.js initialization error (expected):', error);
      }
    };

    initializePdfJs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || 
          selectedFile.name.endsWith('.pdf') ||
          selectedFile.type === 'application/msword' ||
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          selectedFile.name.endsWith('.doc') ||
          selectedFile.name.endsWith('.docx') ||
          selectedFile.type === 'text/plain' ||
          selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF, Word document, or text file');
        setFile(null);
      }
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      // For text files, use FileReader directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setParsedContent(content);
          onParsedContent(content);
          setParsing(false);
          toast.success('Text file parsed successfully!');
        };
        reader.onerror = () => {
          setError('Failed to read text file');
          setParsing(false);
          toast.error('Failed to read text file');
        };
        reader.readAsText(file);
        return;
      }

      // For PDF files
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
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
        
        setParsedContent(fullText);
        onParsedContent(fullText);
        setParsing(false);
        toast.success('PDF parsed successfully!');
        return;
      }

      // For Word documents and other formats
      // Note: This is a simplified approach that won't work well for Word docs
      // In a real app, you'd use a dedicated library like mammoth.js
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Simple text extraction - not ideal for Word docs
          const extractedText = content
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          setParsedContent(extractedText);
          onParsedContent(extractedText);
          toast.success('Document parsed successfully!');
        } catch (error) {
          console.error('Error parsing document:', error);
          setError('Failed to parse document content');
          toast.error('Failed to parse document content');
        } finally {
          setParsing(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read document file');
        setParsing(false);
        toast.error('Failed to read document file');
      };
      reader.readAsText(file);
    } catch (error: any) {
      console.error('Error parsing document:', error);
      setError(error.message || 'Failed to parse document');
      toast.error('Failed to parse document');
      setParsing(false);
    }
  };

  const handleCopyContent = () => {
    if (parsedContent) {
      navigator.clipboard.writeText(parsedContent);
      toast.success('Content copied to clipboard!');
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedContent(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseContent = () => {
    if (parsedContent && onParsedContent) {
      onParsedContent(parsedContent);
      if (onClose) onClose();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">
          Document Parser
        </h2>
      </div>

      <div className="space-y-6">
        {!parsedContent ? (
          <>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {file ? file.name : 'Upload a Document'}
              </h3>
              <p className="text-sm text-muted mb-4">
                {file 
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB - ${file.type || 'Unknown type'}`
                  : 'Supported formats: PDF, Word documents (.doc, .docx), and text files'
                }
              </p>
              {error && (
                <div className="text-error text-sm mb-4 bg-error/10 border border-error/30 rounded-lg p-3">
                  {error}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4" />}
                  variant={file ? 'outline' : 'primary'}
                >
                  {file ? 'Change File' : 'Select File'}
                </Button>
                {file && (
                  <>
                    <Button
                      onClick={handleParse}
                      leftIcon={<FileText className="w-4 h-4" />}
                      isLoading={parsing}
                      glow
                    >
                      Parse Document
                    </Button>
                    <Button
                      onClick={handleReset}
                      leftIcon={<X className="w-4 h-4" />}
                      variant="outline"
                    >
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-primary-300 mb-3">
                Why Parse Your Documents?
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                  <span>Extract your skills and experience to use in cover letters</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                  <span>Analyze your resume against job descriptions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                  <span>Generate more personalized cover letters</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                  <span>Improve your ATS score with targeted content</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="bg-dark-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-slate-200">Parsed Content</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyContent}
                    leftIcon={<Copy className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="bg-dark-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300">
                  {parsedContent}
                </pre>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={handleReset}
                leftIcon={<X className="w-4 h-4" />}
                variant="outline"
              >
                Reset
              </Button>
              <Button
                onClick={handleUseContent}
                leftIcon={<Check className="w-4 h-4" />}
                glow
              >
                Use This Content
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}