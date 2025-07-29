import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '../utils/logger';

interface UseApiSearchOptions<T> {
  initialPageSize?: number;
  onSuccess?: (results: T[]) => void;
  onError?: (error: string) => void;
}

interface UseApiSearchResult<T> {
  results: T[];
  loading: boolean;
  searched: boolean;
  error: string | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  search: (fetcher: () => Promise<T[]>) => Promise<void>;
  resetSearch: () => void;
}

/**
 * Custom hook to centralize API search logic across the application.
 * Manages common search state and operations like loading, pagination, and error handling.
 *
 * @template T The type of data returned by the search
 * @param options Configuration options for the hook
 * @returns An object containing search state and control functions
 */
export const useApiSearch = <T>(options?: UseApiSearchOptions<T>): UseApiSearchResult<T> => {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  // const addNotification = useAppStore(state => state.actions.addNotification); // Removed as it causes a module not found error
  const { toast } = useToast();

  /**
   * Executes a search using the provided fetcher function.
   *
   * @param fetcher A function that returns a Promise resolving to an array of results
   */
  const search = useCallback(
    async (fetcher: () => Promise<T[]>) => {
      setLoading(true);
      setResults([]);
      setSearched(true);
      setError(null);
      setPage(0); // Reset page on new search

      try {
        const fetchedResults = await fetcher();
        setResults(fetchedResults);
        options?.onSuccess?.(fetchedResults);
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error(`Failed to fetch search results: ${errorMessage}`, err);
        toast({
          title: 'Search Error',
          description: `Failed to fetch search results: ${errorMessage}`,
          variant: 'destructive',
        });
        options?.onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [options, toast],
  );

  /**
   * Resets all search state to initial values.
   */
  const resetSearch = useCallback(() => {
    setResults([]);
    setLoading(false);
    setSearched(false);
    setError(null);
    setPage(0);
  }, []);

  return {
    results,
    loading,
    searched,
    error,
    page,
    setPage,
    search,
    resetSearch,
  };
};
