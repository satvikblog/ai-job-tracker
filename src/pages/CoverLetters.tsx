import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ResumeSelector } from '../components/documents/ResumeSelector';
import { Textarea } from '../components/ui/Textarea';
import { ProgressScreen } from '../components/ui/ProgressScreen';
import { Mail, Sparkles, Copy, Download, Save, Send, Zap, Target, Brain, MessageSquare, FileText, Loader } from 'lucide-react';
import { useJobApplications } from '../hooks/useJobApplications';
import { useAIGenerationService } from '../hooks/useAIGenerationService';
import { useGeminiAI } from '../hooks/useGeminiAI';
import { PDFParser } from '../components/documents/PDFParser';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface LinkedInJob {
  id: string;
  title: string;
  company_name: string;
  description: string;
  location: string;
}

interface AIResumeData {
  id: string;
  title: string | null;
  company_name: string | null;
  description: string | null;
}

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'formal', label: 'Formal' },
  { value: 'creative', label: 'Creative' }
];

export function CoverLetters() {
  const [formData, setFormData] = useState({
    selectedJobId: '',
    selectedResumeId: '',
    resumeContent: '',
    jobSource: 'linkedin', // 'linkedin', 'ai_resume', or 'manual'
    companyName: '',
    jobTitle: '',
    hiringManager: '',
    tone: 'professional',
    jobDescription: '',
    personalExperience: '',
    whyCompany: ''
  });
  
  const [linkedInJobs, setLinkedInJobs] = useState<LinkedInJob[]>([]);
  const [aiResumeJobs, setAiResumeJobs] = useState<AIResumeData[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isPDFParserOpen, setIsPDFParserOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isGeneratingWithGemini, setIsGeneratingWithGemini] = useState(false);
  
  const { applications } = useJobApplications();
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
    generateCoverLetterContent
  } = useGeminiAI();

  // Fetch LinkedIn jobs and AI Resume data on component mount
  useEffect(() => {
    fetchJobData();
  }, []);

  const fetchJobData = async () => {
    try {
      setLoadingJobs(true);
      
      // Fetch LinkedIn jobs
      const { data: linkedInData, error: linkedInError } = await supabase
        .from('linkedin_jobs')
        .select('id, title, company_name, description, location')
        .order('created_at', { ascending: false });

      if (linkedInError) throw linkedInError;
      setLinkedInJobs(linkedInData || []);
      
      // Fetch AI Resume data
      const { data: aiResumeData, error: aiResumeError } = await supabase
        .from('ai_resume')
        .select('id, title, company_name, description')
        .order('created_at', { ascending: false });

      if (aiResumeError) throw aiResumeError;
      setAiResumeJobs(aiResumeData || []);
      
    } catch (error: any) {
      console.error('Error fetching job data:', error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoadingJobs(false);
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

  // Combine job options from different sources
  const getJobOptions = () => {
    const baseOptions = [
      { value: '', label: 'Select a job...', group: 'Select Source' }
    ];
    
    const linkedInOptions = linkedInJobs.map(job => ({
      value: `linkedin:${job.id}`,
      label: `${job.company_name} - ${job.title}`,
      group: 'LinkedIn Jobs'
    }));
    
    const aiResumeOptions = aiResumeJobs.map(job => ({
      value: `ai_resume:${job.id}`,
      label: `${job.company_name} - ${job.title}`,
      group: 'AI Resume Jobs'
    }));
    
    const applicationOptions = applications.map(app => ({
      value: `application:${app.id}`,
      label: `${app.company_name} - ${app.job_title}`,
      group: 'My Applications'
    }));
    
    return [
      ...baseOptions,
      ...linkedInOptions,
      ...aiResumeOptions,
      ...applicationOptions
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill company and job title when job is selected
    if (field === 'selectedJobId' && value) {
      const [source, id] = value.split(':');
      
      if (source === 'linkedin') {
        const selectedJob = linkedInJobs.find(job => job.id === id);
        if (selectedJob) {
          setFormData(prev => ({
            ...prev,
            jobSource: 'linkedin',
            companyName: selectedJob.company_name,
            jobTitle: selectedJob.title,
            jobDescription: selectedJob.description || ''
          }));
        }
      } else if (source === 'ai_resume') {
        const selectedJob = aiResumeJobs.find(job => job.id === id);
        if (selectedJob) {
          setFormData(prev => ({
            ...prev,
            jobSource: 'ai_resume',
            companyName: selectedJob.company_name || '',
            jobTitle: selectedJob.title || '',
            jobDescription: selectedJob.description || ''
          }));
        }
      } else if (source === 'application') {
        const selectedApp = applications.find(app => app.id === id);
        if (selectedApp) {
          setFormData(prev => ({
            ...prev,
            jobSource: 'application',
            companyName: selectedApp.company_name,
            jobTitle: selectedApp.job_title,
            jobDescription: selectedApp.notes || ''
          }));
        }
      }
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
      
      const result = await generateCoverLetterContent(
        formData.resumeContent,
        formData.companyName,
        formData.jobTitle,
        formData.jobDescription
      );
      
      setFormData(prev => ({
        ...prev,
        personalExperience: result.relevantExperience,
        whyCompany: result.whyCompany
      }));
      
      toast.success('Content generated successfully with Gemini AI!');
    } catch (error: any) {
      console.error('Error generating with Gemini:', error);
      toast.error(error.message || 'Failed to generate content with Gemini');
    } finally {
      setIsGeneratingWithGemini(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.companyName || !formData.jobTitle) {
      toast.error('Please fill in company name and job title');
      return;
    }

    if (!formData.jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    try {
      await generateContent('cover-letter', {
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription,
        hiring_manager: formData.hiringManager,
        tone: formData.tone,
        personal_experience: formData.personalExperience,
        why_company: formData.whyCompany,
        selected_job_id: formData.selectedJobId.split(':')[1] || null,
        job_source: formData.jobSource
      });
      
      // After generation, save to n8n_generations_cover_letter table
      if (generatedContent) {
        await saveGenerationToDatabase(formData, generatedContent);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const saveGenerationToDatabase = async (formData: any, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Extract job ID and source
      let jobId = null;
      if (formData.selectedJobId) {
        const [source, id] = formData.selectedJobId.split(':');
        if (source === 'linkedin') {
          jobId = id;
        }
      }
      
      // Calculate word count
      const wordCount = content.split(/\s+/).length;
      
      // Calculate personalization score based on presence of company name and job title
      const contentLower = content.toLowerCase();
      const companyNameLower = formData.companyName.toLowerCase();
      const jobTitleLower = formData.jobTitle.toLowerCase();
      
      let personalizationScore = 50; // Base score
      
      if (contentLower.includes(companyNameLower)) personalizationScore += 15;
      if (contentLower.includes(jobTitleLower)) personalizationScore += 15;
      if (formData.personalExperience && contentLower.includes(formData.personalExperience.toLowerCase().substring(0, 20))) personalizationScore += 10;
      if (formData.whyCompany && contentLower.includes(formData.whyCompany.toLowerCase().substring(0, 20))) personalizationScore += 10;
      
      // Clamp score between 0-100
      personalizationScore = Math.min(100, Math.max(0, personalizationScore));
      
      // Save to database
      const { error } = await supabase
        .from('n8n_generations_cover_letter')
        .insert({
          job_id: jobId,
          job_type: jobId ? 'linkedin' : 'application',
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          content: content,
          tone: formData.tone,
          keywords: [], // Would be extracted by AI in a real implementation
          personalization_score: personalizationScore,
          word_count: wordCount,
          user_id: user.id
        });

      if (error) {
        console.error('Error saving cover letter generation:', error);
      }
    } catch (error) {
      console.error('Error saving cover letter generation:', error);
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
    a.download = `cover-letter-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
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

  // Group options by source
  const jobOptions = getJobOptions();
  const groupedOptions: Record<string, { value: string; label: string }[]> = {};
  
  jobOptions.forEach(option => {
    if (!groupedOptions[option.group]) {
      groupedOptions[option.group] = [];
    }
    groupedOptions[option.group].push({ value: option.value, label: option.label });
  });

  return (
    <>
      {loading && (
        <ProgressScreen
          type="cover-letter"
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
              <span>AI Cover Letter Generator</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center space-x-2 text-sm lg:text-base">
              <Target className="w-4 h-4" />
              <span>Create personalized, compelling cover letters powered by AI</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-primary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-primary-300 font-medium">AI Powered</p>
                  <p className="text-xs text-slate-400">Smart Writing</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-success-900/20 to-success-800/20 border border-success-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-success-400" />
                <div>
                  <p className="text-xs lg:text-sm text-success-300 font-medium">5 Tones</p>
                  <p className="text-xs text-slate-400">Available</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-secondary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-secondary-300 font-medium">Personalized</p>
                  <p className="text-xs text-slate-400">Content</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent-900/20 to-accent-800/20 border border-accent-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-accent-400" />
                <div>
                  <p className="text-xs lg:text-sm text-accent-300 font-medium">Fast</p>
                  <p className="text-xs text-slate-400">Generation</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Cover Letter Details
                </h2>
              </div>

              <div className="space-y-4 lg:space-y-6 mobile-form">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Job Opportunity
                  </label>
                  <select
                    value={formData.selectedJobId}
                    onChange={(e) => handleInputChange('selectedJobId', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {Object.entries(groupedOptions).map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map(option => (
                          <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    placeholder="e.g., Google"
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Hiring Manager (Optional)"
                    placeholder="e.g., John Smith"
                    value={formData.hiringManager}
                    onChange={(e) => handleInputChange('hiringManager', e.target.value)}
                    variant="glass"
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {toneOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Resume Selection */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Resume Content
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
                    <Button
                      onClick={handleGenerateWithGemini}
                      disabled={isGeneratingWithGemini || !formData.resumeContent || !formData.jobDescription}
                      leftIcon={isGeneratingWithGemini ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      variant="primary"
                      className="w-full"
                    >
                      Generate with Gemini AI
                    </Button>
                  </div>
                </div>

                <Textarea
                  label="Job Description *"
                  placeholder="Paste the job description here for AI analysis..."
                  rows={window.innerWidth < 640 ? 4 : 6}
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  variant="glass"
                  disabled={!!formData.selectedJobId}
                />

                <Textarea
                  label="Your Relevant Experience"
                  placeholder="Briefly describe your relevant experience and skills..."
                  rows={3}
                  value={formData.personalExperience}
                  onChange={(e) => handleInputChange('personalExperience', e.target.value)}
                  variant="glass"
                />

                <Textarea
                  label="Why This Company?"
                  placeholder="What interests you about this company specifically?"
                  rows={3}
                  value={formData.whyCompany}
                  onChange={(e) => handleInputChange('whyCompany', e.target.value)}
                  variant="glass"
                />

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  glow
                >
                  Generate with AI
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Generated Letter */}
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
                    AI Generated Cover Letter
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
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Send className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Send
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
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-dark-900/50 rounded-xl border border-slate-700/30">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Generate</h3>
                      <p className="text-slate-400 max-w-sm text-sm">
                        Fill in the details and click "Generate with AI" to create your personalized cover letter
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* AI Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span>🔗 AI Integration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-2">How it works:</h4>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li>• Uses Google Gemini or N8N workflow</li>
                  <li>• Analyzes job requirements</li>
                  <li>• Generates personalized content</li>
                  <li>• Returns optimized cover letter</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Features:</h4>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li>• 5 different tone options</li>
                  <li>• Company-specific customization</li>
                  <li>• Experience integration</li>
                  <li>• Professional formatting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Processing:</h4>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li>• Fast generation with Gemini</li>
                  <li>• Real-time progress tracking</li>
                  <li>• Instant copy & export</li>
                  <li>• Ready-to-send format</li>
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