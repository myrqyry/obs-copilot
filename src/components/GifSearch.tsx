import React, { useState, useCallback, useMemo, useEffect } from 'react';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { GiphyResult } from '../types/giphy';
import { useAppStore } from '../store/appStore';
import { addBrowserSource, addMediaSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { FaviconIcon } from './common/FaviconIcon';
import Tooltip from './ui/Tooltip';
import { FaviconDropdown } from './common/FaviconDropdown';
import { CollapsibleCard } from './common/CollapsibleCard';
import { TextInput } from './common/TextInput';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Enhanced API configurations with more parameters
const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com', icon: '🎬' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com', icon: '🎭' },
];

// Enhanced search suggestions for better UX
const SEARCH_SUGGESTIONS = {
    giphy: [
        'reaction', 'meme', 'funny', 'cute', 'dance', 'anime', 'gaming', 'sports',
        'celebration', 'love', 'sad', 'angry', 'surprised', 'confused', 'excited'
    ],
    tenor: [
        'reaction', 'meme', 'funny', 'cute', 'dance', 'anime', 'gaming', 'sports',
        'celebration', 'love', 'sad', 'angry', 'surprised', 'confused', 'excited'
    ],
};

// Content rating options
const CONTENT_RATINGS = [
    { value: 'g', label: 'G' },
    { value: 'pg', label: 'PG' },
    { value: 'pg-13', label: 'PG-13' },
    { value: 'r', label: 'R' }
];

// Enhanced search filters
interface SearchFilters {
    rating: string;
    contentFilter: string;
    mediaFilter: string;
    arRange: string;
    random: boolean;
    limit: number;
    contentType: 'gifs' | 'stickers';
}

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const getEffectiveApiKey = (serviceName: ApiService): string | undefined => {
    const override = useApiKeyStore.getState().getApiKeyOverride(serviceName);
    if (override) return override;

    // Fallback to VITE_ prefixed keys for services that might use them directly
    // or for display purposes, though proxy calls won't need these if no override.
    const viteKeys: Partial<Record<ApiService, string | undefined>> = {
      [ApiService.GIPHY]: import.meta.env.VITE_GIPHY_API_KEY,
      [ApiService.TENOR]: import.meta.env.VITE_TENOR_API_KEY,
    };
    return viteKeys[serviceName];
  };

  // Specific getters using the new helper
  const getGiphyApiKey = () => getEffectiveApiKey(ApiService.GIPHY);
  const getTenorApiKey = () => getEffectiveApiKey(ApiService.TENOR);

const GifSearch: React.FC = () => {
    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'sticker', data: any } | null>(null);
    const [gifApi, setGifApi] = useState('giphy');
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState<GiphyResult[]>([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [gifCategories, setGifCategories] = useState<any[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showGridIcons, setShowGridIcons] = useState(false); // Hidden by default
    const [showBrowseOptions, setShowBrowseOptions] = useState(false); // New: Browse options toggle
    const [sortOrder, setSortOrder] = useState<'relevance' | 'newest' | 'oldest' | 'popular'>('relevance');
    const [gifPage, setGifPage] = useState(0); // New: Pagination state
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        rating: 'pg-13',
        contentFilter: 'high',
        mediaFilter: 'minimal',
        arRange: 'all',
        random: false,
        limit: 20,
        contentType: 'gifs'
    });
    const [gifSearched, setGifSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const obsServiceInstance = useAppStore(state => state.obsServiceInstance);
    const currentProgramScene = useAppStore(state => state.currentProgramScene);
    const isConnected = useAppStore(state => state.isConnected);
    const addNotification = useAppStore((state) => state.actions.addNotification);

    const accentColorName = useAppStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const ITEMS_PER_PAGE = 16; // 4x4 grid

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

    const handleAddAsImageSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            addNotification({ message: 'OBS not connected.', type: 'error' });
            return;
        }
        try {
            await addImageSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            addNotification({ message: `Added ${sourceName} to OBS.`, type: 'success' });
        } catch (error) {
            addNotification({ message: 'Failed to add source.', type: 'error' });
        }
    };

    const getModalActions = (type: 'gif' | 'sticker', data: any): ModalAction[] => {
        switch (type) {
            case 'sticker':
                return [
                    { label: 'Add as Image Source', onClick: () => handleAddAsImageSource(data.images?.original?.url || data.png_url, data.name || 'sticker'), variant: 'primary' },
                    { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.images?.original?.url || data.png_url); addNotification({ message: 'Copied image URL!', type: 'info' }); } },
                ];
            case 'gif':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.images.original.url, data.title || data.source || 'gif'), variant: 'primary' },
                    { label: 'Add as Media Source', onClick: () => handleAddAsMediaSource(data.images.original.url, data.title || data.source || 'gif'), variant: 'secondary' },
                    { label: 'Copy URL', onClick: () => { copyToClipboard(data.images.original.url); addNotification({ message: 'Copied GIF URL!', type: 'info' }); } },
                ];
            default:
                return [];
        }
    };

    // --- GIF Search Handler (Giphy & Tenor) ---
    // (Moved trending/categories handlers just before return below)
    const handleGifSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gifQuery.trim()) return;

        setGifLoading(true);
        setGifResults([]);
        setGifSearched(true);
        setSearchError(null);
        setGifPage(0); // Reset to first page for new searches

        try {
            // Combine search query with category if selected
            const searchQuery = selectedCategory ? `${gifQuery} ${selectedCategory}` : gifQuery;

            if (gifApi === 'giphy') {
                const giphyKeyOverride = useApiKeyStore.getState().getApiKeyOverride(ApiService.GIPHY);
                const apiKeyForGiphySDK = giphyKeyOverride || getGiphyApiKey(); // SDK needs a key; getEffectiveApiKey provides VITE_ default if no override

                if (!apiKeyForGiphySDK) {
                    throw new Error('Giphy API key is missing. Please set an override or VITE_GIPHY_API_KEY.');
                }
                const gfInstance = new GiphyFetch(apiKeyForGiphySDK);

                // Determine search type based on stickersOnly filter
                const searchType = searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs';

                const response = await gfInstance.search(searchQuery, {
                    limit: searchFilters.limit,
                    rating: searchFilters.rating as any,
                    offset: 0, // Start from first page
                    lang: 'en',
                    type: searchType
                });

                setGifResults(response.data.map((gif: any) => {
                    const result = {
                        id: gif.id,
                        title: gif.title,
                        images: {
                            fixed_height_small: { url: gif.images.fixed_height_small?.url },
                            original: { url: gif.images.original?.url },
                        },
                        source: 'giphy',
                        url: gif.url,
                        rating: gif.rating,
                        import_datetime: gif.import_datetime,
                        trending_datetime: gif.trending_datetime,
                        user: gif.user,
                        type: searchType
                    };

                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Giphy result missing image URLs:', { gif, result });
                    }

                    return result;
                }));
                setTotalResults(response.pagination.total_count);

            } else if (gifApi === 'tenor') {
                const tenorKeyToUse = useApiKeyStore.getState().getApiKeyOverride(ApiService.TENOR) || getTenorApiKey();
                if (!tenorKeyToUse) {
                    throw new Error('Tenor API key is missing. Please set an override or VITE_TENOR_API_KEY.');
                }
                const params = new URLSearchParams({
                    key: tenorKeyToUse,
                    q: searchQuery,
                    client_key: 'obs-copilot-gemini',
                    contentfilter: searchFilters.contentFilter,
                    media_filter: searchFilters.mediaFilter,
                    ar_range: searchFilters.arRange,
                    locale: 'en_US',
                    country: 'US',
                    limit: searchFilters.limit.toString(),
                    pos: '0' // Start from first page
                });

                // Add searchfilter parameter for stickers (Tenor API specific)
                if (searchFilters.contentType === 'stickers') {
                    params.append('searchfilter', 'sticker');
                }

                if (searchFilters.random) {
                    params.append('random', 'true');
                }

                const res = await fetch(`https://tenor.googleapis.com/v2/search?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();

                // Debug: Log the response structure
                console.log('Tenor API response:', data);

                // Handle different possible response formats
                const results = data.results || data.data || [];

                if (!Array.isArray(results)) {
                    console.error('Tenor API returned unexpected format:', data);
                    throw new Error('Invalid response format from Tenor API');
                }

                setGifResults(results.map((item: any) => {
                    // Helper function to get the best transparent URL for stickers
                    const getTransparentUrl = (size: 'small' | 'original') => {
                        if (searchFilters.contentType === 'stickers' && gifApi === 'tenor') {
                            if (size === 'small') {
                                // For grid thumbnails, prefer tinywebp_transparent, then webp_transparent, then tinygif
                                return item.media_formats?.tinywebp_transparent?.url ||
                                       item.media_formats?.webp_transparent?.url ||
                                       item.media_formats?.tinygif?.url ||
                                       item.media_formats?.gif?.url;
                            } else {
                                // For modal previews, prefer webp_transparent, then gif_transparent, then gif
                                return item.media_formats?.webp_transparent?.url ||
                                       item.media_formats?.gif_transparent?.url ||
                                       item.media_formats?.gif?.url ||
                                       item.media_formats?.mp4?.url;
                            }
                        } else {
                            // For regular GIFs, use standard formats
                            return size === 'small'
                                ? (item.media_formats?.tinygif?.url || item.media_formats?.gif?.url)
                                : (item.media_formats?.gif?.url || item.media_formats?.mp4?.url);
                        }
                    };

                    const result = {
                        id: item.id,
                        title: item.content_description || '',
                        images: {
                            fixed_height_small: {
                                url: getTransparentUrl('small')
                            },
                            original: {
                                url: getTransparentUrl('original')
                            }
                        },
                        source: 'tenor',
                        type: searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs',
                        rating: item.content_rating || item.rating,
                    };

                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Tenor result missing image URLs:', { item, result });
                    }

                    return result;
                }));
            }
        } catch (error: any) {
            console.error('GIF search error:', error);
            setSearchError(error.message || 'Failed to search GIFs');
            setGifResults([]);
            useAppStore.getState().actions.addNotification({ type: 'error', message: `GIF Search Error: ${error.message || 'Failed to search GIFs'}` });
        } finally {
            setGifLoading(false);
        }
    }, [gifApi, gifQuery, selectedCategory, searchFilters]);

    const handleSuggestionClick = (suggestion: string) => {
        setGifQuery(suggestion);
        setShowSuggestions(false);
        // Auto-search when suggestion is clicked
        setTimeout(() => {
            // Find the form by looking for the submit button's parent form
            const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton && submitButton.form) {
                submitButton.form.requestSubmit();
            }
        }, 100);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setSearchFilters(prev => ({ ...prev, [key]: value }));

        // Auto-search when filters change if there's an active search
        if (gifSearched && gifQuery.trim()) {
            setTimeout(() => {
                const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                handleGifSearch(searchEvent);
            }, 100);
        }
    };

    // Handle sort order changes
    const handleSortOrderChange = (newSortOrder: 'relevance' | 'newest' | 'oldest' | 'popular') => {
        setSortOrder(newSortOrder);

        // Auto-search when sort order changes if there's an active search
        if (gifSearched && gifQuery.trim()) {
            setTimeout(() => {
                const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                handleGifSearch(searchEvent);
            }, 100);
        }
    };

    const getSearchSuggestions = () => {
        return SEARCH_SUGGESTIONS[gifApi as keyof typeof SEARCH_SUGGESTIONS] || [];
    };

    const GridItem = useMemo(() => React.memo(({ item, type, onClick }: {
        item: any;
        type: 'gif' | 'sticker';
        onClick: () => void;
    }) => {
        // Get the best available image URL for grid preview
        const getGridImageUrl = () => {
            if (item.images?.fixed_height_small?.url) {
                return item.images.fixed_height_small.url;
            }
            if (item.images?.original?.url) {
                return item.images.original.url;
            }
            // Fallback for different URL structures
            if (item.url) {
                return item.url;
            }
            if (item.path) {
                return item.path;
            }
            return '';
        };

        const imageUrl = getGridImageUrl();

        // Debug logging for troubleshooting
        if (!imageUrl && (type === 'gif' || item.type === 'gifs' || item.type === 'stickers')) {
            console.warn('No image URL found for grid item:', { item, type });
        }

        const isSticker = item.type === 'stickers';
        const title = item.title || type;


        return (
            <div
                role="button"
                tabIndex={0}
                aria-label={`View details for ${type} ${title}`}
                className={`min-h-[128px] flex flex-col cursor-pointer rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg border border-border ${isSticker ? 'bg-transparent' : 'bg-card'} focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background`}
                data-type={item.type || type}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
            >
                {(type === 'gif' || item.type === 'gifs' || item.type === 'stickers') && imageUrl && (
                    <img
                        src={imageUrl}
                        alt={item.title || 'GIF'}
                        className={`w-full h-[128px] ${isSticker ? 'object-contain bg-transparent' : 'object-cover'}`}
                        loading="lazy"
                        onError={(e) => {
                            console.warn('Image failed to load:', imageUrl, 'Falling back to original URL');
                            // Fallback to original URL if small image fails
                            const target = e.target as HTMLImageElement;
                            if (target.src !== item.images?.original?.url && item.images?.original?.url) {
                                target.src = item.images.original.url;
                            } else if (target.src !== item.url && item.url) {
                                target.src = item.url;
                            } else {
                                // Hide broken image
                                target.style.display = 'none';
                            }
                        }}
                        style={isSticker ? { mixBlendMode: 'normal', backgroundColor: 'transparent' } : {}}
                    />
                )}
                {(type === 'gif' || item.type === 'gifs' || item.type === 'stickers') && !imageUrl && (
                    <div className="w-full h-[128px] flex items-center justify-center bg-muted text-muted-foreground text-xs">
                        No preview available
                    </div>
                )}
            </div>
        );
    }), []);

    return (
        <CollapsibleCard
            title="GIF Search"
            emoji="🎬"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div className={`${gifLoading && !gifResults.length ? 'animate-serviceSwitch' : ''}`}> {/* Apply animation conditionally based on loading state and results presence */}
                    <form onSubmit={handleGifSearch} className="space-y-1">
                        {/* Search Input and Service Selection */}
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={gifQuery}
                                onChange={(e) => setGifQuery(e.target.value)}
                                placeholder="Search for GIFs..."
                                className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            <div className="relative">
                                <FaviconDropdown
                                    options={GIF_APIS}
                                    value={gifApi}
                                    onChange={(newVal) => setGifApi(newVal)}
                                    className={`min-w-[100px] ${gifLoading ? 'service-dropdown-loading' : ''}`}
                                    accentColor={accentColor}
                                />
                                {/* Service switching indicator */}
                                {gifLoading && (
                                    <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent"></div>
                                    </div>
                                )}
                            </div>
                            <Button type="submit" disabled={gifLoading || !gifQuery.trim()} size="sm">
                                {gifLoading ? 'Searching...' : 'Search'}
                            </Button>
                        </div>

                        {/* Quick Filter Options */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Basic Search Options */}
                            <div className="flex items-center gap-1">
                                <label className="flex items-center space-x-1 text-xs text-muted-foreground cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={searchFilters.contentType === 'gifs'}
                                        onChange={() => handleFilterChange('contentType', 'gifs')}
                                        className="appearance-none h-3 w-3 border-2 border-border rounded-sm bg-background
                                                   checked:bg-primary checked:border-transparent focus:outline-none
                                                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                                   transition duration-150 group-hover:border-border"
                                    />
                                    <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                                        GIFs
                                    </span>
                                </label>
                                <label className="flex items-center space-x-1 text-xs text-muted-foreground cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={searchFilters.contentType === 'stickers'}
                                        onChange={() => handleFilterChange('contentType', 'stickers')}
                                        className="appearance-none h-3 w-3 border-2 border-border rounded-sm bg-background
                                                   checked:bg-primary checked:border-transparent focus:outline-none
                                                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                                   transition duration-150 group-hover:border-border"
                                    />
                                    <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                                        Stickers
                                    </span>
                                </label>
                            </div>

                            {/* Browse Options Button */}
                            <div className="relative">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowBrowseOptions(!showBrowseOptions)}
                                    className="text-xs px-2 py-0.5 h-6"
                                >
                                    {showBrowseOptions ? 'Hide' : 'Browse'}
                                </Button>

                                {/* Browse Options Dropdown */}
                                {showBrowseOptions && (
                                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded shadow-lg z-10 min-w-[120px]">
                                        <div className="p-1 space-y-1">
                                            <button
                                                onClick={() => {
                                                    // handleShowTrendingGifs();
                                                    setShowBrowseOptions(false);
                                                }}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors"
                                            >
                                                {gifApi === 'tenor' ? 'Featured' : 'Trending'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // handleShowCategories();
                                                    setShowBrowseOptions(false);
                                                }}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors"
                                            >
                                                Categories
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Advanced Filters Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-primary hover:text-primary/80 transition-colors text-xs"
                            >
                                {showFilters ? 'Hide' : 'Show'} Advanced Filters
                            </button>

                            {/* Grid Icons Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowGridIcons(!showGridIcons)}
                                className="text-primary hover:text-primary/80 transition-colors text-xs"
                            >
                                {showGridIcons ? 'Hide' : 'Show'} Grid Icons
                            </button>
                        </div>

                        {/* Advanced Filters (Hidden by default) */}
                        {showFilters && (
                            <div className="p-2 bg-card border border-border rounded text-xs space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Content Rating */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Content Rating</label>
                                        <select
                                            value={searchFilters.rating}
                                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                        >
                                            {CONTENT_RATINGS.map(rating => (
                                                <option key={rating.value} value={rating.value}>
                                                    {rating.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sort Order */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Sort By</label>
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => handleSortOrderChange(e.target.value as 'relevance' | 'newest' | 'oldest' | 'popular')}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="popular">Popular</option>
                                        </select>
                                    </div>

                                    {/* Content Filter (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Content Filter</label>
                                            <select
                                                value={searchFilters.contentFilter}
                                                onChange={(e) => handleFilterChange('contentFilter', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                            >
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                                <option value="off">Off</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Media Filter (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Media Filter</label>
                                            <select
                                                value={searchFilters.mediaFilter}
                                                onChange={(e) => handleFilterChange('mediaFilter', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                            >
                                                <option value="minimal">Minimal</option>
                                                <option value="basic">Basic</option>
                                                <option value="off">Off</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Aspect Ratio (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Aspect Ratio</label>
                                            <select
                                                value={searchFilters.arRange}
                                                onChange={(e) => handleFilterChange('arRange', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                            >
                                                <option value="all">All</option>
                                                <option value="wide">Wide</option>
                                                <option value="standard">Standard</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Random Results */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Random Order</label>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="random-order-checkbox"
                                                checked={searchFilters.random}
                                                onChange={(e) => handleFilterChange('random', e.target.checked)}
                                                className="h-3 w-3 border border-border rounded bg-background checked:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                                            />
                                            <span className="text-xs ml-1">Randomize</span>
                                        </div>
                                    </div>

                                    {/* Results Limit */}
                                    <div>
                                        <label htmlFor="results-limit-select" className="text-xs text-muted-foreground">Results Limit</label>
                                        <select
                                            id="results-limit-select"
                                            value={searchFilters.limit}
                                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Suggestions */}
                        {showSuggestions && (
                            <div className="p-1 bg-card border border-border rounded">
                                <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
                                <div className="flex flex-wrap gap-1">
                                    {getSearchSuggestions().slice(0, 8).map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs bg-muted hover:bg-muted/80 px-1 py-0.5 rounded transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {searchError && (
                            <div className="p-1 bg-destructive/10 border border-destructive/30 rounded">
                                <p className="text-destructive text-xs">{searchError}</p>
                            </div>
                        )}
                    </form>

                    {/* Enhanced Results Display */}
                    {gifSearched && (
                        <div className="mt-1">
                            {gifLoading && gifResults.length === 0 ? (
                                <div className="flex justify-center items-center py-4">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                                        <p className="text-xs text-muted-foreground">Searching for {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'}...</p>
                                    </div>
                                </div>
                            ) : gifResults.length > 0 ? (
                                <div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {gifResults.map((gif) => (
                                            <GridItem
                                                key={gif.id}
                                                item={gif}
                                                type={gif.type === 'stickers' ? 'sticker' : 'gif'}
                                                onClick={() => {
                                                    setModalContent({ type: gif.type === 'stickers' ? 'sticker' : 'gif', data: gif });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-xs text-muted-foreground">No {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'} found. Try a different search term.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={
                        modalContent.type === 'gif' ? modalContent.data.title : 'Sticker Preview'
                    }
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    {modalContent.type === 'gif' && <img src={modalContent.data.images.original.url} alt={modalContent.data.title} className="max-w-full max-h-[70vh] mx-auto" />}
                    {modalContent.type === 'sticker' && (
                        <div className="p-4 bg-transparent rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                            <img
                                src={modalContent.data.images?.original?.url || modalContent.data.png_url}
                                alt={modalContent.data.title || modalContent.data.name}
                                className="max-w-full max-h-full object-contain bg-transparent"
                                style={{ mixBlendMode: 'normal', backgroundColor: 'transparent' }}
                                onError={e => {
                                    if (e.currentTarget.src && !e.currentTarget.src.endsWith('/broken-image.png')) {
                                        e.currentTarget.src = '/broken-image.png';
                                    }
                                }}
                            />
                        </div>
                    )}
                </Modal>
            )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default GifSearch;
