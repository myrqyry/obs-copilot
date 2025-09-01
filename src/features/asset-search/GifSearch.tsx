// src/features/asset-search/GifSearch.tsx
import React, { useState } from 'react';
import AssetSearch from './AssetSearch';
import { apiMappers } from '@/config/api-mappers';
import { StandardApiItem } from '@/types/api';
import { SearchFilters } from './SearchFilters';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { CardContent } from '@/components/ui/Card';

// --- Configuration ---
const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com' },
];

const GifSearch: React.FC = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        rating: 'g',
        limit: 12,
        lang: 'en',
        type: 'gifs', // 'gifs' or 'stickers'
        bundle: 'messaging_non_clips'
    });

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const renderGifGridItem = (item: StandardApiItem, onClick: () => void) => (
        <div key={item.id} className="relative group cursor-pointer h-full" onClick={onClick}>
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
    );

    const renderGifModalContent = (item: StandardApiItem) => {
        // Determine if it's a sticker based on the current filter type
        const isSticker = filters.type === 'stickers';

        return (
            <>
                {!isSticker && <img src={item.url} alt={item.title} className="max-w-full max-h-[70vh] mx-auto rounded" />}
                {isSticker && (
                    <div className="p-4 bg-transparent rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                        <img
                            src={item.url}
                            alt={item.title}
                            className="max-w-full max-h-full object-contain bg-transparent"
                        />
                    </div>
                )}
            </>
        );
    };

    const getGifModalActions = (item: StandardApiItem) => {
        // AssetSearch provides common actions, we can add GIF-specific ones if needed
        return []; // Return empty to use AssetSearch's default actions for now
    };

    return (
        <CollapsibleCard title="GIF Search" emoji="🎬" isOpen={true} onToggle={() => {}}>
            <CardContent className="px-3 pb-3 pt-2">
                <AssetSearch
                    title="GIF Search" // Title is redundant here, but required by AssetSearch
                    emoji="🎬" // Emoji is redundant here, but required by AssetSearch
                    apiConfigs={GIF_APIS}
                    apiMapper={apiMappers.giphy} // Revert to direct mapper
                    renderGridItem={renderGifGridItem}
                    renderModalContent={renderGifModalContent}
                    getModalActions={getGifModalActions}
                    extraSearchParams={filters}
                />
                <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-primary hover:text-primary/80 transition-colors"
                    >
                        {showFilters ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>
                {showFilters && <SearchFilters filters={filters} onFilterChange={handleFilterChange} api="giphy" />}
            </CardContent>
        </CollapsibleCard>
    );
};

export default GifSearch;
