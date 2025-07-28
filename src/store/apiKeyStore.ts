import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the services for which API keys could *theoretically* be overridden.
// This list is now primarily for UI purposes or potential future local overrides,
// as actual keys are handled server-side.
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
  OPENEMOJI: 'openemoji',
  UNSPLASH: 'unsplash',
  // Add other services as needed
} as const;

export type ApiServiceName = typeof ApiService[keyof typeof ApiService];

interface ApiKeyState {
  // The 'overrides' now only store user-provided overrides, not sensitive keys.
  // These overrides are sent to the proxy as 'X-Api-Key' headers.
  overrides: Partial<Record<ApiServiceName, string>>;
  setApiKey: (serviceName: ApiServiceName, apiKey: string) => void;
  clearApiKey: (serviceName: ApiServiceName) => void;
  // This method now only returns the override, as environment variables are not accessed client-side.
  getApiKeyOverride: (serviceName: ApiServiceName) => string | undefined;
  // This method is primarily for displaying stored overrides in the UI, not for API calls directly.
  getAllOverrides: () => Record<string, string>;
}

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

      // This now only returns the stored override, no fallback to client-side env vars.
      getApiKeyOverride: (serviceName) => {
        const state = get();
        return state.overrides[serviceName];
      },

      // This now only returns stored overrides.
      getAllOverrides: () => {
        const state = get();
        return { ...state.overrides };
      }
    }),
    {
      name: 'api-key-overrides-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

export default useApiKeyStore;
