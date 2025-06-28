import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-primary-hover text-primary-foreground border border-primary/20 shadow-md font-semibold tracking-wide !text-primary-foreground",
        secondary: "bg-secondary hover:bg-secondary-hover text-secondary-foreground border border-secondary/20 shadow-md font-semibold tracking-wide !text-secondary-foreground",
        outline: "border border-border hover:border-primary hover:bg-card-hover text-foreground hover:text-primary font-medium transition-colors !text-foreground hover:!text-primary shadow-sm",
        ghost: "hover:bg-card-hover text-foreground hover:text-primary font-medium transition-colors !text-foreground hover:!text-primary",
        danger: "bg-error hover:bg-error-hover text-error-foreground border border-error/20 shadow-md font-semibold tracking-wide !text-error-foreground",
        success: "bg-success hover:bg-success-hover text-success-foreground border border-success/20 shadow-md font-semibold tracking-wide !text-success-foreground",
        accent: "bg-accent hover:bg-accent-hover text-accent-foreground border border-accent/20 shadow-md font-semibold tracking-wide !text-accent-foreground",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
      },
      glow: {
        true: "shadow-glow hover:shadow-glow-lg transition-all duration-300",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      glow: false,
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
  glow,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const sizeValue = size || 'md';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(buttonVariants({ variant, size, glow, className }))}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : leftIcon ? (
        <span className={`${iconSizes[sizeValue]} mr-2 transition-transform duration-200 group-hover:scale-110`}>{leftIcon}</span>
      ) : null}
      <span className="transition-all duration-200">{children}</span>
      {rightIcon && !isLoading && (
        <span className={`${iconSizes[sizeValue]} ml-2 transition-transform duration-200 group-hover:scale-110`}>{rightIcon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';