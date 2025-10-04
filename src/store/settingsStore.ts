// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  flipSides: boolean;
  autoApplySuggestions: boolean;
  automationPluginEnabled: boolean;
  streamingAssetsPluginEnabled: boolean;
  createPluginEnabled: boolean;
  tabOrder: string[];
  setFlipSides: (flipped: boolean) => void;
  setAutoApplySuggestions: (value: boolean) => void;
  setAutomationPluginEnabled: (enabled: boolean) => void;
  setStreamingAssetsPluginEnabled: (enabled: boolean) => void;
  setCreatePluginEnabled: (enabled: boolean) => void;
  setTabOrder: (order: string[]) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      flipSides: false,
      autoApplySuggestions: true,
      automationPluginEnabled: false,
      streamingAssetsPluginEnabled: true,
      createPluginEnabled: true,
      tabOrder: ['connections','obs-studio','gemini','create','streaming-assets','settings','advanced','twitch-chat','automation'],
      setFlipSides: (flipped) => set({ flipSides: flipped }),
      setAutoApplySuggestions: (value) => set({ autoApplySuggestions: value }),
      setAutomationPluginEnabled: (enabled) => set({ automationPluginEnabled: enabled }),
      setStreamingAssetsPluginEnabled: (enabled) => set({ streamingAssetsPluginEnabled: enabled }),
      setCreatePluginEnabled: (enabled) => set({ createPluginEnabled: enabled }),
      setTabOrder: (order: string[]) => set({ tabOrder: order }),
    }),
    {
      name: 'obs-copilot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useSettingsStore;