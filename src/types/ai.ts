import { GeminiGenerateContentResponse } from './gemini';
import { LiveConnectParameters } from '@google/genai';

export interface AIService {
  generateContent(
    prompt: string,
    options?: {
      model?: string;
      tools?: boolean;
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    }
  ): Promise<GeminiGenerateContentResponse>;
  generateEnhancedImage(
    prompt: string,
    options?: {
      model?: string;
      responseModalities?: string[];
      imageFormat?: string;
      imageQuality?: number;
      aspectRatio?: string;
      personGeneration?: string;
      safetySettings?: Array<{ category: string; threshold: string }>;
      imageInput?: string;
      imageInputMimeType?: string;
    }
  ): Promise<string>;
  generateImage(
    prompt: string,
    options?: {
      model?: string;
      size?: string;
    }
  ): Promise<string>;
  generateStructuredContent(
    prompt: string,
    schema: any,
    options?: {
      model?: string;
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<any>;
  generateWithLongContext(
    prompt: string,
    context: string,
    options?: {
      model?: string;
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<GeminiGenerateContentResponse>;
  liveConnect(options: LiveConnectParameters): Promise<any>;
}
