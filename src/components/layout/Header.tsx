import React from 'react';
import { AnimatedTitleLogos } from '../common/AnimatedTitleLogos';

interface HeaderProps {
    headerRef: React.RefObject<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = ({ headerRef }) => {
    return (
        <header ref={headerRef} className="sticky top-0 z-20 bg-background p-2 shadow-md h-12 flex justify-center items-center">
            <AnimatedTitleLogos />
        </header>
    );
};
