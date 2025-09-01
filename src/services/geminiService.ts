import { logger } from '@/utils/logger';
import { handleAppError } from '@/lib/errorUtils'; // Import handleAppError
import { aiMiddleware } from './aiMiddleware';
import { GeminiGenerateContentResponse, GeminiGenerateImagesResponse, GeminiGenerateImagesConfig, GeminiGenerateContentConfig, LiveAPIConfig } from '@/types/gemini';
import { AIService } from '@/types/ai';
import { dataUrlToBlobUrl } from '@/lib/utils';
import { GoogleGenAI, Part, Content, Image } from '@google/genai';
import { httpClient } from './httpClient';
import { Buffer } from 'buffer';

// Initialize the Google GenAI client
// The new SDK handles token generation internally or via client initialization.
// We need to ensure the client is initialized with the correct API key.
// If using an ephemeral token, it should be handled during client creation.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''; // Ensure GEMINI_API_KEY is set
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

class GeminiService implements AIService {
  constructor() {
    // No-op
  }

  /**
   * Generates content using the Gemini API.
   * @param prompt The prompt to send to the Gemini API.
   * @param options Configuration options
   * @returns A promise that resolves to the generated content.
   * @throws Throws an error if the API call fails.
   */
  async generateContent(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      model = 'gemini-1.5-flash-latest', // Updated model name to latest stable
      temperature = 0.7,
      maxOutputTokens = 1000,
      topP = 0.9,
      topK = 40,
      history = []
    } = options;

    try {
      // Prepare history for the new SDK format
      const formattedHistory: Content[] = history.map(turn => ({
        role: turn.role,
        parts: turn.parts.map(part => ({ text: part.text }))
      }));

      // Construct the config object for the new SDK
      const config: GeminiGenerateContentConfig = {
        temperature,
        maxOutputTokens,
        topP,
        topK,
      };

      // Use the new SDK's generateContent method
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: config,
      });

      const text = response.text || '';
      const candidates = response.candidates || [];
      const usageMetadata = response.usageMetadata || {};
      const toolCalls = response.functionCalls || []; // Assuming functionCalls maps to toolCalls

      return {
        text,
        candidates,
        usageMetadata,
        toolCalls,
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API content generation', error, `Model '${model}' not found or authentication failed.`));
    }
  }

  /**
   * Generates an enhanced image using the Gemini API with comprehensive parameters.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @param options Configuration options for enhanced image generation
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails.
   */
  async generateEnhancedImage(
    prompt: string,
    options: {
      model?: string;
      responseModalities?: string[];
      imageFormat?: string;
      imageQuality?: number;
      aspectRatio?: string;
      personGeneration?: string;
      safetySettings?: Array<{ category: string; threshold: string }>;
      imageInput?: string; // Base64 encoded image for editing
      imageInputMimeType?: string;
    } = {}
  ): Promise<string> {
    const {
      model = 'imagen-3.0-generate-001', // Updated model name for image generation
      imageFormat = 'png',
      aspectRatio = '1:1',
      personGeneration = 'allow_adult',
      safetySettings,
      imageInput,
      imageInputMimeType
    } = options;

    try {
      // Prepare safety settings for the new SDK
      const formattedSafetySettings = safetySettings?.map(setting => ({
        category: setting.category as any, // Type assertion might be needed
        threshold: setting.threshold as any, // Type assertion might be needed
      }));

      // Prepare image input if provided
      let imagePart: Part | undefined;
      if (imageInput && imageInputMimeType) {
        imagePart = { inlineData: { data: imageInput, mimeType: imageInputMimeType } };
      }

      // Use the new SDK's generateImages method
      const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: `image/${imageFormat}`,
          safetyFilterLevel: formattedSafetySettings?.[0]?.threshold as any, // Assuming single safety setting for simplicity
          personGeneration: personGeneration as any,
          aspectRatio: aspectRatio as any,
        },
      });

      // Handle response format
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0];
        if (firstImage.image?.imageBytes) {
          const mimeType = firstImage.image.mimeType || `image/${imageFormat}`;
          const dataUrl = `data:${mimeType};base64,${Buffer.from(firstImage.image.imageBytes).toString('base64')}`;
          return dataUrlToBlobUrl(dataUrl);
        }
      }

      throw new Error('Image generation response did not contain expected image data.');
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API enhanced image generation', error, 'Image generation response did not contain expected image data or authentication failed.'));
    }
  }

  /**
   * Generates an image using the native Gemini 2.0 Flash capabilities.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @param options Configuration options for image generation
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails.
   */
  async generateImage(
    prompt: string,
    options: {
      model?: string;
      size?: string;
    } = {}
  ): Promise<string> {
    const { model = 'imagen-3.0-generate-001', size = 'IMAGE_SIZE_1024_1024' } = options; // Updated model name and default size to enum

    try {
      // Use the new SDK's generateImages method
      const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          imageSize: size as any, // Map size to imageSize enum
          outputMimeType: 'image/png',
        },
      });

      // Handle response format
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0];
        if (firstImage.image?.imageBytes) {
          const mimeType = firstImage.image.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${Buffer.from(firstImage.image.imageBytes).toString('base64')}`;
          return dataUrlToBlobUrl(dataUrl);
        }
      }

      throw new Error('Image generation response did not contain expected image data.');
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API image generation', error, 'Image generation response did not contain expected image data or authentication failed.'));
    }
  }

  /**
   * Generates content with structured output using JSON schema.
   * @param prompt The prompt to send to the Gemini API.
   * @param schema JSON schema for structured output
   * @param options Configuration options
   * @returns A promise that resolves to the generated content with structured data.
   */
  async generateStructuredContent(
    prompt: string,
    schema: any,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<any> {
    const {
      model = 'gemini-2.0-flash', // Updated model name
      temperature = 0.7,
      maxOutputTokens = 2000
    } = options;

    try {
      // Use the new SDK's generateContent method with response_schema
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature,
          maxOutputTokens,
          responseSchema: schema, // Pass schema directly
          responseMimeType: 'application/json', // Ensure JSON output
        },
      });

      // The new SDK returns parsed data directly in `response.parsed` if a schema is provided.
      // Explicitly cast to any to access the parsed property which is conditionally available.
      const structuredData = (response as any).parsed || response.text;
      const rawContent = response.text;
      const usage = response.usageMetadata || {};

      return {
        structuredData,
        rawContent,
        usage
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API structured content generation', error, 'Structured content generation failed or authentication failed.'));
    }
  }

  /**
   * Generates content with long context support for stream analysis.
   * @param prompt The prompt to send to the Gemini API.
   * @param context Large context data (can be up to million tokens)
   * @param options Configuration options
   * @returns A promise that resolves to the generated content.
   */
  async generateWithLongContext(
    prompt: string,
    context: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      model = 'gemini-2.5-flash', // Updated model name
      temperature = 0.7,
      maxOutputTokens = 4000
    } = options;

    try {
      // Combine context and prompt for long context processing
      const fullPrompt = `Context:\n${context}\n\nBased on the above context, please respond to this request:\n${prompt}`;

      // Use the new SDK's generateContent method
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
          temperature,
          maxOutputTokens,
        },
      });

      const text = response.text || '';
      const candidates = response.candidates || [];
      const usageMetadata = response.usageMetadata || {};
      const toolCalls = response.functionCalls || [];

      return {
        text,
        candidates,
        usageMetadata,
        toolCalls,
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API long context generation', error, 'Long context generation failed or authentication failed.'));
    }
  }

  /**
   * Connects to the Gemini Live API for real-time streaming using an ephemeral token.
   * @param options Configuration options for the Live API connection
   * @returns A LiveSession instance for real-time communication
   */
  async liveConnect(options: LiveAPIConfig): Promise<any> {
    try {
      // The new SDK handles token generation internally or via client initialization.
      // We need to ensure the client is initialized with the correct API key.
      // If using an ephemeral token, it should be handled during client creation.

      // Assuming the GoogleGenAI client is already initialized with a valid API key (or env var)
      // The liveConnect method is called on the client instance.
      return await ai.live.connect(options);
    } catch (error: any) {
      throw new Error(handleAppError('Gemini Live API connection', error, 'Live API connection failed or authentication failed.'));
    }
  }
}

export const geminiService = aiMiddleware(new GeminiService());
