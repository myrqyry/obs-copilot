import { logger } from '../utils/logger';
import useUiStore, { AppError } from '@/app/store/uiStore';
import { toast } from '@/shared/components/ui/toast';

/**
 * Standardizes error handling for API calls and other operations.
 * Logs the error and dispatches it to the global error store.
 *
 * @param context A string describing where the error occurred (e.g., "API call", "Component render").
 * @param error The error object caught.
 * @param defaultMessage A default message to return if the error message is not clear.
 * @param level The severity level of the error.
 * @returns A user-friendly error message.
 */
export function handleAppError(
  context: string,
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.',
  level: AppError['level'] = 'error',
): string {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
    errorMessage = (error as any).message;
  } else {
    errorMessage = defaultMessage;
  }

  logger.error(`${context} error:`, error);

  // Push into the global UI error store so UI can display it
  useUiStore.getState().addError({
    message: `${context} failed: ${errorMessage}`,
    source: context,
    level,
    details: error instanceof Error ? { stack: (error as Error).stack } : undefined,
  });

  return `${context} failed: ${errorMessage}`;
}


/**
 * Convenience helper that runs handleAppError and also shows a toast notification.
 * Returns the computed user-friendly error message.
 */
export function createToastError(
  context: string,
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.',
  level: AppError['level'] = 'error'
): string {
  const message = handleAppError(context, error, defaultMessage, level);
  try {
    toast({
      title: context,
      description: message,
      variant: level === 'critical' || level === 'error' ? 'destructive' : 'default',
    });
  } catch (e) {
    // If toast fails, ensure it doesn't crash the app
    logger.warn('Failed to show toast for error', e);
  }
  return message;
}


