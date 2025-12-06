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
  sceneItemEnabled: boolean;
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

export type ObsActionName = 'toggle_mute' | 'switch_scene';
export type WidgetType = 'action' | 'control';
export type ControlKind = 'slider' | 'knob';

export interface ObsControlConfig {
  kind: ControlKind;
  min: number;
  max: number;
  step: number;
  unit: string;
  sourceName: string;
  property: string; // OBS property to control (e.g., 'volume_db', 'gain')
  sendMethod: string; // OBS method to call (e.g., 'SetInputVolume', 'SetInputSettings')
  debounceMs: number; // Debounce time for onChangeEnd calls
  throttleMs: number; // Throttle time for onChange calls
  // Phase 3 Advanced
  multiChannel?: boolean;
  preview?: boolean;
  animation?: { duration: number; easing: string };
  templates?: string[];
  addableFilters?: string[];
}

// Base interface with common properties for all widgets
interface BaseWidgetConfig {
  id: string;
  label: string;
  icon?: string;
  className?: string;
}

// Discriminated union for different action types
export type ActionConfig =
  | (BaseWidgetConfig & {
      type: 'action';
      action: 'toggle_mute';
      sourceName: string;
    })
  | (BaseWidgetConfig & {
      type: 'action';
      action: 'switch_scene';
      sceneName: string;
    });

// Config for control widgets
export interface ControlConfig extends BaseWidgetConfig {
  type: 'control';
  control: ObsControlConfig;
}

// The final discriminated union for all widget configurations
export type ObsWidgetConfig = ActionConfig | ControlConfig;

export interface OBSAudioSource extends OBSSource {
  channels?: number[];
  audioType?: 'input' | 'output';
}

export interface OBSFilter {
  name: string;
  type: string;
  params: Record<string, any>;
}

export interface OBSSceneItemTransform {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  crop: { left: number; right: number; top: number; bottom: number };
  bounds: { width: number; height: number };
}

export interface OBSTemplate {
  category: 'audio' | 'scene' | 'source';
  name: string;
  params: Record<string, any>;
  preview?: boolean;
}

// Any other OBS related interfaces needed globally

// --- Types for Enhanced WebSocket Connection Management ---

export interface OBSConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastHeartbeat: Date | null;
  connectionAttempts: number;
}

export interface OBSWebSocketConfig {
  url: string;
  password?: string;
  autoReconnect: boolean;
  reconnectInterval: number; // in milliseconds
  maxReconnectAttempts: number;
}

export interface OBSCommand {
  type: 'scene' | 'source' | 'filter' | 'recording' | 'streaming' | 'general';
  action: string; // Corresponds to an obs-websocket-js method name
  parameters: Record<string, any>;
  timeout?: number; // Optional timeout for this specific command
}