import React from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const changeColors = {
    positive: 'text-success',
    negative: 'text-error',
    neutral: 'text-muted'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card 
        hover 
        variant={color as any} 
        className="h-full"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
            {change && (
              <p className={`text-sm flex items-center space-x-1 ${changeColors[changeType || 'neutral']}`}>
                {changeType === 'positive' && <span>↗️</span>}
                {changeType === 'negative' && <span>↘️</span>}
                {changeType === 'neutral' && <span>📊</span>}
                <span>{change}</span>
              </p>
            )}
          </div>
          <div className={`p-4 bg-gradient-to-br from-${color} to-${color}-accent rounded-xl shadow-md`}>
            <div className={`text-${color}-foreground`}>
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}