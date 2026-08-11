import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-sm',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
        outline: 'border-border text-foreground',
        gold: 'border-gold/30 bg-gold-soft/60 text-foreground',
        success:
          'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100',
        info: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
