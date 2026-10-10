import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-10 rounded-2xl bg-surface/50 border border-border border-dashed space-y-3 max-w-md mx-auto my-auto animate-fade-in',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-accent shadow-subtle">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-primary">{title}</h4>
        <p className="text-xs text-muted max-w-xs leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
