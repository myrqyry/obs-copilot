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
            "absolute opacity-25 blur-md rounded-full -top-1.5 -left-1.5 -right-1.5 -bottom-1.5 -z-10"
          )}
          // Use `backgroundImage` longhand to avoid mixing `background` shorthand with `backgroundClip`.
          // React warns when shorthand is updated while non-shorthand properties like `backgroundClip` exist.
          style={{
            backgroundImage: `radial-gradient(ellipse, ${accentColor} 0%, ${secondaryAccentColor} 100%)`
          }}
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
              var(--dynamic-accent, ${accentColor}) 0%,
              var(--dynamic-secondary-accent, ${secondaryAccentColor}) 30%,
              var(--dynamic-accent, ${accentColor}) 60%,
              transparent 85%)`,
            zIndex: -1
          }}
          aria-hidden="true"
        />
        {/* Foreground text with theme-aware gradient and fallback */}
        <span
          className={cn(
            "relative z-1 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]",
            "bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent"
          )}
          style={{
            // prefer longhand `backgroundImage` so React doesn't detect shorthand/non-shorthand collisions
            backgroundImage: accentColor && secondaryAccentColor ?
              `linear-gradient(135deg, var(--dynamic-accent, ${accentColor}) 0%, var(--dynamic-secondary-accent, ${secondaryAccentColor}) 50%, var(--dynamic-accent, ${accentColor}) 100%)` :
              undefined,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: accentColor && secondaryAccentColor ? 'transparent' : undefined
          }}
        >
          obs-copilot gemini
        </span>
      </h1>
    </div>
  );
};
