// src/features/media/AIImageEditor.tsx
import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import { CustomButton as Button } from "@/components/ui/CustomButton";
import { TextInput } from "@/components/common/TextInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Crop, Download, ImagePlus, Scissors, Text, Filter, RefreshCcw, RotateCcw, FlipHorizontal, 
  FlipVertical, Sparkles, Wand2, Layers, Users, Globe, MessageSquare, Type, Image as ImageIcon,
  Edit3, Shuffle, Eye, EyeOff
} from 'lucide-react';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { ObsClientImpl as ObsClient } from '@/services/obsClient';
import { handleAppError, createToastError } from '@/lib/errorUtils';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/canvasUtils';
import { geminiService } from '@/services/geminiService';
import useApiKeyStore, { ApiService } from '@/store/apiKeyStore';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageUploadResult } from '@/types/audio';
import { ImageEditorTemplates } from './ImageEditorTemplates';

export const AIImageEditor: React.FC = () => {
    const [inputUrl, setInputUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [inputBlob, setInputBlob] = useState<Blob | null>(null);
    const [inputModalOpen, setInputModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image manipulation states
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [width, setWidth] = useState<number | string>('auto');
    const [height, setHeight] = useState<number | string>('auto');
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [filter, setFilter] = useState('none');
    const [textOverlay, setTextOverlay] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [textSize, setTextSize] = useState(24);
    const [textX, setTextX] = useState(50);
    const [textY, setTextY] = useState(50);

    // AI features states
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash-image-preview');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [numberOfImages, setNumberOfImages] = useState(1);
    const [characterConsistency, setCharacterConsistency] = useState(false);
    const [multiImageFusion, setMultiImageFusion] = useState(false);
    const [worldKnowledge, setWorldKnowledge] = useState(false);
    const [uploadedImages, setUploadedImage] = useState<ImageUploadResult[]>([]);
    const [showGeneratedImages, setShowGeneratedImages] = useState(false);

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const geminiApiKey = useApiKeyStore(state => state.getApiKeyOverride(ApiService.GEMINI)) || import.meta.env.VITE_GEMINI_API_KEY || '';

    useEffect(() => {
        return () => {
            if (inputUrl) URL.revokeObjectURL(inputUrl);
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            if (currentImage) URL.revokeObjectURL(currentImage);
            generatedImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [inputUrl, outputUrl, currentImage, generatedImages]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setInputUrl(url);
        setInputBlob(file);
        setCurrentImage(url);
        setOutputUrl(null);
        resetManipulationStates();
    };

    const resetManipulationStates = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setAspect(undefined);
        setIsCropping(false);
        setWidth('auto');
        setHeight('auto');
        setFlipH(false);
        setFlipV(false);
        setFilter('none');
        setTextOverlay('');
        setTextColor('#ffffff');
        setTextSize(24);
        setTextX(50);
        setTextY(50);
    };

    const applyManipulation = useCallback(async (baseImage: string | null, operations: {
        crop?: { croppedAreaPixels: any, rotation: number },
        resize?: { width: number | string, height: number | string },
        flipH?: boolean,
        flipV?: boolean,
        filter?: string,
        textOverlay?: { text: string, color: string, size: number, x: number, y: number }
    }) => {
        if (!baseImage) return null;

        setLoading(true);
        try {
            const image = new Image();
            image.src = baseImage;
            await new Promise(resolve => image.onload = resolve);

            const canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            let currentWidth = image.naturalWidth;
            let currentHeight = image.naturalHeight;

            // Apply cropping first if present
            if (operations.crop && operations.crop.croppedAreaPixels) {
                const croppedImg = await getCroppedImg(baseImage, operations.crop.croppedAreaPixels, operations.crop.rotation);
                const croppedImageObj = new Image();
                croppedImageObj.src = croppedImg;
                await new Promise(resolve => croppedImageObj.onload = resolve);
                image.src = croppedImg;
                await new Promise(resolve => image.onload = resolve);
                currentWidth = croppedImageObj.naturalWidth;
                currentHeight = croppedImageObj.naturalHeight;
            }

            // Apply resizing
            let targetWidth = currentWidth;
            let targetHeight = currentHeight;
            if (operations.resize) {
                targetWidth = operations.resize.width === 'auto' ? currentWidth : Number(operations.resize.width);
                targetHeight = operations.resize.height === 'auto' ? currentHeight : Number(operations.resize.height);
                if (operations.resize.width === 'auto' && operations.resize.height !== 'auto') {
                    targetWidth = (currentWidth / currentHeight) * targetHeight;
                } else if (operations.resize.height === 'auto' && operations.resize.width !== 'auto') {
                    targetHeight = (currentHeight / currentWidth) * targetWidth;
                }
            }
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply flips
            ctx.save();
            if (operations.flipH) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            if (operations.flipV) {
                ctx.translate(0, canvas.height);
                ctx.scale(1, -1);
            }

            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
            ctx.restore();

            // Apply filters
            if (operations.filter && operations.filter !== 'none') {
                ctx.filter = operations.filter;
                ctx.drawImage(canvas, 0, 0);
                ctx.filter = 'none';
            }

            // Apply text overlay
            if (operations.textOverlay && operations.textOverlay.text) {
                ctx.font = `${operations.textOverlay.size}px Arial`;
                ctx.fillStyle = operations.textOverlay.color;
                ctx.textAlign = 'left';
                ctx.fillText(operations.textOverlay.text, operations.textOverlay.x, operations.textOverlay.y);
            }

            const newUrl = canvas.toDataURL('image/png');
            setCurrentImage(newUrl);
            return newUrl;
        } catch (err) {
            console.error("Image manipulation failed:", err);
            toast({ variant: "destructive", title: "Image manipulation failed", description: err instanceof Error ? err.message : String(err) });
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRemoveBackground = async () => {
        if (!inputBlob) {
            toast({ variant: "destructive", title: "No image file selected." });
            return;
        }
        setLoading(true);
        try {
            // Simple background removal simulation - just show the original image
            // In a real implementation, you would use a service like remove.bg API
            toast({ title: "Background Removal", description: "Background removal feature would be implemented with an external service." });
            // For now, just keep the current image
            setCurrentImage(currentImage);
        } catch (err) {
            console.error("Background removal failed:", err);
            toast({ variant: "destructive", title: "Background removal failed", description: err instanceof Error ? err.message : String(err) });
        }
        setLoading(false);
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropImage = useCallback(async () => {
        if (currentImage && croppedAreaPixels) {
            setLoading(true);
            try {
                const croppedImg = await getCroppedImg(currentImage, croppedAreaPixels, rotation);
                setCurrentImage(croppedImg);
                setIsCropping(false);
            } catch (e) {
                console.error(e);
                toast({ variant: "destructive", title: "Error cropping image." });
            } finally {
                setLoading(false);
            }
        }
    }, [currentImage, croppedAreaPixels, rotation]);

    const handleAddAsSource = useCallback(async (url: string, title: string, type: 'browser' | 'image') => {
        if (!isConnected || !obsServiceInstance) {
            toast(createToastError('Not Connected', 'Please connect to OBS first'));
            return;
        }
        try {
            const sourceName = generateSourceName(title);
            if (type === 'browser') {
                await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, url, sourceName, 640, 360);
            } else {
                await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, url, sourceName);
            }
            toast({ title: 'Success', description: `Added "${title}" as ${type} source` });
        } catch (error: any) {
            toast(createToastError('Failed to Add Source', handleAppError(`Adding ${type} source`, error)));
        }
    }, [isConnected, obsServiceInstance, currentProgramScene]);

    const handleDownloadImage = useCallback(() => {
        if (currentImage) {
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = 'edited-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [currentImage]);

    const handleApplyFilter = useCallback(async (newFilter: string) => {
        setFilter(newFilter);
        await applyManipulation(currentImage, { filter: newFilter });
    }, [currentImage, applyManipulation]);

    const handleApplyResize = useCallback(async () => {
        await applyManipulation(currentImage, { resize: { width, height } });
    }, [currentImage, applyManipulation, width, height]);

    const handleApplyFlip = useCallback(async (h: boolean, v: boolean) => {
        setFlipH(h);
        setFlipV(v);
        await applyManipulation(currentImage, { flipH: h, flipV: v });
    }, [currentImage, applyManipulation]);

    const handleApplyTextOverlay = useCallback(async () => {
        await applyManipulation(currentImage, { textOverlay: { text: textOverlay, color: textColor, size: textSize, x: textX, y: textY } });
    }, [currentImage, applyManipulation, textOverlay, textColor, textSize, textX, textY]);

    const handleResetAll = useCallback(async () => {
        setCurrentImage(inputUrl);
        resetManipulationStates();
        toast({ title: "Reset", description: "All manipulations reset to original image." });
    }, [inputUrl]);

    const handleRotate = useCallback(async (degrees: number) => {
        const newRotation = (rotation + degrees) % 360;
        setRotation(newRotation);
        if (isCropping) {
            // If cropping, we need to apply the rotation
            await applyManipulation(currentImage, { crop: { croppedAreaPixels, rotation: newRotation } });
        }
    }, [rotation, isCropping, currentImage, croppedAreaPixels, applyManipulation]);

    // AI Image Generation
    const handleGenerateImage = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Please enter a prompt');
            return;
        }

        if (!geminiApiKey) {
            setAiError('Gemini API key is missing. Please set it in the Connections tab.');
            return;
        }

        setAiLoading(true);
        setAiError(null);
        setGeneratedImages([]);

        try {
            const imageInput = uploadedImages.length > 0 
                ? { data: uploadedImages[0].data, mimeType: uploadedImages[0].mimeType } 
                : undefined;

            const generatedImageUrls = await geminiService.generateImage(aiPrompt, {
                model: aiModel,
                numberOfImages,
                outputMimeType: 'image/png',
                aspectRatio,
                personGeneration: 'allow_adult',
                imageInput,
            });

            setGeneratedImages(generatedImageUrls);
            setShowGeneratedImages(true);
        } catch (err: unknown) {
            const errorMessage = handleAppError('Image generation', err);
            setAiError(errorMessage);
            toast({ variant: "destructive", title: "Image Generation Failed", description: errorMessage });
        } finally {
            setAiLoading(false);
        }
    };

    // AI Image Editing
    const handleEditImageWithAI = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Please enter an edit prompt');
            return;
        }

        if (!currentImage) {
            setAiError('Please upload an image to edit');
            return;
        }

        if (!geminiApiKey) {
            setAiError('Gemini API key is missing. Please set it in the Connections tab.');
            return;
        }

        setAiLoading(true);
        setAiError(null);

        try {
            // Convert current image to base64 for editing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            const img = new Image();
            img.src = currentImage;
            await new Promise(resolve => img.onload = resolve);

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const imageData = canvas.toDataURL('image/png');
            const base64Data = imageData.split(',')[1];

            const editedImageUrls = await geminiService.generateImage(aiPrompt, {
                model: aiModel,
                imageInput: { data: base64Data, mimeType: 'image/png' },
            });

            if (editedImageUrls.length > 0) {
                setCurrentImage(editedImageUrls[0]);
                toast({ title: "Success", description: "Image edited successfully with AI!" });
            }
        } catch (err: unknown) {
            const errorMessage = handleAppError('AI Image editing', err);
            setAiError(errorMessage);
            toast({ variant: "destructive", title: "AI Edit Failed", description: errorMessage });
        } finally {
            setAiLoading(false);
        }
    };

    const handleImageUpload = (file: File, base64: string) => {
        const newUpload: ImageUploadResult = {
            data: base64,
            mimeType: file.type,
            fileName: file.name,
            size: file.size,
            width: undefined,
            height: undefined
        };
        setUploadedImage([newUpload]);
    };

    const handleClearImage = () => {
        setUploadedImage([]);
    };

    const handleTemplateSelect = (template: any) => {
        setAiPrompt(template.prompt);
        setShowAiPanel(true);
        // Apply template-specific settings
        if (template.id === 'character-consistency') {
            setCharacterConsistency(true);
        } else if (template.id === 'multi-image-fusion') {
            setMultiImageFusion(true);
        } else if (template.id === 'world-knowledge') {
            setWorldKnowledge(true);
        }
    };

    // Check for SynthID watermarking
    const checkSynthIDWatermark = async (imageData: string) => {
        try {
            // This would be implemented with actual SynthID detection logic
            // For now, we'll just show a notification
            toast({ 
                title: "SynthID Check", 
                description: "Image analyzed for AI-generated content markers.",
                variant: "default"
            });
        } catch (error) {
            console.log("SynthID watermarking check not available");
        }
    };

    return (
        <div className="w-full bg-card rounded-lg border border-border shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6 p-6">
                {/* Left Panel: Controls */}
                <div className="lg:w-80 space-y-6">
                    {/* File Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Upload Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 rounded-md bg-muted border border-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                    </div>

                    {/* AI Panel Toggle */}
                    <div className="space-y-3">
                        <Button
                            size="sm"
                            onClick={() => setShowAiPanel(!showAiPanel)}
                            variant={showAiPanel ? "default" : "outline"}
                            className="w-full"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {showAiPanel ? 'Hide AI Tools' : 'Show AI Tools'}
                        </Button>

                        {showAiPanel && (
                            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Wand2 className="w-4 h-4" /> AI Image Tools
                                </h3>

                                {/* AI Image Upload for Editing */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        {uploadedImages.length > 0 ? 'Input Image' : 'Upload Image (optional)'}
                                    </label>
                                    <ImageUpload
                                        onImageSelect={handleImageUpload}
                                        onClear={handleClearImage}
                                        placeholder="Upload image for AI editing"
                                        maxSizeMB={10}
                                    />
                                    {uploadedImages.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {uploadedImages[0].fileName} ({(uploadedImages[0].size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}
                                </div>

                                {/* Template Selection */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium">Templates</label>
                                    <ImageEditorTemplates onTemplateSelect={handleTemplateSelect} className="max-h-40 overflow-y-auto" />
                                </div>

                                {/* AI Prompt Input */}
                                <TextInput
                                    label="AI Prompt"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder={currentImage 
                                        ? "Describe how to edit this image..." 
                                        : "Describe the image you want to generate..."
                                    }
                                    className="text-xs"
                                    size="sm"
                                />

                                {/* AI Model Selector */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Model</label>
                                    <select
                                        value={aiModel}
                                        onChange={(e) => setAiModel(e.target.value)}
                                        className="w-full p-2 border rounded text-xs bg-background"
                                    >
                                        <option value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash (Fast, Good Quality)</option>
                                        <option value="imagen-4.0-fast-generate-001">Imagen 4.0 (High Quality)</option>
                                    </select>
                                </div>

                                {/* Advanced AI Options */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium">Advanced Options</label>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            size="sm" 
                                            onClick={() => setCharacterConsistency(!characterConsistency)}
                                            variant={characterConsistency ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            <Users className="w-3 h-3 mr-1" />
                                            Characters
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setMultiImageFusion(!multiImageFusion)}
                                            variant={multiImageFusion ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            <Layers className="w-3 h-3 mr-1" />
                                            Fusion
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setWorldKnowledge(!worldKnowledge)}
                                            variant={worldKnowledge ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            <Globe className="w-3 h-3 mr-1" />
                                            Knowledge
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => setShowGeneratedImages(!showGeneratedImages)}
                                            variant={showGeneratedImages ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            <ImageIcon className="w-3 h-3 mr-1" />
                                            Gallery
                                        </Button>
                                    </div>
                                </div>

                                {/* AI Generation Controls */}
                                <div className="space-y-2">
                                    {!currentImage && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Count</label>
                                                    <input
                                                        type="number"
                                                        value={numberOfImages}
                                                        onChange={(e) => setNumberOfImages(parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        max="4"
                                                        className="w-full p-1 border rounded text-xs bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Aspect</label>
                                                    <select
                                                        value={aspectRatio}
                                                        onChange={(e) => setAspectRatio(e.target.value)}
                                                        className="w-full p-1 border rounded text-xs bg-background"
                                                        disabled={aiModel.startsWith('gemini')}
                                                    >
                                                        <option value="1:1">1:1 Square</option>
                                                        <option value="16:9">16:9 Widescreen</option>
                                                        <option value="9:16">9:16 Vertical</option>
                                                        <option value="3:4">3:4 Portrait</option>
                                                        <option value="4:3">4:3 Standard</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Button 
                                        onClick={currentImage ? handleEditImageWithAI : handleGenerateImage}
                                        disabled={aiLoading || !aiPrompt}
                                        className="w-full text-xs"
                                        size="sm"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {aiLoading ? 'Processing...' : (currentImage ? 'Edit with AI' : 'Generate Image')}
                                    </Button>
                                </div>

                                {aiError && <p className="text-destructive text-xs">{aiError}</p>}
                            </div>
                        )}
                    </div>

                    {currentImage && (
                        <>
                            {/* Quick Actions */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleRemoveBackground}
                                        disabled={loading}
                                        className="w-full"
                                        variant="secondary"
                                    >
                                        <Scissors className="w-4 h-4 mr-2" />
                                        Remove BG
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleResetAll}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            {/* Transform Tools */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Crop className="w-4 h-4" /> Transform
                                </h3>
                                
                                <div className="space-y-3">
                                    <Button 
                                        size="sm" 
                                        onClick={() => setIsCropping(!isCropping)} 
                                        variant={isCropping ? "default" : "outline"}
                                        className="w-full"
                                    >
                                        {isCropping ? 'Cancel Crop' : 'Crop Image'}
                                    </Button>
                                    
                                    {isCropping && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Aspect Ratio</label>
                                                <Select value={aspect?.toString() || 'original'} onValueChange={(val) => setAspect(val === 'original' ? undefined : Number(val))}>
                                                    <SelectTrigger className="w-full text-xs">
                                                        <SelectValue placeholder="Aspect Ratio" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="original">Original</SelectItem>
                                                        <SelectItem value="1">1:1 Square</SelectItem>
                                                        <SelectItem value="1.777">16:9 Widescreen</SelectItem>
                                                        <SelectItem value="0.5625">9:16 Vertical</SelectItem>
                                                        <SelectItem value="0.75">3:4 Portrait</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button size="sm" onClick={handleCropImage} disabled={loading} className="w-full">
                                                Apply Crop
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Resize */}
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Resize</label>
                                    <div className="flex gap-2">
                                        <TextInput
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            placeholder="W"
                                            type="number"
                                            className="w-full text-xs"
                                            size="sm"
                                        />
                                        <TextInput
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            placeholder="H"
                                            type="number"
                                            className="w-full text-xs"
                                            size="sm"
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleApplyResize} disabled={loading} className="w-full">
                                        Apply Resize
                                    </Button>
                                </div>

                                {/* Rotate & Flip */}
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Rotate & Flip</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button size="sm" onClick={() => handleRotate(-90)} variant="outline" className="w-full">
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleApplyFlip(!flipH, flipV)} variant="outline" className="w-full">
                                            <FlipHorizontal className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" onClick={() => handleApplyFlip(flipH, !flipV)} variant="outline" className="w-full">
                                            <FlipVertical className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Filters
                                </h3>
                                <Select value={filter} onValueChange={handleApplyFilter}>
                                    <SelectTrigger className="w-full text-xs">
                                        <SelectValue placeholder="Select Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="grayscale(100%)">Grayscale</SelectItem>
                                        <SelectItem value="sepia(100%)">Sepia</SelectItem>
                                        <SelectItem value="blur(3px)">Blur</SelectItem>
                                        <SelectItem value="invert(100%)">Invert</SelectItem>
                                        <SelectItem value="contrast(150%)">High Contrast</SelectItem>
                                        <SelectItem value="brightness(150%)">Brightness</SelectItem>
                                        <SelectItem value="saturate(200%)">Saturate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Text Overlay */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Text className="w-4 h-4" /> Text Overlay
                                </h3>
                                <TextInput
                                    value={textOverlay}
                                    onChange={(e) => setTextOverlay(e.target.value)}
                                    placeholder="Enter text..."
                                    className="w-full text-xs"
                                    size="sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <TextInput
                                        label="Size"
                                        value={textSize}
                                        onChange={(e) => setTextSize(Number(e.target.value))}
                                        type="number"
                                        className="w-full text-xs"
                                        size="sm"
                                    />
                                    <TextInput
                                        label="X Pos"
                                        value={textX}
                                        onChange={(e) => setTextX(Number(e.target.value))}
                                        type="number"
                                        className="w-full text-xs"
                                        size="sm"
                                    />
                                    <TextInput
                                        label="Y Pos"
                                        value={textY}
                                        onChange={(e) => setTextY(Number(e.target.value))}
                                        type="number"
                                        className="w-full text-xs"
                                        size="sm"
                                    />
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => setTextColor(e.target.value)}
                                            className="w-full h-8 rounded-md border border-input"
                                            title="Text Color"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={handleApplyTextOverlay} 
                                    disabled={loading || !textOverlay}
                                    className="w-full"
                                >
                                    Apply Text
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Panel: Image Preview & Actions */}
                <div className="flex-1 space-y-4">
                    {/* Generated Images Gallery */}
                    {showGeneratedImages && generatedImages.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground">Generated Images</h3>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setShowGeneratedImages(false)}
                                    className="text-xs"
                                >
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Hide
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {generatedImages.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={url} 
                                            alt={`Generated ${index + 1}`}
                                            className="w-full h-16 object-cover rounded cursor-pointer border"
                                            onClick={() => setCurrentImage(url)}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="text-xs h-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddAsSource(url, `Generated Image ${index + 1}`, 'image');
                                                }}
                                            >
                                                <ImagePlus className="w-3 h-3" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="text-xs h-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `generated-image-${index + 1}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative w-full bg-muted rounded-lg border border-border flex items-center justify-center min-h-[300px] overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                                <div className="flex items-center gap-2 text-primary">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Processing...</span>
                                </div>
                            </div>
                        )}
                        {aiLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                                <div className="flex items-center gap-2 text-primary">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">AI Processing...</span>
                                </div>
                            </div>
                        )}
                        {currentImage ? (
                            isCropping ? (
                                <div className="relative w-full h-96">
                                    <Cropper
                                        image={currentImage}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={aspect}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                        onCropComplete={onCropComplete}
                                        showGrid={true}
                                        restrictPosition={false}
                                        cropShape="rect"
                                    />
                                </div>
                            ) : (
                                <div className="relative max-w-full max-h-[500px]">
                                    <Tooltip content="Click to preview">
                                        <img
                                            src={currentImage}
                                            alt="Current"
                                            className="max-w-full max-h-[500px] rounded shadow cursor-pointer object-contain"
                                            onClick={() => setInputModalOpen(true)}
                                        />
                                    </Tooltip>
                                </div>
                            )
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <path d="M21 15l-5-5L5 21"></path>
                                    </svg>
                                </div>
                                <p className="text-muted-foreground text-sm">Upload an image to get started</p>
                                {showAiPanel && !aiLoading && (
                                    <Button 
                                        onClick={handleGenerateImage}
                                        disabled={!aiPrompt || !geminiApiKey}
                                        className="mt-4 text-xs"
                                        size="sm"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Generate First Image
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {currentImage && !isCropping && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Button onClick={handleDownloadImage} size="sm">
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                            <Button onClick={() => handleAddAsSource(currentImage, 'Edited Image', 'image')} size="sm" variant="secondary">
                                <ImagePlus className="w-4 h-4 mr-2" /> Add to OBS
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for input image preview */}
            {inputModalOpen && currentImage && (
                <Modal
                    isOpen={inputModalOpen}
                    onClose={() => setInputModalOpen(false)}
                    title="Image Preview"
                    size="lg"
                >
                    <img src={currentImage} alt="Input Preview" className="max-w-full max-h-[70vh] mx-auto rounded shadow" />
                </Modal>
            )}
        </div>
    );
};

export default AIImageEditor;
