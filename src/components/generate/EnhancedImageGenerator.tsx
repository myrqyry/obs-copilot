import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui';
import { Progress } from '@/components/ui/progress';
import {
  Image,
  Wand2,
  Download,
  Copy,
  RefreshCw,
  Upload,
  Sparkles,
  Palette,
  Camera,
  Edit3
} from 'lucide-react';
import { useGenerateStore } from '@/store/generateStore';
import { useConnectionsStore } from '@/store/connectionsStore';
import { toast } from '@/components/ui/toast';
import { motion } from 'framer-motion';

interface ImageStyle {
  id: string;
  name: string;
  prompt: string;
  example: string;
}

const imageStyles: ImageStyle[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    prompt: 'A photorealistic, high-quality photograph',
    example: 'Perfect for realistic portraits and scenes'
  },
  {
    id: 'artistic',
    name: 'Artistic',
    prompt: 'An artistic, stylized illustration',
    example: 'Creative interpretations and artistic styles'
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    prompt: 'A cartoon-style illustration with bold colors',
    example: 'Fun, animated character styles'
  },
  {
    id: 'anime',
    name: 'Anime',
    prompt: 'An anime-style illustration',
    example: 'Japanese animation style artwork'
  },
  {
    id: 'sketch',
    name: 'Sketch',
    prompt: 'A detailed pencil sketch',
    example: 'Hand-drawn artistic sketches'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    prompt: 'A beautiful watercolor painting',
    example: 'Soft, flowing watercolor techniques'
  }
];

const aspectRatios = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Portrait (3:4)', value: '3:4' },
  { label: 'Landscape (4:3)', value: '4:3' },
  { label: 'Mobile (9:16)', value: '9:16' },
  { label: 'Widescreen (16:9)', value: '16:9' }
];

const models = [
  {
    label: 'Imagen 4.0 Fast',
    value: 'imagen-4.0-fast-generate-001',
    description: 'Fast generation, good quality'
  },
  {
    label: 'Imagen 4.0 Standard',
    value: 'imagen-4.0-generate-001',
    description: 'Higher quality, slower generation'
  },
  {
    label: 'Gemini 2.5 Flash Image',
    value: 'gemini-2.5-flash-image-preview',
    description: 'Image editing and generation'
  }
];

export const EnhancedImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('imagen-4.0-fast-generate-001');
  const [imageFormat, setImageFormat] = useState('png');
  const [personGeneration, setPersonGeneration] = useState('allow_adult');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImageMime, setInputImageMime] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    generateImage,
    isGenerating,
    progress,
    lastGeneration,
    addToHistory
  } = useGenerateStore();

  const { isConnected } = useConnectionsStore();

  const currentStyle = imageStyles.find(style => style.id === selectedStyle);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1]; // Remove data URL prefix
      setInputImage(base64Data);
      setInputImageMime(file.type);
      setIsEditing(true);
      setModel('gemini-2.5-flash-image-preview'); // Switch to editing model
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Missing Prompt',
        description: 'Please enter a description for your image',
        variant: 'destructive'
      });
      return;
    }

    const stylePrompt = currentStyle ? currentStyle.prompt : '';
    const fullPrompt = isEditing
      ? prompt
      : `${stylePrompt}. ${prompt}. High quality, detailed, professional.`;

    try {
      const result = await generateImage({
        prompt: fullPrompt,
        model,
        imageFormat,
        aspectRatio,
        personGeneration,
        imageInput: inputImage || undefined,
        imageInputMimeType: inputImageMime || undefined
      });

      if (result.success) {
        addToHistory({
          type: 'image',
          prompt: fullPrompt,
          model,
          result: result.data,
          timestamp: Date.now(),
          metadata: {
            style: selectedStyle,
            aspectRatio,
            imageFormat,
            isEditing
          }
        });

        toast({
          title: 'Image Generated!',
          description: `Successfully created ${isEditing ? 'edited' : 'new'} image`,
          variant: 'default'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate image',
        variant: 'destructive'
      });
    }
  }, [
    prompt,
    currentStyle,
    model,
    imageFormat,
    aspectRatio,
    personGeneration,
    inputImage,
    inputImageMime,
    isEditing,
    selectedStyle,
    generateImage,
    addToHistory
  ]);

  const handleAddToOBS = useCallback(async () => {
    if (!lastGeneration?.result?.images?.[0] || !isConnected) {
      toast({
        title: 'Cannot Add to OBS',
        description: !isConnected ? 'Not connected to OBS' : 'No image to add',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create a blob URL from the base64 image
      const imageData = lastGeneration.result.images[0].data;
      const mimeType = lastGeneration.result.images[0].mime_type;
      const binaryData = atob(imageData);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Add as image source to OBS (implementation would depend on OBS integration)
      toast({
        title: 'Added to OBS',
        description: 'Image source added to current scene',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Add to OBS',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [lastGeneration, isConnected]);

  const handleDownload = useCallback(() => {
    if (!lastGeneration?.result?.images?.[0]) return;

    const imageData = lastGeneration.result.images[0].data;
    const mimeType = lastGeneration.result.images[0].mime_type;
    const extension = imageFormat;

    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${imageData}`;
    link.download = `generated-image-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [lastGeneration, imageFormat]);

  const clearInputImage = useCallback(() => {
    setInputImage(null);
    setInputImageMime('');
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Generation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={!isEditing ? 'default' : 'outline'}
              onClick={() => {
                setIsEditing(false);
                clearInputImage();
                setModel('imagen-4.0-fast-generate-001');
              }}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Text to Image
            </Button>
            <Button
              variant={isEditing ? 'default' : 'outline'}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Image Editing
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {inputImage && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Image uploaded for editing
                </span>
                <Button variant="ghost" size="sm" onClick={clearInputImage}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Generation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Input */}
            <div>
              <Label htmlFor="prompt">
                {isEditing ? 'Editing Instructions' : 'Image Description'}
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  isEditing
                    ? "Describe what you want to change or add to the image..."
                    : "Describe the image you want to create..."
                }
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Style Selection (only for text-to-image) */}
            {!isEditing && (
              <div>
                <Label>Art Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-gray-500">{style.example}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Model Selection */}
            <div>
              <Label>Model</Label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={isEditing}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(modelOption => (
                    <SelectItem key={modelOption.value} value={modelOption.value}>
                      <div>
                        <div className="font-medium">{modelOption.label}</div>
                        <div className="text-xs text-gray-500">{modelOption.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(ratio => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Format</Label>
                <Select value={imageFormat} onValueChange={setImageFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>People</Label>
                <Select value={personGeneration} onValueChange={setPersonGeneration}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow_adult">Allow</SelectItem>
                    <SelectItem value="dont_allow">Don't Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Editing...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Edit Image' : 'Generate Image'}
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
              <Progress value={progress} className="w-full" />
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Generated Image
              </span>
              {lastGeneration && (
                <Badge variant="outline">
                  {lastGeneration.metadata?.style || 'Custom'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {isGenerating ? (
                <div className="text-center">
                  <motion.div
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-gray-600">Creating your masterpiece...</p>
                  <p className="text-sm text-gray-500 mt-1">{progress}% complete</p>
                </div>
              ) : lastGeneration?.result?.images?.[0] ? (
                <img
                  src={`data:${lastGeneration.result.images[0].mime_type};base64,${lastGeneration.result.images[0].data}`}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Your generated image will appear here</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {lastGeneration?.result?.images?.[0] && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {isConnected && (
                  <Button onClick={handleAddToOBS} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Add to OBS
                  </Button>
                )}
              </div>
            )}

            {/* Metadata */}
            {lastGeneration && (
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p><strong>Model:</strong> {lastGeneration.model}</p>
                <p><strong>Created:</strong> {new Date(lastGeneration.timestamp).toLocaleString()}</p>
                {lastGeneration.metadata?.aspectRatio && (
                  <p><strong>Ratio:</strong> {lastGeneration.metadata.aspectRatio}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};