import { AIService } from '../types/ai';
import { logger } from '../utils/logger';
import { backoff } from '@/shared/lib/utils';

// AI Middleware
// This middleware will be used to inject fallback prompts, failover retries, and custom formatting utilities.

export const aiMiddleware = (service: AIService): AIService => {
  return {
    ...service,
    // Forward utility methods that exist on the service class prototype
    isConfigured: () => (service as any).isConfigured?.() ?? false,
    getApiKey: () => (service as any).getApiKey?.() ?? null,
    setApiKey: (key: string) => (service as any).setApiKey?.(key),
    generateContent: async (prompt: string, options?: any, retries = 3, retryAttempt = 0) => {
      try {
        return await (service as any).generateContent(prompt, options, retries);
      } catch (error) {
        logger.error('AI Service Error:', error);
        if (retries > 0) {
          const delay = backoff(retryAttempt);
          logger.warn(`Retrying... ${retries} attempts left. Waiting for ${delay.toFixed(0)}ms.`);
          await new Promise((res) => setTimeout(res, delay));
          return await (aiMiddleware(service) as any).generateContent(prompt, options, retries - 1, retryAttempt + 1);
        }
        return {
          candidates: [
            {
              content: {
                parts: [{ text: 'Sorry, I am having trouble connecting to the AI service.' }],
                role: 'model',
              },
              finishReason: 'ERROR',
              index: 0,
              safetyRatings: [],
            },
          ],
          promptFeedback: {
            safetyRatings: [],
          },
        };
      }
    },
    generateEnhancedImage: async (prompt: string, options?: any) => {
      return await (service as any).generateEnhancedImage(prompt, options);
    },
    generateImage: async (prompt: string, options?: any) => {
      return await (service as any).generateImage(prompt, options);
    },
    generateStructuredContent: async (prompt: string, schema: any, options?: any) => {
      return await (service as any).generateStructuredContent(prompt, schema, options);
    },
    generateWithLongContext: async (prompt: string, context: string, options?: any) => {
      return await (service as any).generateWithLongContext(prompt, context, options);
    },
    liveConnect: async (options?: any) => {
      return await (service as any).liveConnect(options);
    },
  };
};
