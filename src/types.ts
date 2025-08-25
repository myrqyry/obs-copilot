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

// AI SDK 5 Data Parts types for streaming typed data
export interface DataPart {
  type: string;
  value: unknown;
  id?: string;
  timestamp?: Date;
}

export interface StatusDataPart extends DataPart {
  type: 'status';
  value: {
    message: string;
    progress?: number;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    details?: string;
  };
}

export interface ObsActionDataPart extends DataPart {
  type: 'obs-action';
  value: {
    action: string;
    target?: string;
    status: 'pending' | 'executing' | 'completed' | 'error';
    result?: {
      success: boolean;
      message: string;
      error?: string;
    };
  };
}

export interface StreamerBotActionDataPart extends DataPart {
  type: 'streamerbot-action';
  value: {
    action: string;
    args?: Record<string, unknown>;
    status: 'pending' | 'executing' | 'completed' | 'error';
    result?: {
      success: boolean;
      message?: string;
      error?: string;
    };
  };
}

export interface MediaDataPart extends DataPart {
  type: 'media';
  value: {
    url?: string;
    contentType: string;
    alt?: string;
    caption?: string;
  };
}

// Union type for all supported data parts
export type SupportedDataPart = StatusDataPart | ObsActionDataPart | StreamerBotActionDataPart | MediaDataPart;

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
  // AI SDK 5 Data Parts support
  dataParts?: SupportedDataPart[];
  isStreaming?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  // Other types of grounding chunks can be added here
}

// Streaming message handlers for AI SDK 5 compatibility
export interface StreamingHandlers {
  onData?: (dataPart: SupportedDataPart) => void;
  onText?: (textDelta: string) => void;
  onComplete?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
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
