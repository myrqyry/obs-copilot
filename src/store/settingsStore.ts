// src/store/settingsStore.ts
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
  setTheme: (themeName: string) => void;
  setThemeBase: (base: 'light' | 'dark' | 'system') => void;
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
  extraDarkMode: boolean;
  streamerBotHost: string;
  streamerBotPort: string;
  theme: {
    name: string;
    base: 'light' | 'dark' | 'system';
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinAccentColorName;
    userChatBubble: string;
    modelChatBubble: string;
  };
  // Add other settings here as you implement them
  setObsUrl: (url: string) => void;
  setObsPassword: (password: string) => void;
  setExtraDarkMode: (value: boolean) => void;
  setStreamerBotHost: (host: string) => void;
  setStreamerBotPort: (port: string) => void;
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
  twitchClientId?: string;
  twitchClientSecret?: string;
  twitchAccessToken?: string;
  twitchRefreshToken?: string;
  setTwitchClientId: (id: string) => void;
  setTwitchClientSecret: (secret: string) => void;
  setTwitchAccessToken: (token: string) => void;
  setTwitchRefreshToken: (token: string) => void;
  twitchChatPluginEnabled: boolean;
  setTwitchChatPluginEnabled: (enabled: boolean) => void;
  automationPluginEnabled: boolean;
  setAutomationPluginEnabled: (enabled: boolean) => void;
  streamingAssetsPluginEnabled: boolean;
  setStreamingAssetsPluginEnabled: (enabled: boolean) => void;
  createPluginEnabled: boolean;
  setCreatePluginEnabled: (enabled: boolean) => void;
  // Order of plugin tab ids (controls navigation order)
  tabOrder: string[];
  setTabOrder: (order: string[]) => void;
  chatBackgroundType: ChatBackgroundType;
  chatPattern?: ChatPattern;
  setChatBackgroundType: (type: ChatBackgroundType) => void;
  setChatPattern: (pattern: ChatPattern) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: {
        name: 'catppuccin-mocha',
        base: 'dark',
        accent: 'sky',
        secondaryAccent: 'mauve',
        userChatBubble: 'sky', // Use color name instead of hex
        modelChatBubble: 'mauve', // Use color name instead of hex
      },
      extraDarkMode: false,
      flipSides: false,
      obsUrl: 'ws://localhost:4455',
      obsPassword: '',
      streamerBotHost: 'localhost',
      streamerBotPort: '8080',
      twitchClientId: '',
      twitchClientSecret: '',
      twitchAccessToken: '',
      twitchRefreshToken: '',
      twitchChatPluginEnabled: true,
      automationPluginEnabled: false,
  // New toggles to allow disabling these tabs/plugins
  streamingAssetsPluginEnabled: true,
  createPluginEnabled: true,
  // Default tab order uses the core plugin ids in the current default sequence
  tabOrder: ['connections','obs-studio','gemini','create','streaming-assets','settings','advanced','twitch-chat','automation'],
      setTheme: (name) => set((state) => ({ theme: { ...state.theme, name } })),
      setThemeBase: (base) => set((state) => ({ theme: { ...state.theme, base } })),
      setAccent: (accent) => set((state) => ({ theme: { ...state.theme, accent } })),
      setSecondaryAccent: (secondaryAccent) => set((state) => ({ theme: { ...state.theme, secondaryAccent } })),
      setUserChatBubble: (userChatBubble) => set((state) => ({ theme: { ...state.theme, userChatBubble } })),
      setModelChatBubble: (modelChatBubble) => set((state) => ({ theme: { ...state.theme, modelChatBubble } })),
      setFlipSides: (flipped) => set({ flipSides: flipped }),
      setObsUrl: (url) => set({ obsUrl: url }),
      setObsPassword: (password) => set({ obsPassword: password }),
      setExtraDarkMode: (value) => set({ extraDarkMode: value }),
      setStreamerBotHost: (host) => set({ streamerBotHost: host }),
      setStreamerBotPort: (port) => set({ streamerBotPort: port }),
      setTwitchClientId: (id) => set({ twitchClientId: id }),
      setTwitchClientSecret: (secret) => set({ twitchClientSecret: secret }),
      setTwitchAccessToken: (token) => set({ twitchAccessToken: token }),
      setTwitchRefreshToken: (token) => set({ twitchRefreshToken: token }),
      setTwitchChatPluginEnabled: (enabled) => set({ twitchChatPluginEnabled: enabled }),
      setAutomationPluginEnabled: (enabled) => set({ automationPluginEnabled: enabled }),
      setStreamingAssetsPluginEnabled: (enabled) => set({ streamingAssetsPluginEnabled: enabled }),
      setCreatePluginEnabled: (enabled) => set({ createPluginEnabled: enabled }),
      setTabOrder: (order: string[]) => set({ tabOrder: order }),
      chatBackgroundType: 'image' as const,
      chatPattern: {
        name: 'wavy',
        backColor: '#667eea',
        frontColor: '#764ba2',
        opacity: 0.1,
        spacing: '100px'
      },
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
      setChatBackgroundType: (type) => set({ chatBackgroundType: type }),
      setChatPattern: (pattern) => set({ chatPattern: pattern }),
    }),
    {
      name: 'obs-copilot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettingsStore;
