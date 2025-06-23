import React, { useState } from 'react';
import MusicMiniController from './MusicMiniController';

interface TTSAndMusicMiniPlayerProps {
    ttsUrl?: string | null;
    musicUrl?: string | null;
    onClose: () => void;
}

const TTSAndMusicMiniPlayer: React.FC<TTSAndMusicMiniPlayerProps> = ({ ttsUrl, musicUrl, onClose }) => {
    // Only one can play at a time
    const [isPlaying, setIsPlaying] = useState(true);
    const audioUrl = ttsUrl || musicUrl;
    if (!audioUrl) return null;
    return (
        <MusicMiniController
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            onPause={() => setIsPlaying(false)}
            onResume={() => setIsPlaying(true)}
            onStop={() => { setIsPlaying(false); onClose(); }}
        />
    );
};

export default TTSAndMusicMiniPlayer;
