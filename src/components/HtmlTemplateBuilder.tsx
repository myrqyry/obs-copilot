import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { Modal } from './common/Modal';
import { useAppStore } from '../store/appStore';
import { HtmlTemplateService, TemplateConfig } from '../services/htmlTemplateService';
import { catppuccinAccentColorsHexMap, CatppuccinAccentColorName } from '../types';
import ExternalHtmlRenderer from './ExternalHtmlRenderer';

interface HtmlTemplateBuilderProps {
    accentColorName: CatppuccinAccentColorName;
}

const HtmlTemplateBuilder: React.FC<HtmlTemplateBuilderProps> = ({
    accentColorName,
}) => {
    const { obsServiceInstance, currentProgramScene, isConnected } = useAppStore();

    const [selectedPreset, setSelectedPreset] = useState<string>('assets-showcase');
    const [customConfig, setCustomConfig] = useState<Partial<TemplateConfig>>({
        layout: 'overlay',
        content: {
            title: 'Custom Stream Element',
            subtitle: 'Generated by Gemini AI',
            body: 'Your custom content here',
        },
        colors: {
            primary: catppuccinAccentColorsHexMap[accentColorName],
            secondary: '#f2cdcd',
            accent: '#94e2d5',
            background: 'rgba(30, 30, 46, 0.9)',
            text: '#cdd6f4',
            border: '#45475a',
        },
        animations: {
            enabled: true,
            speed: 0.3,
            effects: {
                glow: 0,
                rainbow: false,
                pulse: false,
            },
        },
    });

    const [sourceName, setSourceName] = useState('Gemini-Template');
    const [sourceWidth, setSourceWidth] = useState(800);
    const [sourceHeight, setSourceHeight] = useState(600);
    const [isCreating, setIsCreating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [htmlContent, setHtmlContent] = useState('');
    const [customCss, setCustomCss] = useState('');

    const presets = HtmlTemplateService.getPresetTemplates();

    useEffect(() => {
        // Update preview URL when config changes
        setPreviewUrl(HtmlTemplateService.generateTemplateUrl(customConfig));
    }, [customConfig]);

    const handlePresetChange = (presetKey: string) => {
        setSelectedPreset(presetKey);
        const preset = presets[presetKey];
        // Only spread if preset is an object
        if (preset && typeof preset === 'object') {
            setCustomConfig({ ...customConfig, ...preset });
        }
    };

    const handleConfigChange = (
        section: keyof TemplateConfig,
        key: string,
        value: any
    ) => {
        setCustomConfig((prev: Partial<TemplateConfig>) => {
            // If section is empty string, update the root config property
            if (!section) {
                return { ...prev, [key]: value };
            }
            return {
                ...prev,
                [section]: {
                    ...((prev[section] as object) || {}),
                    [key]: value,
                },
            };
        });
    };

    const handleCreateBrowserSource = async () => {
        if (!obsServiceInstance || !currentProgramScene) {
            setFeedbackMessage('Please connect to OBS first');
            return;
        }

        setIsCreating(true);
        try {
            await HtmlTemplateService.createBrowserSourceWithTemplate(
                obsServiceInstance,
                sourceName,
                currentProgramScene,
                customConfig,
                sourceWidth,
                sourceHeight
            );
            setFeedbackMessage(`✅ Browser source "${sourceName}" created successfully!`);
        } catch (error: any) {
            console.error('Failed to create browser source:', error);
            setFeedbackMessage(`❌ Failed to create browser source: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateExistingSource = async () => {
        if (!obsServiceInstance) {
            setFeedbackMessage('Please connect to OBS first');
            return;
        }

        setIsCreating(true);
        try {
            await HtmlTemplateService.updateBrowserSourceTemplate(
                obsServiceInstance,
                sourceName,
                customConfig
            );
            setFeedbackMessage(`✅ Browser source "${sourceName}" updated successfully!`);
        } catch (error: any) {
            console.error('Failed to update browser source:', error);
            setFeedbackMessage(`❌ Failed to update browser source: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const copyTemplateUrl = () => {
        navigator.clipboard.writeText(previewUrl);
        setFeedbackMessage('📋 Template URL copied to clipboard!');
    };

    useEffect(() => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setHtmlContent(event.target?.result as string || '');
            };
            reader.readAsText(selectedFile);
        }
    }, [selectedFile]);

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {/* 📝 HTML Template Builder */}
                        <span role="img" aria-label="template">📝</span> HTML Template Builder
                    </h3>

                    {/* External HTML File Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Load External HTML:
                        </label>
                        <input
                            type="file"
                            accept=".html"
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                            onChange={(e) => {
                                setSelectedFile(e.target.files?.[0] || null);
                            }}
                        />
                    </div>

                    {/* Custom CSS Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Custom CSS:
                        </label>
                        <textarea
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground h-20 resize-none"
                            placeholder="Enter custom CSS"
                            value={customCss}
                            onChange={(e) => setCustomCss(e.target.value)}
                        />
                    </div>

                    {/* Preset Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Choose a Preset:</label>
                        <select
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                        >
                            {Object.keys(presets).map((key) => (
                                <option key={key} value={key}>
                                    {key.split('-').map(word =>
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title:</label>
                            <TextInput
                                value={customConfig.content?.title || ''}
                                onChange={(e) => handleConfigChange('content', 'title', e.target.value)}
                                placeholder="Enter title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Subtitle:</label>
                            <TextInput
                                value={customConfig.content?.subtitle || ''}
                                onChange={(e) => handleConfigChange('content', 'subtitle', e.target.value)}
                                placeholder="Enter subtitle"
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Body Text:</label>
                        <textarea
                            value={customConfig.content?.body || ''}
                            onChange={(e) => handleConfigChange('content', 'body', e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground h-20 resize-none"
                            placeholder="Enter body content (supports HTML)"
                        />
                    </div>

                    {/* Layout Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Layout:</label>
                            <select
                                value={customConfig.layout || 'overlay'}
                                onChange={(e) => handleConfigChange('layout', 'layout', e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                            >
                                <option value="overlay">Overlay</option>
                                <option value="fullscreen">Fullscreen</option>
                                <option value="corner">Corner</option>
                                <option value="sidebar">Sidebar</option>
                            </select>
                        </div>
                        {customConfig.layout === 'corner' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Position:</label>
                                <select
                                    value={customConfig.position || 'bottom-right'}
                                    onChange={(e) => handleConfigChange('position', 'position', e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                                >
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Animation Effects */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Animation Effects:</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.animations?.effects?.rainbow || false}
                                    onChange={(e) =>
                                        handleConfigChange('animations', 'effects', {
                                            ...customConfig.animations?.effects,
                                            rainbow: e.target.checked,
                                        })
                                    }
                                    className="rounded"
                                />
                                <span className="text-sm">🌈 Rainbow</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.animations?.effects?.pulse || false}
                                    onChange={(e) =>
                                        handleConfigChange('animations', 'effects', {
                                            ...customConfig.animations?.effects,
                                            pulse: e.target.checked,
                                        })
                                    }
                                    className="rounded"
                                />
                                <span className="text-sm">💓 Pulse</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm">🔥 Glow:</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    value={customConfig.animations?.effects?.glow || 0}
                                    onChange={(e) =>
                                        handleConfigChange('animations', 'effects', {
                                            ...customConfig.animations?.effects,
                                            glow: parseFloat(e.target.value),
                                        })
                                    }
                                    className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                    {customConfig.animations?.effects?.glow || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Source Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Source Name:</label>
                            <TextInput
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                                placeholder="Browser source name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Width:</label>
                            <TextInput
                                type="number"
                                value={sourceWidth.toString()}
                                onChange={(e) => setSourceWidth(parseInt(e.target.value) || 800)}
                                placeholder="800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Height:</label>
                            <TextInput
                                type="number"
                                value={sourceHeight.toString()}
                                onChange={(e) => setSourceHeight(parseInt(e.target.value) || 600)}
                                placeholder="600"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleCreateBrowserSource}
                            disabled={!isConnected || isCreating}
                            variant="primary"
                            accentColorName={accentColorName}
                        >
                            {isCreating ? 'Creating...' : '✨ Create Browser Source'}
                        </Button>
                        <Button
                            onClick={handleUpdateExistingSource}
                            disabled={!isConnected || isCreating}
                            variant="secondary"
                            accentColorName={accentColorName}
                        >
                            {isCreating ? 'Updating...' : '🛠 Update Existing'}
                        </Button>
                        <Button
                            onClick={() => setShowPreview(true)}
                            variant="secondary"
                            accentColorName={accentColorName}
                        >
                            🖥 Preview
                        </Button>
                        <Button
                            onClick={copyTemplateUrl}
                            variant="secondary"
                            accentColorName={accentColorName}
                        >
                            📋 Copy URL
                        </Button>
                    </div>

                    {/* Feedback Message */}
                    {feedbackMessage && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-sm">{feedbackMessage}</p>
                        </div>
                    )}
                    <ExternalHtmlRenderer htmlContent={htmlContent} customCss={customCss} />
                </CardContent>
            </Card>

            {/* Preview Modal */}
            {showPreview && (
                <Modal
                    title="Template Preview"
                    onClose={() => setShowPreview(false)}
                    accentColorName={accentColorName}
                >
                    <div className="space-y-4">
                        <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-2">Template URL:</p>
                            <code className="text-xs break-all bg-background p-2 rounded block">
                                {previewUrl}
                            </code>
                        </div>

                        <div className="border border-border rounded-md overflow-hidden">
                            <iframe
                                src={previewUrl}
                                width="100%"
                                height="400"
                                className="border-none"
                                title="Template Preview"
                            />
                        </div>

                        <div className="text-xs text-muted-foreground">
                            🛈 This preview shows how your template will look in OBS browser source
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default HtmlTemplateBuilder;
