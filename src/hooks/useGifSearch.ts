import { useState, useCallback } from 'react';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { GiphyResult } from '../types/giphy';
import { toast } from '../components/ui/toast';
import { GiphyRating } from '../types/giphy';
import { getSimpleApiEndpoint } from '../utils/api';

interface SearchFilters {
  rating: GiphyRating;
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
    contentType: 'gifs',
  });
  const [gifSearched, setGifSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleGifSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!gifQuery.trim()) return;

      setGifLoading(true);
      setGifResults([]);
      setGifSearched(true);
      setSearchError(null);

      try {
        const searchQuery = selectedCategory ? `${gifQuery} ${selectedCategory}` : gifQuery;
        if (gifApi === 'giphy') {
            const apiKey = useApiKeyStore.getState().getApiKeyOverride(ApiService.GIPHY);
            const apiUrl = getSimpleApiEndpoint('giphy');

            const params = new URLSearchParams({
                q: searchQuery,
                limit: String(searchFilters.limit),
                rating: searchFilters.rating,
                type: searchFilters.contentType,
            });

            const headers: HeadersInit = {};
            if (apiKey) {
                headers['X-Api-Key'] = apiKey;
            }

            const response = await fetch(`${apiUrl}?${params.toString()}`, { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Giphy API error');
            }
            const data = await response.json();
            setGifResults(data.data.map((gif: any) => ({ ...gif, id: String(gif.id) })));
            setTotalResults(data.pagination.total_count);

        } else if (gifApi === 'tenor') {
          // Tenor API logic would go here
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        setSearchError(message);
        toast({
          title: `GIF Search Error`,
          description: message,
          variant: 'destructive',
        });
      } finally {
        setGifLoading(false);
      }
    },
    [gifApi, gifQuery, selectedCategory, searchFilters],
  );

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
