import { useCallback } from 'react';
import { useApiSearch } from './useApiSearch';
import ApiService from '../services/apiService';
import { apiConfigs } from '../config/apis';

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

  const search = useCallback(
    async (query: string) => {
      const apiService = new ApiService(apiName);
      await performSearch(() => apiService.search(query));
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
