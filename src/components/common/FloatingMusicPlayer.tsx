import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput'; // Assuming TextInput is available
import { Modal } from '../common/Modal';
import MusicVisualizer from './MusicVisualizer';

// Simple SVG Icons (replace with proper icon components if available)
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

import { AppState } from '../../store/appStore'; // Import AppState

const FloatingMusicPlayer: React.FC = () => {
    const isMusicPlaying = useAppStore((state: AppState) => state.isMusicPlaying);
    const currentMusicPrompt = useAppStore((state: AppState) => state.currentMusicPrompt);
    const pauseMusic = useAppStore((state: AppState) => state.actions.pauseMusic);
    const resumeMusic = useAppStore((state: AppState) => state.actions.resumeMusic);
    const stopMusic = useAppStore((state: AppState) => state.actions.stopMusic);
    const setMusicPrompt = useAppStore((state: AppState) => state.actions.setMusicPrompt); // New action
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPrompt, setNewPrompt] = useState(currentMusicPrompt || '');

    React.useEffect(() => {
        setNewPrompt(currentMusicPrompt || '');
    }, [currentMusicPrompt]);

    const handlePromptChange = () => {
        setMusicPrompt(newPrompt);
        // Optionally close modal or give feedback
    };

    if (!isMusicPlaying) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 10000,
            // Removed background, border, etc. from the main div as it's now just the visualizer container
            // The modal will handle its own styling
        }}>
            <MusicVisualizer onClick={() => setIsModalOpen(true)} />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Music Controls">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="text-ctp-text">Current Prompt: <span className="font-semibold">{currentMusicPrompt}</span></div>
                    <TextInput
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="Enter new prompt"
                        className="glass-input"
                    />
                    <Button onClick={handlePromptChange}>Update Prompt</Button>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <Button size="sm" onClick={pauseMusic} className="glass-button">
                            <PauseIcon />
                        </Button>
                        <Button size="sm" onClick={resumeMusic} className="glass-button">
                            <PlayIcon />
                        </Button>
                        <Button size="sm" variant="danger" onClick={stopMusic} className="glass-button">
                            <StopIcon />
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FloatingMusicPlayer;
