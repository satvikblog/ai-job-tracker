import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Search, MapPin, Clock, DollarSign, Briefcase, ExternalLink, Filter, Calendar, Mail, Linkedin, Globe, Building, CheckCircle, AlertCircle, Star, Users, Award, Zap, FileText, Target, Phone, MessageSquare, Link2, Timer, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { format, isAfter, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface JobLead {
  id: string;
  created_at: string;
  is_valid_opportunity: boolean;
  job_title: string;
  company_name: string;
  location: string;
  salary: string;
  job_type: string;
  deadline: string;
  job_link: string;
  recruiter_name: string;
  email_snippet: string;
  email_subject: string;
  email_from: string;
  email_to: string;
  thread_id: string;
  source: string;
  extracted_from: string;
  parsed_by: string;
  responsibilities: string[];
  requirements: string[];
  duration: string;
  website: string;
}

const sourceIcons = {
  gmail: Mail,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
  indeed: Briefcase,
  glassdoor: Building,
  default: Globe
};

const sourceColors = {
  gmail: 'error',
  linkedin: 'primary',
  website: 'secondary',
  email: 'warning',
  indeed: 'success',
  glassdoor: 'accent',
  default: 'default'
} as const;

const jobTypeColors = {
  'Full-time': 'success',
  'Part-time': 'warning',
  'Contract': 'secondary',
  'Freelance': 'primary',
  'Internship': 'accent',
  'Remote': 'success',
  default: 'default'
} as const;

export function JobOpportunities() {
  const [jobLeads, setJobLeads] = useState<JobLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'detailed'>('detailed');

  useEffect(() => {
    fetchJobLeads();
  }, []);

  const fetchJobLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_leads')
        .select('*')
        .eq('is_valid_opportunity', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching job leads:', error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const locations = [...new Set(jobLeads.map(job => job.location).filter(Boolean))];
    const jobTypes = [...new Set(jobLeads.map(job => job.job_type).filter(Boolean))];
    const sources = [...new Set(jobLeads.map(job => job.source).filter(Boolean))];

    return { locations, jobTypes, sources };
  }, [jobLeads]);

  // Filter job leads
  const filteredJobLeads = useMemo(() => {
    return jobLeads.filter(job => {
      const matchesSearch = 
        job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.responsibilities?.some(resp => resp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.requirements?.some(req => req.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.email_snippet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.recruiter_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || job.location === locationFilter;
      const matchesJobType = !jobTypeFilter || job.job_type === jobTypeFilter;
      const matchesSource = !sourceFilter || job.source === sourceFilter;

      return matchesSearch && matchesLocation && matchesJobType && matchesSource;
    });
  }, [jobLeads, searchTerm, locationFilter, jobTypeFilter, sourceFilter]);

  // Group jobs by urgency for Kanban view
  const kanbanColumns = useMemo(() => {
    const now = new Date();
    const urgent = filteredJobLeads.filter(job => {
      if (!job.deadline) return false;
      const deadline = parseISO(job.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
    });

    const thisWeek = filteredJobLeads.filter(job => {
      if (!job.deadline) return false;
      const deadline = parseISO(job.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDeadline > 3 && daysUntilDeadline <= 7;
    });

    const later = filteredJobLeads.filter(job => {
      if (!job.deadline) return true;
      const deadline = parseISO(job.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDeadline > 7;
    });

    const expired = filteredJobLeads.filter(job => {
      if (!job.deadline) return false;
      const deadline = parseISO(job.deadline);
      return deadline < now;
    });

    return { urgent, thisWeek, later, expired };
  }, [filteredJobLeads]);

  const getSourceIcon = (source: string) => {
    const IconComponent = sourceIcons[source as keyof typeof sourceIcons] || sourceIcons.default;
    return IconComponent;
  };

  const getSourceColor = (source: string) => {
    return sourceColors[source as keyof typeof sourceColors] || sourceColors.default;
  };

  const getJobTypeColor = (jobType: string) => {
    return jobTypeColors[jobType as keyof typeof jobTypeColors] || jobTypeColors.default;
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    try {
      const date = parseISO(deadline);
      const isExpired = !isAfter(date, new Date());
      const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return {
        formatted: format(date, 'MMM dd, yyyy'),
        isExpired,
        daysUntil,
        urgency: daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'later'
      };
    } catch {
      return null;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setJobTypeFilter('');
    setSourceFilter('');
  };

  const DetailedJobCard = ({ job, index }: { job: JobLead; index: number }) => {
    const SourceIcon = getSourceIcon(job.source);
    const deadlineInfo = formatDeadline(job.deadline);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-br from-dark-800/90 to-dark-900/90 border border-slate-700/50 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-900/30 to-secondary-900/30 border-b border-slate-700/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 leading-tight">
                      {job.job_title || 'Job Title Not Available'}
                    </h2>
                    <p className="text-lg text-slate-300 font-medium">
                      {job.company_name || 'Company Not Specified'}
                    </p>
                  </div>
                </div>
                
                {/* Quick Info Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {job.location && (
                    <div className="flex items-center space-x-2 bg-dark-800/50 rounded-lg px-3 py-1">
                      <MapPin className="w-4 h-4 text-primary-400" />
                      <span className="text-sm text-slate-300">{job.location}</span>
                    </div>
                  )}
                  
                  {job.job_type && (
                    <Badge variant={getJobTypeColor(job.job_type)} className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{job.job_type}</span>
                    </Badge>
                  )}
                  
                  <Badge variant={getSourceColor(job.source)} className="flex items-center space-x-1">
                    <SourceIcon className="w-3 h-3" />
                    <span className="capitalize">{job.source}</span>
                  </Badge>
                  
                  {deadlineInfo && (
                    <Badge 
                      variant={deadlineInfo.isExpired ? 'error' : deadlineInfo.urgency === 'urgent' ? 'warning' : 'success'}
                      className="flex items-center space-x-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {deadlineInfo.isExpired ? 'Expired' : `${deadlineInfo.daysUntil} days left`}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 lg:ml-6">
                {job.job_link && (
                  <Button
                    onClick={() => window.open(job.job_link, '_blank')}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    className="w-full lg:w-auto"
                    glow
                  >
                    Apply Now
                  </Button>
                )}
                {job.website && (
                  <Button
                    onClick={() => window.open(job.website, '_blank')}
                    variant="outline"
                    leftIcon={<Globe className="w-4 h-4" />}
                    className="w-full lg:w-auto"
                  >
                    Company Site
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Job Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Salary & Duration */}
                {(job.salary || job.duration) && (
                  <div className="bg-gradient-to-r from-success-900/20 to-success-800/20 border border-success-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-success-300 mb-3 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Compensation & Duration</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.salary && (
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Salary Range</p>
                          <p className="text-lg font-bold text-success-300">{job.salary}</p>
                        </div>
                      )}
                      {job.duration && (
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Duration</p>
                          <p className="text-lg font-medium text-slate-200 flex items-center space-x-2">
                            <Timer className="w-4 h-4" />
                            <span>{job.duration}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Key Responsibilities</span>
                    </h3>
                    <div className="space-y-3">
                      {job.responsibilities.map((resp, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 bg-dark-800/30 rounded-lg">
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">{idx + 1}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{resp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="bg-gradient-to-r from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-secondary-300 mb-4 flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span>Requirements & Skills</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-sm py-2 px-3 bg-secondary-900/30 border border-secondary-600/50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Content */}
                {job.email_snippet && (
                  <div className="bg-gradient-to-r from-accent-900/20 to-accent-800/20 border border-accent-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-accent-300 mb-3 flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Email Content</span>
                    </h3>
                    {job.email_subject && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-1">Subject:</p>
                        <p className="text-slate-200 font-medium">{job.email_subject}</p>
                      </div>
                    )}
                    <div className="bg-dark-800/30 rounded-lg p-4">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {job.email_snippet}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Contact & Meta Info */}
              <div className="space-y-6">
                {/* Contact Information */}
                {(job.recruiter_name || job.email_from) && (
                  <div className="bg-gradient-to-br from-warning-900/20 to-warning-800/20 border border-warning-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-warning-300 mb-4 flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="space-y-3">
                      {job.recruiter_name && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Recruiter</p>
                            <p className="text-slate-200 font-medium">{job.recruiter_name}</p>
                          </div>
                        </div>
                      )}
                      {job.email_from && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Email</p>
                            <p className="text-slate-200 font-medium break-all">{job.email_from}</p>
                          </div>
                        </div>
                      )}
                      {job.email_to && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Sent To</p>
                            <p className="text-slate-200 font-medium break-all">{job.email_to}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Deadline Information */}
                {deadlineInfo && (
                  <div className={`bg-gradient-to-br rounded-xl p-4 border ${
                    deadlineInfo.isExpired 
                      ? 'from-error-900/20 to-error-800/20 border-error-600/30'
                      : deadlineInfo.urgency === 'urgent'
                      ? 'from-warning-900/20 to-warning-800/20 border-warning-600/30'
                      : 'from-success-900/20 to-success-800/20 border-success-600/30'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${
                      deadlineInfo.isExpired 
                        ? 'text-error-300'
                        : deadlineInfo.urgency === 'urgent'
                        ? 'text-warning-300'
                        : 'text-success-300'
                    }`}>
                      <Clock className="w-5 h-5" />
                      <span>Application Deadline</span>
                    </h3>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-100 mb-1">
                        {deadlineInfo.formatted}
                      </p>
                      <p className={`text-sm font-medium ${
                        deadlineInfo.isExpired 
                          ? 'text-error-400'
                          : deadlineInfo.urgency === 'urgent'
                          ? 'text-warning-400'
                          : 'text-success-400'
                      }`}>
                        {deadlineInfo.isExpired 
                          ? 'Application Deadline Passed'
                          : `${deadlineInfo.daysUntil} days remaining`
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Meta Information */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Job Details</span>
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Posted:</span>
                      <span className="text-slate-200">{format(parseISO(job.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    {job.extracted_from && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Source:</span>
                        <span className="text-slate-200">{job.extracted_from}</span>
                      </div>
                    )}
                    {job.parsed_by && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parsed by:</span>
                        <span className="text-slate-200">{job.parsed_by}</span>
                      </div>
                    )}
                    {job.thread_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Thread ID:</span>
                        <span className="text-slate-200 font-mono text-xs">{job.thread_id.substring(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  {job.job_link && (
                    <Button
                      onClick={() => window.open(job.job_link, '_blank')}
                      className="w-full"
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                      glow
                    >
                      Apply for this Position
                    </Button>
                  )}
                  {job.website && (
                    <Button
                      onClick={() => window.open(job.website, '_blank')}
                      variant="outline"
                      className="w-full"
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      Visit Company Website
                    </Button>
                  )}
                  {job.email_from && (
                    <Button
                      onClick={() => window.open(`mailto:${job.email_from}`, '_blank')}
                      variant="outline"
                      className="w-full"
                      leftIcon={<Mail className="w-4 h-4" />}
                    >
                      Contact Recruiter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
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
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
          🔥 Comprehensive Job Opportunities
        </h1>
        <p className="text-slate-400 text-lg">
          Detailed insights into every available position with complete information
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
            <span>{filteredJobLeads.length} detailed opportunities</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Full Information Display</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-dark-800/80 to-dark-900/80 border border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search jobs, companies, skills, requirements, or email content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="w-full"
                  variant="glass"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                Filters
              </Button>
              {(searchTerm || locationFilter || jobTypeFilter || sourceFilter) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-slate-700/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations.map(location => (
                      <option key={location} value={location} className="bg-dark-800">
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Type</label>
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
                  >
                    <option value="">All Types</option>
                    {filterOptions.jobTypes.map(type => (
                      <option key={type} value={type} className="bg-dark-800">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
                  >
                    <option value="">All Sources</option>
                    {filterOptions.sources.map(source => (
                      <option key={source} value={source} className="bg-dark-800">
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Job Listings */}
      <div className="space-y-8">
        {filteredJobLeads.map((job, index) => (
          <DetailedJobCard key={job.id} job={job} index={index} />
        ))}
      </div>

      {/* Empty State */}
      {filteredJobLeads.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">
            {searchTerm || locationFilter || jobTypeFilter || sourceFilter 
              ? 'No jobs match your filters' 
              : 'No job opportunities available'
            }
          </h3>
          <p className="text-slate-400 mb-6">
            {searchTerm || locationFilter || jobTypeFilter || sourceFilter
              ? 'Try adjusting your search criteria or filters'
              : 'Check back later for new opportunities'
            }
          </p>
          {(searchTerm || locationFilter || jobTypeFilter || sourceFilter) && (
            <Button onClick={clearFilters} variant="primary">
              Clear All Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Enhanced Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-400">{jobLeads.length}</div>
            <div className="text-sm text-slate-400">Total Opportunities</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary-400">
              {filterOptions.locations.length}
            </div>
            <div className="text-sm text-slate-400">Locations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-400">
              {jobLeads.filter(job => job.requirements && job.requirements.length > 0).length}
            </div>
            <div className="text-sm text-slate-400">With Requirements</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success-400">
              {jobLeads.filter(job => job.responsibilities && job.responsibilities.length > 0).length}
            </div>
            <div className="text-sm text-slate-400">With Details</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning-400">
              {jobLeads.filter(job => job.recruiter_name).length}
            </div>
            <div className="text-sm text-slate-400">With Contacts</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}