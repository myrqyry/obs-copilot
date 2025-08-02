import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { useToast } from './ui/use-toast';
import { geminiService } from '../services/geminiService';
import { CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { pcm16ToWavUrl } from '../lib/pcmToWavUrl';
import { CollapsibleCard } from './common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '../types';
import Tooltip from './ui/Tooltip';
import { gsap } from 'gsap';

// List of supported Gemini TTS voices
const GEMINI_TTS_VOICES = [
    "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"
];

const SpeechGeneration: React.FC = () => {
    const [script, setScript] = useState('Alice: Hello, Bob!\nBob: Hi Alice, how are you?\nAlice: I am great, thanks!');
    const [speakers, setSpeakers] = useState([
        { name: 'Alice', voice: 'Zephyr', style: '', color: '#8ecae6' },
        { name: 'Bob', voice: 'Charon', style: '', color: '#ffb703' },
    ]);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
    const [miniPlayerTTSUrl, setMiniPlayerTTSUrl] = useState<string | null>(null);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioProvider, setAudioProvider] = useState<'gemini' | 'groq'>('gemini');
    const [groqApiKey, setGroqApiKey] = useState('');

    // Advanced TTS settings (applies to all speakers for now)
    const [speakingRate, setSpeakingRate] = useState<number>(1.0);
    const [pitch, setPitch] = useState<number>(0);
    const [volumeGainDb, setVolumeGainDb] = useState<number>(0);
    const [effectsProfileId, setEffectsProfileId] = useState<string>('');
    // Voice styles
    const VOICE_STYLES = [
        '', 'neutral', 'happy', 'sad', 'angry', 'excited', 'calm', 'shouting', 'whispering', 'unfriendly', 'hopeful', 'empathetic', 'apologetic', 'confident', 'tentative', 'unsure', 'encouraging', 'declarative', 'narration', 'advertisement', 'conversational', 'formal', 'informal', 'newscast', 'poetry', 'singing', 'sports', 'storytelling', 'telephony', 'video-game', 'robotic', 'child', 'elderly', 'young-adult', 'middle-aged', 'senior', 'male', 'female', 'gender-neutral'
    ];

    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

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
            // Always get the latest Gemini API key override from Zustand store (proxy handles actual keys)
            const currentGeminiApiKey = useApiKeyStore.getState().getApiKeyOverride(ApiService.GEMINI);
            if (!currentGeminiApiKey) throw new Error('Gemini API key is missing.');
            const prompt = `Hi, please generate a short (like 100 words) transcript that reads like it was clipped from a podcast from the following speakers: ${speakers.map(s => s.name).join(', ')}. Format as Speaker: line.`;
            const response = await geminiService.generateContent(prompt);
            const responseText = response.candidates[0]?.content?.parts[0]?.text || '';
            setScript(responseText.trim());
        } catch (err: unknown) {
            if (err instanceof Error) {
                setScript('// Error generating story: ' + err.message);
            } else {
                setScript('// Error generating story: Unknown error');
            }
        } finally {
            setStoryLoading(false);
        }
    };

    // Gemini TTS audio generation
    // Multi-speaker TTS handler
    const handleGenerateAudio = async () => {
        setAudioLoading(true);
        setAudioError(null);
        setGeneratedAudio(null);
        try {
            // Always get the latest Gemini API key override from Zustand store (proxy handles actual keys)
            const currentGeminiApiKey = useApiKeyStore.getState().getApiKeyOverride(ApiService.GEMINI);
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
                const response = await geminiService.generateContent(part.text);
                const data = response.audioData;
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
            const wavData = pcm16ToWavUrl(combinedPcm, 24000, 1);
            // Convert base64 data URL to Blob URL for better buffering
            function dataUrlToBlobUrl(dataUrl: string) {
                const arr = dataUrl.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'audio/wav';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) u8arr[n] = bstr.charCodeAt(n);
                return URL.createObjectURL(new Blob([u8arr], { type: mime }));
            }
            const finalUrl = dataUrlToBlobUrl(wavData);

            setGeneratedAudio(finalUrl);
            setMiniPlayerTTSUrl(finalUrl);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setAudioError(err.message);
            } else {
                setAudioError('Audio generation failed.');
            }
        } finally {
            setAudioLoading(false);
        }
    };

    return (
        <CollapsibleCard
            title="Speech Generation"
            emoji="🗣️"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className="text-xs md:text-sm text-muted-foreground mb-2">
                    Generate audio clips from text prompts. Enter a prompt, select a voice, and click <span className="font-semibold">Generate</span>.
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    {/* Provider selection */}
                    <label className="text-xs flex flex-col w-32">
                        <span className="mb-1 text-ctp-mauve">Provider</span>
                        <select
                            value={audioProvider}
                            onChange={e => setAudioProvider(e.target.value as 'gemini' | 'groq')}
                            className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                            disabled={audioLoading}
                        >
                            <option value="gemini">Gemini</option>
                            <option value="groq">Groq</option>
                        </select>
                    </label>
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
                        <Button variant="default" size="sm" onClick={handleGenerateAudio} isLoading={audioLoading} disabled={audioLoading || !script.trim()}>Generate Audio</Button>
                    </div>
                </div>
                {/* Advanced TTS controls */}
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                    <label className="text-xs flex flex-col">
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
                    <label className="text-xs flex flex-col">
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
                    <label className="text-xs flex flex-col">
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
                    <div
                        className="mt-2 flex flex-col items-center"
                        ref={el => {
                            if (el && generatedAudio) {
                                // Animate in with GSAP when generatedAudio appears
                                gsap.fromTo(
                                    el,
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
                        }}
                    >
                        <audio controls src={generatedAudio} className="w-full max-w-md rounded border" />
                        <a
                            href={generatedAudio}
                            download={
                                (() => {
                                    // Always return tts.wav for generated TTS audio
                                    return "tts.wav";
                                })()
                            }
                            className="mt-2 text-primary underline"
                        >
                            Download Audio
                        </a>
                    </div>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default SpeechGeneration;
