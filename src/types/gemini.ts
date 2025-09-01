import { GenerateContentResponse, GenerateImagesResponse, LiveServerMessage, LiveConnectParameters, GenerateImagesConfig, GenerateContentConfig } from '@google/genai';

export interface GeminiGenerateContentResponse {
  text: string;
  candidates?: GenerateContentResponse['candidates'];
  usageMetadata?: GenerateContentResponse['usageMetadata'];
  toolCalls?: GenerateContentResponse['functionCalls'];
}

export interface GeminiGenerateImagesResponse {
  generatedImages?: GenerateImagesResponse['generatedImages'];
}

export interface LiveAPIMessage extends LiveServerMessage {}

export type LiveAPIConfig = LiveConnectParameters;

export interface GeminiGenerateImagesConfig extends GenerateImagesConfig {}
export interface GeminiGenerateContentConfig extends GenerateContentConfig {}
