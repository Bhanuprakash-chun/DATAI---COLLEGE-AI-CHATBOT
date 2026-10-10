import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Dialog({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth,
  size,
  className,
}: DialogProps) {
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  const effectiveSize = size || maxWidth || 'lg';

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in touch-manipulation"
        onClick={handleClose}
      />

      {/* Dialog Modal Card - 100% Solid Surface */}
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-hidden bg-surface border border-border rounded-2xl shadow-modal z-10 animate-scale-in flex flex-col',
          maxWidthClasses[effectiveSize],
          className
        )}
      >
        {/* Header Bar */}
        {(title || description) && (
          <div className="p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-border bg-surface shrink-0">
            <div>
              {title && <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{title}</h2>}
              {description && <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="text-text-muted hover:text-text-primary -mr-2 -mt-2 rounded-full min-h-[32px] min-w-[32px]"
              title="Close dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-surface text-text-primary">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="p-3.5 sm:p-4 px-5 sm:px-6 border-t border-border flex items-center justify-end gap-2.5 bg-surface-elevated/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 pb-4 flex flex-col space-y-1.5 border-b border-border bg-surface',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-base sm:text-lg font-bold text-text-primary tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-text-muted mt-1 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 px-5 sm:px-6 border-t border-border flex items-center justify-end gap-2.5 bg-surface-elevated/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
