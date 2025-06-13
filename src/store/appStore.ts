// src/store/appStore.ts
import { create } from 'zustand';
import type {
    OBSScene,
    OBSSource,
    OBSStreamStatus,
    OBSRecordStatus,
    OBSVideoSettings
} from '../types';
import type { ObsAction } from '../types/obsActions';
import type { OBSWebSocketService } from '../services/obsService';

interface AppState {
    // OBS connection state
    isConnected: boolean;
    isConnecting: boolean;
    connectError: string | null;

    // OBS data
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    recordStatus: OBSRecordStatus | null;
    videoSettings: OBSVideoSettings | null;
    streamerName: string | null;

    // OBS service instance
    obsServiceInstance: OBSWebSocketService | null;

    // Actions
    setData: (data: Partial<Omit<AppState, 'setData' | 'setObsServiceInstance' | 'handleObsAction'>>) => void;
    setObsServiceInstance: (instance: OBSWebSocketService | null) => void;
    setIsConnected: (isConnected: boolean) => void;
    setIsConnecting: (isConnecting: boolean) => void;
    setConnectError: (error: string | null) => void;
    setStreamerName: (name: string | null) => void;
    handleObsAction: (action: ObsAction) => Promise<{ success: boolean; message: string; error?: string }>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectError: null,
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,
    streamerName: null,
    obsServiceInstance: null,

    // Setters
    setData: (data) => set(data),
    setObsServiceInstance: (instance) => set({ obsServiceInstance: instance }),
    setIsConnected: (isConnected) => set({ isConnected }),
    setIsConnecting: (isConnecting) => set({ isConnecting }),
    setConnectError: (error) => set({ connectError: error }),
    setStreamerName: (name) => set({ streamerName: name }),

    // OBS actions handler
    handleObsAction: async (action) => {
        const state = get();
        const { obsServiceInstance, scenes, currentProgramScene, sources, streamStatus, videoSettings } = state;

        if (!obsServiceInstance) {
            throw new Error('OBS service not available');
        }

        const obsData = { scenes, currentProgramScene, sources, streamStatus, videoSettings };
        let actionAttemptMessage = `**OBS Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;
        let actionFeedback = "";
        let additionalSystemMessage = "";

        try {
            switch (action.type) {
                case 'createInput':
                    const createAction = action;
                    let sceneToAddTo = createAction.sceneName;
                    if (sceneToAddTo && !obsData.scenes.find((s: any) => s.sceneName === sceneToAddTo)) {
                        sceneToAddTo = obsData.currentProgramScene || undefined;
                    }
                    await obsServiceInstance.createInput(
                        createAction.inputName,
                        createAction.inputKind,
                        createAction.inputSettings,
                        sceneToAddTo,
                        createAction.sceneItemEnabled
                    );
                    actionFeedback += `\n✅ Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
                    break;

                case 'setInputSettings':
                    const setSettingsAction = action;
                    await obsServiceInstance.setInputSettings(
                        setSettingsAction.inputName,
                        setSettingsAction.inputSettings,
                        setSettingsAction.overlay
                    );
                    actionFeedback = `\n✅ Successfully updated settings for input "${setSettingsAction.inputName}".`;
                    break;

                case 'setSceneItemEnabled':
                    const targetAction = action;
                    const sceneItemId = await obsServiceInstance.getSceneItemId(targetAction.sceneName, targetAction.sourceName);
                    if (sceneItemId === null) {
                        throw new Error(`Source "${targetAction.sourceName}" not found in scene "${targetAction.sceneName}"`);
                    }
                    const enabledValue = typeof targetAction.sceneItemEnabled === 'boolean'
                        ? targetAction.sceneItemEnabled
                        : !!targetAction.enabled;
                    await obsServiceInstance.setSceneItemEnabled(targetAction.sceneName, sceneItemId, enabledValue);
                    actionFeedback = `\n✅ Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
                    break;

                case 'setCurrentProgramScene':
                    const setSceneAction = action;
                    await obsServiceInstance.setCurrentProgramScene(setSceneAction.sceneName);
                    actionFeedback = `\n✅ Successfully switched to scene "${setSceneAction.sceneName}".`;
                    break;

                case 'toggleStream':
                    await obsServiceInstance.toggleStream();
                    actionFeedback = "\n✅ Stream toggled!";
                    break;

                case 'toggleRecord':
                    await obsServiceInstance.toggleRecord();
                    actionFeedback = "\n✅ Record toggled!";
                    break;

                // Add more action types as needed...
                default:
                    const unknownActionType = (action as any).type;
                    actionFeedback = `\n❌ Unsupported OBS action type: ${unknownActionType}`;
                    throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
            }

            actionAttemptMessage += `${actionFeedback}`;
            if (additionalSystemMessage) {
                actionAttemptMessage += `\n\n---\n${additionalSystemMessage}`;
            }

            // Return success result - components can handle messaging
            return { success: true, message: actionAttemptMessage };
        } catch (err: any) {
            console.error(`OBS Action "${action.type}" failed:`, err);
            const failureFeedback = `\n❗ Failed to execute OBS action "${action.type}": ${(err as Error).message || 'Unknown error'}`;
            actionAttemptMessage += `${failureFeedback}`;

            // Return error result - components can handle messaging
            return { success: false, message: actionAttemptMessage, error: err.message };
        }
    },
}));
