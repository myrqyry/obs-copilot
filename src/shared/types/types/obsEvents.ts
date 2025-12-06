/**
 * Typed interfaces for common OBS WebSocket event payloads used in the app.
 * Keep these minimal and expand as handlers need more fields.
 */
export interface CurrentSceneChangedEvent {
  sceneName: string;
  sceneIndex?: number;
  sceneUuid?: string;
}

export interface InputMuteStateChangedEvent {
  inputName: string;
  inputMuted: boolean;
  inputId?: string;
}

export interface InputVolumeChangedEvent {
  inputName: string;
  inputVolumeDb: number;
  inputVolumeMul?: number;
  inputId?: string;
}

export interface ScenesChangedEvent {
  scenes: Array<{
    name: string;
    sceneIndex?: number;
    sceneUuid?: string;
  }>;
}

export interface StreamOutputStateEvent {
  outputName?: string;
  outputActive: boolean;
  outputState?: string;
}

export interface InputVolumeMetersEvent {
  inputs: Array<{
    inputName: string;
    inputVolumeDb: number;
    inputVolumeMul?: number;
  }>;
}

export type ObsEventPayload =
  | CurrentSceneChangedEvent
  | InputMuteStateChangedEvent
  | InputVolumeChangedEvent
  | ScenesChangedEvent
  | StreamOutputStateEvent
  | InputVolumeMetersEvent;

export type ObsEventName =
  | 'CurrentSceneChanged'
  | 'InputMuteStateChanged'
  | 'InputVolumeChanged'
  | 'ScenesChanged'
  | 'StreamOutputStateChanged'
  | 'InputVolumeMeters';
