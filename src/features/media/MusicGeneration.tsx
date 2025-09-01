import React, { useState } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import useApiKeyStore, { ApiService } from '@/store/apiKeyStore';
import { CardContent } from '@/components/ui/Card';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { TextInput } from '@/components/common/TextInput';
import Tooltip from '@/components/ui/Tooltip';
import InlineMusicControls from '@/components/ui/InlineMusicControls';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '@/types';

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

const MusicGeneration: React.FC = () => {
    const { startMusicGeneration } = useAudioStore(state => state.actions);

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

    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    // Music generation handler: just calls store action
    const handleGenerateMusic = () => {
        // Always get the latest Gemini API key from Zustand store
        const currentGeminiApiKey = useApiKeyStore.getState().getApiKeyOverride(ApiService.GEMINI);
        if (!currentGeminiApiKey) {
            toast({ title: 'Error', description: 'Gemini API key is missing. Please set it in the Connections tab.', variant: 'destructive' });
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

    return (
        <CollapsibleCard
            title="Music Generation (Lyria RealTime)"
            emoji="🎶"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
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
                    <Tooltip content="Randomize prompt">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRandomizeMusicPrompt}
                        >
                            🎲 Randomize
                        </Button>
                    </Tooltip>
                    <Button
                        variant="default"
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
                <InlineMusicControls />
                <div className="text-xs text-muted-foreground">
                    <b>Note:</b> Music will play in real time as it is generated. Only instrumental music is supported.
                </div>
            </CardContent>
        </CollapsibleCard>
    );
};

export default MusicGeneration;
