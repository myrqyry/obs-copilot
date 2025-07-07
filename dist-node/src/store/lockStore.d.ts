export type LockKey = string;
interface LockState {
    locks: Record<LockKey, boolean>;
    setLock: (key: LockKey, locked: boolean) => void;
    isLocked: (key: LockKey) => boolean;
}
export declare const useLockStore: import("zustand").UseBoundStore<import("zustand").StoreApi<LockState>>;
export {};
