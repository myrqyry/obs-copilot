import React from 'react';
import { AnimatedTitleLogos } from '@/components/common/AnimatedTitleLogos';
import useSettingsStore from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
    headerRef: React.RefObject<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = ({ headerRef }) => {
    const { theme } = useTheme();
    const accent = useSettingsStore(state => state.theme.accent);
    const secondaryAccent = useSettingsStore(state => state.theme.secondaryAccent);

    // Get accent colors from the current theme's accentColors, with robust fallbacks
    const accentColor = (theme?.accentColors?.[accent] && theme.accentColors[accent] !== '') ? 
                       theme.accentColors[accent] : 
                       (typeof theme?.colors.accent === 'string' ? theme.colors.accent : '#94e2d5');
    const secondaryAccentColor = (theme?.accentColors?.[secondaryAccent] && theme.accentColors[secondaryAccent] !== '') ? 
                                theme.accentColors[secondaryAccent] : 
                                (typeof theme?.colors.primary === 'string' ? theme.colors.primary : '#cba6f7');

    return (
        <header 
            ref={headerRef} 
            className="app-header sticky top-0 z-20 bg-background/90 backdrop-blur-md p-2 shadow-md border-b border-border/50 h-12 flex justify-center items-center relative overflow-hidden"
        >
            {/* Gradient accent border on bottom */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            
            {/* Subtle accent overlay driven by theme variables */}
            <div className="subtle-accent-overlay" />
            
            <AnimatedTitleLogos accentColor={accentColor} secondaryAccentColor={secondaryAccentColor} />
        </header>
    );
};
