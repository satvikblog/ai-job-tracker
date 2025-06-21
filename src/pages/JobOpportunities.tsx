import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Search, MapPin, Clock, DollarSign, Briefcase, ExternalLink, Filter, Calendar, Mail, Linkedin, Globe, Building, CheckCircle, AlertCircle, Star, Users, Award, Zap, FileText, Target, Phone, MessageSquare, Link2, Timer, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface LinkedInJob {
  id: string;
  title: string;
  location: string;
  company_name: string;
  posted_at: string;
  description: string;
  seniority: string;
  employment_type: string;
  apply_url: string;
  source: string;
  recruiter_name: string;
  recruiter_profile: string;
  recruiter_profile_url: string;
  created_at: string;
}

const employmentTypeColors = {
  'Full-time': 'success',
  'Part-time': 'warning',
  'Contract': 'secondary',
  'Freelance': 'primary',
  'Internship': 'accent',
  'Remote': 'success',
  default: 'default'
} as const;

const seniorityColors = {
  'Entry level': 'accent',
  'Associate': 'primary',
  'Mid-Senior level': 'secondary',
  'Director': 'warning',
  'Executive': 'error',
  default: 'default'
} as const;

export function JobOpportunities() {
  const [linkedInJobs, setLinkedInJobs] = useState<LinkedInJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLinkedInJobs();
  }, []);

  const fetchLinkedInJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('linkedin_jobs')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLinkedInJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching LinkedIn jobs:', error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const locations = [...new Set(linkedInJobs.map(job => job.location).filter(Boolean))];
    const employmentTypes = [...new Set(linkedInJobs.map(job => job.employment_type).filter(Boolean))];
    const seniorities = [...new Set(linkedInJobs.map(job => job.seniority).filter(Boolean))];

    return { locations, employmentTypes, seniorities };
  }, [linkedInJobs]);

  // Filter LinkedIn jobs
  const filteredJobs = useMemo(() => {
    return linkedInJobs.filter(job => {
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.recruiter_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || job.location === locationFilter;
      const matchesEmploymentType = !employmentTypeFilter || job.employment_type === employmentTypeFilter;
      const matchesSeniority = !seniorityFilter || job.seniority === seniorityFilter;

      return matchesSearch && matchesLocation && matchesEmploymentType && matchesSeniority;
    });
  }, [linkedInJobs, searchTerm, locationFilter, employmentTypeFilter, seniorityFilter]);

  const getEmploymentTypeColor = (employmentType: string) => {
    return employmentTypeColors[employmentType as keyof typeof employmentTypeColors] || employmentTypeColors.default;
  };

  const getSeniorityColor = (seniority: string) => {
    return seniorityColors[seniority as keyof typeof seniorityColors] || seniorityColors.default;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    setSeniorityFilter('');
  };

  const DetailedJobCard = ({ job, index }: { job: LinkedInJob; index: number }) => {
    const postedDate = job.posted_at ? parseISO(job.posted_at) : null;
    
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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 leading-tight">
                      {job.title || 'Job Title Not Available'}
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
                  
                  {job.employment_type && (
                    <Badge variant={getEmploymentTypeColor(job.employment_type)} className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{job.employment_type}</span>
                    </Badge>
                  )}
                  
                  {job.seniority && (
                    <Badge variant={getSeniorityColor(job.seniority)} className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{job.seniority}</span>
                    </Badge>
                  )}
                  
                  <Badge variant="primary" className="flex items-center space-x-1">
                    <Linkedin className="w-3 h-3" />
                    <span>LinkedIn</span>
                  </Badge>
                  
                  {postedDate && (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(postedDate, 'MMM dd, yyyy')}</span>
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 lg:ml-6">
                {job.apply_url && (
                  <Button
                    onClick={() => window.open(job.apply_url, '_blank')}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    className="w-full lg:w-auto"
                    glow
                  >
                    Apply on LinkedIn
                  </Button>
                )}
                {job.recruiter_profile_url && (
                  <Button
                    onClick={() => window.open(job.recruiter_profile_url, '_blank')}
                    variant="outline"
                    leftIcon={<Users className="w-4 h-4" />}
                    className="w-full lg:w-auto"
                  >
                    View Recruiter
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
                {/* Job Description */}
                {job.description && (
                  <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Job Description</span>
                    </h3>
                    <div className="bg-dark-800/30 rounded-lg p-4">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Job Requirements & Skills */}
                <div className="bg-gradient-to-r from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-secondary-300 mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Position Details</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.seniority && (
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Seniority Level</p>
                        <Badge variant={getSeniorityColor(job.seniority)} className="text-sm py-2 px-3">
                          <Award className="w-3 h-3 mr-1" />
                          {job.seniority}
                        </Badge>
                      </div>
                    )}
                    {job.employment_type && (
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Employment Type</p>
                        <Badge variant={getEmploymentTypeColor(job.employment_type)} className="text-sm py-2 px-3">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {job.employment_type}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Contact & Meta Info */}
              <div className="space-y-6">
                {/* Recruiter Information */}
                {(job.recruiter_name || job.recruiter_profile) && (
                  <div className="bg-gradient-to-br from-warning-900/20 to-warning-800/20 border border-warning-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-warning-300 mb-4 flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Recruiter Information</span>
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
                      {job.recruiter_profile && (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
                            <Linkedin className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Profile</p>
                            <p className="text-slate-200 font-medium break-all">{job.recruiter_profile}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Posting Information */}
                <div className="bg-gradient-to-br from-success-900/20 to-success-800/20 border border-success-600/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-success-300 mb-3 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Posting Information</span>
                  </h3>
                  <div className="text-center">
                    {postedDate && (
                      <>
                        <p className="text-2xl font-bold text-slate-100 mb-1">
                          {format(postedDate, 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm font-medium text-success-400">
                          Posted on LinkedIn
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta Information */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Job Details</span>
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Added:</span>
                      <span className="text-slate-200">{format(parseISO(job.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source:</span>
                      <span className="text-slate-200">{job.source || 'LinkedIn'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Job ID:</span>
                      <span className="text-slate-200 font-mono text-xs">{job.id.substring(0, 12)}...</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  {job.apply_url && (
                    <Button
                      onClick={() => window.open(job.apply_url, '_blank')}
                      className="w-full"
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                      glow
                    >
                      Apply for this Position
                    </Button>
                  )}
                  {job.recruiter_profile_url && (
                    <Button
                      onClick={() => window.open(job.recruiter_profile_url, '_blank')}
                      variant="outline"
                      className="w-full"
                      leftIcon={<Linkedin className="w-4 h-4" />}
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
          <p className="text-slate-400">Loading LinkedIn job opportunities...</p>
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
          💼 LinkedIn Job Opportunities
        </h1>
        <p className="text-slate-400 text-lg">
          Discover the latest job opportunities sourced directly from LinkedIn
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>{filteredJobs.length} LinkedIn opportunities</span>
          </div>
          <div className="flex items-center space-x-2">
            <Linkedin className="w-4 h-4" />
            <span>Direct from LinkedIn</span>
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
                  placeholder="Search jobs, companies, locations, or descriptions..."
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
              {(searchTerm || locationFilter || employmentTypeFilter || seniorityFilter) && (
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Employment Type</label>
                  <select
                    value={employmentTypeFilter}
                    onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
                  >
                    <option value="">All Types</option>
                    {filterOptions.employmentTypes.map(type => (
                      <option key={type} value={type} className="bg-dark-800">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Seniority Level</label>
                  <select
                    value={seniorityFilter}
                    onChange={(e) => setSeniorityFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100"
                  >
                    <option value="">All Levels</option>
                    {filterOptions.seniorities.map(seniority => (
                      <option key={seniority} value={seniority} className="bg-dark-800">
                        {seniority}
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
        {filteredJobs.map((job, index) => (
          <DetailedJobCard key={job.id} job={job} index={index} />
        ))}
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Linkedin className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">
            {searchTerm || locationFilter || employmentTypeFilter || seniorityFilter 
              ? 'No jobs match your filters' 
              : 'No LinkedIn jobs available'
            }
          </h3>
          <p className="text-slate-400 mb-6">
            {searchTerm || locationFilter || employmentTypeFilter || seniorityFilter
              ? 'Try adjusting your search criteria or filters'
              : 'Check back later for new opportunities from LinkedIn'
            }
          </p>
          {(searchTerm || locationFilter || employmentTypeFilter || seniorityFilter) && (
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
        className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-600/30 rounded-xl p-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{linkedInJobs.length}</div>
            <div className="text-sm text-slate-400">Total Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary-400">
              {filterOptions.locations.length}
            </div>
            <div className="text-sm text-slate-400">Locations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-400">
              {linkedInJobs.filter(job => job.recruiter_name).length}
            </div>
            <div className="text-sm text-slate-400">With Recruiters</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success-400">
              {linkedInJobs.filter(job => job.description && job.description.length > 100).length}
            </div>
            <div className="text-sm text-slate-400">Detailed Posts</div>
          </div>
        </div>
      </div>
    </div>
  );
}