export class OBSWebSocketService {
    obs;
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000; // Initial delay in ms
    notifyStatus = null;
    constructor(obsInstance, notifyStatus) {
        this.notifyStatus = notifyStatus || null;
        this.obs = obsInstance;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.obs.on('open', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('OBS WebSocket connected');
            this.notifyStatus?.('connected');
        });
        this.obs.on('close', () => {
            this.isConnected = false;
            console.warn('OBS WebSocket disconnected');
            this.notifyStatus?.('disconnected');
            this.reconnect();
        });
        this.obs.on('error', (error) => {
            console.error('OBS WebSocket error:', error);
            this.notifyStatus?.('error');
        });
    }
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached. Giving up.');
            this.notifyStatus?.('reconnect_failed');
            return;
        }
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
        console.log(`Attempting to reconnect in ${delay}ms...`);
        setTimeout(() => {
            this.reconnectAttempts++;
            this.obs.connect().catch((error) => {
                console.error('Reconnection failed:', error);
                this.reconnect();
            });
        }, delay);
    }
    subscribeToEvents(eventHandlers) {
        for (const [event, handler] of Object.entries(eventHandlers)) {
            if (typeof handler === 'function') {
                this.obs.on(event, handler);
            }
        }
    }
    async getSceneList() {
        return this.obs.call('GetSceneList');
    }
    async getCurrentProgramScene() {
        return this.obs.call('GetCurrentProgramScene');
    }
    async setCurrentProgramScene(sceneName) {
        await this.obs.call('SetCurrentProgramScene', { sceneName });
    }
    async getSceneItemList(sceneName) {
        return this.obs.call('GetSceneItemList', { sceneName });
    }
    async setSceneItemEnabled(sceneName, sceneItemId, sceneItemEnabled) {
        await this.obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
    }
    // Helper method to get scene item ID by source name
    async getSceneItemId(sceneName, sourceName) {
        try {
            const response = await this.obs.call('GetSceneItemList', { sceneName });
            const sceneItem = response.sceneItems.find((item) => item.sourceName === sourceName || item.inputName === sourceName);
            if (sceneItem) {
                const id = sceneItem.sceneItemId;
                if (typeof id === 'number')
                    return id;
                if (typeof id === 'string' && !isNaN(Number(id)))
                    return Number(id);
            }
            return null;
        }
        catch (error) {
            console.error(`Error getting scene item ID for ${sourceName}:`, error);
            return null;
        }
    }
    async getStreamStatus() {
        return this.obs.call('GetStreamStatus');
    }
    async startStream() {
        await this.obs.call('StartStream');
    }
    async stopStream() {
        await this.obs.call('StopStream');
    }
    async getRecordStatus() {
        return this.obs.call('GetRecordStatus');
    }
    async startRecord() {
        await this.obs.call('StartRecord');
    }
    async stopRecord() {
        await this.obs.call('StopRecord');
    }
    async toggleRecordPause() {
        await this.obs.call('ToggleRecordPause');
    }
    async getVideoSettings() {
        return this.obs.call('GetVideoSettings');
    }
    async setVideoSettings(settings) {
        const params = {
            baseWidth: settings.baseWidth,
            baseHeight: settings.baseHeight,
            outputWidth: settings.outputWidth,
            outputHeight: settings.outputHeight,
            fpsNumerator: settings.fpsNumerator,
            fpsDenominator: settings.fpsDenominator,
        };
        await this.obs.call('SetVideoSettings', params);
    }
    async createInput(inputName, inputKind, inputSettings, sceneName, sceneItemEnabled = true) {
        const requestParams = {
            inputName,
            inputKind,
            inputSettings,
            sceneItemEnabled,
        };
        if (sceneName) {
            requestParams.sceneName = sceneName;
        }
        return this.obs.call('CreateInput', requestParams);
    }
    async setInputSettings(inputName, inputSettings, overlay = true) {
        await this.obs.call('SetInputSettings', { inputName, inputSettings, overlay });
    }
    async getInputSettings(inputName) {
        return this.obs.call('GetInputSettings', { inputName });
    }
    async getSourceFilterList(sourceName) {
        return this.obs.call('GetSourceFilterList', { sourceName });
    }
    async getSourceFilter(sourceName, filterName) {
        return this.obs.call('GetSourceFilter', { sourceName, filterName });
    }
    // Scene Management
    async createScene(sceneName) {
        await this.obs.call('CreateScene', { sceneName });
    }
    async removeScene(sceneName) {
        await this.obs.call('RemoveScene', { sceneName });
    }
    // Source/Input Management
    async removeInput(inputName) {
        await this.obs.call('RemoveInput', { inputName });
    }
    async duplicateSceneItem(sceneName, sceneItemId, destinationSceneName) {
        return this.obs.call('DuplicateSceneItem', {
            sceneName,
            sceneItemId,
            destinationSceneName: destinationSceneName || sceneName
        });
    }
    // Scene Item Transform
    async setSceneItemTransform(sceneName, sceneItemId, sceneItemTransform) {
        await this.obs.call('SetSceneItemTransform', {
            sceneName,
            sceneItemId,
            sceneItemTransform
        });
    }
    async getSceneItemTransform(sceneName, sceneItemId) {
        return this.obs.call('GetSceneItemTransform', { sceneName, sceneItemId });
    }
    // Filters
    async createSourceFilter(sourceName, filterName, filterKind, filterSettings) {
        await this.obs.call('CreateSourceFilter', {
            sourceName,
            filterName,
            filterKind,
            filterSettings: filterSettings || {}
        });
    }
    async removeSourceFilter(sourceName, filterName) {
        await this.obs.call('RemoveSourceFilter', { sourceName, filterName });
    }
    async setSourceFilterEnabled(sourceName, filterName, filterEnabled) {
        await this.obs.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
    }
    async setSourceFilterSettings(sourceName, filterName, filterSettings, overlay = true) {
        await this.obs.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings, overlay });
    }
    // Advanced Filter Modification
    // Reorder filter
    async setSourceFilterIndex(sourceName, filterName, filterIndex) {
        await this.obs.call('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
    }
    // Rename filter
    async setSourceFilterName(sourceName, filterName, newFilterName) {
        await this.obs.call('SetSourceFilterName', { sourceName, filterName, newFilterName });
    }
    // Duplicate filter
    async duplicateSourceFilter(sourceName, filterName, newFilterName) {
        await this.obs.call('DuplicateSourceFilter', { sourceName, filterName, newFilterName });
    }
    // Audio/Volume
    async getInputVolume(inputName) {
        return this.obs.call('GetInputVolume', { inputName });
    }
    async setInputVolume(inputName, inputVolumeMul, inputVolumeDb) {
        const params = { inputName };
        if (inputVolumeMul !== undefined)
            params.inputVolumeMul = inputVolumeMul;
        if (inputVolumeDb !== undefined)
            params.inputVolumeDb = inputVolumeDb;
        await this.obs.call('SetInputVolume', params);
    }
    async setInputMute(inputName, inputMuted) {
        await this.obs.call('SetInputMute', { inputName, inputMuted });
    }
    // Virtual Camera
    async getVirtualCamStatus() {
        return this.obs.call('GetVirtualCamStatus');
    }
    async startVirtualCam() {
        await this.obs.call('StartVirtualCam');
    }
    async stopVirtualCam() {
        await this.obs.call('StopVirtualCam');
    }
    // Toggle methods for convenience
    async toggleStream() {
        const status = await this.getStreamStatus();
        if (status.outputActive) {
            await this.stopStream();
        }
        else {
            await this.startStream();
        }
    }
    async toggleRecord() {
        const status = await this.getRecordStatus();
        if (status.outputActive) {
            await this.stopRecord();
        }
        else {
            await this.startRecord();
        }
    }
    // UI Dialog methods
    async openInputFiltersDialog(inputName) {
        await this.obs.call('OpenInputFiltersDialog', { inputName });
    }
    async openInputPropertiesDialog(inputName) {
        await this.obs.call('OpenInputPropertiesDialog', { inputName });
    }
    async openInputInteractDialog(inputName) {
        await this.obs.call('OpenInputInteractDialog', { inputName });
    }
    // Studio mode
    async toggleStudioMode() {
        const studioMode = await this.getStudioModeEnabled();
        await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: !studioMode.studioModeEnabled });
    }
    async getStudioModeEnabled() {
        return this.obs.call('GetStudioModeEnabled');
    }
    // Output status
    async getOutputStatus(outputName) {
        return this.obs.call('GetOutputStatus', { outputName });
    }
    // Streamer username (this might need to be implemented based on your specific needs)
    async getStreamerUsername() {
        // This is a placeholder - you may need to implement this based on your specific requirements
        // It could be from OBS profile info, stream service settings, etc.
        try {
            const profile = await this.obs.call('GetProfileList');
            return profile.currentProfileName || null;
        }
        catch (error) {
            console.warn('Could not get streamer username:', error);
            return null;
        }
    }
    // Screenshot functionality
    async getSourceScreenshot(sourceName, imageFormat = 'png', imageWidth, imageHeight, imageCompressionQuality) {
        const params = {
            sourceName,
            imageFormat
        };
        if (imageWidth)
            params.imageWidth = imageWidth;
        if (imageHeight)
            params.imageHeight = imageHeight;
        if (imageCompressionQuality)
            params.imageCompressionQuality = imageCompressionQuality;
        const response = await this.obs.call('GetSourceScreenshot', params);
        return response.imageData;
    }
    async getCurrentSceneScreenshot(imageFormat = 'png', imageWidth, imageHeight, imageCompressionQuality) {
        const currentScene = await this.getCurrentProgramScene();
        return this.getSourceScreenshot(currentScene.currentProgramSceneName, imageFormat, imageWidth, imageHeight, imageCompressionQuality);
    }
    // Replay Buffer
    async startReplayBuffer() {
        await this.obs.call('StartReplayBuffer');
    }
    async saveReplayBuffer() {
        await this.obs.call('SaveReplayBuffer');
    }
    async stopReplayBuffer() {
        await this.obs.call('StopReplayBuffer');
    }
    async getReplayBufferStatus() {
        return await this.obs.call('GetReplayBufferStatus');
    }
    // Studio Mode
    async triggerStudioModeTransition() {
        await this.obs.call('TriggerStudioModeTransition');
    }
    async setStudioModeEnabled(enabled) {
        await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled });
    }
    // Audio Monitoring
    async setInputAudioMonitorType(inputName, monitorType) {
        await this.obs.call('SetInputAudioMonitorType', { inputName, monitorType });
    }
    // Scene Item Blend Mode (OBS 29+)
    async setSceneItemBlendMode(sceneName, sceneItemId, blendMode) {
        await this.obs.call('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode: blendMode });
    }
    // Browser Source
    async refreshBrowserSource(inputName) {
        await this.obs.call('PressInputPropertiesButton', { inputName, propertyName: 'refresh' });
    }
    // Hotkeys
    async triggerHotkeyByName(hotkeyName) {
        await this.obs.call('TriggerHotkeyByName', { hotkeyName });
    }
    async triggerHotkeyByKeySequence(keyId, keyModifiers) {
        await this.obs.call('TriggerHotkeyByKeySequence', { keyId, keyModifiers });
    }
    async getHotkeyList() {
        return this.obs.call('GetHotkeyList');
    }
    // Performance Stats
    async getStats() {
        return this.obs.call('GetStats');
    }
    // Log Management
    async getLogFileList() {
        return this.obs.call('GetLogFileList');
    }
    async uploadLog() {
        return this.obs.call('UploadLog');
    }
    // Source Filter Settings
    async getSourceFilterSettings(sourceName, filterName) {
        return await this.obs.call('GetSourceFilterSettings', { sourceName, filterName });
    }
    async getSourceFilterDefaultSettings(filterKind) {
        return await this.obs.call('GetSourceFilterDefaultSettings', { filterKind });
    }
    // Scene Name
    async setSceneName(sceneName, newSceneName) {
        await this.obs.call('SetSceneName', { sceneName, newSceneName });
    }
    // Profile
    async getCurrentProfile() {
        return await this.obs.call('GetCurrentProfile');
    }
    async setCurrentProfile(profileName) {
        await this.obs.call('SetCurrentProfile', { profileName });
    }
    // Scene Collection
    async getCurrentSceneCollection() {
        return await this.obs.call('GetCurrentSceneCollection');
    }
    async setCurrentSceneCollection(sceneCollectionName) {
        await this.obs.call('SetCurrentSceneCollection', { sceneCollectionName });
    }
}
/**
 * Helper functions for adding sources
 */
/**
 * Adds a browser source to the current scene in OBS.
 */
export const addBrowserSource = async (obsService, sceneName, url, sourceName, dimensions = { width: 1920, height: 1080 }) => {
    await obsService.createInput(sourceName, 'browser_source', {
        url: url,
        width: dimensions.width,
        height: dimensions.height,
        css: '',
    }, sceneName, true);
};
/**
 * Adds an image source to the current scene in OBS.
 */
export const addImageSource = async (obsService, sceneName, imageUrl, sourceName) => {
    await obsService.createInput(sourceName, 'image_source', {
        file: imageUrl,
        url: imageUrl,
    }, sceneName, true);
};
/**
 * Adds a media source (like a GIF or video) to the current scene in OBS.
 */
export const addMediaSource = async (obsService, sceneName, mediaUrl, sourceName) => {
    await obsService.createInput(sourceName, 'ffmpeg_source', {
        is_local_file: false,
        input: mediaUrl,
        looping: true,
    }, sceneName, true);
};
/**
 * Adds an SVG as a browser source with a data URI.
 */
export const addSvgAsBrowserSource = async (obsService, sceneName, svgContent, sourceName) => {
    const dataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    await addBrowserSource(obsService, sceneName, dataUri, sourceName);
};
/**
 * Adds an emoji as a browser source using a simple HTML template.
 */
export const addEmojiAsBrowserSource = async (obsService, sceneName, emoji, sourceName) => {
    const htmlContent = `
    <style>
      body { margin: 0; padding: 0; font-size: 200px; text-align: center; line-height: 1; }
    </style>
    <body>${emoji}</body>
  `;
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    await addBrowserSource(obsService, sceneName, dataUri, sourceName, { width: 250, height: 250 });
};
/**
 * End of helper functions for adding sources
 */
