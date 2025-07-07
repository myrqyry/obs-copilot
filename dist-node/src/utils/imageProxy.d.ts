/**
 * Proxies an image URL through our Netlify function to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns The proxied image URL
 */
export declare const getProxiedImageUrl: (imageUrl: string) => string;
/**
 * Checks if an image URL should be proxied (external domains that might have CORS issues)
 * @param imageUrl The image URL to check
 * @returns True if the image should be proxied
 */
export declare const shouldProxyImage: (imageUrl: string) => boolean;
