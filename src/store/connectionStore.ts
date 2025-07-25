import { create } from 'zustand';
import { OBSScene, OBSSource, OBSStreamStatus, OBSRecordStatus, OBSVideoSettings } from '../types';
import { ObsClient } from '../services/ObsClient';
import { saveUserSettings } from '../utils/persistence';

export interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    connectError: string | null;
    streamerName: string | null;
    obsServiceInstance: ObsClient | null;
    actions: {
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
        setObsServiceInstance: (instance: ObsClient | null) => void;
    };
}

export const useConnectionStore = create<ConnectionState>((set) => ({
    isConnected: false,
    isConnecting: false,
    connectError: null,
    streamerName: null,
    obsServiceInstance: null,
    actions: {
        setConnecting: () => set({ isConnecting: true, connectError: null }),
        setConnected: (data) => {
            set({
                isConnected: true,
                isConnecting: false,
                ...data
            });
            if (data.streamerName) {
                saveUserSettings({ streamerName: data.streamerName });
            }
        },
        setDisconnected: (error = null) => set({
            isConnected: false,
            isConnecting: false,
            connectError: error,
        }),
        setStreamerName: (name) => {
            set({ streamerName: name });
            saveUserSettings({ streamerName: name || undefined });
        },
        setObsServiceInstance: (instance) => set({ obsServiceInstance: instance }),
    }
}));
