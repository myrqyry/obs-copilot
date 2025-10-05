import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EmoteWallConfig } from '@/features/emote-wall/core/types';

interface EmoteWallState extends EmoteWallConfig {
  setEnabled: (enabled: boolean) => void;
  // Add setters for other config properties as they are implemented
}

const useEmoteWallStore = create<EmoteWallState>()(
  persist(
    (set) => ({
      enabled: false,
      // Default values for other settings will be added here
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'obs-copilot-emote-wall-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useEmoteWallStore;