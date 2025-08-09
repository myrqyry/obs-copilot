import { getApiEndpoint } from './api';

export const getHostname = (): string => {
  return window.location.hostname;
};

/**
 * Proxies an image URL through our Netlify function to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns The proxied image URL
 */
export const getProxiedImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // Check if the image URL should be proxied (external domains that might have CORS issues)
  const shouldProxy = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const externalDomains = [
        'th.wallhaven.cc',
        'w.wallhaven.cc',
        'wallhaven.cc',
        'images.unsplash.com',
        'images.pexels.com',
        'cdn.pixabay.com',
        'images.deviantart.com',
        'cdnb.artstation.com',
        'cdna.artstation.com',
        'google.com',
      ];

      return externalDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      // If URL parsing fails, assume it's a relative URL and doesn't need proxying
      return false;
    }
  };

  if (shouldProxy(imageUrl)) {
    const params = new URLSearchParams({ url: imageUrl });
    return getApiEndpoint('image', undefined, params);
  }

  return imageUrl;
};

/**
 * Checks if an image URL should be proxied (external domains that might have CORS issues)
 * @param imageUrl The image URL to check
 * @returns True if the image should be proxied
 */
export const shouldProxyImage = (imageUrl: string): boolean => {
  if (!imageUrl) return false;

  try {
    const url = new URL(imageUrl);
    const externalDomains = [
      'th.wallhaven.cc',
      'w.wallhaven.cc',
      'wallhaven.cc',
      'images.unsplash.com',
      'images.pexels.com',
      'cdn.pixabay.com',
      'images.deviantart.com',
      'cdnb.artstation.com',
      'cdna.artstation.com',
      'google.com',
    ];

    return externalDomains.some((domain) => url.hostname.includes(domain));
  } catch {
    // If URL parsing fails, assume it's a relative URL and doesn't need proxying
    return false;
  }
};

/**
 * Returns the proxied URL for a favicon.
 * @param domain The domain to get the favicon for.
 * @param size The size of the favicon.
 * @returns The proxied favicon URL.
 */
export const getProxiedFaviconUrl = (domain: string, size = 16): string => {
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  return getProxiedImageUrl(googleUrl);
};
