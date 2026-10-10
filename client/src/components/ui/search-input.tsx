import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  inputSize?: 'sm' | 'md';
  onClear?: () => void;
  shortcut?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, size, inputSize = 'md', value, onClear, shortcut, ...props }, ref) => {
    const effectiveSize = size || inputSize;
    const isSm = effectiveSize === 'sm';

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <Search
          className={cn(
            'absolute left-3 text-muted pointer-events-none',
            isSm ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4'
          )}
        />
        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full bg-surface text-primary placeholder:text-muted border border-border rounded-lg transition-all duration-150 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 shadow-subtle',
            isSm ? 'h-8 text-xs pl-8 pr-7' : 'h-10 text-sm pl-9 pr-8',
            shortcut && 'pr-12'
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 text-muted hover:text-primary p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcut && !value && (
          <kbd className="absolute right-2.5 font-mono text-[10px] text-muted bg-surface-elevated border border-border px-1.5 py-0.5 rounded pointer-events-none">
            {shortcut}
          </kbd>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
