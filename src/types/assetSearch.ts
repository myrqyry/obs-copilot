// src/types/assetSearch.ts
export interface StandardApiItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  author: string;
  // Optional fields for enhanced functionality
  description?: string;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  format?: string;
  license?: string;
  downloadUrl?: string;
  // Special fields for different asset types
  svgContent?: string; // For SVG icons
  character?: string; // For emojis
  duration?: number; // For GIFs/videos
  rating?: string; // Content rating
}

export interface AssetSearchConfig {
  value: string;
  label: string;
  domain: string;
  category: AssetCategory;
  supportsFilters?: string[];
  requiresAuth?: boolean;
}

export type AssetCategory = 'images' | 'gifs' | 'icons' | 'emojis' | 'backgrounds' | 'stickers';

export interface SearchFilters {
  // Common filters
  rating?: 'g' | 'pg' | 'pg-13' | 'r';
  limit?: number;
  lang?: string;
  
  // Image-specific filters
  orientation?: 'all' | 'landscape' | 'portrait' | 'squarish';
  color?: string;
  category?: string;
  
  // GIF-specific filters
  type?: 'gifs' | 'stickers' | 'text';
  bundle?: 'messaging_non_clips' | 'clips_grid_non_clips';
  random_id?: string;
  country_code?: string;
  region?: string;
  remove_low_contrast?: boolean;
  
  // Icon-specific filters
  style?: 'filled' | 'outlined' | 'sharp' | 'round' | 'two-tone';
  size?: 'small' | 'medium' | 'large';
  premium?: 'all' | 'premium' | 'free';
  vector?: boolean;
  license?: 'any' | 'commercial' | 'commercial-non-resell' | 'free';
  
  // Custom filters for specific APIs
  [key: string]: any;
}

export interface AssetSearchProps {
  title: string;
  emoji: string;
  category: AssetCategory;
  apiConfigs: AssetSearchConfig[];
  className?: string;
  defaultFilters?: SearchFilters;
  maxResults?: number;
  gridCols?: number;
  gridRows?: number;
}

export interface AssetModalActions {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  icon?: string;
  disabled?: boolean;
}
