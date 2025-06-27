import React from 'react';

interface MusicVisualizerProps {
    onClick?: () => void;
}

const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ onClick }) => {
    // Default to Catppuccin Mauve and Teal for the gradient
    const gradientBackground = 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))';
    const pulseColor = 'hsl(var(--primary-foreground))';

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
            <div style={{
                width: '18px', // Slightly smaller
                height: '18px', // Slightly smaller
                background: pulseColor,
                borderRadius: '50%',
                animation: 'pulse 2s infinite ease-in-out' // Added ease-in-out
            }} />
            {/* Keyframes are defined globally or in a shared CSS file if needed by other components,
                but for a self-contained component like this, inline style tag is acceptable.
                Alternatively, move to index.css if this animation is reused.
            */}
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(0.9);
                            opacity: 0.7;
                        }
                        50% {
                            transform: scale(1.1);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default MusicVisualizer;
