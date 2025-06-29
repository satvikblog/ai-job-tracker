import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const variantStyles = {
    default: 'bg-input border-border shadow-md text-foreground focus:border-primary focus:ring-primary/30',
    glass: 'bg-input/70 border-border/60 backdrop-blur-xl shadow-md focus:border-primary focus:ring-primary/30'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2.5 text-sm',
    md: 'px-4 py-3.5 text-base',
    lg: 'px-5 py-4.5 text-lg'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--foreground)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <span className="text-muted/80 transition-colors duration-200">
              {leftIcon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${sizeStyles[size]} ${variantStyles[variant]} border rounded-xl 
            focus:ring-2 focus:ring-primary/50 focus:border-primary
            placeholder:text-muted/80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300 shadow-lg
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${error ? 'border-error focus:ring-error/40 focus:border-error' : ''}
          `}
          style={{ color: 'var(--foreground)' }}
          className={cn(className)}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
            <span className="text-muted/80 transition-colors duration-200">
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-error flex items-center space-x-1">
          <span className="text-error">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';