import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion, safeGsapTo } from '../../lib/utils';
 
interface MusicVisualizerProps {
    onClick?: () => void;
}
 
const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ onClick }) => {
    // Default to Catppuccin Mauve and Teal for the gradient
    const gradientBackground = 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))';
    const pulseColor = 'hsl(var(--primary-foreground))';
 
    const innerCircleRef = useRef<HTMLDivElement>(null);
 
    useEffect(() => {
        if (prefersReducedMotion()) return;
        if (innerCircleRef.current) {
            // Refined pulse: slightly larger scale, subtle opacity shift, and smooth ease-in-out
            safeGsapTo(innerCircleRef.current, {
                scale: 1.12,
                opacity: 0.75,
                duration: 1.6,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
            });
        }

        return () => {
            if (innerCircleRef.current) {
                try {
                    gsap.killTweensOf(innerCircleRef.current);
                } catch (e) {}
            }
        };
    }, []);
 
    return (
        <div style={{
            width: '40px',
            height: '40px',
            background: gradientBackground,
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', // Added a subtle shadow
            border: '1px solid hsl(var(--border))', // Added a border for better definition
        }} onClick={onClick}>
            {/* Simple visualizer content */}
            <div
                ref={innerCircleRef}
                style={{
                    width: '18px',
                    height: '18px',
                    background: pulseColor,
                    borderRadius: '50%',
                    opacity: 0.95,
                    transformOrigin: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                }}
            />
        </div>
    );
};
 
export default MusicVisualizer;
