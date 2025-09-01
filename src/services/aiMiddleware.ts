import { AIService } from '../types/ai';
import { logger } from '../utils/logger';

// AI Middleware
// This middleware will be used to inject fallback prompts, failover retries, and custom formatting utilities.

export const aiMiddleware = (service: AIService): any => {
  return {
    ...service,
    generateContent: async (prompt: string, retries = 3) => {
      try {
        // Pass retries down to the original service call
        return await (service as any).generateContent(prompt, retries);
      } catch (error) {
        logger.error('AI Service Error:', error);
        if (retries > 0) {
          logger.warn(`Retrying... ${retries} attempts left.`);
          await new Promise((res) => setTimeout(res, 1000));
          // Correctly call the middleware-wrapped function for retry
          return await (aiMiddleware(service) as any).generateContent(prompt, retries - 1);
        }
        // This is a fallback, but it doesn't match the expected return type.
        // For now, we will return a mock response that fits the type.
        // A better solution would be to have a more robust error handling mechanism.
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
  };
};
