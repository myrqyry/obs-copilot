import React from 'react';
interface CollapsibleCardProps {
    isOpen: boolean;
    onToggle: () => void;
    title: string;
    emoji?: string;
    domain?: string;
    customSvg?: string;
    children: React.ReactNode;
    accentColor?: string;
    className?: string;
}
export declare const CollapsibleCard: React.FC<CollapsibleCardProps>;
export {};
