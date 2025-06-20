import React from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  delay?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType, 
  delay = 0,
  color = 'primary'
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-success-400',
    negative: 'text-error-400',
    neutral: 'text-slate-400'
  };

  const iconColors = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    error: 'from-error-500 to-error-600'
  };

  const borderColors = {
    primary: 'border-primary-500/20',
    secondary: 'border-secondary-500/20',
    success: 'border-success-500/20',
    warning: 'border-warning-500/20',
    error: 'border-error-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card hover className={`h-full border ${borderColors[color]} bg-gradient-to-br from-dark-800/80 to-dark-900/80`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-100 mb-2">{value}</p>
            {change && (
              <p className={`text-sm flex items-center space-x-1 ${changeColors[changeType || 'neutral']}`}>
                {changeType === 'positive' && <span>↗️</span>}
                {changeType === 'negative' && <span>↘️</span>}
                {changeType === 'neutral' && <span>📊</span>}
                <span>{change}</span>
              </p>
            )}
          </div>
          <div className={`p-4 bg-gradient-to-br ${iconColors[color]} rounded-xl shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}