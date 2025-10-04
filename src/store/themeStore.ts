// src/store/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CatppuccinAccentColorName } from '@/types/themes';
import type { ChatBackgroundType, ChatPattern } from '@/types/chatBackground';

interface ThemeState {
  theme: {
    name: string;
    base: 'light' | 'dark' | 'system';
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinAccentColorName;
    userChatBubble: string;
    modelChatBubble: string;
  };
  extraDarkMode: boolean;
  customChatBackground?: string;
  bubbleFillOpacity: number;
  chatBubbleBlendMode: string;
  backgroundOpacity: number;
  chatBackgroundBlendMode: string;
  chatBackgroundType: ChatBackgroundType;
  chatPattern?: ChatPattern;
  setTheme: (themeName: string) => void;
  setThemeBase: (base: 'light' | 'dark' | 'system') => void;
  setAccent: (accent: CatppuccinAccentColorName) => void;
  setSecondaryAccent: (secondaryAccent: CatppuccinAccentColorName) => void;
  setUserChatBubble: (color: string) => void;
  setModelChatBubble: (color: string) => void;
  setExtraDarkMode: (value: boolean) => void;
  setCustomChatBackground: (url: string) => void;
  setBubbleFillOpacity: (value: number) => void;
  setChatBubbleBlendMode: (value: string) => void;
  setBackgroundOpacity: (value: number) => void;
  setChatBackgroundBlendMode: (value: string) => void;
  setChatBackgroundType: (type: ChatBackgroundType) => void;
  setChatPattern: (pattern: ChatPattern) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: {
        name: 'catppuccin-mocha',
        base: 'dark',
        accent: 'sky',
        secondaryAccent: 'mauve',
        userChatBubble: 'sky',
        modelChatBubble: 'mauve',
      },
      extraDarkMode: false,
      chatBackgroundType: 'image' as const,
      chatPattern: {
        name: 'wavy',
        backColor: '#667eea',
        frontColor: '#764ba2',
        opacity: 0.1,
        spacing: '100px'
      },
      customChatBackground: '',
      bubbleFillOpacity: 0.7,
      chatBubbleBlendMode: 'normal',
      backgroundOpacity: 0.5,
      chatBackgroundBlendMode: 'normal',
      setTheme: (name) => set((state) => ({ theme: { ...state.theme, name } })),
      setThemeBase: (base) => set((state) => ({ theme: { ...state.theme, base } })),
      setAccent: (accent) => set((state) => ({ theme: { ...state.theme, accent } })),
      setSecondaryAccent: (secondaryAccent) => set((state) => ({ theme: { ...state.theme, secondaryAccent } })),
      setUserChatBubble: (userChatBubble) => set((state) => ({ theme: { ...state.theme, userChatBubble } })),
      setModelChatBubble: (modelChatBubble) => set((state) => ({ theme: { ...state.theme, modelChatBubble } })),
      setExtraDarkMode: (value) => set({ extraDarkMode: value }),
      setCustomChatBackground: (url) => set({ customChatBackground: url }),
      setBubbleFillOpacity: (value) => set({ bubbleFillOpacity: value }),
      setChatBubbleBlendMode: (value) => set({ chatBubbleBlendMode: value }),
      setBackgroundOpacity: (value) => set({ backgroundOpacity: value }),
      setChatBackgroundBlendMode: (value) => set({ chatBackgroundBlendMode: value }),
      setChatBackgroundType: (type) => set({ chatBackgroundType: type }),
      setChatPattern: (pattern) => set({ chatPattern: pattern }),
    }),
    {
      name: 'obs-copilot-theme-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useThemeStore;