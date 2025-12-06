/**
 * Defines the interface for a recovery strategy that can be executed
 * when an operation fails.
 */
export interface RecoveryStrategy {
  execute(error: Error): Promise<void>;
}

/**
 * Custom error thrown when an operation has failed more than the
 * maximum number of configured retries.
 */
export class MaxRetriesExceededError extends Error {
  constructor(public lastError: Error, public retryCount: number) {
    super(`Maximum retries (${retryCount}) exceeded. Last error: ${lastError.message}`);
    this.name = 'MaxRetriesExceededError';
  }
}

/**
 * Manages operations with built-in retry and recovery mechanisms.
 */
export class ErrorRecoveryManager {
  private readonly maxRetries: number;
  private retryCounts = new Map<string, number>();

  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }

  /**
   * Executes an operation with recovery logic.
   * @param operation The async function to execute.
   * @param errorKey A unique key to track retries for this specific operation.
   * @param recoveryStrategies An array of strategies to attempt upon failure.
   * @returns The result of the operation if successful.
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    errorKey: string,
    recoveryStrategies: RecoveryStrategy[] = []
  ): Promise<T> {
    try {
      const result = await operation();
      this.retryCounts.delete(errorKey); // Reset on success
      return result;
    } catch (error) {
      const currentRetries = this.retryCounts.get(errorKey) || 0;

      if (currentRetries >= this.maxRetries) {
        this.retryCounts.delete(errorKey);
        throw new MaxRetriesExceededError(error as Error, this.maxRetries);
      }

      this.retryCounts.set(errorKey, currentRetries + 1);

      // Apply recovery strategies
      for (const strategy of recoveryStrategies) {
        try {
          await strategy.execute(error as Error);
          // If recovery succeeds, retry the operation immediately
          return this.executeWithRecovery(operation, errorKey, recoveryStrategies);
        } catch (recoveryError) {
          console.warn(`Recovery strategy failed: ${(recoveryError as Error).message}`);
        }
      }

      // If all strategies fail, re-throw the original error
      throw error;
    }
  }
}