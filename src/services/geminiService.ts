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
import { dataUrlToBlobUrl } from '@/lib/utils';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { Buffer } from 'buffer';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';
import { httpClient } from './httpClient';
import { MODEL_CONFIG } from '@/config/modelConfig';
import { logger } from '@/utils/logger';
import { useErrorStore } from '@/store/errorStore'; // Import useErrorStore

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

class GeminiService implements AIService {
  constructor() {
    // No-op
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
      logger.error('[Gemini] Content generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
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
    } = {}
  ): Promise<string[]> {
    const { model = MODEL_CONFIG.image, ...rest } = options;
    logger.info('[Gemini] Generating image with options:', { model, ...rest });

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      Object.entries(rest).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      const response = await httpClient.post('/gemini/generate-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrls: string[] = response.data.imageUrls || [];
      logger.info(`[Gemini] Image generation successful, received ${imageUrls.length} images.`);
      return Promise.all(imageUrls.map((url: string) => dataUrlToBlobUrl(url)));
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'image generation');
      logger.error('[Gemini] Image generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
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
        const wavUrl = await pcm16ToWavUrl(audioBuffer, 24000, 1);
        return wavUrl;
      }

      throw new Error('Speech generation response did not contain expected audio data.');
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'speech generation');
      logger.error('[Gemini] Speech generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
  }

  async generateVideo(
    prompt: string,
    options: {
      model?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      personGeneration?: string;
      numberOfVideos?: number;
    } = {}
  ): Promise<string[]> {
    const { model = MODEL_CONFIG.video, ...rest } = options;
    logger.info('[Gemini] Generating video with options:', { model, ...rest });

    try {
      const response = await httpClient.post('/gemini/generate-video', {
        prompt,
        model,
        ...rest,
      });

      const { videoUrls } = response.data;
      logger.info(`[Gemini] Video generation successful, received ${videoUrls?.length || 0} videos.`);
      return videoUrls || [];
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'video generation');
      logger.error('[Gemini] Video generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, prompt: prompt.substring(0, 50), error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
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
      logger.error('[Gemini] Structured content generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, prompt: prompt.substring(0, 50), schema, error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
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
      logger.error('[Gemini] Long context generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, contextLength: context.length, error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
  }

  async liveConnect(options: any): Promise<any> {
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
      logger.error('[Gemini] Widget config generation failed:', geminiError);
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        safeAddError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { description: description.substring(0, 50), error: geminiError.originalError }
        });
      }
      throw geminiError;
    }
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

  async refineWidgetConfig(chatSession: any, refinementPrompt: string): Promise<UniversalWidgetConfig> {
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
}

export const geminiService = aiMiddleware(new GeminiService());