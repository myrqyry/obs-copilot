import { logger } from './logger';

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to execute on the leading edge
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit the rate at which a function can fire
 * @param func The function to throttle
 * @param limit The number of milliseconds to throttle by
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance monitoring utility to track slow operations
 * @param name The name of the operation being monitored
 * @param fn The function to execute and monitor
 */
export function withPerformanceMonitoring<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T,
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;

    if (duration > 50) {
      // Log operations taking more than 50ms
      logger.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }) as T;
}

/**
 * Async performance monitoring utility
 * @param name The name of the operation being monitored
 * @param fn The async function to execute and monitor
 */
export async function withAsyncPerformanceMonitoring<
  T extends (...args: unknown[]) => Promise<unknown>,
>(name: string, fn: T): Promise<ReturnType<T>> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > 100) {
    // Log async operations taking more than 100ms
    logger.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
  }

  return result as ReturnType<T>;
}

/**
 * Safely extracts the hostname from a URL-like string
 * @param urlLike The URL-like string to parse
 * @returns The hostname if successfully parsed, otherwise an empty string
 */
export function safeHostname(urlLike: string): string {
  try {
    return new URL(urlLike).hostname;
  } catch (error) {
    try {
      return new URL(`https://${urlLike}`).hostname;
    } catch (error) {
      logger.warn(`Invalid URL: ${urlLike}`);
      return '';
    }
  }
}
