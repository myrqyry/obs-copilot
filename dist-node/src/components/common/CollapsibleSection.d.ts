import React from 'react';
interface CollapsibleSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    title: string;
    emoji: string;
    accentColor: string;
    children: React.ReactNode;
}
export declare const CollapsibleSection: React.FC<CollapsibleSectionProps>;
export {};
