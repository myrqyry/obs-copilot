// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConnectionSettings {
    obs: {
        url: string;
        port: number;
        password?: string;
        autoConnect: boolean;
    };
    backend: {
        url: string;
    };
}

interface SettingsStore {
    settings: ConnectionSettings;
    updateSettings: (section: keyof ConnectionSettings, data: Partial<ConnectionSettings['obs'] | ConnectionSettings['backend']>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            settings: {
                obs: {
                    url: 'localhost',
                    port: 4455,
                    autoConnect: true
                },
                backend: {
                    url: 'http://localhost:8000'
                }
            },
            updateSettings: (section, data) => set((state) => ({
                settings: {
                    ...state.settings,
                    [section]: { ...state.settings[section], ...data }
                }
            }))
        }),
        {
            name: 'obs-copilot-settings',
        }
    )
);
