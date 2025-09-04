// src/components/asset-search/index.ts
export { EnhancedAssetSearch } from './EnhancedAssetSearch';
export { EnhancedSearchFilters } from './EnhancedSearchFilters';

// Re-export types for convenience
export type {
  StandardApiItem,
  AssetSearchConfig,
  SearchFilters,
  AssetModalActions,
  AssetCategory,
  AssetSearchProps,
} from '@/types/assetSearch';

// Re-export configurations
export {
  ASSET_SEARCH_CONFIGS,
  getAllAssetConfigs,
  getConfigsByCategory,
  getConfigByValue,
} from '@/config/assetSearchConfigs';

// Re-export mappers
export { apiMappers } from '@/config/enhancedApiMappers';
