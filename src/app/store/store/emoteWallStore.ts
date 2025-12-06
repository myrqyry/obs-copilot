import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DefaultThemes } from '@/features/emote-wall/presets/StylePresets';

interface EmoteWallState {
  enabled: boolean;
  themeId: string;
  channel: string;
  setEnabled: (enabled: boolean) => void;
  setThemeId: (themeId: string) => void;
  setChannel: (channel: string) => void;
}

const useEmoteWallStore = create<EmoteWallState>()(
  persist(
    (set) => ({
      enabled: false,
      themeId: 'default', // Default theme
      channel: '', // Initialize channel
      setEnabled: (enabled) => set({ enabled }),
      setThemeId: (themeId) => set({ themeId }),
      setChannel: (channel) => set({ channel }),
    }),
    {
      name: 'obs-copilot-emote-wall-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * A hook that provides the fully resolved Emote Wall configuration,
 * combining the enabled state with the currently selected theme object.
 */
export const useEmoteWallConfig = () => {
  const { enabled, themeId } = useEmoteWallStore();
  const theme = DefaultThemes[themeId] || DefaultThemes.default;

  return {
    enabled,
    theme,
  };
};

export default useEmoteWallStore;