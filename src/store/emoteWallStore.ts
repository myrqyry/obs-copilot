import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EmoteWallConfig, AnimationStyle } from '@/features/emote-wall/core/types';

interface EmoteWallState extends EmoteWallConfig {
  setEnabled: (enabled: boolean) => void;
  setAnimationStyle: (style: AnimationStyle) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  // Add setters for other config properties as they are implemented
}

const useEmoteWallStore = create<EmoteWallState>()(
  persist(
    (set) => ({
      enabled: false,
      animationStyle: 'epic', // Default animation style
      physicsEnabled: false, // Default physics state
      // Default values for other settings will be added here
      setEnabled: (enabled) => set({ enabled }),
      setAnimationStyle: (style) => set({ animationStyle: style }),
      setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
    }),
    {
      name: 'obs-copilot-emote-wall-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useEmoteWallStore;