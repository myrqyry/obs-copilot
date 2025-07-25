import React from 'react';
import { Button } from '../common/Button';
import { FaviconDropdown } from '../common/FaviconDropdown';
import { TextInput } from '../common/TextInput';

const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com', icon: '🎬' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com', icon: '🎭' },
];

const CONTENT_RATINGS = [
    { value: 'g', label: 'G' },
    { value: 'pg', label: 'PG' },
    { value: 'pg-13', label: 'PG-13' },
    { value: 'r', label: 'R' }
];

interface GifSearchFiltersProps {
    gifApi: string;
    setGifApi: (api: string) => void;
    gifQuery: string;
    setGifQuery: (query: string) => void;
    handleGifSearch: (e: React.FormEvent) => void;
    gifLoading: boolean;
    searchFilters: any;
    handleFilterChange: (key: string, value: any) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
}

export const GifSearchFilters: React.FC<GifSearchFiltersProps> = ({
    gifApi,
    setGifApi,
    gifQuery,
    setGifQuery,
    handleGifSearch,
    gifLoading,
    searchFilters,
    handleFilterChange,
    showFilters,
    setShowFilters,
}) => {
    return (
        <form onSubmit={handleGifSearch} className="space-y-1">
            <div className="flex items-center gap-1">
                <TextInput
                    type="text"
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="Search for GIFs..."
                    className="flex-grow"
                />
                <FaviconDropdown
                    options={GIF_APIS}
                    value={gifApi}
                    onChange={(newVal) => setGifApi(newVal)}
                    className="min-w-[100px]"
                />
                <Button type="submit" disabled={gifLoading || !gifQuery.trim()} size="sm">
                    {gifLoading ? 'Searching...' : 'Search'}
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-primary hover:text-primary/80 transition-colors"
                >
                    {showFilters ? 'Hide' : 'Show'} Advanced Filters
                </button>
            </div>
            {showFilters && (
                <div className="p-2 bg-card border border-border rounded text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground">Content Rating</label>
                            <select
                                value={searchFilters.rating}
                                onChange={(e) => handleFilterChange('rating', e.target.value)}
                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                            >
                                {CONTENT_RATINGS.map(rating => (
                                    <option key={rating.value} value={rating.value}>
                                        {rating.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};
