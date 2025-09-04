import React, { useState } from 'react';
import useSettingsStore from '@/store/settingsStore';
import useApiKeyStore, { ApiService } from '@/store/apiKeyStore';
import { geminiService } from '@/services/geminiService';
import { CardContent } from '@/components/ui/Card';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '@/types';
import Tooltip from '@/components/ui/Tooltip';
import { gsap } from 'gsap';

const VideoGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [openVideoGeneration, setOpenVideoGeneration] = useState(true);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Video generation settings
    const [model, setModel] = useState('veo-3.0-fast-generate-preview');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [durationSeconds, setDurationSeconds] = useState(8);
    const [personGeneration, setPersonGeneration] = useState('allow_adult');
    const [numberOfVideos, setNumberOfVideos] = useState(1);

    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';
    const geminiApiKey = useApiKeyStore(state => state.getApiKeyOverride(ApiService.GEMINI));

    const ASPECT_RATIOS = [
        { value: '16:9', label: 'Widescreen (16:9)' },
        { value: '9:16', label: 'Vertical (9:16)' },
        { value: '1:1', label: 'Square (1:1)' },
        { value: '4:3', label: 'Standard (4:3)' },
    ];

    const PERSON_GENERATION_OPTIONS = [
        { value: 'allow_adult', label: 'Allow All' },
        { value: 'dont_allow', label: 'No People' },
    ];

    const handleGenerateVideo = async () => {
        if (!prompt.trim()) {
            setVideoError('Please enter a prompt');
            return;
        }

        setVideoLoading(true);
        setVideoError(null);
        setGeneratedVideoUrl(null);
        setDownloadUrl(null);

        try {
            if (!geminiApiKey) {
                throw new Error('Gemini API key is missing. Please set it in the Connections tab.');
            }

            // Generate video using geminiService
            const videoUrls = await geminiService.generateVideo(prompt, {
                model,
                aspectRatio,
                durationSeconds,
                personGeneration,
                numberOfVideos,
            });

            if (videoUrls && videoUrls.length > 0) {
                setGeneratedVideoUrl(videoUrls[0]);
                setDownloadUrl(videoUrls[0]);
            } else {
                throw new Error('No video was generated');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setVideoError(err.message);
            } else {
                setVideoError('Video generation failed');
            }
        } finally {
            setVideoLoading(false);
        }
    };

    const downloadAnchorRef = React.useRef<HTMLAnchorElement>(null);

    React.useEffect(() => {
        if (downloadUrl && downloadAnchorRef.current) {
            gsap.fromTo(
                downloadAnchorRef.current,
                { opacity: 0, y: 6, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' }
            );
        }
    }, [downloadUrl]);

    return (
        <CollapsibleCard
            title="Video Generation"
            emoji="🎬"
            accentColor={accentColor}
            isOpen={openVideoGeneration}
            onToggle={() => setOpenVideoGeneration(!openVideoGeneration)}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className="text-xs md:text-sm text-muted-foreground mb-2">
                    Generate videos from text prompts using Gemini Veo models.
                </div>
                
                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Video Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the video you want to generate (e.g., 'A cat playing with a ball in a sunny garden')"
                            rows={3}
                            className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                            disabled={videoLoading}
                        />
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Model
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                            disabled={videoLoading}
                        >
                            <option value="veo-3.0-fast-generate-preview">Veo 3.0 Fast (Preview)</option>
                            <option value="veo-3.0-generate-preview">Veo 3.0 (Preview)</option>
                        </select>
                    </div>

                    {/* Video Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-xs font-medium mb-1">
                                <Tooltip content="Aspect ratio of the generated video">
                                    <span className="inline-flex items-center gap-1">
                                        Aspect Ratio <span className="text-primary cursor-help">ⓘ</span>
                                    </span>
                                </Tooltip>
                            </label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                disabled={videoLoading}
                            >
                                {ASPECT_RATIOS.map(ratio => (
                                    <option key={ratio.value} value={ratio.value}>
                                        {ratio.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-xs font-medium mb-1">
                                <Tooltip content="Duration of the generated video in seconds (5-8 seconds)">
                                    <span className="inline-flex items-center gap-1">
                                        Duration (seconds) <span className="text-primary cursor-help">ⓘ</span>
                                    </span>
                                </Tooltip>
                            </label>
                            <select
                                value={durationSeconds}
                                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                                className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                disabled={videoLoading}
                            >
                                <option value={5}>5 seconds</option>
                                <option value={6}>6 seconds</option>
                                <option value={7}>7 seconds</option>
                                <option value={8}>8 seconds</option>
                            </select>
                        </div>

                        {/* Person Generation */}
                        <div>
                            <label className="block text-xs font-medium mb-1">
                                <Tooltip content="Control whether people can appear in the generated video">
                                    <span className="inline-flex items-center gap-1">
                                        Person Generation <span className="text-primary cursor-help">ⓘ</span>
                                    </span>
                                </Tooltip>
                            </label>
                            <select
                                value={personGeneration}
                                onChange={(e) => setPersonGeneration(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                disabled={videoLoading}
                            >
                                {PERSON_GENERATION_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Number of Videos */}
                        <div>
                            <label className="block text-xs font-medium mb-1">
                                <Tooltip content="Number of videos to generate (1-4)">
                                    <span className="inline-flex items-center gap-1">
                                        Number of Videos <span className="text-primary cursor-help">ⓘ</span>
                                    </span>
                                </Tooltip>
                            </label>
                            <select
                                value={numberOfVideos}
                                onChange={(e) => setNumberOfVideos(Number(e.target.value))}
                                className="w-full rounded border px-2 py-1 text-xs bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                                disabled={videoLoading}
                            >
                                <option value={1}>1 video</option>
                                <option value={2}>2 videos</option>
                                <option value={3}>3 videos</option>
                                <option value={4}>4 videos</option>
                            </select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerateVideo}
                        disabled={videoLoading || !prompt.trim()}
                        variant="default"
                        size="sm"
                        className="w-full"
                    >
                        {videoLoading ? 'Generating Video...' : 'Generate Video'}
                    </Button>

                    {/* Error Message */}
                    {videoError && (
                        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1">
                            {videoError}
                        </div>
                    )}

                    {/* Generated Video */}
                    {generatedVideoUrl && (
                        <div className="mt-4 space-y-3">
                            <div
                                className="flex flex-col items-center"
                                ref={el => {
                                    if (el && generatedVideoUrl) {
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
                                <video 
                                    controls 
                                    src={generatedVideoUrl} 
                                    className="w-full max-w-md rounded border"
                                    autoPlay
                                    loop
                                    muted
                                />
                                <a
                                    ref={downloadAnchorRef}
                                    href={downloadUrl || generatedVideoUrl}
                                    download="generated-video.mp4"
                                    className="mt-2 text-primary underline text-sm"
                                >
                                    Download Video
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </CollapsibleCard>
    );
};

export default VideoGeneration;
