import { GenerateContentResponse } from '@google/genai';

export interface GeminiGenerateContentResponse {
  text: string;
  candidates?: GenerateContentResponse['candidates'];
  usageMetadata?: GenerateContentResponse['usageMetadata'];
  toolCalls?: any[]; // Update with proper type when available
}

export interface GeminiGenerateImagesResponse {
  generatedImages: {
    image: {
      url: string;
    };
  }[];
}

export interface LiveAPIMessage {
  data?: string;
  serverContent?: {
    turnComplete?: boolean;
    modelTurn?: {
      parts: Array<{
        inline_data?: {
          mime_type: string;
        }
      }>
    }
  };
}

export type LiveAPIConfig = {
  model: string;
  callbacks: {
    onopen?: () => void;
    onmessage?: (message: LiveAPIMessage) => void;
    onerror?: (error: Error) => void;
    onclose?: (event: CloseEvent) => void;
  };
  config?: {
    responseModalities?: string[];
    systemInstruction?: string;
  };
};
