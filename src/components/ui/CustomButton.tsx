import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { VariantProps } from 'class-variance-authority'; // Import VariantProps
import { buttonVariants } from './button.radix'; // Import Radix button variants and props

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
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
        
        // Only process emoji mapping for string children
        if (typeof children === 'string') {
            const cleanedChildren = children.replace(/ [🔽🔼️]$/, '');
            if (emojiMap[cleanedChildren]) {
                buttonContent = (
                    <>
                        <span role="img" aria-hidden="true" className="mr-1.5">
                            {emojiMap[cleanedChildren]}
                        </span>
                        {children}
                    </>
                );
            }
        }
        // For non-string children (like JSX elements), use them as-is
        else {
            buttonContent = children;
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <LoadingSpinner size={5} className="text-current" />
                ) : (
                    buttonContent
                )}
            </button>
        );
    }
);

CustomButton.displayName = 'CustomButton';

export { CustomButton };
