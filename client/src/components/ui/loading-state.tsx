import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-elevated/80 border border-border/50', className)}
      {...props}
    />
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-5 rounded-xl bg-surface border border-border space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}
