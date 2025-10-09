import { AssetSearchConfig, AssetCategory } from '@/types/assetSearch';

const allAssetConfigs: AssetSearchConfig[] = [
  // Backgrounds
  {
    value: 'unsplash',
    label: 'Unsplash',
    domain: 'unsplash.com',
    category: 'backgrounds',
    requiresAuth: true,
  },
  {
    value: 'pexels',
    label: 'Pexels',
    domain: 'pexels.com',
    category: 'backgrounds',
    requiresAuth: true,
  },
  {
    value: 'pixabay',
    label: 'Pixabay',
    domain: 'pixabay.com',
    category: 'backgrounds',
    requiresAuth: true,
  },
  {
    value: 'wallhaven',
    label: 'Wallhaven',
    domain: 'wallhaven.cc',
    category: 'backgrounds',
  },
  // GIFs
  {
    value: 'giphy',
    label: 'Giphy',
    domain: 'giphy.com',
    category: 'gifs',
    requiresAuth: true,
  },
  {
    value: 'tenor',
    label: 'Tenor',
    domain: 'tenor.com',
    category: 'gifs',
    requiresAuth: true,
  },
  // Images
  {
    value: 'artstation',
    label: 'ArtStation',
    domain: 'artstation.com',
    category: 'images',
  },
  {
    value: 'deviantart',
    label: 'DeviantArt',
    domain: 'deviantart.com',
    category: 'images',
    requiresAuth: true,
  },
  // Icons
  {
    value: 'iconfinder',
    label: 'Iconfinder',
    domain: 'iconfinder.com',
    category: 'icons',
    requiresAuth: true,
  },
  // Stickers
  {
    value: 'tenor_stickers',
    label: 'Tenor Stickers',
    domain: 'tenor.com',
    category: 'stickers',
    requiresAuth: true,
  },
  // Emojis
  {
    value: 'emoji-api',
    label: 'Emoji API',
    domain: 'emoji-api.com',
    category: 'emojis',
  },
];

export const getConfigsByCategory = (category: AssetCategory): AssetSearchConfig[] => {
  return allAssetConfigs.filter(config => config.category === category);
};

export const getAllAssetConfigs = (): AssetSearchConfig[] => {
  return allAssetConfigs;
};

export default allAssetConfigs;