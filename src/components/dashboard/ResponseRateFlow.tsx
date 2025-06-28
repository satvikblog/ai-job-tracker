import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, Users, CheckCircle, XCircle, Clock, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ResponseRateFlowProps {
  applications: any[];
}

export function ResponseRateFlow({ applications }: ResponseRateFlowProps) {
  const { theme, colorScheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const totalApps = applications.length;
  const responded = applications.filter(app => 
    ['interview', 'offer', 'rejected'].includes(app.status)
  ).length;
  const positive = applications.filter(app => 
    ['interview', 'offer'].includes(app.status)
  ).length;
  const pending = applications.filter(app => 
    ['applied', 'followed-up', 'no-response'].includes(app.status)
  ).length;
  
  const responseRate = totalApps > 0 ? (responded / totalApps) * 100 : 0;
  const positiveRate = totalApps > 0 ? (positive / totalApps) * 100 : 0;
  
  // Get colors based on color scheme
  const getChartColors = () => {
    if (colorScheme === 'yellow') {
      return {
        total: isDarkMode ? '#94a3b8' : '#64748b',
        responses: isDarkMode ? '#facc15' : '#eab308',
        positive: isDarkMode ? '#4ade80' : '#22c55e',
        pending: isDarkMode ? '#a78bfa' : '#8b5cf6'
      };
    }
    
    if (colorScheme === 'purple') {
      return {
        total: isDarkMode ? '#94a3b8' : '#64748b',
        responses: isDarkMode ? '#a78bfa' : '#8b5cf6',
        positive: isDarkMode ? '#4ade80' : '#22c55e',
        pending: isDarkMode ? '#facc15' : '#eab308'
      };
    }
    
    if (colorScheme === 'green') {
      return {
        total: isDarkMode ? '#94a3b8' : '#64748b',
        responses: isDarkMode ? '#4ade80' : '#22c55e',
        positive: isDarkMode ? '#a78bfa' : '#8b5cf6',
        pending: isDarkMode ? '#facc15' : '#eab308'
      };
    }
    
    // Default blue theme
    return {
      total: isDarkMode ? '#94a3b8' : '#64748b',
      responses: isDarkMode ? '#60a5fa' : '#3b82f6',
      positive: isDarkMode ? '#4ade80' : '#22c55e',
      pending: isDarkMode ? '#facc15' : '#eab308'
    };
  };
  
  const chartColors = getChartColors();
  
  // Prepare data for chart
  const chartData = [
    {
      name: 'Total',
      value: totalApps,
      fill: chartColors.total
    },
    {
      name: 'Responses',
      value: responded,
      fill: chartColors.responses
    },
    {
      name: 'Positive',
      value: positive,
      fill: chartColors.positive
    },
    {
      name: 'Pending',
      value: pending,
      fill: chartColors.pending
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalApps > 0 ? (data.value / totalApps * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-card border border-card-border p-2 rounded-md shadow-md">
          <p className="text-sm font-medium text-foreground">{`${data.name}: ${data.value}`}</p>
          <p className="text-xs text-muted">{`${percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-card border-card-border" elevation="raised">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
          <BarChart className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Response Rate Flow
        </h2>
      </div>

      {totalApps > 0 ? (
        <div className="space-y-6">
          {/* Modern Bar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={true} 
                  vertical={false} 
                  stroke={isDarkMode ? 'rgba(203, 213, 225, 0.1)' : 'rgba(15, 23, 42, 0.1)'} 
                />
                <XAxis 
                  type="number" 
                  tick={{ fill: isDarkMode ? '#cbd5e1' : '#334155' }}
                  axisLine={{ stroke: isDarkMode ? 'rgba(203, 213, 225, 0.2)' : 'rgba(15, 23, 42, 0.2)' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: isDarkMode ? '#cbd5e1' : '#334155' }}
                  axisLine={{ stroke: isDarkMode ? 'rgba(203, 213, 225, 0.2)' : 'rgba(15, 23, 42, 0.2)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Flow Metrics */}
          <div className="pt-4 border-t border-border/80">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Response Rate</span>
                </div>
                <div className="text-2xl font-bold text-blue-500">
                  {responseRate.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {positiveRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted">No response data available</p>
            <p className="text-muted-foreground text-sm mt-1">Add applications to see flow</p>
          </div>
        </div>
      )}
    </Card>
  );
}