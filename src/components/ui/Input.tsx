import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass';
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}: InputProps) {
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
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <span className="text-slate-400 transition-colors duration-200">
              {leftIcon}
            </span>
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 ${variantStyles[variant]} border rounded-lg
            focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            text-slate-100 placeholder-slate-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
            <span className="text-slate-400 transition-colors duration-200">
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
          <span className="text-error-500">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}