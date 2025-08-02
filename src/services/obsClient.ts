import OBSWebSocket from 'obs-websocket-js';
// The 'Input' type is not available in the same way in v5, using a more generic type for now.
import {
  Scene,
  SceneItem,
  StreamStatus,
  RecordStatus,
  VideoSettings,
  InputSettings,
  Filter,
  SceneItemTransform,
  InputVolume,
  VirtualCamStatus,
  StudioModeStatus,
  OutputStatus,
  Profile,
  ReplayBufferStatus,
  Hotkey,
  Stats,
  Log,
  SceneCollection,
  Input,
} from 'obs-websocket-js'; // Explicitly import types from the module

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
  setSceneItemEnabled(
    sceneName: string,
    sceneItemId: number,
    sceneItemEnabled: boolean,
  ): Promise<void>;
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
    sceneItemEnabled?: boolean,
  ): Promise<void>;
  setInputSettings(
    inputName: string,
    inputSettings: InputSettings,
    overlay?: boolean,
  ): Promise<void>;
  getInputSettings(inputName: string): Promise<{ inputSettings: InputSettings; inputKind: string }>;
  getSourceFilterList(sourceName: string): Promise<{ filters: Filter[] }>;
  getSourceFilter(sourceName: string, filterName: string): Promise<Filter>;
  createScene(sceneName: string): Promise<void>;
  removeScene(sceneName: string): Promise<void>;
  removeInput(inputName: string): Promise<void>;
  duplicateSceneItem(
    sceneName: string,
    sceneItemId: number,
    destinationSceneName?: string,
  ): Promise<void>;
  setSceneItemTransform(
    sceneName: string,
    sceneItemId: number,
    sceneItemTransform: SceneItemTransform,
  ): Promise<void>;
  getSceneItemTransform(
    sceneName: string,
    sceneItemId: number,
  ): Promise<{ sceneItemTransform: SceneItemTransform }>;
  createSourceFilter(
    sourceName: string,
    filterName: string,
    filterKind: string,
    filterSettings?: InputSettings,
  ): Promise<void>;
  removeSourceFilter(sourceName: string, filterName: string): Promise<void>;
  setSourceFilterEnabled(
    sourceName: string,
    filterName: string,
    filterEnabled: boolean,
  ): Promise<void>;
  setSourceFilterSettings(
    sourceName: string,
    filterName: string,
    filterSettings: InputSettings,
    overlay?: boolean,
  ): Promise<void>;
  setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void>;
  setSourceFilterName(sourceName: string, filterName: string, newFilterName: string): Promise<void>;
  duplicateSourceFilter(
    sourceName: string,
    filterName: string,
    newFilterName: string,
  ): Promise<void>;
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
  getSourceScreenshot(
    sourceName: string,
    imageFormat?: 'png' | 'jpg',
    imageWidth?: number,
    imageHeight?: number,
    imageCompressionQuality?: number,
  ): Promise<string>;
  getCurrentSceneScreenshot(
    imageFormat?: 'png' | 'jpg',
    imageWidth?: number,
    imageHeight?: number,
    imageCompressionQuality?: number,
  ): Promise<string>;
  startReplayBuffer(): Promise<void>;
  saveReplayBuffer(): Promise<void>;
  stopReplayBuffer(): Promise<void>;
  getReplayBufferStatus(): Promise<ReplayBufferStatus>;
  triggerStudioModeTransition(): Promise<void>;
  setStudioModeEnabled(enabled: boolean): Promise<void>;
  setInputAudioMonitorType(
    inputName: string,
    monitorType:
      | 'OBS_MONITORING_TYPE_NONE'
      | 'OBS_MONITORING_TYPE_MONITOR_ONLY'
      | 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
  ): Promise<void>;
  setSceneItemBlendMode(sceneName: string, sceneItemId: number, blendMode: string): Promise<void>;
  refreshBrowserSource(inputName: string): Promise<void>;
  triggerHotkeyByName(hotkeyName: string): Promise<void>;
  triggerHotkeyByKeySequence(
    keyId: string,
    keyModifiers: { shift: boolean; control: boolean; alt: boolean; command: boolean },
  ): Promise<void>;
  getHotkeyList(): Promise<{ hotkeys: Hotkey[] }>;
  getStats(): Promise<Stats>;
  getLogFileList(): Promise<{ logFiles: Log[] }>;
  uploadLog(): Promise<void>;
  getSourceFilterSettings(sourceName: string, filterName: string): Promise<Filter>;
  getSourceFilterDefaultSettings(
    filterKind: string,
  ): Promise<{ filterSettings: InputSettings }>;
  setSceneName(sceneName: string, newSceneName: string): Promise<void>;
  getCurrentProfile(): Promise<Profile>;
  setCurrentProfile(profileName: string): Promise<void>;
  getCurrentSceneCollection(): Promise<SceneCollection>;
  setCurrentSceneCollection(sceneCollectionName: string): Promise<void>;
  addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    dimensions?: { width: number; height: number },
  ): Promise<void>;
  addImageSource(sceneName: string, imageUrl: string, sourceName: string): Promise<void>;
  addMediaSource(sceneName: string, mediaUrl: string, sourceName: string): Promise<void>;
  addSvgAsBrowserSource(sceneName: string, svgContent: string, sourceName: string): Promise<void>;
  addEmojiAsBrowserSource(sceneName: string, emoji: string, sourceName: string): Promise<void>;
  subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void;
  getInputs(): Promise<{ inputs: Input[] }>;
}

export class ObsClientImpl implements ObsClient {
  public obs: OBSWebSocket;

  constructor() {
    this.obs = new OBSWebSocket();
  }

  /**
   * Connects to the OBS WebSocket server.
   * @param address The WebSocket address (e.g., 'ws://localhost:4444').
   * @param password Optional password for authentication.
   * @returns A Promise that resolves when the connection is successful.
   * @throws {ObsError} If the connection fails.
   */
  async connect(address: string, password?: string): Promise<void> {
    try {
      await this.obs.connect(address, password, {
        eventSubscriptions: 0xffffffff, // Subscribe to all events
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to connect to OBS: ${error.message}`);
      }
      throw new ObsError('Failed to connect to OBS: Unknown error');
    }
  }

  /**
   * Disconnects from the OBS WebSocket server.
   * @returns A Promise that resolves when the disconnection is successful.
   * @throws {ObsError} If the disconnection fails.
   */
  async disconnect(): Promise<void> {
    try {
      await this.obs.disconnect();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to disconnect from OBS: ${error.message}`);
      }
      throw new ObsError('Failed to disconnect from OBS: Unknown error');
    }
  }

  /**
   * A helper function to make calls to the OBS WebSocket API.
   * This function wraps the obs.call method and throws an ObsError on failure.
   * @param method The name of the OBS WebSocket request to make.
   * @param params The parameters for the request.
   * @returns A promise that resolves with the response from OBS.
   */
  private async callObs<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    try {
      return await this.obs.call(method, params);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(error.message);
      }
      throw new ObsError('Unknown error');
    }
  }

  private validateString(value: unknown, name: string): void {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ObsError(`${name} must be a non-empty string.`);
    }
  }

  private validateNumber(value: unknown, name: string): void {
    if (typeof value !== 'number') {
      throw new ObsError(`${name} must be a number.`);
    }
  }

  private validateBoolean(value: unknown, name: string): void {
    if (typeof value !== 'boolean') {
      throw new ObsError(`${name} must be a boolean.`);
    }
  }

  /**
   * Gets a list of all scenes in OBS.
   * @returns A Promise that resolves with an object containing an array of scenes.
   * @throws {ObsError} If the API call fails.
   */
  async getSceneList(): Promise<{ scenes: Scene[] }> {
    return this.callObs('GetSceneList');
  }

  /**
   * Gets the currently active program scene.
   * @returns A Promise that resolves with the current program scene.
   * @throws {ObsError} If the API call fails.
   */
  async getCurrentProgramScene(): Promise<Scene> {
    return this.callObs('GetCurrentProgramScene');
  }

  /**
   * Sets the current program scene.
   * @param sceneName The name of the scene to set as the program scene.
   * @returns A Promise that resolves when the scene is set.
   * @throws {ObsError} If the sceneName is invalid or the API call fails.
   */
  async setCurrentProgramScene(sceneName: string): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    await this.callObs('SetCurrentProgramScene', { sceneName });
  }

  /**
   * Gets a list of items in a specific scene.
   * @param sceneName The name of the scene to get items from.
   * @returns A Promise that resolves with an object containing an array of scene items.
   * @throws {ObsError} If the sceneName is invalid or the API call fails.
   */
  async getSceneItemList(sceneName: string): Promise<{ sceneItems: SceneItem[] }> {
    this.validateString(sceneName, 'sceneName');
    return this.callObs('GetSceneItemList', { sceneName });
  }

  /**
   * Sets the enabled state of a scene item.
   * @param sceneName The name of the scene containing the item.
   * @param sceneItemId The ID of the scene item.
   * @param sceneItemEnabled The new enabled state.
   * @returns A Promise that resolves when the state is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSceneItemEnabled(
    sceneName: string,
    sceneItemId: number,
    sceneItemEnabled: boolean,
  ): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    this.validateNumber(sceneItemId, 'sceneItemId');
    this.validateBoolean(sceneItemEnabled, 'sceneItemEnabled');
    await this.callObs('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
  }

  /**
   * Gets the ID of a scene item from its name.
   * @param sceneName The name of the scene to search in.
   * @param sourceName The name of the source to find.
   * @returns A promise that resolves with the ID of the scene item, or null if it's not found.
   */
  async getSceneItemId(sceneName: string, sourceName: string): Promise<number | null> {
    this.validateString(sceneName, 'sceneName');
    this.validateString(sourceName, 'sourceName');
    const response = await this.callObs<{ sceneItems: SceneItem[] }>('GetSceneItemList', {
      sceneName,
    });
    const sceneItem = response.sceneItems.find(
      (item) => item.sourceName === sourceName,
    );
    if (sceneItem) {
      const id = sceneItem.sceneItemId;
      if (typeof id === 'number') return id;
      if (typeof id === 'string' && !isNaN(Number(id))) return Number(id);
    }
    return null;
  }

  /**
   * Gets the current stream status.
   * @returns A Promise that resolves with the stream status.
   * @throws {ObsError} If the API call fails.
   */
  async getStreamStatus(): Promise<StreamStatus> {
    return this.callObs('GetStreamStatus');
  }

  /**
   * Starts the stream.
   * @returns A Promise that resolves when the stream starts.
   * @throws {ObsError} If the API call fails.
   */
  async startStream(): Promise<void> {
    await this.callObs('StartStream');
  }

  /**
   * Stops the stream.
   * @returns A Promise that resolves when the stream stops.
   * @throws {ObsError} If the API call fails.
   */
  async stopStream(): Promise<void> {
    await this.callObs('StopStream');
  }

  /**
   * Toggles the stream status (starts if stopped, stops if started).
   * @returns A Promise that resolves when the stream state is toggled.
   * @throws {ObsError} If the API call fails.
   */
  async toggleStream(): Promise<void> {
    try {
      const status = await this.getStreamStatus();
      if (status.outputActive) {
        await this.stopStream();
      } else {
        await this.startStream();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to toggle stream: ${error.message}`);
      }
      throw new ObsError('Failed to toggle stream: Unknown error');
    }
  }

  /**
   * Gets the current record status.
   * @returns A Promise that resolves with the record status.
   * @throws {ObsError} If the API call fails.
   */
  async getRecordStatus(): Promise<RecordStatus> {
    return this.callObs('GetRecordStatus');
  }

  /**
   * Starts recording.
   * @returns A Promise that resolves when recording starts.
   * @throws {ObsError} If the API call fails.
   */
  async startRecord(): Promise<void> {
    await this.callObs('StartRecord');
  }

  /**
   * Stops recording.
   * @returns A Promise that resolves when recording stops.
   * @throws {ObsError} If the API call fails.
   */
  async stopRecord(): Promise<void> {
    await this.callObs('StopRecord');
  }

  /**
   * Toggles the record status (starts if stopped, stops if started).
   * @returns A Promise that resolves when the record state is toggled.
   * @throws {ObsError} If the API call fails.
   */
  async toggleRecord(): Promise<void> {
    try {
      const status = await this.getRecordStatus();
      if (status.outputActive) {
        await this.stopRecord();
      } else {
        await this.startRecord();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to toggle record: ${error.message}`);
      }
      throw new ObsError('Failed to toggle record: Unknown error');
    }
  }

  /**
   * Gets the current video settings.
   * @returns A Promise that resolves with the video settings.
   * @throws {ObsError} If the API call fails.
   */
  async getVideoSettings(): Promise<VideoSettings> {
    return this.callObs('GetVideoSettings');
  }

  /**
   * Sets the video settings.
   * @param settings The video settings to apply.
   * @returns A Promise that resolves when the settings are applied.
   * @throws {ObsError} If the API call fails.
   */
  async setVideoSettings(settings: VideoSettings): Promise<void> {
    await this.callObs('SetVideoSettings', settings);
  }

  /**
   * Creates a new input (source) in OBS.
   * @param inputName The name of the new input.
   * @param inputKind The kind of input (e.g., 'browser_source', 'image_source').
   * @param inputSettings Optional settings for the input.
   * @param sceneName Optional scene to add the input to.
   * @param sceneItemEnabled Whether the scene item should be enabled.
   * @returns A Promise that resolves when the input is created.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async createInput(
    inputName: string,
    inputKind: string,
    inputSettings?: InputSettings,
    sceneName?: string,
    sceneItemEnabled: boolean = true,
  ): Promise<void> {
    this.validateString(inputName, 'inputName');
    this.validateString(inputKind, 'inputKind');
    if (sceneName) {
      this.validateString(sceneName, 'sceneName');
    }
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

  /**
   * Sets the settings for an input.
   * @param inputName The name of the input.
   * @param inputSettings The settings to apply.
   * @param overlay Whether to overlay the settings.
   * @returns A Promise that resolves when the settings are applied.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setInputSettings(
    inputName: string,
    inputSettings: InputSettings,
    overlay: boolean = true,
  ): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('SetInputSettings', { inputName, inputSettings, overlay });
  }

  /**
   * Gets the settings for an input.
   * @param inputName The name of the input.
   * @returns A Promise that resolves with the input settings and kind.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async getInputSettings(
    inputName: string,
  ): Promise<{ inputSettings: InputSettings; inputKind: string }> {
    this.validateString(inputName, 'inputName');
    return this.callObs('GetInputSettings', { inputName });
  }

  /**
   * Gets a list of filters for a source.
   * @param sourceName The name of the source.
   * @returns A Promise that resolves with an object containing an array of filters.
   * @throws {ObsError} If the sourceName is invalid or the API call fails.
   */
  async getSourceFilterList(sourceName: string): Promise<{ filters: Filter[] }> {
    this.validateString(sourceName, 'sourceName');
    return this.callObs('GetSourceFilterList', { sourceName });
  }

  /**
   * Gets a specific filter from a source.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter.
   * @returns A Promise that resolves with the filter.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async getSourceFilter(sourceName: string, filterName: string): Promise<Filter> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    return this.callObs('GetSourceFilter', { sourceName, filterName });
  }

  // Scene Management
  /**
   * Creates a new scene.
   * @param sceneName The name of the new scene.
   * @returns A Promise that resolves when the scene is created.
   * @throws {ObsError} If the sceneName is invalid or the API call fails.
   */
  async createScene(sceneName: string): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    await this.callObs('CreateScene', { sceneName });
  }

  /**
   * Removes a scene.
   * @param sceneName The name of the scene to remove.
   * @returns A Promise that resolves when the scene is removed.
   * @throws {ObsError} If the sceneName is invalid or the API call fails.
   */
  async removeScene(sceneName: string): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    await this.callObs('RemoveScene', { sceneName });
  }

  // Source/Input Management
  /**
   * Removes an input (source) from OBS.
   * @param inputName The name of the input to remove.
   * @returns A Promise that resolves when the input is removed.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async removeInput(inputName: string): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('RemoveInput', { inputName });
  }

  /**
   * Duplicates a scene item.
   * @param sceneName The name of the scene containing the item.
   * @param sceneItemId The ID of the scene item to duplicate.
   * @param destinationSceneName Optional name of the destination scene. If not provided, duplicates within the same scene.
   * @returns A Promise that resolves when the item is duplicated.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async duplicateSceneItem(
    sceneName: string,
    sceneItemId: number,
    destinationSceneName?: string,
  ): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    this.validateNumber(sceneItemId, 'sceneItemId');
    if (destinationSceneName) {
      this.validateString(destinationSceneName, 'destinationSceneName');
    }
    await this.callObs('DuplicateSceneItem', {
      sceneName,
      sceneItemId,
      destinationSceneName: destinationSceneName || sceneName,
    });
  }

  // Scene Item Transform
  /**
   * Sets the transform of a scene item.
   * @param sceneName The name of the scene containing the item.
   * @param sceneItemId The ID of the scene item.
   * @param sceneItemTransform The new transform settings.
   * @returns A Promise that resolves when the transform is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSceneItemTransform(
    sceneName: string,
    sceneItemId: number,
    sceneItemTransform: SceneItemTransform,
  ): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    this.validateNumber(sceneItemId, 'sceneItemId');
    await this.callObs('SetSceneItemTransform', {
      sceneName,
      sceneItemId,
      sceneItemTransform,
    });
  }

  /**
   * Gets the transform of a scene item.
   * @param sceneName The name of the scene containing the item.
   * @param sceneItemId The ID of the scene item.
   * @returns A Promise that resolves with the scene item transform.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async getSceneItemTransform(
    sceneName: string,
    sceneItemId: number,
  ): Promise<{ sceneItemTransform: SceneItemTransform }> {
    this.validateString(sceneName, 'sceneName');
    this.validateNumber(sceneItemId, 'sceneItemId');
    return this.callObs('GetSceneItemTransform', { sceneName, sceneItemId });
  }

  // Filters
  /**
   * Creates a new filter for a source.
   * @param sourceName The name of the source to add the filter to.
   * @param filterName The name of the new filter.
   * @param filterKind The kind of filter (e.g., 'color_correction_filter').
   * @param filterSettings Optional settings for the filter.
   * @returns A Promise that resolves when the filter is created.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async createSourceFilter(
    sourceName: string,
    filterName: string,
    filterKind: string,
    filterSettings?: InputSettings,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    this.validateString(filterKind, 'filterKind');
    await this.callObs('CreateSourceFilter', {
      sourceName,
      filterName,
      filterKind,
      filterSettings: filterSettings || {},
    });
  }

  /**
   * Removes a filter from a source.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter to remove.
   * @returns A Promise that resolves when the filter is removed.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async removeSourceFilter(sourceName: string, filterName: string): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    await this.callObs('RemoveSourceFilter', { sourceName, filterName });
  }

  /**
   * Sets the enabled state of a source filter.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter.
   * @param filterEnabled The new enabled state.
   * @returns A Promise that resolves when the state is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSourceFilterEnabled(
    sourceName: string,
    filterName: string,
    filterEnabled: boolean,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    this.validateBoolean(filterEnabled, 'filterEnabled');
    await this.callObs('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
  }

  /**
   * Sets the settings for a source filter.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter.
   * @param filterSettings The settings to apply.
   * @param overlay Whether to overlay the settings.
   * @returns A Promise that resolves when the settings are applied.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSourceFilterSettings(
    sourceName: string,
    filterName: string,
    filterSettings: InputSettings,
    overlay: boolean = true,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    await this.callObs('SetSourceFilterSettings', {
      sourceName,
      filterName,
      filterSettings,
      overlay,
    });
  }

  // Advanced Filter Modification

  /**
   * Sets the index of a source filter for reordering.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter.
   * @param filterIndex The new index of the filter.
   * @returns A Promise that resolves when the index is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSourceFilterIndex(
    sourceName: string,
    filterName: string,
    filterIndex: number,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    this.validateNumber(filterIndex, 'filterIndex');
    await this.callObs('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
  }

  /**
   * Renames a source filter.
   * @param sourceName The name of the source.
   * @param filterName The current name of the filter.
   * @param newFilterName The new name for the filter.
   * @returns A Promise that resolves when the filter is renamed.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSourceFilterName(
    sourceName: string,
    filterName: string,
    newFilterName: string,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    this.validateString(newFilterName, 'newFilterName');
    await this.callObs('SetSourceFilterName', { sourceName, filterName, newFilterName });
  }

  /**
   * Duplicates a source filter.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter to duplicate.
   * @param newFilterName The name for the duplicated filter.
   * @returns A Promise that resolves when the filter is duplicated.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async duplicateSourceFilter(
    sourceName: string,
    filterName: string,
    newFilterName: string,
  ): Promise<void> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    this.validateString(newFilterName, 'newFilterName');
    await this.callObs('DuplicateSourceFilter', { sourceName, filterName, newFilterName });
  }

  /**
   * Gets the volume of an input.
   * @param inputName The name of the input.
   * @returns A Promise that resolves with the input volume.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async getInputVolume(inputName: string): Promise<InputVolume> {
    this.validateString(inputName, 'inputName');
    return this.callObs('GetInputVolume', { inputName });
  }

  /**
   * Sets the volume of an input.
   * @param inputName The name of the input.
   * @param inputVolumeMul Optional volume multiplier.
   * @param inputVolumeDb Optional volume in dB.
   * @returns A Promise that resolves when the volume is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setInputVolume(
    inputName: string,
    inputVolumeMul?: number,
    inputVolumeDb?: number,
  ): Promise<void> {
    this.validateString(inputName, 'inputName');
    const params: {
      inputName: string;
      inputVolumeMul?: number;
      inputVolumeDb?: number;
    } = { inputName };
    if (inputVolumeMul !== undefined) params.inputVolumeMul = inputVolumeMul;
    if (inputVolumeDb !== undefined) params.inputVolumeDb = inputVolumeDb;
    await this.callObs('SetInputVolume', params);
  }

  /**
   * Sets the mute state of an input.
   * @param inputName The name of the input.
   * @param inputMuted The new mute state.
   * @returns A Promise that resolves when the mute state is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setInputMute(inputName: string, inputMuted: boolean): Promise<void> {
    this.validateString(inputName, 'inputName');
    this.validateBoolean(inputMuted, 'inputMuted');
    await this.callObs('SetInputMute', { inputName, inputMuted });
  }

  /**
   * Gets the current virtual camera status.
   * @returns A Promise that resolves with the virtual camera status.
   * @throws {ObsError} If the API call fails.
   */
  async getVirtualCamStatus(): Promise<VirtualCamStatus> {
    return this.callObs('GetVirtualCamStatus');
  }

  /**
   * Starts the virtual camera.
   * @returns A Promise that resolves when the virtual camera starts.
   * @throws {ObsError} If the API call fails.
   */
  async startVirtualCam(): Promise<void> {
    await this.callObs('StartVirtualCam');
  }

  /**
   * Stops the virtual camera.
   * @returns A Promise that resolves when the virtual camera stops.
   * @throws {ObsError} If the API call fails.
   */
  async stopVirtualCam(): Promise<void> {
    await this.callObs('StopVirtualCam');
  }

  /**
   * Toggles Studio Mode.
   * @returns A Promise that resolves when Studio Mode is toggled.
   * @throws {ObsError} If the API call fails.
   */
  async toggleStudioMode(): Promise<void> {
    try {
      const studioMode = await this.getStudioModeEnabled();
      await this.callObs('SetStudioModeEnabled', {
        studioModeEnabled: !studioMode.studioModeEnabled,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to toggle Studio Mode: ${error.message}`);
      }
      throw new ObsError('Failed to toggle Studio Mode: Unknown error');
    }
  }

  /**
   * Gets the current Studio Mode status.
   * @returns A Promise that resolves with the Studio Mode status.
   * @throws {ObsError} If the API call fails.
   */
  async getStudioModeEnabled(): Promise<StudioModeStatus> {
    return this.callObs('GetStudioModeEnabled');
  }

  /**
   * Opens the input filters dialog for a specific input.
   * @param inputName The name of the input.
   * @returns A Promise that resolves when the dialog is opened.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async openInputFiltersDialog(inputName: string): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('OpenInputFiltersDialog', { inputName });
  }

  /**
   * Opens the input properties dialog for a specific input.
   * @param inputName The name of the input.
   * @returns A Promise that resolves when the dialog is opened.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async openInputPropertiesDialog(inputName: string): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('OpenInputPropertiesDialog', { inputName });
  }

  /**
   * Opens the input interact dialog for a specific input.
   * @param inputName The name of the input.
   * @returns A Promise that resolves when the dialog is opened.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async openInputInteractDialog(inputName: string): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('OpenInputInteractDialog', { inputName });
  }

  /**
   * Gets the status of a specific output.
   * @param outputName The name of the output.
   * @returns A Promise that resolves with the output status.
   * @throws {ObsError} If the outputName is invalid or the API call fails.
   */
  async getOutputStatus(outputName: string): Promise<OutputStatus> {
    this.validateString(outputName, 'outputName');
    return this.callObs('GetOutputStatus', { outputName });
  }

  /**
   * Gets the streamer's username. This is a placeholder and may need custom implementation.
   * @returns A Promise that resolves with the streamer's username or null.
   * @throws {ObsError} If the API call fails.
   */
  async getStreamerUsername(): Promise<string | null> {
    try {
      // This is a placeholder - you may need to implement this based on your specific requirements
      // It could be from OBS profile info, stream service settings, etc.
      const profile = await this.callObs('GetProfileList');
      return profile.currentProfileName || null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to get streamer username: ${error.message}`);
      }
      throw new ObsError('Failed to get streamer username: Unknown error');
    }
  }

  /**
   * Gets a screenshot of a specific source.
   * @param sourceName The name of the source to screenshot.
   * @param imageFormat The image format ('png' or 'jpg').
   * @param imageWidth Optional width of the screenshot.
   * @param imageHeight Optional height of the screenshot.
   * @param imageCompressionQuality Optional compression quality for JPG (0-100).
   * @returns A Promise that resolves with the base64 encoded image data.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async getSourceScreenshot(
    sourceName: string,
    imageFormat: 'png' | 'jpg' = 'png',
    imageWidth?: number,
    imageHeight?: number,
    imageCompressionQuality?: number,
  ): Promise<string> {
    this.validateString(sourceName, 'sourceName');
    const params: {
      sourceName: string;
      imageFormat: 'png' | 'jpg';
      imageWidth?: number;
      imageHeight?: number;
      imageCompressionQuality?: number;
    } = {
      sourceName,
      imageFormat,
    };

    if (imageWidth) params.imageWidth = imageWidth;
    if (imageHeight) params.imageHeight = imageHeight;
    if (imageCompressionQuality) params.imageCompressionQuality = imageCompressionQuality;

    const response = await this.callObs<{ imageData: string }>('GetSourceScreenshot', params);
    return response.imageData;
  }

  /**
   * Gets a screenshot of the current program scene.
   * @param imageFormat The image format ('png' or 'jpg').
   * @param imageWidth Optional width of the screenshot.
   * @param imageHeight Optional height of the screenshot.
   * @param imageCompressionQuality Optional compression quality for JPG (0-100).
   * @returns A Promise that resolves with the base64 encoded image data.
   * @throws {ObsError} If the API call fails.
   */
  async getCurrentSceneScreenshot(
    imageFormat: 'png' | 'jpg' = 'png',
    imageWidth?: number,
    imageHeight?: number,
    imageCompressionQuality?: number,
  ): Promise<string> {
    try {
      const currentScene = await this.getCurrentProgramScene();
      return this.getSourceScreenshot(
        currentScene.sceneName,
        imageFormat,
        imageWidth,
        imageHeight,
        imageCompressionQuality,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to get current scene screenshot: ${error.message}`);
      }
      throw new ObsError('Failed to get current scene screenshot: Unknown error');
    }
  }

  /**
   * Starts the replay buffer.
   * @returns A Promise that resolves when the replay buffer starts.
   * @throws {ObsError} If the API call fails.
   */
  async startReplayBuffer(): Promise<void> {
    await this.callObs('StartReplayBuffer');
  }

  /**
   * Saves the replay buffer.
   * @returns A Promise that resolves when the replay buffer is saved.
   * @throws {ObsError} If the API call fails.
   */
  async saveReplayBuffer(): Promise<void> {
    await this.callObs('SaveReplayBuffer');
  }

  /**
   * Stops the replay buffer.
   * @returns A Promise that resolves when the replay buffer stops.
   * @throws {ObsError} If the API call fails.
   */
  async stopReplayBuffer(): Promise<void> {
    await this.callObs('StopReplayBuffer');
  }

  /**
   * Gets the current replay buffer status.
   * @returns A Promise that resolves with the replay buffer status.
   * @throws {ObsError} If the API call fails.
   */
  async getReplayBufferStatus(): Promise<ReplayBufferStatus> {
    return this.callObs('GetReplayBufferStatus');
  }

  /**
   * Triggers a Studio Mode transition.
   * @returns A Promise that resolves when the transition is triggered.
   * @throws {ObsError} If the API call fails.
   */
  async triggerStudioModeTransition(): Promise<void> {
    await this.callObs('TriggerStudioModeTransition');
  }

  /**
   * Sets the enabled state of Studio Mode.
   * @param enabled The new enabled state.
   * @returns A Promise that resolves when the state is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setStudioModeEnabled(enabled: boolean): Promise<void> {
    this.validateBoolean(enabled, 'enabled');
    await this.callObs('SetStudioModeEnabled', { studioModeEnabled: enabled });
  }

  /**
   * Sets the audio monitoring type for an input.
   * @param inputName The name of the input.
   * @param monitorType The new monitoring type.
   * @returns A Promise that resolves when the type is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setInputAudioMonitorType(
    inputName: string,
    monitorType:
      | 'OBS_MONITORING_TYPE_NONE'
      | 'OBS_MONITORING_TYPE_MONITOR_ONLY'
      | 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT',
  ): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('SetInputAudioMonitorType', { inputName, monitorType });
  }

  /**
   * Sets the blend mode of a scene item (OBS 29+).
   * @param sceneName The name of the scene containing the item.
   * @param sceneItemId The ID of the scene item.
   * @param blendMode The new blend mode.
   * @returns A Promise that resolves when the blend mode is set.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSceneItemBlendMode(
    sceneName: string,
    sceneItemId: number,
    blendMode: string,
  ): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    this.validateNumber(sceneItemId, 'sceneItemId');
    this.validateString(blendMode, 'blendMode');
    await this.callObs('SetSceneItemBlendMode', {
      sceneName,
      sceneItemId,
      sceneItemBlendMode: blendMode,
    });
  }

  /**
   * Refreshes a browser source.
   * @param inputName The name of the browser source input.
   * @returns A Promise that resolves when the source is refreshed.
   * @throws {ObsError} If the inputName is invalid or the API call fails.
   */
  async refreshBrowserSource(inputName: string): Promise<void> {
    this.validateString(inputName, 'inputName');
    await this.callObs('PressInputPropertiesButton', { inputName, propertyName: 'refresh' });
  }

  /**
   * Triggers a hotkey by its name.
   * @param hotkeyName The name of the hotkey to trigger.
   * @returns A Promise that resolves when the hotkey is triggered.
   * @throws {ObsError} If the hotkeyName is invalid or the API call fails.
   */
  async triggerHotkeyByName(hotkeyName: string): Promise<void> {
    this.validateString(hotkeyName, 'hotkeyName');
    await this.callObs('TriggerHotkeyByName', { hotkeyName });
  }

  /**
   * Triggers a hotkey by a key sequence.
   * @param keyId The ID of the key (e.g., 'OBS_KEY_A').
   * @param keyModifiers An object indicating pressed modifier keys.
   * @returns A Promise that resolves when the hotkey is triggered.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async triggerHotkeyByKeySequence(
    keyId: string,
    keyModifiers: { shift: boolean; control: boolean; alt: boolean; command: boolean },
  ): Promise<void> {
    this.validateString(keyId, 'keyId');
    await this.callObs('TriggerHotkeyByKeySequence', { keyId, keyModifiers });
  }

  /**
   * Gets a list of all hotkeys.
   * @returns A Promise that resolves with an object containing an array of hotkeys.
   * @throws {ObsError} If the API call fails.
   */
  async getHotkeyList(): Promise<{ hotkeys: Hotkey[] }> {
    return this.callObs('GetHotkeyList');
  }

  /**
   * Gets OBS statistics.
   * @returns A Promise that resolves with the OBS statistics.
   * @throws {ObsError} If the API call fails.
   */
  async getStats(): Promise<Stats> {
    return this.callObs('GetStats');
  }

  /**
   * Gets a list of all log files.
   * @returns A Promise that resolves with an object containing an array of log files.
   * @throws {ObsError} If the API call fails.
   */
  async getLogFileList(): Promise<{ logFiles: Log[] }> {
    return this.callObs('GetLogFileList');
  }

  /**
   * Uploads the current log file.
   * @returns A Promise that resolves when the log is uploaded.
   * @throws {ObsError} If the API call fails.
   */
  async uploadLog(): Promise<void> {
    await this.callObs('UploadLog');
  }

  /**
   * Gets the settings for a source filter.
   * @param sourceName The name of the source.
   * @param filterName The name of the filter.
   * @returns A Promise that resolves with the filter settings.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async getSourceFilterSettings(sourceName: string, filterName: string): Promise<Filter> {
    this.validateString(sourceName, 'sourceName');
    this.validateString(filterName, 'filterName');
    return this.callObs('GetSourceFilterSettings', { sourceName, filterName });
  }

  /**
   * Gets the default settings for a source filter kind.
   * @param filterKind The kind of filter.
   * @returns A Promise that resolves with the default filter settings.
   * @throws {ObsError} If the filterKind is invalid or the API call fails.
   */
  async getSourceFilterDefaultSettings(
    filterKind: string,
  ): Promise<{ filterSettings: { [key: string]: any } }> {
    this.validateString(filterKind, 'filterKind');
    return this.callObs('GetSourceFilterDefaultSettings', { filterKind });
  }

  /**
   * Sets the name of a scene.
   * @param sceneName The current name of the scene.
   * @param newSceneName The new name for the scene.
   * @returns A Promise that resolves when the scene is renamed.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async setSceneName(sceneName: string, newSceneName: string): Promise<void> {
    this.validateString(sceneName, 'sceneName');
    this.validateString(newSceneName, 'newSceneName');
    await this.callObs('SetSceneName', { sceneName, newSceneName });
  }

  /**
   * Gets the current profile.
   * @returns A Promise that resolves with the current profile.
   * @throws {ObsError} If the API call fails.
   */
  async getCurrentProfile(): Promise<Profile> {
    return this.callObs('GetCurrentProfile');
  }

  /**
   * Sets the current profile.
   * @param profileName The name of the profile to set.
   * @returns A Promise that resolves when the profile is set.
   * @throws {ObsError} If the profileName is invalid or the API call fails.
   */
  async setCurrentProfile(profileName: string): Promise<void> {
    this.validateString(profileName, 'profileName');
    await this.callObs('SetCurrentProfile', { profileName });
  }

  /**
   * Gets the current scene collection.
   * @returns A Promise that resolves with the current scene collection.
   * @throws {ObsError} If the API call fails.
   */
  async getCurrentSceneCollection(): Promise<SceneCollection> {
    return this.callObs('GetCurrentSceneCollection');
  }

  /**
   * Sets the current scene collection.
   * @param sceneCollectionName The name of the scene collection to set.
   * @returns A Promise that resolves when the scene collection is set.
   * @throws {ObsError} If the sceneCollectionName is invalid or the API call fails.
   */
  async setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
    this.validateString(sceneCollectionName, 'sceneCollectionName');
    await this.callObs('SetCurrentSceneCollection', { sceneCollectionName });
  }

  /**
   * Adds a browser source to a scene.
   * @param sceneName The name of the scene to add the source to.
   * @param url The URL for the browser source.
   * @param sourceName The name of the new browser source.
   * @param dimensions Optional width and height for the browser source.
   * @returns A Promise that resolves when the source is added.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    dimensions: { width: number; height: number } = { width: 1920, height: 1080 },
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
      true,
    );
  }

  /**
   * Adds an image source to a scene.
   * @param sceneName The name of the scene to add the source to.
   * @param imageUrl The URL of the image.
   * @param sourceName The name of the new image source.
   * @returns A Promise that resolves when the source is added.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async addImageSource(sceneName: string, imageUrl: string, sourceName: string): Promise<void> {
    await this.createInput(
      sourceName,
      'image_source',
      {
        file: imageUrl,
        url: imageUrl,
      },
      sceneName,
      true,
    );
  }

  /**
   * Adds a media source to a scene.
   * @param sceneName The name of the scene to add the source to.
   * @param mediaUrl The URL of the media file.
   * @param sourceName The name of the new media source.
   * @returns A Promise that resolves when the source is added.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async addMediaSource(sceneName: string, mediaUrl: string, sourceName: string): Promise<void> {
    await this.createInput(
      sourceName,
      'ffmpeg_source',
      {
        is_local_file: false,
        input: mediaUrl,
        looping: true,
      },
      sceneName,
      true,
    );
  }

  /**
   * Adds an SVG as a browser source to a scene.
   * @param sceneName The name of the scene to add the source to.
   * @param svgContent The SVG content as a string.
   * @param sourceName The name of the new SVG browser source.
   * @returns A Promise that resolves when the source is added.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async addSvgAsBrowserSource(
    sceneName: string,
    svgContent: string,
    sourceName: string,
  ): Promise<void> {
    try {
      const dataUri = `data:image/svg+xml;base64,${btoa(svgContent)}`;
      await this.addBrowserSource(sceneName, dataUri, sourceName);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to add SVG as browser source: ${error.message}`);
      }
      throw new ObsError('Failed to add SVG as browser source: Unknown error');
    }
  }

  /**
   * Adds an emoji as a browser source to a scene.
   * @param sceneName The name of the scene to add the source to.
   * @param emoji The emoji character.
   * @param sourceName The name of the new emoji browser source.
   * @returns A Promise that resolves when the source is added.
   * @throws {ObsError} If the parameters are invalid or the API call fails.
   */
  async addEmojiAsBrowserSource(
    sceneName: string,
    emoji: string,
    sourceName: string,
  ): Promise<void> {
    try {
      const htmlContent = `
    <style>
      body { margin: 0; padding: 0; font-size: 200px; text-align: center; line-height: 1; }
    </style>
    <body>${emoji}</body>
  `;
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      await this.addBrowserSource(sceneName, dataUri, sourceName, { width: 250, height: 250 });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ObsError(`Failed to add emoji as browser source: ${error.message}`);
      }
      throw new ObsError('Failed to add emoji as browser source: Unknown error');
    }
  }

  // TODO: Define specific types for event handlers
  subscribeToEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void {
    for (const [event, handler] of Object.entries(eventHandlers)) {
      if (typeof handler === 'function') {
        this.obs.on(event, handler);
      }
    }
  }

  unsubscribeFromEvents(eventHandlers: Partial<Record<string, (...args: any[]) => void>>): void {
    for (const [event, handler] of Object.entries(eventHandlers)) {
      if (typeof handler === 'function') {
        this.obs.off(event, handler);
      }
    }
  }

  /**
   * Gets a list of all inputs (sources) in OBS.
   * @returns A Promise that resolves with an object containing an array of inputs.
   * @throws {ObsError} If the API call fails.
   */
  async getInputs(): Promise<{ inputs: Input[] }> {
    return this.callObs('GetInputList');
  }
}
