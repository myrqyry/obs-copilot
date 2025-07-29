// OBS WebSocket related types (simplified, refer to obs-websocket-js for full types)
export interface OBSScene {
  sceneName: string;
  sceneIndex: number;
}

export interface OBSSource {
  sourceName: string;
  typeName?: string;
  sceneItemId: number;
  sceneItemEnabled: boolean;
  inputKind?: string;
}

export interface OBSData {
  scenes: OBSScene[];
  currentProgramScene: string | null;
  sources: OBSSource[];
  streamStatus: OBSStreamStatus | null;
  recordStatus: OBSRecordStatus | null;
  videoSettings: OBSVideoSettings | null;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputReconnecting: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputCongestion: number;
  outputBytes: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
}

export interface OBSRecordStatus {
  outputActive: boolean;
  outputPaused: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

export interface OBSVideoSettings {
  baseWidth: number;
  baseHeight: number;
  outputWidth: number;
  outputHeight: number;
  fpsNumerator: number;
  fpsDenominator: number;
}

// Gemini related types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  sources?: GroundingChunk[];
  type?: 'source-prompt' | 'choice-prompt';
  sourcePrompt?: string;
  showSuggestions?: boolean;
  choices?: string[];
  choiceType?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  // Other types of grounding chunks can be added here
}

export enum AppTab {
  CONNECTIONS = 'Connections',
  OBS_STUDIO = 'OBS Studio',
  SETTINGS = 'Settings',
  GEMINI = 'Gemini',
  STREAMING_ASSETS = 'Streaming Assets',
  CREATE = 'Create',
  ADVANCED = 'Advanced',
}

export * from './types/themes';
