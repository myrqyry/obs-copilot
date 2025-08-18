import { logger } from '@/utils/logger';
import { aiMiddleware } from './aiMiddleware';
import { GeminiGenerateContentResponse } from '@/types/gemini';
import { AIService } from '@/types/ai';
import { dataUrlToBlobUrl } from '@/lib/utils';
import { GoogleGenAI, LiveConnectParameters } from '@google/genai';

class GeminiService implements AIService {
  constructor() {
    // No-op
  }

  /**
   * Generates content using the Gemini API via our proxy.
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
      const response = await fetch('/.netlify/functions/proxy/api/gemini/generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.text,
        candidates: [],
        usageMetadata: {},
        toolCalls: [],
      };
    } catch (error) {
      logger.error('Error generating content from Gemini proxy:', error);
      if (retries > 0) {
        logger.info(`Retrying... (${retries - 1} left)`);
        await new Promise(res => setTimeout(res, 1000));
        return this.generateContent(prompt, { ...options, retries: retries - 1 });
      }
      throw error;
    }
  }

  /**
   * Generates an image using the Gemini API via our proxy.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @returns A promise that resolves to a blob URL of the generated image.
   * @throws Throws an error if the API call fails.
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch('/.netlify/functions/proxy/api/gemini/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Image generation proxy request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.imageBase64) {
        throw new Error('No image data returned from proxy');
      }

      const dataUrl = `data:image/png;base64,${data.imageBase64}`;
      return dataUrlToBlobUrl(dataUrl);

    } catch (error) {
      logger.error('Error generating image from Gemini proxy:', error);
      throw error;
    }
  }

  /**
   * Connects to the Gemini Live API for real-time streaming using an ephemeral token.
   * @param options Configuration options for the Live API connection
   * @returns A LiveSession instance for real-time communication
   */
  async liveConnect(options: LiveConnectParameters): Promise<any> {
    try {
      // 1. Fetch an ephemeral token from our backend proxy
      const tokenResponse = await fetch('/.netlify/functions/proxy/api/gemini/generateToken', {
        method: 'POST',
      });
      if (!tokenResponse.ok) {
        throw new Error('Failed to fetch ephemeral token');
      }
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('No token received from proxy');
      }

      // 2. Create a new GoogleGenAI client instance with the ephemeral token
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
