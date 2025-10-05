export interface EmoteProvider {
  name: string;
  priority: number;
  parseEmotes: (text: string, channelId?: string) => Promise<ParsedMessage>;
  loadChannelEmotes?: (channelId: string) => Promise<void>;
}

export interface EmoteData {
  id: string;
  name: string;
  url: string;
  provider: 'twitch' | 'bttv' | 'ffz' | '7tv';
  scale?: number;
  animated?: boolean;
}

export interface MentionData {
  userId: string;
  userName: string;
}

export interface LinkData {
  url: string;
  isInternal: boolean;
}

export interface ParsedMessage {
  segments: MessageSegment[];
  emotes: EmoteData[];
}

export interface MessageSegment {
  type: 'text' | 'emote' | 'mention' | 'link';
  content: string;
  data?: EmoteData | MentionData | LinkData;
}