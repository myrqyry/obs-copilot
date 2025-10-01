// src/types/api.ts
import { StandardApiItem as EnhancedStandardApiItem } from './assetSearch';

// Re-export the enhanced type for backward compatibility
export type StandardApiItem = EnhancedStandardApiItem;

// You can add other legacy API types here if needed
// For example:
// export interface LegacyGiphyItem { ... }

// It's recommended to migrate all components to use the new types
// from assetSearch.ts for better consistency and richer data.
