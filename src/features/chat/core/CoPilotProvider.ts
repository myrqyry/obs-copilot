import { ChatProvider, ChatMessage, ChatEvent } from './types';
import { geminiService } from '@/services/geminiService';

export class CoPilotProvider extends EventTarget implements ChatProvider {
  private originalProvider: ChatProvider;

  constructor(originalProvider: ChatProvider) {
    super();
    this.originalProvider = originalProvider;
    this.originalProvider.addEventListener('message', this.handleOriginalProviderMessage.bind(this));
  }

  private async handleOriginalProviderMessage(event: Event) {
    const customEvent = event as CustomEvent<ChatMessage>;
    const message = customEvent.detail;

    // Pass the original message through
    this.dispatchEvent(new CustomEvent('message', { detail: message }));

    if (message.role === 'user' && message.text.startsWith('!ask')) {
      const prompt = message.text.substring(5); // Remove the '!ask ' part
      try {
        const response = await geminiService.generateText({ prompt });
        const aiMessage: ChatMessage = {
          id: `copilot-${Date.now()}`,
          role: 'model',
          text: response.text,
          timestamp: new Date(),
        };
        this.dispatchEvent(new CustomEvent('message', { detail: aiMessage }));
      } catch (error) {
        console.error('Error calling Gemini API:', error);
      }
    }
  }

  public connect(channel: string): Promise<void> {
    return this.originalProvider.connect(channel);
  }

  public disconnect(): Promise<void> {
    return this.originalProvider.disconnect();
  }

  public sendMessage(message: string): Promise<void> {
    return this.originalProvider.sendMessage(message);
  }

  public getHistory(): ChatMessage[] {
    return this.originalProvider.getHistory();
  }
}
