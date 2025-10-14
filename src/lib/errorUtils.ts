import { logger } from '../utils/logger';
import { useErrorStore, AppError } from '../store/errorStore';

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

  useErrorStore.getState().addError({
    message: `${context} failed: ${errorMessage}`,
    source: context,
    level,
    details: error instanceof Error ? { stack: error.stack } : undefined,
  });

  return `${context} failed: ${errorMessage}`;
}


