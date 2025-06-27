import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Upload, Check, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

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
            const extractedText = extractTextFromPDF(str);
            setParsedContent(extractedText);
            onParsedContent(extractedText);
            toast.success('PDF parsed successfully!');
          } catch (error) {
            console.error('Error parsing PDF:', error);
            setError('Failed to parse PDF content');
            toast.error('Failed to parse PDF content');
          } finally {
            setParsing(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read PDF file');
          setParsing(false);
          toast.error('Failed to read PDF file');
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // For Word documents and other formats
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const extractedText = extractTextFromBinaryData(content);
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
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error('Error parsing document:', error);
      setError(error.message || 'Failed to parse document');
      toast.error('Failed to parse document');
      setParsing(false);
    }
  };

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
      return "Error extracting text from PDF. Please try a different file format.";
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
      return "Error extracting text from document. Please try a different file format.";
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
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                {file ? file.name : 'Upload a Document'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {file 
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB - ${file.type || 'Unknown type'}`
                  : 'Supported formats: PDF, Word documents (.doc, .docx), and text files'
                }
              </p>
              {error && (
                <div className="text-error-400 text-sm mb-4 bg-error-900/20 border border-error-600/30 rounded-lg p-3">
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