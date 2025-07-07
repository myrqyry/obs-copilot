import React from 'react';
interface ColorChooserProps {
    label: string;
    colorsHexMap: Record<string, string>;
    selectedColorName: string;
    themeKey: string;
    colorNameTypeGuard: (name: string) => boolean;
    onChange: (color: string) => void;
}
export declare const ColorChooser: React.FC<ColorChooserProps>;
export {};
