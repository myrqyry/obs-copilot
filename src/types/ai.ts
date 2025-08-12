import { GeminiGenerateContentResponse } from './gemini';
import { LiveConnectParameters } from '@google/genai';

export interface AIService {
  generateContent(
    prompt: string, 
    options?: {
      model?: string;
      tools?: boolean;
      retries?: number;
    }
  ): Promise<GeminiGenerateContentResponse>;
  generateImage(prompt: string): Promise<string>;
  liveConnect(options: LiveConnectParameters): Promise<any>;
}
