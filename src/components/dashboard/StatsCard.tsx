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
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'error';
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
  const { theme, colorScheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const changeColors = {
    positive: 'text-green-500 dark:text-green-400',
    negative: 'text-red-500 dark:text-red-400',
    neutral: 'text-muted'
  };

  // Get color based on theme and colorScheme
  const getColorClass = () => {
    if (colorScheme === 'yellow') {
      return {
        primary: 'from-yellow-400 to-yellow-500',
        secondary: 'from-purple-500 to-purple-600',
        accent: 'from-green-500 to-green-600',
        warning: 'from-yellow-500 to-yellow-600',
        success: 'from-green-500 to-green-600',
        error: 'from-red-500 to-red-600'
      }[color];
    }
    
    if (colorScheme === 'blue') {
      return {
        primary: 'from-blue-500 to-blue-600',
        secondary: 'from-purple-500 to-purple-600',
        accent: 'from-green-500 to-green-600',
        warning: 'from-yellow-500 to-yellow-600',
        success: 'from-green-500 to-green-600',
        error: 'from-red-500 to-red-600'
      }[color];
    }
    
    if (colorScheme === 'purple') {
      return {
        primary: 'from-purple-500 to-purple-600',
        secondary: 'from-yellow-500 to-yellow-600',
        accent: 'from-green-500 to-green-600',
        warning: 'from-yellow-500 to-yellow-600',
        success: 'from-green-500 to-green-600',
        error: 'from-red-500 to-red-600'
      }[color];
    }
    
    if (colorScheme === 'green') {
      return {
        primary: 'from-green-500 to-green-600',
        secondary: 'from-purple-500 to-purple-600',
        accent: 'from-yellow-500 to-yellow-600',
        warning: 'from-yellow-500 to-yellow-600',
        success: 'from-green-500 to-green-600',
        error: 'from-red-500 to-red-600'
      }[color];
    }
    
    // Default fallback
    return {
      primary: 'from-blue-500 to-blue-600',
      secondary: 'from-purple-500 to-purple-600',
      accent: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-yellow-600',
      success: 'from-green-500 to-green-600',
      error: 'from-red-500 to-red-600'
    }[color];
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
        className="h-full border-opacity-40"
        elevation="raised"
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
          <div className={`p-4 bg-gradient-to-br ${getColorClass()} rounded-xl shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}