import { GEMINI_API_KEY_ENV_VAR } from './constants';
import { logger } from './utils/logger';

const config = {
  API_URL: import.meta.env.VITE_API_URL || '',
  UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
  // Add other environment variables as needed
};

// AI SDK 5 feature flags for gradual adoption
export const aiSdk5Config = {
  enableDataParts: import.meta.env.VITE_AI_SDK5_DATA_PARTS === 'true' || true, // Default to true for POC
  enableAgenticLoop: import.meta.env.VITE_AI_SDK5_AGENTIC_LOOP === 'true' || false,
  enableSpeechUnification: import.meta.env.VITE_AI_SDK5_SPEECH === 'true' || false,
  enableTypesSafeTools: import.meta.env.VITE_AI_SDK5_TOOLS === 'true' || false,
};

export const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env[GEMINI_API_KEY_ENV_VAR] || '';
  if (!apiKey) {
    logger.warn(`Warning: ${GEMINI_API_KEY_ENV_VAR} is not set. Gemini features will be disabled.`);
  }
  return apiKey;
};

export default config;
