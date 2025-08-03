export const mapWallhavenToStandard = (item: any) => ({
    id: item.id,
    title: item.id,
    url: item.path,
    thumbnail: item.thumbs?.small || item.thumbs?.original,
    source: 'wallhaven',
    author: 'Unknown',
});

export const mapUnsplashToStandard = (item: any) => ({
    id: item.id,
    title: item.description || item.alt_description || '',
    url: item.urls.regular,
    thumbnail: item.urls.thumb,
    source: 'unsplash',
    author: item.user?.name || 'Unknown',
});

export const mapPexelsToStandard = (item: any) => ({
    id: item.id,
    title: item.alt || '',
    url: item.src.large,
    thumbnail: item.src.medium,
    source: 'pexels',
    author: item.photographer || 'Unknown',
});

export const mapPixabayToStandard = (item: any) => ({
    id: item.id,
    title: item.tags || '',
    url: item.largeImageURL,
    thumbnail: item.webformatURL,
    source: 'pixabay',
    author: item.user || 'Unknown',
});

export const mapDeviantArtToStandard = (item: any) => ({
    id: item.deviationid,
    title: item.title || '',
    url: item.preview?.src || item.content?.src,
    thumbnail: item.thumbs?.[0]?.src,
    source: 'deviantart',
    author: item.author?.username || 'Unknown',
});

export const mapArtStationToStandard = (item: any) => ({
    id: item.id,
    title: item.title || '',
    url: item.cover?.large_image_url || item.cover?.image_url,
    thumbnail: item.cover?.thumb_url,
    source: 'artstation',
    author: item.user?.full_name || 'Unknown',
});

export const apiMappers: { [key: string]: (item: any) => any } = {
    wallhaven: mapWallhavenToStandard,
    unsplash: mapUnsplashToStandard,
    pexels: mapPexelsToStandard,
    pixabay: mapPixabayToStandard,
    deviantart: mapDeviantArtToStandard,
    artstation: mapArtStationToStandard,
};
