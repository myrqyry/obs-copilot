import React from 'react';
import { useAudioStore } from '@/store/audioStore';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import MusicVisualizer from '@/components/common/MusicVisualizer';

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>;

const InlineMusicControls: React.FC = () => {
    const isMusicPlaying = useAudioStore(state => state.isMusicPlaying);
    const currentMusicPrompt = useAudioStore(state => state.currentMusicPrompt);
    const actions = useAudioStore(state => state.actions);

    if (!isMusicPlaying && !currentMusicPrompt) return null;

    return (
        <div className="flex items-center gap-2 my-2">
            <MusicVisualizer />
            <span className="text-xs text-muted-foreground font-semibold">
                {currentMusicPrompt ? `Now Playing: ${currentMusicPrompt}` : 'No music playing'}
            </span>
            <Button size="sm" onClick={actions.resumeMusic} aria-label="Resume"><PlayIcon /></Button>
            <Button size="sm" onClick={actions.pauseMusic} aria-label="Pause"><PauseIcon /></Button>
            <Button size="sm" variant="destructive" onClick={actions.stopMusic} aria-label="Stop"><StopIcon /></Button>
        </div>
    );
};

export default InlineMusicControls;
