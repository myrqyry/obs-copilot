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

export type ControlKind = 'slider' | 'knob';

export interface ObsControlConfig {
  kind: ControlKind;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  sourceName?: string;
  property?: string; // OBS property to control (e.g., 'volume_db', 'gain')
  sendMethod?: string; // OBS method to call (e.g., 'SetInputVolume', 'SetInputSettings')
  debounceMs?: number; // Debounce time for onChangeEnd calls
  throttleMs?: number; // Throttle time for onChange calls
}

export interface ObsWidgetConfig {
  id: string;
  type: ObsActionType;
  label: string;
  icon?: string;
  // Action-specific settings
  sceneName?: string;
  sourceName?: string;
  // Control-specific settings
  control?: ObsControlConfig;
}

// Any other OBS related interfaces needed globally