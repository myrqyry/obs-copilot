import React from 'react';
interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    variant?: 'default' | 'pulse' | 'dots' | 'bars' | 'ring' | 'chase' | 'cube' | 'wave' | 'ripple' | 'orbit' | 'heartbeat' | 'bounce';
    color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted' | 'white';
    text?: string;
    fullScreen?: boolean;
    speed?: 'slow' | 'normal' | 'fast';
}
export declare const LoadingSpinner: React.FC<LoadingSpinnerProps>;
export {};
