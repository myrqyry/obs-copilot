export * from './ai';
export * from './api';
export * from './assetSearch';
export * from './audio';
export * from './automation';
export * from './chatBackground';
export * from './connections';
export * from './declarations.d';
export * from './dnd-kit.d';
export * from './gemini';
export * from './genai-augment.d';
export * from './giphy';
export * from './mkody-twitch-emoticons.d';
export * from './obs-websocket-js.d';
export * from './obs';
export * from './obsActions';
export * from './obsEvents';
export * from './overlay';
export * from './plugin';
export * from './plugins';
export * from './sevenTVCosmetics';
export * from './shims-genai.d';
export * from './shims-plugins.d';
export * from './streamerbot';
export * from './themes';
export * from './tmi.d';
export * from './ui';
export * from './universalWidget';

// Re-export commonly used types with aliases for convenience
export type {
  OBSScene as Scene,
  OBSSource as Source,
  OBSSourceType as SourceType,
} from './obs';

export type {
  GeminiMessage as AIMessage,
  GeminiResponse as AIResponse,
} from './gemini';
