import React from 'react';
import { GiphyResult } from '../../types/giphy';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface GifGridProps {
    gifResults: GiphyResult[];
    gifLoading: boolean;
    gifSearched: boolean;
    searchFilters: { contentType: 'gifs' | 'stickers' };
    onGifClick: (gif: GiphyResult) => void;
}

export const GifGrid: React.FC<GifGridProps> = ({
    gifResults,
    gifLoading,
    gifSearched,
    searchFilters,
    onGifClick,
}) => {
    if (gifLoading) {
        return (
            <div className="flex justify-center items-center py-4">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-xs text-muted-foreground">Searching for {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'}...</p>
                </div>
            </div>
        );
    }

    if (!gifSearched) {
        return null;
    }

    if (gifResults.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'} found. Try a different search term.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-1 mt-1">
            {gifResults.map((gif) => (
                <div
                    key={gif.id}
                    className="cursor-pointer"
                    onClick={() => onGifClick(gif)}
                >
                    <img
                        src={gif.images.fixed_height_small.url}
                        alt={gif.title}
                        className="w-full h-auto"
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
    );
};
