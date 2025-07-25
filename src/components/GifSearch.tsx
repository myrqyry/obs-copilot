import React, { useState } from 'react';
import { useGifSearch } from '../../hooks/useGifSearch';
import { GifGrid } from './gif/GifGrid';
import { GifSearchFilters } from './gif/GifSearchFilters';
import { GifDetailsModal } from './gif/GifDetailsModal';
import { GiphyResult } from '../../types/giphy';
import { useConnectionStore } from '../../store/connectionStore';
import { useObsStore } from '../../store/obsStore';
import { useChatStore } from '../../store/chatStore';
import { addBrowserSource, addMediaSource } from '../../services/obsService';
import { generateSourceName } from '../../utils/obsSourceHelpers';
import { copyToClipboard } from '../../utils/persistence';
import { CollapsibleCard } from '../common/CollapsibleCard';
import { CardContent } from '../ui/Card';

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
    const { obsServiceInstance, isConnected } = useConnectionStore();
    const { currentProgramScene } = useObsStore();
    const { actions: { addNotification } } = useChatStore();

    const handleAddAsBrowserSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            addNotification({ message: 'OBS not connected.', type: 'error' });
            return;
        }
        try {
            await addBrowserSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            addNotification({ message: `Added ${sourceName} to OBS.`, type: 'success' });
        } catch (error) {
            addNotification({ message: 'Failed to add source.', type: 'error' });
        }
    };

    const handleAddAsMediaSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            addNotification({ message: 'OBS not connected.', type: 'error' });
            return;
        }
        try {
            await addMediaSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            addNotification({ message: `Added ${sourceName} to OBS.`, type: 'success' });
        } catch (error) {
            addNotification({ message: 'Failed to add source.', type: 'error' });
        }
    };

    const getModalActions = (type: 'gif' | 'sticker', data: GiphyResult) => {
        switch (type) {
            case 'gif':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.images.original.url, data.title || 'gif'), variant: 'primary' },
                    { label: 'Add as Media Source', onClick: () => handleAddAsMediaSource(data.images.original.url, data.title || 'gif'), variant: 'secondary' },
                    { label: 'Copy URL', onClick: () => { copyToClipboard(data.images.original.url); addNotification({ message: 'Copied GIF URL!', type: 'info' }); } },
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
                    handleFilterChange={(key, value) => setSearchFilters(prev => ({ ...prev, [key]: value }))}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                />
                <GifGrid
                    gifResults={gifResults}
                    gifLoading={gifLoading}
                    gifSearched={gifSearched}
                    searchFilters={searchFilters}
                    onGifClick={(gif) => setModalContent({ type: gif.type, data: gif })}
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
