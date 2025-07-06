import React, { useEffect, useRef, useState } from 'react';

interface Props {
    audioSelector?: string; // CSS selector for the <audio> element, or undefined to auto-detect
    size?: number;
    hidden?: boolean; // If true, visually hide the note (for animation)
}

// Simple glowy, pulsing, audio-reactive music note
const AudioReactiveNote: React.FC<Props> = ({ audioSelector, size = 20, hidden = false }) => {
    const [level, setLevel] = useState(0);
    const levelRef = useRef(0);
    const rafRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        let audio: HTMLAudioElement | null = null;
        if (audioSelector) {
            audio = document.querySelector(audioSelector) as HTMLAudioElement;
        } else {
            // Try to find the first visible <audio> in the mini player
            audio = document.querySelector('.fixed.top-2.right-2 audio, .fixed.top-3.right-3 audio') as HTMLAudioElement;
        }
        if (!audio) return;
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        if (!analyserRef.current) {
            analyserRef.current = audioCtx.createAnalyser();
            analyserRef.current.fftSize = 64;
        }
        const analyser = analyserRef.current;
        if (!sourceRef.current) {
            sourceRef.current = audioCtx.createMediaElementSource(audio);
            sourceRef.current.connect(analyser);
            analyser.connect(audioCtx.destination);
        }
        let running = true;
        const data = new Uint8Array(analyser.frequencyBinCount);
        function loop() {
            if (!running) return;
            analyser.getByteFrequencyData(data);
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
        return () => {
            running = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            // Don't disconnect audio graph here to avoid breaking playback
        };
    }, [audioSelector]);

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
