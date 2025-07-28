import { create } from 'zustand';
import {
    OBSScene,
    OBSSource,
    OBSStreamStatus,
    OBSRecordStatus,
    OBSVideoSettings,
} from '../types';
import { ObsClient, ObsClientImpl } from '../services/ObsClient';
import { saveUserSettings } from '../utils/persistence';
import { ObsAction } from '../types/obsActions';

// Merged types from connectionStore and obsStore
export interface ConnectionManagerState {
    // From connectionStore
    isConnected: boolean;
    isConnecting: boolean;
    connectError: string | null;
    streamerName: string | null;
    obsServiceInstance: ObsClientImpl | null;
    streamerBotServiceInstance: any | null; // Added StreamerBot service instance

    // From obsStore
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    recordStatus: OBSRecordStatus | null;
    videoSettings: OBSVideoSettings | null;
    obsStats: any | null;
    obsHotkeys: any[] | null;

    actions: {
        // Actions from connectionStore
        setConnecting: () => void;
        setConnected: (obsData: {
            scenes: OBSScene[];
            currentProgramScene: string | null;
            sources: OBSSource[];
            streamStatus: OBSStreamStatus | null;
            recordStatus: OBSRecordStatus | null;
            videoSettings: OBSVideoSettings | null;
            streamerName: string | null;
        }) => void;
        setDisconnected: (error?: string | null) => void;
        setStreamerName: (name: string | null) => void;
        setObsServiceInstance: (instance: ObsClientImpl | null) => void;

        // Actions from obsStore
        updateOBSData: (data: Partial<Omit<ConnectionManagerState, 'actions'>>) => void; // Omit actions to avoid recursion
        handleObsAction: (action: ObsAction | ObsAction[]) => Promise<{ success: boolean; message: string; error?: string }>;
        getStats: () => Promise<void>;
        getHotkeys: () => Promise<void>;
        uploadLog: () => Promise<{ success: boolean; url?: string; message: string }>;
    };
}

export const useConnectionManagerStore = create<ConnectionManagerState>((set, get) => ({
    // Initial state from connectionStore
    isConnected: false,
    isConnecting: false,
    connectError: null,
    streamerName: null,
    obsServiceInstance: null,
    streamerBotServiceInstance: null,

    // Initial state from obsStore
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,
    obsStats: null,
    obsHotkeys: null,

    actions: {
        // Actions from connectionStore
        setConnecting: () => set({ isConnecting: true, connectError: null }),
        setConnected: (data) => {
            set({
                isConnected: true,
                isConnecting: false,
                // Merge OBS data directly into the state
                ...data,
            });
            if (data.streamerName) {
                saveUserSettings({ streamerName: data.streamerName });
            }
        },
        setDisconnected: (error = null) =>
            set({
                isConnected: false,
                isConnecting: false,
                connectError: error,
            }),
        setStreamerName: (name) => {
            set({ streamerName: name });
            saveUserSettings({ streamerName: name || undefined });
        },
        setObsServiceInstance: (instance) => set({ obsServiceInstance: instance }),

        // Actions from obsStore
        updateOBSData: (data) => set(data),
        handleObsAction: async (actionInput) => {
            const { obsServiceInstance } = get(); // Get instance from the current store
            if (!obsServiceInstance) {
                // Handle case where instance is not yet available, might need to connect first
                console.error('OBS service instance not available. Attempting to connect...');
                // Potentially trigger connection here if needed, or throw an error
                // For now, we'll throw an error as the connection process needs to be managed.
                 throw new Error('OBS service not available. Please connect first.');
            }
            const { scenes, currentProgramScene, sources, streamStatus, videoSettings } = get();
            const obsData = { scenes, currentProgramScene, sources, streamStatus, videoSettings };

            // Placeholder for the actual OBS action handling logic.
            // This would typically be a large switch statement.
            console.log("Handling OBS action:", actionInput, obsData);
            return { success: true, message: "Action handled (placeholder)" };
        },
        getStats: async () => {
            const { obsServiceInstance } = get();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const stats = await obsServiceInstance.getStats();
            set({ obsStats: stats });
        },
        getHotkeys: async () => {
            const { obsServiceInstance } = get();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const hotkeys = await obsServiceInstance.getHotkeyList();
            set({ obsHotkeys: hotkeys.hotkeys });
        },
        uploadLog: async () => {
            const { obsServiceInstance } = get();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const result = (await obsServiceInstance.uploadLog()) as { url: string };
            return { success: true, url: result.url, message: "Log uploaded" };
        },
     },
}));