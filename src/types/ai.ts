import { GeminiGenerateContentResponse } from './gemini';

export interface AIService {
  generateContent(prompt: string, retries?: number): Promise<GeminiGenerateContentResponse>;
  generateImage(prompt: string): Promise<string>;
}
