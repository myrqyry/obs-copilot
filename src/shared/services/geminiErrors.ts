// src/services/geminiErrors.ts

/**
 * Base class for all Gemini-related errors.
 */
export class GeminiError extends Error {
  public readonly originalError?: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'GeminiError';
    this.originalError = originalError;
  }
}

/**
 * Represents an authentication failure with the Gemini API.
 * This is typically non-retryable without user intervention (e.g., fixing an API key).
 */
export class GeminiAuthError extends GeminiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'GeminiAuthError';
  }
}

/**
 * Represents a temporary, retryable error from the Gemini API.
 * This could be due to rate limiting, temporary server issues, or network problems.
 */
export class GeminiRetryableError extends GeminiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'GeminiRetryableError';
  }
}

/**
 * Represents a non-retryable error from the Gemini API, such as a bad request or invalid input.
 */
export class GeminiNonRetryableError extends GeminiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'GeminiNonRetryableError';
  }
}

/**
 * Analyzes an error (typically from Axios) and maps it to a specific GeminiError subclass.
 * @param error The error object to analyze.
 * @param context A string providing context for the error message (e.g., 'image generation').
 * @returns An instance of a GeminiError subclass.
 */
export function mapToGeminiError(error: any, context: string): GeminiError {
  const status = error?.response?.status;
  const baseMessage = `Gemini API ${context} failed`;

  if (status === 401 || status === 403) {
    return new GeminiAuthError(`${baseMessage}: Authentication failed. Please check your API key.`, error);
  }

  if (status >= 400 && status < 500) {
    const details = error?.response?.data?.error?.message || 'invalid request';
    return new GeminiNonRetryableError(`${baseMessage}: ${details}`, error);
  }

  if (status >= 500) {
    return new GeminiRetryableError(`${baseMessage}: The server encountered a temporary error. Please try again later.`, error);
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return new GeminiRetryableError(`${baseMessage}: The request timed out. Please try again.`, error);
  }

  // Default to a generic retryable error for unknown network issues
  return new GeminiRetryableError(`${baseMessage}: A network error occurred.`, error);
}