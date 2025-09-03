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
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { TextInput } from '@/components/common/TextInput';
import { ImageUpload } from '@/components/common/ImageUpload';
import { geminiService } from '@/services/geminiService';
import {
  IMAGE_FORMATS,
  ASPECT_RATIOS,
  PERSON_GENERATION_OPTIONS,
  ImageUploadResult
} from '@/types/audio';
import { Settings, Sparkles } from 'lucide-react';
import { handleAppError, createToastError } from '@/lib/errorUtils'; // Import error utilities

const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<ImageUploadResult | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [openImageGeneration, setOpenImageGeneration] = useState(true);

    // Enhanced parameters
    const [model] = useState('gemini-2.0-flash-exp-image-generation');
    const [imageFormat, setImageFormat] = useState('png');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [personGeneration, setPersonGeneration] = useState('allow_adult');
    const [responseModalities] = useState<string[]>(['TEXT', 'IMAGE']);
    const [useEnhancedMode, setUseEnhancedMode] = useState(true);

    const { obsServiceInstance, currentProgramScene, isConnected } = useConnectionManagerStore();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const handleImageUpload = (file: File, base64: string) => {
        setUploadedImage({
            data: base64,
            mimeType: file.type,
            fileName: file.name,
            size: file.size,
            width: undefined, // Could extract from image if needed
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
        setImageUrl(null);

        try {
            let generatedImageUrl: string;

            if (useEnhancedMode && uploadedImage) {
                // Use enhanced image generation with editing capabilities
                generatedImageUrl = await geminiService.generateEnhancedImage(prompt, {
                    model,
                    responseModalities,
                    imageFormat,
                    aspectRatio,
                    personGeneration,
                    imageInput: uploadedImage.data,
                    imageInputMimeType: uploadedImage.mimeType
                });
            } else if (useEnhancedMode) {
                // Use enhanced image generation for new images
                generatedImageUrl = await geminiService.generateEnhancedImage(prompt, {
                    model,
                    responseModalities,
                    imageFormat,
                    aspectRatio,
                    personGeneration
                });
            } else {
                // Fallback to basic image generation
                generatedImageUrl = await geminiService.generateImage(prompt);
            }

            setImageUrl(generatedImageUrl);
            setModalOpen(true);
        } catch (err: unknown) {
            setError(handleAppError('Image generation', err));
        } finally {
            setLoading(false);
        }
    };

    const handleAddAsBrowserSource = async () => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene || !imageUrl) {
            toast(createToastError(
                'Error',
                'OBS not connected or no image generated.'
            ));
            return;
        }
        try {
            await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            toast({
                title: 'Success',
                description: 'Added generated image to OBS.',
                variant: 'default',
            });
        } catch (error: unknown) {
            toast(createToastError(
                'Error',
                handleAppError('Adding browser source', error)
            ));
        }
    };

    const handleAddAsImageSource = async () => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene || !imageUrl) {
            toast(createToastError(
                'Error',
                'OBS not connected or no image generated.'
            ));
            return;
        }
        try {
            await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            toast({
                title: 'Success',
                description: 'Added generated image to OBS.',
                variant: 'default',
            });
        } catch (error: unknown) {
            toast(createToastError(
                'Error',
                handleAppError('Adding image source', error)
            ));
        }
    };

    return (
        <CollapsibleCard
            title="Image Generation (Gemini)"
            emoji="🎨"
            accentColor={accentColor}
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

                    {/* Enhanced Mode Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="enhanced-mode"
                            checked={useEnhancedMode}
                            onChange={(e) => setUseEnhancedMode(e.target.checked)}
                        />
                        <label htmlFor="enhanced-mode" className="text-sm">
                            Use enhanced parameters
                        </label>
                        <Sparkles className="w-4 h-4" />
                    </div>

                    {/* Advanced Parameters */}
                    {useEnhancedMode && (
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
                                    {/* Aspect Ratio */}
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Aspect Ratio</label>
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full p-2 border rounded text-sm"
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
                                            className="w-full p-2 border rounded text-sm"
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
                                            className="w-full p-2 border rounded text-sm"
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
                    )}

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
                        title="Generated Image"
                        actions={[
                            { label: 'Add as Browser Source', onClick: handleAddAsBrowserSource, variant: 'primary' },
                            { label: 'Add as Image Source', onClick: handleAddAsImageSource, variant: 'secondary' },
                            { label: 'Copy URL', onClick: () => { copyToClipboard(imageUrl!); toast({ title: 'Info', description: 'Copied image URL!', variant: 'default' }); } },
                        ]}
                    >
                        {imageUrl && <img src={imageUrl} alt="Generated" className="max-w-full max-h-[70vh] mx-auto" />}
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default ImageGeneration;
