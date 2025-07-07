/**
 * Debounce function to limit the rate at which a function can fire
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to execute on the leading edge
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number, immediate?: boolean): (...args: Parameters<T>) => void;
/**
 * Throttle function to limit the rate at which a function can fire
 * @param func The function to throttle
 * @param limit The number of milliseconds to throttle by
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Performance monitoring utility to track slow operations
 * @param name The name of the operation being monitored
 * @param fn The function to execute and monitor
 */
export declare function withPerformanceMonitoring<T extends (...args: any[]) => any>(name: string, fn: T): T;
/**
 * Async performance monitoring utility
 * @param name The name of the operation being monitored
 * @param fn The async function to execute and monitor
 */
export declare function withAsyncPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): Promise<ReturnType<T>>;
