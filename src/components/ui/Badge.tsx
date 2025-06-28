import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-full border backdrop-blur-sm transition-all duration-200 text-center",
  {
    variants: {
      variant: {
        default: "bg-muted/20 text-muted border-muted/50 font-semibold",
        primary: "bg-primary/20 text-primary border-primary/50 font-semibold",
        secondary: "bg-secondary/20 text-secondary border-secondary/50 font-semibold",
        success: "bg-success/20 text-success border-success/50 font-semibold",
        warning: "bg-warning/20 text-warning border-warning/50 font-semibold",
        error: "bg-error/20 text-error border-error/50 font-semibold",
        accent: "bg-accent/20 text-accent border-accent/50 font-semibold",
        applied: "bg-muted/20 text-muted border-muted/50 font-semibold",
        "followed-up": "bg-primary/20 text-primary border-primary/50 font-semibold",
        interview: "bg-secondary/20 text-secondary border-secondary/50 font-semibold",
        offer: "bg-success/20 text-success border-success/50 font-semibold",
        rejected: "bg-error/20 text-error border-error/50 font-semibold",
        "no-response": "bg-warning/20 text-warning border-warning/50 font-semibold",
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