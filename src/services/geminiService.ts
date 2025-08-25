import { logger } from '@/utils/logger';
import { aiMiddleware } from './aiMiddleware';
import { GeminiGenerateContentResponse } from '@/types/gemini';
import { AIService } from '@/types/ai';
import { dataUrlToBlobUrl } from '@/lib/utils';
import { GoogleGenAI, LiveConnectParameters } from '@google/genai';
import { httpClient } from './httpClient';

class GeminiService implements AIService {
  constructor() {
    // No-op
  }

  /**
   * Generates content using the Gemini API via our backend.
   * @param prompt The prompt to send to the Gemini API.
   * @param options Configuration options
   * @returns A promise that resolves to the generated content.
   * @throws Throws an error if the API call fails.
   */
  async generateContent(
    prompt: string,
    options: {
      model?: string;
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      retries = 3,
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      maxOutputTokens = 1000,
      topP = 0.9,
      topK = 40,
      history = []
    } = options;

    try {
      // Use centralized httpClient which will prefix /api in dev or use VITE_ADMIN_API_URL in prod.
      const requestBody = {
        prompt,
        model,
        temperature,
        max_output_tokens: maxOutputTokens,
        top_p: topP,
        top_k: topK,
        history
      };

      const resp = await httpClient.post('/gemini/generate', requestBody);
      const data = resp?.data ?? {};

      // Handle new backend response format
      const text =
        data.content ??
        data.text ??
        (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '') ??
        '';

      return {
        text,
        candidates: data.candidates ?? [],
        usageMetadata: data.usage ?? data.usageMetadata ?? {},
        toolCalls: data.toolCalls ?? [],
      };
    } catch (error: any) {
      logger.error('Error generating content from Gemini backend:', error);
      if (retries > 0) {
        logger.info(`Retrying generateContent... (${retries - 1} left)`);
        await new Promise(res => setTimeout(res, 1000));
        return this.generateContent(prompt, { ...options, retries: retries - 1 });
      }
      // surface a clearer message if the backend returns an auth issue
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error('Authentication failed when calling Gemini generate endpoint (missing/invalid X-API-KEY).');
      }
      throw error;
    }
  }

  /**
   * Generates an enhanced image using the Gemini API with comprehensive parameters.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @param options Configuration options for enhanced image generation
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails or if the backend endpoint is missing.
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
      model = 'gemini-2.0-flash-exp-image-generation',
      responseModalities = ['TEXT', 'IMAGE'],
      imageFormat = 'png',
      imageQuality = 0.8,
      aspectRatio = '1:1',
      personGeneration = 'allow_adult',
      safetySettings,
      imageInput,
      imageInputMimeType
    } = options;

    try {
      // Try the enhanced endpoint first
      let resp;
      try {
        resp = await httpClient.post('/gemini/generate-image-enhanced', {
          prompt,
          model,
          responseModalities,
          imageFormat,
          imageQuality,
          aspectRatio,
          personGeneration,
          safetySettings,
          imageInput,
          imageInputMimeType
        });
      } catch (firstErr) {
        // If backend returns 404, try camelCase fallback
        const status = (firstErr as any)?.response?.status;
        if (status === 404) {
          try {
            resp = await httpClient.post('/gemini/generateImageEnhanced', {
              prompt,
              model,
              responseModalities,
              imageFormat,
              imageQuality,
              aspectRatio,
              personGeneration,
              safetySettings,
              imageInput,
              imageInputMimeType
            });
          } catch (secondErr) {
            // No enhanced endpoint available — fail gracefully
            resp = undefined;
            logger.info('No generate-image-enhanced endpoint found on backend (404).');
          }
        } else {
          throw firstErr;
        }
      }

      if (!resp || !resp.data) {
        // Fallback to basic image generation
        return this.generateImage(prompt, { model: 'gemini-2.0-flash-exp', size: '1024x1024' });
      }

      const data = resp.data;

      // Handle enhanced response format
      if (data.images && data.images.length > 0) {
        const firstImage = data.images[0];
        const mimeType = firstImage.mime_type || `image/${imageFormat}`;
        const base64Data = firstImage.data;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        return dataUrlToBlobUrl(dataUrl);
      }

      // If we reach here, we couldn't find image data in the response
      throw new Error('Enhanced image generation response did not contain expected image data.');
    } catch (error: any) {
      logger.error('Error generating enhanced image from Gemini backend:', error);
      // Surface friendly message for missing endpoint vs other failures
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error('Authentication failed when calling Gemini enhanced image endpoint (missing/invalid X-API-KEY).');
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Generates an image using the native Gemini 2.0 Flash capabilities via our backend.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @param options Configuration options for image generation
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails or if the backend endpoint is missing.
   */
  async generateImage(
    prompt: string,
    options: {
      model?: string;
      size?: string;
    } = {}
  ): Promise<string> {
    const { model = 'gemini-2.0-flash-exp', size = '1024x1024' } = options;

    try {
      // Try the kebab-case endpoint first (matches many backend styles)
      let resp;
      try {
        resp = await httpClient.post('/gemini/generate-image', { prompt, model, size });
      } catch (firstErr) {
        // If backend returns 404, try camelCase fallback for compatibility
        const status = (firstErr as any)?.response?.status;
        if (status === 404) {
          try {
            resp = await httpClient.post('/gemini/generateImage', { prompt, model, size });
          } catch (secondErr) {
            // No image endpoint available — fail gracefully below
            resp = undefined;
            logger.info('No generate-image endpoint found on backend (404).');
          }
        } else {
          // Propagate non-404 errors to be handled by outer catch
          throw firstErr;
        }
      }

      if (!resp || !resp.data) {
        // Backend doesn't support image generation yet
        throw new Error('Image generation endpoint is not available on the backend. TODO: Add /api/gemini/generate-image or update frontend to match backend.');
      }

      const data = resp.data;

      // Handle new backend response format with native Gemini 2.0 Flash
      if (data.image && data.image.data) {
        // New format: { image: { mime_type: '...', data: '...' } }
        const mimeType = data.image.mime_type || 'image/png';
        const base64Data = data.image.data;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        return dataUrlToBlobUrl(dataUrl);
      }

      // Fallback to legacy response formats
      if (data.imageBase64) {
        const dataUrl = `data:image/png;base64,${data.imageBase64}`;
        return dataUrlToBlobUrl(dataUrl);
      }

      if (Array.isArray(data.generatedImages) && data.generatedImages.length > 0) {
        const first = data.generatedImages[0];
        if (first?.image?.url) {
          return first.image.url;
        } else if (first?.image?.bytesBase64) {
          const dataUrl = `data:image/png;base64,${first.image.bytesBase64}`;
          return dataUrlToBlobUrl(dataUrl);
        }
      }

      // If we reach here, we couldn't find image data in the response
      throw new Error('Image generation response did not contain expected image data.');
    } catch (error: any) {
      logger.error('Error generating image from Gemini backend:', error);
      // Surface friendly message for missing endpoint vs other failures
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error('Authentication failed when calling Gemini image endpoint (missing/invalid X-API-KEY).');
      }
      throw error instanceof Error ? error : new Error(String(error));
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
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<any> {
    const {
      model = 'gemini-2.5-flash',
      retries = 3,
      temperature = 0.7,
      maxOutputTokens = 2000
    } = options;

    try {
      const requestBody = {
        prompt,
        model,
        temperature,
        max_output_tokens: maxOutputTokens,
        response_schema: schema
      };

      const resp = await httpClient.post('/gemini/generate', requestBody);
      const data = resp?.data ?? {};

      return {
        structuredData: data.structured_data || data.content,
        rawContent: data.content,
        usage: data.usage || data.usageMetadata || {}
      };
    } catch (error: any) {
      logger.error('Error generating structured content from Gemini backend:', error);
      if (retries > 0) {
        logger.info(`Retrying generateStructuredContent... (${retries - 1} left)`);
        await new Promise(res => setTimeout(res, 1000));
        return this.generateStructuredContent(prompt, schema, { ...options, retries: retries - 1 });
      }
      throw error;
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
      retries?: number;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      model = 'gemini-2.5-flash',
      retries = 3,
      temperature = 0.7,
      maxOutputTokens = 4000
    } = options;

    try {
      // Combine context and prompt for long context processing
      const fullPrompt = `Context:\n${context}\n\nBased on the above context, please respond to this request:\n${prompt}`;

      const requestBody = {
        prompt: fullPrompt,
        model,
        temperature,
        max_output_tokens: maxOutputTokens
      };

      const resp = await httpClient.post('/gemini/generate', requestBody);
      const data = resp?.data ?? {};

      const text = data.content || data.text || '';

      return {
        text,
        candidates: data.candidates ?? [],
        usageMetadata: data.usage ?? data.usageMetadata ?? {},
        toolCalls: data.toolCalls ?? [],
      };
    } catch (error: any) {
      logger.error('Error generating content with long context:', error);
      if (retries > 0) {
        logger.info(`Retrying generateWithLongContext... (${retries - 1} left)`);
        await new Promise(res => setTimeout(res, 1000));
        return this.generateWithLongContext(prompt, context, { ...options, retries: retries - 1 });
      }
      throw error;
    }
  }

  /**
   * Connects to the Gemini Live API for real-time streaming using an ephemeral token.
   * This implementation attempts to get an ephemeral token from the backend.
   * If the backend does not expose a generateToken endpoint yet, this will fail with a clear TODO message.
   * @param options Configuration options for the Live API connection
   * @returns A LiveSession instance for real-time communication
   */
  async liveConnect(options: LiveConnectParameters): Promise<any> {
    try {
      // The legacy implementation used /.netlify/functions/proxy/api/gemini/generateToken.
      // New backend may expose something like POST /api/gemini/generateToken or /api/gemini/generate-token.
      // Try a couple of likely endpoints and fail gracefully if none exist.
      let tokenResp;
      try {
        tokenResp = await httpClient.post('/gemini/generateToken');
      } catch (firstErr) {
        const status = (firstErr as any)?.response?.status;
        if (status === 404) {
          try {
            tokenResp = await httpClient.post('/gemini/generate-token');
          } catch (secondErr) {
            tokenResp = undefined;
            logger.info('No generateToken endpoint found on backend (404).');
          }
        } else {
          throw firstErr;
        }
      }

      if (!tokenResp || !tokenResp.data) {
        // TODO: Add /api/gemini/generateToken (or /api/gemini/generate-token) to backend to support Live API.
        throw new Error('Gemini Live ephemeral token endpoint is not available on the backend. TODO: implement generateToken endpoint.');
      }

      const { token } = tokenResp.data;
      if (!token) {
        throw new Error('No token received from backend for Gemini Live connection.');
      }

      // Use the ephemeral token to create the client and connect
      const clientWithToken = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' }
      });

      // 3. Use the new client to connect to the Live API
      return await clientWithToken.live.connect(options);
    } catch (error) {
      logger.error('Error connecting to Gemini Live API:', error);
      throw error;
    }
  }
}

export const geminiService = aiMiddleware(new GeminiService());
