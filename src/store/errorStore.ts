import useUiStore, { AppError as UiAppError } from './uiStore';

// Lightweight compatibility wrapper so existing imports of useErrorStore work
export type AppError = UiAppError;

export const useErrorStore = () => {
  // Map api: keep the same shape as previous error store used by the codebase
  const addError = (err: Omit<AppError, 'id' | 'timestamp' | 'isDismissed'>) => useUiStore.getState().addError(err);
  const dismissError = (id: string) => useUiStore.getState().dismissError(id);
  const clearErrors = () => useUiStore.getState().clearErrors();
  const errors = useUiStore.getState().errors;
  return { errors, addError, dismissError, clearErrors };
};

export default useErrorStore;
