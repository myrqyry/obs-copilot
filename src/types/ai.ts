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
  generateImage(
    prompt: string,
    options?: {
      model?: string;
      numberOfImages?: number;
      outputMimeType?: string;
      aspectRatio?: string;
      personGeneration?: string;
      negativePrompt?: string;
      imageInput?: { data: string; mimeType: string };
    }
  ): Promise<string[]>;
  generateSpeech(
    prompt: string,
    options?: {
      model?: string;
      voiceConfig?: any;
      multiSpeakerVoiceConfig?: any;
    }
  ): Promise<string>;
  generateVideo(
    prompt: string,
    options?: {
      model?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      personGeneration?: string;
      numberOfVideos?: number;
    }
  ): Promise<string[]>;
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
