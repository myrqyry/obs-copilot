// src/store/obsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ObsState {
  obsUrl: string;
  obsPassword?: string;
  setObsUrl: (url: string) => void;
  setObsPassword: (password: string) => void;
}

const useObsStore = create<ObsState>()(
  persist(
    (set) => ({
      obsUrl: 'ws://localhost:4455',
      obsPassword: '',
      setObsUrl: (url) => set({ obsUrl: url }),
      setObsPassword: (password) => set({ obsPassword: password }),
    }),
    {
      name: 'obs-copilot-obs-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useObsStore;