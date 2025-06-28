import React, { useMemo, useState, useEffect } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RecentApplications } from '../components/dashboard/RecentApplications';
import { ApplicationChart } from '../components/dashboard/ApplicationChart';
import { StatusFlowChart } from '../components/dashboard/StatusFlowChart';
import { ResponseRateFlow } from '../components/dashboard/ResponseRateFlow';
import { Briefcase, Clock, CheckCircle, TrendingUp, Target, Calendar, Award, Search } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { stats, monthlyTrends, loading } = useDashboardData();
  const navigate = useNavigate();
  const [jobOpportunitiesCount, setJobOpportunitiesCount] = useState(0);

  // Fetch job opportunities count separately
  useEffect(() => {
    const fetchJobOpportunitiesCount = async () => {
      try {
        // Use the exact query: SELECT COUNT(*) FROM linkedin_jobs;
        const { count, error } = await supabase
          .from('linkedin_jobs')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setJobOpportunitiesCount(count || 0);
      } catch (error) {
        console.error('Error fetching job opportunities count:', error);
        setJobOpportunitiesCount(0);
      }
    };

    fetchJobOpportunitiesCount();
  }, []);

  const responseRate = useMemo(() => {
    if (!stats || stats.totalApplications === 0) return 0;
    const responded = stats.interviewCount + stats.offerCount + stats.rejectedCount;
    return Math.round((responded / stats.totalApplications) * 100);
  }, [stats]);

  const statusBreakdown = useMemo(() => {
    if (!stats) return {};
    return {
      'applied': stats.appliedCount,
      'followed-up': stats.followedUpCount,
      'interview': stats.interviewCount,
      'offer': stats.offerCount,
      'rejected': stats.rejectedCount,
      'no-response': stats.noResponseCount
    };
  }, [stats]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-application':
        navigate('/applications');
        // Small delay to ensure navigation completes, then trigger the add form
        setTimeout(() => {
          // Dispatch a custom event that the Applications page can listen to
          window.dispatchEvent(new CustomEvent('openApplicationForm'));
        }, 100);
        break;
      case 'schedule-followup':
        navigate('/follow-ups');
        // Trigger follow-up form
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openFollowUpForm'));
        }, 100);
        break;
      case 'view-analytics':
        // Stay on dashboard and scroll to charts
        const chartsSection = document.querySelector('[data-charts-section]');
        if (chartsSection) {
          chartsSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      default:
        break;
    }
  };
  if (loading) {
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
        className="flex items-center justify-between mb-2"
      >
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Welcome back! Here's your job search overview.</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-success-900/20 border border-success-600/30 rounded-lg">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-success-300 text-sm font-medium">System Online</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Applications"
          value={stats?.totalApplications || 0}
          icon={<Briefcase className="w-6 h-6" />}
          change={stats?.totalApplications ? "+12% from last month" : "Start applying!"}
          changeType="positive"
          delay={0.1}
          color="primary"
        />
        <StatsCard
          title="Job Opportunities"
          value={jobOpportunitiesCount}
          icon={<Search className="w-6 h-6" />}
          change={jobOpportunitiesCount > 0 ? "LinkedIn sourced" : "No opportunities"}
          changeType="neutral"
          delay={0.2}
          color="secondary"
        />
        <StatsCard
          title="Pending Follow-ups"
          value={stats?.pendingFollowups || 0}
          icon={<Clock className="w-6 h-6" />}
          change={stats?.pendingFollowups ? `${stats.pendingFollowups} due this week` : "No follow-ups"}
          changeType="neutral"
          delay={0.3}
          color="warning"
        />
        <StatsCard
          title="Offers Received"
          value={stats?.offerCount || 0}
          icon={<Award className="w-6 h-6" />}
          change={stats?.offerCount ? "+1 this month" : "Keep applying!"}
          changeType="positive"
          delay={0.4}
          color="success"
        />
        <StatsCard
          title="Response Rate"
          value={`${responseRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          change={responseRate > 0 ? "+5% improvement" : "Track responses"}
          changeType="positive"
          delay={0.5}
          color="accent"
        />
      </div>

      {/* Charts and Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-charts-section>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ApplicationChart data={monthlyTrends.map(trend => ({ month: trend.month, count: trend.applicationCount })) || []} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <StatusFlowChart statusData={statusBreakdown} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <ResponseRateFlow applications={stats?.recentApplications || []} />
        </motion.div>
      </div>
      
      {/* Recent Applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <RecentApplications applications={stats?.recentApplications || []} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xl p-6 shadow-md"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary" />
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction('add-application')}
            className="text-center p-4 bg-card/80 rounded-lg border border-card-border hover:border-primary/50 hover:bg-card-hover transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
          >
            <Briefcase className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
            <p className="text-sm font-medium text-foreground">Add Application</p>
            <p className="text-xs text-muted">Track a new job application</p>
          </button>
          <button
            onClick={() => handleQuickAction('schedule-followup')}
            className="text-center p-4 bg-card/80 rounded-lg border border-card-border hover:border-secondary/50 hover:bg-card-hover transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
          >
            <Clock className="w-8 h-8 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
            <p className="text-sm font-medium text-foreground">Schedule Follow-up</p>
            <p className="text-xs text-muted">Set reminder for follow-up</p>
          </button>
          <button
            onClick={() => handleQuickAction('view-analytics')}
            className="text-center p-4 bg-card/80 rounded-lg border border-card-border hover:border-accent/50 hover:bg-card-hover transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
          >
            <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
            <p className="text-sm font-medium text-foreground">View Analytics </p>
            <p className="text-xs text-muted">Analyze your progress</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
