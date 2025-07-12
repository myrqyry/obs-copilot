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
  setApiKeyOverride: (serviceName: ApiServiceName, apiKey: string) => void;
  clearApiKeyOverride: (serviceName: ApiServiceName) => void;
  getApiKeyOverride: (serviceName: ApiServiceName) => string | undefined;
}

const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      overrides: {}, // Initial state

      setApiKeyOverride: (serviceName, apiKey) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [serviceName]: apiKey,
          },
        })),

      clearApiKeyOverride: (serviceName) =>
        set((state) => {
          const newOverrides = { ...state.overrides };
          delete newOverrides[serviceName];
          return { overrides: newOverrides };
        }),

      getApiKeyOverride: (serviceName) => {
        return get().overrides[serviceName];
      }
    }),
    {
      name: 'api-key-overrides-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

export default useApiKeyStore;
