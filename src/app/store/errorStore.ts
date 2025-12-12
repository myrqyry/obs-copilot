
import useUiStore, { AppError, UiStore } from './uiStore';

// Define the exact shape of the error slice we want to expose
export interface ErrorStoreSlice {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'isDismissed'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

// Selector function to extract only error-related state
const errorSelector = (state: UiStore): ErrorStoreSlice => ({
  errors: state.errors,
  addError: state.addError,
  dismissError: state.dismissError,
  clearErrors: state.clearErrors,
});

export const useErrorStore = () => {
  return useUiStore(errorSelector);
};

// Backwards compatibility accessor for non-hook usage
// Attach a typed getter that proxies to the main store
export const getErrorStoreState = () => errorSelector(useUiStore.getState());

// If you absolutely must keep the .getState() syntax on the hook for legacy code:
(useErrorStore as any).getState = getErrorStoreState;

export type { AppError };
export default useErrorStore;
