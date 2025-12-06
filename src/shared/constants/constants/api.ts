export const GEMINI_API_KEY_ENV_VAR = 'VITE_GEMINI_API_KEY';
export const GEMINI_MODEL_NAME = 'gemini-1.5-flash';
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;
