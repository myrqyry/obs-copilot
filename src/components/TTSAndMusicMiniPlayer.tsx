// src/components/TTSAndMusicMiniPlayer.tsx
import React, { useEffect, useRef } from 'react';

interface TTSAndMusicMiniPlayerProps {
    ttsUrl?: string | null;
    onClose: () => void;
}

const TTSAndMusicMiniPlayer: React.FC<TTSAndMusicMiniPlayerProps> = ({ ttsUrl, onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio && ttsUrl) {
            audio.src = ttsUrl;
            audio.play().catch(e => console.error("TTS playback failed", e));
        }
    }, [ttsUrl]);

    if (!ttsUrl) return null;

    return (
        <div className="fixed top-20 right-5 z-[9999] bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-xl p-2 flex items-center gap-2">
            <audio
                ref={audioRef}
                controls
                autoPlay
                onEnded={onClose}
                className="w-64 h-8"
            >
                Your browser does not support the audio element.
            </audio>
            <button onClick={onClose} title="Close" className="text-destructive hover:text-destructive/80 text-lg">
                &times;
            </button>
        </div>
    );
};

export default TTSAndMusicMiniPlayer;