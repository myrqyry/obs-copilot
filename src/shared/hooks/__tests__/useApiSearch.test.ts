import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiSearch } from '../useApiSearch';
import { toast } from '@/shared/components/ui/toast';
import { logger } from '@/shared/utils/logger';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/components/ui/toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useApiSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useApiSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(0);
  });

  it('should handle successful search', async () => {
    const mockFetcher = vi.fn(() => Promise.resolve(['item1', 'item2']));
    const mockOnSuccess = vi.fn();
    const { result } = renderHook(() => useApiSearch({ onSuccess: mockOnSuccess }));

    await act(async () => {
      await result.current.search(mockFetcher);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual(['item1', 'item2']);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith(['item1', 'item2']);
    expect(toast).not.toHaveBeenCalled();
  });

  it('should handle search with error', async () => {
    const mockError = new Error('Network error');
    const mockFetcher = vi.fn(() => Promise.reject(mockError));
    const mockOnError = vi.fn();
    const { result } = renderHook(() => useApiSearch({ onError: mockOnError }));

    await act(async () => {
      await result.current.search(mockFetcher);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(true);
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBe('API Search failed: Network error');
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith('Network error');
    expect(logger.error).toHaveBeenCalledWith(
      'API Search error:',
      mockError,
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Search Error',
        description: 'Search Error failed: Network error',
        variant: 'destructive',
      }),
    );
  });

  it('should reset search state', async () => {
    const mockFetcher = vi.fn(() => Promise.resolve(['item1', 'item2']));
    const { result } = renderHook(() => useApiSearch());

    await act(async () => {
      await result.current.search(mockFetcher);
    });

    expect(result.current.results).toEqual(['item1', 'item2']);
    expect(result.current.searched).toBe(true);

    act(() => {
      result.current.resetSearch();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(0);
  });

  it('should update page number', () => {
    const { result } = renderHook(() => useApiSearch());

    act(() => {
      result.current.setPage(1);
    });

    expect(result.current.page).toBe(1);
  });

  it('should reset page on new search', async () => {
    const mockFetcher = vi.fn(() => Promise.resolve(['item1']));
    const { result } = renderHook(() => useApiSearch());

    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.page).toBe(5);

    await act(async () => {
      await result.current.search(mockFetcher);
    });

    expect(result.current.page).toBe(0);
  });
});
