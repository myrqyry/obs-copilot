import React from 'react';
import MorphingLogos from '@/shared/components/ui/MorphingLogos';
import { cn } from '@/shared/lib/utils';

interface AnimatedTitleLogosProps {
  accentColor: string;
  secondaryAccentColor: string;
}

export const AnimatedTitleLogos: React.FC<AnimatedTitleLogosProps> = ({
  accentColor,
  secondaryAccentColor,
}) => {
  const glowStyle = {
    filter: `drop-shadow(0 0 10px rgba(var(--dynamic-accent-rgb, 148, 226, 213), 0.7)) drop-shadow(0 0 2px rgba(var(--dynamic-secondary-accent-rgb, 203, 166, 247), 0.5)) `,
  };

  return (
    <div className="flex flex-row items-center justify-center select-none gap-2 md:gap-2.5">
      <div className="flex items-center justify-center relative w-12 h-12">
        <MorphingLogos
          accentColor={accentColor}
          secondaryAccentColor={secondaryAccentColor}
          glowStyle={glowStyle}
        />
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative">
        {/* Foreground text with theme-aware gradient and matched glow */}
        <span
          className={cn(
            "relative z-1",
            "animated-title-gradient" // This class provides the animated gradient text
          )}
          style={{
            ...glowStyle,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          obs-copilot
        </span>
      </h1>
    </div>
  );
};
