import { type ClassValue } from "clsx";
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Utility to check if user prefers reduced motion
 * Used by GSAP components to respect accessibility preferences
 */
export declare function prefersReducedMotion(): boolean;
/**
 * Safe GSAP animation that respects user preferences
 * Returns whether animation was actually started
 */
export declare function safeGsapTo(target: any, vars: any): boolean;
/**
 * Safe GSAP set that respects user preferences
 */
export declare function safeGsapSet(target: any, vars: any): void;
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
