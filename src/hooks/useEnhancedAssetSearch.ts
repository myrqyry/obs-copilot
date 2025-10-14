import { useState, useCallback } from 'react';
import { StandardApiItem, SearchFilters } from '@/types/assetSearch';
import { apiMappers } from '@/config/enhancedApiMappers';
import useConfigStore from '@/store/configStore';
import { toast } from '@/components/ui/use-toast';

interface UseEnhancedAssetSearchReturn {
  results: StandardApiItem[];
  loading: boolean;
  error: string | null;
  searched: boolean;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

const API_ENDPOINTS: Record<string, string> = {
  unsplash: 'https://api.unsplash.com/search/photos',
  pexels: 'https://api.pexels.com/v1/search',
  pixabay: 'https://pixabay.com/api/',
  wallhaven: 'https://wallhaven.cc/api/v1/search',
  giphy: 'https://api.giphy.com/v1/gifs/search',
  tenor: 'https://tenor.googleapis.com/v2/search',
  iconfinder: 'https://api.iconfinder.com/v4/icons/search',
  artstation: 'https://www.artstation.com/api/v2/search/projects.json',
  deviantart: 'https://www.deviantart.com/api/v1/oauth2/browse/popular',
  'emoji-api': 'https://emoji-api.com/emojis'
};

export const useEnhancedAssetSearch = (apiType: string): UseEnhancedAssetSearchReturn => {
  const [results, setResults] = useState<StandardApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const config = useConfigStore.getState();

  const buildApiUrl = useCallback((query: string, filters: SearchFilters = {}) => {
    const endpoint = API_ENDPOINTS[apiType as keyof typeof API_ENDPOINTS];
    if (!endpoint) throw new Error(`Unsupported API type: ${apiType}`);

    const params = new URLSearchParams();

    switch (apiType) {
      case 'unsplash':
        params.append('query', query);
        params.append('per_page', '30');
        if (filters.orientation) params.append('orientation', filters.orientation);
        if (filters.color) params.append('color', filters.color);
        break;

      case 'pexels':
        params.append('query', query);
        params.append('per_page', '30');
        if (filters.orientation) params.append('orientation', filters.orientation);
        break;

      case 'pixabay':
        params.append('q', query);
        params.append('per_page', '30');
        params.append('key', config.PIXABAY_API_KEY || '');
        if (filters.category) params.append('category', filters.category);
        break;

      case 'giphy':
        params.append('q', query);
        params.append('limit', '30');
        params.append('api_key', config.GIPHY_API_KEY || '');
        if (filters.rating) params.append('rating', filters.rating);
        break;

      case 'tenor':
        params.append('q', query);
        params.append('limit', '30');
        params.append('key', config.TENOR_API_KEY || '');
        if (filters.contentfilter) params.append('contentfilter', filters.contentfilter);
        break;

      case 'iconfinder':
        params.append('query', query);
        params.append('count', '30');
        if (filters.style) params.append('style', filters.style);
        break;

      case 'wallhaven':
        params.append('q', query);
        params.append('per_page', '24');
        if (filters.categories) params.append('categories', filters.categories);
        break;

      default:
        params.append('q', query);
    }

    return `${endpoint}?${params.toString()}`;
  }, [apiType, config]);

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'User-Agent': 'OBS-Copilot/1.0'
    };

    switch (apiType) {
      case 'unsplash':
        if (config.UNSPLASH_ACCESS_KEY) {
          headers['Authorization'] = `Client-ID ${config.UNSPLASH_ACCESS_KEY}`;
        }
        break;

      case 'pexels':
        if (config.PEXELS_API_KEY) {
          headers['Authorization'] = config.PEXELS_API_KEY;
        }
        break;

      case 'iconfinder':
        if (config.ICONFINDER_API_KEY) {
          headers['Authorization'] = `Bearer ${config.ICONFINDER_API_KEY}`;
        }
        break;

      case 'deviantart':
        if (config.DEVIANTART_CLIENT_ID) {
          headers['Authorization'] = `Bearer ${config.DEVIANTART_CLIENT_ID}`;
        }
        break;
    }

    return headers;
  }, [apiType, config]);

  const search = useCallback(async (query: string, filters: SearchFilters = {}) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const url = buildApiUrl(query, filters);
      const headers = buildHeaders();

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`API key required for ${apiType}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - check your API key for ${apiType}`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded for ${apiType}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      let rawResults: any[] = [];
      switch (apiType) {
        case 'unsplash':
          rawResults = data.results || [];
          break;
        case 'pixabay':
            rawResults = data.hits || [];
            break;
        case 'pexels':
          rawResults = data.photos || [];
          break;
        case 'giphy':
        case 'wallhaven':
        case 'artstation':
          rawResults = data.data || [];
          break;
        case 'tenor':
          rawResults = data.results || [];
          break;
        case 'iconfinder':
          rawResults = data.icons || [];
          break;
        default:
          rawResults = Array.isArray(data) ? data : [];
      }

      const mapper = apiMappers[apiType as keyof typeof apiMappers];
      if (!mapper) {
        throw new Error(`No mapper available for ${apiType}`);
      }

      const mappedResults: StandardApiItem[] = rawResults.map(mapper).filter(Boolean);

      setResults(mappedResults);
      setSearched(true);

      if (mappedResults.length === 0) {
        toast({
          title: 'No Results',
          description: `No ${apiType} assets found for "${query}"`,
          variant: 'default'
        });
      }

    } catch (err: any) {
      const errorMessage = err.message || `Failed to search ${apiType}`;
      setError(errorMessage);
      setResults([]);

      toast({
        title: 'Search Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [apiType, buildApiUrl, buildHeaders]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSearched(false);
  }, []);

  return {
    results,
    loading,
    error,
    searched,
    search,
    clearResults
  };
};