import React, { useRef } from 'react';

interface MusicMiniControllerProps {
    audioUrl: string;
    isPlaying: boolean;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
}

const MusicMiniController: React.FC<MusicMiniControllerProps> = ({ isPlaying, onPause, onResume, onStop }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    // Removed WaveSurfer related code
    // const wavesurferRef = useRef<WaveSurfer | null>(null);
    // useEffect(() => { ... });
    // useEffect(() => { ... });

    return (
        <div className="fixed top-2 right-2 z-50 bg-white/90 border border-gray-300 rounded shadow flex items-center px-2 py-1 gap-2" style={{ minWidth: 180 }}>
            <div ref={waveformRef} style={{ width: 90, height: 32 }} />
            {isPlaying ? (
                <button onClick={onPause} title="Pause" className="text-lg">⏸</button>
            ) : (
                <button onClick={onResume} title="Play" className="text-lg">▶️</button>
            )}
            <button onClick={onStop} title="Stop" className="text-lg">⏹</button>
        </div>
    );
};

export default MusicMiniController;
