import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { gsap } from 'gsap';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility to check if user prefers reduced motion
 * Used by GSAP components to respect accessibility preferences
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safe GSAP animation that respects user preferences
 * Returns whether animation was actually started
 */
export function safeGsapTo(target: any, vars: any): boolean {
  if (prefersReducedMotion()) {
    // Apply final state immediately without animation
    if (vars.scale !== undefined) target.style.transform = `scale(${vars.scale})`;
    if (vars.y !== undefined) target.style.transform += ` translateY(${vars.y}px)`;
    if (vars.opacity !== undefined) target.style.opacity = vars.opacity;
    return false;
  }

  gsap.to(target, vars);
  return true;
}

/**
 * Safe GSAP set that respects user preferences
 */
export function safeGsapSet(target: any, vars: any): void {
  gsap.set(target, vars);
}

/**
 * Proxies an image URL through our Netlify function to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns The proxied image URL
 */
export const getProxiedImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // If we're in development, use the local proxy
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `/api/image?url=${encodeURIComponent(imageUrl)}`;
  }

  // In production, use the Netlify function
  return `/.netlify/functions/proxy?api=image&url=${encodeURIComponent(imageUrl)}`;
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
    ];

    return externalDomains.some((domain) => url.hostname.includes(domain));
  } catch {
    // If URL parsing fails, assume it's a relative URL and doesn't need proxying
    return false;
  }
};
