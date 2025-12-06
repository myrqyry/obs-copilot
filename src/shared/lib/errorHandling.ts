import { toast } from 'sonner';

export interface ErrorMetadata {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public recoverable: boolean = true,
    public metadata?: Partial<ErrorMetadata>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error Logger Service
class ErrorLogger {
  private errors: AppError[] = [];
  private maxErrors = 100;

  log(error: Error | AppError, metadata?: Partial<ErrorMetadata>): void {
    const appError = error instanceof AppError
      ? error
      : this.convertToAppError(error);

    appError.metadata = {
      ...appError.metadata,
      ...metadata,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to local history
    this.errors.unshift(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorLogger]', appError);
    }

    // Send to monitoring service
    this.sendToMonitoring(appError);

    // Show user notification based on severity
    this.notifyUser(appError);
  }

  private convertToAppError(error: Error): AppError {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'medium',
      false,
      { component: 'Unknown' }
    );
  }

  private async sendToMonitoring(error: AppError): Promise<void> {
    // Only send in production
    if (!import.meta.env.PROD) return;

    try {
      // Send to your monitoring service (e.g., Sentry, LogRocket)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          code: error.code,
          severity: error.severity,
          stack: error.stack,
          metadata: error.metadata,
        }),
      });
    } catch (err) {
      console.error('Failed to send error to monitoring:', err);
    }
  }

  private notifyUser(appError: AppError): void {
    const userMessage = this.getUserFriendlyMessage(appError);

    switch (appError.severity) {
      case 'low':
        // Don't notify for low severity
        break;
      case 'medium':
        toast.warning(userMessage);
        break;
      case 'high':
        toast.error(userMessage);
        break;
      case 'critical':
        toast.error(userMessage, { duration: Infinity });
        break;
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    const errorMessages: Record<string, string> = {
      OBS_CONNECTION_FAILED: 'Unable to connect to OBS. Please check if OBS is running and WebSocket is enabled.',
      GEMINI_API_ERROR: 'AI service is temporarily unavailable. Please try again.',
      NETWORK_ERROR: 'Network connection lost. Please check your internet connection.',
      PERMISSION_DENIED: 'You don\'t have permission to perform this action.',
      UNKNOWN_ERROR: 'Something went wrong. Please try refreshing the page.',
    };

    return errorMessages[error.code] || error.message;
  }

  getRecentErrors(): AppError[] {
    return this.errors;
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorLogger = new ErrorLogger();

// Error Recovery Utilities
export async function withErrorRecovery<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    fallback?: T;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, fallback, onError } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (isLastAttempt) {
        onError?.(error as Error);
        errorLogger.log(error as Error);

        if (fallback !== undefined) {
          return fallback;
        }
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw new Error('withErrorRecovery: Unreachable code');
}
