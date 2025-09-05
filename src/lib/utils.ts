import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { logger } from '../utils/logger'; // Import logger

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Checks if the user prefers reduced motion.
 * @returns True if reduced motion is preferred, false otherwise.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false; // Assume no reduced motion preference in non-browser environments
  }
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Safely performs a GSAP 'to' animation, handling potential errors and reduced motion preferences.
 * @param target The GSAP target (element, selector, etc.).
 * @param vars The GSAP animation variables.
 * @returns True if the animation was attempted, false otherwise.
 */
export function safeGsapTo(target: any, vars: any): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    return null;
  }

  try {
    return gsap.to(target, vars);
  } catch (error) {
    logger.error('GSAP safeGsapTo error:', error);
    return null;
  }
}

/**
 * Safely performs a GSAP 'set' animation, handling potential errors and reduced motion preferences.
 * @param target The GSAP target (element, selector, etc.).
 * @param vars The GSAP animation variables.
 */
export function safeGsapSet(target: any, vars: any): void {
  try {
    gsap.set(target, vars);
  } catch (error) {
    logger.error('GSAP safeGsapSet error:', error);
  }
}

/**
 * Checks if a value is a valid number.
 * @param value The value to check.
 * @returns True if the value is a valid number, false otherwise.
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a valid string.
 * @param value The value to check.
 * @returns True if the value is a valid string, false otherwise.
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid boolean.
 * @param value The value to check.
 * @returns True if the value is a valid boolean, false otherwise.
 */
export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a valid object.
 * @param value The value to check.
 * @returns True if the value is a valid object, false otherwise.
 */
export function isValidObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is a valid array.
 * @param value The value to check.
 * @returns True if the value is a valid array, false otherwise.
 */
export function isValidArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

/**
 * Combines Tailwind CSS classes using `tailwind-merge` and `clsx`.
 * This utility helps in efficiently merging Tailwind classes, resolving conflicts automatically.
 * @param inputs An array of class values to combine.
 * @returns A merged string of Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function dataUrlToBlobUrl(dataUrl: string): string {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1];
    const bstr = atob(base64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], {type: mime});
    return URL.createObjectURL(blob);
}

/**
 * Calculates exponential backoff with full jitter.
 * @param attempt The current retry attempt number.
 * @param base The base backoff time in milliseconds.
 * @param max The maximum backoff time in milliseconds.
 * @returns The backoff time in milliseconds.
 */
export function backoff(attempt: number, base = 500, max = 15000): number {
  const exp = Math.min(max, base * 2 ** attempt);
  const jitter = Math.random() * exp; // Full jitter
  return jitter;
}
