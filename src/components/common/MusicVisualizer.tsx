import React from 'react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface MusicVisualizerProps {
    onClick?: () => void;
}

const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ onClick }) => {
    // Default to Catppuccin Mauve and Teal for the gradient
    const gradientBackground = 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))';
    const pulseColor = 'hsl(var(--primary-foreground))';

    const innerCircleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (innerCircleRef.current) {
            gsap.to(innerCircleRef.current, { scale: 1.1, duration: 2, repeat: -1, yoyo: true });
        }
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
                }}
            />
        </div>
    );
};

export default MusicVisualizer;
