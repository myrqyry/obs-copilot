import React, { useState } from 'react';
import { useGifSearch } from '@/hooks/useGifSearch';
import { GifGrid } from '@/components/gif/GifGrid';
import { GifSearchFilters } from '@/components/gif/GifSearchFilters';
import { GifDetailsModal } from '@/components/gif/GifDetailsModal';
import { GiphyResult } from '@/types/giphy';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore } from '@/store/chatStore';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { copyToClipboard } from '@/utils/persistence';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { CardContent } from '@/components/ui/Card';

const GifSearch: React.FC = () => {
    const {
        gifApi,
        setGifApi,
        gifQuery,
        setGifQuery,
        gifResults,
        gifLoading,
        gifSearched,
        searchFilters,
        setSearchFilters,
        handleGifSearch,
    } = useGifSearch();

    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'sticker', data: GiphyResult } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const { actions: { addMessage } } = useChatStore();

    const handleAddAsBrowserSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            addMessage({ role: 'system', text: 'OBS not connected.' });
            return;
        }
        try {
            await obsServiceInstance.addBrowserSource(currentProgramScene, url, generateSourceName(sourceName));
            addMessage({ role: 'system', text: `Added ${sourceName} to OBS.` });
        } catch (error: any) {
            addMessage({ role: 'system', text: `Failed to add source: ${error.message}` });
        }
    };

    const handleAddAsMediaSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            addMessage({ role: 'system', text: 'OBS not connected.' });
            return;
        }
        try {
            await obsServiceInstance.addMediaSource(currentProgramScene, url, generateSourceName(sourceName));
            addMessage({ role: 'system', text: `Added ${sourceName} to OBS.` });
        } catch (error: any) {
            addMessage({ role: 'system', text: `Failed to add source: ${error.message}` });
        }
    };

    const getModalActions = (type: 'gif' | 'sticker', data: GiphyResult) => {
        switch (type) {
            case 'gif':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.images.original.url || '', data.title || 'gif'), variant: 'primary' },
                    { label: 'Add as Media Source', onClick: () => handleAddAsMediaSource(data.images.original.url || '', data.title || 'gif'), variant: 'secondary' },
                    { label: 'Copy URL', onClick: () => { copyToClipboard(data.images.original.url || ''); addMessage({ role: 'system', text: 'Copied GIF URL!' }); } },
                ];
            default:
                return [];
        }
    };

    return (
        <CollapsibleCard
            title="GIF Search"
            emoji="🎬"
            isOpen={true}
            onToggle={() => { }}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <GifSearchFilters
                    gifApi={gifApi}
                    setGifApi={setGifApi}
                    gifQuery={gifQuery}
                    setGifQuery={setGifQuery}
                    handleGifSearch={handleGifSearch}
                    gifLoading={gifLoading}
                    searchFilters={searchFilters}
                    handleFilterChange={(key, value) => setSearchFilters((prev: any) => ({ ...prev, [key]: value }))}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                />
                <GifGrid
                    gifResults={gifResults}
                    gifLoading={gifLoading}
                    gifSearched={gifSearched}
                    searchFilters={searchFilters}
                    onGifClick={(gif) => setModalContent({ type: gif.type as 'gif' | 'sticker', data: gif })}
                />
                <GifDetailsModal
                    modalContent={modalContent}
                    setModalContent={setModalContent}
                    getModalActions={getModalActions}
                />
            </CardContent>
        </CollapsibleCard>
    );
};

export default GifSearch;
