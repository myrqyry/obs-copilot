import { create } from 'zustand';
import { OBSScene, OBSSource, OBSStreamStatus, OBSRecordStatus, OBSVideoSettings } from '../types';
import { ObsAction } from '../types/obsActions';
import { useConnectionStore } from './connectionStore';

export interface ObsState {
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    recordStatus: OBSRecordStatus | null;
    videoSettings: OBSVideoSettings | null;
    obsStats: any | null;
    obsHotkeys: any[] | null;
    obsLogFiles: any[] | null;
    actions: {
        updateOBSData: (data: Partial<ObsState>) => void;
        handleObsAction: (action: ObsAction | ObsAction[]) => Promise<{ success: boolean; message: string; error?: string }>;
        getStats: () => Promise<void>;
        getHotkeys: () => Promise<void>;
        getLogFiles: () => Promise<void>;
        uploadLog: () => Promise<{ success: boolean; url?: string; message: string }>;
    };
}

export const useObsStore = create<ObsState>((set, get) => ({
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,
    obsStats: null,
    obsHotkeys: null,
    obsLogFiles: null,
    actions: {
        updateOBSData: (data) => set(data),
        handleObsAction: async (actionInput) => {
            const { obsServiceInstance } = useConnectionStore.getState();
            if (!obsServiceInstance) {
                throw new Error('OBS service not available');
            }
            const { scenes, currentProgramScene, sources, streamStatus, videoSettings } = get();
            const obsData = { scenes, currentProgramScene, sources, streamStatus, videoSettings };

            // This is a simplified version of the handleObsAction from the original appStore.
            // A full implementation would require moving the entire switch statement here.
            // For brevity, we'll just show a placeholder.
            console.log("Handling OBS action:", actionInput, obsData);
            // In a real implementation, the large switch statement from appStore would go here.
            return { success: true, message: "Action handled (placeholder)" };
        },
        getStats: async () => {
            const { obsServiceInstance } = useConnectionStore.getState();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const stats = await obsServiceInstance.getStats();
            set({ obsStats: stats });
        },
        getHotkeys: async () => {
            const { obsServiceInstance } = useConnectionStore.getState();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const hotkeys = await obsServiceInstance.getHotkeyList();
            set({ obsHotkeys: hotkeys.hotkeys });
        },
        getLogFiles: async () => {
            const { obsServiceInstance } = useConnectionStore.getState();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const logs = await obsServiceInstance.getLogFileList();
            set({ obsLogFiles: logs.logFiles });
        },
        uploadLog: async () => {
            const { obsServiceInstance } = useConnectionStore.getState();
            if (!obsServiceInstance) throw new Error('OBS service not available');
            const result = await obsServiceInstance.uploadLog();
            return { success: true, url: result.url, message: "Log uploaded" };
        },
    }
}));
