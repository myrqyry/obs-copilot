import React from 'react';
declare global {
    interface Window {
        __activeTooltip?: string | null;
        __activeTooltipHide?: (() => void) | null;
    }
}
interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    delay?: number;
}
/**
 * Theme-fitting Tooltip component for consistent tooltips across the app.
 * Usage:
 * <Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>
 */
declare const Tooltip: React.FC<TooltipProps>;
export default Tooltip;
