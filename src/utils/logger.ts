/**
 * @fileoverview Centralized logging utility for client-side operations.
 * This module provides a simple logger that can handle different log levels
 * (info, warn, error, debug) and captures error objects for error logs.
 */

/**
 * Log levels for the logger.
 * @enum {string}
 */
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * A simple logging utility.
 */
class Logger {
  /**
   * Logs a debug message.
   * @param {string} message - The message to log.
   * @param {unknown[]} optionalParams - Additional parameters to log.
   */
  debug(message: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to log.
   * @param {unknown[]} optionalParams - Additional parameters to log.
   */
  info(message: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message to log.
   * @param {unknown[]} optionalParams - Additional parameters to log.
   */
  warn(message: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * Logs an error message.
   * If an Error object is provided as the first optional parameter, its stack trace is captured.
   * @param {string} message - The message to log.
   * @param {Error | unknown[]} optionalParams - The error object or additional parameters to log.
   */
  error(message: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.ERROR, message, ...optionalParams);
  }

  /**
   * Internal method to handle logging based on the specified level.
   * @private
   * @param {LogLevel} level - The log level.
   * @param {string} message - The message to log.
   * @param {unknown[]} optionalParams - Additional parameters to log.
   */
  private log(level: LogLevel, message: string, ...optionalParams: unknown[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // In a real application, you might send these logs to a remote logging service
    // or store them locally based on the environment (e.g., development vs. production).
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...optionalParams);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...optionalParams);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...optionalParams);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...optionalParams);
        // For error logs, capture and potentially report the full error object
        if (optionalParams.length > 0 && optionalParams[0] instanceof Error) {
          const error = optionalParams[0];
          console.error('Error details:', error.message, error.stack);
          // Example: send error to an error tracking service like Sentry or Bugsnag
          // Sentry.captureException(error);
        }
        break;
      default:
        console.log(prefix, message, ...optionalParams);
    }
  }
}

export const logger = new Logger();