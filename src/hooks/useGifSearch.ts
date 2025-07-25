import { useState, useCallback } from 'react';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { GiphyResult } from '../types/giphy';
import { useChatStore } from '../store/chatStore';
import { GiphyFetch } from '@giphy/js-fetch-api';

interface SearchFilters {
    rating: string;
    contentFilter: string;
    mediaFilter: string;
    arRange: string;
    random: boolean;
    limit: number;
    contentType: 'gifs' | 'stickers';
}

export const useGifSearch = () => {
    const [gifApi, setGifApi] = useState('giphy');
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState<GiphyResult[]>([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('');
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
    const { actions: { addNotification } } = useChatStore();

    const handleGifSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!gifQuery.trim()) return;

        setGifLoading(true);
        setGifResults([]);
        setGifSearched(true);
        setSearchError(null);

        try {
            const searchQuery = selectedCategory ? `${gifQuery} ${selectedCategory}` : gifQuery;
            if (gifApi === 'giphy') {
                const apiKey = useApiKeyStore.getState().getApiKey(ApiService.GIPHY);
                if (!apiKey) throw new Error('Giphy API key is missing.');
                const gf = new GiphyFetch(apiKey);
                const response = await gf.search(searchQuery, {
                    limit: searchFilters.limit,
                    rating: searchFilters.rating as any,
                    type: searchFilters.contentType
                });
                setGifResults(response.data);
                setTotalResults(response.pagination.total_count);
            } else if (gifApi === 'tenor') {
                // Tenor API logic would go here
            }
        } catch (error: any) {
            setSearchError(error.message);
            addNotification({ type: 'error', message: `GIF Search Error: ${error.message}` });
        } finally {
            setGifLoading(false);
        }
    }, [gifApi, gifQuery, selectedCategory, searchFilters, addNotification]);

    return {
        gifApi,
        setGifApi,
        gifQuery,
        setGifQuery,
        gifResults,
        gifLoading,
        totalResults,
        selectedCategory,
        setSelectedCategory,
        searchFilters,
        setSearchFilters,
        gifSearched,
        searchError,
        handleGifSearch,
    };
};
