import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  glow = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm';
  
  const variants = {
    primary: `bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white focus:ring-primary-500 border border-primary-500/20 ${glow ? 'shadow-glow hover:shadow-glow-lg' : 'shadow-lg'}`,
    secondary: `bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white focus:ring-secondary-500 border border-secondary-500/20 ${glow ? 'shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'shadow-lg'}`,
    outline: 'border border-slate-600 hover:border-primary-500 bg-dark-800/50 hover:bg-dark-700/70 text-slate-300 hover:text-white focus:ring-primary-500 backdrop-blur-sm',
    ghost: 'hover:bg-dark-700/50 text-slate-300 hover:text-white focus:ring-primary-500',
    danger: `bg-gradient-to-r from-error-600 to-error-700 hover:from-error-700 hover:to-error-800 text-white focus:ring-error-500 border border-error-500/20 ${glow ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'shadow-lg'}`,
    success: `bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white focus:ring-success-500 border border-success-500/20 ${glow ? 'shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'shadow-lg'}`
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : leftIcon ? (
        <span className={`${iconSizes[size]} mr-2 transition-transform duration-200 group-hover:scale-110`}>{leftIcon}</span>
      ) : null}
      <span className="transition-all duration-200">{children}</span>
      {rightIcon && !isLoading && (
        <span className={`${iconSizes[size]} ml-2 transition-transform duration-200 group-hover:scale-110`}>{rightIcon}</span>
      )}
    </motion.button>
  );
}