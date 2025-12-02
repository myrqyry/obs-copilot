import { create } from 'zustand';
import { obsClient } from '@/services/obsClient';

export type ServiceStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

interface ServiceHealth {
    status: ServiceStatus;
    lastChecked: number;
    error?: string;
}

interface HealthMonitorState {
    services: {
        obs: ServiceHealth;
        backend: ServiceHealth;
        streamerBot: ServiceHealth;
    };
    isMonitoring: boolean;
    setServiceStatus: (service: keyof HealthMonitorState['services'], status: ServiceStatus, error?: string) => void;
    startMonitoring: () => void;
    stopMonitoring: () => void;
}

export const useHealthMonitor = create<HealthMonitorState>((set, get) => ({
    services: {
        obs: { status: 'disconnected', lastChecked: 0 },
        backend: { status: 'disconnected', lastChecked: 0 },
        streamerBot: { status: 'disconnected', lastChecked: 0 }
    },
    isMonitoring: false,

    setServiceStatus: (service, status, error) => {
        set((state) => ({
            services: {
                ...state.services,
                [service]: {
                    status,
                    lastChecked: Date.now(),
                    error
                }
            }
        }));
    },

    startMonitoring: () => {
        if (get().isMonitoring) return;

        set({ isMonitoring: true });

        const checkHealth = async () => {
            const state = get();
            if (!state.isMonitoring) return;

            // Check OBS
            try {
                 // The obsClient keeps its own state, so we query it
                 // However, we rely more on event listeners pushing updates to us (in obsClient.ts)
                 // But we can check isConnected()
                 // const obsConnected = obsClient.isConnected();
                 // if (obsConnected && state.services.obs.status !== 'connected') {
                 //    state.setServiceStatus('obs', 'connected');
                 // }
            } catch (error) {
                // Ignore
            }

            // Check Backend
            try {
                // Use relative path which Vite proxies
                const response = await fetch('/api/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    if (state.services.backend.status !== 'connected') {
                        state.setServiceStatus('backend', 'connected');
                    }
                } else {
                    state.setServiceStatus('backend', 'error', `HTTP ${response.status}`);
                }
            } catch (error) {
                state.setServiceStatus('backend', 'error', error instanceof Error ? error.message : 'Network error');
            }

            // Schedule next check
            if (state.isMonitoring) {
                setTimeout(checkHealth, 10000); // Check every 10 seconds
            }
        };

        checkHealth();
    },

    stopMonitoring: () => {
        set({ isMonitoring: false });
    }
}));
