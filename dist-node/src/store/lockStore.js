import { create } from 'zustand';
export const useLockStore = create((set, get) => ({
    locks: {},
    setLock: (key, locked) => set((state) => ({
        locks: { ...state.locks, [key]: locked },
    })),
    isLocked: (key) => !!get().locks[key],
}));
