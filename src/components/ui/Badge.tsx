import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-full border backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted/20 text-muted border-muted/50",
        primary: "bg-primary/20 text-primary border-primary/50",
        secondary: "bg-secondary/20 text-secondary border-secondary/50",
        success: "bg-success/20 text-success border-success/50",
        warning: "bg-warning/20 text-warning border-warning/50",
        error: "bg-error/20 text-error border-error/50",
        accent: "bg-accent/20 text-accent border-accent/50",
        applied: "bg-muted/20 text-muted border-muted/50",
        "followed-up": "bg-primary/20 text-primary border-primary/50",
        interview: "bg-secondary/20 text-secondary border-secondary/50",
        offer: "bg-success/20 text-success border-success/50",
        rejected: "bg-error/20 text-error border-error/50",
        "no-response": "bg-warning/20 text-warning border-warning/50",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm"
      },
      glow: {
        true: "shadow-glow-sm",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      glow: false
    }
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  className,
  variant,
  size,
  glow,
  children,
  ...props
}, ref) => {
  return (
    <span 
      className={cn(badgeVariants({ variant, size, glow, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';