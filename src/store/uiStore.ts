import { create } from 'zustand';

interface ErrorObject {
  id: string;
  message: string;
  source: string;
  timestamp: number;
  level: 'critical' | 'error' | 'warning';
  retry?: () => void;
  details?: Record<string, any>;
}

interface UiStore {
  criticalErrors: ErrorObject[];
  addError: (error: Omit<ErrorObject, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
}

const useUiStore = create<UiStore>((set, get) => ({
  criticalErrors: [],
  addError: (errorData) => {
    const newError: ErrorObject = {
      ...errorData,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    set((state) => ({ criticalErrors: [...state.criticalErrors, newError] }));
  },
  clearErrors: () => set({ criticalErrors: [] }),
  removeError: (id) => set((state) => ({
    criticalErrors: state.criticalErrors.filter((e) => e.id !== id),
  })),
}));

export default useUiStore;