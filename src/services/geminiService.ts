import axios from 'axios';
import { logger } from '@/utils/logger';
import { aiMiddleware } from './aiMiddleware';
import { ChatMessage } from '@/types';
import { GeminiGenerateContentResponse } from '@/types/gemini';
import { AIService } from '@/types/ai';

class GeminiService implements AIService {
  private proxyEndpoint: string;

  constructor() {
    this.proxyEndpoint = '/api/gemini';
  }

  private getHeaders = () => {
    // API keys are now handled by the proxy, no need to send from client
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    return headers;
  };

  /**
   * Generates content using the Gemini API.
   * @param prompt The prompt to send to the Gemini API.
   * @param retries Optional number of retries.
   * @returns A promise that resolves to the generated content.
   * @throws Throws an error if the API call fails.
   */
  async generateContent(
    prompt: string,
    retries = 3,
  ): Promise<GeminiGenerateContentResponse> {
    try {
      const response = await axios.post(
        `${this.proxyEndpoint}/generate-content`,
        {
          prompt,
        },
        { headers: this.getHeaders() },
      );
      return response.data;
    } catch (error) {
      logger.error('Error generating content from Gemini:', error);
      if (retries > 0) {
        logger.info(`Retrying... (${retries - 1} left)`);
        return this.generateContent(prompt, retries - 1);
      }
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Generates an image using the Gemini API.
   * @param prompt The prompt to send to the Gemini API for image generation.
   * @returns A promise that resolves to the URL of the generated image.
   * @throws Throws an error if the API call fails.
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Note: The proxy endpoint for generate-image currently returns 501 Not Implemented.
      // This change ensures that if it were implemented, it would also use the override key.
      const response = await axios.post(
        `${this.proxyEndpoint}/generate-image`,
        { prompt },
        { headers: this.getHeaders() },
      );
      return response.data.imageUrl; // This will likely fail until the proxy endpoint is fully implemented.
    } catch (error) {
      logger.error('Error generating image from Gemini:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }
}

export const geminiService = aiMiddleware(new GeminiService());
