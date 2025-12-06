import { toast } from '@/shared/components/ui/toast';
import { useErrorStore } from '@/app/store';

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AppErrorInterface {
    message: string;
    source: string;
    level: ErrorLevel;
    timestamp?: Date;
    stack?: string;
}

// Compatibility wrapper for existing code using AppError class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (
    source: string,
    error: unknown,
    level: ErrorLevel = 'error',
    userMessage?: string
): void => {
    const errorStore = useErrorStore.getState();

    const errorMessage = userMessage || (
        error instanceof Error
            ? error.message
            : String(error)
    );

    const appError: AppErrorInterface = {
        message: errorMessage,
        source,
        level,
        timestamp: new Date(),
        stack: error instanceof Error ? error.stack : undefined
    };

    // Log to console
    console.error(`[${source}] ${errorMessage}`, error);

    // Add to store for UI display
    // Note: useErrorStore (via uiStore) expects a specific shape.
    // We adapt our interface to what uiStore likely expects or if it's a new store, we assume it matches.
    // Based on prior code, uiStore.addError takes { message, source, level? }
    errorStore.addError(appError);

    // For critical errors, show a toast immediately
    if (level === 'critical' || level === 'error') {
         toast({
            title: `${source} Error`,
            description: errorMessage,
            variant: 'destructive',
        });
    }
};

export const useErrorHandler = () => {
    const handleComponentError = (
        error: unknown,
        componentName: string,
        userMessage?: string
    ) => {
        handleError(componentName, error, 'error', userMessage);
    };

    return { handleComponentError };
};

// Legacy support - Deprecated
export const createErrorHandler = (context: string) => ({
  handle: (error: unknown, fallbackMessage = 'An unexpected error occurred'): AppError => {
    handleError(context, error, 'error', fallbackMessage);
    return new AppError(fallbackMessage, 'UNKNOWN', 'high', fallbackMessage);
  }
});

// Legacy support - Deprecated
export const handleAndNotify = (error: unknown, context: string, fallbackMessage?: string) => {
  handleError(context, error, 'error', fallbackMessage);
};