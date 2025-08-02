import { ChatMessage } from './';
import { GeminiGenerateContentResponse } from './gemini';

export interface AIService {
  generateContent(prompt: string, history?: ChatMessage[]): Promise<GeminiGenerateContentResponse>;
  generateImage(prompt: string): Promise<string>;
}
