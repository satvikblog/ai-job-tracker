import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-full border backdrop-blur-sm transition-all duration-200 text-center tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-muted/15 text-muted border-muted/40 font-semibold",
        primary: "bg-primary/15 text-primary border-primary/40 font-semibold",
        secondary: "bg-secondary/15 text-secondary border-secondary/40 font-semibold",
        success: "bg-success/15 text-success border-success/40 font-semibold",
        warning: "bg-warning/15 text-warning border-warning/40 font-semibold",
        error: "bg-error/15 text-error border-error/40 font-semibold",
        accent: "bg-accent/15 text-accent border-accent/40 font-semibold",
        applied: "bg-muted/15 text-muted border-muted/40 font-semibold",
        "followed-up": "bg-primary/15 text-primary border-primary/40 font-semibold",
        interview: "bg-secondary/15 text-secondary border-secondary/40 font-semibold",
        offer: "bg-success/15 text-success border-success/40 font-semibold",
        rejected: "bg-error/15 text-error border-error/40 font-semibold",
        "no-response": "bg-warning/15 text-warning border-warning/40 font-semibold",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-sm"
      },
      glow: {
        true: "shadow-glow-sm transition-shadow duration-300",
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