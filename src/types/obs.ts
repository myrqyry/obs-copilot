export interface OBSScene {
  sceneIndex: number;
  sceneName: string;
}

export interface OBSSource {
  inputKind: string;
  isGroup: boolean;
  sceneItemId: number;
  sceneItemIndex: number;
  sourceName: string;
  sourceType: string;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputBytes: number;
  outputCongestion: number;
  outputDuration: number;
  outputReconnecting: boolean;
  outputSkippedFrames: number;
  outputTimecode: string;
  outputTotalFrames: number;
}

export interface OBSRecordStatus {
  outputActive: boolean;
  outputBytes: number;
  outputDuration: number;
  outputPaused: boolean;
  outputTimecode: string;
  outputTotalFrames: number;
}

export interface OBSVideoSettings {
  baseHeight: number;
  baseWidth: number;
  fpsDenominator: number;
  fpsNumerator: number;
  outputHeight: number;
  outputWidth: number;
}

export type ObsActionType = 'toggle_mute' | 'switch_scene';

export interface ObsWidgetConfig {
  id: string;
  type: ObsActionType;
  label: string;
  icon?: string;
  // Action-specific settings
  sceneName?: string;
  sourceName?: string;
}

// Any other OBS related interfaces needed globally