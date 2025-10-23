import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CatppuccinAccentColorName } from '@/types/themes';
import type { ChatBackgroundType, ChatPattern } from '@/types/chatBackground';

export interface ApiKeyState {
  GIPHY_API_KEY: string;
  TENOR_API_KEY: string;
  ICONFINDER_API_KEY: string;
  PEXELS_API_KEY: string;
  PIXABAY_API_KEY: string;
  DEVIANTART_CLIENT_ID: string;
  UNSPLASH_ACCESS_KEY: string;
}

export interface ConfigState extends ApiKeyState {
  // API Keys
  setApiKey: (key: keyof ApiKeyState, value: string) => void;

  // OBS Connection
  obsUrl: string;
  obsPassword?: string;
  setObsUrl: (url: string) => void;
  setObsPassword: (password: string) => void;

  // Streamer.bot Connection
  streamerBotHost: string;
  streamerBotPort: string;
  setStreamerBotHost: (host: string) => void;
  setStreamerBotPort: (port: string) => void;

  // Twitch Connection
  twitchClientId?: string;
  twitchClientSecret?: string;
  twitchAccessToken?: string;
  twitchRefreshToken?: string;
  setTwitchClientId: (id: string) => void;
  setTwitchClientSecret: (secret: string) => void;
  setTwitchAccessToken: (token: string) => void;
  setTwitchRefreshToken: (token: string) => void;

  // Theme and Appearance
  theme: {
    name: string;
    base: 'light' | 'dark' | 'system';
    accent: CatppuccinAccentColorName;
    secondaryAccent: CatppuccinAccentColorName;
    userChatBubble: string;
    modelChatBubble: string;
  };
  extraDarkMode: boolean;
  setTheme: (themeName: string) => void;
  setThemeBase: (base: 'light' | 'dark' | 'system') => void;
  setAccent: (accent: CatppuccinAccentColorName) => void;
  setSecondaryAccent: (secondaryAccent: CatppuccinAccentColorName) => void;
  setUserChatBubble: (color: string) => void;
  setModelChatBubble: (color: string) => void;
  setExtraDarkMode: (value: boolean) => void;

  // Chat Appearance
  autoApplySuggestions: boolean;
  customChatBackground?: string;
  bubbleFillOpacity: number;
  chatBubbleBlendMode: string;
  backgroundOpacity: number;
  chatBackgroundBlendMode: string;
  chatBackgroundType: ChatBackgroundType;
  chatPattern?: ChatPattern;
  setAutoApplySuggestions: (value: boolean) => void;
  setCustomChatBackground: (url: string) => void;
  setBubbleFillOpacity: (value: number) => void;
  setChatBubbleBlendMode: (value: string) => void;
  setBackgroundOpacity: (value: number) => void;
  setChatBackgroundBlendMode: (value: string) => void;
  setChatBackgroundType: (type: ChatBackgroundType) => void;
  setChatPattern: (pattern: ChatPattern) => void;

  // Plugin Visibility
  twitchChatPluginEnabled: boolean;
  setTwitchChatPluginEnabled: (enabled: boolean) => void;
  automationPluginEnabled: boolean;
  setAutomationPluginEnabled: (enabled: boolean) => void;
  streamingAssetsPluginEnabled: boolean;
  setStreamingAssetsPluginEnabled: (enabled: boolean) => void;
  createPluginEnabled: boolean;
  setCreatePluginEnabled: (enabled: boolean) => void;
  connectionsPluginEnabled: boolean;
  setConnectionsPluginEnabled: (enabled: boolean) => void;
  obsStudioPluginEnabled: boolean;
  setObsStudioPluginEnabled: (enabled: boolean) => void;
  geminiPluginEnabled: boolean;
  setGeminiPluginEnabled: (enabled: boolean) => void;
  settingsPluginEnabled: boolean;
  setSettingsPluginEnabled: (enabled: boolean) => void;
  advancedPluginEnabled: boolean;
  setAdvancedPluginEnabled: (enabled: boolean) => void;
  emoteWallPluginEnabled: boolean;
  setEmoteWallPluginEnabled: (enabled: boolean) => void;

  // Tab Order
  tabOrder: string[];
  setTabOrder: (order: string[]) => void;

  // Co-pilot
  useCoPilot: boolean;
  setUseCoPilot: (use: boolean) => void;
}

const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // API Keys
      GIPHY_API_KEY: '',
      TENOR_API_KEY: '',
      ICONFINDER_API_KEY: '',
      PEXELS_API_KEY: '',
      PIXABAY_API_KEY: '',
      DEVIANTART_CLIENT_ID: '',
      UNSPLASH_ACCESS_KEY: '',
      setApiKey: (key, value) => set({ [key]: value }),

      // OBS Connection
      obsUrl: 'ws://localhost:4455',
      obsPassword: '',
      setObsUrl: (url) => set({ obsUrl: url }),
      setObsPassword: (password) => set({ obsPassword: password }),

      // Streamer.bot Connection
      streamerBotHost: 'localhost',
      streamerBotPort: '8080',
      setStreamerBotHost: (host) => set({ streamerBotHost: host }),
      setStreamerBotPort: (port) => set({ streamerBotPort: port }),

      // Twitch Connection
      twitchClientId: '',
      twitchClientSecret: '',
      twitchAccessToken: '',
      twitchRefreshToken: '',
      setTwitchClientId: (id) => set({ twitchClientId: id }),
      setTwitchClientSecret: (secret) => set({ twitchClientSecret: secret }),
      setTwitchAccessToken: (token) => set({ twitchAccessToken: token }),
      setTwitchRefreshToken: (token) => set({ twitchRefreshToken: token }),

      // Theme and Appearance
      theme: {
        name: 'catppuccin-mocha',
        base: 'dark',
        accent: 'sky',
        secondaryAccent: 'mauve',
        userChatBubble: 'sky',
        modelChatBubble: 'mauve',
      },
      extraDarkMode: false,
      setTheme: (name) => set((state) => ({ theme: { ...state.theme, name } })),
      setThemeBase: (base) => set((state) => ({ theme: { ...state.theme, base } })),
      setAccent: (accent) => set((state) => ({ theme: { ...state.theme, accent } })),
      setSecondaryAccent: (secondaryAccent) => set((state) => ({ theme: { ...state.theme, secondaryAccent } })),
      setUserChatBubble: (userChatBubble) => set((state) => ({ theme: { ...state.theme, userChatBubble } })),
      setModelChatBubble: (modelChatBubble) => set((state) => ({ theme: { ...state.theme, modelChatBubble } })),
      setExtraDarkMode: (value) => set({ extraDarkMode: value }),

      // Chat Appearance
      autoApplySuggestions: true,
      customChatBackground: '',
      bubbleFillOpacity: 0.7,
      chatBubbleBlendMode: 'normal',
      backgroundOpacity: 0.5,
      chatBackgroundBlendMode: 'normal',
      chatBackgroundType: 'image' as const,
      chatPattern: {
        name: 'wavy',
        backColor: '#667eea',
        frontColor: '#764ba2',
        opacity: 0.1,
        spacing: '100px'
      },
      setAutoApplySuggestions: (value) => set({ autoApplySuggestions: value }),
      setCustomChatBackground: (url) => set({ customChatBackground: url }),
      setBubbleFillOpacity: (value) => set({ bubbleFillOpacity: value }),
      setChatBubbleBlendMode: (value) => set({ chatBubbleBlendMode: value }),
      setBackgroundOpacity: (value) => set({ backgroundOpacity: value }),
      setChatBackgroundBlendMode: (value) => set({ chatBackgroundBlendMode: value }),
      setChatBackgroundType: (type) => set({ chatBackgroundType: type }),
      setChatPattern: (pattern) => set({ chatPattern: pattern }),

      // Plugin Visibility
      twitchChatPluginEnabled: true,
      automationPluginEnabled: false,
      streamingAssetsPluginEnabled: true,
      createPluginEnabled: true,
      connectionsPluginEnabled: true,
      obsStudioPluginEnabled: true,
      geminiPluginEnabled: true,
      settingsPluginEnabled: true,
      advancedPluginEnabled: true,
      emoteWallPluginEnabled: true,
      setTwitchChatPluginEnabled: (enabled) => set({ twitchChatPluginEnabled: enabled }),
      setAutomationPluginEnabled: (enabled) => set({ automationPluginEnabled: enabled }),
      setStreamingAssetsPluginEnabled: (enabled) => set({ streamingAssetsPluginEnabled: enabled }),
      setCreatePluginEnabled: (enabled) => set({ createPluginEnabled: enabled }),
      setConnectionsPluginEnabled: (enabled) => set({ connectionsPluginEnabled: enabled }),
      setObsStudioPluginEnabled: (enabled) => set({ obsStudioPluginEnabled: enabled }),
      setGeminiPluginEnabled: (enabled) => set({ geminiPluginEnabled: enabled }),
      setSettingsPluginEnabled: (enabled) => set({ settingsPluginEnabled: enabled }),
      setAdvancedPluginEnabled: (enabled) => set({ advancedPluginEnabled: enabled }),
      setEmoteWallPluginEnabled: (enabled) => set({ emoteWallPluginEnabled: enabled }),

      // Tab Order
      tabOrder: ['connections','obs-studio','gemini','create','streaming-assets','settings','advanced','twitch-chat','automation','emote-wall'],
      setTabOrder: (order: string[]) => set({ tabOrder: order }),

      // Co-pilot
      useCoPilot: false,
      setUseCoPilot: (use) => set({ useCoPilot: use }),
    }),
    {
      name: 'unified-config-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useConfigStore;