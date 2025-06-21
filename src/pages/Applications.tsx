import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ApplicationForm } from '../components/applications/ApplicationForm';
import { ApplicationTable } from '../components/applications/ApplicationTable';
import { KanbanBoard } from '../components/applications/KanbanBoard';
import { Plus, Table, Columns, Target, Briefcase } from 'lucide-react';
import { useJobApplications } from '../hooks/useJobApplications';
import { Database } from '../lib/database.types';
import { motion } from 'framer-motion';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];

export function Applications() {
  const { applications, loading, error, addApplication, updateApplication, deleteApplication } = useJobApplications();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | undefined>();
  const [view, setView] = useState<'table' | 'kanban'>('table');

  // Listen for dashboard quick action events
  useEffect(() => {
    const handleOpenForm = () => {
      setIsFormOpen(true);
    };

    window.addEventListener('openApplicationForm', handleOpenForm);
    return () => {
      window.removeEventListener('openApplicationForm', handleOpenForm);
    };
  }, []);
  const handleAddApplication = async (data: any) => {
    try {
      await addApplication(data);
      setIsFormOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditApplication = async (data: any) => {
    if (!editingApplication) return;

    try {
      await updateApplication(editingApplication.id, data);
      setEditingApplication(undefined);
      setIsFormOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      await deleteApplication(id);
    }
  };

  const openEditForm = (application: JobApplication) => {
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingApplication(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-error-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to Load Applications</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
            <Briefcase className="w-8 h-8 text-primary-500" />
            <span>Job Applications</span>
          </h1>
          <p className="text-slate-400 mt-2 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Manage and track your job applications</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-dark-800/70 border border-slate-600 rounded-xl p-1 backdrop-blur-sm">
            <Button
              variant={view === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
              leftIcon={<Table className="w-4 h-4" />}
              className="rounded-lg"
            >
              Table
            </Button>
            <Button
              variant={view === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
              leftIcon={<Columns className="w-4 h-4" />}
              className="rounded-lg"
            >
              Kanban
            </Button>
          </div>

          <Button
            onClick={() => setIsFormOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            glow
          >
            Add Application
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="bg-dark-800/50 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-slate-100">{applications.length}</div>
          <div className="text-sm text-slate-400">Total Applications</div>
        </div>
        <div className="bg-dark-800/50 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-primary-400">
            {applications.filter(app => app.status === 'interview').length}
          </div>
          <div className="text-sm text-slate-400">Interviews</div>
        </div>
        <div className="bg-dark-800/50 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-success-400">
            {applications.filter(app => app.status === 'offer').length}
          </div>
          <div className="text-sm text-slate-400">Offers</div>
        </div>
        <div className="bg-dark-800/50 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-warning-400">
            {applications.filter(app => app.status === 'followed-up').length}
          </div>
          <div className="text-sm text-slate-400">Follow-ups</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {view === 'table' ? (
          <ApplicationTable
            applications={applications}
            onEdit={openEditForm}
            onDelete={handleDeleteApplication}
          />
        ) : (
          <KanbanBoard
            applications={applications}
            onEdit={openEditForm}
          />
        )}
      </motion.div>

      <ApplicationForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingApplication ? handleEditApplication : handleAddApplication}
        application={editingApplication}
      />
    </div>
  );
}