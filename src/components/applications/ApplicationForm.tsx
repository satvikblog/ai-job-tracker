import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Database } from '../../lib/database.types';
import { useForm } from 'react-hook-form';
import { Building, MapPin, Calendar, DollarSign, Link, FileText, User, Phone, Mail, Linkedin } from 'lucide-react';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

interface ApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  application?: JobApplication;
}

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'followed-up', label: 'Followed Up' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'no-response', label: 'No Response' }
];

const sourceOptions = [
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Naukri', label: 'Naukri' },
  { value: 'Glassdoor', label: 'Glassdoor' },
  { value: 'Freshersworld', label: 'Freshersworld' },
  { value: 'Perfect Resume', label: 'Perfect Resume' },
  { value: 'Wellfound', label: 'Wellfound (AngelList)' },
  { value: 'Career Pages', label: 'Career Pages' },
  { value: 'On-Campus', label: 'On-Campus' },
  { value: 'Misc', label: 'Miscellaneous' }
];

export function ApplicationForm({ isOpen, onClose, onSubmit, application }: ApplicationFormProps) {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      company_name: application?.company_name || '',
      job_title: application?.job_title || '',
      job_link: application?.job_link || '',
      source_site: application?.source_site || '',
      applied_on: application?.applied_on || new Date().toISOString().split('T')[0],
      status: application?.status || 'applied',
      next_follow_up_date: application?.next_follow_up_date || '',
      notes: application?.notes || '',
      salary: application?.salary || '',
      location: application?.location || '',
      contact_name: '',
      contact_email: '',
      contact_linkedin: '',
      contact_phone: '',
      career_page_company: '',
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const watchedSource = watch('source_site');

  const handleFormSubmit = async (data: any) => {
    console.log('Form data being submitted:', data);
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={application ? '✏️ Edit Application' : '➕ Add New Application'}
      size="full"
      footer={
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 w-full">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            type="button"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(handleFormSubmit)}
            isLoading={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2"
            glow
          >
            {application ? 'Update' : 'Add'} Application
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gradient-to-r from-dark-800/50 to-dark-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Building className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('company_name')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="e.g., Ultra Violet Cyber, Google, Microsoft"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <User className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('job_title')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="e.g., SOC L1 Analyst, Software Engineer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        <div className="bg-gradient-to-r from-dark-800/50 to-dark-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Application Details</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Source Platform
              </label>
              <select
                {...register('source_site')}
                className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <option value="">Select source...</option>
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <option value="">Select status...</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Career Pages Special Field */}
          {watchedSource === 'Career Pages' && (
            <div className="mt-6 bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Link className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-medium text-primary-300">Career Page Details</span>
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Career Page
                </label>
                <input
                  {...register('career_page_company')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  placeholder="Which company's career page did you use?"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Applied On
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Calendar className="w-4 h-4" />
                  </span>
                </div>
                <input
                  type="date"
                  {...register('applied_on')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Next Follow-up Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Calendar className="w-4 h-4" />
                  </span>
                </div>
                <input
                  type="date"
                  {...register('next_follow_up_date')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Details Section */}
        <div className="bg-gradient-to-r from-dark-800/50 to-dark-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Job Details</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Salary Range
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('salary')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="e.g., ₹12,00,000 - ₹15,00,000 LPA"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <MapPin className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('location')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="e.g., Hyderabad, Bangalore, Remote"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Listing URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Link className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('job_link')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="https://www.linkedin.com/jobs/view/4243216600/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-gradient-to-r from-dark-800/50 to-dark-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Additional Notes</h3>
          </div>
          
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
              placeholder="Job Description&#10;Position: Security Analyst – L1&#10;&#10;Department: Security Operations Center&#10;&#10;Job Summary&#10;We are seeking a proactive and detail-oriented Level 1 SOC Analyst..."
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gradient-to-r from-dark-800/50 to-dark-900/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Contact Information</h3>
            <span className="text-sm text-slate-400">(Optional)</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contact Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <User className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('contact_name')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="HR Manager / Recruiter name"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contact Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Mail className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('contact_email')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                LinkedIn Profile
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Linkedin className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('contact_linkedin')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="linkedin.com/in/contact-name"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-slate-400 transition-colors duration-200">
                    <Phone className="w-4 h-4" />
                  </span>
                </div>
                <input
                  {...register('contact_phone')}
                  className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 pl-10"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Tips */}
        <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-primary-300 mb-3 flex items-center space-x-2">
            <span>💡</span>
            <span>Quick Tips:</span>
          </h4>
          <ul className="text-xs text-slate-300 space-y-1">
            <li className="flex items-start space-x-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>All fields are optional - enter any data you want</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>Add salary info to track compensation trends</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>Set follow-up dates to stay organized</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary-400 mt-0.5">•</span>
              <span>Include contact details for better networking</span>
            </li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}