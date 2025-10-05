import { ChatProvider, ChatMessage, ChatEvent } from './types';

export class ChatEngine extends EventTarget {
  private provider: ChatProvider | null = null;

  constructor() {
    super();
  }

  public setProvider(provider: ChatProvider) {
    if (this.provider) {
      // Clean up old provider listeners if any
      this.provider.removeEventListener('message', this.handleProviderMessage);
      this.provider.removeEventListener('connected', this.handleProviderConnected);
      this.provider.removeEventListener('disconnected', this.handleProviderDisconnected);
    }

    this.provider = provider;

    // Forward events from the new provider
    this.provider.addEventListener('message', this.handleProviderMessage);
    this.provider.addEventListener('connected', this.handleProviderConnected);
    this.provider.addEventListener('disconnected', this.handleProviderDisconnected);
    // You can add more event forwarding here for 'error', 'clearchat', etc.
  }

  public async connect(channel: string) {
    if (!this.provider) {
      throw new Error('No chat provider set.');
    }
    await this.provider.connect(channel);
  }

  public async disconnect() {
    if (!this.provider) {
      return;
    }
    await this.provider.disconnect();
  }

  public async sendMessage(message: string) {
    if (!this.provider) {
      throw new Error('No chat provider set.');
    }
    await this.provider.sendMessage(message);
  }

  public getHistory(): ChatMessage[] {
    if (!this.provider) {
      return [];
    }
    return this.provider.getHistory();
  }

  private handleProviderMessage = (event: Event) => {
    const customEvent = event as CustomEvent<ChatMessage>;
    this.dispatchEvent(new CustomEvent('message', { detail: customEvent.detail }));
  };

  private handleProviderConnected = () => {
    this.dispatchEvent(new CustomEvent('connected'));
  };

  private handleProviderDisconnected = () => {
    this.dispatchEvent(new CustomEvent('disconnected'));
  };

  public get currentProvider(): ChatProvider | null {
    return this.provider;
  }
}

// Singleton instance
export const chatEngine = new ChatEngine();