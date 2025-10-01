// Legacy API mappers - maintained for backward compatibility
// For new implementations, use @/config/enhancedApiMappers instead

import { StandardApiItem } from '@/types/api';
import { 
  apiMappers as enhancedApiMappers,
  mapWallhavenToStandard as enhancedMapWallhavenToStandard,
  mapUnsplashToStandard as enhancedMapUnsplashToStandard,
  mapPexelsToStandard as enhancedMapPexelsToStandard,
  mapPixabayToStandard as enhancedMapPixabayToStandard,
  mapDeviantArtToStandard as enhancedMapDeviantArtToStandard,
  mapArtStationToStandard as enhancedMapArtStationToStandard,
  mapGiphyToStandard as enhancedMapGiphyToStandard,
} from '@/config/enhancedApiMappers';

// Re-export enhanced mappers for backward compatibility
export const mapWallhavenToStandard = enhancedMapWallhavenToStandard;
export const mapUnsplashToStandard = enhancedMapUnsplashToStandard;
export const mapPexelsToStandard = enhancedMapPexelsToStandard;
export const mapPixabayToStandard = enhancedMapPixabayToStandard;
export const mapDeviantArtToStandard = enhancedMapDeviantArtToStandard;
export const mapArtStationToStandard = enhancedMapArtStationToStandard;
export const mapGiphyToStandard = enhancedMapGiphyToStandard;

// Re-export enhanced apiMappers object
export const apiMappers = enhancedApiMappers;

// Legacy fallback mappers for basic compatibility
const legacyMappers: { [key: string]: (item: any) => StandardApiItem } = {
  wallhaven: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.id,
    url: item.path,
    thumbnail: item.thumbs?.small || item.thumbs?.original,
    source: 'wallhaven',
    author: 'Unknown',
  }),
  unsplash: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.description || item.alt_description || '',
    url: item.urls.regular,
    thumbnail: item.urls.thumb,
    source: 'unsplash',
    author: item.user?.name || 'Unknown',
  }),
  pexels: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.alt || '',
    url: item.src.large,
    thumbnail: item.src.medium,
    source: 'pexels',
    author: item.photographer || 'Unknown',
  }),
  pixabay: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.tags || '',
    url: item.largeImageURL,
    thumbnail: item.webformatURL,
    source: 'pixabay',
    author: item.user || 'Unknown',
  }),
  deviantart: (item: any): StandardApiItem => ({
    id: item.deviationid,
    title: item.title || '',
    url: item.preview?.src || item.content?.src,
    thumbnail: item.thumbs?.[0]?.src,
    source: 'deviantart',
    author: item.author?.username || 'Unknown',
  }),
  artstation: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.title || '',
    url: item.cover?.large_image_url || item.cover?.image_url,
    thumbnail: item.cover?.thumb_url,
    source: 'artstation',
    author: item.user?.full_name || 'Unknown',
  }),
  giphy: (item: any): StandardApiItem => ({
    id: String(item.id),
    title: item.title || 'Untitled',
    url: item.images?.original?.url || item.url || '',
    thumbnail: item.images?.fixed_height_small?.url || item.thumbnail || '',
    source: 'giphy',
    author: item.user?.display_name || item.username || 'Unknown',
  }),
};

// Export legacy mappers as fallback
export { legacyMappers };
