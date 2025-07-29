import axios from 'axios';
import { logger } from '../utils/logger';

export class GeminiService {
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
   * @param history Optional conversation history.
   * @returns A promise that resolves to the generated content.
   * @throws Throws an error if the API call fails.
   */
  async generateContent(prompt: string, history?: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.proxyEndpoint}/generate-content`,
        {
          prompt,
          history,
        },
        { headers: this.getHeaders() },
      );
      return response.data;
    } catch (error) {
      logger.error('Error generating content from Gemini:', error);
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
