import React from 'react';
import { CatppuccinAccentColorName } from '../../types';
interface ModalAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
}
interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    isOpen?: boolean;
    accentColorName?: CatppuccinAccentColorName;
    actions?: ModalAction[];
    size?: 'sm' | 'md' | 'lg' | 'xl';
    blendMode?: React.CSSProperties['mixBlendMode'];
}
export declare const Modal: React.FC<ModalProps>;
export {};
