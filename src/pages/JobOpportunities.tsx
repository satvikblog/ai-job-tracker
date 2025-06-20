import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Search, MapPin, Clock, DollarSign, Briefcase, ExternalLink, Filter, Calendar, Mail, Linkedin, Globe, Building, CheckCircle, AlertCircle, Star, Users, Award, Zap } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban');

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
        job.requirements?.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()));
      
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

  const JobCard = ({ job, index }: { job: JobLead; index: number }) => {
    const SourceIcon = getSourceIcon(job.source);
    const deadlineInfo = formatDeadline(job.deadline);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card 
          hover 
          className="h-full bg-gradient-to-br from-dark-800/90 to-dark-900/90 border border-slate-700/50 group overflow-hidden"
        >
          <div className="flex flex-col h-full">
            {/* Header with Company & Source */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-700/30">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">
                    {job.company_name || 'Company Not Specified'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-2 leading-tight">
                  {job.job_title || 'Job Title Not Available'}
                </h3>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={getSourceColor(job.source)} className="flex items-center space-x-1">
                  <SourceIcon className="w-3 h-3" />
                  <span className="capitalize text-xs">{job.source}</span>
                </Badge>
                {deadlineInfo && (
                  <Badge 
                    variant={deadlineInfo.isExpired ? 'error' : deadlineInfo.urgency === 'urgent' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {deadlineInfo.isExpired ? 'Expired' : `${deadlineInfo.daysUntil}d left`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Job Details Grid */}
            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                {job.location && (
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}

                {job.job_type && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Badge variant={getJobTypeColor(job.job_type)} size="sm">
                      {job.job_type}
                    </Badge>
                  </div>
                )}

                {job.salary && (
                  <div className="flex items-center space-x-2 text-sm text-slate-400 col-span-2">
                    <DollarSign className="w-4 h-4 text-success-400" />
                    <span className="font-medium text-success-300">{job.salary}</span>
                  </div>
                )}

                {job.duration && (
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4 text-warning-400" />
                    <span>{job.duration}</span>
                  </div>
                )}
              </div>

              {/* Responsibilities Section */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium text-primary-300">Key Responsibilities</span>
                  </div>
                  <div className="space-y-1">
                    {job.responsibilities.slice(0, 3).map((resp, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                        <span className="text-primary-400 mt-1">•</span>
                        <span className="line-clamp-2">{resp}</span>
                      </div>
                    ))}
                    {job.responsibilities.length > 3 && (
                      <div className="text-xs text-primary-400 font-medium">
                        +{job.responsibilities.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements Section */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-gradient-to-r from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm font-medium text-secondary-300">Requirements</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 4).map((req, idx) => (
                      <Badge key={idx} variant="secondary" size="sm" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {job.requirements.length > 4 && (
                      <Badge variant="secondary" size="sm" className="text-xs">
                        +{job.requirements.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {job.recruiter_name && (
                <div className="bg-dark-900/50 rounded-lg p-2 border border-slate-700/30">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-accent-400" />
                    <span className="text-sm text-slate-300">Contact: {job.recruiter_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {format(parseISO(job.created_at), 'MMM dd')}
                </div>
                <div className="flex items-center space-x-2">
                  {job.website && (
                    <Button
                      onClick={() => window.open(job.website, '_blank')}
                      variant="outline"
                      size="sm"
                      leftIcon={<Globe className="w-3 h-3" />}
                    >
                      Site
                    </Button>
                  )}
                  {job.job_link ? (
                    <Button
                      onClick={() => window.open(job.job_link, '_blank')}
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                      size="sm"
                      className="group-hover:scale-105 transition-transform"
                      glow
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button disabled variant="outline" size="sm">
                      No Link
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
          🔥 Latest Job Opportunities
        </h1>
        <p className="text-slate-400 text-lg">
          Discover exciting career opportunities with detailed insights
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
            <span>{filteredJobLeads.length} opportunities available</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>AI-Enhanced Details</span>
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
                  placeholder="Search jobs, companies, skills, or requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="w-full lg:max-w-lg"
                  variant="glass"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-dark-800/70 border border-slate-600 rounded-lg p-1">
                <Button
                  variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="rounded-md"
                >
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-md"
                >
                  Grid
                </Button>
              </div>
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

      {/* Content */}
      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Urgent Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-error-500 rounded-full"></div>
              <h3 className="font-semibold text-error-300">Urgent (≤3 days)</h3>
              <Badge variant="error" size="sm">{kanbanColumns.urgent.length}</Badge>
            </div>
            <div className="space-y-4">
              {kanbanColumns.urgent.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          </div>

          {/* This Week Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
              <h3 className="font-semibold text-warning-300">This Week</h3>
              <Badge variant="warning" size="sm">{kanbanColumns.thisWeek.length}</Badge>
            </div>
            <div className="space-y-4">
              {kanbanColumns.thisWeek.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          </div>

          {/* Later Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <h3 className="font-semibold text-success-300">Later</h3>
              <Badge variant="success" size="sm">{kanbanColumns.later.length}</Badge>
            </div>
            <div className="space-y-4">
              {kanbanColumns.later.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          </div>

          {/* Expired Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
              <h3 className="font-semibold text-slate-400">Expired</h3>
              <Badge variant="default" size="sm">{kanbanColumns.expired.length}</Badge>
            </div>
            <div className="space-y-4 opacity-60">
              {kanbanColumns.expired.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobLeads.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      )}

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
            <div className="text-2xl font-bold text-error-400">{kanbanColumns.urgent.length}</div>
            <div className="text-sm text-slate-400">Urgent</div>
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
        </div>
      </motion.div>
    </div>
  );
}