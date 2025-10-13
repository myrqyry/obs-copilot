// src/features/media/AIImageEditor.tsx
import * as React from "react";
import { useRef, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
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
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageUploadResult } from '@/types/audio';
import { ImageEditorTemplates } from './ImageEditorTemplates';
import { useImageEditorStore } from '@/store/imageEditorStore';

export const AIImageEditor: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Use store selectors for different aspects of the image editor
    const {
        inputUrl,
        currentImage,
        setInputImage,
        setCurrentImage,
        crop,
        zoom,
        rotation,
        aspect,
        isCropping,
        width,
        height,
        flipH,
        flipV,
        filter,
        textOverlay,
        textColor,
        textSize,
        textX,
        textY,
        croppedAreaPixels,
        updateCrop,
        updateZoom,
        updateRotation,
        updateAspect,
        setIsCropping,
        setCroppedAreaPixels,
        setFlipH,
        setFlipV,
        setFilter,
        resetManipulationStates,
        aiPrompt,
        aiLoading,
        aiError,
        generatedImages,
        showAiPanel,
        aiModel,
        aspectRatio,
        numberOfImages,
        uploadedImages,
        showGeneratedImages,
        setAiPrompt,
        setAiLoading,
        setAiError,
        setGeneratedImages,
        setShowAiPanel,
        setAiModel,
        setAspectRatio,
        setNumberOfImages,
        setUploadedImages,
        setShowGeneratedImages,
        saveToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        outputUrl,
        setOutputImage,
        inputModalOpen,
        setInputModalOpen,
        loading,
        setLoading,
    } = useImageEditorStore();
    
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

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
        setInputImage(url, file);
        setOutputImage(null);
        resetManipulationStates();
        saveToHistory();
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
            const ctx = canvas.getContext('2d');
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

            // Apply transformations
            if (operations.flipH || operations.flipV) {
                ctx.scale(operations.flipH ? -1 : 1, operations.flipV ? -1 : 1);
                ctx.translate(operations.flipH ? -targetWidth : 0, operations.flipV ? -targetHeight : 0);
            }

            // Apply filters
            if (operations.filter && operations.filter !== 'none') {
                ctx.filter = operations.filter;
            }

            // Draw the image
            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

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
    }, [setLoading, setCurrentImage]);

    const handleBackgroundRemoval = useCallback(async () => {
        if (!currentImage) return;
        
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
    }, [currentImage, setLoading, setCurrentImage]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, [setCroppedAreaPixels]);

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
    }, [currentImage, croppedAreaPixels, rotation, setLoading, setCurrentImage, setIsCropping]);

    const handleDownload = useCallback(async () => {
        if (!currentImage) return;
        
        try {
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = `edited-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed:", err);
            toast({ variant: "destructive", title: "Download failed", description: err instanceof Error ? err.message : String(err) });
        }
    }, [currentImage]);

    const handleApplyFilter = useCallback(async (newFilter: string) => {
        setFilter(newFilter);
        await applyManipulation(currentImage, { filter: newFilter });
    }, [currentImage, applyManipulation, setFilter]);

    const handleApplyResize = useCallback(async () => {
        await applyManipulation(currentImage, { resize: { width: width, height: height } });
    }, [currentImage, applyManipulation, width, height]);

    const handleApplyFlip = useCallback(async (h: boolean, v: boolean) => {
        setFlipH(h);
        setFlipV(v);
        await applyManipulation(currentImage, { flipH: h, flipV: v });
    }, [currentImage, applyManipulation, setFlipH, setFlipV]);

    const handleApplyTextOverlay = useCallback(async () => {
        await applyManipulation(currentImage, { 
            textOverlay: { 
                text: textOverlay, 
                color: textColor, 
                size: textSize, 
                x: textX, 
                y: textY 
            } 
        });
    }, [currentImage, applyManipulation, textOverlay, textColor, textSize, textX, textY]);

    const handleResetAll = useCallback(async () => {
        setCurrentImage(inputUrl);
        resetManipulationStates();
        toast({ title: "Reset", description: "All manipulations reset to original image." });
    }, [inputUrl, setCurrentImage, resetManipulationStates]);

    const handleRotate = useCallback(async (degrees: number) => {
        const newRotation = (rotation + degrees) % 360;
        updateRotation(newRotation);
        if (isCropping) {
            // If cropping, we need to apply the rotation
            await applyManipulation(currentImage, { crop: { croppedAreaPixels: croppedAreaPixels, rotation: newRotation } });
        }
    }, [rotation, isCropping, currentImage, croppedAreaPixels, applyManipulation, updateRotation]);

    // AI Image Generation
    const handleGenerateImage = async () => {
        if (!aiPrompt.trim()) {
            setAiError('Please enter a prompt');
            return;
        }

        // API key handled by backend proxy
        setAiLoading(true);
        setAiError(null);
        setGeneratedImages([]);

        try {
            const imageInput = uploadedImages.length > 0 
                ? { data: uploadedImages[0].data, mimeType: uploadedImages[0].mimeType } 
                : undefined;

            const generatedImageUrls = await geminiService.generateImage(aiPrompt, {
                model: aiModel,
                numberOfImages: numberOfImages,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
                personGeneration: 'allow_adult',
                imageInput,
            });

            setGeneratedImages(generatedImageUrls);
            setShowGeneratedImages(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
            setAiError(errorMessage);
            console.error('Image generation error:', err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleUseGeneratedImage = (imageUrl: string) => {
        setCurrentImage(imageUrl);
        setShowGeneratedImages(false);
        toast({ title: "Image Applied", description: "Generated image applied to editor." });
    };

    const handleUploadImages = (images: ImageUploadResult[]) => {
        setUploadedImages(images);
        toast({ title: "Images Uploaded", description: `${images.length} image(s) uploaded for AI processing.` });
    };

    // OBS Integration
    const handleAddToOBS = async () => {
        if (!currentImage || !isConnected || !obsServiceInstance) {
            toast({ variant: "destructive", title: "Error", description: "Please connect to OBS and load an image first." });
            return;
        }

        try {
            setLoading(true);
            const sourceName = generateSourceName('AI Generated Image');
            
            // Convert data URL to blob
            const response = await fetch(currentImage);
            const blob = await response.blob();
            
            // Create a file from the blob
            const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });
            
            // Upload to OBS
            await obsServiceInstance.call('CreateInput', {
                inputName: sourceName,
                inputKind: 'image_source',
                sceneName: currentProgramScene,
                inputSettings: {
                    file: currentImage
                }
            });

            toast({ title: "Success", description: `Image added to OBS as "${sourceName}"` });
        } catch (err) {
            console.error('OBS integration error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to add image to OBS';
            toast({ variant: "destructive", title: "OBS Error", description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">AI Image Editor</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setInputModalOpen(true)}
                        disabled={loading}
                    >
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Load Image
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={!currentImage || loading}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                    <Button
                        onClick={handleAddToOBS}
                        disabled={!currentImage || !isConnected || loading}
                    >
                        <Layers className="w-4 h-4 mr-2" />
                        Add to OBS
                    </Button>
                </div>
            </div>

            {/* Image Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Original Image</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt="Current image"
                                className="max-w-full max-h-[300px] object-contain"
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>No image loaded</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Preview</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                        {outputUrl ? (
                            <img
                                src={outputUrl}
                                alt="Processed image"
                                className="max-w-full max-h-[300px] object-contain"
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Apply manipulations to see preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Manipulations */}
                <CollapsibleCard title="Basic Manipulations" defaultOpen>
                    <div className="space-y-4">
                        {/* Crop Controls */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={isCropping ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsCropping(!isCropping)}
                                >
                                    <Crop className="w-4 h-4 mr-2" />
                                    {isCropping ? 'Exit Crop' : 'Crop'}
                                </Button>
                                {isCropping && (
                                    <Button
                                        size="sm"
                                        onClick={handleCropImage}
                                        disabled={!croppedAreaPixels}
                                    >
                                        Apply Crop
                                    </Button>
                                )}
                            </div>
                            
                            {isCropping && currentImage && (
                                <div className="relative h-64 border rounded-lg overflow-hidden">
                                    <Cropper
                                        image={currentImage}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={aspect}
                                        onCropChange={updateCrop}
                                        onZoomChange={updateZoom}
                                        onRotationChange={updateRotation}
                                        onCropComplete={onCropComplete}
                                        style={{
                                            containerStyle: { width: '100%', height: '100%' }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Rotation Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRotate(-90)}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-600">
                                {rotation}°
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRotate(90)}
                            >
                                <RotateCcw className="w-4 h-4 rotate-180" />
                            </Button>
                        </div>

                        {/* Flip Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={flipH ? "default" : "outline"}
                                onClick={() => handleApplyFlip(!flipH, flipV)}
                            >
                                <FlipHorizontal className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={flipV ? "default" : "outline"}
                                onClick={() => handleApplyFlip(flipH, !flipV)}
                            >
                                <FlipVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Filter Controls */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Filter</label>
                            <Select value={filter} onValueChange={handleApplyFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="grayscale(100%)">Grayscale</SelectItem>
                                    <SelectItem value="sepia(100%)">Sepia</SelectItem>
                                    <SelectItem value="hue-rotate(90deg)">Hue Rotate</SelectItem>
                                    <SelectItem value="saturate(200%)">Saturate</SelectItem>
                                    <SelectItem value="contrast(150%)">Contrast</SelectItem>
                                    <SelectItem value="brightness(1.2)">Brightness</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Button */}
                        <Button
                            variant="outline"
                            onClick={handleResetAll}
                            disabled={!inputUrl}
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reset All
                        </Button>
                    </div>
                </CollapsibleCard>

                {/* AI Features */}
                <CollapsibleCard title="AI Features" defaultOpen>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showAiPanel ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowAiPanel(!showAiPanel)}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Panel
                            </Button>
                        </div>

                        {showAiPanel && (
                            <div className="space-y-4 p-4 border rounded-lg">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">AI Prompt</label>
                                    <TextInput
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe the image you want to generate..."
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model</label>
                                        <Select value={aiModel} onValueChange={setAiModel}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Aspect Ratio</label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                                <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                                                <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                                                <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleGenerateImage}
                                        disabled={aiLoading || !aiPrompt.trim()}
                                        className="flex-1"
                                    >
                                        {aiLoading ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        ) : (
                                            <Wand2 className="w-4 h-4 mr-2" />
                                        )}
                                        Generate Image
                                    </Button>
                                </div>

                                {aiError && (
                                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                        {aiError}
                                    </div>
                                )}

                                {generatedImages.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Generated Images</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {generatedImages.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`Generated ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded border"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleUseGeneratedImage(url)}
                                                    >
                                                        Use This Image
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleCard>
            </div>

            {/* Input Modal */}
            <Modal
                title="Load Image"
                isOpen={inputModalOpen}
                onClose={() => setInputModalOpen(false)}
            >
                <div className="space-y-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                    >
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Choose File
                    </Button>
                    <ImageUpload
                        onImagesUploaded={handleUploadImages}
                        maxImages={5}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default AIImageEditor;
