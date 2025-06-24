import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useAppStore } from '../store/appStore';
import { GoogleGenAI, Modality } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import Tooltip from './ui/Tooltip';
import TTSAndMusicMiniPlayer from './TTSAndMusicMiniPlayer';
import { Modal } from './common/Modal';
import { addBrowserSource, addImageSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { pcm16ToWavUrl } from '../lib/pcmToWavUrl';

// List of supported Gemini TTS voices
const GEMINI_TTS_VOICES = [
    "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"
];

// Lyria RealTime music generation options
const LYRIA_SCALES = [
    { value: "SCALE_UNSPECIFIED", label: "Default (Let Model Decide)" },
    { value: "C_MAJOR_A_MINOR", label: "C Major / A Minor" },
    { value: "D_FLAT_MAJOR_B_FLAT_MINOR", label: "D♭ Major / B♭ Minor" },
    { value: "D_MAJOR_B_MINOR", label: "D Major / B Minor" },
    { value: "E_FLAT_MAJOR_C_MINOR", label: "E♭ Major / C Minor" },
    { value: "E_MAJOR_D_FLAT_MINOR", label: "E Major / D♭ Minor" },
    { value: "F_MAJOR_D_MINOR", label: "F Major / D Minor" },
    { value: "G_FLAT_MAJOR_E_FLAT_MINOR", label: "G♭ Major / E♭ Minor" },
    { value: "G_MAJOR_E_MINOR", label: "G Major / E Minor" },
    { value: "A_FLAT_MAJOR_F_MINOR", label: "A♭ Major / F Minor" },
    { value: "A_MAJOR_G_FLAT_MINOR", label: "A Major / G♭ Minor" },
    { value: "B_FLAT_MAJOR_G_MINOR", label: "B♭ Major / G Minor" },
    { value: "B_MAJOR_A_FLAT_MINOR", label: "B Major / A♭ Minor" },
];

// Lyria RealTime prompt guide lists
const LYRIA_INSTRUMENTS = [
    "303 Acid Bass", "808 Hip Hop Beat", "Accordion", "Alto Saxophone", "Bagpipes", "Balalaika Ensemble", "Banjo", "Bass Clarinet", "Bongos", "Boomy Bass", "Bouzouki", "Buchla Synths", "Cello", "Charango", "Clavichord", "Conga Drums", "Didgeridoo", "Dirty Synths", "Djembe", "Drumline", "Dulcimer", "Fiddle", "Flamenco Guitar", "Funk Drums", "Glockenspiel", "Guitar", "Hang Drum", "Harmonica", "Harp", "Harpsichord", "Hurdy-gurdy", "Kalimba", "Koto", "Lyre", "Mandolin", "Maracas", "Marimba", "Mbira", "Mellotron", "Metallic Twang", "Moog Oscillations", "Ocarina", "Persian Tar", "Pipa", "Precision Bass", "Ragtime Piano", "Rhodes Piano", "Shamisen", "Shredding Guitar", "Sitar", "Slide Guitar", "Smooth Pianos", "Spacey Synths", "Steel Drum", "Synth Pads", "Tabla", "TR-909 Drum Machine", "Trumpet", "Tuba", "Vibraphone", "Viola Ensemble", "Warm Acoustic Guitar", "Woodwinds"
];
const LYRIA_GENRES = [
    "Acid Jazz", "Afrobeat", "Alternative Country", "Baroque", "Bengal Baul", "Bhangra", "Bluegrass", "Blues Rock", "Bossa Nova", "Breakbeat", "Celtic Folk", "Chillout", "Chiptune", "Classic Rock", "Contemporary R&B", "Cumbia", "Deep House", "Disco Funk", "Drum & Bass", "Dubstep", "EDM", "Electro Swing", "Funk Metal", "G-funk", "Garage Rock", "Glitch Hop", "Grime", "Hyperpop", "Indian Classical", "Indie Electronic", "Indie Folk", "Indie Pop", "Irish Folk", "Jam Band", "Jamaican Dub", "Jazz Fusion", "Latin Jazz", "Lo-Fi Hip Hop", "Marching Band", "Merengue", "New Jack Swing", "Minimal Techno", "Moombahton", "Neo-Soul", "Orchestral Score", "Piano Ballad", "Polka", "Post-Punk", "60s Psychedelic Rock", "Psytrance", "R&B", "Reggae", "Reggaeton", "Renaissance Music", "Salsa", "Shoegaze", "Ska", "Surf Rock", "Synthpop", "Techno", "Trance", "Trap Beat", "Trip Hop", "Vaporwave", "Witch house"
];
const LYRIA_MOODS = [
    "Acoustic Instruments", "Ambient", "Bright Tones", "Chill", "Crunchy Distortion", "Danceable", "Dreamy", "Echo", "Emotional", "Ethereal Ambience", "Experimental", "Fat Beats", "Funky", "Glitchy Effects", "Huge Drop", "Live Performance", "Lo-fi", "Ominous Drone", "Psychedelic", "Rich Orchestration", "Saturated Tones", "Subdued Melody", "Sustained Chords", "Swirling Phasers", "Tight Groove", "Unsettling", "Upbeat", "Virtuoso", "Weird Noises"
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrompt() {
    // Compose a prompt from random instrument, genre, and mood
    const instrument = getRandomItem(LYRIA_INSTRUMENTS);
    const genre = getRandomItem(LYRIA_GENRES);
    const mood = getRandomItem(LYRIA_MOODS);
    return `${genre} with ${instrument}, ${mood}`;
}

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

const CreateTab: React.FC = () => {
    const { startMusicGeneration } = useAppStore(state => state.actions);
    // State for image generation
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    // New: Image generation settings
    const [imageStyle, setImageStyle] = useState('photorealistic');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [numImages, setNumImages] = useState(1);
    const [quality, setQuality] = useState('high');
    const [textOverlay, setTextOverlay] = useState('');

    // Ref for generated image animation
    const generatedImageRef = useRef<HTMLImageElement>(null);

    // Modal and feedback state for generated image preview/actions
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    // Animate generated image when it appears
    useEffect(() => {
        if (generatedImage && generatedImageRef.current) {
            gsap.fromTo(
                generatedImageRef.current,
                { opacity: 0, scale: 0.8, y: 20 },
                {
                    duration: 0.5,
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    ease: 'back.out(1.7)',
                }
            );
        }
    }, [generatedImage]);

    // Multi-speaker TTS state
    const [script, setScript] = useState('Alice: Hello, Bob!\nBob: Hi Alice, how are you?\nAlice: I am great, thanks!');
    const [speakers, setSpeakers] = useState([
        { name: 'Alice', voice: 'Zephyr', style: '', color: '#8ecae6' },
        { name: 'Bob', voice: 'Charon', style: '', color: '#ffb703' },
    ]);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
    const [miniPlayerTTSUrl, setMiniPlayerTTSUrl] = useState<string | null>(null);
    const [miniPlayerMusicUrl, setMiniPlayerMusicUrl] = useState<string | null>(null);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    // Advanced TTS settings (applies to all speakers for now)
    const [speakingRate, setSpeakingRate] = useState<number>(1.0);
    const [pitch, setPitch] = useState<number>(0);
    const [volumeGainDb, setVolumeGainDb] = useState<number>(0);
    const [effectsProfileId, setEffectsProfileId] = useState<string>('');
    // Voice styles
    const VOICE_STYLES = [
        '', 'neutral', 'happy', 'sad', 'angry', 'excited', 'calm', 'shouting', 'whispering', 'unfriendly', 'hopeful', 'empathetic', 'apologetic', 'confident', 'tentative', 'unsure', 'encouraging', 'declarative', 'narration', 'advertisement', 'conversational', 'formal', 'informal', 'newscast', 'poetry', 'singing', 'sports', 'storytelling', 'telephony', 'video-game', 'robotic', 'child', 'elderly', 'young-adult', 'middle-aged', 'senior', 'male', 'female', 'gender-neutral'
    ];

    // Add/remove/edit speakers
    const handleAddSpeaker = () => {
        setSpeakers([
            ...speakers,
            { name: `Speaker${speakers.length + 1}`, voice: GEMINI_TTS_VOICES[0], style: '', color: '#cccccc' }
        ]);
    };
    const handleRemoveSpeaker = (idx: number) => {
        setSpeakers(speakers.filter((_, i) => i !== idx));
    };
    const handleSpeakerChange = (idx: number, field: string, value: string) => {
        setSpeakers(speakers.map((sp, i) => i === idx ? { ...sp, [field]: value } : sp));
    };

    // AI story generation
    const [storyLoading, setStoryLoading] = useState(false);
    const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
    const handleGenerateStory = async () => {
        setStoryLoading(true);
        setScript('');
        try {
            // Always get the latest Gemini API key from store or env
            const currentGeminiApiKey = useAppStore.getState().geminiApiKey || envGeminiApiKey;
            if (!currentGeminiApiKey) throw new Error('Gemini API key is missing.');
            const ai = new GoogleGenAI({ apiKey: currentGeminiApiKey });
            // Prompt Gemini to generate a short story with the current speakers
            const prompt = `Hi, please generate a short (like 100 words) transcript that reads like
      it was clipped from a podcast from the following speakers: ${speakers.map(s => s.name).join(', ')}. Format as Speaker: line.`;
            const response = await ai.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: [{ parts: [{ text: prompt }] }],
                config: { responseModalities: ["TEXT"] }
            });
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            setScript(text.trim());
        } catch (err: any) {
            setScript('// Error generating story: ' + (err.message || 'Unknown error'));
        } finally {
            setStoryLoading(false);
        }
    };

    // State for music generation UI only
    const [musicPrompt, setMusicPrompt] = useState('');
    const [bpm, setBpm] = useState<number>(120);
    const [temperature, setTemperature] = useState<number>(1.0);
    const [density, setDensity] = useState<number>(0.7);
    const [brightness, setBrightness] = useState<number>(0.5);
    const [guidance, setGuidance] = useState<number>(4.0);
    const [scale, setScale] = useState<string>("SCALE_UNSPECIFIED");
    const [muteBass, setMuteBass] = useState(false);
    const [muteDrums, setMuteDrums] = useState(false);
    const [onlyBassAndDrums, setOnlyBassAndDrums] = useState(false);

    // Get Gemini API key from Zustand store or env
    const envGeminiApiKey = (typeof process !== 'undefined' && process.env && (process.env.VITE_GEMINI_API_KEY || process.env.API_KEY)) || '';
    const geminiApiKey = useAppStore(state => state.geminiApiKey) || envGeminiApiKey;

    // Real API call for image generation using Gemini model (free tier)
    const handleGenerateImage = async () => {
        setImageLoading(true);
        setImageError(null);
        setGeneratedImage(null);
        try {
            if (!geminiApiKey) {
                setImageError('Gemini API key is missing. Please set it in the Connections tab.');
                setImageLoading(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });

            // Compose prompt with settings
            let prompt = imagePrompt;
            if (imageStyle) prompt += `\nStyle: ${imageStyle}`;
            if (aspectRatio) prompt += `\nAspect Ratio: ${aspectRatio}`;
            if (quality) prompt += `\nQuality: ${quality}`;
            if (textOverlay) prompt += `\nText Overlay: ${textOverlay}`;

            const response = await ai.models.generateContent({
                model: GEMINI_IMAGE_MODEL,
                contents: prompt,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            });
            // Find the image part in the response
            const parts = response.candidates?.[0]?.content?.parts || [];
            const imagePart = parts.find((part: any) => part.inlineData && part.inlineData.data);
            if (!imagePart || !imagePart.inlineData) throw new Error("No image data in Gemini response");
            const imageData = imagePart.inlineData.data;
            const url = "data:image/png;base64," + imageData;
            setGeneratedImage(url);
        } catch (err: any) {
            setImageError(err.message || 'Image generation failed.');
        } finally {
            setImageLoading(false);
        }
    };

    // Gemini TTS audio generation
    // Multi-speaker TTS handler
    const handleGenerateAudio = async () => {
        setAudioLoading(true);
        setAudioError(null);
        setGeneratedAudio(null);
        try {
            // Always get the latest Gemini API key from store or env
            const currentGeminiApiKey = useAppStore.getState().geminiApiKey || envGeminiApiKey;
            if (!currentGeminiApiKey) {
                setAudioError('Gemini API key is missing. Please set it in the Connections tab.');
                setAudioLoading(false);
                return;
            }
            // Parse script into [{speaker, line}]
            const lines = script.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const parts: { speaker: string, text: string }[] = [];
            for (const line of lines) {
                const match = line.match(/^([\w-]+):\s*(.+)$/);
                if (match) parts.push({ speaker: match[1], text: match[2] });
            }
            if (!parts.length) throw new Error('No valid speaker lines found. Use format: Speaker: line');
            // Generate audio for each part, then concatenate
            // Gemini API returns raw PCM audio (16-bit signed, mono, 24kHz, little-endian)
            // We must convert base64 PCM to WAV for browser playback
            // We'll use the pcmToWavUrl utility
            // Import at top: import pcmToWavUrl from '../lib/pcmToWavUrl';
            // Helper to convert base64 to ArrayBuffer
            function base64ToArrayBuffer(base64: string): ArrayBuffer {
                const binary_string = atob(base64);
                const len = binary_string.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i);
                }
                return bytes.buffer;
            }

            // Gather all PCM buffers
            const pcmBuffers: ArrayBuffer[] = [];
            for (const part of parts) {
                const speaker = speakers.find(s => s.name === part.speaker) || speakers[0];
                const ai = new GoogleGenAI({ apiKey: currentGeminiApiKey });
                const response = await ai.models.generateContent({
                    model: GEMINI_TTS_MODEL,
                    contents: [{ parts: [{ text: part.text }] }],
                    config: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: speaker.voice },
                                ...(speaker.style && { voiceStyle: speaker.style }),
                            },
                            speakingRate,
                            pitch,
                            volumeGainDb,
                            ...(effectsProfileId ? { effectsProfileId: [effectsProfileId] } : {}),
                        } as any // Cast to any to avoid TS error
                    }
                });
                const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
                const data = inlineData?.data;
                if (!data) throw new Error(`No audio data for ${part.speaker}`);
                const pcmBuffer = base64ToArrayBuffer(data);
                pcmBuffers.push(pcmBuffer);
            }

            // Concatenate all PCM buffers
            let combinedPcm: ArrayBuffer;
            if (pcmBuffers.length === 1) {
                combinedPcm = pcmBuffers[0];
            } else {
                // Calculate total length
                const totalLength = pcmBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
                const combined = new Uint8Array(totalLength);
                let offset = 0;
                for (const buf of pcmBuffers) {
                    combined.set(new Uint8Array(buf), offset);
                    offset += buf.byteLength;
                }
                combinedPcm = combined.buffer;
            }

            // Create a single WAV from the combined PCM
            const finalUrl = pcm16ToWavUrl(combinedPcm, 24000, 1);

            setGeneratedAudio(finalUrl);
            setMiniPlayerTTSUrl(finalUrl);
            setMiniPlayerMusicUrl(null);
        } catch (err: any) {
            setAudioError(err.message || 'Audio generation failed.');
        } finally {
            setAudioLoading(false);
        }
    };

    // Music generation handler: just calls store action
    const handleGenerateMusic = () => {
        // Always get the latest Gemini API key from store or env
        const currentGeminiApiKey = useAppStore.getState().geminiApiKey || envGeminiApiKey;
        if (!currentGeminiApiKey) {
            showFeedback('Gemini API key is missing. Please set it in the Connections tab.');
            return;
        }
        const config = {
            bpm,
            temperature,
            density,
            brightness,
            guidance,
            scale,
            muteBass,
            muteDrums,
            onlyBassAndDrums,
            geminiApiKey: currentGeminiApiKey,
        };
        startMusicGeneration(musicPrompt, config);
    };

    // Randomize music prompt (if you want to keep this helper)
    const handleRandomizeMusicPrompt = () => {
        setMusicPrompt(getRandomPrompt());
    };

    // Collapsible state for each section
    const [openImage, setOpenImage] = useState(true);
    const [openAudio, setOpenAudio] = useState(true);
    const [openMusic, setOpenMusic] = useState(true);

    return (
        <>
            <TTSAndMusicMiniPlayer
                ttsUrl={miniPlayerTTSUrl}
                onClose={() => { setMiniPlayerTTSUrl(null); setMiniPlayerMusicUrl(null); }}
            />
            {/* DEBUG: Show current mini player URLs */}
            <div style={{ position: 'fixed', bottom: 0, right: 0, background: '#fff', color: '#333', zIndex: 9999, fontSize: 12, padding: 4, border: '1px solid #ccc' }}>
                <div><b>TTS URL:</b> {miniPlayerTTSUrl ? miniPlayerTTSUrl.slice(0, 40) + '...' : 'null'}</div>
                <div><b>Music URL:</b> {miniPlayerMusicUrl ? miniPlayerMusicUrl.slice(0, 40) + '...' : 'null'}</div>
            </div>
            <div className="flex flex-col gap-4 p-2 md:p-4 w-full max-w-3xl mx-auto">
                {/* Image Generation/Editing Section */}
                <Card className="mb-2 border-border">
                    <button
                        onClick={() => setOpenImage(v => !v)}
                        className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                        aria-expanded={openImage}
                        type="button"
                    >
                        <div className="flex items-center space-x-2">
                            <span className="emoji text-sm">🖼️</span>
                            <span className="text-sm font-semibold text-foreground">Image Generation & Editing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                                {openImage ? 'Hide' : 'Show'} section
                            </span>
                            <svg
                                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openImage ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                    {openImage && (
                        <CardContent className="px-3 pb-3 pt-2">
                            <div className="text-xs md:text-sm text-muted-foreground mb-2">
                                Generate or edit images using AI. Enter a prompt and click <span className="font-semibold">Generate</span>.
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <TextInput
                                    value={imagePrompt}
                                    onChange={e => setImagePrompt(e.target.value)}
                                    placeholder="Describe your image..."
                                    className="flex-1 text-sm"
                                    disabled={imageLoading}
                                />
                                <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={imageLoading}
                                    onClick={handleGenerateImage}
                                    disabled={imageLoading || !imagePrompt.trim()}
                                >
                                    Generate
                                </Button>
                            </div>
                            {/* New: Image settings controls */}
                            <div className="flex flex-wrap gap-2 mb-2 items-center">
                                <label className="text-xs flex flex-col w-32">
                                    <span className="mb-1 text-ctp-mauve">Style</span>
                                    <select
                                        value={imageStyle}
                                        onChange={e => setImageStyle(e.target.value)}
                                        className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="photorealistic">Photorealistic</option>
                                        <option value="cartoon">Cartoon</option>
                                        <option value="anime">Anime</option>
                                        <option value="3D render">3D Render</option>
                                        <option value="sketch">Sketch</option>
                                        <option value="painting">Painting</option>
                                        <option value="pixel art">Pixel Art</option>
                                        <option value="abstract">Abstract</option>
                                    </select>
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <span className="mb-1 text-ctp-mauve">Aspect Ratio</span>
                                    <select
                                        value={aspectRatio}
                                        onChange={e => setAspectRatio(e.target.value)}
                                        className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="1:1">1:1 (Square)</option>
                                        <option value="4:3">4:3</option>
                                        <option value="3:4">3:4</option>
                                        <option value="16:9">16:9 (Widescreen)</option>
                                        <option value="9:16">9:16 (Portrait)</option>
                                    </select>
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <span className="mb-1 text-ctp-mauve">Quality</span>
                                    <select
                                        value={quality}
                                        onChange={e => setQuality(e.target.value)}
                                        className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <span className="mb-1 text-ctp-mauve">Text Overlay</span>
                                    <input
                                        type="text"
                                        value={textOverlay}
                                        onChange={e => setTextOverlay(e.target.value)}
                                        className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                                        placeholder="Optional text"
                                    />
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <span className="mb-1 text-ctp-mauve">Number of Images</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={4}
                                        value={numImages}
                                        onChange={e => setNumImages(Number(e.target.value))}
                                        className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                                    />
                                </label>
                            </div>
                            {imageError && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 mb-2">{imageError}</div>}
                            {generatedImage && (
                                <div className="mt-2 flex flex-col items-center">
                                    <img
                                        ref={generatedImageRef}
                                        src={generatedImage}
                                        alt="Generated"
                                        className="rounded shadow max-w-full max-h-80 border cursor-pointer"
                                        onClick={() => setImageModalOpen(true)}
                                        title="Click to preview and add to OBS"
                                    />
                                    <a href={generatedImage} download className="mt-2 text-primary underline">Download Image</a>
                                </div>
                            )}
                            {/* Modal for generated image preview and actions */}
                            {imageModalOpen && generatedImage && (
                                <Modal
                                    isOpen={imageModalOpen}
                                    onClose={() => setImageModalOpen(false)}
                                    title="Generated Image Preview"
                                    actions={[
                                        {
                                            label: "Add as Image Source",
                                            onClick: async () => {
                                                const obsServiceInstance = useAppStore.getState().obsServiceInstance;
                                                const isConnected = useAppStore.getState().isConnected;
                                                const currentProgramScene = useAppStore.getState().currentProgramScene;
                                                if (!obsServiceInstance || !isConnected || !currentProgramScene) {
                                                    setImageModalOpen(false);
                                                    setTimeout(() => showFeedback("OBS not connected."), 100);
                                                    return;
                                                }
                                                await addImageSource(obsServiceInstance, currentProgramScene, generatedImage, generateSourceName("Generated Image"));
                                                setImageModalOpen(false);
                                                setTimeout(() => showFeedback("Added image to OBS."), 100);
                                            },
                                            variant: "primary"
                                        },
                                        {
                                            label: "Add as Browser Source",
                                            onClick: async () => {
                                                const obsServiceInstance = useAppStore.getState().obsServiceInstance;
                                                const isConnected = useAppStore.getState().isConnected;
                                                const currentProgramScene = useAppStore.getState().currentProgramScene;
                                                if (!obsServiceInstance || !isConnected || !currentProgramScene) {
                                                    setImageModalOpen(false);
                                                    setTimeout(() => showFeedback("OBS not connected."), 100);
                                                    return;
                                                }
                                                await addBrowserSource(obsServiceInstance, currentProgramScene, generatedImage, generateSourceName("Generated Image"));
                                                setImageModalOpen(false);
                                                setTimeout(() => showFeedback("Added browser source to OBS."), 100);
                                            },
                                            variant: "secondary"
                                        },
                                        {
                                            label: "Copy Image URL",
                                            onClick: () => {
                                                copyToClipboard(generatedImage);
                                                setImageModalOpen(false);
                                                setTimeout(() => showFeedback("Copied image URL!"), 100);
                                            }
                                        },
                                        {
                                            label: "Download",
                                            onClick: () => {
                                                const link = document.createElement("a");
                                                link.href = generatedImage;
                                                link.download = "generated-image.png";
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }
                                        }
                                    ]}
                                >
                                    <img src={generatedImage} alt="Generated" className="max-w-full max-h-[70vh] mx-auto rounded shadow" />
                                </Modal>
                            )}
                            {/* Feedback message */}
                            {feedbackMessage && (
                                <div className="fixed bottom-4 right-4 bg-success text-success-foreground p-3 rounded-lg shadow-lg z-50">
                                    {feedbackMessage}
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Audio Generation Section */}
                <Card className="mb-2 border-border">
                    <button
                        onClick={() => setOpenAudio(v => !v)}
                        className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                        aria-expanded={openAudio}
                        type="button"
                    >
                        <div className="flex items-center space-x-2">
                            <span className="emoji text-sm">🎵</span>
                            <span className="text-sm font-semibold text-foreground">Audio Generation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                                {openAudio ? 'Hide' : 'Show'} section
                            </span>
                            <svg
                                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openAudio ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                    {openAudio && (
                        <CardContent className="px-3 pb-3 pt-2">
                            <div className="text-xs md:text-sm text-muted-foreground mb-2">
                                Generate audio clips from text prompts. Enter a prompt, select a voice, and click <span className="font-semibold">Generate</span>.
                            </div>
                            {/* Multi-speaker TTS UI */}
                            <div className="flex flex-col gap-2 mb-2">
                                <div className="flex flex-wrap gap-2 items-center mb-2">
                                    <span className="font-semibold text-xs">Speakers:</span>
                                    {speakers.map((sp, idx) => (
                                        <div key={sp.name + idx} className="flex items-center gap-1 border rounded px-2 py-1" style={{ background: sp.color }}>
                                            <input
                                                type="text"
                                                value={sp.name}
                                                onChange={e => handleSpeakerChange(idx, 'name', e.target.value)}
                                                className="w-16 text-xs rounded border px-1 bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                            />
                                            <select
                                                value={sp.voice}
                                                onChange={e => handleSpeakerChange(idx, 'voice', e.target.value)}
                                                className="text-xs rounded border px-1 bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                            >
                                                {GEMINI_TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                            <select
                                                value={sp.style}
                                                onChange={e => handleSpeakerChange(idx, 'style', e.target.value)}
                                                className="text-xs rounded border px-1 bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                            >
                                                {VOICE_STYLES.map(s => <option key={s} value={s}>{s ? s : '(default)'}</option>)}
                                            </select>
                                            <input
                                                type="color"
                                                value={sp.color}
                                                onChange={e => handleSpeakerChange(idx, 'color', e.target.value)}
                                                title="Speaker color"
                                                pattern="#([0-9a-fA-F]{6})"
                                                className="rounded border border-ctp-surface1"
                                            />
                                            <button type="button" className="text-xs text-destructive ml-1" onClick={() => handleRemoveSpeaker(idx)} disabled={speakers.length <= 1}>✕</button>
                                        </div>
                                    ))}
                                    <button type="button" className="text-xs px-2 py-1 border rounded bg-secondary" onClick={handleAddSpeaker}>+ Add Speaker</button>
                                </div>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="Write a story or dialogue. Use format: Speaker: line. Each line will be spoken by the selected speaker.">
                                        <span className="inline-flex items-center gap-1">Script/Story <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <textarea
                                        value={script}
                                        onChange={e => setScript(e.target.value)}
                                        rows={4}
                                        className="rounded border px-2 py-1 text-xs font-mono bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                        placeholder="Alice: Hello!\nBob: Hi Alice!"
                                        disabled={audioLoading || storyLoading}
                                    />
                                </label>
                                <div className="flex gap-2 mt-1">
                                    <Button variant="secondary" size="sm" onClick={handleGenerateStory} isLoading={storyLoading} disabled={storyLoading}>AI Generate Story</Button>
                                    <Button variant="primary" size="sm" onClick={handleGenerateAudio} isLoading={audioLoading} disabled={audioLoading || !script.trim()}>Generate Audio</Button>
                                </div>
                            </div>
                            {/* Advanced TTS controls */}
                            <div className="flex flex-wrap gap-2 mb-2 items-center">
                                <label className="text-xs flex flex-col w-32">
                                    <Tooltip content="Speaking rate (speed). 1.0 is normal, 0.25 is slowest, 4.0 is fastest.">
                                        <span className="inline-flex items-center gap-1">Speaking Rate <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="range"
                                        min={0.25}
                                        max={4.0}
                                        step={0.01}
                                        value={speakingRate}
                                        onChange={e => setSpeakingRate(Number(e.target.value))}
                                        className="accent-ctp-mauve"
                                    />
                                    <span className="text-xs text-muted-foreground">{speakingRate.toFixed(2)}</span>
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <Tooltip content="Pitch in semitones. 0 is default, -20 is lowest, 20 is highest.">
                                        <span className="inline-flex items-center gap-1">Pitch <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="range"
                                        min={-20}
                                        max={20}
                                        step={0.1}
                                        value={pitch}
                                        onChange={e => setPitch(Number(e.target.value))}
                                        className="accent-ctp-mauve"
                                    />
                                    <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
                                </label>
                                <label className="text-xs flex flex-col w-32">
                                    <Tooltip content="Volume gain in dB. 0 is default, -96 is quietest, 16 is loudest.">
                                        <span className="inline-flex items-center gap-1">Volume Gain (dB) <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="range"
                                        min={-96}
                                        max={16}
                                        step={0.1}
                                        value={volumeGainDb}
                                        onChange={e => setVolumeGainDb(Number(e.target.value))}
                                        className="accent-ctp-mauve"
                                    />
                                    <span className="text-xs text-muted-foreground">{volumeGainDb.toFixed(1)}</span>
                                </label>
                                <label className="text-xs flex flex-col w-40">
                                    <Tooltip content="Optional effects profile ID for device tuning (e.g. 'telephony-class-application'). Leave blank for default.">
                                        <span className="inline-flex items-center gap-1">Effects Profile ID <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="text"
                                        value={effectsProfileId}
                                        onChange={e => setEffectsProfileId(e.target.value)}
                                        className="rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                        placeholder="(optional)"
                                    />
                                </label>
                            </div>
                            {audioError && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 mb-2">{audioError}</div>}
                            {generatedAudio && (
                                <div className="mt-2 flex flex-col items-center">
                                    <audio controls src={generatedAudio} className="w-full max-w-md rounded border" />
                                    <a
                                        href={generatedAudio}
                                        download={
                                            (() => {
                                                // Try to guess extension from blob type
                                                // (removed unused variable urlObj and blob type checks)
                                                // Always return tts.wav for generated TTS audio
                                                return "tts.wav";
                                                return "tts_audio";
                                            })()
                                        }
                                        className="mt-2 text-primary underline"
                                    >
                                        Download Audio
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Music Generation Section */}
                <Card className="border-border">
                    <button
                        onClick={() => setOpenMusic(v => !v)}
                        className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                        aria-expanded={openMusic}
                        type="button"
                    >
                        <div className="flex items-center space-x-2">
                            <span className="emoji text-sm">🎶</span>
                            <span className="text-sm font-semibold text-foreground">Music Generation (Lyria RealTime)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                                {openMusic ? 'Hide' : 'Show'} section
                            </span>
                            <svg
                                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openMusic ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                    {openMusic && (
                        <CardContent className="px-3 pb-3 pt-2">
                            <div className="text-xs md:text-sm text-muted-foreground mb-2">
                                Generate instrumental music using Gemini Lyria RealTime. Enter a prompt and click <span className="font-semibold">Generate</span>.
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <TextInput
                                    value={musicPrompt}
                                    onChange={e => setMusicPrompt(e.target.value)}
                                    placeholder="Describe your music (e.g. 'minimal techno, 120bpm')"
                                    className="flex-1 text-sm bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleRandomizeMusicPrompt}
                                    title="Randomize prompt"
                                >
                                    🎲 Randomize
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleGenerateMusic}
                                    disabled={!musicPrompt.trim()}
                                >
                                    Generate
                                </Button>
                            </div>
                            {/* Advanced music controls */}
                            <div className="flex flex-wrap gap-2 mb-2 items-center">
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="Beats per minute. Controls the tempo of the generated music (60-200).">
                                        <span className="inline-flex items-center gap-1">BPM <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={60}
                                        max={200}
                                        value={bpm}
                                        onChange={e => setBpm(Number(e.target.value))}
                                        className="rounded border px-2 py-1 w-20 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    />
                                </label>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="Creativity of the music. Higher values = more variation and surprise (0-3).">
                                        <span className="inline-flex items-center gap-1">Temperature <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={0}
                                        max={3}
                                        step={0.01}
                                        value={temperature}
                                        onChange={e => setTemperature(Number(e.target.value))}
                                        className="rounded border px-2 py-1 w-20 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    />
                                </label>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="How many notes or layers are present. 0 = sparse, 1 = dense.">
                                        <span className="inline-flex items-center gap-1">Density <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={density}
                                        onChange={e => setDensity(Number(e.target.value))}
                                        className="rounded border px-2 py-1 w-20 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    />
                                </label>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="Brightness of the sound. 0 = dark/mellow, 1 = bright/sparkly.">
                                        <span className="inline-flex items-center gap-1">Brightness <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={brightness}
                                        onChange={e => setBrightness(Number(e.target.value))}
                                        className="rounded border px-2 py-1 w-20 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    />
                                </label>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="How closely the music follows your prompt. Higher = more faithful, lower = more freedom (0-6).">
                                        <span className="inline-flex items-center gap-1">Guidance <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={0}
                                        max={6}
                                        step={0.01}
                                        value={guidance}
                                        onChange={e => setGuidance(Number(e.target.value))}
                                        className="rounded border px-2 py-1 w-20 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    />
                                </label>
                                <label className="text-xs flex flex-col">
                                    <Tooltip content="Choose a musical scale or let the model decide. Useful for controlling the key.">
                                        <span className="inline-flex items-center gap-1">Scale <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                    <select
                                        value={scale}
                                        onChange={e => setScale(e.target.value)}
                                        className="rounded border px-2 py-1 w-36 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                    >
                                        {LYRIA_SCALES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs flex items-center gap-1">
                                    <Tooltip content="Mute the bass instrument in the generated music.">
                                        <span className="inline-flex items-center gap-1"><input type="checkbox" checked={muteBass} onChange={e => setMuteBass(e.target.checked)} />Mute Bass <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                </label>
                                <label className="text-xs flex items-center gap-1">
                                    <Tooltip content="Mute the drums in the generated music.">
                                        <span className="inline-flex items-center gap-1"><input type="checkbox" checked={muteDrums} onChange={e => setMuteDrums(e.target.checked)} />Mute Drums <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                </label>
                                <label className="text-xs flex items-center gap-1">
                                    <Tooltip content="Only generate bass and drums, muting all other instruments.">
                                        <span className="inline-flex items-center gap-1"><input type="checkbox" checked={onlyBassAndDrums} onChange={e => setOnlyBassAndDrums(e.target.checked)} />Only Bass & Drums <span className="text-primary cursor-help">ⓘ</span></span>
                                    </Tooltip>
                                </label>
                            </div>
                            {/* Music is streamed in real time; use the floating music controller for playback. */}
                            <div className="text-xs text-muted-foreground">
                                <b>Note:</b> Music will play in real time as it is generated. Only instrumental music is supported.
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </>
    );
};

export default CreateTab;
