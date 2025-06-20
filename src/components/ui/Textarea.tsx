import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass';
}

export function Textarea({
  label,
  error,
  variant = 'default',
  className = '',
  ...props
}: TextareaProps) {
  const variantStyles = {
    default: 'bg-dark-800/70 border-slate-600',
    glass: 'bg-dark-800/30 border-slate-600/50 backdrop-blur-xl'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 ${variantStyles[variant]} border rounded-lg
          focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
          text-slate-100 placeholder-slate-400
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-none
          ${error ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
          <span className="text-error-500">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}