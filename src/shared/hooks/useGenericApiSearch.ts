// src/hooks/useGenericApiSearch.ts
import { useCallback } from 'react';
import { useApiSearch } from './useApiSearch';
import ApiService from '../services/apiService';
import { apiConfigs } from '@/config/apis';

export const useGenericApiSearch = (apiName: keyof typeof apiConfigs) => {
  const {
    results,
    loading,
    searched,
    error,
    page,
    setPage,
    search: performSearch,
    resetSearch,
  } = useApiSearch<any>();

  // Update the search function to accept extra parameters
  const search = useCallback(
    async (query: string, extraParams: Record<string, any> = {}) => {
      const apiService = new ApiService(apiName);
      // Pass the extra params to the apiService's search method
      await performSearch(() => apiService.search(query, extraParams));
    },
    [apiName, performSearch],
  );

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