export type TmiTags = Record<string, string | undefined> & { emotes?: Record<string, string[]>; badges?: Record<string, string> };

export interface ChatUser {
  id?: string;
  name: string;
  displayName: string;
  color?: string;
  badges?: Record<string, string>;
  // 7TV Paint/Cosmetics
  paintStyle?: React.CSSProperties | null;
}

export interface ChatMessage {
  id: string;
  user: ChatUser;
  raw: string;
  html: string;
  timestamp: number;
  tags?: TmiTags; // Keep this generic enough for other providers
  isAction?: boolean; // For /me messages
  isHighlight?: boolean; // For channel point redemptions, etc.
}

export type ChatEvent = 'message' | 'connected' | 'disconnected' | 'error' | 'clearchat' | 'timeout';

export interface ChatProvider extends EventTarget {
  readonly platform: string;
  connect(channel: string): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: string): Promise<void>;
  getHistory(): ChatMessage[];
}