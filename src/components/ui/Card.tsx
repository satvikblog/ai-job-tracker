import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  elevation?: 'flat' | 'raised' | 'elevated';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false, 
  padding = 'md',
  elevation = 'flat'
}: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = {
    default: 'bg-card border-card-border',
    primary: 'bg-card border-primary/30',
    secondary: 'bg-card border-secondary/30',
    accent: 'bg-card border-accent/30'
  };

  const elevationStyles = {
    flat: 'shadow-sm',
    raised: 'shadow-md',
    elevated: 'shadow-lg'
  };

  const baseStyles = `${variantStyles[variant]} rounded-xl ${elevationStyles[elevation]} backdrop-blur-sm transition-all duration-300 ${paddingStyles[padding]}`;
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ 
          y: -4, 
          boxShadow: 'var(--shadow-hover)'
        }}
        className={`${baseStyles} hover:border-primary/30 cursor-pointer ${className}`}
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