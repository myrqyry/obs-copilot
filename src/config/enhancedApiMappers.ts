// src/config/enhancedApiMappers.ts
import { StandardApiItem } from '@/types/assetSearch';

// Enhanced mappers with more comprehensive data extraction
export const enhancedApiMappers = {
  unsplash: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.description || item.alt_description || 'Untitled',
    url: item.urls?.regular || item.urls?.full,
    thumbnail: item.urls?.thumb || item.urls?.small,
    source: 'unsplash',
    author: item.user?.name || 'Unknown',
    description: item.description || item.alt_description,
    tags: item.tags?.map((tag: any) => tag.title) || [],
    dimensions: {
      width: item.width || 0,
      height: item.height || 0,
    },
    license: 'Unsplash License',
    downloadUrl: item.links?.download,
  }),

  pexels: (item: any): StandardApiItem => ({
    id: String(item.id),
    title: item.alt || 'Untitled',
    url: item.src?.large || item.src?.original,
    thumbnail: item.src?.medium || item.src?.small,
    source: 'pexels',
    author: item.photographer || 'Unknown',
    description: item.alt,
    dimensions: {
      width: item.width || 0,
      height: item.height || 0,
    },
    license: 'Pexels License',
    downloadUrl: item.src?.original,
  }),

  pixabay: (item: any): StandardApiItem => ({
    id: String(item.id),
    title: item.tags || 'Untitled',
    url: item.largeImageURL || item.fullHDURL,
    thumbnail: item.webformatURL || item.previewURL,
    source: 'pixabay',
    author: item.user || 'Unknown',
    description: item.tags,
    tags: item.tags?.split(', ') || [],
    dimensions: {
      width: item.imageWidth || 0,
      height: item.imageHeight || 0,
    },
    fileSize: item.imageSize,
    license: 'Pixabay License',
    downloadUrl: item.largeImageURL,
  }),

  wallhaven: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.id,
    url: item.path,
    thumbnail: item.thumbs?.small || item.thumbs?.original,
    source: 'wallhaven',
    author: item.uploader?.username || 'Unknown',
    dimensions: {
      width: item.resolution?.split('x')[0] ? parseInt(item.resolution.split('x')[0]) : 0,
      height: item.resolution?.split('x')[1] ? parseInt(item.resolution.split('x')[1]) : 0,
    },
    fileSize: item.file_size,
    format: item.file_type,
    tags: item.tags?.map((tag: any) => tag.name) || [],
  }),

  giphy: (item: any): StandardApiItem => ({
    id: String(item.id),
    title: item.title || 'Untitled GIF',
    url: item.images?.original?.url || item.url,
    thumbnail: item.images?.fixed_height_small?.url || item.images?.preview_gif?.url,
    source: 'giphy',
    author: item.user?.display_name || item.username || 'Unknown',
    description: item.title,
    tags: item.tags || [],
    dimensions: {
      width: parseInt(item.images?.original?.width) || 0,
      height: parseInt(item.images?.original?.height) || 0,
    },
    fileSize: parseInt(item.images?.original?.size) || 0,
    format: 'gif',
    rating: item.rating,
    duration: parseFloat(item.images?.original?.frames) / 15 || 0, // Approximate duration
  }),

  tenor: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.title || item.content_description || 'Untitled GIF',
    url: item.media_formats?.gif?.url || item.media?.[0]?.gif?.url,
    thumbnail: item.media_formats?.tinygif?.url || item.media?.[0]?.tinygif?.url,
    source: 'tenor',
    author: 'Tenor',
    description: item.content_description,
    tags: item.tags || [],
    dimensions: {
      width: parseInt(item.media_formats?.gif?.dims?.[0]) || 0,
      height: parseInt(item.media_formats?.gif?.dims?.[1]) || 0,
    },
    fileSize: parseInt(item.media_formats?.gif?.size) || 0,
    format: 'gif',
    duration: parseFloat(item.media_formats?.gif?.duration) || 0,
  }),

  tenor_stickers: (item: any): StandardApiItem => ({
    id: item.id,
    title: item.title || item.content_description || 'Untitled Sticker',
    url: item.media_formats?.sticker?.url || item.media?.[0]?.sticker?.url,
    thumbnail: item.media_formats?.tinysticker?.url || item.media?.[0]?.tinysticker?.url,
    source: 'tenor',
    author: 'Tenor',
    description: item.content_description,
    tags: item.tags || [],
    dimensions: {
      width: parseInt(item.media_formats?.sticker?.dims?.[0]) || 0,
      height: parseInt(item.media_formats?.sticker?.dims?.[1]) || 0,
    },
    fileSize: parseInt(item.media_formats?.sticker?.size) || 0,
    format: 'sticker',
    duration: parseFloat(item.media_formats?.sticker?.duration) || 0,
  }),

  iconfinder: (item: any): StandardApiItem => ({
    id: String(item.icon_id),
    title: item.tags?.[0] || 'Icon',
    url: item.vector_sizes?.[0]?.formats?.[0]?.download_url || item.raster_sizes?.[0]?.formats?.[0]?.download_url,
    thumbnail: item.raster_sizes?.find((size: any) => size.size <= 128)?.formats?.[0]?.preview_url || item.raster_sizes?.[0]?.formats?.[0]?.preview_url,
    source: 'iconfinder',
    author: item.user?.username || 'Unknown',
    description: item.tags?.join(', '),
    tags: item.tags || [],
    format: 'svg',
    license: item.license?.name,
    svgContent: item.svgContent, // This would need to be fetched separately
  }),

  iconify: (item: any): StandardApiItem => ({
    id: item,
    title: item.replace(/:/, ' '),
    url: `https://api.iconify.design/${item}.svg`,
    thumbnail: `https://api.iconify.design/${item}.svg?height=128`,
    source: 'iconify',
    author: item.split(':')[0],
    description: item,
    tags: [item.split(':')[0]],
    format: 'svg',
  }),

  'emoji-api': (item: any): StandardApiItem => ({
    id: item.slug || item.codePoint,
    title: item.unicodeName || item.name,
    url: `https://emoji-api.com/emoji/${item.slug}`,
    thumbnail: `data:text/plain;charset=utf-8,${item.character}`,
    source: 'emoji-api',
    author: 'Unicode Consortium',
    description: item.unicodeName,
    character: item.character,
    tags: item.group ? [item.group, item.subGroup].filter(Boolean) : [],
  }),

  artstation: (item: any): StandardApiItem => ({
    id: String(item.id),
    title: item.title || 'Untitled Artwork',
    url: item.cover?.large_image_url || item.cover?.image_url,
    thumbnail: item.cover?.thumb_url || item.cover?.small_square_url,
    source: 'artstation',
    author: item.user?.full_name || item.user?.username || 'Unknown',
    description: item.description,
    tags: item.tags?.map((tag: any) => tag.name) || [],
    license: 'ArtStation License',
  }),

  deviantart: (item: any): StandardApiItem => ({
    id: item.deviationid,
    title: item.title || 'Untitled',
    url: item.preview?.src || item.content?.src,
    thumbnail: item.thumbs?.[0]?.src || item.preview?.src,
    source: 'deviantart',
    author: item.author?.username || 'Unknown',
    description: item.excerpt,
    tags: item.tags?.map((tag: any) => tag.tag_name) || [],
    dimensions: {
      width: item.preview?.width || 0,
      height: item.preview?.height || 0,
    },
  }),
};

// Legacy compatibility - export individual mappers
export const mapUnsplashToStandard = enhancedApiMappers.unsplash;
export const mapPexelsToStandard = enhancedApiMappers.pexels;
export const mapPixabayToStandard = enhancedApiMappers.pixabay;
export const mapWallhavenToStandard = enhancedApiMappers.wallhaven;
export const mapGiphyToStandard = enhancedApiMappers.giphy;
export const mapTenorToStandard = enhancedApiMappers.tenor;
export const mapIconfinderToStandard = enhancedApiMappers.iconfinder;
export const mapEmojiApiToStandard = enhancedApiMappers['emoji-api'];
export const mapArtStationToStandard = enhancedApiMappers.artstation;
export const mapDeviantArtToStandard = enhancedApiMappers.deviantart;

// Main export for the enhanced mappers
export const apiMappers = enhancedApiMappers;
