import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface AppError {
  id: string;
  message: string;
  source?: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  details?: Record<string, any>;
  timestamp: number;
  isDismissed: boolean;
}

interface ErrorState {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'isDismissed'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  clearErrorsBySource: (source: string) => void;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  addError: (error) => {
    const newError: AppError = {
      id: uuidv4(),
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
  clearErrorsBySource: (source) => {
    set((state) => ({
      errors: state.errors.filter((err) => err.source !== source),
    }));
  },
}));
