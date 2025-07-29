import { OBSWebSocket } from 'obs-websocket-js';

declare module 'obs-websocket-js' {
  interface Scene {
    sceneIndex: number;
    sceneName: string;
  }

  interface SceneItem {
    inputKind: string;
    isGroup: boolean;
    sceneItemId: number;
    sceneItemIndex: number;
    sourceName: string;
    sourceType: string;
  }

  interface StreamStatus {
    outputActive: boolean;
    outputBytes: number;
    outputCongestion: number;
    outputDuration: number;
    outputReconnecting: boolean;
    outputSkippedFrames: number;
    outputTimecode: string;
    outputTotalFrames: number;
  }

  interface RecordStatus {
    outputActive: boolean;
    outputBytes: number;
    outputDuration: number;
    outputPaused: boolean;
    outputTimecode: string;
    outputTotalFrames: number;
  }

  interface VideoSettings {
    baseHeight: number;
    baseWidth: number;
    fpsDenominator: number;
    fpsNumerator: number;
    outputHeight: number;
    outputWidth: number;
  }

  interface InputSettings {
    [key: string]: any;
  }

  interface Filter {
    filterEnabled: boolean;
    filterIndex: number;
    filterKind: string;
    filterName: string;
    filterSettings: { [key: string]: any };
  }

  interface SceneItemTransform {
    positionX: number;
    positionY: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    alignment: number;
    boundsType: string;
    boundsAlignment: number;
    boundsWidth: number;
    boundsHeight: number;
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;
  }

  interface InputVolume {
    inputVolumeDb: number;
    inputVolumeMul: number;
  }

  interface VirtualCamStatus {
    outputActive: boolean;
  }

  interface StudioModeStatus {
    studioModeEnabled: boolean;
  }

  interface OutputStatus {
    outputActive: boolean;
    outputReconnecting: boolean;
    outputTimecode: string;
    outputDuration: number;
    outputCongestion: number;
    outputBytes: number;
    outputSkippedFrames: number;
    outputTotalFrames: number;
  }

  interface Profile {
    currentProfileName: string;
  }

  interface ReplayBufferStatus {
    outputActive: boolean;
  }

  interface Hotkey {
    hotkeyName: string;
  }

  interface Stats {
    cpuUsage: number;
    memoryUsage: number;
    availableDiskSpace: number;
    activeFps: number;
    averageFrameTime: number;
    renderSkippedFrames: number;
    renderTotalFrames: number;
    outputSkippedFrames: number;
    outputTotalFrames: number;
    webSocketSession: number;
  }

  interface Log {
    logFile: string;
  }

  interface SceneCollection {
    currentSceneCollectionName: string;
  }

  interface OBSWebSocket {
    call(requestType: 'GetSceneList'): Promise<{ scenes: Scene[] }>;
    call(requestType: 'GetCurrentProgramScene'): Promise<Scene>;
    call(
      requestType: 'GetSceneItemList',
      requestData: { sceneName: string },
    ): Promise<{ sceneItems: SceneItem[] }>;
    call(requestType: 'GetStreamStatus'): Promise<StreamStatus>;
    call(requestType: 'GetRecordStatus'): Promise<RecordStatus>;
    call(requestType: 'GetVideoSettings'): Promise<VideoSettings>;
    call(
      requestType: 'GetInputSettings',
      requestData: { inputName: string },
    ): Promise<{ inputSettings: InputSettings; inputKind: string }>;
    call(
      requestType: 'GetSourceFilterList',
      requestData: { sourceName: string },
    ): Promise<{ filters: Filter[] }>;
    call(
      requestType: 'GetSourceFilter',
      requestData: { sourceName: string; filterName: string },
    ): Promise<Filter>;
    call(
      requestType: 'GetSceneItemTransform',
      requestData: { sceneName: string; sceneItemId: number },
    ): Promise<{ sceneItemTransform: SceneItemTransform }>;
    call(requestType: 'GetInputVolume', requestData: { inputName: string }): Promise<InputVolume>;
    call(requestType: 'GetVirtualCamStatus'): Promise<VirtualCamStatus>;
    call(requestType: 'GetStudioModeEnabled'): Promise<StudioModeStatus>;
    call(
      requestType: 'GetOutputStatus',
      requestData: { outputName: string },
    ): Promise<OutputStatus>;
    call(requestType: 'GetProfileList'): Promise<Profile>;
    call(requestType: 'GetReplayBufferStatus'): Promise<ReplayBufferStatus>;
    call(requestType: 'GetHotkeyList'): Promise<{ hotkeys: Hotkey[] }>;
    call(requestType: 'GetStats'): Promise<Stats>;
    call(requestType: 'GetLogFileList'): Promise<{ logFiles: Log[] }>;
    call(requestType: 'GetCurrentSceneCollection'): Promise<SceneCollection>;
    call(requestType: string, requestData?: Record<string, any>): Promise<any>;
    on(event: string, listener: (...args: any[]) => void): void;
  }
}
