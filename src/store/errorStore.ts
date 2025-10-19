import useUiStore, { AppError } from './uiStore';

// Thin adapter to expose only the error-related API expected by components
export type { AppError };

export const useErrorStore = () => {
  // Provide a minimal subset interface matching prior code expectations
  const addError = (error: Omit<AppError, 'id' | 'timestamp' | 'isDismissed'>) => {
    return useUiStore.getState().addError(error);
  };

  const dismissError = (id: string) => useUiStore.getState().dismissError(id);

  const clearErrors = () => useUiStore.getState().clearErrors();

  // Return current errors array and helper functions
  const errors = useUiStore((s) => s.errors);

  return {
    errors,
    addError,
    dismissError,
    clearErrors,
  };
};

export default useErrorStore;
