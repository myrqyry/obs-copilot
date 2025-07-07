/**
 * Proxies an image URL through our Netlify function to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns The proxied image URL
 */
export const getProxiedImageUrl = (imageUrl) => {
    if (!imageUrl)
        return '';
    // Check if the image URL should be proxied (external domains that might have CORS issues)
    const shouldProxy = (url) => {
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
                'cdna.artstation.com'
            ];
            return externalDomains.some(domain => urlObj.hostname.includes(domain));
        }
        catch {
            // If URL parsing fails, assume it's a relative URL and doesn't need proxying
            return false;
        }
    };
    if (shouldProxy(imageUrl)) {
        // If we're in development, use the local proxy
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `/api/image?url=${encodeURIComponent(imageUrl)}`;
        }
        // In production, use the Netlify function
        return `/.netlify/functions/proxy?api=image&url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
};
/**
 * Checks if an image URL should be proxied (external domains that might have CORS issues)
 * @param imageUrl The image URL to check
 * @returns True if the image should be proxied
 */
export const shouldProxyImage = (imageUrl) => {
    if (!imageUrl)
        return false;
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
            'cdna.artstation.com'
        ];
        return externalDomains.some(domain => url.hostname.includes(domain));
    }
    catch {
        // If URL parsing fails, assume it's a relative URL and doesn't need proxying
        return false;
    }
};
