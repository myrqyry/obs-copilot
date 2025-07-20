import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the services for which API keys can be overridden.
// Using an enum or a const object for service names can help maintain consistency.
export const ApiService = {
  GEMINI: 'gemini',
  PEXELS: 'pexels',
  PIXABAY: 'pixabay',
  DEVIANTART: 'deviantart',
  IMGFLIP: 'imgflip',
  IMGUR: 'imgur',
  ICONFINDER: 'iconfinder',
  GIPHY: 'giphy',
  CHUTES: 'chutes',
  TENOR: 'tenor',
  WALLHAVEN: 'wallhaven',
  OPENEMOJI: 'openemoji', // For generic emoji APIs that might need a key
  UNSPLASH: 'unsplash', // Even if handled differently, store can hold the key
  // Add other services as needed
} as const;

export type ApiServiceName = typeof ApiService[keyof typeof ApiService];

interface ApiKeyState {
  overrides: Partial<Record<ApiServiceName, string>>; // Store API keys as serviceName: apiKey
  setApiKey: (serviceName: ApiServiceName, apiKey: string) => void;
  clearApiKey: (serviceName: ApiServiceName) => void;
  getApiKey: (serviceName: ApiServiceName) => string;
  getAllKeys: () => Record<string, string>;
}

// Helper to get environment variables safely
const getEnvVar = (name: string) => {
    const env = import.meta.env;
    return env[name] || '';
};

const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      overrides: {}, // Initial state

      setApiKey: (serviceName, apiKey) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [serviceName]: apiKey,
          },
        })),

      clearApiKey: (serviceName) =>
        set((state) => {
          const newOverrides = { ...state.overrides };
          delete newOverrides[serviceName];
          return { overrides: newOverrides };
        }),

      // The key getter logic with fallback to environment variables
      getApiKey: (serviceName) => {
        const state = get();
        const override = state.overrides[serviceName];
        if (override) {
          return override;
        }
        // Fallback to environment variables
        const envVarName = `VITE_${serviceName.toUpperCase()}_API_KEY`;
        return getEnvVar(envVarName);
      },

      // Get all keys (overrides and environment variables)
      getAllKeys: () => {
        const state = get();
        const allKeys: Record<string, string> = {};
        for (const serviceName of Object.values(ApiService)) {
            allKeys[serviceName] = state.getApiKey(serviceName);
        }
        return allKeys;
      }
    }),
    {
      name: 'api-key-overrides-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

export default useApiKeyStore;
