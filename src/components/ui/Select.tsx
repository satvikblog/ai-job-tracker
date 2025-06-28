import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  variant?: 'default' | 'glass';
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const variantStyles = {
    default: 'bg-input border-border shadow-sm text-foreground',
    glass: 'bg-input/50 border-border/50 backdrop-blur-xl shadow-sm'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-4 py-3 ${variantStyles[variant]} border rounded-lg
          focus:ring-2 focus:ring-primary/40 focus:border-primary
          text-foreground placeholder:text-muted/80
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-error focus:ring-error/40 focus:border-error' : ''}
        `}
        className={cn(className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-background text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-error flex items-center space-x-1">
          <span className="text-error">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';