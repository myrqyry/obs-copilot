import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// --- TYPE DEFINITIONS ---

export type LockKey = string;

export interface AppError {
  id: string;
  message: string;
  source?: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  details?: Record<string, any>;
  timestamp: number;
  isDismissed: boolean;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

export interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

// --- STORE STATE INTERFACE ---

export interface UiStore {
  // Global UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Lock state management
  locks: Record<LockKey, boolean>;
  setLock: (key: LockKey, locked: boolean) => void;
  isLocked: (key: LockKey) => boolean;

  // Error management
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'isDismissed'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;

  // Modal management
  modals: ModalState[];
  openModal: (modal: Omit<ModalState, 'isOpen'>) => string;
  closeModal: (id: string) => void;

  // Confirmation Dialog
  confirmationDialog: ConfirmationDialogState;
  showConfirmation: (options: { title: string; description: string; onConfirm: () => void }) => void;
  hideConfirmation: () => void;
}

// --- STORE IMPLEMENTATION ---

const useUiStore = create<UiStore>()(
  devtools(
    (set, get) => ({
      // --- INITIAL STATE ---
      sidebarOpen: true,
      locks: {},
      errors: [],
      modals: [],
      confirmationDialog: {
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => {},
      },

      // --- ACTIONS ---
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setLock: (key, locked) =>
        set((state) => ({
          locks: { ...state.locks, [key]: locked },
        })),
      isLocked: (key) => !!get().locks[key],

      addError: (error) => {
        const newError: AppError = {
          id: `error_${Date.now()}`,
          timestamp: Date.now(),
          isDismissed: false,
          ...error,
        };
        set((state) => ({ errors: [...state.errors, newError] }));
      },
      dismissError: (id) => {
        set((state) => ({
          errors: state.errors.map((err) =>
            err.id === id ? { ...err, isDismissed: true } : err
          ),
        }));
      },
      clearErrors: () => set({ errors: [] }),

      openModal: (modal) => {
        const id = modal.id || `modal_${Date.now()}`;
        set((state) => ({
          modals: [...state.modals.filter(m => m.id !== id), { ...modal, id, isOpen: true }]
        }));
        return id;
      },
      closeModal: (id) => {
        set((state) => ({
          modals: state.modals.map(m => m.id === id ? { ...m, isOpen: false } : m)
        }));
      },

      showConfirmation: ({ title, description, onConfirm }) => {
        set({
          confirmationDialog: {
            isOpen: true,
            title,
            description,
            onConfirm: () => {
              onConfirm();
              get().hideConfirmation();
            },
          },
        });
      },
      hideConfirmation: () => {
        set({
          confirmationDialog: {
            isOpen: false,
            title: '',
            description: '',
            onConfirm: () => {},
          },
        });
      },
    }),
    {
      name: 'unified-ui-store',
    }
  )
);

export default useUiStore;