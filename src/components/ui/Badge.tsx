import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  glow?: boolean;
}

export function Badge({ children, variant = 'default', size = 'md', glow = false }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-600/50',
    primary: 'bg-primary-900/50 text-primary-300 border-primary-600/50',
    secondary: 'bg-secondary-900/50 text-secondary-300 border-secondary-600/50',
    success: 'bg-success-900/50 text-success-300 border-success-600/50',
    warning: 'bg-warning-900/50 text-warning-300 border-warning-600/50',
    error: 'bg-error-900/50 text-error-300 border-error-600/50'
  };

  const glowStyles = {
    default: '',
    primary: 'shadow-glow-sm',
    secondary: 'shadow-[0_0_10px_rgba(217,70,239,0.3)]',
    success: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    warning: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    error: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]'
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border backdrop-blur-sm
      transition-all duration-200
      ${variants[variant]} 
      ${sizes[size]}
      ${glow ? glowStyles[variant] : ''}
    `}>
      {children}
    </span>
  );
}