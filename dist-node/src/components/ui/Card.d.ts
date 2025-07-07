import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient' | 'neon' | 'frosted' | 'minimal';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    hover?: boolean;
    accentColor?: string;
    withAnimation?: boolean;
    interactive?: boolean;
    glow?: boolean;
}
export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export declare const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
export declare const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
export declare const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export declare const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
export declare const CardBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}>;
export {};
