import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'outline' | 'warning';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    outline: 'border-border text-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
