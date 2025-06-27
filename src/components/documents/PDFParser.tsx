import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Upload, Check, X, Copy, Download } from 'lucide-react';
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
      // In a real implementation, you would use a PDF parsing library or API
      // For this demo, we'll simulate parsing with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate extracted text based on file type
      let extractedText = '';
      
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        extractedText = `
# Resume: ${file.name}

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
      } else if (file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.name.endsWith('.doc') || 
                file.name.endsWith('.docx')) {
        extractedText = `
# Resume: ${file.name}

## Professional Experience

* Product Manager, Tech Solutions Inc. (2019-Present)
  - Managed product roadmap for SaaS platform with 50,000+ users
  - Collaborated with engineering and design teams to deliver new features
  - Increased user retention by 25% through data-driven improvements

* Business Analyst, Data Insights Co. (2017-2019)
  - Conducted market research and competitive analysis
  - Created detailed product requirements documents
  - Supported sales team with technical demonstrations

## Skills

* Product Management: Roadmapping, User Stories, Agile/Scrum, JIRA
* Analytics: SQL, Tableau, Google Analytics, A/B Testing
* Technical: HTML/CSS, Basic JavaScript, API Integration
* Soft Skills: Leadership, Communication, Stakeholder Management

## Education

* MBA, Business School (2015-2017)
* Bachelor of Business Administration (2011-2015)
`;
      } else {
        extractedText = `
# Resume: ${file.name}

This is the extracted content from your text file.

The content includes your professional experience, skills, and education.

For a real implementation, this would contain the actual text from your document.
`;
      }

      setParsedContent(extractedText);
      onParsedContent(extractedText);
      toast.success('Document parsed successfully!');
    } catch (error: any) {
      console.error('Error parsing document:', error);
      setError(error.message || 'Failed to parse document');
      toast.error('Failed to parse document');
    } finally {
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
    if (parsedContent && onClose) {
      onClose();
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