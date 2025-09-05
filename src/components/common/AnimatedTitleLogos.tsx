import React from 'react';
import MorphingLogos from '@/components/ui/MorphingLogos';
import { cn } from '@/lib/utils';

interface AnimatedTitleLogosProps {
  accentColor: string;
  secondaryAccentColor: string;
}

export const AnimatedTitleLogos: React.FC<AnimatedTitleLogosProps> = ({
  accentColor,
  secondaryAccentColor,
}) => {
  return (
    <div className="flex flex-row items-center justify-center select-none gap-2 md:gap-2.5">
      <div className="relative">
        <div
          className={cn(
            "absolute opacity-25 blur-md rounded-full -top-1.5 -left-1.5 -right-1.5 -bottom-1.5 -z-10 dynamic-accent-gradient"
          )}
        />
        <div
          className="flex items-center justify-center relative"
          style={{
            width: 48,
            height: 48,
          }}
        >
          <MorphingLogos accentColor={accentColor} secondaryAccentColor={secondaryAccentColor} />
        </div>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative">
        {/* Glow backdrop behind the text */}
        <span
          className={cn(
            "pointer-events-none absolute opacity-25 blur-md -inset-1.5"
          )}
          style={{
            background: `radial-gradient(ellipse 120% 80%,
              ${accentColor} 0%,
              ${secondaryAccentColor} 30%,
              ${accentColor} 60%,
              transparent 85%)`,
            zIndex: -1
          }}
          aria-hidden="true"
        />
        {/* Foreground text above glow */}
        <span
          className="relative animated-title-gradient z-1 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]"
        >
          obs-copilot gemini
        </span>
      </h1>
    </div>
  );
};
