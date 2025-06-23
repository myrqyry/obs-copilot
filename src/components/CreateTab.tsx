import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { GoogleGenAI, Modality } from '@google/genai';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import Tooltip from './ui/Tooltip';

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
const LYRIA_MODEL = "models/lyria-realtime-exp";

const CreateTab: React.FC = () => {
    // State for image generation
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    // Multi-speaker TTS state
    const [script, setScript] = useState('Alice: Hello, Bob!\nBob: Hi Alice, how are you?\nAlice: I am great, thanks!');
    const [speakers, setSpeakers] = useState([
        { name: 'Alice', voice: 'Zephyr', style: '', color: '#8ecae6' },
        { name: 'Bob', voice: 'Charon', style: '', color: '#ffb703' },
    ]);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
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
        // Use a valid #RRGGBB color for new speakers (default: light gray)
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
            if (!geminiApiKey) throw new Error('Gemini API key is missing.');
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
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

    // State for music generation
    const [musicPrompt, setMusicPrompt] = useState('');
    const [musicLoading, setMusicLoading] = useState(false);
    const [musicError, setMusicError] = useState<string | null>(null);
    const [bpm, setBpm] = useState<number>(120);
    const [temperature, setTemperature] = useState<number>(1.0);
    const [density, setDensity] = useState<number>(0.7);
    const [brightness, setBrightness] = useState<number>(0.5);
    const [guidance, setGuidance] = useState<number>(4.0);
    const [scale, setScale] = useState<string>("SCALE_UNSPECIFIED");
    const [muteBass, setMuteBass] = useState(false);
    const [muteDrums, setMuteDrums] = useState(false);
    const [onlyBassAndDrums, setOnlyBassAndDrums] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Media control state for music
    const [musicSession, setMusicSession] = useState<any>(null);
    const [musicPlaying, setMusicPlaying] = useState(false);

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
            const response = await ai.models.generateContent({
                model: GEMINI_IMAGE_MODEL,
                contents: imagePrompt,
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
            if (!geminiApiKey) {
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
            const audioBlobs: Blob[] = [];
            for (const part of parts) {
                const speaker = speakers.find(s => s.name === part.speaker) || speakers[0];
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
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
                const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!data) throw new Error(`No audio data for ${part.speaker}`);
                const audioBuffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
                audioBlobs.push(new Blob([audioBuffer], { type: "audio/wav" }));
            }
            // Concatenate all WAV blobs into a single valid WAV file for download/playback
            // Concatenate WAV blobs by stripping headers from all but the first, then fixing the header
            function concatenateWavBlobs(blobs: Blob[]): Promise<Blob> {
                return new Promise(async (resolve, reject) => {
                    try {
                        // Read all blobs as ArrayBuffers
                        const buffers = await Promise.all(blobs.map(b => b.arrayBuffer()));
                        // Assume all WAVs are the same format (from same TTS API)
                        // WAV header is 44 bytes
                        let totalLength = 0;
                        const wavDataBuffers = buffers.map((buf, i) => {
                            if (i === 0) {
                                totalLength += buf.byteLength;
                                return new Uint8Array(buf);
                            } else {
                                totalLength += buf.byteLength - 44;
                                return new Uint8Array(buf).subarray(44);
                            }
                        });
                        // Create new buffer for output
                        const out = new Uint8Array(totalLength);
                        // Copy first file (header + data)
                        out.set(wavDataBuffers[0], 0);
                        let offset = wavDataBuffers[0].length;
                        // Copy data from subsequent files (no header)
                        for (let i = 1; i < wavDataBuffers.length; i++) {
                            out.set(wavDataBuffers[i], offset);
                            offset += wavDataBuffers[i].length;
                        }
                        // Fix the RIFF chunk size and data chunk size in header
                        const view = new DataView(out.buffer);
                        view.setUint32(4, out.length - 8, true); // RIFF chunk size
                        view.setUint32(40, out.length - 44, true); // data chunk size
                        resolve(new Blob([out], { type: 'audio/wav' }));
                    } catch (e) {
                        reject(e);
                    }
                });
            }
            let finalBlob: Blob;
            if (audioBlobs.length === 1) {
                finalBlob = audioBlobs[0];
            } else {
                finalBlob = await concatenateWavBlobs(audioBlobs);
            }
            const url = URL.createObjectURL(finalBlob);
            setGeneratedAudio(url);
        } catch (err: any) {
            setAudioError(err.message || 'Audio generation failed.');
        } finally {
            setAudioLoading(false);
        }
    };

    // Gemini Lyria RealTime music generation (with advanced options)
    const handleGenerateMusic = async () => {
        setMusicLoading(true);
        setMusicError(null);

        try {
            if (!geminiApiKey) {
                setMusicError("Gemini API key is missing. Please set it in the Connections tab.");
                setMusicLoading(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1alpha" });

            // Use the required callbacks property in connect
            const session = await ai.live.music.connect({
                model: LYRIA_MODEL,
                callbacks: {
                    onmessage: async (message: any) => {
                        console.log("onmessage called!", message);
                        const serverContent = message.serverContent;
                        if (!serverContent) {
                            console.warn("No serverContent in message", message);
                            return;
                        }
                        if (!serverContent.audioChunks || !Array.isArray(serverContent.audioChunks) || serverContent.audioChunks.length === 0) {
                            console.warn("No audioChunks or empty array in message.serverContent", serverContent);
                            return;
                        }
                        const chunk = serverContent.audioChunks[0];
                        console.log("Received chunk:", chunk);
                        if (chunk && chunk.data) {
                            // Decode base64 PCM to ArrayBuffer
                            const pcm = Uint8Array.from(atob(chunk.data), c => c.charCodeAt(0)).buffer;
                            // Play PCM using Web Audio API
                            if (!audioContextRef.current) {
                                audioContextRef.current = new window.AudioContext({ sampleRate: 48000 });
                            }
                            const ctx = audioContextRef.current;
                            // 16-bit PCM stereo, 48kHz
                            const audioBuffer = ctx.createBuffer(2, pcm.byteLength / 4, 48000);
                            const view = new DataView(pcm);
                            for (let i = 0; i < audioBuffer.length; i++) {
                                audioBuffer.getChannelData(0)[i] = view.getInt16(i * 4, true) / 32768;
                                audioBuffer.getChannelData(1)[i] = view.getInt16(i * 4 + 2, true) / 32768;
                            }
                            if (sourceRef.current) sourceRef.current.stop();
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.start();
                            sourceRef.current = source;
                        } else {
                            console.warn("Chunk present but no data field:", chunk);
                        }
                    },
                    onerror: (error: any) => setMusicError(error.message || "Music generation error"),
                    onclose: () => {
                        setMusicLoading(false);
                        setMusicPlaying(false);
                        setMusicSession(null);
                    },
                }
            });

            setMusicSession(session);
            setMusicPlaying(true);

            // Set prompt and config
            await session.setWeightedPrompts({
                weightedPrompts: [{ text: musicPrompt, weight: 1.0 }],
            });
            await session.setMusicGenerationConfig({
                musicGenerationConfig: {
                    bpm,
                    temperature,
                    density,
                    brightness,
                    guidance,
                    scale: scale as any, // Fix: cast to any to avoid TS error
                    muteBass,
                    muteDrums,
                    onlyBassAndDrums,
                },
            });

            // Start generation
            await session.play();
        } catch (err: any) {
            setMusicError(err.message || "Music generation failed.");
        } finally {
            setMusicLoading(false);
        }
    };

    // Media controls for music
    const handlePauseMusic = async () => {
        if (musicSession && musicPlaying) {
            await musicSession.pause();
            setMusicPlaying(false);
        }
    };
    const handleResumeMusic = async () => {
        if (musicSession && !musicPlaying) {
            await musicSession.play();
            setMusicPlaying(true);
        }
    };
    const handleStopMusic = async () => {
        if (musicSession) {
            await musicSession.stop();
            setMusicPlaying(false);
            setMusicSession(null);
        }
    };
    const handleResetMusicContext = async () => {
        if (musicSession) {
            await musicSession.resetContext();
        }
    };

    // Randomize music prompt
    const handleRandomizeMusicPrompt = () => {
        setMusicPrompt(getRandomPrompt());
    };

    return (
        <div className="flex flex-col gap-4 p-2 md:p-4 w-full max-w-3xl mx-auto">
            {/* Image Generation/Editing Section */}
            <Card className="mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold mb-1 flex items-center gap-2">🖼️ Image Generation & Editing</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">
                        Generate or edit images using AI. Enter a prompt and click <span className="font-semibold">Generate</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
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
                    {imageError && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 mb-2">{imageError}</div>}
                    {generatedImage && (
                        <div className="mt-2 flex flex-col items-center">
                            <img src={generatedImage} alt="Generated" className="rounded shadow max-w-full max-h-80 border" />
                            <a href={generatedImage} download className="mt-2 text-primary underline">Download Image</a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audio Generation Section */}
            <Card className="mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold mb-1 flex items-center gap-2">🎵 Audio Generation</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">
                        Generate audio clips from text prompts. Enter a prompt, select a voice, and click <span className="font-semibold">Generate</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Multi-speaker TTS UI */}
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                            <span className="font-semibold text-xs">Speakers:</span>
                            {speakers.map((sp, idx) => (
                                <div key={sp.name + idx} className="flex items-center gap-1 border rounded px-2 py-1" style={{ background: sp.color }}>
                                    <input type="text" value={sp.name} onChange={e => handleSpeakerChange(idx, 'name', e.target.value)} className="w-16 text-xs rounded border px-1" />
                                    <select value={sp.voice} onChange={e => handleSpeakerChange(idx, 'voice', e.target.value)} className="text-xs rounded border px-1">
                                        {GEMINI_TTS_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                    <select value={sp.style} onChange={e => handleSpeakerChange(idx, 'style', e.target.value)} className="text-xs rounded border px-1">
                                        {VOICE_STYLES.map(s => <option key={s} value={s}>{s ? s : '(default)'}</option>)}
                                    </select>
                                    <input type="color" value={sp.color} onChange={e => handleSpeakerChange(idx, 'color', e.target.value)} title="Speaker color" pattern="#([0-9a-fA-F]{6})" />
                                    <button type="button" className="text-xs text-destructive ml-1" onClick={() => handleRemoveSpeaker(idx)} disabled={speakers.length <= 1}>✕</button>
                                </div>
                            ))}
                            <button type="button" className="text-xs px-2 py-1 border rounded bg-secondary" onClick={handleAddSpeaker}>+ Add Speaker</button>
                        </div>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="Write a story or dialogue. Use format: Speaker: line. Each line will be spoken by the selected speaker.">
                                <span className="inline-flex items-center gap-1">Script/Story <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <textarea value={script} onChange={e => setScript(e.target.value)} rows={4} className="rounded border px-2 py-1 text-xs font-mono" placeholder="Alice: Hello!\nBob: Hi Alice!" disabled={audioLoading || storyLoading} />
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
                            <input type="range" min={0.25} max={4.0} step={0.01} value={speakingRate} onChange={e => setSpeakingRate(Number(e.target.value))} />
                            <span className="text-xs text-muted-foreground">{speakingRate.toFixed(2)}</span>
                        </label>
                        <label className="text-xs flex flex-col w-32">
                            <Tooltip content="Pitch in semitones. 0 is default, -20 is lowest, 20 is highest.">
                                <span className="inline-flex items-center gap-1">Pitch <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="range" min={-20} max={20} step={0.1} value={pitch} onChange={e => setPitch(Number(e.target.value))} />
                            <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
                        </label>
                        <label className="text-xs flex flex-col w-32">
                            <Tooltip content="Volume gain in dB. 0 is default, -96 is quietest, 16 is loudest.">
                                <span className="inline-flex items-center gap-1">Volume Gain (dB) <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="range" min={-96} max={16} step={0.1} value={volumeGainDb} onChange={e => setVolumeGainDb(Number(e.target.value))} />
                            <span className="text-xs text-muted-foreground">{volumeGainDb.toFixed(1)}</span>
                        </label>
                        <label className="text-xs flex flex-col w-40">
                            <Tooltip content="Optional effects profile ID for device tuning (e.g. 'telephony-class-application'). Leave blank for default.">
                                <span className="inline-flex items-center gap-1">Effects Profile ID <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="text" value={effectsProfileId} onChange={e => setEffectsProfileId(e.target.value)} className="rounded border px-2 py-1 text-xs" placeholder="(optional)" />
                        </label>
                    </div>
                    {audioError && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 mb-2">{audioError}</div>}
                    {generatedAudio && (
                        <div className="mt-2 flex flex-col items-center">
                            <audio controls src={generatedAudio} className="w-full max-w-md rounded border" />
                            <a href={generatedAudio} download className="mt-2 text-primary underline">Download Audio</a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Music Generation Section */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg font-bold mb-1 flex items-center gap-2">🎶 Music Generation (Lyria RealTime)</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">
                        Generate instrumental music using Gemini Lyria RealTime. Enter a prompt and click <span className="font-semibold">Generate</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <TextInput
                            value={musicPrompt}
                            onChange={e => setMusicPrompt(e.target.value)}
                            placeholder="Describe your music (e.g. 'minimal techno, 120bpm')"
                            className="flex-1 text-sm"
                            disabled={musicLoading}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRandomizeMusicPrompt}
                            disabled={musicLoading}
                            title="Randomize prompt"
                        >
                            🎲 Randomize
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            isLoading={musicLoading}
                            onClick={handleGenerateMusic}
                            disabled={musicLoading || !musicPrompt.trim()}
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
                            <input type="number" min={60} max={200} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="rounded border px-2 py-1 w-20 text-xs" />
                        </label>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="Creativity of the music. Higher values = more variation and surprise (0-3).">
                                <span className="inline-flex items-center gap-1">Temperature <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="number" min={0} max={3} step={0.01} value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="rounded border px-2 py-1 w-20 text-xs" />
                        </label>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="How many notes or layers are present. 0 = sparse, 1 = dense.">
                                <span className="inline-flex items-center gap-1">Density <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="number" min={0} max={1} step={0.01} value={density} onChange={e => setDensity(Number(e.target.value))} className="rounded border px-2 py-1 w-20 text-xs" />
                        </label>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="Brightness of the sound. 0 = dark/mellow, 1 = bright/sparkly.">
                                <span className="inline-flex items-center gap-1">Brightness <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="number" min={0} max={1} step={0.01} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="rounded border px-2 py-1 w-20 text-xs" />
                        </label>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="How closely the music follows your prompt. Higher = more faithful, lower = more freedom (0-6).">
                                <span className="inline-flex items-center gap-1">Guidance <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <input type="number" min={0} max={6} step={0.01} value={guidance} onChange={e => setGuidance(Number(e.target.value))} className="rounded border px-2 py-1 w-20 text-xs" />
                        </label>
                        <label className="text-xs flex flex-col">
                            <Tooltip content="Choose a musical scale or let the model decide. Useful for controlling the key.">
                                <span className="inline-flex items-center gap-1">Scale <span className="text-primary cursor-help">ⓘ</span></span>
                            </Tooltip>
                            <select value={scale} onChange={e => setScale(e.target.value)} className="rounded border px-2 py-1 w-36 text-xs">
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
                    {/* Media controls for music */}
                    <div className="flex gap-2 mb-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePauseMusic}
                            disabled={!musicSession || !musicPlaying}
                            title="Pause"
                        >
                            ⏸ Pause
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleResumeMusic}
                            disabled={!musicSession || musicPlaying}
                            title="Resume"
                        >
                            ▶️ Resume
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleStopMusic}
                            disabled={!musicSession}
                            title="Stop"
                        >
                            ⏹ Stop
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleResetMusicContext}
                            disabled={!musicSession}
                            title="Reset Context"
                        >
                            🔄 Reset Context
                        </Button>
                    </div>
                    {musicError && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 mb-2">{musicError}</div>}
                    <div className="text-xs text-muted-foreground">
                        <b>Note:</b> Music will play in real time as it is generated. Only instrumental music is supported.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateTab;
