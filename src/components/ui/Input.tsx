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
    default: 'bg-input border-border shadow-sm',
    glass: 'bg-input/70 border-border/60 backdrop-blur-xl shadow-sm'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <span className="text-muted transition-colors duration-200">
              {leftIcon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${sizeStyles[size]} ${variantStyles[variant]} border rounded-lg
            focus:ring-2 focus:ring-primary/40 focus:border-primary
            text-foreground placeholder:text-muted/80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-error focus:ring-error/40 focus:border-error' : ''}
          `}
          className={cn(className)}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
            <span className="text-muted transition-colors duration-200">
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