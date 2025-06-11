
import React from 'react';
import MorphingLogos from '../MorphingLogos';

export const AnimatedTitleLogos: React.FC = () => {

  return (
    <div className="flex flex-row items-center justify-center select-none gap-2 md:gap-2.5">
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          color: 'var(--dynamic-accent)'
        }}
      >
        <MorphingLogos />
      </div>
      <h1
        className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[var(--dynamic-accent)] via-ctp-mauve to-ctp-lavender bg-clip-text text-transparent"
      >
        obs-copilot gemini
      </h1>
    </div>
  );
};
