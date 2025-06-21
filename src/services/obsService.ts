import OBSWebSocket, { OBSResponseTypes, OBSRequestTypes } from 'obs-websocket-js';
import { OBSVideoSettings } from '../types';

export class OBSWebSocketService {
  private obs: OBSWebSocket;

  constructor(obsInstance: OBSWebSocket) {
    this.obs = obsInstance;
  }

  /**
   * Subscribe to OBS events. Example usage:
   *   obsService.subscribeToEvents({
   *     CurrentPreviewSceneChanged: handler,
   *     SceneCreated: handler,
   *     ...
   *   })
   */
  subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void {
    for (const [event, handler] of Object.entries(eventHandlers)) {
      if (typeof handler === 'function') {
        this.obs.on(event, handler);
      }
    }
  }

  async getSceneList(): Promise<OBSResponseTypes['GetSceneList']> {
    return this.obs.call('GetSceneList');
  }

  async getCurrentProgramScene(): Promise<OBSResponseTypes['GetCurrentProgramScene']> {
    return this.obs.call('GetCurrentProgramScene');
  }

  async setCurrentProgramScene(sceneName: string): Promise<void> {
    await this.obs.call('SetCurrentProgramScene', { sceneName });
  }

  async getSceneItemList(sceneName: string): Promise<OBSResponseTypes['GetSceneItemList']> {
    return this.obs.call('GetSceneItemList', { sceneName });
  }

  async setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean): Promise<void> {
    await this.obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
  }

  // Helper method to get scene item ID by source name
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
    } catch (error) {
      console.error(`Error getting scene item ID for ${sourceName}:`, error);
      return null;
    }
  }

  async getStreamStatus(): Promise<OBSResponseTypes['GetStreamStatus']> {
    return this.obs.call('GetStreamStatus');
  }

  async startStream(): Promise<void> {
    await this.obs.call('StartStream');
  }

  async stopStream(): Promise<void> {
    await this.obs.call('StopStream');
  }

  async getRecordStatus(): Promise<OBSResponseTypes['GetRecordStatus']> {
    return this.obs.call('GetRecordStatus');
  }

  async startRecord(): Promise<void> {
    await this.obs.call('StartRecord');
  }

  async stopRecord(): Promise<void> {
    await this.obs.call('StopRecord');
  }

  async toggleRecordPause(): Promise<void> {
    await this.obs.call('ToggleRecordPause');
  }

  async getVideoSettings(): Promise<OBSResponseTypes['GetVideoSettings']> {
    return this.obs.call('GetVideoSettings');
  }

  async setVideoSettings(settings: OBSVideoSettings): Promise<void> {
    const params: OBSRequestTypes['SetVideoSettings'] = {
      baseWidth: settings.baseWidth,
      baseHeight: settings.baseHeight,
      outputWidth: settings.outputWidth,
      outputHeight: settings.outputHeight,
      fpsNumerator: settings.fpsNumerator,
      fpsDenominator: settings.fpsDenominator,
    };
    await this.obs.call('SetVideoSettings', params);
  }

  async createInput(
    inputName: string,
    inputKind: string,
    inputSettings?: Record<string, any>,
    sceneName?: string,
    sceneItemEnabled: boolean = true
  ): Promise<OBSResponseTypes['CreateInput']> {
    const requestParams: OBSRequestTypes['CreateInput'] = {
      inputName,
      inputKind,
      inputSettings,
      sceneItemEnabled,
    };
    if (sceneName) {
      // OBS WebSocket documentation shows sceneName at root for CreateInput
      // but obs-websocket-js types might place it under scene (which is wrong for CreateInput)
      // So we cast to any to ensure correct parameter placement based on protocol
      (requestParams as any).sceneName = sceneName;
    }

    return this.obs.call('CreateInput', requestParams);
  }

  async setInputSettings(inputName: string, inputSettings: Record<string, any>, overlay: boolean = true): Promise<void> {
    await this.obs.call('SetInputSettings', { inputName, inputSettings, overlay });
  }

  async getInputSettings(inputName: string): Promise<OBSResponseTypes['GetInputSettings']> {
    return this.obs.call('GetInputSettings', { inputName });
  }

  async getSourceFilterList(sourceName: string): Promise<OBSResponseTypes['GetSourceFilterList']> {
    return this.obs.call('GetSourceFilterList', { sourceName });
  }

  async getSourceFilter(sourceName: string, filterName: string): Promise<OBSResponseTypes['GetSourceFilter']> {
    return this.obs.call('GetSourceFilter', { sourceName, filterName });
  }

  // Scene Management
  async createScene(sceneName: string): Promise<void> {
    await this.obs.call('CreateScene', { sceneName });
  }

  async removeScene(sceneName: string): Promise<void> {
    await this.obs.call('RemoveScene', { sceneName });
  }

  // Source/Input Management
  async removeInput(inputName: string): Promise<void> {
    await this.obs.call('RemoveInput', { inputName });
  }

  async duplicateSceneItem(sceneName: string, sceneItemId: number, destinationSceneName?: string): Promise<any> {
    return this.obs.call('DuplicateSceneItem', {
      sceneName,
      sceneItemId,
      destinationSceneName: destinationSceneName || sceneName
    });
  }

  // Scene Item Transform
  async setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: Record<string, any>): Promise<void> {
    await this.obs.call('SetSceneItemTransform', {
      sceneName,
      sceneItemId,
      sceneItemTransform
    });
  }

  async getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<any> {
    return this.obs.call('GetSceneItemTransform', { sceneName, sceneItemId });
  }

  // Filters
  async createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, any>): Promise<void> {
    await this.obs.call('CreateSourceFilter', {
      sourceName,
      filterName,
      filterKind,
      filterSettings: filterSettings || {}
    });
  }

  async removeSourceFilter(sourceName: string, filterName: string): Promise<void> {
    await this.obs.call('RemoveSourceFilter', { sourceName, filterName });
  }

  async setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void> {
    await this.obs.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
  }

  async setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, any>, overlay: boolean = true): Promise<void> {
    await this.obs.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings, overlay });
  }

  // Advanced Filter Modification

  // Reorder filter
  async setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void> {
    await this.obs.call('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
  }

  // Rename filter
  async setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    await this.obs.call('SetSourceFilterName', { sourceName, filterName, newFilterName });
  }

  // Duplicate filter
  async duplicateSourceFilter(sourceName: string, filterName: string, newFilterName: string): Promise<void> {
    await (this.obs as any).call('DuplicateSourceFilter', { sourceName, filterName, newFilterName });
  }

  // Audio/Volume
  async getInputVolume(inputName: string): Promise<any> {
    return this.obs.call('GetInputVolume', { inputName });
  }

  async setInputVolume(inputName: string, inputVolumeMul?: number, inputVolumeDb?: number): Promise<void> {
    const params: any = { inputName };
    if (inputVolumeMul !== undefined) params.inputVolumeMul = inputVolumeMul;
    if (inputVolumeDb !== undefined) params.inputVolumeDb = inputVolumeDb;
    await this.obs.call('SetInputVolume', params);
  }

  async setInputMute(inputName: string, inputMuted: boolean): Promise<void> {
    await this.obs.call('SetInputMute', { inputName, inputMuted });
  }

  // Virtual Camera
  async getVirtualCamStatus(): Promise<any> {
    return this.obs.call('GetVirtualCamStatus');
  }

  async startVirtualCam(): Promise<void> {
    await this.obs.call('StartVirtualCam');
  }

  async stopVirtualCam(): Promise<void> {
    await this.obs.call('StopVirtualCam');
  }

  // Toggle methods for convenience
  async toggleStream(): Promise<void> {
    const status = await this.getStreamStatus();
    if (status.outputActive) {
      await this.stopStream();
    } else {
      await this.startStream();
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

  // UI Dialog methods
  async openInputFiltersDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputFiltersDialog', { inputName });
  }

  async openInputPropertiesDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputPropertiesDialog', { inputName });
  }

  async openInputInteractDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputInteractDialog', { inputName });
  }

  // Studio mode
  async toggleStudioMode(): Promise<void> {
    const studioMode = await this.getStudioModeEnabled();
    await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: !studioMode.studioModeEnabled });
  }

  async getStudioModeEnabled(): Promise<any> {
    return this.obs.call('GetStudioModeEnabled');
  }

  // Output status
  async getOutputStatus(outputName: string): Promise<any> {
    return this.obs.call('GetOutputStatus', { outputName });
  }

  // Streamer username (this might need to be implemented based on your specific needs)
  async getStreamerUsername(): Promise<string | null> {
    // This is a placeholder - you may need to implement this based on your specific requirements
    // It could be from OBS profile info, stream service settings, etc.
    try {
      const profile = await this.obs.call('GetProfileList');
      return profile.currentProfileName || null;
    } catch (error) {
      console.warn('Could not get streamer username:', error);
      return null;
    }
  }

  // Screenshot functionality
  async getSourceScreenshot(sourceName: string, imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    const params: any = {
      sourceName,
      imageFormat
    };

    if (imageWidth) params.imageWidth = imageWidth;
    if (imageHeight) params.imageHeight = imageHeight;
    if (imageCompressionQuality) params.imageCompressionQuality = imageCompressionQuality;

    const response = await this.obs.call('GetSourceScreenshot', params);
    return response.imageData;
  }

  async getCurrentSceneScreenshot(imageFormat: 'png' | 'jpg' = 'png', imageWidth?: number, imageHeight?: number, imageCompressionQuality?: number): Promise<string> {
    const currentScene = await this.getCurrentProgramScene();
    return this.getSourceScreenshot(currentScene.currentProgramSceneName, imageFormat, imageWidth, imageHeight, imageCompressionQuality);
  }

  // Replay Buffer
  async startReplayBuffer(): Promise<void> {
    await this.obs.call('StartReplayBuffer');
  }

  async saveReplayBuffer(): Promise<void> {
    await this.obs.call('SaveReplayBuffer');
  }

  async stopReplayBuffer(): Promise<void> {
    await this.obs.call('StopReplayBuffer');
  }

  async getReplayBufferStatus(): Promise<any> {
    return await this.obs.call('GetReplayBufferStatus');
  }

  // Studio Mode
  async triggerStudioModeTransition(): Promise<void> {
    await this.obs.call('TriggerStudioModeTransition');
  }

  async setStudioModeEnabled(enabled: boolean): Promise<void> {
    await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled });
  }

  // Audio Monitoring
  async setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void> {
    await this.obs.call('SetInputAudioMonitorType', { inputName, monitorType });
  }

  // Scene Item Blend Mode (OBS 29+)
  async setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void> {
    await this.obs.call('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode: blendMode });
  }

  // Browser Source
  async refreshBrowserSource(inputName: string): Promise<void> {
    await this.obs.call('PressInputPropertiesButton', { inputName, propertyName: 'refresh' });
  }

  // Hotkeys
  async triggerHotkeyByName(hotkeyName: string): Promise<void> {
    await this.obs.call('TriggerHotkeyByName', { hotkeyName });
  }

  async triggerHotkeyByKeySequence(keyId: string, keyModifiers: { shift: boolean, control: boolean, alt: boolean, command: boolean }): Promise<void> {
    await this.obs.call('TriggerHotkeyByKeySequence', { keyId, keyModifiers });
  }

  // Source Filter Settings
  async getSourceFilterSettings(sourceName: string, filterName: string): Promise<any> {
    return await (this.obs as any).call('GetSourceFilterSettings', { sourceName, filterName });
  }

  async getSourceFilterDefaultSettings(filterKind: string): Promise<any> {
    return await this.obs.call('GetSourceFilterDefaultSettings', { filterKind });
  }

  // Scene Name
  async setSceneName(sceneName: string, newSceneName: string): Promise<void> {
    await this.obs.call('SetSceneName', { sceneName, newSceneName });
  }

  // Profile
  async getCurrentProfile(): Promise<any> {
    return await this.obs.call('GetCurrentProfile' as keyof OBSRequestTypes);
  }

  async setCurrentProfile(profileName: string): Promise<void> {
    await this.obs.call('SetCurrentProfile', { profileName });
  }

  // Scene Collection
  async getCurrentSceneCollection(): Promise<any> {
    return await this.obs.call('GetCurrentSceneCollection' as keyof OBSRequestTypes);
  }

  async setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
    await this.obs.call('SetCurrentSceneCollection', { sceneCollectionName });
  }
}

// #region Helper functions for adding sources

/**
 * Adds a browser source to the current scene in OBS.
 */
export const addBrowserSource = async (
  obsService: OBSWebSocketService,
  sceneName: string,
  url: string,
  sourceName: string,
  dimensions: { width: number, height: number } = { width: 1920, height: 1080 }
) => {
  await obsService.createInput(
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
};

/**
 * Adds an image source to the current scene in OBS.
 */
export const addImageSource = async (
  obsService: OBSWebSocketService,
  sceneName: string,
  imageUrl: string,
  sourceName: string
) => {
  await obsService.createInput(
    sourceName,
    'image_source',
    {
      file: imageUrl,
      url: imageUrl,
    },
    sceneName,
    true
  );
};

/**
 * Adds a media source (like a GIF or video) to the current scene in OBS.
 */
export const addMediaSource = async (
  obsService: OBSWebSocketService,
  sceneName: string,
  mediaUrl: string,
  sourceName: string
) => {
  await obsService.createInput(
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
};

/**
 * Adds an SVG as a browser source with a data URI.
 */
export const addSvgAsBrowserSource = async (
  obsService: OBSWebSocketService,
  sceneName: string,
  svgContent: string,
  sourceName: string
) => {
  const dataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;
  await addBrowserSource(obsService, sceneName, dataUri, sourceName);
};

/**
 * Adds an emoji as a browser source using a simple HTML template.
 */
export const addEmojiAsBrowserSource = async (
  obsService: OBSWebSocketService,
  sceneName: string,
  emoji: string,
  sourceName: string
) => {
  const htmlContent = `
    <style>
      body { margin: 0; padding: 0; font-size: 200px; text-align: center; line-height: 1; }
    </style>
    <body>${emoji}</body>
  `;
  const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  await addBrowserSource(obsService, sceneName, dataUri, sourceName, { width: 250, height: 250 });
};

// #endregion
