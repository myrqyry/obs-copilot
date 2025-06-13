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
  type?: "source-prompt" | "choice-prompt";
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
  CONNECTIONS = "Connections",
  OBS_STUDIO = "OBS Studio",
  SETTINGS = "Settings",
  GEMINI = "Gemini"
}

// Catppuccin Theming
export const catppuccinMochaColors = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
} as const;

export type CatppuccinColorName = keyof typeof catppuccinMochaColors;

export type CatppuccinAccentColorName =
  | 'sky' | 'mauve' | 'pink' | 'green' | 'teal' | 'peach' | 'yellow' | 'red' | 'flamingo' | 'rosewater' | 'sapphire' | 'blue' | 'lavender';

export const catppuccinAccentColorsHexMap: Record<CatppuccinAccentColorName, string> = {
  sky: catppuccinMochaColors.sky,
  mauve: catppuccinMochaColors.mauve,
  pink: catppuccinMochaColors.pink,
  green: catppuccinMochaColors.green,
  teal: catppuccinMochaColors.teal,
  peach: catppuccinMochaColors.peach,
  yellow: catppuccinMochaColors.yellow,
  red: catppuccinMochaColors.red,
  flamingo: catppuccinMochaColors.flamingo,
  rosewater: catppuccinMochaColors.rosewater,
  sapphire: catppuccinMochaColors.sapphire,
  blue: catppuccinMochaColors.blue,
  lavender: catppuccinMochaColors.lavender,
};

// For secondary accent, we can reuse the same set of colors
export type CatppuccinSecondaryAccentColorName = CatppuccinAccentColorName;
export const catppuccinSecondaryAccentColorsHexMap: Record<CatppuccinSecondaryAccentColorName, string> = catppuccinAccentColorsHexMap;

// For chat bubbles, we can also reuse the same accent colors
export type CatppuccinChatBubbleColorName = CatppuccinAccentColorName;
export const catppuccinChatBubbleColorsHexMap: Record<CatppuccinChatBubbleColorName, string> = catppuccinAccentColorsHexMap;
