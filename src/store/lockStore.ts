import { create } from 'zustand';

export type LockKey = string;

interface LockState {
    locks: Record<LockKey, boolean>;
    setLock: (key: LockKey, locked: boolean) => void;
    isLocked: (key: LockKey) => boolean;
}

export const useLockStore = create<LockState>((set, get) => ({
    locks: {},
    setLock: (key, locked) => set((state) => ({
        locks: { ...state.locks, [key]: locked },
    })),
    isLocked: (key) => !!get().locks[key],
}));
