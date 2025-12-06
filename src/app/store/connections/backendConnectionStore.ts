import { StateCreator } from 'zustand';

export type ServiceStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface BackendConnectionState {
  backendStatus: ServiceStatus;
  backendError: string | null;
  backendLastChecked: number;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  setBackendStatus: (status: ServiceStatus, error?: string) => void;
}

export const createBackendConnectionSlice: StateCreator<BackendConnectionState, [], [], BackendConnectionState> = (set, get) => ({
  backendStatus: 'disconnected',
  backendError: null,
  backendLastChecked: 0,
  isMonitoring: false,

  setBackendStatus: (status, error) => {
    set({
      backendStatus: status,
      backendError: error || null,
      backendLastChecked: Date.now()
    });
  },

  startMonitoring: () => {
    if (get().isMonitoring) return;

    set({ isMonitoring: true });

    const checkHealth = async () => {
      const state = get();
      if (!state.isMonitoring) return;

      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            if (state.backendStatus !== 'connected') {
                state.setBackendStatus('connected');
            }
        } else {
            state.setBackendStatus('error', `HTTP ${response.status}`);
        }
      } catch (error) {
        state.setBackendStatus('error', error instanceof Error ? error.message : 'Network error');
      }

      // Schedule next check
      if (get().isMonitoring) {
        setTimeout(checkHealth, 10000);
      }
    };

    checkHealth();
  },

  stopMonitoring: () => {
    set({ isMonitoring: false });
  }
});
