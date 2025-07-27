// src/components/common/FloatingMusicPlayer.tsx
import React, { useState, useEffect } from 'react';
import { useAudioStore } from '../store/audioStore';
import { Button } from './ui/Button';
import { Modal } from './common/Modal';
import MusicVisualizer from './common/MusicVisualizer';
import { TextInput } from './common/TextInput';
import Tooltip from './ui/Tooltip';

// Simple SVG Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>;

const FloatingMusicPlayer: React.FC = () => {
    const {
        isMusicPlaying,
        currentMusicPrompt,
        audioContext,
        actions,
    } = useAudioStore((state) => ({
        isMusicPlaying: state.isMusicPlaying,
        currentMusicPrompt: state.currentMusicPrompt,
        audioContext: state.audioContext,
        actions: state.actions,
    }));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPrompt, setNewPrompt] = useState(currentMusicPrompt || '');

    useEffect(() => {
        setNewPrompt(currentMusicPrompt || '');
    }, [currentMusicPrompt]);

    const handleResume = () => {
        // This is crucial for browser autoplay policies.
        // The AudioContext must be resumed by a user interaction.
        if (audioContext && audioContext.state !== 'running') {
            actions.resumeMusic();
        }
    };

    const handleUpdatePrompt = () => {
        if (newPrompt.trim() && newPrompt !== currentMusicPrompt) {
            // Stop current generation before starting a new one
            actions.stopMusic();
            // Give a moment for cleanup before starting new generation
            setTimeout(() => {
                actions.startMusicGeneration(newPrompt, {
                    /* your default config here */
                    bpm: 120,
                    temperature: 1.0,
                    density: 0.7,
                    brightness: 0.5,
                    guidance: 4.0,
                    scale: "SCALE_UNSPECIFIED",
                    muteBass: false,
                    muteDrums: false,
                    onlyBassAndDrums: false,
                });
            }, 200);
        }
    };


    if (!isMusicPlaying && !currentMusicPrompt) return null;

    return (
        <div style={{ position: 'fixed', top: 'var(--header-height, 64px)', right: 24, zIndex: 10000, marginTop: '1rem' }}>
            <Tooltip content="Music Controls">
                <div onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                    <MusicVisualizer />
                </div>
            </Tooltip>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🎶 Music Generation Controls">
                <div className="flex flex-col gap-4">
                    <div className="text-sm">
                        <span className="font-semibold text-primary">Now Playing:</span> {currentMusicPrompt || '...'}
                    </div>
                    <TextInput
                        value={newPrompt}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPrompt(e.target.value)}
                        placeholder="Enter new prompt to change music..."
                    />
                    <Button onClick={handleUpdatePrompt} disabled={!newPrompt.trim() || newPrompt === currentMusicPrompt}>
                        Update Prompt
                    </Button>
                    <div className="flex gap-2 justify-center items-center border-t border-border pt-3 mt-2">
                        <Button size="sm" onClick={actions.pauseMusic} aria-label="Pause"><PauseIcon /></Button>
                        <Button size="sm" onClick={handleResume} aria-label="Resume"><PlayIcon /></Button>
                        <Button size="sm" variant="destructive" onClick={actions.stopMusic} aria-label="Stop"><StopIcon /></Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FloatingMusicPlayer;