import { Scene } from '../types/obs-websocket-js';

import OBSWebSocket from 'obs-websocket-js';

export class ObsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObsError';
  }
}

export interface ObsClient {
  connect(address: string, password?: string): Promise<void>;
  disconnect(): Promise<void>;
  getSceneList(): Promise<{ scenes: Scene[] }>;
  getCurrentProgramScene(): Promise<Scene>;
  setCurrentProgramScene(sceneName: string): Promise<void>;
  getSceneItemList(sceneName: string): Promise<{ sceneItems: SceneItem[] }>;
  setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean): Promise<void>;
  getSceneItemId(sceneName: string, sourceName: string): Promise<number | null>;
  getStreamStatus(): Promise<StreamStatus>;
  startStream(): Promise<void>;
  stopStream(): Promise<void>;
  toggleStream(): Promise<void>;
  getRecordStatus(): Promise<RecordStatus>;
  startRecord(): Promise<void>;
  stopRecord(): Promise<void>;
  toggleRecord(): Promise<void>;
  getVideoSettings(): Promise<VideoSettings>;
  setVideoSettings(settings: VideoSettings): Promise<void>;
  createInput(
    inputName: string,
    inputKind: string,
    inputSettings?: InputSettings,
    sceneName?: string,
    sceneItemEnabled?: boolean
  ): Promise<void>;
  setInputSettings(inputName: string, inputSettings: InputSettings, overlay?: boolean): Promise<void>;
  getInputSettings(inputName: string): Promise<{ inputSettings: InputSettings, inputKind: string }>;
  getSourceFilterList(sourceName: string): Promise<{ filters: Filter[] }>;
  getSourceFilter(sourceName: string, filterName: string): Promise<Filter>;
  createScene(sceneName: string): Promise<void>;
  removeScene(sceneName: string): Promise<void>;
  removeInput(inputName: string): Promise<void>;
  duplicateSceneItem(sceneName: string, sceneItemId: number, destinationSceneName?: string): Promise<void>;
  setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: SceneItemTransform): Promise<void>;
  getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<{ sceneItemTransform: SceneItemTransform }>;
  createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, any>): Promise<void>;
  removeSourceFilter(sourceName: string, filterName: string): Promise<void>;
  setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void>;
  setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, any>, overlay?: boolean): Promise<void>;
  setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void>;
  setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void>;
  duplicateSourceFilter(sourceName: string, filterName: string, newFilterName: string): Promise<void>;
  getInputVolume(inputName: string): Promise<InputVolume>;
  setInputVolume(inputName: string, inputVolumeMul?: number, inputVolumeDb?: number): Promise<void>;
  setInputMute(inputName: string, inputMuted: boolean): Promise<void>;
  getVirtualCamStatus(): Promise<VirtualCamStatus>;
  startVirtualCam(): Promise<void>;
  stopVirtualCam(): Promise<void>;
  toggleStudioMode(): Promise<void>;
  getStudioModeEnabled(): Promise<StudioModeStatus>;
  openInputFiltersDialog(inputName: string): Promise<void>;
  openInputPropertiesDialog(inputName: string): Promise<void>;
  openInputInteractDialog(inputName: string): Promise<void>;
  getOutputStatus(outputName: string): Promise<OutputStatus>;
  getStreamerUsername(): Promise<string | null>;
  getSourceScreenshot(sourceName: string, imageFormat?: 'png' | 'jpg', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string>;
  getCurrentSceneScreenshot(imageFormat?: 'png' | 'jpg', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string>;
  startReplayBuffer(): Promise<void>;
  saveReplayBuffer(): Promise<void>;
  stopReplayBuffer(): Promise<void>;
  getReplayBufferStatus(): Promise<ReplayBufferStatus>;
  triggerStudioModeTransition(): Promise<void>;
  setStudioModeEnabled(enabled: boolean): Promise<void>;
  setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void>;
  setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void>;
  refreshBrowserSource(inputName: string): Promise<void>;
  triggerHotkeyByName(hotkeyName: string): Promise<void>;
  triggerHotkeyByKeySequence(keyId: string, keyModifiers: { shift: boolean, control: boolean, alt: boolean, command: boolean }): Promise<void>;
  getHotkeyList(): Promise<{ hotkeys: Hotkey[] }>;
  getStats(): Promise<Stats>;
  getLogFileList(): Promise<{ logFiles: Log[] }>;
  uploadLog(): Promise<void>;
  getSourceFilterSettings(sourceName: string, filterName: string): Promise<Filter>;
  getSourceFilterDefaultSettings(filterKind: string): Promise<{ filterSettings: { [key: string]: any } }>;
  setSceneName(sceneName: string, newSceneName: string): Promise<void>;
  getCurrentProfile(): Promise<Profile>;
  setCurrentProfile(profileName: string): Promise<void>;
  getCurrentSceneCollection(): Promise<SceneCollection>;
  setCurrentSceneCollection(sceneCollectionName: string): Promise<void>;
  addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    dimensions?: { width: number, height: number }
  ): Promise<void>;
  addImageSource(
    sceneName: string,
    imageUrl: string,
    sourceName: string
  ): Promise<void>;
  addMediaSource(
    sceneName: string,
    mediaUrl: string,
    sourceName: string
  ): Promise<void>;
  addSvgAsBrowserSource(
    sceneName: string,
    svgContent: string,
    sourceName: string
  ): Promise<void>;
  addEmojiAsBrowserSource(
    sceneName: string,
    emoji: string,
    sourceName: string
  ): Promise<void>;
  subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void;
}

export class ObsClientImpl implements ObsClient {
    public obs: OBSWebSocket;

    constructor() {
        this.obs = new OBSWebSocket();
    }

    async connect(address: string, password?: string): Promise<void> {
        try {
            await this.obs.connect(address, password, {
                eventSubscriptions: 0xFFFFFFFF
            });
        } catch (error: any) {
            throw new ObsError(`Failed to connect to OBS: ${error.message}`);
        }
    }

  async disconnect(): Promise<void> {
    try {
      await this.obs.disconnect();
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  /**
   * A helper function to make calls to the OBS WebSocket API.
   * This function wraps the obs.call method and throws an ObsError on failure.
   * @param method The name of the OBS WebSocket request to make.
   * @param params The parameters for the request.
   * @returns A promise that resolves with the response from OBS.
   */
  private async callObs<T>(method: string, params?: any): Promise<T> {
    try {
      return await this.obs.call(method, params);
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSceneList(): Promise<{ scenes: Scene[] }> {
    return this.callObs('GetSceneList');
  }

  async getCurrentProgramScene(): Promise<Scene> {
    return this.callObs('GetCurrentProgramScene');
  }

  async setCurrentProgramScene(sceneName: string): Promise<void> {
    await this.callObs('SetCurrentProgramScene', { sceneName });
  }

  async getSceneItemList(sceneName: string): Promise<{ sceneItems: SceneItem[] }> {
    return this.callObs('GetSceneItemList', { sceneName });
  }

  async setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean): Promise<void> {
    await this.callObs('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
  }

  /**
   * Gets the ID of a scene item from its name.
   * @param sceneName The name of the scene to search in.
   * @param sourceName The name of the source to find.
   * @returns A promise that resolves with the ID of the scene item, or null if it's not found.
   */
  async getSceneItemId(sceneName: string, sourceName: string): Promise<number | null> {
    const response = await this.callObs('GetSceneItemList', { sceneName });
    const sceneItem = response.sceneItems.find((item: any) =>
      item.sourceName === sourceName || item.inputName === sourceName
    );
    if (sceneItem) {
      const id = sceneItem.sceneItemId;
      if (typeof id === 'number') return id;
      if (typeof id === 'string' && !isNaN(Number(id))) return Number(id);
    }
    return null;
  }

  async getStreamStatus(): Promise<StreamStatus> {
    return this.callObs('GetStreamStatus');
  }

  async startStream(): Promise<void> {
    await this.callObs('StartStream');
  }

  async stopStream(): Promise<void> {
    await this.callObs('StopStream');
  }

  async toggleStream(): Promise<void> {
    const status = await this.getStreamStatus();
    if (status.outputActive) {
      await this.stopStream();
    } else {
      await this.startStream();
    }
  }

  async getRecordStatus(): Promise<RecordStatus> {
    return this.callObs('GetRecordStatus');
  }

  async startRecord(): Promise<void> {
    await this.callObs('StartRecord');
  }

  async stopRecord(): Promise<void> {
    await this.callObs('StopRecord');
  }

  async toggleRecord(): Promise<void> {
    const status = await this.getRecordStatus();
    if (status.outputActive) {
      await this.stopRecord();
    } else {
      await this.startRecord();
    }
  }

  async getVideoSettings(): Promise<VideoSettings> {
    return this.callObs('GetVideoSettings');
  }

  async setVideoSettings(settings: VideoSettings): Promise<void> {
    await this.callObs('SetVideoSettings', settings);
  }

  async createInput(
    inputName: string,
    inputKind: string,
    inputSettings?: InputSettings,
    sceneName?: string,
    sceneItemEnabled: boolean = true
  ): Promise<void> {
    const requestParams: {
      inputName: string;
      inputKind: string;
      inputSettings?: InputSettings;
      sceneItemEnabled: boolean;
      sceneName?: string;
    } = {
      inputName,
      inputKind,
      inputSettings,
      sceneItemEnabled,
    };
    if (sceneName) {
      requestParams.sceneName = sceneName;
    }

    await this.callObs('CreateInput', requestParams);
  }

  async setInputSettings(inputName: string, inputSettings: InputSettings, overlay: boolean = true): Promise<void> {
    await this.callObs('SetInputSettings', { inputName, inputSettings, overlay });
  }

  async getInputSettings(inputName: string): Promise<{ inputSettings: InputSettings, inputKind: string }> {
    return this.callObs('GetInputSettings', { inputName });
  }

  async getSourceFilterList(sourceName: string): Promise<{ filters: Filter[] }> {
    return this.callObs('GetSourceFilterList', { sourceName });
  }

  async getSourceFilter(sourceName: string, filterName: string): Promise<Filter> {
    return this.callObs('GetSourceFilter', { sourceName, filterName });
  }

  // Scene Management
  async createScene(sceneName: string): Promise<void> {
    await this.callObs('CreateScene', { sceneName });
  }

  async removeScene(sceneName: string): Promise<void> {
    await this.callObs('RemoveScene', { sceneName });
  }

  // Source/Input Management
  async removeInput(inputName: string): Promise<void> {
    await this.callObs('RemoveInput', { inputName });
  }

  async duplicateSceneItem(sceneName: string, sceneItemId: number, destinationSceneName?: string): Promise<void> {
    await this.callObs('DuplicateSceneItem', {
      sceneName,
      sceneItemId,
      destinationSceneName: destinationSceneName || sceneName
    });
  }

  // Scene Item Transform
  async setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: SceneItemTransform): Promise<void> {
    await this.callObs('SetSceneItemTransform', {
      sceneName,
      sceneItemId,
      sceneItemTransform
    });
  }

  async getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<{ sceneItemTransform: SceneItemTransform }> {
    return this.callObs('GetSceneItemTransform', { sceneName, sceneItemId });
  }

  // Filters
  async createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, any>): Promise<void> {
    await this.callObs('CreateSourceFilter', {
      sourceName,
      filterName,
      filterKind,
      filterSettings: filterSettings || {}
    });
  }

  async removeSourceFilter(sourceName: string, filterName: string): Promise<void> {
    await this.callObs('RemoveSourceFilter', { sourceName, filterName });
  }

  async setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void> {
    await this.callObs('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
  }

  async setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, any>, overlay: boolean = true): Promise<void> {
    await this.callObs('SetSourceFilterSettings', { sourceName, filterName, filterSettings, overlay });
  }

  // Advanced Filter Modification

  // Reorder filter
  async setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void> {
    await this.callObs('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
  }

  // Rename filter
  async setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    await this.callObs('SetSourceFilterName', { sourceName, filterName, newFilterName });
  }

  // Duplicate filter
  async duplicateSourceFilter(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    await this.callObs('DuplicateSourceFilter', { sourceName, filterName, newFilterName });
  }

  // Audio/Volume
  async getInputVolume(inputName: string): Promise<InputVolume> {
    return this.callObs('GetInputVolume', { inputName });
  }

  async setInputVolume(inputName: string, inputVolumeMul?: number, inputVolumeDb?: number): Promise<void> {
    const params: {
      inputName: string;
      inputVolumeMul?: number;
      inputVolumeDb?: number;
    } = { inputName };
    if (inputVolumeMul !== undefined) params.inputVolumeMul = inputVolumeMul;
    if (inputVolumeDb !== undefined) params.inputVolumeDb = inputVolumeDb;
    await this.callObs('SetInputVolume', params);
  }

  async setInputMute(inputName: string, inputMuted: boolean): Promise<void> {
    await this.callObs('SetInputMute', { inputName, inputMuted });
  }

  // Virtual Camera
  async getVirtualCamStatus(): Promise<VirtualCamStatus> {
    return this.callObs('GetVirtualCamStatus');
  }

  async startVirtualCam(): Promise<void> {
    await this.callObs('StartVirtualCam');
  }

  async stopVirtualCam(): Promise<void> {
    await this.callObs('StopVirtualCam');
  }

  // Studio mode
  async toggleStudioMode(): Promise<void> {
    const studioMode = await this.getStudioModeEnabled();
    await this.callObs('SetStudioModeEnabled', { studioModeEnabled: !studioMode.studioModeEnabled });
  }

  async getStudioModeEnabled(): Promise<StudioModeStatus> {
    return this.callObs('GetStudioModeEnabled');
  }

  // UI Dialog methods
  async openInputFiltersDialog(inputName: string): Promise<void> {
    await this.callObs('OpenInputFiltersDialog', { inputName });
  }

  async openInputPropertiesDialog(inputName: string): Promise<void> {
    await this.callObs('OpenInputPropertiesDialog', { inputName });
  }

  async openInputInteractDialog(inputName: string): Promise<void> {
    await this.callObs('OpenInputInteractDialog', { inputName });
  }

  // Output status
  async getOutputStatus(outputName: string): Promise<OutputStatus> {
    return this.callObs('GetOutputStatus', { outputName });
  }

  // Streamer username (this might need to be implemented based on your specific needs)
  async getStreamerUsername(): Promise<string | null> {
    // This is a placeholder - you may need to implement this based on your specific requirements
    // It could be from OBS profile info, stream service settings, etc.
    const profile = await this.callObs('GetProfileList');
    return profile.currentProfileName || null;
  }

  // Screenshot functionality
  async getSourceScreenshot(sourceName: string, imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    const params: {
      sourceName: string;
      imageFormat: 'png' | 'jpg';
      imageWidth?: number;
      imageHeight?: number;
      imageCompressionQuality?: number;
    } = {
      sourceName,
      imageFormat
    };

    if (imageWidth) params.imageWidth = imageWidth;
    if (imageHeight) params.imageHeight = imageHeight;
    if (imageCompressionQuality) params.imageCompressionQuality = imageCompressionQuality;

    const response = await this.callObs('GetSourceScreenshot', params);
    return response.imageData;
  }

  async getCurrentSceneScreenshot(imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    const currentScene = await this.getCurrentProgramScene();
    return this.getSourceScreenshot(currentScene.sceneName, imageFormat, imageWidth, imageHeight, imageCompressionQuality);
  }

  // Replay Buffer
  async startReplayBuffer(): Promise<void> {
    await this.callObs('StartReplayBuffer');
  }

  async saveReplayBuffer(): Promise<void> {
    await this.callObs('SaveReplayBuffer');
  }

  async stopReplayBuffer(): Promise<void> {
    await this.callObs('StopReplayBuffer');
  }

  async getReplayBufferStatus(): Promise<ReplayBufferStatus> {
    return this.callObs('GetReplayBufferStatus');
  }

  // Studio Mode
  async triggerStudioModeTransition(): Promise<void> {
    await this.callObs('TriggerStudioModeTransition');
  }

  async setStudioModeEnabled(enabled: boolean): Promise<void> {
    await this.callObs('SetStudioModeEnabled', { studioModeEnabled: enabled });
  }

  // Audio Monitoring
  async setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void> {
    await this.callObs('SetInputAudioMonitorType', { inputName, monitorType });
  }

  // Scene Item Blend Mode (OBS 29+)
  async setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void> {
    await this.callObs('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode: blendMode });
  }

  // Browser Source
  async refreshBrowserSource(inputName: string): Promise<void> {
    await this.callObs('PressInputPropertiesButton', { inputName, propertyName: 'refresh' });
  }

  // Hotkeys
  async triggerHotkeyByName(hotkeyName: string): Promise<void> {
    await this.callObs('TriggerHotkeyByName', { hotkeyName });
  }

  async triggerHotkeyByKeySequence(keyId: string, keyModifiers: { shift: boolean, control: boolean, alt: boolean, command: boolean }): Promise<void> {
    await this.callObs('TriggerHotkeyByKeySequence', { keyId, keyModifiers });
  }

  async getHotkeyList(): Promise<{ hotkeys: Hotkey[] }> {
    return this.callObs('GetHotkeyList');
  }

  // Performance Stats
  async getStats(): Promise<Stats> {
    return this.callObs('GetStats');
  }

  // Log Management
  async getLogFileList(): Promise<{ logFiles: Log[] }> {
    return this.callObs('GetLogFileList');
  }

  async uploadLog(): Promise<void> {
    await this.callObs('UploadLog');
  }

  // Source Filter Settings
  async getSourceFilterSettings(sourceName: string, filterName: string): Promise<Filter> {
    return this.callObs('GetSourceFilterSettings', { sourceName, filterName });
  }

  async getSourceFilterDefaultSettings(filterKind: string): Promise<{ filterSettings: { [key: string]: any } }> {
    return this.callObs('GetSourceFilterDefaultSettings', { filterKind });
  }

  // Scene Name
  async setSceneName(sceneName: string, newSceneName: string): Promise<void> {
    await this.callObs('SetSceneName', { sceneName, newSceneName });
  }

  // Profile
  async getCurrentProfile(): Promise<Profile> {
    return this.callObs('GetCurrentProfile');
  }

  async setCurrentProfile(profileName: string): Promise<void> {
    await this.callObs('SetCurrentProfile', { profileName });
  }

  // Scene Collection
  async getCurrentSceneCollection(): Promise<SceneCollection> {
    return this.callObs('GetCurrentSceneCollection');
  }

  async setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
    await this.callObs('SetCurrentSceneCollection', { sceneCollectionName });
  }

  async addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    dimensions: { width: number, height: number } = { width: 1920, height: 1080 }
  ): Promise<void> {
    await this.createInput(
      sourceName,
      'browser_source',
      {
        url: url,
        width: dimensions.width,
        height: dimensions.height,
        css: '',
      },
      sceneName,
      true
    );
  }

  async addImageSource(
    sceneName: string,
    imageUrl: string,
    sourceName: string
  ): Promise<void> {
    await this.createInput(
      sourceName,
      'image_source',
      {
        file: imageUrl,
        url: imageUrl,
      },
      sceneName,
      true
    );
  }

  async addMediaSource(
    sceneName: string,
    mediaUrl: string,
    sourceName: string
  ): Promise<void> {
    await this.createInput(
      sourceName,
      'ffmpeg_source',
      {
        is_local_file: false,
        input: mediaUrl,
        looping: true,
      },
      sceneName,
      true
    );
  }

  async addSvgAsBrowserSource(
    sceneName: string,
    svgContent: string,
    sourceName: string
  ): Promise<void> {
    const dataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    await this.addBrowserSource(sceneName, dataUri, sourceName);
  }

  async addEmojiAsBrowserSource(
    sceneName: string,
    emoji: string,
    sourceName: string
  ): Promise<void> {
    const htmlContent = `
    <style>
      body { margin: 0; padding: 0; font-size: 200px; text-align: center; line-height: 1; }
    </style>
    <body>${emoji}</body>
  `;
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    await this.addBrowserSource(sceneName, dataUri, sourceName, { width: 250, height: 250 });
  }

  subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void {
    for (const [event, handler] of Object.entries(eventHandlers)) {
      if (typeof handler === 'function') {
        this.obs.on(event, handler);
      }
    }
  }
}
