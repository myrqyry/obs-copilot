/**
 * Debounce function to limit the rate at which a function can fire
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Whether to execute on the leading edge
 */
export function debounce(func, wait, immediate = false) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate)
                func(...args);
        };
        const callNow = immediate && !timeout;
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func(...args);
    };
}
/**
 * Throttle function to limit the rate at which a function can fire
 * @param func The function to throttle
 * @param limit The number of milliseconds to throttle by
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/**
 * Performance monitoring utility to track slow operations
 * @param name The name of the operation being monitored
 * @param fn The function to execute and monitor
 */
export function withPerformanceMonitoring(name, fn) {
    return ((...args) => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();
        const duration = end - start;
        if (duration > 50) { // Log operations taking more than 50ms
            console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
        }
        return result;
    });
}
/**
 * Async performance monitoring utility
 * @param name The name of the operation being monitored
 * @param fn The async function to execute and monitor
 */
export async function withAsyncPerformanceMonitoring(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    if (duration > 100) { // Log async operations taking more than 100ms
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }
    return result;
}
