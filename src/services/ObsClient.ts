import { Scene } from '../types/obs-websocket-js';

// Dynamic import for OBSWebSocket
let OBSWebSocket: any;
import('obs-websocket-js').then(obs => {
    OBSWebSocket = obs.default;
});

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
        // The OBSWebSocket instance is created in the init method
    }

    async init() {
        if (!OBSWebSocket) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for the dynamic import
        }
        this.obs = new OBSWebSocket();
    }

    async connect(address: string, password?: string): Promise<void> {
        if (!this.obs) {
            await this.init();
        }
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

  async getSceneList(): Promise<{ scenes: Scene[] }> {
    try {
      return await this.obs.call('GetSceneList');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getCurrentProgramScene(): Promise<Scene> {
    try {
      return await this.obs.call('GetCurrentProgramScene');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setCurrentProgramScene(sceneName: string): Promise<void> {
    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSceneItemList(sceneName: string): Promise<{ sceneItems: SceneItem[] }> {
    try {
      return await this.obs.call('GetSceneItemList', { sceneName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean): Promise<void> {
    try {
      await this.obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSceneItemId(sceneName: string, sourceName: string): Promise<number | null> {
    try {
      const response = await this.obs.call('GetSceneItemList', { sceneName });
      const sceneItem = response.sceneItems.find((item: any) =>
        item.sourceName === sourceName || item.inputName === sourceName
      );
      if (sceneItem) {
        const id = sceneItem.sceneItemId;
        if (typeof id === 'number') return id;
        if (typeof id === 'string' && !isNaN(Number(id))) return Number(id);
      }
      return null;
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getStreamStatus(): Promise<StreamStatus> {
    try {
      return await this.obs.call('GetStreamStatus');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async startStream(): Promise<void> {
    try {
      await this.obs.call('StartStream');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async stopStream(): Promise<void> {
    try {
      await this.obs.call('StopStream');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
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
    try {
      return await this.obs.call('GetRecordStatus');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async startRecord(): Promise<void> {
    try {
      await this.obs.call('StartRecord');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async stopRecord(): Promise<void> {
    try {
      await this.obs.call('StopRecord');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
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
    try {
      return await this.obs.call('GetVideoSettings');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setVideoSettings(settings: VideoSettings): Promise<void> {
    try {
      await this.obs.call('SetVideoSettings', settings);
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async createInput(
    inputName: string,
    inputKind: string,
    inputSettings?: InputSettings,
    sceneName?: string,
    sceneItemEnabled: boolean = true
  ): Promise<void> {
    try {
      const requestParams = {
        inputName,
        inputKind,
        inputSettings,
        sceneItemEnabled,
      };
      if (sceneName) {
        (requestParams as any).sceneName = sceneName;
      }

      await this.obs.call('CreateInput', requestParams);
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setInputSettings(inputName: string, inputSettings: InputSettings, overlay: boolean = true): Promise<void> {
    try {
      await this.obs.call('SetInputSettings', { inputName, inputSettings, overlay });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getInputSettings(inputName: string): Promise<{ inputSettings: InputSettings, inputKind: string }> {
    try {
      return await this.obs.call('GetInputSettings', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSourceFilterList(sourceName: string): Promise<{ filters: Filter[] }> {
    try {
      return await this.obs.call('GetSourceFilterList', { sourceName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSourceFilter(sourceName: string, filterName: string): Promise<Filter> {
    try {
      return await this.obs.call('GetSourceFilter', { sourceName, filterName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Scene Management
  async createScene(sceneName: string): Promise<void> {
    try {
      await this.obs.call('CreateScene', { sceneName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async removeScene(sceneName: string): Promise<void> {
    try {
      await this.obs.call('RemoveScene', { sceneName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Source/Input Management
  async removeInput(inputName: string): Promise<void> {
    try {
      await this.obs.call('RemoveInput', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async duplicateSceneItem(sceneName: string, sceneItemId: number, destinationSceneName?: string): Promise<void> {
    try {
      await this.obs.call('DuplicateSceneItem', {
        sceneName,
        sceneItemId,
        destinationSceneName: destinationSceneName || sceneName
      });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Scene Item Transform
  async setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: SceneItemTransform): Promise<void> {
    try {
      await this.obs.call('SetSceneItemTransform', {
        sceneName,
        sceneItemId,
        sceneItemTransform
      });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<{ sceneItemTransform: SceneItemTransform }> {
    try {
      return await this.obs.call('GetSceneItemTransform', { sceneName, sceneItemId });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Filters
  async createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, any>): Promise<void> {
    try {
      await this.obs.call('CreateSourceFilter', {
        sourceName,
        filterName,
        filterKind,
        filterSettings: filterSettings || {}
      });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async removeSourceFilter(sourceName: string, filterName: string): Promise<void> {
    try {
      await this.obs.call('RemoveSourceFilter', { sourceName, filterName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void> {
    try {
      await this.obs.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, any>, overlay: boolean = true): Promise<void> {
    try {
      await this.obs.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings, overlay });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Advanced Filter Modification

  // Reorder filter
  async setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void> {
    try {
      await this.obs.call('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Rename filter
  async setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    try {
      await this.obs.call('SetSourceFilterName', { sourceName, filterName, newFilterName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Duplicate filter
  async duplicateSourceFilter(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    try {
      await (this.obs as any).call('DuplicateSourceFilter', { sourceName, filterName, newFilterName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Audio/Volume
  async getInputVolume(inputName: string): Promise<InputVolume> {
    try {
      return await this.obs.call('GetInputVolume', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setInputVolume(inputName: string, inputVolumeMul?: number, inputVolumeDb?: number): Promise<void> {
    try {
      const params: any = { inputName };
      if (inputVolumeMul !== undefined) params.inputVolumeMul = inputVolumeMul;
      if (inputVolumeDb !== undefined) params.inputVolumeDb = inputVolumeDb;
      await this.obs.call('SetInputVolume', params);
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setInputMute(inputName: string, inputMuted: boolean): Promise<void> {
    try {
      await this.obs.call('SetInputMute', { inputName, inputMuted });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Virtual Camera
  async getVirtualCamStatus(): Promise<VirtualCamStatus> {
    try {
      return await this.obs.call('GetVirtualCamStatus');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async startVirtualCam(): Promise<void> {
    try {
      await this.obs.call('StartVirtualCam');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async stopVirtualCam(): Promise<void> {
    try {
      await this.obs.call('StopVirtualCam');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Studio mode
  async toggleStudioMode(): Promise<void> {
    try {
      const studioMode = await this.getStudioModeEnabled();
      await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: !studioMode.studioModeEnabled });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getStudioModeEnabled(): Promise<StudioModeStatus> {
    try {
      return await this.obs.call('GetStudioModeEnabled');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // UI Dialog methods
  async openInputFiltersDialog(inputName: string): Promise<void> {
    try {
      await this.obs.call('OpenInputFiltersDialog', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async openInputPropertiesDialog(inputName: string): Promise<void> {
    try {
      await this.obs.call('OpenInputPropertiesDialog', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async openInputInteractDialog(inputName: string): Promise<void> {
    try {
      await this.obs.call('OpenInputInteractDialog', { inputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Output status
  async getOutputStatus(outputName: string): Promise<OutputStatus> {
    try {
      return await this.obs.call('GetOutputStatus', { outputName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Streamer username (this might need to be implemented based on your specific needs)
  async getStreamerUsername(): Promise<string | null> {
    // This is a placeholder - you may need to implement this based on your specific requirements
    // It could be from OBS profile info, stream service settings, etc.
    try {
      const profile = await this.obs.call('GetProfileList');
      return profile.currentProfileName || null;
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Screenshot functionality
  async getSourceScreenshot(sourceName: string, imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    try {
      const params: any = {
        sourceName,
        imageFormat
      };

      if (imageWidth) params.imageWidth = imageWidth;
      if (imageHeight) params.imageHeight = imageHeight;
      if (imageCompressionQuality) params.imageCompressionQuality = imageCompressionQuality;

      const response = await this.obs.call('GetSourceScreenshot', params);
      return response.imageData;
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getCurrentSceneScreenshot(imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    try {
      const currentScene = await this.getCurrentProgramScene();
      return this.getSourceScreenshot(currentScene.sceneName, imageFormat, imageWidth, imageHeight, imageCompressionQuality);
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Replay Buffer
  async startReplayBuffer(): Promise<void> {
    try {
      await this.obs.call('StartReplayBuffer');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async saveReplayBuffer(): Promise<void> {
    try {
      await this.obs.call('SaveReplayBuffer');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async stopReplayBuffer(): Promise<void> {
    try {
      await this.obs.call('StopReplayBuffer');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getReplayBufferStatus(): Promise<ReplayBufferStatus> {
    try {
      return await this.obs.call('GetReplayBufferStatus');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Studio Mode
  async triggerStudioModeTransition(): Promise<void> {
    try {
      await this.obs.call('TriggerStudioModeTransition');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setStudioModeEnabled(enabled: boolean): Promise<void> {
    try {
      await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Audio Monitoring
  async setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void> {
    try {
      await this.obs.call('SetInputAudioMonitorType', { inputName, monitorType });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Scene Item Blend Mode (OBS 29+)
  async setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void> {
    try {
      await this.obs.call('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode: blendMode });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Browser Source
  async refreshBrowserSource(inputName: string): Promise<void> {
    try {
      await this.obs.call('PressInputPropertiesButton', { inputName, propertyName: 'refresh' });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Hotkeys
  async triggerHotkeyByName(hotkeyName: string): Promise<void> {
    try {
      await this.obs.call('TriggerHotkeyByName', { hotkeyName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async triggerHotkeyByKeySequence(keyId: string, keyModifiers: { shift: boolean, control: boolean, alt: boolean, command: boolean }): Promise<void> {
    try {
      await this.obs.call('TriggerHotkeyByKeySequence', { keyId, keyModifiers });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getHotkeyList(): Promise<{ hotkeys: Hotkey[] }> {
    try {
      return await this.obs.call('GetHotkeyList');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Performance Stats
  async getStats(): Promise<Stats> {
    try {
      return await this.obs.call('GetStats');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Log Management
  async getLogFileList(): Promise<{ logFiles: Log[] }> {
    try {
      return await this.obs.call('GetLogFileList');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async uploadLog(): Promise<void> {
    try {
      await this.obs.call('UploadLog');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Source Filter Settings
  async getSourceFilterSettings(sourceName: string, filterName: string): Promise<Filter> {
    try {
      return await (this.obs as any).call('GetSourceFilterSettings', { sourceName, filterName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async getSourceFilterDefaultSettings(filterKind: string): Promise<{ filterSettings: { [key: string]: any } }> {
    try {
      return await this.obs.call('GetSourceFilterDefaultSettings', { filterKind });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Scene Name
  async setSceneName(sceneName: string, newSceneName: string): Promise<void> {
    try {
      await this.obs.call('SetSceneName', { sceneName, newSceneName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Profile
  async getCurrentProfile(): Promise<Profile> {
    try {
      return await this.obs.call('GetCurrentProfile');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setCurrentProfile(profileName: string): Promise<void> {
    try {
      await this.obs.call('SetCurrentProfile', { profileName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  // Scene Collection
  async getCurrentSceneCollection(): Promise<SceneCollection> {
    try {
      return await this.obs.call('GetCurrentSceneCollection');
    } catch (error: any) {
      throw new ObsError(error.message);
    }
  }

  async setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
    try {
      await this.obs.call('SetCurrentSceneCollection', { sceneCollectionName });
    } catch (error: any) {
      throw new ObsError(error.message);
    }
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
