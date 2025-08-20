import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
    audioSelector?: string; // CSS selector for the <audio> element, or undefined to auto-detect
    size?: number;
    hidden?: boolean; // If true, visually hide the note (for animation)
}

interface AudioContextRefs {
    audioCtx: AudioContext | null;
    analyser: AnalyserNode | null;
    source: MediaElementAudioSourceNode | null;
}

// Simple glowy, pulsing, audio-reactive music note
const AudioReactiveNote: React.FC<Props> = ({ audioSelector, size = 20, hidden = false }) => {
    const [level, setLevel] = useState(0);
    const levelRef = useRef(0);
    const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
    const audioRefsRef = useRef<AudioContextRefs>({
        audioCtx: null,
        analyser: null,
        source: null
    });

    // Cleanup function to properly dispose of all audio resources
    const cleanupAudioResources = useCallback(() => {
        const refs = audioRefsRef.current;
        
        // Cancel animation frame
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        // Disconnect and cleanup audio nodes in proper order
        if (refs.source) {
            try {
                refs.source.disconnect();
            } catch (error) {
                // Ignore disconnect errors - node may already be disconnected
            }
            refs.source = null;
        }

        if (refs.analyser) {
            try {
                refs.analyser.disconnect();
            } catch (error) {
                // Ignore disconnect errors
            }
            refs.analyser = null;
        }

        // Close AudioContext last
        if (refs.audioCtx && refs.audioCtx.state !== 'closed') {
            refs.audioCtx.close().catch((error) => {
                console.warn('Failed to close AudioContext:', error);
            });
            refs.audioCtx = null;
        }

        // Reset level
        levelRef.current = 0;
        setLevel(0);
    }, []);

    useEffect(() => {
        let audio: HTMLAudioElement | null = null;
        let running = true;

        // Find audio element
        if (audioSelector) {
            audio = document.querySelector(audioSelector) as HTMLAudioElement;
        } else {
            // Try to find the first visible <audio> in the mini player
            audio = document.querySelector('.fixed.top-2.right-2 audio, .fixed.top-3.right-3 audio') as HTMLAudioElement;
        }

        if (!audio) {
            return;
        }

        const refs = audioRefsRef.current;

        try {
            // Initialize AudioContext
            if (!refs.audioCtx || refs.audioCtx.state === 'closed') {
                refs.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Initialize analyser
            if (!refs.analyser) {
                refs.analyser = refs.audioCtx.createAnalyser();
                refs.analyser.fftSize = 64;
            }

            // Initialize source - check if audio element is already connected
            if (!refs.source) {
                try {
                    refs.source = refs.audioCtx.createMediaElementSource(audio);
                    refs.source.connect(refs.analyser);
                    refs.analyser.connect(refs.audioCtx.destination);
                } catch (error) {
                    // Handle case where audio element is already connected to another source
                    console.warn('AudioContext source creation failed:', error);
                    return;
                }
            }

            const data = new Uint8Array(refs.analyser.frequencyBinCount);

            function loop() {
                if (!running || !refs.analyser) return;

                refs.analyser.getByteFrequencyData(data);
                // Use the average of the lower bins for a bassy pulse
                const avg = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
                
                // Smoother, more responsive with decay
                const prev = levelRef.current;
                const attack = 0.5; // higher = more responsive up
                const decay = 0.15; // lower = slower falloff
                let next = prev;
                
                if (avg > prev) {
                    next = prev + (avg - prev) * attack;
                } else {
                    next = prev + (avg - prev) * decay;
                }
                
                levelRef.current = next;
                setLevel(next);
                rafRef.current = requestAnimationFrame(loop);
            }

            loop();

        } catch (error) {
            console.error('Failed to initialize audio reactive note:', error);
        }

        // Cleanup function for this effect
        return () => {
            running = false;
            // Only cleanup animation frame here, not the entire audio context
            // as it might be reused for the same audio element
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [audioSelector]);

    // Component unmount cleanup
    useEffect(() => {
        return cleanupAudioResources;
    }, [cleanupAudioResources]);

    // Glowy effect: scale and shadow
    const scale = 1 + level * 0.7;
    const glow = `0 0 ${6 + 18 * level}px 2px rgba(186, 162, 255, ${0.3 + 0.5 * level})`;

    // Only set display: none if hidden, otherwise let parent control display
    const svgStyle: React.CSSProperties = hidden
        ? { display: 'none' }
        : {
            transform: `scale(${scale})`,
            filter: `drop-shadow(${glow})`,
            transition: 'filter 0.1s, transform 0.1s',
        };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={svgStyle}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );
};

export default AudioReactiveNote;
