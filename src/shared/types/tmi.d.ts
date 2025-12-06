declare module 'tmi.js' {
  // Minimal types for the parts we use in the project
  export type ChatUserstate = { [key: string]: unknown } & { 'user-id'?: string; username?: string; 'display-name'?: string; color?: string };

  export interface ClientOptions {
    options?: { debug?: boolean };
    identity?: { username?: string; password?: string };
    channels?: string[];
  }

  export class Client {
    constructor(opts?: ClientOptions);
    connect(): Promise<void>;
    on(event: 'message', listener: (channel: string, tags: ChatUserstate, message: string, self: boolean) => void): void;
    removeListener(event: 'message', listener: (channel: string, tags: ChatUserstate, message: string, self: boolean) => void): void;
    disconnect(): Promise<void>;
  }

  const tmi: { Client: typeof Client };
  export default tmi;
}
