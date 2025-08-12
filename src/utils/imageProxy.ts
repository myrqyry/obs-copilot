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
 * Checks if we're running in a local development environment
 */
const isLocalEnvironment = (): boolean => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.endsWith('.local');
};

/**
 * Get proxied favicon URL - bypasses proxy for Google favicon service in development
 */
export const getProxiedFaviconUrl = (domain: string, size: number = 16): string => {
  if (!domain) return '';

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

  // In development, Google's favicon service doesn't have CORS issues, so use it directly
  if (isLocalEnvironment()) {
    return faviconUrl;
  }

  // In production, use the proxy
  return getProxiedImageUrl(faviconUrl);
};
