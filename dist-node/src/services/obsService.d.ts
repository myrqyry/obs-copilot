export declare class OBSWebSocketService {
    private obs;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private notifyStatus;
    constructor(obsInstance: any, notifyStatus?: (status: string) => void);
    private setupEventListeners;
    private reconnect;
    subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void;
    getSceneList(): Promise<any>;
    getCurrentProgramScene(): Promise<any>;
    setCurrentProgramScene(sceneName: string): Promise<void>;
    getSceneItemList(sceneName: string): Promise<any>;
    setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean): Promise<void>;
    getSceneItemId(sceneName: string, sourceName: string): Promise<number | null>;
    getStreamStatus(): Promise<any>;
    startStream(): Promise<void>;
    stopStream(): Promise<void>;
    getRecordStatus(): Promise<any>;
    startRecord(): Promise<void>;
    stopRecord(): Promise<void>;
    toggleRecordPause(): Promise<void>;
    getVideoSettings(): Promise<any>;
    setVideoSettings(settings: any): Promise<void>;
    createInput(inputName: string, inputKind: string, inputSettings?: Record<string, any>, sceneName?: string, sceneItemEnabled?: boolean): Promise<any>;
    setInputSettings(inputName: string, inputSettings: Record<string, any>, overlay?: boolean): Promise<void>;
    getInputSettings(inputName: string): Promise<any>;
    getSourceFilterList(sourceName: string): Promise<any>;
    getSourceFilter(sourceName: string, filterName: string): Promise<any>;
    createScene(sceneName: string): Promise<void>;
    removeScene(sceneName: string): Promise<void>;
    removeInput(inputName: string): Promise<void>;
    duplicateSceneItem(sceneName: string, sceneItemId: number, destinationSceneName?: string): Promise<any>;
    setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: Record<string, any>): Promise<void>;
    getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<any>;
    createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, any>): Promise<void>;
    removeSourceFilter(sourceName: string, filterName: string): Promise<void>;
    setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void>;
    setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, any>, overlay?: boolean): Promise<void>;
    setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void>;
    setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void>;
    duplicateSourceFilter(sourceName: string, filterName: string, newFilterName: string): Promise<void>;
    getInputVolume(inputName: string): Promise<any>;
    setInputVolume(inputName: string, inputVolumeMul?: number, inputVolumeDb?: number): Promise<void>;
    setInputMute(inputName: string, inputMuted: boolean): Promise<void>;
    getVirtualCamStatus(): Promise<any>;
    startVirtualCam(): Promise<void>;
    stopVirtualCam(): Promise<void>;
    toggleStream(): Promise<void>;
    toggleRecord(): Promise<void>;
    openInputFiltersDialog(inputName: string): Promise<void>;
    openInputPropertiesDialog(inputName: string): Promise<void>;
    openInputInteractDialog(inputName: string): Promise<void>;
    toggleStudioMode(): Promise<void>;
    getStudioModeEnabled(): Promise<any>;
    getOutputStatus(outputName: string): Promise<any>;
    getStreamerUsername(): Promise<string | null>;
    getSourceScreenshot(sourceName: string, imageFormat?: 'png' | 'jpg', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string>;
    getCurrentSceneScreenshot(imageFormat?: 'png' | 'jpg', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string>;
    startReplayBuffer(): Promise<void>;
    saveReplayBuffer(): Promise<void>;
    stopReplayBuffer(): Promise<void>;
    getReplayBufferStatus(): Promise<any>;
    triggerStudioModeTransition(): Promise<void>;
    setStudioModeEnabled(enabled: boolean): Promise<void>;
    setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void>;
    setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void>;
    refreshBrowserSource(inputName: string): Promise<void>;
    triggerHotkeyByName(hotkeyName: string): Promise<void>;
    triggerHotkeyByKeySequence(keyId: string, keyModifiers: {
        shift: boolean;
        control: boolean;
        alt: boolean;
        command: boolean;
    }): Promise<void>;
    getHotkeyList(): Promise<any>;
    getStats(): Promise<any>;
    getLogFileList(): Promise<any>;
    uploadLog(): Promise<any>;
    getSourceFilterSettings(sourceName: string, filterName: string): Promise<any>;
    getSourceFilterDefaultSettings(filterKind: string): Promise<any>;
    setSceneName(sceneName: string, newSceneName: string): Promise<void>;
    getCurrentProfile(): Promise<any>;
    setCurrentProfile(profileName: string): Promise<void>;
    getCurrentSceneCollection(): Promise<any>;
    setCurrentSceneCollection(sceneCollectionName: string): Promise<void>;
}
/**
 * Helper functions for adding sources
 */
/**
 * Adds a browser source to the current scene in OBS.
 */
export declare const addBrowserSource: (obsService: OBSWebSocketService, sceneName: string, url: string, sourceName: string, dimensions?: {
    width: number;
    height: number;
}) => Promise<void>;
/**
 * Adds an image source to the current scene in OBS.
 */
export declare const addImageSource: (obsService: OBSWebSocketService, sceneName: string, imageUrl: string, sourceName: string) => Promise<void>;
/**
 * Adds a media source (like a GIF or video) to the current scene in OBS.
 */
export declare const addMediaSource: (obsService: OBSWebSocketService, sceneName: string, mediaUrl: string, sourceName: string) => Promise<void>;
/**
 * Adds an SVG as a browser source with a data URI.
 */
export declare const addSvgAsBrowserSource: (obsService: OBSWebSocketService, sceneName: string, svgContent: string, sourceName: string) => Promise<void>;
/**
 * Adds an emoji as a browser source using a simple HTML template.
 */
export declare const addEmojiAsBrowserSource: (obsService: OBSWebSocketService, sceneName: string, emoji: string, sourceName: string) => Promise<void>;
/**
 * End of helper functions for adding sources
 */
