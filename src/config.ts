import { GEMINI_API_KEY_ENV_VAR } from './constants';

const config = {
  API_URL: process.env.VITE_API_URL || '',
  UNSPLASH_ACCESS_KEY: process.env.VITE_UNSPLASH_ACCESS_KEY || '',
  // Add other environment variables as needed
};

export const getGeminiApiKey = (): string => {
  const apiKey = process.env[GEMINI_API_KEY_ENV_VAR] || '';
  if (!apiKey) {
    console.warn(
      `Warning: ${GEMINI_API_KEY_ENV_VAR} is not set. Gemini features will be disabled.`
    );
  }
  return apiKey;
};

export default config;
