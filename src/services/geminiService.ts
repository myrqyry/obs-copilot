import { handleAppError } from '@/lib/errorUtils';
import { aiMiddleware } from './aiMiddleware';
import {
  GeminiAuthError,
  GeminiNonRetryableError,
  mapToGeminiError,
} from './geminiErrors';
import {
  GeminiGenerateContentResponse,
} from '@/types/gemini';
import { AIService } from '@/types/ai';
// import { dataUrlToBlobUrl } from '@/lib/utils';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { Buffer } from 'buffer';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';
import { httpClient } from './httpClient';
import { MODEL_CONFIG } from '@/config/modelConfig';
import { logger } from '@/utils/logger';
import { useErrorStore } from '@/store/errorStore'; // Import useErrorStore
import { BaseService } from './baseService';

// Add helper function at the top of the file
function safeAddError(error: { message: string; source: string; level: 'critical' | 'error' | 'warn' | 'info' | 'debug'; details?: any }) {
  try {
    useErrorStore.getState().addError(error);
  } catch (storeError) {
    logger.error('Failed to add error to store:', storeError);
    console.error('Original error that could not be stored:', error);
  }
}

export type StreamEvent = {
    type: 'chunk' | 'usage' | 'error' | 'tool_call';
    data: any;
}

class GeminiService extends BaseService implements AIService {
  private apiKey: string | null = null;

  constructor() {
    super();
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

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
      model = MODEL_CONFIG.chat,
      temperature = 0.7,
      maxOutputTokens = 1000,
      topP = 0.9,
      topK = 40,
      history = []
    } = options;

    logger.info('[Gemini] Generating content with options:', { model, temperature, maxOutputTokens });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post('/gemini/generate-content', {
            prompt,
            model,
            temperature,
            maxOutputTokens,
            topP,
            topK,
            history,
          });
    
          logger.info('[Gemini] Content generation successful.');
          return response.data;
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'content generation');
          // Don't log error here as BaseService handles it for retries
          // logger.error('[Gemini] Content generation failed:', geminiError);
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, error: geminiError.originalError }
            });
            // Stop retrying for non-retryable errors
            throw geminiError; 
          }
          throw geminiError;
        }
    }, 'Gemini content generation');
  }

  async generateStreamingContent(
    prompt: string,
    onStreamEvent: (event: StreamEvent) => void,
    options: {
      model?: string;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<void> {
    const { model = MODEL_CONFIG.chat, history = [] } = options;
    logger.info('[Gemini] Generating streaming content with options:', { model });

    // Streaming is tricky with retry because we might have already sent some data.
    // For now, we will NOT retry streaming requests automatically in the same way,
    // or we could retry only if no data has been received yet.
    // Given the complexity, we'll keep the original implementation but wrap it in a try/catch block
    // that mimics the base service's error handling structure if we wanted to add it later.
    
    try {
      const response = await httpClient.post('/gemini/stream', {
        prompt,
        model,
        history,
      }, {
        responseType: 'stream'
      });

      const reader = response.data.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      const processBuffer = () => {
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          for (const eventStr of events) {
              if (eventStr.startsWith('data: ')) {
                  const jsonStr = eventStr.replace('data: ', '');
                  try {
                      const event = JSON.parse(jsonStr) as StreamEvent;
                      onStreamEvent(event);
                  } catch (e) {
                      logger.error('[Gemini] Failed to parse stream event:', jsonStr, e);
                  }
              }
          }
      };

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer) processBuffer();
            logger.info('[Gemini] Stream finished.');
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
      };

      await processStream();

    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'streaming content generation');
      logger.error('[Gemini] Streaming content generation failed:', geminiError);
      handleAppError('Gemini API streaming', error, 'Streaming failed.');
      onStreamEvent({ type: 'error', data: geminiError.message });
    }
  }

  async generateImage(
    prompt: string,
    options: {
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
    } = {}
  ): Promise<string[]> {
    const { model = MODEL_CONFIG.image, ...rest } = options;
    logger.info('[Gemini] Generating image with options:', { model, ...rest });

    return this.withRetry(async () => {
        try {
          // Use JSON payload for complex data including multiple images
          const payload = {
            prompt,
            model,
            ...rest,
            // Map camelCase to snake_case for backend if needed, but Pydantic handles it if we match
            // However, the backend expects snake_case for Pydantic models usually unless configured otherwise.
            // Let's map explicitly to be safe.
            image_format: rest.outputMimeType ? rest.outputMimeType.split('/')[1] : 'png',
            aspect_ratio: rest.aspectRatio,
            person_generation: rest.personGeneration,
            image_input: rest.imageInput?.data,
            image_input_mime_type: rest.imageInput?.mimeType,
            reference_images: rest.referenceImages?.map(img => ({
                data: img.data,
                mime_type: img.mimeType
            })),
            image_size: rest.imageSize,
            search_grounding: rest.searchGrounding
          };

          const response = await httpClient.post('/gemini/generate-image-enhanced', payload);
    
          const images: Array<{ data: string; mime_type: string }> = response.data.images || [];
          logger.info(`[Gemini] Image generation successful, received ${images.length} images.`);
          
          // Convert base64 data to blob URLs
          return Promise.all(images.map((img) => {
              const base64Data = img.data;
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: img.mime_type });
              return URL.createObjectURL(blob);
          }));
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'image generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini image generation');
  }

  async generateSpeech(
    prompt: string,
    options: {
      model?: string;
      voiceConfig?: any;
      multiSpeakerVoiceConfig?: any;
    } = {}
  ): Promise<string> {
    const { model = MODEL_CONFIG.speech, ...rest } = options;
    logger.info('[Gemini] Generating speech with options:', { model, ...rest });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post('/gemini/generate-speech', {
            prompt,
            model,
            ...rest,
          });
    
          const { audioData } = response.data;
          if (audioData) {
            logger.info('[Gemini] Speech generation successful, processing audio data.');
            const audioBuffer = Buffer.from(audioData, 'base64');
            const wavUrl = await pcm16ToWavUrl(audioBuffer.buffer as ArrayBuffer, 24000, 1);
            return wavUrl;
          }
    
          throw new Error('Speech generation response did not contain expected audio data.');
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'speech generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini speech generation');
  }

  async generateVideo(
    prompt: string,
    options: {
      model?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      personGeneration?: string;
      numberOfVideos?: number;
      referenceImages?: Array<{ data: string; mimeType: string }>;
      image?: { data: string; mimeType: string };
      lastFrame?: { data: string; mimeType: string };
      video?: { uri: string };
    } = {}
  ): Promise<string[]> {
    const { model = MODEL_CONFIG.video, ...rest } = options;
    logger.info('[Gemini] Generating video with options:', { model, ...rest });

    return this.withRetry(async () => {
        try {
          // 1. Start generation
          const response = await httpClient.post<{ operation_name: string }>('/gemini/generate-video', {
            prompt,
            model,
            ...rest,
          });
    
          const { operation_name } = response.data;
          logger.info(`[Gemini] Video generation started, operation: ${operation_name}`);

          // 2. Poll for completion
          const pollInterval = 5000; // 5 seconds
          const maxAttempts = 60; // 5 minutes timeout
          
          for (let i = 0; i < maxAttempts; i++) {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              
              // Encode operation name as it might contain slashes
              const encodedName = encodeURIComponent(operation_name);
              const statusResponse = await httpClient.get<{ status: string; result?: any; error?: string }>(
                  `/gemini/operations/${encodedName}`
              );
              
              const { status, result, error } = statusResponse.data;
              
              if (status === 'completed') {
                  logger.info('[Gemini] Video generation completed.');
                  if (result?.video?.uri) {
                      return [result.video.uri];
                  }
                  // Fallback if structure is different
                  logger.warn('[Gemini] Video generation completed but URI not found in expected path:', result);
                  return []; 
              } else if (status === 'failed') {
                  throw new Error(`Video generation failed: ${error}`);
              }
              
              // Continue polling if 'processing'
          }
          
          throw new Error('Video generation timed out.');

        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'video generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini video generation');
  }

  async generateStructuredContent(
    prompt: string,
    schema: any,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<any> {
    const { model = MODEL_CONFIG.structured, ...rest } = options;
    logger.info('[Gemini] Generating structured content with options:', { model, ...rest });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post('/gemini/generate-structured', {
            prompt,
            model,
            ...rest,
            schema: JSON.stringify(schema),
          });
    
          logger.info('[Gemini] Structured content generation successful.');
          return response.data;
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'structured content generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, prompt: prompt.substring(0, 50), schema, error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini structured content generation');
  }

  async generateWithLongContext(
    prompt: string,
    context: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const { model = MODEL_CONFIG.longContext, ...rest } = options;
    logger.info('[Gemini] Generating with long context, options:', { model, ...rest });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post('/gemini/generate-long-context', {
            prompt,
            context,
            model,
            ...rest,
          });
    
          logger.info('[Gemini] Long context generation successful.');
          return response.data;
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'long context generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { model, contextLength: context.length, error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini long context generation');
  }

  async liveConnect(_options: any): Promise<any> {
    logger.warn('[Gemini] liveConnect called but is not supported in proxied mode.');
    try {
      throw new Error('Live API connection not supported in proxied mode');
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'live connection');
      logger.error('[Gemini] Live connect failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
  }
  
  async generateWidgetConfigFromPrompt(
    description: string,
    options: { temperature?: number; maxOutputTokens?: number } = {}
  ): Promise<UniversalWidgetConfig> {
    const { temperature = 0.1, maxOutputTokens = 2000 } = options;
    logger.info('[Gemini] Generating widget config from prompt:', { description: description.substring(0, 100), ...options });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post('/gemini/generate-widget-config', {
            description,
            temperature,
            maxOutputTokens,
          });
    
          const config: UniversalWidgetConfig = response.data;
          if (!config.id) {
            config.id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          logger.info('[Gemini] Widget config generation successful:', config.id);
          return config;
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'widget config generation');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { description: description.substring(0, 50), error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini widget config generation');
  }

  async createWidgetChatSession(): Promise<any> {
    logger.warn('[Gemini] createWidgetChatSession called but is not supported in proxied mode.');
    try {
      throw new Error('Widget chat sessions not supported in proxied mode');
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'widget chat session');
      logger.error('[Gemini] Widget chat session creation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
  }

  async refineWidgetConfig(_chatSession: any, refinementPrompt: string): Promise<UniversalWidgetConfig> {
    logger.warn('[Gemini] refineWidgetConfig called but is not supported in proxied mode.');
    try {
      throw new Error('Widget refinement not supported in proxied mode');
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'widget refinement');
      logger.error('[Gemini] Widget refinement failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { refinementPrompt: refinementPrompt.substring(0, 50), error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
  }
  async functionCallingQuery(prompt: string, history: any[] = [], obsState: any = null): Promise<{ text: string, actions: any[] }> {
    logger.info('[Gemini] Function calling query:', { prompt: prompt.substring(0, 50) });

    return this.withRetry(async () => {
        try {
          const response = await httpClient.post<{ text: string, actions: any[] }>('/gemini/function-calling-query', {
            prompt,
            history,
            obs_state: obsState,
            model: 'gemini-2.5-flash-preview-tts'
          });
    
          logger.info('[Gemini] Function calling query successful.');
          return response.data;
        } catch (error: any) {
          const geminiError = mapToGeminiError(error, 'function calling query');
          
          if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
            safeAddError({
              message: geminiError.message,
              source: 'geminiService',
              level: 'critical',
              details: { prompt: prompt.substring(0, 50), error: geminiError.originalError }
            });
            throw geminiError;
          }
          throw geminiError;
        }
    }, 'Gemini function calling query');
  }
}

export const geminiService = aiMiddleware(new GeminiService());