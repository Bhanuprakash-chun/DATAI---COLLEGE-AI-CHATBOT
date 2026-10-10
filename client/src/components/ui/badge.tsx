import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'saffron' | 'outline' | 'success' | 'warning' | 'danger' | 'ice' | 'lavender';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-mono font-medium rounded-md select-none transition-colors';

  const variants = {
    default: 'bg-surface-elevated text-secondary border border-border',
    saffron: 'bg-accent-subtle text-accent-text border border-accent-border font-semibold',
    outline: 'bg-transparent text-muted border border-border',
    success: 'bg-success-subtle text-success-text border border-success-border',
    warning: 'bg-warning-subtle text-warning-text border border-warning-border',
    danger: 'bg-danger-subtle text-danger-text border border-danger-border',
    ice: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    lavender: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  };

  const sizes = {
    sm: 'text-[11px] h-5 px-2 gap-1',
    md: 'text-xs h-6 px-2.5 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
