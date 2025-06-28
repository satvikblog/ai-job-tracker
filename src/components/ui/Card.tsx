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
  elevation = 'raised'
}: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = {
    default: 'bg-card/95 border-card-border backdrop-blur-md',
    primary: 'bg-card/95 border-primary/30 backdrop-blur-md',
    secondary: 'bg-card/95 border-secondary/30 backdrop-blur-md',
    accent: 'bg-card/95 border-accent/30 backdrop-blur-md'
  };

  const elevationStyles = {
    flat: 'shadow-sm',
    raised: 'shadow-md hover:shadow-lg transition-shadow duration-300',
    elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-300'
  };

  const baseStyles = `${variantStyles[variant]} rounded-xl ${elevationStyles[elevation]} transition-all duration-300 ${paddingStyles[padding]}`;
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ 
          y: -4, 
          boxShadow: 'var(--shadow-lg)',
          borderColor: 'var(--primary)'
        }}
        className={`${baseStyles} hover:border-primary/50 cursor-pointer text-foreground ${className}`}
        style={{ color: 'var(--foreground)' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} text-foreground ${className}`} style={{ color: 'var(--foreground)' }}>
      {children}
    </div>
  );
}