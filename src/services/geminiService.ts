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
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      retries = 3
    } = options;

    try {
      // Use centralized httpClient which will prefix /api in dev or use VITE_ADMIN_API_URL in prod.
      const resp = await httpClient.post('/gemini/generate', { prompt });
      const data = resp?.data ?? {};

      // Maintain backward-compatible shape where possible.
      const text =
        data.text ??
        (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '') ??
        '';

      return {
        text,
        candidates: data.candidates ?? [],
        usageMetadata: data.usageMetadata ?? {},
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
   * Generates an image using the Gemini API via our backend.
   * If the backend does not expose an image generation endpoint yet, this will fail gracefully with a helpful message.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails or if the backend endpoint is missing.
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Try the kebab-case endpoint first (matches many backend styles)
      let resp;
      try {
        resp = await httpClient.post('/gemini/generate-image', { prompt });
      } catch (firstErr) {
        // If backend returns 404, try camelCase fallback for compatibility
        const status = (firstErr as any)?.response?.status;
        if (status === 404) {
          try {
            resp = await httpClient.post('/gemini/generateImage', { prompt });
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
        // TODO: Implement /gemini/generate-image on the backend or update this client when endpoint is available.
        throw new Error('Image generation endpoint is not available on the backend. TODO: Add /api/gemini/generate-image or update frontend to match backend.');
      }

      const data = resp.data;

      // Support multiple possible response shapes:
      // - { imageBase64: '...' }
      // - { generatedImages: [{ image: { url: 'data:...' } }] }
      // - { generatedImages: [{ image: { bytesBase64: '...' } }] }
      if (data.imageBase64) {
        const dataUrl = `data:image/png;base64,${data.imageBase64}`;
        return dataUrlToBlobUrl(dataUrl);
      }

      if (Array.isArray(data.generatedImages) && data.generatedImages.length > 0) {
        const first = data.generatedImages[0];
        const url = first?.image?.url ?? first?.image?.bytesBase64;
        if (first?.image?.url) {
          // If the backend already returns a URL, return it directly
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
