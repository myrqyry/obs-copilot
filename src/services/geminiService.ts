import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';
import { aiMiddleware } from './aiMiddleware';
import {
  GeminiAuthError,
  GeminiNonRetryableError,
  mapToGeminiError,
} from './geminiErrors';
import {
  GeminiGenerateContentResponse,
  GeminiGenerateContentConfig,
} from '@/types/gemini';
import { AIService } from '@/types/ai';
import { dataUrlToBlobUrl } from '@/lib/utils';
import { UniversalWidgetConfig } from '@/types/universalWidget';
// Use Vite raw imports for markdown prompts so they're bundled for the browser
// `?raw` imports the file contents as a string at build time
import widgetGenerationPrompt from '@/constants/prompts/widgetGenerationPrompt.md?raw';
import geminiSystemPrompt from '@/constants/prompts/geminiSystemPrompt.md?raw';
// readFileSync removed because this file runs in browser context
import { Buffer } from 'buffer';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';
import { httpClient } from './httpClient';
import { MODEL_CONFIG } from '@/config/modelConfig';

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

      return response.data;
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'content generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
          message: geminiError.message,
          source: 'geminiService',
          level: 'critical',
          details: { model, error: geminiError.originalError }
        });
      }
      // Always re-throw the specific error for upstream consumers
      throw geminiError;
    }
  }

  /**
   * Generate content using Gemini's streaming API via backend.
   * @param prompt The user's prompt.
   * @param onStreamEvent A callback function to handle streaming events.
   * @param options Additional options for the request.
   */
  async generateStreamingContent(
    prompt: string,
    onStreamEvent: (event: StreamEvent) => void,
    options: {
      model?: string;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<void> {
    const { model = MODEL_CONFIG.chat, history = [] } = options;

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
          buffer = events.pop() || ''; // Keep the last partial event in buffer
          for (const eventStr of events) {
              if (eventStr.startsWith('data: ')) {
                  const jsonStr = eventStr.replace('data: ', '');
                  try {
                      const event = JSON.parse(jsonStr) as StreamEvent;
                      onStreamEvent(event);
                  } catch (e) {
                      console.error("Failed to parse stream event:", jsonStr);
                  }
              }
          }
      };

      const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
              if(buffer) { // process any remaining data
                  processBuffer();
              }
              return;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          await read();
      };

      await read();

    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'streaming content generation');
      handleAppError('Gemini API streaming', error, 'Streaming failed.');
      onStreamEvent({ type: 'error', data: geminiError.message });
      // We don't re-throw here because the error is communicated via the stream event
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
    const {
      model = MODEL_CONFIG.image,
      numberOfImages = 1,
      outputMimeType = 'image/png',
      aspectRatio = '1:1',
      personGeneration = 'allow_adult',
      negativePrompt,
      imageInput,
    } = options;

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('numberOfImages', numberOfImages.toString());
      formData.append('outputMimeType', outputMimeType);
      formData.append('aspectRatio', aspectRatio);
      formData.append('personGeneration', personGeneration);
      if (negativePrompt) formData.append('negativePrompt', negativePrompt);
      if (imageInput) {
        formData.append('imageData', imageInput.data);
        formData.append('imageMimeType', imageInput.mimeType);
      }

      const response = await httpClient.post('/gemini/generate-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrls: string[] = response.data.imageUrls || [];
      return Promise.all(imageUrls.map((url: string) => dataUrlToBlobUrl(url)));
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'image generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    const {
      model = MODEL_CONFIG.speech,
      voiceConfig,
      multiSpeakerVoiceConfig,
    } = options;

    try {
      const response = await httpClient.post('/gemini/generate-speech', {
        prompt,
        model,
        voiceConfig,
        multiSpeakerVoiceConfig,
      });

      const { audioData } = response.data;
      if (audioData) {
        const audioBuffer = Buffer.from(audioData, 'base64');
        const wavUrl = await pcm16ToWavUrl(audioBuffer, 24000, 1);
        return wavUrl;
      }

      throw new Error('Speech generation response did not contain expected audio data.');
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'speech generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    const {
      model = MODEL_CONFIG.video,
      aspectRatio = '16:9',
      durationSeconds = 8,
      personGeneration = 'allow_adult',
      numberOfVideos = 1,
    } = options;

    try {
      const response = await httpClient.post('/gemini/generate-video', {
        prompt,
        model,
        aspectRatio,
        durationSeconds,
        personGeneration,
        numberOfVideos,
      });

      const { videoUrls } = response.data;
      return videoUrls || [];
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'video generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    const {
      model = MODEL_CONFIG.structured,
      temperature = 0.7,
      maxOutputTokens = 2000
    } = options;

    try {
      const response = await httpClient.post('/gemini/generate-structured', {
        prompt,
        model,
        temperature,
        maxOutputTokens,
        schema: JSON.stringify(schema),
      });

      const { structuredData, rawContent, usage } = response.data;
      return {
        structuredData,
        rawContent,
        usage
      };
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'structured content generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    const {
      model = MODEL_CONFIG.longContext,
      temperature = 0.7,
      maxOutputTokens = 4000
    } = options;

    try {
      const response = await httpClient.post('/gemini/generate-long-context', {
        prompt,
        context,
        model,
        temperature,
        maxOutputTokens,
      });

      return response.data;
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'long context generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    throw new Error('Live API connection not supported in proxied mode');
  }
  
  // Widget-specific methods
  async generateWidgetConfigFromPrompt(
    description: string,
    options: { temperature?: number; maxOutputTokens?: number } = {}
  ): Promise<UniversalWidgetConfig> {
    const {
      temperature = 0.1, // Low temperature for consistent structured output
      maxOutputTokens = 2000
    } = options;

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
      return config;
    } catch (error: any) {
      const geminiError = mapToGeminiError(error, 'widget config generation');
      if (geminiError instanceof GeminiAuthError || geminiError instanceof GeminiNonRetryableError) {
        useUiStore.getState().addError({
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
    // Chat sessions for widgets would be handled backend-side if needed
    throw new Error('Widget chat sessions not supported in proxied mode');
  }

  // Method for follow-up refinements in chat session
  async refineWidgetConfig(chatSession: any, refinementPrompt: string): Promise<UniversalWidgetConfig> {
    // Refinements would be handled via backend chat proxy if implemented
    throw new Error('Widget refinement not supported in proxied mode');
  }
}

export const geminiService = aiMiddleware(new GeminiService());