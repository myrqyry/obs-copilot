import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from './ui/use-toast';
import { ObsClient } from '../services/ObsClient';
import { catppuccinAccentColorsHexMap } from '../types';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import { Modal } from './common/Modal';
import { Button } from './ui/Button';
import { FaviconIcon } from './common/FaviconIcon';
import Tooltip from './ui/Tooltip';
import { FaviconDropdown } from './common/FaviconDropdown';
import { CollapsibleCard } from './common/CollapsibleCard';
import { TextInput } from './common/TextInput';

const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(1024);
    const [steps, setSteps] = useState(20);
    const [cfg, setCfg] = useState(7);
    const [seed, setSeed] = useState(-1);
    const [sampler, setSampler] = useState('Euler a');
    const [model, setModel] = useState('sd_xl_base_1.0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const { obsServiceInstance, currentProgramScene, isConnected } = useConnectionManagerStore();
    const { toast } = useToast();

    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const handleGenerateImage = async () => {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const response = await fetch('/api/image/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    negative_prompt: negativePrompt,
                    width,
                    height,
                    steps,
                    cfg_scale: cfg,
                    seed,
                    sampler_name: sampler,
                    model_name: model,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
            }

            const data = await response.json();
            setImageUrl(data.imageUrl);
            setModalOpen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAsBrowserSource = async () => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene || !imageUrl) {
            toast({
                title: 'Error',
                description: 'OBS not connected or no image generated.',
                variant: 'destructive',
            });
            return;
        }
        try {
            await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            toast({
                title: 'Success',
                description: 'Added generated image to OBS.',
                variant: 'default',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Failed to add source: ${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleAddAsImageSource = async () => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene || !imageUrl) {
            toast({
                title: 'Error',
                description: 'OBS not connected or no image generated.',
                variant: 'destructive',
            });
            return;
        }
        try {
            await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, imageUrl, generateSourceName('Generated Image'));
            toast({
                title: 'Success',
                description: 'Added generated image to OBS.',
                variant: 'default',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Failed to add source: ${error.message}`,
                variant: 'destructive',
            });
        }
    };

    return (
        <CollapsibleCard
            title="Image Generation"
            emoji="🎨"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className="space-y-4">
                    <TextInput
                        label="Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A beautiful landscape painting"
                    />
                    <TextInput
                        label="Negative Prompt"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="ugly, tiling, poorly drawn hands"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Width"
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(parseInt(e.target.value))}
                        />
                        <TextInput
                            label="Height"
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Steps"
                            type="number"
                            value={steps}
                            onChange={(e) => setSteps(parseInt(e.target.value))}
                        />
                        <TextInput
                            label="CFG Scale"
                            type="number"
                            value={cfg}
                            onChange={(e) => setCfg(parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Seed"
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value))}
                        />
                        <TextInput
                            label="Sampler"
                            value={sampler}
                            onChange={(e) => setSampler(e.target.value)}
                        />
                    </div>
                    <TextInput
                        label="Model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                    <Button onClick={handleGenerateImage} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Image'}
                    </Button>
                    {error && <p className="text-destructive">{error}</p>}
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
