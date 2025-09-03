import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { VariantProps } from 'class-variance-authority'; // Import VariantProps
import { buttonVariants } from './button.radix'; // Import Radix button variants and props

interface CustomButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    children: React.ReactNode;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
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
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? <LoadingSpinner size={5} className="text-current" /> : buttonContent}
            </motion.button>
        );
    }
);

CustomButton.displayName = 'CustomButton';

export { CustomButton };
