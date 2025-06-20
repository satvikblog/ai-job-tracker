import React, { useMemo } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RecentApplications } from '../components/dashboard/RecentApplications';
import { ApplicationChart } from '../components/dashboard/ApplicationChart';
import { StatusFlowChart } from '../components/dashboard/StatusFlowChart';
import { ResponseRateFlow } from '../components/dashboard/ResponseRateFlow';
import { Briefcase, Clock, CheckCircle, TrendingUp, Target, Calendar, Award } from 'lucide-react';
import { useJobApplications } from '../hooks/useJobApplications';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function Dashboard() {
  const { applications, loading: applicationsLoading } = useJobApplications();

  const statistics = useMemo(() => {
    if (applicationsLoading) return null;

    const statusBreakdown = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingFollowUps = applications.filter(app => 
      app.next_follow_up_date && new Date(app.next_follow_up_date) >= new Date()
    ).length;

    const offersReceived = statusBreakdown['offer'] || 0;

    // Calculate monthly applications for the last 3 months
    const monthlyApplications = [];
    for (let i = 2; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const count = applications.filter(app => {
        const appliedDate = new Date(app.applied_on);
        return appliedDate >= monthStart && appliedDate <= monthEnd;
      }).length;

      monthlyApplications.push({
        month: format(date, 'MMM'),
        count
      });
    }

    return {
      totalApplications: applications.length,
      statusBreakdown,
      followUpsPending: pendingFollowUps,
      offersReceived,
      monthlyApplications
    };
  }, [applications, applicationsLoading]);

  const responseRate = useMemo(() => {
    if (!applications.length) return 0;
    const responded = applications.filter(app => 
      ['interview', 'offer', 'rejected'].includes(app.status)
    ).length;
    return Math.round((responded / applications.length) * 100);
  }, [applications]);

  if (applicationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Welcome back! Here's your job search overview.</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-success-900/20 border border-success-600/30 rounded-lg">
          <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
          <span className="text-success-300 text-sm font-medium">System Online</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Applications"
          value={statistics?.totalApplications || 0}
          icon={<Briefcase className="w-6 h-6" />}
          change={applications.length > 0 ? "+12% from last month" : "Start applying!"}
          changeType="positive"
          delay={0.1}
          color="primary"
        />
        <StatsCard
          title="Pending Follow-ups"
          value={statistics?.followUpsPending || 0}
          icon={<Clock className="w-6 h-6" />}
          change={statistics?.followUpsPending ? `${statistics.followUpsPending} due this week` : "No follow-ups"}
          changeType="neutral"
          delay={0.2}
          color="warning"
        />
        <StatsCard
          title="Offers Received"
          value={statistics?.offersReceived || 0}
          icon={<Award className="w-6 h-6" />}
          change={statistics?.offersReceived ? "+1 this month" : "Keep applying!"}
          changeType="positive"
          delay={0.3}
          color="success"
        />
        <StatsCard
          title="Response Rate"
          value={`${responseRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          change={responseRate > 0 ? "+5% improvement" : "Track responses"}
          changeType="positive"
          delay={0.4}
          color="secondary"
        />
      </div>

      {/* Charts and Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ApplicationChart data={statistics?.monthlyApplications || []} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <StatusFlowChart statusData={statistics?.statusBreakdown || {}} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <ResponseRateFlow applications={applications} />
        </motion.div>
      </div>
      
      {/* Recent Applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <RecentApplications applications={applications.slice(0, 5)} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary-400" />
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer">
            <Briefcase className="w-8 h-8 text-primary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">Add Application</p>
            <p className="text-xs text-slate-400">Track a new job application</p>
          </div>
          <div className="text-center p-4 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-secondary-500/50 transition-all duration-300 cursor-pointer">
            <Clock className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">Schedule Follow-up</p>
            <p className="text-xs text-slate-400">Set reminder for follow-up</p>
          </div>
          <div className="text-center p-4 bg-dark-800/50 rounded-lg border border-slate-700/50 hover:border-accent-500/50 transition-all duration-300 cursor-pointer">
            <TrendingUp className="w-8 h-8 text-accent-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">View Analytics</p>
            <p className="text-xs text-slate-400">Analyze your progress</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}