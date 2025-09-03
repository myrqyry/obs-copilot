// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { CatppuccinAccentColorName } from '@/types/themes';

interface ThemeState {
  theme: {
    base: 'light' | 'dark' | 'system';
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinAccentColorName;
    userChatBubble: string;
    modelChatBubble: string;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccent: (accent: CatppuccinAccentColorName) => void;
  setSecondaryAccent: (secondaryAccent: CatppuccinAccentColorName) => void;
  setUserChatBubble: (color: string) => void;
  setModelChatBubble: (color: string) => void;
}

interface LayoutState {
    flipSides: boolean;
    setFlipSides: (flipped: boolean) => void;
}

export interface SettingsState extends Omit<ThemeState, 'theme'>, LayoutState {
  obsUrl: string;
  obsPassword?: string;
  geminiApiKey?: string;
  extraDarkMode: boolean;
  theme: {
    base: 'light' | 'dark' | 'system';
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinAccentColorName;
    userChatBubble: string;
    modelChatBubble: string;
  };
  // Add other settings here as you implement them
  setObsUrl: (url: string) => void;
  setObsPassword: (password: string) => void;
  setGeminiApiKey: (key: string) => void;
  setExtraDarkMode: (value: boolean) => void;
  autoApplySuggestions: boolean;
  customChatBackground?: string;
  bubbleFillOpacity: number;
  chatBubbleBlendMode: string;
  backgroundOpacity: number;
  chatBackgroundBlendMode: string;
  setAutoApplySuggestions: (value: boolean) => void;
  setCustomChatBackground: (url: string) => void;
  setBubbleFillOpacity: (value: number) => void;
  setChatBubbleBlendMode: (value: string) => void;
  setBackgroundOpacity: (value: number) => void;
  setChatBackgroundBlendMode: (value: string) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: {
        base: 'system',
        accent: 'sky',
        secondaryAccent: 'mauve',
        userChatBubble: '#ADD8E6', // Light blue
        modelChatBubble: '#D3D3D3', // Light grey
      },
      extraDarkMode: false,
      flipSides: false,
      obsUrl: 'ws://localhost:4455',
      obsPassword: '',
      geminiApiKey: '',
      setTheme: (base) => set((state) => ({ theme: { ...state.theme, base } })),
      setAccent: (accent) => set((state) => ({ theme: { ...state.theme, accent } })),
      setSecondaryAccent: (secondaryAccent) => set((state) => ({ theme: { ...state.theme, secondaryAccent } })),
      setUserChatBubble: (userChatBubble) => set((state) => ({ theme: { ...state.theme, userChatBubble } })),
      setModelChatBubble: (modelChatBubble) => set((state) => ({ theme: { ...state.theme, modelChatBubble } })),
      setFlipSides: (flipped) => set({ flipSides: flipped }),
      setObsUrl: (url) => set({ obsUrl: url }),
      setObsPassword: (password) => set({ obsPassword: password }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setExtraDarkMode: (value) => set({ extraDarkMode: value }),
      autoApplySuggestions: true,
      customChatBackground: '',
      bubbleFillOpacity: 0.7,
      chatBubbleBlendMode: 'normal',
      backgroundOpacity: 0.5,
      chatBackgroundBlendMode: 'normal',
      setAutoApplySuggestions: (value) => set({ autoApplySuggestions: value }),
      setCustomChatBackground: (url) => set({ customChatBackground: url }),
      setBubbleFillOpacity: (value) => set({ bubbleFillOpacity: value }),
      setChatBubbleBlendMode: (value) => set({ chatBubbleBlendMode: value }),
      setBackgroundOpacity: (value) => set({ backgroundOpacity: value }),
      setChatBackgroundBlendMode: (value) => set({ chatBackgroundBlendMode: value }),
    }),
    {
      name: 'obs-copilot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettingsStore;
