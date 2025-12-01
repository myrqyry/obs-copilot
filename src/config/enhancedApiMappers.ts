import { StandardApiItem } from '@/types/assetSearch';

type MapperFunction = (item: any) => StandardApiItem;

export const mapUnsplashToStandard: MapperFunction = (item) => ({
  id: item.id,
  title: item.alt_description || 'Unsplash Image',
  url: item.urls.regular,
  thumbnail: item.urls.small,
  source: 'Unsplash',
  author: item.user.name,
  description: item.description,
  tags: item.tags.map((t: any) => t.title),
  dimensions: { width: item.width, height: item.height },
  downloadUrl: item.links.download,
  format: 'jpeg',
});

export const mapPexelsToStandard: MapperFunction = (item) => ({
  id: String(item.id),
  title: item.alt || 'Pexels Image',
  url: item.src.large,
  thumbnail: item.src.medium,
  source: 'Pexels',
  author: item.photographer,
  dimensions: { width: item.width, height: item.height },
  downloadUrl: item.src.original,
  format: 'jpeg',
});

export const mapPixabayToStandard: MapperFunction = (item) => ({
  id: String(item.id),
  title: item.tags || 'Pixabay Image',
  url: item.largeImageURL,
  thumbnail: item.webformatURL,
  source: 'Pixabay',
  author: item.user,
  tags: item.tags.split(',').map((t: string) => t.trim()),
  dimensions: { width: item.imageWidth, height: item.imageHeight },
  fileSize: item.imageSize,
  downloadUrl: item.largeImageURL,
  format: 'jpeg',
});

export const mapWallhavenToStandard: MapperFunction = (item) => ({
  id: item.id,
  title: `Wallhaven ${item.id}`,
  url: item.path,
  thumbnail: item.thumbs.small,
  source: 'Wallhaven',
  author: item.uploader?.username || 'Unknown',
  tags: item.tags.map((t: any) => t.name),
  dimensions: { width: item.dimension_x, height: item.dimension_y },
  fileSize: item.file_size,
  format: 'jpeg',
});

export const mapGiphyToStandard: MapperFunction = (item) => ({
  id: item.id,
  title: item.title,
  url: item.images.original.url,
  thumbnail: item.images.fixed_height.url,
  source: 'Giphy',
  author: item.user?.display_name || 'Giphy',
  rating: item.rating,
  dimensions: { width: Number(item.images.original.width), height: Number(item.images.original.height) },
  format: 'gif',
});

export const mapTenorToStandard: MapperFunction = (item) => ({
  id: item.id,
  title: item.content_description,
  url: item.media_formats.gif.url,
  thumbnail: item.media_formats.tinygif.url,
  source: 'Tenor',
  author: 'Tenor',
  dimensions: { width: item.media_formats.gif.dims[0], height: item.media_formats.gif.dims[1] },
  format: 'gif',
});

export const mapIconfinderToStandard: MapperFunction = (item) => ({
  id: String(item.icon_id),
  title: item.tags.join(', ') || 'Icon',
  url: item.raster_sizes[item.raster_sizes.length - 1].formats[0].preview_url,
  thumbnail: item.raster_sizes.find((s: any) => s.size === 64)?.formats[0].preview_url || item.raster_sizes[0].formats[0].preview_url,
  source: 'Iconfinder',
  author: item.styles?.[0]?.name || 'Unknown',
  tags: item.tags,
  license: item.license?.name,
  format: 'png',
});

export const mapEmojiApiToStandard: MapperFunction = (item) => ({
  id: item.slug,
  title: item.slug.replace(/-/g, ' '),
  character: item.character,
  url: '', // Emojis don't have a standard image URL in this context
  thumbnail: '', // Emojis don't have a standard thumbnail URL in this context
  source: 'Emoji API',
  author: 'Unicode',
  description: `Unicode: ${item.unicodeName}`,
  tags: [item.group, ...(item.subGroup ? [item.subGroup] : [])],
  format: 'emoji'
});

export const mapDeviantArtToStandard: MapperFunction = (item) => ({
  id: item.deviationid,
  title: item.title || '',
  url: item.preview?.src || item.content?.src,
  thumbnail: item.thumbs?.[0]?.src,
  source: 'DeviantArt',
  author: item.author?.username || 'Unknown',
});

export const mapArtStationToStandard: MapperFunction = (item) => ({
  id: item.id,
  title: item.title || '',
  url: item.cover?.large_image_url || item.cover?.image_url,
  thumbnail: item.cover?.thumb_url,
  source: 'ArtStation',
  author: item.user?.full_name || 'Unknown',
});

export const apiMappers: Record<string, MapperFunction> = {
  unsplash: mapUnsplashToStandard,
  pexels: mapPexelsToStandard,
  pixabay: mapPixabayToStandard,
  wallhaven: mapWallhavenToStandard,
  giphy: mapGiphyToStandard,
  tenor: mapTenorToStandard,
  iconfinder: mapIconfinderToStandard,
  'emoji-api': mapEmojiApiToStandard,
  deviantart: mapDeviantArtToStandard,
  artstation: mapArtStationToStandard,
};