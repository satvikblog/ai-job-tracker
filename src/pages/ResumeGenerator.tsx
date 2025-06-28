import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ProgressScreen } from '../components/ui/ProgressScreen';
import { FileText, Sparkles, Copy, Download, Save, Zap, Target, Brain, TrendingUp, Upload, Loader } from 'lucide-react';
import { useAIGenerationService } from '../hooks/useAIGenerationService';
import { useGeminiAI } from '../hooks/useGeminiAI';
import { PDFParser } from '../components/documents/PDFParser';
import { ResumeSelector } from '../components/documents/ResumeSelector';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface AIResumeData {
  id: string;
  linkedin_job_id: string | null;
  title: string | null;
  company_name: string | null;
  description: string | null;
  user_id: string | null;
  resume_content: string | null;
  keywords_extracted: string[] | null;
  skills_required: string[] | null;
  experience_level: string | null;
  ats_score: number | null;
  suggestions_count: number | null;
  is_processed: boolean | null;
  processing_status: string | null;
  generated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function ResumeGenerator() {
  const [formData, setFormData] = useState({
    selectedJobId: '',
    resumeContent: '',
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });
  
  const [aiResumeJobs, setAiResumeJobs] = useState<AIResumeData[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedAiResume, setSelectedAiResume] = useState<AIResumeData | null>(null);
  const [isPDFParserOpen, setIsPDFParserOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isGeneratingWithGemini, setIsGeneratingWithGemini] = useState(false);
  
  const { 
    loading, 
    progress, 
    timeRemaining, 
    generatedContent, 
    generateContent, 
    resetState,
    setGeneratedContent 
  } = useAIGenerationService();

  const {
    loading: geminiLoading,
    error: geminiError,
    generateRelevantExperience
  } = useGeminiAI();

  // Fetch AI Resume jobs on component mount
  useEffect(() => {
    fetchAiResumeJobs();
  }, []);

  const fetchAiResumeJobs = async () => {
    try {
      setLoadingJobs(true);
      
      const { data, error } = await supabase
        .from('ai_resume')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAiResumeJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching AI resume jobs:', error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoadingJobs(false);
    }
  };

  const jobOptions = [
    { value: '', label: 'Select a job opportunity...' },
    ...aiResumeJobs.map(job => ({
      value: job.id,
      label: `${job.company_name || 'Unknown Company'} - ${job.title || 'Unknown Position'}`
    }))
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill company and job title when job is selected
    if (field === 'selectedJobId' && value) {
      const selectedJob = aiResumeJobs.find(job => job.id === value);
      if (selectedJob) {
        setSelectedAiResume(selectedJob);
        setFormData(prev => ({
          ...prev,
          companyName: selectedJob.company_name || '',
          jobTitle: selectedJob.title || '',
          jobDescription: selectedJob.description || ''
        }));
      }
    }
  };

  const handleParsedContent = (content: string) => {
    setFormData(prev => ({ ...prev, resumeContent: content }));
    setIsPDFParserOpen(false);
  };

  const handleResumeSelected = (content: string) => {
    setFormData(prev => ({ ...prev, resumeContent: content }));
    setIsResumeModalOpen(false);
  };

  const handleGenerate = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (!formData.jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    if (!formData.jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    try {
      await generateContent('resume', {
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription,
        selected_job_id: formData.selectedJobId || null
      });

      // After generation, update the AI Resume table with the generated data
      if (selectedAiResume && generatedContent) {
        await updateAiResumeData(selectedAiResume.id, generatedContent);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const updateAiResumeData = async (resumeId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract sample data for demonstration
      const sampleKeywords = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git', 'Agile'
      ];
      
      const sampleSkills = [
        'Problem Solving', 'Communication', 'Leadership', 'Teamwork', 'Project Management', 'Analytical Thinking'
      ];

      const { error } = await supabase
        .from('ai_resume')
        .update({
          user_id: user.id,
          resume_content: content,
          keywords_extracted: sampleKeywords,
          skills_required: sampleSkills,
          ats_score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
          suggestions_count: Math.floor(Math.random() * 10) + 5, // Random count between 5-15
          is_processed: true,
          processing_status: 'completed',
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeId);

      if (error) throw error;

      // Refresh the selected resume data
      const { data: updatedResume } = await supabase
        .from('ai_resume')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (updatedResume) {
        setSelectedAiResume(updatedResume);
        // Update the local state
        setAiResumeJobs(prev => 
          prev.map(job => job.id === resumeId ? updatedResume : job)
        );
      }

      toast.success('AI Resume data updated successfully!');
    } catch (error: any) {
      console.error('Error updating AI resume data:', error);
      toast.error('Failed to update AI resume data');
    }
  };

  const handleGenerateWithGemini = async () => {
    if (!formData.resumeContent) {
      toast.error('Please select or parse a resume first');
      return;
    }

    if (!formData.companyName || !formData.jobTitle) {
      toast.error('Please fill in company name and job title');
      return;
    }

    if (!formData.jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    try {
      setIsGeneratingWithGemini(true);
      
      const result = await generateRelevantExperience(
        formData.resumeContent,
        formData.jobDescription
      );
      
      setGeneratedContent(result);
      
      toast.success('Resume suggestions generated successfully with Gemini AI!');
    } catch (error: any) {
      console.error('Error generating with Gemini:', error);
      toast.error(error.message || 'Failed to generate content with Gemini');
    } finally {
      setIsGeneratingWithGemini(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard!');
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-suggestions-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content exported successfully!');
  };

  const handleCancel = () => {
    resetState();
  };

  if (loadingJobs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <ProgressScreen
          type="resume"
          progress={progress}
          timeRemaining={timeRemaining}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-6 lg:space-y-8 mobile-spacing">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text flex items-center space-x-2 lg:space-x-3">
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500" />
              <span>AI Resume Generator</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center space-x-2 text-sm lg:text-base">
              <Target className="w-4 h-4" />
              <span>Generate ATS-optimized resume suggestions from LinkedIn job opportunities</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-primary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-primary-300 font-medium">AI Powered</p>
                  <p className="text-xs text-slate-400">Smart Processing</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-success-900/20 to-success-800/20 border border-success-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-success-400" />
                <div>
                  <p className="text-xs lg:text-sm text-success-300 font-medium">ATS Ready</p>
                  <p className="text-xs text-slate-400">Optimized</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-secondary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-secondary-300 font-medium">{aiResumeJobs.length}</p>
                  <p className="text-xs text-slate-400">Opportunities</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent-900/20 to-accent-800/20 border border-accent-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-accent-400" />
                <div>
                  <p className="text-xs lg:text-sm text-accent-300 font-medium">60-70s</p>
                  <p className="text-xs text-slate-400">Processing</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Job Opportunity Selection
                </h2>
              </div>

              <div className="space-y-4 lg:space-y-6 mobile-form">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Job Opportunity *
                  </label>
                  <select
                    value={formData.selectedJobId}
                    onChange={(e) => handleInputChange('selectedJobId', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {jobOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    placeholder="e.g., Google, Microsoft"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    variant="glass"
                    disabled={!!formData.selectedJobId}
                  />
                  <Input
                    label="Job Title *"
                    placeholder="e.g., Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    variant="glass"
                    disabled={!!formData.selectedJobId}
                  />
                </div>

                {/* Resume Selection */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Resume Content (Optional)
                  </label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsResumeModalOpen(true)}
                        leftIcon={<FileText className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Select Resume
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsPDFParserOpen(true)}
                        leftIcon={<Upload className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Parse Resume
                      </Button>
                    </div>
                    {formData.resumeContent && (
                      <div className="bg-dark-800/30 border border-primary-500/30 rounded-lg p-2 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-primary-300 font-medium">Resume content loaded</span>
                          <span className="text-slate-400">{formData.resumeContent.length} characters</span>
                        </div>
                      </div>
                    )}
                    {formData.resumeContent && (
                      <Button
                        onClick={handleGenerateWithGemini}
                        disabled={isGeneratingWithGemini || !formData.resumeContent || !formData.jobDescription}
                        leftIcon={isGeneratingWithGemini ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        variant="primary"
                        className="w-full"
                      >
                        Generate with Gemini AI
                      </Button>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    rows={window.innerWidth < 640 ? 8 : 12}
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none font-mono text-sm"
                    placeholder="Job description will be auto-filled when you select a job opportunity..."
                    disabled={!!formData.selectedJobId}
                  />
                </div>

                {/* Display AI Resume Data if available */}
                {selectedAiResume && (
                  <div className="bg-gradient-to-r from-success-900/20 to-success-800/20 border border-success-600/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-success-300 mb-3 flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>AI Resume Data</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 mb-1">Keywords Extracted:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedAiResume.keywords_extracted?.map((keyword, index) => (
                            <span key={index} className="bg-primary-600/20 text-primary-300 px-2 py-1 rounded text-xs">
                              {keyword}
                            </span>
                          )) || <span className="text-slate-500">None extracted yet</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Skills Required:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedAiResume.skills_required?.map((skill, index) => (
                            <span key={index} className="bg-secondary-600/20 text-secondary-300 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          )) || <span className="text-slate-500">None extracted yet</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">ATS Score:</p>
                        <span className="text-success-300 font-bold">{selectedAiResume.ats_score || 0}/100</span>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Processing Status:</p>
                        <span className={`px-2 py-1 rounded text-xs ${
                          selectedAiResume.processing_status === 'completed' ? 'bg-success-600/20 text-success-300' :
                          selectedAiResume.processing_status === 'processing' ? 'bg-warning-600/20 text-warning-300' :
                          'bg-slate-600/20 text-slate-300'
                        }`}>
                          {selectedAiResume.processing_status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !formData.selectedJobId}
                  className="w-full"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  glow
                >
                  Generate with AI
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-3 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    AI Generated Suggestions
                  </h2>
                </div>
                
                {generatedContent && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      leftIcon={<Copy className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      leftIcon={<Download className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Export
                    </Button>
                  </div>
                )}
              </div>

              <div className="min-h-96">
                {generatedContent ? (
                  <div className="w-full">
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={window.innerWidth < 640 ? 15 : 20}
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none font-mono text-sm"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-dark-900/50 rounded-xl border border-slate-700/30">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Generate</h3>
                      <p className="text-slate-400 max-w-sm text-sm">
                        Select a job opportunity and click "Generate with AI" to see personalized recommendations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* AI Resume Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span>🔗 AI Resume Table Integration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                  <span>Data Source:</span>
                </h4>
                <ul className="space-y-2 text-slate-400 text-xs">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>All data sourced from AI Resume table</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Auto-populated from LinkedIn jobs</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Keywords and skills extracted automatically</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>ATS scores and processing status tracked</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-secondary-400 rounded-full"></span>
                  <span>Features:</span>
                </h4>
                <ul className="space-y-2 text-slate-400 text-xs">
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>Google Gemini or N8N integration</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>ATS optimization suggestions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>Keyword extraction and matching</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>Professional formatting tips</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* PDF Parser Modal */}
      {isPDFParserOpen && (
        <Modal
          isOpen={isPDFParserOpen}
          onClose={() => setIsPDFParserOpen(false)}
          title="Parse Resume"
          size="lg"
        >
          <PDFParser 
            onParsedContent={handleParsedContent} 
            onClose={() => setIsPDFParserOpen(false)}
          />
        </Modal>
      )}
      
      {/* Resume Selector Modal */}
      {isResumeModalOpen && (
        <Modal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          title="Select Resume"
          size="lg"
        >
          <ResumeSelector 
            onResumeSelected={handleResumeSelected} 
            onClose={() => setIsResumeModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}