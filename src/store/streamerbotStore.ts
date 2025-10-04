// src/store/streamerbotStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface StreamerbotState {
  streamerBotHost: string;
  streamerBotPort: string;
  setStreamerBotHost: (host: string) => void;
  setStreamerBotPort: (port: string) => void;
}

const useStreamerbotStore = create<StreamerbotState>()(
  persist(
    (set) => ({
      streamerBotHost: 'localhost',
      streamerBotPort: '8080',
      setStreamerBotHost: (host) => set({ streamerBotHost: host }),
      setStreamerBotPort: (port) => set({ streamerBotPort: port }),
    }),
    {
      name: 'obs-copilot-streamerbot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useStreamerbotStore;