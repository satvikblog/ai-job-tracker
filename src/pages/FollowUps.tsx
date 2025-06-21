import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Clock, Plus, Calendar, Mail, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useFollowUps } from '../hooks/useFollowUps';
import { useJobApplications } from '../hooks/useJobApplications';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

const responseStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'no-reply', label: 'No Reply' }
];

export function FollowUps() {
  const { followUps, loading, error, addFollowUp } = useFollowUps();
  const { applications } = useJobApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Listen for dashboard quick action events
  useEffect(() => {
    const handleOpenForm = () => {
      setIsFormOpen(true);
    };

    window.addEventListener('openFollowUpForm', handleOpenForm);
    return () => {
      window.removeEventListener('openFollowUpForm', handleOpenForm);
    };
  }, []);
  const jobOptions = applications.map(app => ({
    value: app.id,
    label: `${app.company_name} - ${app.job_title}`
  }));

  // Get pending follow-ups from applications
  const pendingFollowUps = applications.filter(app => 
    app.next_follow_up_date && isAfter(new Date(app.next_follow_up_date), new Date())
  );

  const overdueFollowUps = applications.filter(app => 
    app.next_follow_up_date && isBefore(new Date(app.next_follow_up_date), new Date()) && !isToday(new Date(app.next_follow_up_date))
  );

  const todayFollowUps = applications.filter(app => 
    app.next_follow_up_date && isToday(new Date(app.next_follow_up_date))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'no-reply': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getCompanyName = (jobId: string) => {
    const job = applications.find(app => app.id === jobId);
    return job ? `${job.company_name} - ${job.job_title}` : 'Unknown Job';
  };

  const handleAddFollowUp = async (data: any) => {
    try {
      await addFollowUp({
        job_application_id: data.jobApplicationId,
        date: data.date,
        email_text: data.emailText,
        response_status: data.responseStatus,
        notes: data.notes,
      });
      reset();
      setIsFormOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your follow-ups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-error-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to Load Follow-ups</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Follow-Ups & Reminders
          </h1>
          <p className="text-gray-400 mt-1">
            Stay on top of your application follow-ups and track responses
          </p>
        </div>

        <Button 
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsFormOpen(true)}
        >
          Log Follow-Up
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card hover>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-error-600 dark:text-error-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {overdueFollowUps.length}
                </p>
                <p className="text-sm text-gray-400">
                  Overdue Follow-ups
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card hover>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {todayFollowUps.length}
                </p>
                <p className="text-sm text-gray-400">
                  Due Today
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card hover>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {pendingFollowUps.length}
                </p>
                <p className="text-sm text-gray-400">
                  Upcoming
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Follow-up History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Follow-up History
            </h2>
            <div className="relative">
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {followUps.map((followUp, index) => (
              <motion.div
                key={followUp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">
                      {getCompanyName(followUp.job_application_id)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(followUp.response_status)}>
                        {followUp.response_status.replace('-', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {format(new Date(followUp.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    {followUp.email_text}
                  </p>
                  {followUp.notes && (
                    <p className="text-xs text-gray-400">
                      Note: {followUp.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {followUps.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No follow-ups logged yet. Click "Log Follow-Up" to get started.
            </div>
          )}
        </Card>
      </motion.div>

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Follow-Up"
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleAddFollowUp)}>
              Log Follow-Up
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(handleAddFollowUp)} className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Application
            </label>
            <select
              {...register('jobApplicationId', { required: 'Please select a job application' })}
              className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <option value="">Select a job application...</option>
              {jobOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                  {option.label}
                </option>
              ))}
            </select>
            {errors.jobApplicationId && (
              <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                <span className="text-error-500">⚠️</span>
                <span>{errors.jobApplicationId.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Follow-up Date
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              />
              {errors.date && (
                <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                  <span className="text-error-500">⚠️</span>
                  <span>{errors.date.message}</span>
                </p>
              )}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Response Status
              </label>
              <select
                {...register('responseStatus', { required: 'Status is required' })}
                className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <option value="">Select status...</option>
                {responseStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.responseStatus && (
                <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                  <span className="text-error-500">⚠️</span>
                  <span>{errors.responseStatus.message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Content
            </label>
            <textarea
              rows={6}
              {...register('emailText', { required: 'Email content is required' })}
              className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
              placeholder="Enter the follow-up email content..."
            />
            {errors.emailText && (
              <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
                <span className="text-error-500">⚠️</span>
                <span>{errors.emailText.message}</span>
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
              placeholder="Additional notes about this follow-up..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}