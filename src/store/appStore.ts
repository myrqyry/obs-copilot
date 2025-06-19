// src/store/appStore.ts
import { create } from 'zustand';
import type {
    OBSScene,
    OBSSource,
    OBSStreamStatus,
    OBSRecordStatus,
    OBSVideoSettings,
    ChatMessage,
    CatppuccinAccentColorName,
    CatppuccinSecondaryAccentColorName,
    CatppuccinChatBubbleColorName
} from '../types';
import type { ObsAction } from '../types/obsActions';
import type { OBSWebSocketService } from '../services/obsService';
import { loadUserSettings, saveUserSettings, isStorageAvailable } from '../utils/persistence';

interface AppState {
    // Connection State
    isConnected: boolean;
    isConnecting: boolean;
    connectError: string | null;
    streamerName: string | null;

    // OBS Data State
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    recordStatus: OBSRecordStatus | null;
    videoSettings: OBSVideoSettings | null;

    // OBS service instance
    obsServiceInstance: OBSWebSocketService | null;

    // Chat State
    geminiMessages: ChatMessage[];
    geminiApiKey: string;
    isGeminiClientInitialized: boolean;
    geminiInitializationError: string | null;

    // Memory Context State
    userDefinedContext: string[];

    // UI & Settings State - wrapped in userSettings for component compatibility
    userSettings: {
        flipSides: boolean;
        autoApplySuggestions: boolean;
        extraDarkMode: boolean;
        customChatBackground: string;
        bubbleFillOpacity: number;
        backgroundOpacity: number;
        theme: {
            accent: CatppuccinAccentColorName;
            secondaryAccent: CatppuccinSecondaryAccentColorName;
            userChatBubble: CatppuccinChatBubbleColorName;
            modelChatBubble: CatppuccinChatBubbleColorName;
        };
    };

    // Legacy theme access for backward compatibility
    flipSides: boolean;
    autoApplySuggestions: boolean;
    extraDarkMode: boolean;
    customChatBackground: string;
    bubbleFillOpacity: number;
    backgroundOpacity: number;
    theme: {
        accent: CatppuccinAccentColorName;
        secondaryAccent: CatppuccinSecondaryAccentColorName;
        userChatBubble: CatppuccinChatBubbleColorName;
        modelChatBubble: CatppuccinChatBubbleColorName;
    };

    // Define the actions (functions) to update the state
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
        addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
        replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
        setGeminiApiKey: (key: string) => void;
        setStreamerName: (name: string | null) => void;
        setGeminiClientInitialized: (initialized: boolean) => void;
        setGeminiInitializationError: (error: string | null) => void;
        addToUserDefinedContext: (context: string) => void;
        removeFromUserDefinedContext: (context: string) => void;
        clearUserDefinedContext: () => void;
        toggleFlipSides: () => void;
        toggleAutoApplySuggestions: () => void;
        toggleExtraDarkMode: () => void;
        setCustomChatBackground: (background: string) => void;
        setBubbleFillOpacity: (opacity: number) => void;
        setBackgroundOpacity: (opacity: number) => void;
        setThemeColor: (type: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble', color: any) => void;
        setObsServiceInstance: (instance: OBSWebSocketService | null) => void;
        updateOBSData: (data: Partial<{
            scenes: OBSScene[];
            currentProgramScene: string | null;
            sources: OBSSource[];
            streamStatus: OBSStreamStatus | null;
            recordStatus: OBSRecordStatus | null;
            videoSettings: OBSVideoSettings | null;
        }>) => void;
        handleObsAction: (action: ObsAction) => Promise<{ success: boolean; message: string; error?: string }>;
    };
}

// Load persisted settings
const persistedSettings = isStorageAvailable() ? loadUserSettings() : {};

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State - merge with persisted settings
    isConnected: false,
    isConnecting: false,
    connectError: null,
    streamerName: persistedSettings.streamerName || null,
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,
    obsServiceInstance: null,
    geminiMessages: [],
    geminiApiKey: persistedSettings.geminiApiKey || '',
    isGeminiClientInitialized: false,
    geminiInitializationError: null,
    userDefinedContext: persistedSettings.userDefinedContext || [],

    // Legacy properties for backward compatibility
    flipSides: persistedSettings.flipSides || false,
    autoApplySuggestions: persistedSettings.autoApplySuggestions || false,
    extraDarkMode: persistedSettings.extraDarkMode || false,
    customChatBackground: persistedSettings.customChatBackground || '',
    bubbleFillOpacity: persistedSettings.bubbleFillOpacity || 0.85,
    backgroundOpacity: persistedSettings.backgroundOpacity || 0.7,
    theme: {
        accent: (persistedSettings.theme?.accent as CatppuccinAccentColorName) || 'mauve',
        secondaryAccent: (persistedSettings.theme?.secondaryAccent as CatppuccinSecondaryAccentColorName) || 'flamingo',
        userChatBubble: (persistedSettings.theme?.userChatBubble as CatppuccinChatBubbleColorName) || 'blue',
        modelChatBubble: (persistedSettings.theme?.modelChatBubble as CatppuccinChatBubbleColorName) || 'lavender',
    },

    // New userSettings wrapper for component compatibility
    userSettings: {
        flipSides: persistedSettings.flipSides || false,
        autoApplySuggestions: persistedSettings.autoApplySuggestions || false,
        extraDarkMode: persistedSettings.extraDarkMode || false,
        customChatBackground: persistedSettings.customChatBackground || '',
        bubbleFillOpacity: persistedSettings.bubbleFillOpacity || 0.85,
        backgroundOpacity: persistedSettings.backgroundOpacity || 0.7,
        theme: {
            accent: (persistedSettings.theme?.accent as CatppuccinAccentColorName) || 'mauve',
            secondaryAccent: (persistedSettings.theme?.secondaryAccent as CatppuccinSecondaryAccentColorName) || 'flamingo',
            userChatBubble: (persistedSettings.theme?.userChatBubble as CatppuccinChatBubbleColorName) || 'blue',
            modelChatBubble: (persistedSettings.theme?.modelChatBubble as CatppuccinChatBubbleColorName) || 'lavender',
        },
    },

    // Actions
    actions: {
        setConnecting: () => set({ isConnecting: true, connectError: null }),
        setConnected: (data) => {
            set({
                isConnected: true,
                isConnecting: false,
                ...data
            });
            // Save streamer name if provided
            if (data.streamerName && isStorageAvailable()) {
                saveUserSettings({ streamerName: data.streamerName });
            }
        },
        setDisconnected: (error = null) => set({
            isConnected: false,
            isConnecting: false,
            connectError: error,
            scenes: [],
            currentProgramScene: null,
            sources: [],
            streamStatus: null,
            recordStatus: null,
            videoSettings: null,
        }),
        addMessage: (message) => set((state) => ({
            geminiMessages: [...state.geminiMessages, {
                ...message,
                id: Date.now().toString() + Math.random(),
                timestamp: new Date()
            }]
        })),
        replaceMessage: (messageId, newMessage) => set((state) => ({
            geminiMessages: state.geminiMessages.map(msg =>
                msg.id === messageId
                    ? { ...newMessage, id: messageId, timestamp: new Date() }
                    : msg
            )
        })),
        setGeminiApiKey: (key) => {
            set({ geminiApiKey: key });
            // Save API key to persistence if storage is available
            if (isStorageAvailable()) {
                saveUserSettings({ geminiApiKey: key });
            }
        },
        setStreamerName: (name) => {
            set({ streamerName: name });
            // Save streamer name to persistence if storage is available
            if (isStorageAvailable()) {
                saveUserSettings({ streamerName: name || undefined });
            }
        },
        setGeminiClientInitialized: (initialized) => set({ isGeminiClientInitialized: initialized }),
        setGeminiInitializationError: (error) => set({ geminiInitializationError: error }),
        addToUserDefinedContext: (context) => {
            const updatedContext = [...get().userDefinedContext, context];
            set({ userDefinedContext: updatedContext });
            if (isStorageAvailable()) {
                saveUserSettings({ userDefinedContext: updatedContext });
            }
        },
        removeFromUserDefinedContext: (context) => {
            const updatedContext = get().userDefinedContext.filter(item => item !== context);
            set({ userDefinedContext: updatedContext });
            if (isStorageAvailable()) {
                saveUserSettings({ userDefinedContext: updatedContext });
            }
        },
        clearUserDefinedContext: () => {
            set({ userDefinedContext: [] });
            if (isStorageAvailable()) {
                saveUserSettings({ userDefinedContext: [] });
            }
        },
        toggleFlipSides: () => {
            const newValue = !get().flipSides;
            const state = get();
            const newUserSettings = { ...state.userSettings, flipSides: newValue };
            set({
                flipSides: newValue,
                userSettings: newUserSettings
            });
            // Save to persistence
            if (isStorageAvailable()) {
                saveUserSettings({ flipSides: newValue });
            }
        },
        toggleAutoApplySuggestions: () => {
            const newValue = !get().autoApplySuggestions;
            const state = get();
            const newUserSettings = { ...state.userSettings, autoApplySuggestions: newValue };
            set({
                autoApplySuggestions: newValue,
                userSettings: newUserSettings
            });
            // Save to persistence
            if (isStorageAvailable()) {
                saveUserSettings({ autoApplySuggestions: newValue });
            }
        },
        toggleExtraDarkMode: () => {
            const newValue = !get().extraDarkMode;
            const state = get();
            const newUserSettings = { ...state.userSettings, extraDarkMode: newValue };
            set({
                extraDarkMode: newValue,
                userSettings: newUserSettings
            });
            // Save to persistence
            if (isStorageAvailable()) {
                saveUserSettings({ extraDarkMode: newValue });
            }
        },
        setThemeColor: (type, color) => {
            const state = get();
            const currentTheme = state.theme;
            const newTheme = { ...currentTheme, [type]: color };
            const newUserSettings = { ...state.userSettings, theme: newTheme };
            set({
                theme: newTheme,
                userSettings: newUserSettings
            });
            // Save to persistence
            if (isStorageAvailable()) {
                saveUserSettings({ theme: newTheme });
            }
        },
        setCustomChatBackground: (background) => {
            const state = get();
            const newUserSettings = { ...state.userSettings, customChatBackground: background };
            set({
                customChatBackground: background,
                userSettings: newUserSettings
            });
            if (isStorageAvailable()) {
                saveUserSettings({ customChatBackground: background });
            }
        },
        setBubbleFillOpacity: (opacity) => {
            const state = get();
            const newUserSettings = { ...state.userSettings, bubbleFillOpacity: opacity };
            set({
                bubbleFillOpacity: opacity,
                userSettings: newUserSettings
            });
            if (isStorageAvailable()) {
                saveUserSettings({ bubbleFillOpacity: opacity });
            }
        },
        setBackgroundOpacity: (opacity) => {
            const state = get();
            const newUserSettings = { ...state.userSettings, backgroundOpacity: opacity };
            set({
                backgroundOpacity: opacity,
                userSettings: newUserSettings
            });
            if (isStorageAvailable()) {
                saveUserSettings({ backgroundOpacity: opacity });
            }
        },
        setObsServiceInstance: (instance) => set({ obsServiceInstance: instance }),
        updateOBSData: (data) => set(data),
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

                    case 'openInputFiltersDialog':
                        const openFiltersAction = action;
                        await obsServiceInstance.openInputFiltersDialog(openFiltersAction.inputName);
                        actionFeedback = `\n✅ Opened filters dialog for input "${openFiltersAction.inputName}".`;
                        break;

                    case 'openInputPropertiesDialog':
                        const openPropertiesAction = action;
                        await obsServiceInstance.openInputPropertiesDialog(openPropertiesAction.inputName);
                        actionFeedback = `\n✅ Opened properties dialog for input "${openPropertiesAction.inputName}".`;
                        break;

                    case 'openInputInteractDialog':
                        const openInteractAction = action;
                        await obsServiceInstance.openInputInteractDialog(openInteractAction.inputName);
                        actionFeedback = `\n✅ Opened interact dialog for input "${openInteractAction.inputName}".`;
                        break;

                    case 'toggleStudioMode':
                        await obsServiceInstance.toggleStudioMode();
                        actionFeedback = "\n✅ Studio mode toggled!";
                        break;

                    case 'getVideoSettings': {
                        const settings = await obsServiceInstance.getVideoSettings();
                        actionFeedback = `\n✅ Fetched video settings.`;
                        additionalSystemMessage = `🎥 **Current Video Settings:**\n\n` +
                            `📐 **Canvas Resolution:** ${settings.baseWidth} × ${settings.baseHeight}\n` +
                            `🖥️ **Output Resolution:** ${settings.outputWidth} × ${settings.outputHeight}\n` +
                            `🎬 **Frame Rate:** ${settings.fpsNumerator}/${settings.fpsDenominator} FPS (${(settings.fpsNumerator / settings.fpsDenominator).toFixed(2)} FPS)`;
                        break;
                    }

                    case 'getOutputStatus': {
                        const getOutputStatusAction = action;
                        const status = await obsServiceInstance.getOutputStatus(getOutputStatusAction.outputName);
                        actionFeedback = `\n✅ Output status for "${getOutputStatusAction.outputName}" fetched.`;
                        additionalSystemMessage = `ℹ️ Status for output "${getOutputStatusAction.outputName}":\n\`\`\`json\n${JSON.stringify(status, null, 2)}\n\`\`\``;
                        break;
                    }

                    case 'getStreamStatus': {
                        const status = await obsServiceInstance.getStreamStatus();
                        actionFeedback = `\n✅ Fetched stream status.`;
                        const isActive = status.outputActive;
                        const duration = status.outputDuration ? `${Math.floor(status.outputDuration / 60)}:${(status.outputDuration % 60).toString().padStart(2, '0')}` : '0:00';
                        additionalSystemMessage = `🎥 **Stream Status:**\n\n` +
                            `${isActive ? '🟢 **Status:** LIVE' : '🔴 **Status:** OFFLINE'}\n` +
                            `⏱️ **Duration:** ${duration}\n` +
                            (status.outputBytes ? `📊 **Data Sent:** ${(status.outputBytes / 1024 / 1024).toFixed(1)} MB\n` : '') +
                            (status.outputSkippedFrames ? `⚠️ **Skipped Frames:** ${status.outputSkippedFrames}\n` : '') +
                            (status.outputTotalFrames ? `🎬 **Total Frames:** ${status.outputTotalFrames}` : '');
                        break;
                    }

                    case 'getRecordStatus': {
                        const status = await obsServiceInstance.getRecordStatus();
                        actionFeedback = `\n✅ Fetched record status.`;
                        const isActive = status.outputActive;
                        const duration = status.outputDuration ? `${Math.floor(status.outputDuration / 60)}:${(status.outputDuration % 60).toString().padStart(2, '0')}` : '0:00';
                        additionalSystemMessage = `🎬 **Recording Status:**\n\n` +
                            `${isActive ? '🔴 **Status:** RECORDING' : '⏹️ **Status:** STOPPED'}\n` +
                            `⏱️ **Duration:** ${duration}\n` +
                            (status.outputBytes ? `💾 **File Size:** ${(status.outputBytes / 1024 / 1024).toFixed(1)} MB\n` : '') +
                            (status.outputTimecode ? `🕒 **Timecode:** ${status.outputTimecode}` : '');
                        break;
                    }

                    case 'startStream': {
                        await obsServiceInstance.startStream();
                        actionFeedback = `\n✅ Started streaming.`;
                        break;
                    }

                    case 'stopStream': {
                        await obsServiceInstance.stopStream();
                        actionFeedback = `\n✅ Stopped streaming.`;
                        break;
                    }

                    case 'startRecord': {
                        await obsServiceInstance.startRecord();
                        actionFeedback = `\n✅ Started recording.`;
                        break;
                    }

                    case 'stopRecord': {
                        await obsServiceInstance.stopRecord();
                        actionFeedback = `\n✅ Stopped recording.`;
                        break;
                    }

                    case 'setVideoSettings':
                        const setVideoAction = action;
                        await obsServiceInstance.setVideoSettings(setVideoAction.videoSettings);
                        actionFeedback = `\n✅ Successfully updated video settings.`;
                        break;

                    case 'createScene':
                        const createSceneAction = action;
                        await obsServiceInstance.createScene(createSceneAction.sceneName);
                        actionFeedback = `\n✅ Successfully created scene "${createSceneAction.sceneName}".`;
                        break;

                    case 'removeInput':
                        const removeInputAction = action;
                        await obsServiceInstance.removeInput(removeInputAction.inputName);
                        actionFeedback = `\n✅ Successfully removed input "${removeInputAction.inputName}".`;
                        break;

                    case 'setInputVolume':
                        const volumeAction = action;
                        await obsServiceInstance.setInputVolume(volumeAction.inputName, volumeAction.inputVolumeMul, volumeAction.inputVolumeDb);
                        actionFeedback = `\n✅ Successfully set volume for input "${volumeAction.inputName}".`;
                        break;

                    case 'setInputMute':
                        const muteAction = action;
                        await obsServiceInstance.setInputMute(muteAction.inputName, muteAction.inputMuted);
                        actionFeedback = `\n✅ Successfully ${muteAction.inputMuted ? 'muted' : 'unmuted'} input "${muteAction.inputName}".`;
                        break;

                    case 'getInputSettings':
                        const getSettingsAction = action;
                        const settingsResponse = await obsServiceInstance.getInputSettings(getSettingsAction.inputName);
                        actionFeedback = `\n✅ Fetched settings for input "${getSettingsAction.inputName}".`;
                        additionalSystemMessage = `ℹ️ Properties for input "${getSettingsAction.inputName}" (Kind: "${settingsResponse.inputKind}"):\n\`\`\`json\n${JSON.stringify(settingsResponse.inputSettings, null, 2)}\n\`\`\``;
                        break;

                    case 'getSceneItemList':
                        const getListAction = action;
                        const listResponse = await obsServiceInstance.getSceneItemList(getListAction.sceneName);
                        const enabledItems = listResponse.sceneItems.filter(item => item.sceneItemEnabled);
                        const disabledItems = listResponse.sceneItems.filter(item => !item.sceneItemEnabled);

                        actionFeedback = `\n✅ Fetched items for scene "${getListAction.sceneName}".`;

                        let itemsList = `📋 **Sources in Scene "${getListAction.sceneName}":**\n\n`;

                        if (enabledItems.length > 0) {
                            itemsList += `🟢 **Enabled Sources:**\n`;
                            enabledItems.forEach((item, index) => {
                                const kindDisplay = item.inputKind ? ` (${String(item.inputKind).replace(/_/g, ' ')})` : '';
                                itemsList += `${index + 1}. **${item.sourceName}**${kindDisplay}\n`;
                            });
                            itemsList += '\n';
                        }

                        if (disabledItems.length > 0) {
                            itemsList += `🔴 **Disabled Sources:**\n`;
                            disabledItems.forEach((item, index) => {
                                const kindDisplay = item.inputKind ? ` (${String(item.inputKind).replace(/_/g, ' ')})` : '';
                                itemsList += `${index + 1}. ~~${item.sourceName}~~${kindDisplay}\n`;
                            });
                        }

                        if (enabledItems.length === 0 && disabledItems.length === 0) {
                            itemsList += `❌ No sources found in this scene.`;
                        }

                        additionalSystemMessage = itemsList;
                        break;

                    case 'getSourceScreenshot':
                        const screenshotAction = action;
                        const screenshotData = await obsServiceInstance.getSourceScreenshot(
                            screenshotAction.sourceName,
                            screenshotAction.imageFormat as 'png' | 'jpg',
                            screenshotAction.imageWidth,
                            screenshotAction.imageHeight,
                            screenshotAction.imageCompressionQuality
                        );
                        actionFeedback = `\n✅ Successfully captured screenshot of "${screenshotAction.sourceName}".`;

                        // The screenshot data is base64 encoded, so we can display it as an image
                        const imageType = screenshotAction.imageFormat === 'jpg' ? 'jpeg' : 'png';
                        const cleanBase64 = screenshotData.replace(/^data:image\/[a-z]+;base64,/, '');

                        // Create a more compact message with a properly constrained image
                        additionalSystemMessage = `📸 **Screenshot captured of "${screenshotAction.sourceName}"**\n\n<div style="max-width: 100%; overflow: hidden;"><img src="data:image/${imageType};base64,${cleanBase64}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="OBS Screenshot" /></div>\n\n*Screenshot added to context for AI analysis.*`;
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
    }
}));
