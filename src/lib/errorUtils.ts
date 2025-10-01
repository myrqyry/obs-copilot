import { logger } from '../utils/logger';

/**
 * Standardizes error handling for API calls and other operations.
 * Logs the error and returns a user-friendly message.
 *
 * @param context A string describing where the error occurred (e.g., "API call", "Component render").
 * @param error The error object caught.
 * @param defaultMessage A default message to return if the error message is not clear.
 * @returns A user-friendly error message.
 */
export function handleAppError(
  context: string,
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.'
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
  return `${context} failed: ${errorMessage}`;
}

/**
 * A utility to create a consistent error object for UI display.
 * @param title The title of the error (e.g., "API Error").
 * @param description The detailed description of the error.
 * @param variant The toast variant (e.g., 'destructive').
 */
export function createToastError(title: string, description: string, variant: 'destructive' | 'default' = 'destructive') {
  return {
    title,
    description,
    variant,
  };
}
