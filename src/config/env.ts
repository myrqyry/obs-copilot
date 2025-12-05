import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url().default('http://localhost:8000'),
  VITE_API_TIMEOUT: z.coerce.number().default(30000),

  // OBS Configuration
  VITE_OBS_HOST: z.string().default('localhost'),
  VITE_OBS_PORT: z.coerce.number().default(4455),
  VITE_OBS_PASSWORD: z.string().optional(),

  // Gemini AI Configuration
  VITE_GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  VITE_GEMINI_MODEL: z.string().default('gemini-pro'),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  VITE_ENABLE_DEVTOOLS: z.coerce.boolean().default(true),

  // Mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse({
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
      VITE_OBS_HOST: import.meta.env.VITE_OBS_HOST,
      VITE_OBS_PORT: import.meta.env.VITE_OBS_PORT,
      VITE_OBS_PASSWORD: import.meta.env.VITE_OBS_PASSWORD,
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
      VITE_GEMINI_MODEL: import.meta.env.VITE_GEMINI_MODEL,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
      MODE: import.meta.env.MODE,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Invalid environment configuration:\n${missingVars.join('\n')}`
      );
    }
    throw error;
  }
}

// Export validated environment
export const env = parseEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;

// Helper to check if running in development
export const isDevelopment = env.MODE === 'development';
export const isProduction = env.MODE === 'production';
export const isTest = env.MODE === 'test';
