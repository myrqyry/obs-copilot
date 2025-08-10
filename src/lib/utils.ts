import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
export function safeGsapTo(target: any, vars: any): boolean {
  if (prefersReducedMotion()) {
    return false;
  }

  try {
    gsap.to(target, vars);
    return true;
  } catch (error) {
    console.error('GSAP safeGsapTo error:', error);
    return false;
  }
}

/**
 * Safely performs a GSAP 'set' animation, handling potential errors and reduced motion preferences.
 * @param target The GSAP target (element, selector, etc.).
 * @param vars The GSAP animation variables.
 */
export function safeGsapSet(target: any, vars: any): void {
  if (prefersReducedMotion()) {
    return;
  }

  try {
    gsap.set(target, vars);
  } catch (error) {
    console.error('GSAP safeGsapSet error:', error);
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
