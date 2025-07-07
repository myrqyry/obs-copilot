import React from 'react';
import { CatppuccinAccentColorName } from '../../types';
interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    accentColorName?: CatppuccinAccentColorName;
    variant?: 'default' | 'glass' | 'outlined' | 'filled' | 'minimal';
    size?: 'sm' | 'md' | 'lg';
    withAnimation?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loading?: boolean;
    clearable?: boolean;
    onClear?: () => void;
    fullWidth?: boolean;
    rounded?: boolean;
}
export declare const TextInput: React.FC<TextInputProps>;
export {};
