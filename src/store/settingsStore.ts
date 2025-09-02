// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { CatppuccinAccentColorName } from '@/types/themes';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  accent: CatppuccinAccentColorName;
  secondaryAccent: CatppuccinAccentColorName;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccent: (accent: CatppuccinAccentColorName) => void;
  setSecondaryAccent: (secondaryAccent: CatppuccinAccentColorName) => void;
}

interface LayoutState {
    flipSides: boolean;
    setFlipSides: (flipped: boolean) => void;
}

interface SettingsState extends ThemeState, LayoutState {
  obsUrl: string;
  obsPassword?: string;
  geminiApiKey?: string;
  // Add other settings here as you implement them
  setObsUrl: (url: string) => void;
  setObsPassword: (password: string) => void;
  setGeminiApiKey: (key: string) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      accent: 'sky', // Default accent color
      secondaryAccent: 'mauve', // Default secondary accent color
      flipSides: false,
      obsUrl: 'ws://localhost:4455',
      obsPassword: '',
      geminiApiKey: '',
      
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setSecondaryAccent: (secondaryAccent) => set({ secondaryAccent }),
      setFlipSides: (flipped) => set({ flipSides: flipped }),
      setObsUrl: (url) => set({ obsUrl: url }),
      setObsPassword: (password) => set({ obsPassword: password }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: 'obs-copilot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettingsStore;
