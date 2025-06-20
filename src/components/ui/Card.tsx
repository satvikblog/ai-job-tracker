import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient';
}

export function Card({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = {
    default: 'bg-dark-800/70 backdrop-blur-sm border border-slate-700/50',
    glass: 'bg-dark-800/30 backdrop-blur-xl border border-slate-600/30',
    gradient: 'bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm border border-slate-700/50'
  };

  const baseStyles = `${variantStyles[variant]} rounded-xl shadow-dark transition-all duration-300 ${paddingStyles[padding]}`;
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ 
          y: -4, 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)' 
        }}
        className={`${baseStyles} hover:border-primary-500/30 cursor-pointer ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${className}`}>
      {children}
    </div>
  );
}