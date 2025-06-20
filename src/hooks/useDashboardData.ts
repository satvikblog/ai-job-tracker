import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalApplications: number;
  appliedCount: number;
  followedUpCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  noResponseCount: number;
  pendingFollowups: number;
  avgResponseTimeDays: number;
  recentApplications: any[];
}

interface MonthlyTrend {
  month: string;
  applicationCount: number;
  positiveResponses: number;
  uniqueCompanies: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use optimized function for dashboard data
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_user_dashboard_data', { p_user_id: user.id });

      if (dashboardError) {
        console.warn('Optimized dashboard function not available, falling back to regular queries');
        await fetchDashboardDataFallback(user.id);
        return;
      }

      if (dashboardData && dashboardData.length > 0) {
        const data = dashboardData[0];
        setStats({
          totalApplications: Number(data.total_applications) || 0,
          appliedCount: Number(data.applied_count) || 0,
          followedUpCount: Number(data.followed_up_count) || 0,
          interviewCount: Number(data.interview_count) || 0,
          offerCount: Number(data.offer_count) || 0,
          rejectedCount: Number(data.rejected_count) || 0,
          noResponseCount: Number(data.no_response_count) || 0,
          pendingFollowups: Number(data.pending_followups) || 0,
          avgResponseTimeDays: Number(data.avg_response_time_days) || 0,
          recentApplications: data.recent_applications || []
        });
      }

      // Fetch monthly trends
      const { data: trendsData, error: trendsError } = await supabase
        .from('monthly_application_trends')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: true })
        .limit(12);

      if (!trendsError && trendsData) {
        setMonthlyTrends(trendsData.map(trend => ({
          month: new Date(trend.month).toLocaleDateString('en-US', { month: 'short' }),
          applicationCount: trend.application_count,
          positiveResponses: trend.positive_responses,
          uniqueCompanies: trend.unique_companies
        })));
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardDataFallback = async (userId: string) => {
    // Fallback to regular queries if optimized function is not available
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('id, status, applied_on, created_at, updated_at, company_name, job_title, location, salary, next_follow_up_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendingFollowups = applications.filter(app => 
      app.next_follow_up_date && new Date(app.next_follow_up_date) >= new Date()
    ).length;

    setStats({
      totalApplications: applications.length,
      appliedCount: statusCounts['applied'] || 0,
      followedUpCount: statusCounts['followed-up'] || 0,
      interviewCount: statusCounts['interview'] || 0,
      offerCount: statusCounts['offer'] || 0,
      rejectedCount: statusCounts['rejected'] || 0,
      noResponseCount: statusCounts['no-response'] || 0,
      pendingFollowups,
      avgResponseTimeDays: 0, // Calculate if needed
      recentApplications: applications.slice(0, 5)
    });
  };

  const refreshStats = async () => {
    // Refresh materialized views
    try {
      await supabase.rpc('refresh_dashboard_stats');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing stats:', error);
      await fetchDashboardData(); // Fallback to regular refresh
    }
  };

  return {
    stats,
    monthlyTrends,
    loading,
    refreshStats,
    refetch: fetchDashboardData
  };
}