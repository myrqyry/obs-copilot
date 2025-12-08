import { GeminiGenerateContentResponse } from './gemini';
import { LiveConnectParameters } from '@google/genai';

export interface AIService {
  // Utility methods for configuration
  isConfigured(): boolean;
  getApiKey(): string | null;
  setApiKey(key: string): void;
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
      // Optional inline audio for transcription / multimodal prompts
      audioInline?: { data: string; mimeType: string } | null;
      // Optional file URI pointing to an uploaded audio file (Files API)
      audioFileUri?: string | null;
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
      referenceImages?: Array<{ data: string; mimeType: string }>;
      imageSize?: string;
      searchGrounding?: boolean;
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
      referenceImages?: Array<{ data: string; mimeType: string }>;
      image?: { data: string; mimeType: string };
      lastFrame?: { data: string; mimeType: string };
      video?: { uri: string };
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

export type GeneratedImage = {
  /**
The base64-encoded image data.
   */
  base64: string;
  /**
The media type of the image.
   */
  mediaType: `image/${string}`;
  /**
The Uint8Array representation of the image data.
   */
  uint8Array: Uint8Array;
};
