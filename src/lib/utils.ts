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

/**
 * Converts a base64 string to an ArrayBuffer.
 * @param base64 The base64 string to convert.
 * @returns The corresponding ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts a data URL to a Blob URL.
 * @param dataUrl The data URL to convert.
 * @returns The corresponding Blob URL.
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'audio/wav';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return URL.createObjectURL(new Blob([u8arr], { type: mime }));
}
