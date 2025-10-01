// src/config/assetSearchConfigs.ts
import { AssetSearchConfig } from '@/types/assetSearch';

export const ASSET_SEARCH_CONFIGS: Record<string, AssetSearchConfig[]> = {
  backgrounds: [
    {
      value: 'unsplash',
      label: 'Unsplash',
      domain: 'unsplash.com',
      category: 'backgrounds',
      supportsFilters: ['orientation', 'color', 'category'],
      requiresAuth: false,
    },
    {
      value: 'wallhaven',
      label: 'Wallhaven',
      domain: 'wallhaven.cc',
      category: 'backgrounds',
      supportsFilters: ['orientation', 'color', 'category'],
      requiresAuth: false,
    },
  ],
  
  gifs: [
    {
      value: 'giphy',
      label: 'Giphy',
      domain: 'giphy.com',
      category: 'gifs',
      supportsFilters: [
        'rating', 
        'lang', 
        'random_id', 
        'bundle', 
        'country_code', 
        'region', 
        'remove_low_contrast'
      ],
      requiresAuth: true,
    },
    {
      value: 'tenor',
      label: 'Tenor',
      domain: 'tenor.googleapis.com',
      category: 'gifs',
      supportsFilters: [
        'rating',
        'lang',
        'client_key',
        'country',
        'media_filter',
        'searchfilter',
        'random',
      ],
      requiresAuth: true,
    },
  ],
  
  icons: [
    {
      value: 'iconfinder',
      label: 'Iconfinder',
      domain: 'iconfinder.com',
      category: 'icons',
      supportsFilters: ['style', 'size', 'category', 'premium', 'vector', 'license'],
      requiresAuth: true,
    },
    {
      value: 'iconify',
      label: 'Iconify',
      domain: 'iconify.design',
      category: 'icons',
      supportsFilters: ['style', 'category'],
      requiresAuth: false,
    },
  ],
  
  emojis: [
    {
      value: 'emoji-api',
      label: 'Emoji API',
      domain: 'emoji-api.com',
      category: 'emojis',
      supportsFilters: ['category'],
      requiresAuth: false,
    },
    {
      value: 'openmoji',
      label: 'OpenMoji',
      domain: 'openmoji.org',
      category: 'emojis',
      supportsFilters: ['category', 'style'],
      requiresAuth: false,
    },
  ],
  
  images: [
    {
      value: 'unsplash',
      label: 'Unsplash',
      domain: 'unsplash.com',
      category: 'images',
      supportsFilters: ['orientation', 'color', 'category'],
      requiresAuth: false,
    },
    {
      value: 'artstation',
      label: 'ArtStation',
      domain: 'artstation.com',
      category: 'images',
      supportsFilters: ['category'],
      requiresAuth: false,
    },
    {
      value: 'deviantart',
      label: 'DeviantArt',
      domain: 'deviantart.com',
      category: 'images',
      supportsFilters: ['category'],
      requiresAuth: true,
    },
  ],
  
  stickers: [
    {
      value: 'giphy',
      label: 'Giphy Stickers',
      domain: 'giphy.com',
      category: 'stickers',
      supportsFilters: [
        'rating', 
        'lang', 
        'random_id', 
        'bundle', 
        'country_code', 
        'region', 
        'remove_low_contrast'
      ],
      requiresAuth: true,
    },
    {
      value: 'tenor_stickers',
      label: 'Tenor Stickers',
      domain: 'tenor.googleapis.com',
      category: 'stickers',
      supportsFilters: [
        'rating',
        'lang',
        'client_key',
        'country',
        'media_filter',
      ],
      requiresAuth: true,
    },
  ],
};

export const getAllAssetConfigs = (): AssetSearchConfig[] => {
  return Object.values(ASSET_SEARCH_CONFIGS).flat();
};

export const getConfigsByCategory = (category: string): AssetSearchConfig[] => {
  return ASSET_SEARCH_CONFIGS[category] || [];
};

export const getConfigByValue = (value: string): AssetSearchConfig | undefined => {
  return getAllAssetConfigs().find(config => config.value === value);
};
