import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiSearch } from '../useApiSearch';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '../../utils/logger';

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('useApiSearch', () => {
  let mockToast: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
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
    const mockFetcher = jest.fn(() => Promise.resolve(['item1', 'item2']));
    const mockOnSuccess = jest.fn();
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
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should handle search with error', async () => {
    const mockError = new Error('Network error');
    const mockFetcher = jest.fn(() => Promise.reject(mockError));
    const mockOnError = jest.fn();
    const { result } = renderHook(() => useApiSearch({ onError: mockOnError }));

    await act(async () => {
      await result.current.search(mockFetcher);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.searched).toBe(true);
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith('Network error');
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch search results: Network error', mockError);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Search Error',
        description: 'Failed to fetch search results: Network error',
        variant: 'destructive',
      }),
    );
  });

  it('should reset search state', async () => {
    const mockFetcher = jest.fn(() => Promise.resolve(['item1', 'item2']));
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
    const mockFetcher = jest.fn(() => Promise.resolve(['item1']));
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