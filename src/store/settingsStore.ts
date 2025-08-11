import { create } from 'zustand';
import {
  CatppuccinAccentColorName,
  CatppuccinSecondaryAccentColorName,
  CatppuccinChatBubbleColorName,
} from '@/types';
import { saveUserSettings, saveConnectionSettings } from '@/utils/persistence';

export interface SettingsState {
  flipSides: boolean;
  autoApplySuggestions: boolean;
  extraDarkMode: boolean;
  customChatBackground: string;
  bubbleFillOpacity: number;
  backgroundOpacity: number;
  chatBackgroundBlendMode: string;
  chatBubbleBlendMode: string;
  obsWebSocketUrl: string;
  obsWebSocketPassword?: string;
  theme: {
    name: string;
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinSecondaryAccentColorName;
    userChatBubble: CatppuccinChatBubbleColorName;
    modelChatBubble: CatppuccinChatBubbleColorName;
  };
  actions: {
    toggleFlipSides: () => void;
    toggleAutoApplySuggestions: () => void;
    toggleExtraDarkMode: () => void;
    setCustomChatBackground: (background: string) => void;
    setBubbleFillOpacity: (opacity: number) => void;
    setBackgroundOpacity: (opacity: number) => void;
    setChatBackgroundBlendMode: (mode: string) => void;
    setChatBubbleBlendMode: (mode: string) => void;
    setObsWebSocketUrl: (url: string) => void;
    setObsWebSocketPassword: (password: string) => void;
    setThemeColor: (
      type: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble',
      color:
        | CatppuccinAccentColorName
        | CatppuccinSecondaryAccentColorName
        | CatppuccinChatBubbleColorName,
    ) => void;
    setThemeName: (name: string) => void;
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  flipSides: false,
  autoApplySuggestions: false,
  extraDarkMode: false,
  customChatBackground: '',
  bubbleFillOpacity: 0.85,
  backgroundOpacity: 0.7,
  chatBackgroundBlendMode: 'normal',
  chatBubbleBlendMode: 'normal',
  obsWebSocketUrl: 'ws://localhost:4455',
  obsWebSocketPassword: '',
  theme: {
    name: 'catppuccin-mocha',
    accent: 'mauve',
    secondaryAccent: 'flamingo',
    userChatBubble: 'blue',
    modelChatBubble: 'lavender',
  },
  actions: {
    toggleFlipSides: () => {
      const newValue = !get().flipSides;
      set({ flipSides: newValue });
      saveUserSettings({ flipSides: newValue });
    },
    toggleAutoApplySuggestions: () => {
      const newValue = !get().autoApplySuggestions;
      set({ autoApplySuggestions: newValue });
      saveUserSettings({ autoApplySuggestions: newValue });
    },
    toggleExtraDarkMode: () => {
      const newValue = !get().extraDarkMode;
      set({ extraDarkMode: newValue });
      saveUserSettings({ extraDarkMode: newValue });
    },
    setCustomChatBackground: (background) => {
      set({ customChatBackground: background });
      saveUserSettings({ customChatBackground: background });
    },
    setBubbleFillOpacity: (opacity) => {
      set({ bubbleFillOpacity: opacity });
      saveUserSettings({ bubbleFillOpacity: opacity });
    },
    setBackgroundOpacity: (opacity) => {
      set({ backgroundOpacity: opacity });
      saveUserSettings({ backgroundOpacity: opacity });
    },
    setChatBackgroundBlendMode: (mode) => {
      set({ chatBackgroundBlendMode: mode });
      saveUserSettings({ chatBackgroundBlendMode: mode });
    },
    setChatBubbleBlendMode: (mode) => {
      set({ chatBubbleBlendMode: mode });
      saveUserSettings({ chatBubbleBlendMode: mode });
    },
    setObsWebSocketUrl: (url) => {
      set({ obsWebSocketUrl: url });
      saveConnectionSettings({ obsWebSocketUrl: url });
    },
    setObsWebSocketPassword: (password) => {
      set({ obsWebSocketPassword: password });
    },
    setThemeColor: (type, color) => {
      const newTheme = { ...get().theme, [type]: color };
      set({ theme: newTheme });
      saveUserSettings({ theme: newTheme });
    },
    setThemeName: (name) => {
      const newTheme = { ...get().theme, name };
      set({ theme: newTheme });
      saveUserSettings({ theme: newTheme });
    },
  },
}));
