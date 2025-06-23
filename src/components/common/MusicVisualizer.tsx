import React from 'react';

interface MusicVisualizerProps {
    onClick?: () => void;
}

const MusicVisualizer: React.FC<MusicVisualizerProps> = ({ onClick }) => {
    return (
        <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(45deg, #007bff, #00d4ff)',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
        }} onClick={onClick}>
            {/* Simple visualizer content */}
            <div style={{
                width: '20px',
                height: '20px',
                background: '#fff',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
            }} />
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            transform: scale(1);
                        }
                        50% {
                            transform: scale(1.2);
                        }
                        100% {
                            transform: scale(1);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default MusicVisualizer;
