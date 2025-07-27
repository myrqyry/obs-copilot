import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading = false, children, ...props }, ref) => {
        const emojiMap: Record<string, string> = {
            "Connect": "🔗",
            "Disconnect": "🔌",
            "Start Streaming": "▶️",
            "Stop Streaming": "⏹️",
            "Start Recording": "🔴",
            "Stop Recording": "⏹️",
            "Refresh Data": "🔄",
            "Save Video Settings": "💾",
            "Send": "➡️",
            "Show": "👁️",
            "Hide": "🙈",
            "Show 🔽": "🔽",
            "Hide 🔼": "🔼",
            "Close": "🚪",
            "Reconnect": "🔄",
            "Copy URL": "📋",
            "Copy SVG Code": "📋",
            "Copy Emoji": "📋",
            "Paste": "📋",
            "Reset All Settings": "♻️",
            "Update Existing": "🛠",
            "Create Browser Source": "✨",
            "Preview": "🖥",
            "Switch": "↔️",
        };

        let buttonContent = children;
        if (typeof children === 'string') {
            const cleanedChildren = children.replace(/ [🔽🔼️]$/, '');
            if (emojiMap[cleanedChildren]) {
                buttonContent = <><span role="img" aria-hidden="true" className="mr-1.5">{emojiMap[cleanedChildren]}</span> {children}</>;
            }
        }

        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
                    // Variant styles
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
                        'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
                        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                        'underline-offset-4 hover:underline text-primary': variant === 'link',
                    },
                    // Size styles
                    {
                        'h-10 py-2 px-4': size === 'default',
                        'h-9 px-3 rounded-md': size === 'sm',
                        'h-11 px-8 rounded-md': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? <LoadingSpinner size={5} className="text-current" /> : buttonContent}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
