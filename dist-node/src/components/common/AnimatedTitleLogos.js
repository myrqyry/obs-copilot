import React from 'react';
import MorphingLogos from '../MorphingLogos';
import { useAppStore } from '../../store/appStore';
import { catppuccinAccentColorsHexMap, catppuccinSecondaryAccentColorsHexMap } from '../../types';
export const AnimatedTitleLogos = () => {
    return (<div className="flex flex-row items-center justify-center select-none gap-2 md:gap-2.5 overflow-hidden" style={{
            '--dynamic-accent': useAppStore(state => catppuccinAccentColorsHexMap[state.userSettings.theme.accent]),
            '--dynamic-secondary-accent': useAppStore(state => catppuccinSecondaryAccentColorsHexMap[state.userSettings.theme.secondaryAccent]),
            padding: '12px' // Prevent cropping of glow effect
        }}>
      <div className="relative">
        {/* Glow effect positioned outside the logo container to avoid clipping */}
        <div className="absolute opacity-25 blur-md rounded-full" style={{
            top: '-6px',
            left: '-6px',
            right: '-6px',
            bottom: '-6px',
            background: `radial-gradient(circle, var(--dynamic-accent), var(--dynamic-secondary-accent))`,
            zIndex: -1
        }}/>
        <div className="flex items-center justify-center relative" style={{
            width: 48,
            height: 48,
        }}>
          <div style={{
            color: 'var(--dynamic-accent)' // Let MorphingLogos handle its own gradient
        }}>
            <MorphingLogos />
          </div>
        </div>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight relative">
        {/* Background glow effect - wider spread */}
        <span className="absolute opacity-25 blur-md" style={{
            inset: '0',
            background: `radial-gradient(ellipse 120% 80%, 
              var(--dynamic-accent) 0%, 
              var(--dynamic-secondary-accent) 30%, 
              var(--dynamic-accent) 60%, 
              transparent 85%)`,
            zIndex: -1
        }}>
        </span>
        {/* Main text with enhanced gradient incorporating more accent colors */}
        <span className="relative" style={{
            background: `linear-gradient(135deg, 
              var(--dynamic-accent) 0%, 
              var(--dynamic-secondary-accent) 15%, 
              var(--dynamic-accent) 30%, 
              var(--dynamic-secondary-accent) 45%, 
              var(--dynamic-accent) 60%, 
              var(--dynamic-secondary-accent) 75%, 
              var(--dynamic-accent) 90%, 
              var(--dynamic-secondary-accent) 100%)`,
            backgroundSize: '400% 400%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            animation: 'gradient-shift 12s ease-in-out infinite'
        }}>
          obs-copilot gemini
        </span>
      </h1>

      {/* Add the CSS animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 50% 50%;
          }
          50% {
            background-position: 51% 50%;
          }
        }
      `}</style>
    </div>);
};
