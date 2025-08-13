import { logger } from '@/utils/logger';
import { aiMiddleware } from './aiMiddleware';
import { GeminiGenerateContentResponse } from '@/types/gemini';
import { AIService } from '@/types/ai';
import { 
  GoogleGenAI, 
  LiveConnectParameters
} from '@google/genai';

class GeminiService implements AIService {
  private client: GoogleGenAI;

  constructor() {
    // API key will be provided by the proxy middleware
    this.client = new GoogleGenAI({ apiKey: '' });
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
      retries?: number;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const { 
      model = 'gemini-2.5-flash', 
      retries = 3 
    } = options;

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt
      });
      
      return {
        text: response.text || '',
        candidates: response.candidates,
        usageMetadata: response.usageMetadata,
        toolCalls: response.functionCalls
      };
    } catch (error) {
      logger.error('Error generating content from Gemini:', error);
      if (retries > 0) {
        logger.info(`Retrying... (${retries - 1} left)`);
        return this.generateContent(prompt, { ...options, retries: retries - 1 });
      }
      throw error;
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
      const response = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt
      });
      
      // Return Blob URL of first generated image if available
      if (response.generatedImages && response.generatedImages.length > 0) {
        const generatedImage = response.generatedImages[0];
        if (generatedImage.image) {
          // Create Blob URL from the image Blob with type assertion
          return URL.createObjectURL(generatedImage.image as Blob);
        } else {
          throw new Error('Generated image blob is undefined');
        }
      } else {
        throw new Error('No images generated');
      }
    } catch (error) {
      logger.error('Error generating image from Gemini:', error);
      throw error;
    }
  }

  /**
   * Connects to the Gemini Live API for real-time streaming.
   * @param options Configuration options for the Live API connection
   * @returns A LiveSession instance for real-time communication
   */
  async liveConnect(options: LiveConnectParameters): Promise<any> {
    try {
      return await this.client.live.connect(options);
    } catch (error) {
      logger.error('Error connecting to Gemini Live API:', error);
      throw error;
    }
  }
}

export const geminiService = aiMiddleware(new GeminiService());
