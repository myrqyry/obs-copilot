import OBSWebSocket, { OBSResponseTypes, OBSRequestTypes } from 'obs-websocket-js';
import { OBSVideoSettings } from '../types';

export class OBSWebSocketService {
  private obs: OBSWebSocket;

  constructor(obsInstance: OBSWebSocket) {
    this.obs = obsInstance;
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

  // Screenshots
  // saveScreenshot is not supported by your obs-websocket-js version or type definitions.
  // Method removed due to missing type support.

  // Replay Buffer
  async getReplayBufferStatus(): Promise<any> {
    return this.obs.call('GetReplayBufferStatus');
  }

  async startReplayBuffer(): Promise<void> {
    await this.obs.call('StartReplayBuffer');
  }

  async stopReplayBuffer(): Promise<void> {
    await this.obs.call('StopReplayBuffer');
  }

  async saveReplayBuffer(): Promise<void> {
    await this.obs.call('SaveReplayBuffer');
  }

  // Profile/Scene Collection Management
  async getCurrentProfile(): Promise<any> {
    return this.obs.call('GetProfileList');
  }

  async setCurrentProfile(profileName: string): Promise<void> {
    await this.obs.call('SetCurrentProfile', { profileName });
  }

  async getCurrentSceneCollection(): Promise<any> {
    return this.obs.call('GetSceneCollectionList');
  }

  async setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
    await this.obs.call('SetCurrentSceneCollection', { sceneCollectionName });
  }

  // Studio Mode Transition
  async triggerStudioModeTransition(): Promise<void> {
    // Note: obs-websocket-js type definitions do not support parameters for this call.
    await this.obs.call('TriggerStudioModeTransition');
  }

  // Audio Monitoring
  async setInputAudioMonitorType(inputName: string, monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"): Promise<void> {
    await this.obs.call('SetInputAudioMonitorType', { inputName, monitorType });
  }

  // Scene Item Blend Mode
  async setSceneItemBlendMode(sceneName: string, sceneItemId: number, sceneItemBlendMode: string): Promise<void> {
    await this.obs.call('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode });
  }

  // Refresh Browser Source
  async refreshBrowserSource(inputName: string): Promise<void> {
    await this.obs.call('PressInputPropertiesButton', { inputName, propertyName: "refresh" });
  }

  // Get Log Files
  async getLogFileList(): Promise<any> {
    return (this.obs as any).call('GetLogFileList');
  }

  async getLogFile(logFile: string): Promise<any> {
    return (this.obs as any).call('GetLogFile', { logFile });
  }

  // Studio Mode
  async toggleStudioMode(): Promise<void> {
    await this.obs.call('ToggleStudioMode' as any);
  }

  // Hotkeys
  async triggerHotkeyByName(hotkeyName: string): Promise<void> {
    await this.obs.call('TriggerHotkeyByName' as any, { hotkeyName });
  }
  async triggerHotkeyByKeySequence(
    keyId: string,
    keyModifiers: { shift: boolean; control: boolean; alt: boolean; command: boolean }
  ): Promise<void> {
    await this.obs.call('TriggerHotkeyByKeySequence' as any, { keyId, keyModifiers });
  }

  // Filters
  async getSourceFilterDefaultSettings(filterKind: string): Promise<any> {
    return this.obs.call('GetSourceFilterDefaultSettings' as any, { filterKind });
  }
  async getSourceFilterSettings(sourceName: string, filterName: string): Promise<any> {
    return this.obs.call('GetSourceFilterSettings' as any, { sourceName, filterName });
  }

  // Source Properties
  async getInputDefaultSettings(inputKind: string): Promise<any> {
    return this.obs.call('GetInputDefaultSettings' as any, { inputKind });
  }

  // Optionally, if you want Gemini to be able to toggle stream/record:
  async toggleStream(): Promise<void> {
    await this.obs.call('ToggleStream' as any);
  }
  async toggleRecord(): Promise<void> {
    await this.obs.call('ToggleRecord' as any);
  }

  // Output Management
  async getOutputList(): Promise<any> {
    return this.obs.call('GetOutputList' as any);
  }

  async getOutputStatus(outputName: string): Promise<any> {
    return this.obs.call('GetOutputStatus' as any, { outputName });
  }

  async startOutput(outputName: string): Promise<void> {
    await this.obs.call('StartOutput' as any, { outputName });
  }

  async stopOutput(outputName: string): Promise<void> {
    await this.obs.call('StopOutput' as any, { outputName });
  }

  async getOutputSettings(outputName: string): Promise<any> {
    return this.obs.call('GetOutputSettings' as any, { outputName });
  }

  async setOutputSettings(outputName: string, outputSettings: Record<string, any>): Promise<void> {
    await this.obs.call('SetOutputSettings' as any, { outputName, outputSettings });
  }

  // Transition Management
  async getSceneTransitionList(): Promise<any> {
    return this.obs.call('GetSceneTransitionList' as any);
  }

  async getCurrentSceneTransition(): Promise<any> {
    return this.obs.call('GetCurrentSceneTransition' as any);
  }

  async setCurrentSceneTransition(transitionName: string): Promise<void> {
    await this.obs.call('SetCurrentSceneTransition' as any, { transitionName });
  }

  async setSceneTransitionDuration(transitionDuration: number): Promise<void> {
    // This actually sets the current transition's duration
    await this.obs.call('SetCurrentSceneTransitionDuration' as any, { transitionDuration });
  }

  async getSceneTransitionCursor(): Promise<any> {
    // GetTBarPosition has been replaced by GetSceneTransitionCursor in newer OBS versions.
    // Assuming obs-websocket-js uses GetSceneTransitionCursor or similar.
    // If using an older OBS version, this might need to be GetTBarPosition.
    return this.obs.call('GetSceneTransitionCursor' as any);
  }

  // Media Controls
  async getMediaInputStatus(inputName: string): Promise<any> {
    return this.obs.call('GetMediaInputStatus' as any, { inputName });
  }

  async setMediaInputCursor(inputName: string, mediaCursor: number): Promise<void> {
    await this.obs.call('SetMediaInputCursor' as any, { inputName, mediaCursor });
  }

  async offsetMediaInputCursor(inputName: string, mediaCursorOffset: number): Promise<void> {
    await this.obs.call('OffsetMediaInputCursor' as any, { inputName, mediaCursorOffset });
  }

  async triggerMediaInputAction(inputName: string, mediaAction: string): Promise<void> {
    await this.obs.call('TriggerMediaInputAction' as any, { inputName, mediaAction });
  }

  // Preview Scene (Studio Mode)
  async getCurrentPreviewScene(): Promise<any> {
    return this.obs.call('GetCurrentPreviewScene' as any);
  }

  async setCurrentPreviewScene(sceneName: string): Promise<void> {
    await this.obs.call('SetCurrentPreviewScene' as any, { sceneName });
  }

  // Scene Item Advanced Controls
  async getSceneItemLocked(sceneName: string, sceneItemId: number): Promise<any> {
    return this.obs.call('GetSceneItemLocked' as any, { sceneName, sceneItemId });
  }

  async setSceneItemLocked(sceneName: string, sceneItemId: number, sceneItemLocked: boolean): Promise<void> {
    await this.obs.call('SetSceneItemLocked' as any, { sceneName, sceneItemId, sceneItemLocked });
  }

  async getSceneItemIndex(sceneName: string, sceneItemId: number): Promise<any> {
    return this.obs.call('GetSceneItemIndex' as any, { sceneName, sceneItemId });
  }

  async setSceneItemIndex(sceneName: string, sceneItemId: number, sceneItemIndex: number): Promise<void> {
    await this.obs.call('SetSceneItemIndex' as any, { sceneName, sceneItemId, sceneItemIndex });
  }

  async createSceneItem(sceneName: string, sourceName: string, sceneItemEnabled: boolean = true): Promise<any> {
    return this.obs.call('CreateSceneItem' as any, { sceneName, sourceName, sceneItemEnabled });
  }

  async removeSceneItem(sceneName: string, sceneItemId: number): Promise<void> {
    await this.obs.call('RemoveSceneItem' as any, { sceneName, sceneItemId });
  }

  // Statistics & System Info
  async getStats(): Promise<any> {
    return this.obs.call('GetStats' as any);
  }

  async getVersion(): Promise<any> {
    return this.obs.call('GetVersion' as any);
  }

  async getHotkeyList(): Promise<any> {
    return this.obs.call('GetHotkeyList' as any);
  }

  // Advanced Input Controls
  async getInputPropertiesListPropertyItems(inputName: string, propertyName: string): Promise<any> {
    return this.obs.call('GetInputPropertiesListPropertyItems' as any, { inputName, propertyName });
  }

  async pressInputPropertiesButton(inputName: string, propertyName: string): Promise<void> {
    await this.obs.call('PressInputPropertiesButton' as any, { inputName, propertyName });
  }

  // Audio Advanced
  async getInputAudioBalance(inputName: string): Promise<any> {
    return this.obs.call('GetInputAudioBalance' as any, { inputName });
  }

  async setInputAudioBalance(inputName: string, inputAudioBalance: number): Promise<void> {
    await this.obs.call('SetInputAudioBalance' as any, { inputName, inputAudioBalance });
  }

  async getInputAudioSyncOffset(inputName: string): Promise<any> {
    return this.obs.call('GetInputAudioSyncOffset' as any, { inputName });
  }

  async setInputAudioSyncOffset(inputName: string, inputAudioSyncOffset: number): Promise<void> {
    await this.obs.call('SetInputAudioSyncOffset' as any, { inputName, inputAudioSyncOffset });
  }

  async getInputAudioTracks(inputName: string): Promise<any> {
    return this.obs.call('GetInputAudioTracks' as any, { inputName });
  }

  async setInputAudioTracks(inputName: string, inputAudioTracks: Record<string, boolean>): Promise<void> {
    await this.obs.call('SetInputAudioTracks' as any, { inputName, inputAudioTracks });
  }

  // New OBS Actions
  async duplicateScene(sceneName: string, duplicateSceneName?: string): Promise<void> {
    const params: any = { sceneName };
    if (duplicateSceneName) {
      params.duplicateSceneName = duplicateSceneName;
    }
    await this.obs.call('DuplicateScene' as any, params);
  }

  async getSourceScreenshot(
    sourceName: string,
    imageFormat: string,
    imageWidth?: number,
    imageHeight?: number,
    imageCompressionQuality?: number
  ): Promise<OBSResponseTypes['GetSourceScreenshot']> {
    const params: OBSRequestTypes['GetSourceScreenshot'] = {
      sourceName,
      imageFormat,
    };
    if (imageWidth !== undefined) params.imageWidth = imageWidth;
    if (imageHeight !== undefined) params.imageHeight = imageHeight;
    if (imageCompressionQuality !== undefined) params.imageCompressionQuality = imageCompressionQuality;
    return this.obs.call('GetSourceScreenshot', params);
  }

  async setCurrentSceneTransitionSettings(transitionSettings: object, overlay?: boolean): Promise<void> {
    await this.obs.call('SetCurrentSceneTransitionSettings' as any, { transitionSettings, overlay });
  }

  async openInputPropertiesDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputPropertiesDialog' as any, { inputName });
  }

  async openInputFiltersDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputFiltersDialog' as any, { inputName });
  }

  async openInputInteractDialog(inputName: string): Promise<void> {
    await this.obs.call('OpenInputInteractDialog' as any, { inputName });
  }
}