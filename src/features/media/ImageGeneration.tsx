import React, { useState } from 'react';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import { ObsClient } from '@/services/obsClient';
import { catppuccinAccentColorsHexMap } from '@/types';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { copyToClipboard } from '@/utils/persistence';
import { CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { TextInput } from '@/components/common/TextInput';
import { geminiService } from '@/services/geminiService';

const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const { obsServiceInstance, currentProgramScene, isConnected } = useConnectionManagerStore();

    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const handleGenerateImage = async () => {
        setLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const generatedImageUrl = await geminiService.generateImage(prompt);
            setImageUrl(generatedImageUrl);
            setModalOpen(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({
                    title: 'Error',
                    description: `Failed to add source: ${error.message}`,
                    variant: 'destructive',
                });
            }
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast({
                    title: 'Error',
                    description: `Failed to add source: ${error.message}`,
                    variant: 'destructive',
                });
            }
        }
    };

    return (
        <CollapsibleCard
            title="Image Generation (Gemini)"
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
                    <Button onClick={handleGenerateImage} disabled={loading || !prompt}>
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
