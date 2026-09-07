import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}: AlertProps) {
  const variants = {
    default: 'bg-muted/50 text-foreground border-border',
    destructive: 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  };

  const icons = {
    default: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex w-full gap-3 rounded-xl border p-4 text-sm leading-relaxed',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-sm opacity-90 leading-normal', className)}
      {...props}
    />
  );
}
