import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  variant?: 'default' | 'glass';
}

export function Select({
  label,
  error,
  options,
  variant = 'default',
  className = '',
  ...props
}: SelectProps) {
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
      <select
        className={`
          w-full px-4 py-3 ${variantStyles[variant]} border rounded-lg
          focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
          text-slate-100
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-error-500 focus:ring-error-500/30 focus:border-error-500' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-error-400 flex items-center space-x-1">
          <span className="text-error-500">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}