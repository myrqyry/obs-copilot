import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary' | 'muted' | 'white';
    className?: string;
    text?: string;
    fullScreen?: boolean;
    speed?: 'slow' | 'normal' | 'fast';
}

const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
};

const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
    white: 'text-white'
};

const speedClasses = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    variant = 'primary',
    className,
    text,
    fullScreen = false,
    speed = 'normal'
}) => {
    const spinnerContent = (
        <div 
            className={cn(
                "flex flex-col items-center justify-center gap-3",
                fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
                className
            )}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <Loader2 
                className={cn(
                    sizeClasses[size],
                    variantClasses[variant],
                    speedClasses[speed]
                )}
                aria-hidden="true"
            />
            {text && (
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    {text}
                </p>
            )}
            <span className="sr-only">{text || 'Loading...'}</span>
        </div>
    );

    return spinnerContent;
};
