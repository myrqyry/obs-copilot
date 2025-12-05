// src/api/queryClient.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorLogger } from '@/lib/errorHandling';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time - 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times on 5xx errors
        return failureCount < 3;
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: 'always',
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Error handling for mutations
      onError: (error: any) => {
        const message = error?.response?.data?.detail || error.message || 'An error occurred';
        toast.error(message);
        errorLogger.log(error);
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Only show error toasts for queries with explicit error handling
      if (query.meta?.showErrorToast !== false) {
        const message = error?.response?.data?.detail || error.message || 'Failed to fetch data';
        toast.error(message);
      }
      errorLogger.log(error, { component: 'QueryCache', action: query.queryKey.join('/') });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      if (mutation.meta?.showErrorToast !== false) {
        const message = error?.response?.data?.detail || error.message || 'Operation failed';
        toast.error(message);
      }
      errorLogger.log(error, { component: 'MutationCache' });
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage as string);
      }
    },
  }),
});

// Query key factory for consistent cache management
export const queryKeys = {
  obs: {
    all: ['obs'] as const,
    scenes: () => [...queryKeys.obs.all, 'scenes'] as const,
    scene: (id: string) => [...queryKeys.obs.scenes(), id] as const,
    sources: () => [...queryKeys.obs.all, 'sources'] as const,
    source: (id: string) => [...queryKeys.obs.sources(), id] as const,
    stats: () => [...queryKeys.obs.all, 'stats'] as const,
  },
  gemini: {
    all: ['gemini'] as const,
    chat: (sessionId: string) => [...queryKeys.gemini.all, 'chat', sessionId] as const,
    history: () => [...queryKeys.gemini.all, 'history'] as const,
  },
  assets: {
    all: ['assets'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.assets.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.assets.all, 'detail', id] as const,
  },
} as const;
