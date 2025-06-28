import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PDFParser } from './PDFParser';
import { FileText, Upload, Search, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ResumeData {
  id: string;
  file_name: string;
  file_url: string;
  resume_content: string | null;
  uploaded_on: string;
}

interface ResumeSelectorProps {
  onResumeSelected: (content: string) => void;
  onClose?: () => void;
}

export function ResumeSelector({ onResumeSelected, onClose }: ResumeSelectorProps) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isPDFParserOpen, setIsPDFParserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_type', 'resume')
        .order('uploaded_on', { ascending: false });
        
      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = (resume: ResumeData) => {
    setSelectedResumeId(resume.id);
    
    if (resume.resume_content) {
      onResumeSelected(resume.resume_content);
      if (onClose) onClose();
    } else {
      toast.error('No content available for this resume. Try parsing it first.');
    }
  };

  const handleParsedContent = (content: string) => {
    onResumeSelected(content);
    setIsPDFParserOpen(false);
    if (onClose) onClose();
  };

  const filteredResumes = resumes.filter(resume => 
    resume.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100">
            Select Resume
          </h2>
          <p className="text-sm text-slate-400">
            Choose a resume to use for your cover letter
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPDFParserOpen(true)}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Parse New
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resumes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
          />
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredResumes.length > 0 ? (
          filteredResumes.map((resume, index) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedResumeId === resume.id 
                    ? 'bg-primary-900/30 border border-primary-500/50' 
                    : 'bg-dark-800/50 border border-slate-700/30 hover:bg-dark-700/50'
                }`}
                onClick={() => handleResumeSelect(resume)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200 text-sm">{resume.file_name}</h3>
                      <p className="text-xs text-slate-400">
                        {new Date(resume.uploaded_on).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectedResumeId === resume.id && (
                    <Check className="w-5 h-5 text-primary-400" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              {searchTerm ? 'No matching resumes found' : 'No resumes found'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {searchTerm 
                ? 'Try a different search term' 
                : 'Upload a resume or parse a new one'
              }
            </p>
            <Button
              onClick={() => setIsPDFParserOpen(true)}
              leftIcon={<Upload className="w-4 h-4" />}
              variant="primary"
            >
              Parse New Resume
            </Button>
          </div>
        )}
      </div>

      {isPDFParserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <PDFParser 
              onParsedContent={handleParsedContent} 
              onClose={() => setIsPDFParserOpen(false)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}