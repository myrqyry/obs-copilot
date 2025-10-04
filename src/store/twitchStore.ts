// src/store/twitchStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TwitchState {
  twitchClientId?: string;
  twitchClientSecret?: string;
  twitchAccessToken?: string;
  twitchRefreshToken?: string;
  twitchChatPluginEnabled: boolean;
  setTwitchClientId: (id: string) => void;
  setTwitchClientSecret: (secret: string) => void;
  setTwitchAccessToken: (token: string) => void;
  setTwitchRefreshToken: (token: string) => void;
  setTwitchChatPluginEnabled: (enabled: boolean) => void;
}

const useTwitchStore = create<TwitchState>()(
  persist(
    (set) => ({
      twitchClientId: '',
      twitchClientSecret: '',
      twitchAccessToken: '',
      twitchRefreshToken: '',
      twitchChatPluginEnabled: true,
      setTwitchClientId: (id) => set({ twitchClientId: id }),
      setTwitchClientSecret: (secret) => set({ twitchClientSecret: secret }),
      setTwitchAccessToken: (token) => set({ twitchAccessToken: token }),
      setTwitchRefreshToken: (token) => set({ twitchRefreshToken: token }),
      setTwitchChatPluginEnabled: (enabled) => set({ twitchChatPluginEnabled: enabled }),
    }),
    {
      name: 'obs-copilot-twitch-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useTwitchStore;