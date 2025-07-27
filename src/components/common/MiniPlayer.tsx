import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../store/audioStore';
import gsap from 'gsap';
import AudioReactiveNote from './AudioReactiveNote';

export const MiniPlayerIcons = {
    Play: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    ),
    Pause: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
    ),
    Stop: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>
    ),
    Minimize: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" /></svg>
    ),
};

const MiniPlayer = () => {
    const isPlayerVisible = useAudioStore(state => state.isPlayerVisible);
    const activeAudioSource = useAudioStore(state => state.activeAudioSource);
    const currentMusicPrompt = useAudioStore(state => state.currentMusicPrompt);
    const setMusicPrompt = useAudioStore(state => state.actions.setMusicPrompt);
    const setActiveAudioSource = useAudioStore(state => state.actions.setActiveAudioSource);
    const actions = useAudioStore(state => state.actions);
    const [minimized, setMinimized] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
const noteRef = useRef<HTMLDivElement>(null);
    const minimizedNoteRef = useRef<HTMLButtonElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [attention, setAttention] = useState(false);
    const attentionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Attention animation and auto-collapse when music starts
    useEffect(() => {
        if (activeAudioSource?.type === 'music' && isPlayerVisible && !minimized) {
            setAttention(true);
            if (attentionTimeoutRef.current) clearTimeout(attentionTimeoutRef.current);
            attentionTimeoutRef.current = setTimeout(() => {
                setAttention(false);
                setMinimized(true);
            }, 1800); // 1.8s: glow, then minimize
        }
        // Clean up on unmount
        return () => {
            if (attentionTimeoutRef.current) clearTimeout(attentionTimeoutRef.current);
        };
    }, [activeAudioSource?.type, isPlayerVisible]);

    if (!isPlayerVisible || !activeAudioSource) {
        return null;
    }

    const handleExpand = () => {
        if (!noteRef.current || !minimizedNoteRef.current) {
            setMinimized(false);
            return;
        }
        setIsAnimating(true);
        const noteRect = noteRef.current.getBoundingClientRect();
        const minRect = minimizedNoteRef.current.getBoundingClientRect();
        // Clone the minimized icon
        const minButton = minimizedNoteRef.current;
        const svg = minButton.querySelector('svg');
        if (!svg) {
            setMinimized(false);
            setIsAnimating(false);
            return;
        }
        const clone = svg.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.left = `${minRect.left}px`;
        clone.style.top = `${minRect.top}px`;
        clone.style.width = `${minRect.width}px`;
        clone.style.height = `${minRect.height}px`;
        clone.style.zIndex = '2000';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        // Hide the real note until animation is done
        noteRef.current.style.visibility = 'hidden';
        // Animate to the note position
        const dx = noteRect.left - minRect.left;
        const dy = noteRect.top - minRect.top;
        const scale = noteRect.width / minRect.width;
        gsap.to(clone, {
            x: dx,
            y: dy,
            scale,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
                document.body.removeChild(clone);
                setIsAnimating(false);
                setMinimized(false);
                setTimeout(() => {
                    if (noteRef.current) noteRef.current.style.visibility = '';
                }, 100);
            }
        });
    };

    if (minimized) {
        return (
            <>
                {/* Minimized icon always rendered, toggled by visibility */}
                <div className="fixed top-2 right-2 z-[1000]" style={minimized ? { visibility: 'visible', pointerEvents: 'auto' } : { visibility: 'hidden', pointerEvents: 'none', position: 'absolute' }}>
                    <button
                        ref={minimizedNoteRef}
                        aria-label="Show music player"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-ctp-mauve/80 border border-ctp-mauve/40 shadow hover:bg-ctp-mauve/90 transition-all p-0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve focus:ring-offset-1 focus:ring-offset-ctp-base"
                        onClick={handleExpand}
                        style={{ minWidth: 0, minHeight: 0 }}
                    >
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                        </svg>
                    </button>
                </div>
            </>
        );
    }

    // Use actions.stopMusic for the Stop button, since hidePlayer is not in the actions type
    const handleMinimize = () => {
        if (!noteRef.current || !minimizedNoteRef.current) {
            setMinimized(true);
            return;
        }
        setIsAnimating(true);
        const noteRect = noteRef.current.getBoundingClientRect();
        const minRect = minimizedNoteRef.current.getBoundingClientRect();
        const clone = noteRef.current.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.left = `${noteRect.left}px`;
        clone.style.top = `${noteRect.top}px`;
        clone.style.width = `${noteRect.width}px`;
        clone.style.height = `${noteRect.height}px`;
        clone.style.zIndex = '2000';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        noteRef.current.style.visibility = 'hidden';
        const dx = minRect.left - noteRect.left;
        const dy = minRect.top - noteRect.top;
        const scale = minRect.width / noteRect.width;
        gsap.to(clone, {
            x: dx,
            y: dy,
            scale,
            opacity: 0.7,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
                document.body.removeChild(clone);
                setIsAnimating(false);
                setMinimized(true);
                setTimeout(() => {
                    if (noteRef.current) noteRef.current.style.visibility = '';
                }, 100);
            }
        });
    };

    return (
        <>
            {/* Expanded player always rendered, toggled by visibility */}
            <div
                className={`fixed top-2 right-2 z-[1000] bg-ctp-base/80 border border-ctp-mauve/30 shadow rounded-lg flex items-center gap-2 px-2 py-0.5 min-w-[90px] max-w-xs group${attention ? ' animate-glow' : ''}`}
                style={minimized ? { visibility: 'hidden', pointerEvents: 'none', position: 'absolute', backdropFilter: 'blur(6px)', height: '28px' } : { visibility: 'visible', pointerEvents: 'auto', backdropFilter: 'blur(6px)', height: '28px' }}
            >
                <div ref={noteRef} className="w-5 h-5 flex items-center justify-center rounded-full bg-ctp-mauve/20">
                    <AudioReactiveNote size={18} hidden={isAnimating} />
                </div>
                {activeAudioSource.type === 'music' ? (
                    editing ? (
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                setMusicPrompt(editValue);
                                setActiveAudioSource({ ...activeAudioSource, prompt: editValue });
                                setEditing(false);
                            }}
                            className="flex items-center gap-1"
                        >
                            <input
                                ref={inputRef}
                                className="text-[10px] px-1 py-0.5 rounded bg-ctp-surface1 border border-ctp-mauve/40 text-ctp-text w-[70px] focus:outline-none focus:ring-1 focus:ring-ctp-mauve"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() => setEditing(false)}
                                autoFocus
                            />
                            <button type="submit" className="text-ctp-mauve hover:text-ctp-green text-xs px-1 focus:outline-none focus:ring-1 focus:ring-ctp-green rounded">✔</button>
                        </form>
                    ) : (
                        <div className="relative flex items-center group/music-prompt">
                            <div
                                className="overflow-hidden whitespace-nowrap max-w-[60px]"
                                style={{ position: 'relative' }}
                            >
                                <span
                                    className="inline-block"
                                    style={{
                                        animation: currentMusicPrompt && currentMusicPrompt.length > 18 ? 'marquee 14s linear infinite' : undefined,
                                        minWidth: '100%',
                                    }}
                                >
                                    {currentMusicPrompt}
                                </span>
                            </div>
                            <button
                                className="ml-1 opacity-0 group-hover/music-prompt:opacity-100 group-hover:opacity-100 transition-opacity text-ctp-mauve hover:text-ctp-green text-xs px-1 focus:outline-none focus:ring-1 focus:ring-ctp-green rounded"
                                style={{ position: 'absolute', right: -18, top: 0 }}
                                title="Edit prompt"
                                onClick={() => {
                                    setEditValue(currentMusicPrompt);
                                    setEditing(true);
                                    setTimeout(() => inputRef.current?.focus(), 10);
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 3.3a1 1 0 0 1 1.4 1.4l-9 9-2 0.6 0.6-2 9-9z" /></svg>
                            </button>
                            <style>{`
                                @keyframes marquee {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-100%); }
                                }
                                @keyframes subtle-glow {
                                    0% { box-shadow: 0 0 0 0 rgba(186,162,255,0.5); }
                                    50% { box-shadow: 0 0 16px 6px rgba(186,162,255,0.7); }
                                    100% { box-shadow: 0 0 0 0 rgba(186,162,255,0.5); }
                                }
                                .animate-glow {
                                    animation: subtle-glow 1.2s ease-in-out 1;
                                }
                            `}</style>
                        </div>
                    )
                ) : null}
{activeAudioSource.type === 'tts' && activeAudioSource.url && (
    <audio
        ref={audioRef}
        controls
        autoPlay
        onEnded={() => actions.stopMusic()}
        className="w-64 h-8"
    >
        Your browser does not support the audio element.
    </audio>
)}
                {activeAudioSource.type === 'tts' && activeAudioSource.url && (
                    <audio src={activeAudioSource.url} controls autoPlay className="w-20 h-6 ml-1" style={{ minWidth: 60 }} />
                )}
                {activeAudioSource.type === 'music' && (
                    <div className="flex items-center gap-1 ml-1">
                        <button onClick={actions.resumeMusic} aria-label="Resume" className="p-0.5 rounded hover:bg-ctp-mauve/20 text-ctp-mauve focus:outline-none focus:ring-1 focus:ring-ctp-mauve"><MiniPlayerIcons.Play /></button>
                        <button onClick={actions.pauseMusic} aria-label="Pause" className="p-0.5 rounded hover:bg-ctp-mauve/20 text-ctp-mauve focus:outline-none focus:ring-1 focus:ring-ctp-mauve"><MiniPlayerIcons.Pause /></button>
                    </div>
                )}
                <button onClick={actions.stopMusic} aria-label="Stop" className="p-0.5 rounded hover:bg-ctp-red/20 text-ctp-red ml-1 focus:outline-none focus:ring-1 focus:ring-ctp-red"><MiniPlayerIcons.Stop /></button>
                <button
                    aria-label="Minimize music player"
                    className="ml-1 p-0.5 rounded-full hover:bg-ctp-mauve/10 transition-all focus:outline-none focus:ring-1 focus:ring-ctp-mauve"
                    onClick={handleMinimize}
                    style={{ alignSelf: 'center' }}
                    ref={minimizedNoteRef}
                >
                    {/* Use the Minimize icon from the combined icons */}
                    <MiniPlayerIcons.Minimize />
                </button>
            </div>
        </>
    );
};

export default MiniPlayer;
