import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LockState {
  locks: Record<string, boolean>;
  setLock: (key: string, isLocked: boolean) => void;
  isLocked: (key: string) => boolean;
  toggleLock: (key: string) => void;
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      locks: {},
      setLock: (key, isLocked) =>
        set((state) => ({
          locks: { ...state.locks, [key]: isLocked },
        })),
      isLocked: (key) => !!get().locks[key],
      toggleLock: (key) =>
        set((state) => ({
          locks: { ...state.locks, [key]: !state.locks[key] },
        })),
    }),
    {
      name: 'ui-locks',
    }
  )
);
