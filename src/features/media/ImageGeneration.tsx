import React, { useState } from 'react';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import useSettingsStore from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import { ObsClientImpl as ObsClient } from '@/services/obsClient';
import { catppuccinAccentColorsHexMap } from '@/types';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { copyToClipboard } from '@/utils/persistence';
import { CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from "@/components/ui";
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { TextInput } from '@/components/common/TextInput';
import { ImageUpload } from '@/components/common/ImageUpload';
import { geminiService } from '@/services/geminiService';
import {
  IMAGE_FORMATS,
  ASPECT_RATIOS,
  PERSON_GENERATION_OPTIONS,
  ImageUploadResult,
} from '@/types/audio';
import { Settings, Sparkles } from 'lucide-react';
import { handleAppError, createToastError } from '@/lib/errorUtils'; // Import error utilities

const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [openImageGeneration, setOpenImageGeneration] = useState(true);

    // Enhanced parameters
    const [model, setModel] = useState('gemini-2.5-flash-image-preview');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [imageFormat, setImageFormat] = useState('png');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [personGeneration, setPersonGeneration] = useState('allow_adult');

    const { obsServiceInstance, currentProgramScene, isConnected } = useConnectionManagerStore();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const handleImageUpload = (file: File, base64: string) => {
        setUploadedImage({
            data: base64,
            mimeType: file.type,
            fileName: file.name,
            size: file.size,
            width: undefined,
            height: undefined
        });
    };

    const handleClearImage = () => {
        setUploadedImage(null);
    };

    const handleGenerateImage = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError(null);
        setImageUrls([]);

        try {
            const generatedImageUrls = await geminiService.generateImage(prompt, {
                model,
                numberOfImages,
                outputMimeType: `image/${imageFormat}`,
                aspectRatio,
                personGeneration,
                negativePrompt,
                imageInput: uploadedImage ? { data: uploadedImage.data, mimeType: uploadedImage.mimeType } : undefined,
            });

            setImageUrls(generatedImageUrls);
            setModalOpen(true);
        } catch (err: unknown) {
            setError(handleAppError('Image generation', err));
        } finally {
            setLoading(false);
        }
    };

    const handleAddAsSource = async (imageUrl: string, type: 'browser' | 'image') => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            toast(createToastError('Error', 'OBS not connected or no image generated.'));
            return;
        }
        try {
            if (type === 'browser') {
                await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            } else {
                await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            }
            toast({
                title: 'Success',
                description: `Added generated image to OBS as ${type} source.`,
                variant: 'default',
            });
        } catch (error: unknown) {
            toast(createToastError('Error', handleAppError(`Adding ${type} source`, error)));
        }
    };

    return (
        <CollapsibleCard
            title="Image Generation (Gemini)"
            emoji="🎨"
            isOpen={openImageGeneration}
            onToggle={() => setOpenImageGeneration(!openImageGeneration)}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className="space-y-4">
                    {/* Image Upload for Editing */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {uploadedImage ? 'Input Image (for editing)' : 'Upload Image (optional)'}
                        </label>
                        <ImageUpload
                            onImageSelect={handleImageUpload}
                            onClear={handleClearImage}
                            placeholder="Upload image to edit"
                            maxSizeMB={10}
                        />
                        {uploadedImage && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {uploadedImage.fileName} ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}
                    </div>

                    {/* Prompt Input */}
                    <TextInput
                        label="Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={uploadedImage
                            ? "Describe how to edit the image (e.g., 'make it more colorful', 'add a sunset')"
                            : "Describe the image you want to generate"
                        }
                    />

                    {/* Model Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Model</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full p-2 border-border rounded text-sm"
                        >
                            <option value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash (Fast, Good Quality)</option>
                            <option value="imagen-4.0-fast-generate-001">Imagen 4.0 (High Quality)</option>
                        </select>
                    </div>

                    {/* Negative Prompt */}
                    <TextInput
                        label="Negative Prompt (optional)"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="e.g., 'blurry', 'disfigured', 'watermark'"
                    />

                    {/* Advanced Parameters */}
                    <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Advanced Parameters
                            </h4>
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                {showAdvanced ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="space-y-3">
                                {/* Number of Images */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Number of Images</label>
                                    <input
                                        type="number"
                                        value={numberOfImages}
                                        onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
                                        min="1"
                                        max="4"
                                        className="w-full p-2 border-border rounded text-sm"
                                    />
                                </div>

                                {/* Aspect Ratio */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Aspect Ratio</label>
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                        className="w-full p-2 border-border rounded text-sm"
                                        disabled={model.startsWith('gemini')}
                                    >
                                        {ASPECT_RATIOS.map(ratio => (
                                            <option key={ratio.value} value={ratio.value}>
                                                {ratio.label} - {ratio.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Image Format */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Image Format</label>
                                    <select
                                        value={imageFormat}
                                        onChange={(e) => setImageFormat(e.target.value)}
                                        className="w-full p-2 border-border rounded text-sm"
                                        disabled={model.startsWith('gemini')}
                                    >
                                        {IMAGE_FORMATS.map(format => (
                                            <option key={format.value} value={format.value}>
                                                {format.label} - {format.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Person Generation */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Person Generation</label>
                                    <select
                                        value={personGeneration}
                                        onChange={(e) => setPersonGeneration(e.target.value)}
                                        className="w-full p-2 border-border rounded text-sm"
                                        disabled={model.startsWith('gemini')}
                                    >
                                        {PERSON_GENERATION_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} - {option.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generate Button */}
                    <Button onClick={handleGenerateImage} disabled={loading || !prompt}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loading ? 'Generating...' : (uploadedImage ? 'Edit Image' : 'Generate Image')}
                    </Button>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                </div>
                {modalOpen && (
                    <Modal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        title="Generated Images"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="space-y-2">
                                    <img src={url} alt={`Generated ${index + 1}`} className="max-w-full max-h-[60vh] mx-auto" />
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleAddAsSource(url, 'browser')} variant="default">Add as Browser Source</Button>
                                        <Button onClick={() => handleAddAsSource(url, 'image')} variant="secondary">Add as Image Source</Button>
                                        <Button onClick={() => { copyToClipboard(url); toast({ title: 'Info', description: 'Copied image URL!', variant: 'default' }); }}>Copy URL</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default ImageGeneration;
