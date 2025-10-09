import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ApiKeyState {
  GIPHY_API_KEY: string;
  TENOR_API_KEY: string;
  ICONFINDER_API_KEY: string;
  PEXELS_API_KEY: string;
  PIXABAY_API_KEY: string;
  DEVIANTART_CLIENT_ID: string;
  UNSPLASH_ACCESS_KEY: string;
  setApiKey: (key: keyof Omit<ApiKeyState, 'setApiKey'>, value: string) => void;
}

const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set) => ({
      GIPHY_API_KEY: '',
      TENOR_API_KEY: '',
      ICONFINDER_API_KEY: '',
      PEXELS_API_KEY: '',
      PIXABAY_API_KEY: '',
      DEVIANTART_CLIENT_ID: '',
      UNSPLASH_ACCESS_KEY: '',
      setApiKey: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'api-key-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

export default useApiKeyStore;