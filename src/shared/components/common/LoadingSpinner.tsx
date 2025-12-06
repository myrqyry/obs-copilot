import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const spinnerVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'text-primary',
        destructive: 'text-destructive',
        accent: 'text-accent',
        secondary: 'text-secondary',
      },
      size: {
        small: 'h-4 w-4 border-2',
        medium: 'h-8 w-8 border-4',
        large: 'h-16 w-16 border-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
);

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
  text?: string;
  fullscreen?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, text, fullscreen = false, ...props }, ref) => {
    const spinner = (
      <div
        className={cn(
          'animate-spin rounded-full border-b-transparent',
          spinnerVariants({ variant, size, className })
        )}
        ref={ref}
        {...props}
      />
    );

    if (fullscreen) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          {spinner}
          {text && <p className="mt-4 text-lg text-foreground">{text}</p>}
        </div>
      );
    }

    if (text) {
        return (
            <div className='inline-flex items-center'>
                {spinner}
                <span className='ml-2'>{text}</span>
            </div>
        )
    }

    return spinner;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, spinnerVariants };
