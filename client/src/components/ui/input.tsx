import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = 'md', error, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 text-xs px-2.5 rounded-md',
      md: 'h-10 text-sm px-3.5 rounded-lg',
      lg: 'h-12 text-base px-4 rounded-lg',
    };

    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full bg-surface text-primary placeholder:text-muted border transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle',
          sizeClasses[inputSize],
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
            : 'border-border focus:border-accent focus:ring-2 focus:ring-accent/30',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
