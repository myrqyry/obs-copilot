// src/features/media/AIImageEditor.tsx
import React, { useRef, useEffect, useCallback } from 'react';

import { 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Sparkles, 
  Wand2, 
  Download, 
  ImagePlus, 
  Crop, 
  RefreshCcw,
  EyeOff
} from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Modal } from "@/shared/components/ui/Modal";
import { Input } from "@/shared/components/ui/input";
import { TextInput } from "@/shared/components/common/TextInput";
import { ObsClientImpl as ObsClient } from '@/shared/services/obsClient';
import { useConnectionManagerStore } from '@/app/store/connectionManagerStore';

import Cropper from 'react-easy-crop';
import getCroppedImg from '@/shared/lib/canvasUtils';

import useImageEditorStore from '@/app/store/imageEditorStore';

import { geminiService } from '@/shared/services/geminiService';
import { generateSourceName } from '@/shared/utils/obsSourceHelpers';
import { handleAppError, createToastError } from '@/shared/lib/errorUtils';
import { toast } from "@/shared/components/ui/toast";
import Tooltip from "@/shared/components/ui/tooltip";



export const AIImageEditor: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Use store selectors for different aspects of the image editor
    const store = useImageEditorStore();
    const {
        inputUrl,
        outputUrl,
        currentImage,
        
        crop,
        zoom,
        rotation,
        aspect,
        croppedAreaPixels,
        isCropping,
        
        flipH,
        flipV,
        
        aiPrompt,
        aiLoading,
        aiError,
        generatedImages,
        showAiPanel,
        aiModel,
        aspectRatio,
        numberOfImages,
        showGeneratedImages,
        
        inputModalOpen,
        loading,
        
        setInputImage,
        setOutputImage,
        setCurrentImage,
        updateCrop,
        updateZoom,
        updateRotation,
        updateAspect,
        setCroppedAreaPixels,
        setIsCropping,
        setFlipH,
        setFlipV,
        
        setAiPrompt,
        setAiLoading,
        setAiError,
        setGeneratedImages,
        setShowAiPanel,
        setAiModel,
        setAspectRatio,
        setNumberOfImages,
        setShowGeneratedImages,
        
        setInputModalOpen,
        setLoading,
        resetManipulationStates,
        saveToHistory,
    } = store;
    
    const { obsClientInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

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
        flipH?: boolean,
        flipV?: boolean,
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

            ctx.drawImage(image, 0, 0, currentWidth, currentHeight);
            ctx.restore();

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



    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
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

    const handleAddAsSource = useCallback(async (url: string, title: string, type: 'browser' | 'image') => {
        if (!isConnected || !obsClientInstance) {
            createToastError('Not Connected', 'Please connect to OBS first');
            return;
        }
        try {
            const sourceName = generateSourceName(title);
            if (type === 'browser') {
                await (obsClientInstance as ObsClient).addBrowserSource(currentProgramScene, url, sourceName, 640, 360);
            } else {
                await (obsClientInstance as ObsClient).addImageSource(currentProgramScene, url, sourceName);
            }
            toast({ title: 'Success', description: `Added "${title}" as ${type} source` });
        } catch (error: any) {
            createToastError('Failed to Add Source', handleAppError(`Adding ${type} source`, error));
        }
    }, [isConnected, obsClientInstance, currentProgramScene]);

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





    const handleResetAll = useCallback(async () => {
        setCurrentImage(inputUrl || null);
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
            const generatedImageUrls = await geminiService.generateImage(aiPrompt, {
                model: aiModel,
                numberOfImages,
                outputMimeType: 'image/png',
                aspectRatio,
                personGeneration: 'allow_adult',
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

    const handleApplyFlip = useCallback(async (h: boolean, v: boolean) => {
        setFlipH(h);
        setFlipV(v);
        await applyManipulation(currentImage, { flipH: h, flipV: v });
    }, [currentImage, applyManipulation, setFlipH, setFlipV]);

    return (
        <Card className="w-full rounded-lg border border-border shadow-sm">
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
                                    <Select
                                        value={aiModel}
                                        onValueChange={(value) => setAiModel(value)}
                                    >
                                        <SelectTrigger className="w-full text-xs">
                                            <SelectValue placeholder="Select Model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash (Fast, Good Quality)</SelectItem>
                                            <SelectItem value="imagen-4.0-fast-generate-001">Imagen 4.0 (High Quality)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>



                                {/* AI Generation Controls */}
                                <div className="space-y-2">
                                    {!currentImage && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Count</label>
                                                    <Input
                                                        type="number"
                                                        value={numberOfImages}
                                                        onChange={(e) => setNumberOfImages(parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        max="4"
                                                        className="w-full text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Aspect</label>
                                                    <Select
                                                        value={aspectRatio}
                                                        onValueChange={(value) => setAspectRatio(value)}
                                                        disabled={aiModel.startsWith('gemini')}
                                                    >
                                                        <SelectTrigger className="w-full text-xs">
                                                            <SelectValue placeholder="Aspect Ratio" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1:1">1:1 Square</SelectItem>
                                                            <SelectItem value="16:9">16:9 Widescreen</SelectItem>
                                                            <SelectItem value="9:16">9:16 Vertical</SelectItem>
                                                            <SelectItem value="3:4">3:4 Portrait</SelectItem>
                                                            <SelectItem value="4:3">4:3 Standard</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Button 
                                        onClick={handleGenerateImage}
                                        disabled={aiLoading || !aiPrompt}
                                        className="w-full text-xs"
                                        size="sm"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {aiLoading ? 'Processing...' : 'Generate Image'}
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
                                <div className="grid grid-cols-1 gap-2">
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
                                                <Select value={aspect?.toString() || 'original'} onValueChange={(val) => updateAspect(val === 'original' ? undefined : Number(val))}>
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
                                        onCropChange={updateCrop}
                                        onZoomChange={updateZoom}
                                        onRotationChange={updateRotation}
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
                                        disabled={!aiPrompt}
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
        </Card>
    );
};

export default AIImageEditor;
