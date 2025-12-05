// src/utils/analytics.ts
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private metrics: PerformanceMetric[] = [];

  trackPerformance<T>(name: string, fn: () => T, metadata?: any): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  getMetrics() {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const analytics = new AnalyticsService();
