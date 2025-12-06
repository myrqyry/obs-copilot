// Minimal type definitions for @mkody/twitch-emoticons used by the app.
// This file intentionally provides a small, local shim so the rest of
// the codebase can use the library without needing to modify upstream
// types. Keep this minimal and update if the library surface changes.

declare module '@mkody/twitch-emoticons' {
  export type EmoteImage = { url: string; width?: number; height?: number; format?: string };

  export class EmoteFetcher {
    // populates internal caches for providers
    fetchBTTVEmotes(): Promise<void>;
    fetchFFZEmotes(): Promise<void>;
    fetchSevenTVEmotes(): Promise<void>;

    // optional maps exposed at runtime
    bttv?: Map<string, any> | Record<string, any>;
    ffz?: Map<string, any> | Record<string, any>;
    sevenTV?: Map<string, any> | Record<string, any>;
  }

  export interface EmoteParserOptions {
    template?: string;
  }

  export class EmoteParser {
    constructor(fetcher: EmoteFetcher, opts?: EmoteParserOptions);
    parse(text: string): string;
  }

  const _default: { EmoteFetcher: typeof EmoteFetcher; EmoteParser: typeof EmoteParser };
  export default _default;
}
declare module '@mkody/twitch-emoticons' {
  // Minimal ambient declarations to satisfy TypeScript in this repo.
  // The real package ships with types; this file is a small fallback
  // so we can use EmoteFetcher/EmoteParser without adding repo-wide type changes.
  export class EmoteFetcher {
    constructor(clientId?: string | null, clientSecret?: string | null, opts?: any);
    emotes: Map<string, any>;
    fetchTwitchEmotes(channelId?: number | null): Promise<void>;
    fetchBTTVEmotes(channelId?: number | null): Promise<void>;
    fetchFFZEmotes(channelId?: number | null): Promise<void>;
    fetchSevenTVEmotes(channelId?: number | null, format?: string): Promise<void>;
    toObject(): any;
    fromObject(obj: any): void;
  }

  export class EmoteParser {
    constructor(fetcher: EmoteFetcher, opts?: any);
    parse(text: string): string;
  }

  const TwitchEmoticons: {
    EmoteFetcher: typeof EmoteFetcher;
    EmoteParser: typeof EmoteParser;
  };

  export default TwitchEmoticons;
}
