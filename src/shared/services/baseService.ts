import { logger } from '@/shared/utils/logger';

export class ServiceError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message);
        this.name = 'ServiceError';
    }
}

export abstract class BaseService {
    protected retryCount = 3;
    protected retryDelay = 1000;

    protected async withRetry<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryCount) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    logger.warn(
                        `${context} failed (attempt ${attempt}/${this.retryCount}), ` +
                        `retrying in ${delay}ms...`, { error }
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    logger.error(`${context} failed after ${this.retryCount} attempts`, { error });
                }
            }
        }

        throw new ServiceError(`${context} failed after ${this.retryCount} attempts`, lastError);
    }
}
