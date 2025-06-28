import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Search, MapPin, Clock, DollarSign, Briefcase, ExternalLink, Filter, Calendar, Mail, Linkedin, Globe, Building, CheckCircle, AlertCircle, Star, Users, Award, Zap, FileText, Target, Phone, MessageSquare, Link2, Timer, Sparkles, Eye, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useJobApplications } from '../hooks/useJobApplications';
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
  const [selectedJob, setSelectedJob] = useState<LinkedInJob | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [addingToApplications, setAddingToApplications] = useState<string | null>(null);

  const { addApplication } = useJobApplications();

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

  // Convert LinkedIn job to job application format
  const convertToJobApplication = (linkedInJob: LinkedInJob) => {
    return {
      company_name: linkedInJob.company_name || 'Unknown Company',
      job_title: linkedInJob.title || 'Unknown Position',
      job_link: linkedInJob.apply_url || null,
      source_site: 'LinkedIn',
      applied_on: new Date().toISOString().split('T')[0],
      status: 'applied' as const,
      next_follow_up_date: null,
      notes: `LinkedIn Job Description:\n${linkedInJob.description || ''}\n\nSeniority: ${linkedInJob.seniority || 'Not specified'}\nEmployment Type: ${linkedInJob.employment_type || 'Not specified'}\nRecruiter: ${linkedInJob.recruiter_name || 'Not specified'}`,
      salary: null,
      location: linkedInJob.location || null,
    };
  };

  const handleViewJob = (job: LinkedInJob) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job opportunity?')) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      
      const { error } = await supabase
        .from('linkedin_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Remove from local state
      setLinkedInJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job opportunity deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job opportunity');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleAddToApplications = async (linkedInJob: LinkedInJob) => {
    try {
      setAddingToApplications(linkedInJob.id);
      
      const applicationData = convertToJobApplication(linkedInJob);
      await addApplication(applicationData);
      
      toast.success(`Added "${linkedInJob.title}" to your job applications!`);
    } catch (error: any) {
      console.error('Error adding to applications:', error);
      toast.error('Failed to add to job applications');
    } finally {
      setAddingToApplications(null);
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleViewJob(job)}
                    leftIcon={<Eye className="w-4 h-4" />}
                    variant="outline"
                    size="sm"
                    className="flex-1 lg:flex-none"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleDeleteJob(job.id)}
                    isLoading={deletingJobId === job.id}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    variant="outline"
                    size="sm"
                    className="flex-1 lg:flex-none text-error-400 hover:text-error-300"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => handleAddToApplications(job)}
                    isLoading={addingToApplications === job.id}
                    leftIcon={<Plus className="w-4 h-4" />}
                    variant="primary"
                    size="sm"
                    className="flex-1 lg:flex-none"
                    glow
                  >
                    Applied
                  </Button>
                </div>
                
                {job.apply_url && (
                  <Button
                    onClick={() => window.open(job.apply_url, '_blank')}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    className="w-full"
                    glow
                  >
                    Apply on LinkedIn
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
                {/* Job Description Preview */}
                {job.description && (
                  <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Job Description Preview</span>
                    </h3>
                    <div className="bg-dark-800/30 rounded-lg p-4">
                      <p className="text-slate-300 leading-relaxed line-clamp-4">
                        {job.description}
                      </p>
                      <Button
                        onClick={() => handleViewJob(job)}
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-primary-400 hover:text-primary-300"
                      >
                        Read full description →
                      </Button>
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

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleAddToApplications(job)}
                    isLoading={addingToApplications === job.id}
                    className="w-full"
                    leftIcon={<Plus className="w-4 h-4" />}
                    glow
                  >
                    Add to Applications
                  </Button>
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Linkedin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-4">
          LinkedIn Job Opportunities
        </h1>
        <p className="text-muted text-lg">
          Discover the latest job opportunities sourced directly from LinkedIn
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-muted">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
        transition={{ delay: 0.2 }}
      >
        <Card variant="primary" elevation="raised">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search job opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="w-full"
                  variant="default"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                Filters
              </Button>
              {(searchTerm || locationFilter || employmentTypeFilter || seniorityFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
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
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-card-border/80"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-input border-border backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground"
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations.map(location => (
                      <option key={location} value={location} className="bg-background text-foreground">
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
                    className="w-full px-4 py-3 bg-input border-border backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground"
                  >
                    <option value="">All Types</option>
                    {filterOptions.employmentTypes.map(type => (
                      <option key={type} value={type} className="bg-background text-foreground">
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
                    className="w-full px-4 py-3 bg-input border-border backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground"
                  >
                    <option value="">All Levels</option>
                    {filterOptions.seniorities.map(seniority => (
                      <option key={seniority} value={seniority} className="bg-background text-foreground">
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
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6 shadow-md"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{linkedInJobs.length}</div>
            <div className="text-sm text-muted">Total Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">
              {filterOptions.locations.length}
            </div>
            <div className="text-sm text-muted">Locations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">
              {linkedInJobs.filter(job => job.recruiter_name).length}
            </div>
            <div className="text-sm text-muted">With Recruiters</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">
              {linkedInJobs.filter(job => job.description && job.description.length > 100).length}
            </div>
            <div className="text-sm text-muted">Detailed Posts</div>
          </div>
        </div>
      </motion.div>

      {/* View Job Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedJob ? `${selectedJob.title} at ${selectedJob.company_name}` : 'Job Details'}
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Job Header */}
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-600/30 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">{selectedJob.title}</h2>
                <p className="text-lg text-slate-300 font-medium mb-3">{selectedJob.company_name}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.location && (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedJob.location}</span>
                    </Badge>
                  )}
                  {selectedJob.employment_type && (
                    <Badge variant={getEmploymentTypeColor(selectedJob.employment_type)}>
                      {selectedJob.employment_type}
                    </Badge>
                  )}
                  {selectedJob.seniority && (
                    <Badge variant={getSeniorityColor(selectedJob.seniority)}>
                      {selectedJob.seniority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            {selectedJob.description && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  <span>Job Description</span>
                </h3>
                <div className="bg-dark-800/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>
              </div>
            )}

            {/* Recruiter Info */}
            {(selectedJob.recruiter_name || selectedJob.recruiter_profile) && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-warning-400" />
                  <span>Recruiter Information</span>
                </h3>
                <div className="bg-dark-800/30 rounded-lg p-4">
                  {selectedJob.recruiter_name && (
                    <p className="text-slate-300 mb-2">
                      <span className="text-slate-400">Name:</span> {selectedJob.recruiter_name}
                    </p>
                  )}
                  {selectedJob.recruiter_profile && (
                    <p className="text-slate-300">
                      <span className="text-slate-400">Profile:</span> {selectedJob.recruiter_profile}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700/50">
              <Button
                onClick={() => handleAddToApplications(selectedJob)}
                isLoading={addingToApplications === selectedJob.id}
                leftIcon={<Plus className="w-4 h-4" />}
                glow
              >
                Add to Applications
              </Button>
              {selectedJob.apply_url && (
                <Button
                  onClick={() => window.open(selectedJob.apply_url, '_blank')}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  variant="outline"
                >
                  Apply on LinkedIn
                </Button>
              )}
              {selectedJob.recruiter_profile_url && (
                <Button
                  onClick={() => window.open(selectedJob.recruiter_profile_url, '_blank')}
                  leftIcon={<Linkedin className="w-4 h-4" />}
                  variant="outline"
                >
                  Contact Recruiter
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}