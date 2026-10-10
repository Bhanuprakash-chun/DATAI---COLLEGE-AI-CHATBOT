import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'primary-pill' | 'outline-pill';
  size?: 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      // Primary Action (Saffron Accent #F4B942 with dark text)
      primary:
        'bg-accent text-brand-black hover:bg-accent-hover font-semibold shadow-subtle rounded-lg',
      'primary-pill':
        'bg-accent text-brand-black hover:bg-accent-hover font-semibold shadow-subtle rounded-full',

      // Accent Subtle (Soft Saffron tint for secondary highlights)
      accent:
        'bg-accent-subtle text-accent-text border border-accent-border hover:bg-accent/20 rounded-lg',

      // Secondary (Surface background with border)
      secondary:
        'bg-surface hover:bg-surface-hover text-primary border border-border rounded-lg shadow-subtle',

      // Outline (Transparent with strong border)
      outline:
        'bg-transparent hover:bg-surface-hover text-secondary hover:text-primary border border-border-strong rounded-lg',
      'outline-pill':
        'bg-surface/80 hover:bg-surface text-secondary hover:text-primary border border-border-strong rounded-full shadow-subtle',

      // Ghost (Transparent with hover background)
      ghost:
        'bg-transparent hover:bg-surface-hover text-secondary hover:text-primary rounded-lg',

      // Danger (Semantic red)
      danger:
        'bg-danger-subtle text-danger hover:bg-danger/20 border border-danger-border rounded-lg',
    };

    const sizes = {
      sm: 'h-8 text-xs px-3 gap-1.5',
      md: 'h-10 text-sm px-4 gap-2',
      lg: 'h-12 text-base px-6 gap-2.5',
      'icon-sm': 'h-8 w-8 p-0',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
