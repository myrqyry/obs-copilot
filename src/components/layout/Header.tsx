import React from 'react';
import { AnimatedTitleLogos } from '@/components/common/AnimatedTitleLogos';
import useSettingsStore from '@/store/settingsStore';
import { catppuccinAccentColorsHexMap, catppuccinSecondaryAccentColorsHexMap } from '@/types';

interface HeaderProps {
    headerRef: React.RefObject<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = ({ headerRef }) => {
    const accent = useSettingsStore(state => state.accent);
    const secondaryAccent = useSettingsStore(state => state.secondaryAccent);

    const accentColor = catppuccinAccentColorsHexMap[accent];
    const secondaryAccentColor = catppuccinSecondaryAccentColorsHexMap[secondaryAccent];

    return (
        <header ref={headerRef} className="sticky top-0 z-20 bg-background p-2 shadow-md h-12 flex justify-center items-center">
            <AnimatedTitleLogos accentColor={accentColor} secondaryAccentColor={secondaryAccentColor} />
        </header>
    );
};
