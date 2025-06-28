import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileText, Zap, CheckCircle, AlertCircle, Award, Briefcase, GraduationCap, Code, Brain, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseResumeFile, analyzeResume, ResumeSection, ParsedResume } from '../../utils/resumeParser';
import toast from 'react-hot-toast';

interface ResumeAnalyzerProps {
  file: File | null;
  onClose?: () => void;
}

export function ResumeAnalyzer({ file, onClose }: ResumeAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [analysis, setAnalysis] = useState<{
    skills: string[];
    missingKeywords: string[];
    experienceYears: number | null;
    educationLevel: string | null;
    suggestions: string[];
  } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const analyzeResumeFile = async () => {
    if (!file) {
      toast.error('Please select a resume file first');
      return;
    }

    setLoading(true);
    try {
      const parsed = await parseResumeFile(file);
      setParsedResume(parsed);
      
      const analysisResult = analyzeResume(parsed);
      setAnalysis(analysisResult);
      
      // Set the first section as active
      if (parsed.sections.length > 0) {
        setActiveSection(parsed.sections[0].title);
      }
      
      toast.success('Resume analyzed successfully!');
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast.error(`Failed to analyze resume: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSectionIcon = (type: ResumeSection['type']) => {
    switch (type) {
      case 'skills': return <Code className="w-5 h-5 text-primary-400" />;
      case 'experience': return <Briefcase className="w-5 h-5 text-secondary-400" />;
      case 'education': return <GraduationCap className="w-5 h-5 text-accent-400" />;
      case 'projects': return <Target className="w-5 h-5 text-warning-400" />;
      case 'achievements': return <Award className="w-5 h-5 text-success-400" />;
      case 'summary': return <FileText className="w-5 h-5 text-primary-400" />;
      case 'contact': return <Briefcase className="w-5 h-5 text-error-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSectionColor = (type: ResumeSection['type']) => {
    switch (type) {
      case 'skills': return 'primary';
      case 'experience': return 'secondary';
      case 'education': return 'accent';
      case 'projects': return 'warning';
      case 'achievements': return 'success';
      case 'summary': return 'primary';
      case 'contact': return 'error';
      default: return 'default';
    }
  };

  if (!file) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No Resume Selected</h3>
        <p className="text-slate-400 text-sm mb-4">
          Please select a resume file to analyze
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100">
            Resume Analyzer
          </h2>
          <p className="text-sm text-slate-400">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        </div>
        {!loading && !parsedResume && (
          <Button
            onClick={analyzeResumeFile}
            leftIcon={<Zap className="w-4 h-4" />}
            glow
          >
            Analyze Resume
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Analyzing resume content...</p>
          </div>
        </div>
      )}

      {parsedResume && analysis && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span>Resume Analysis</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-primary-400" />
                  <h4 className="font-medium text-slate-200">Skills Detected</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.skills.map((skill, index) => (
                    <Badge key={index} variant="primary" size="sm">
                      {skill}
                    </Badge>
                  ))}
                  {analysis.skills.length === 0 && (
                    <p className="text-sm text-slate-400">No skills detected</p>
                  )}
                </div>
              </div>
              
              <div className="bg-dark-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-4 h-4 text-secondary-400" />
                  <h4 className="font-medium text-slate-200">Experience</h4>
                </div>
                {analysis.experienceYears ? (
                  <p className="text-slate-300">
                    Approximately <span className="font-semibold text-secondary-300">{analysis.experienceYears} years</span> of experience
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">Experience years not detected</p>
                )}
              </div>
              
              <div className="bg-dark-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-accent-400" />
                  <h4 className="font-medium text-slate-200">Education</h4>
                </div>
                {analysis.educationLevel ? (
                  <p className="text-slate-300">
                    <span className="font-semibold text-accent-300">{analysis.educationLevel}</span> degree
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">Education level not detected</p>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-dark-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="font-medium text-slate-200 mb-3 flex items-center space-x-2">
              <Target className="w-4 h-4 text-warning-400" />
              <span>Improvement Suggestions</span>
            </h3>
            
            <div className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="mt-1 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-warning-400" />
                  </div>
                  <p className="text-sm text-slate-300">{suggestion}</p>
                </div>
              ))}
              
              {analysis.missingKeywords.length > 0 && (
                <div className="flex items-start space-x-2">
                  <div className="mt-1 flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-warning-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">Consider adding these common keywords:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.missingKeywords.map((keyword, index) => (
                        <Badge key={index} variant="warning" size="sm">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {analysis.suggestions.length === 0 && analysis.missingKeywords.length === 0 && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-400" />
                  <p className="text-sm text-slate-300">Your resume looks good! No major improvements needed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Categorized Sections */}
          <div>
            <h3 className="font-medium text-slate-200 mb-3">Categorized Sections</h3>
            
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              {parsedResume.sections.map((section) => (
                <button
                  key={section.title}
                  onClick={() => setActiveSection(section.title)}
                  className={`px-3 py-2 rounded-lg flex items-center space-x-2 whitespace-nowrap transition-colors ${
                    activeSection === section.title
                      ? `bg-${getSectionColor(section.type)}-900/30 text-${getSectionColor(section.type)}-300 border border-${getSectionColor(section.type)}-600/50`
                      : 'bg-dark-800/50 text-slate-400 border border-slate-700/50 hover:bg-dark-700/50'
                  }`}
                >
                  {getSectionIcon(section.type)}
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
            
            {activeSection && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800/50 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="mb-2 pb-2 border-b border-slate-700/50">
                  <h4 className="font-medium text-slate-200">
                    {activeSection}
                  </h4>
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-300 max-h-96 overflow-y-auto">
                  {parsedResume.sections.find(s => s.title === activeSection)?.content || 'No content found'}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}