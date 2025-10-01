import { create } from 'zustand';

/**
 * Lightweight compatibility shim for the missing apiKeyStore.
 * Provides the minimal API used across the codebase:
 *  - default export: useApiKeyStore (Zustand store)
 *  - named exports: ApiService (enum), ApiServiceName (type)
 *
 * This intentionally implements a simple in-browser override store.
 * If you already have a more featureful implementation, replace this file with it.
 */

/* Known services used in the UI. Extend as needed. */
export enum ApiService {
  GEMINI = 'GEMINI',
  CHUTES = 'CHUTES',
  GIPHY = 'GIPHY',
  IMGUR = 'IMGUR',
  PEXELS = 'PEXELS',
  PIXABAY = 'PIXABAY',
  ICONFINDER = 'ICONFINDER',
  DEVIANTART = 'DEVIANTART',
  IMGFLIP = 'IMGFLIP',
  TENOR = 'TENOR',
  WALLHAVEN = 'WALLHAVEN',
  OPENEMOJI = 'OPENEMOJI',
  UNSPLASH = 'UNSPLASH',
}

/* Type alias used by UI code */
export type ApiServiceName = keyof typeof ApiService;

interface ApiKeyState {
  overrides: Partial<Record<string, string>>;
  setApiKey: (service: ApiServiceName, key: string) => void;
  clearApiKey: (service: ApiServiceName) => void;
  getApiKeyOverride: (service: ApiServiceName) => string | undefined;
  getAllOverrides: () => Partial<Record<string, string>>;
}

/* Minimal zustand store */
const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  overrides: {},
  setApiKey(service, key) {
    set((state) => {
      const overrides = { ...(state.overrides || {}), [service]: key };
      return { overrides };
    });
  },
  clearApiKey(service) {
    set((state) => {
      const overrides = { ...(state.overrides || {}) };
      delete overrides[service];
      return { overrides };
    });
  },
  getApiKeyOverride(service) {
    return get().overrides?.[service];
  },
  getAllOverrides() {
    return get().overrides || {};
  },
}));

export default useApiKeyStore;