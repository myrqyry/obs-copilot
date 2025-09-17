// ImageEditor.tsx
import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui"";
import { Button } from "@/components/ui"";
import { TextInput } from "@/components/common/TextInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop, Download, ImagePlus, Scissors, Text, Filter, RefreshCcw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { ObsClientImpl as ObsClient } from '@/services/obsClient';
import { handleAppError, createToastError } from '@/lib/errorUtils';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/canvasUtils';

export const ImageEditor: React.FC = () => {
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

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

    useEffect(() => {
        return () => {
            if (inputUrl) URL.revokeObjectURL(inputUrl);
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            if (currentImage) URL.revokeObjectURL(currentImage);
        };
    }, [inputUrl, outputUrl, currentImage]);

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
                    <div className="relative w-full bg-muted rounded-lg border border-border flex items-center justify-center min-h-[300px] overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                                <div className="flex items-center gap-2 text-primary">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Processing...</span>
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

export default ImageEditor;
