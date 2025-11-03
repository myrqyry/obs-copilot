import { toast } from '@/components/ui/toast';

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

export const createErrorHandler = (context: string) => ({
  handle: (error: unknown, fallbackMessage = 'An unexpected error occurred'): AppError => {
    if (error instanceof AppError) return error;

    let originalError: Error | null = null;
    if (error instanceof Error) {
      originalError = error;
    } else if (typeof error === 'string') {
      originalError = new Error(error);
    }

    const message = originalError ? `${context}: ${originalError.message}` : String(error);

    // Default to a generic error if the error type is unknown
    const appError = new AppError(
      message,
      'UNKNOWN_ERROR',
      'high',
      fallbackMessage
    );

    // Log the error for debugging
    console.error(`[${context}]`, appError);

    return appError;
  }
});

export const handleAndNotify = (error: unknown, context: string, fallbackMessage?: string) => {
  const errorHandler = createErrorHandler(context);
  const appError = errorHandler.handle(error, fallbackMessage);

  toast({
    title: `${context} Error`,
    description: appError.userMessage || 'An unexpected error occurred.',
    variant: appError.severity === 'high' ? 'destructive' : 'default',
  });
};