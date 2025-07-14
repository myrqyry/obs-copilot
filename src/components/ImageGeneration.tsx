import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useAppStore } from '../store/appStore';
import { GeminiService } from '../services/geminiService';
import { CardContent } from './ui/Card';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import Tooltip from './ui/Tooltip';
import { Modal } from './common/Modal';
import { addBrowserSource, addImageSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { CollapsibleCard } from './common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '../types';
import { generateChuteImage } from '../services/chuteImageService';

const ImageGeneration: React.FC = () => {
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    // Provider selection: "gemini" or "chutes"
    const [imageProvider, setImageProvider] = useState<'gemini' | 'chutes'>('gemini');

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
    const addNotification = useAppStore((state) => state.actions.addNotification);

    // Use user Gemini API key if non-empty, else fall back to env
    const userGeminiApiKey = useAppStore(state => state.geminiApiKey);
    const geminiApiKey =
        (userGeminiApiKey && userGeminiApiKey.trim().length > 0)
            ? userGeminiApiKey.trim()
            : (
                (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY)
                || (typeof process !== "undefined" && process.env && process.env.VITE_GEMINI_API_KEY)
            );
    const accentColorName = useAppStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

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

    // Real API call for image generation using Gemini or Chute
    const handleGenerateImage = async () => {
        setImageLoading(true);
        setImageError(null);
        setGeneratedImage(null);
        try {
            if (imageProvider === 'gemini') {
                if (!geminiApiKey) {
                    setImageError('Gemini API key is missing. Please set it in the Connections tab.');
                    setImageLoading(false);
                    return;
                }
                const geminiService = new GeminiService();
                const prompt = `${imagePrompt}\nStyle: ${imageStyle}\nAspect Ratio: ${aspectRatio}\nQuality: ${quality}\nText Overlay: ${textOverlay}`;
                const response = await geminiService.generateImage(prompt);
                setGeneratedImage(response);
            } else if (imageProvider === 'chutes') {
                // Compose prompt and settings for Chutes
                let prompt = imagePrompt;
                if (imageStyle) prompt += `\nStyle: ${imageStyle}`;
                if (aspectRatio) prompt += `\nAspect Ratio: ${aspectRatio}`;
                if (quality) prompt += `\nQuality: ${quality}`;
                if (textOverlay) prompt += `\nText Overlay: ${textOverlay}`;

                // Chute does not support all settings, but pass width/height
                let width = 1024, height = 1024;
                if (aspectRatio === "4:3") { width = 1024; height = 768; }
                else if (aspectRatio === "3:4") { width = 768; height = 1024; }
                else if (aspectRatio === "16:9") { width = 1280; height = 720; }
                else if (aspectRatio === "9:16") { width = 720; height = 1280; }

                // Get user Chutes API key from localStorage (customApiKeys.chutes)
                let userChutesApiKey: string | undefined = undefined;
                try {
                    const stored = localStorage.getItem('customApiKeys');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed && typeof parsed === 'object' && parsed.chutes && typeof parsed.chutes === 'string') {
                            userChutesApiKey = parsed.chutes;
                        }
                    }
                } catch { }

                const { imageUrl, error } = await generateChuteImage({
                    prompt,
                    width,
                    height,
                    apiKey: userChutesApiKey,
                    // You can add more settings here if you want to expose them
                });
                if (error) {
                    setImageError(error);
                } else if (imageUrl) {
                    setGeneratedImage(imageUrl);
                } else {
                    setImageError("Unknown error from Chute.");
                }
            }
        } catch (err: any) {
            setImageError(err.message || 'Image generation failed.');
        } finally {
            setImageLoading(false);
        }
    };

    return (
        <CollapsibleCard
            title="Image Generation & Editing"
            emoji="🖼️"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className="text-xs md:text-sm text-muted-foreground mb-2">
                    Generate or edit images using AI. Enter a prompt and click <span className="font-semibold">Generate</span>.
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    {/* Provider selection */}
                    <label className="text-xs flex flex-col w-32">
                        <span className="mb-1 text-ctp-mauve">Provider</span>
                        <select
                            value={imageProvider}
                            onChange={e => setImageProvider(e.target.value as 'gemini' | 'chutes')}
                            className="glass-input bg-ctp-base border-ctp-surface1 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150 rounded px-2 py-1 text-xs"
                            disabled={imageLoading}
                        >
                            <option value="gemini">Gemini 2.0 Flash Preview</option>
                            <option value="chutes">Flux.1 Dev via chutes.ai</option>
                        </select>
                    </label>
                    <TextInput
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        placeholder="Describe your image..."
                        className="flex-1 text-sm"
                        disabled={imageLoading}
                        variant="glass"
                        size="md"
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
                    {/* Only show options supported by the selected provider */}
                    {imageProvider === "gemini" && (
                        <>
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
                        </>
                    )}
                    {imageProvider === "chutes" && (
                        <>
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
                            {/* Only aspect ratio is exposed for Chute, as per schema */}
                        </>
                    )}
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
                                        addNotification({ message: "OBS not connected.", type: 'error' });
                                        return;
                                    }
                                    await addImageSource(obsServiceInstance, currentProgramScene, generatedImage, generateSourceName("Generated Image"));
                                    setImageModalOpen(false);
                                    addNotification({ message: "Added image to OBS.", type: 'success' });
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
                                        addNotification({ message: "OBS not connected.", type: 'error' });
                                        return;
                                    }
                                    await addBrowserSource(obsServiceInstance, currentProgramScene, generatedImage, generateSourceName("Generated Image"));
                                    setImageModalOpen(false);
                                    addNotification({ message: "Added browser source to OBS.", type: 'success' });
                                },
                                variant: "secondary"
                            },
                            {
                                label: "Copy Image URL",
                                onClick: () => {
                                    copyToClipboard(generatedImage);
                                    setImageModalOpen(false);
                                    addNotification({ message: "Copied image URL!", type: 'info' });
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
            </CardContent>
        </CollapsibleCard>
    );
};

export default ImageGeneration;
