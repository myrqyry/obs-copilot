import React from 'react';
import { HTMLMotionProps } from 'framer-motion';
import { CatppuccinAccentColorName } from '../../types';
interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'glass' | 'ghost' | 'outline' | 'gradient' | 'neon' | 'minimal' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    accentColorName?: CatppuccinAccentColorName;
    withAnimation?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loadingText?: string;
    fullWidth?: boolean;
    rounded?: boolean;
    glow?: boolean;
}
export declare const Button: React.FC<ButtonProps>;
export {};
