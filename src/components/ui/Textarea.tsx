import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  monospace?: boolean;
  variant?: 'default' | 'glass';
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  monospace = false,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const variantStyles = {
    default: 'bg-input border-border shadow-sm',
    glass: 'bg-input/70 border-border/60 backdrop-blur-xl shadow-sm'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          `w-full px-4 py-3 ${variantStyles[variant]} border rounded-lg
          ${monospace ? 'font-mono text-sm leading-relaxed' : ''}
          focus:ring-2 focus:ring-primary/40 focus:border-primary
          text-foreground placeholder:text-muted/80
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-none
          ${error ? 'border-error focus:ring-error/40 focus:border-error' : ''}`,
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-error flex items-center space-x-1">
          <span className="text-error">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';