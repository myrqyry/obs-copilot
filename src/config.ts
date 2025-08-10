import { GEMINI_API_KEY_ENV_VAR } from './constants';
import { logger } from './utils/logger';

const config = {
  API_URL: import.meta.env.VITE_API_URL || '',
  UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
  // Add other environment variables as needed
};

export const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env[GEMINI_API_KEY_ENV_VAR] || '';
  if (!apiKey) {
    logger.warn(`Warning: ${GEMINI_API_KEY_ENV_VAR} is not set. Gemini features will be disabled.`);
  }
  return apiKey;
};

export default config;
