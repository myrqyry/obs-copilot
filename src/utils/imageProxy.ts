import { getApiEndpoint } from './api';

export const getHostname = (): string => {
  return window.location.hostname;
};

/**
 * Proxies an image URL through our backend to avoid browser CORS issues.
 * @param imageUrl The original image URL to proxy.
 * @returns The new, proxied URL that points to our own server.
 */
export const getProxiedImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // This is the internal helper function that decides if a URL is external
  // and needs to be proxied.
  const shouldProxy = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // This is the list of external domains that we know cause CORS issues.
      const externalDomains = [
        'th.wallhaven.cc',
        'w.wallhaven.cc',
        'images.unsplash.com',
        'images.pexels.com',
        'cdn.pixabay.com',
        'images.deviantart.com',
        'cdnb.artstation.com',
        'cdna.artstation.com',
        'google.com', // For the favicon service
      ];
      // If the image's hostname is in our list, we should proxy it.
      return externalDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      // If parsing fails, it's a relative path like '/assets/icon.png' and doesn't need proxying.
      return false;
    }
  };

  if (shouldProxy(imageUrl)) {
    // If it's an external URL, we build a URL to our own backend's proxy endpoint.
    const params = new URLSearchParams({ url: imageUrl });
    return getApiEndpoint('image', undefined, params);
  }

  // Otherwise, just return the original URL.
  return imageUrl;
};

/**
 * A specific helper to get a proxied URL for a website's favicon.
 * @param domain The domain of the website (e.g., "obsproject.com").
 * @param size The desired size of the icon (e.g., 16).
 * @returns The proxied URL to fetch the favicon.
 */
export const getProxiedFaviconUrl = (domain: string, size: number = 16): string => {
  if (!domain) return '';

  // We use Google's public favicon service as a reliable source.
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

  // We then run that Google URL through our own proxy to avoid any potential CORS issues.
  return getProxiedImageUrl(faviconUrl);
};