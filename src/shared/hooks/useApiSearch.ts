import { useState, useCallback } from 'react';
import { toast } from '@/shared/components/ui/toast';

import { handleAppError, createToastError } from '../lib/errorUtils'; // Import error utilities

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
      } catch (err: unknown) {
        const errorMessage = handleAppError('API Search', err);
        setError(errorMessage);
        toast(createToastError(
          'Search Error',
          (err as Error).message
        ));
        options?.onError?.((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [options],
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
