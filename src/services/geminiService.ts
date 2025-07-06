import { GoogleGenerativeAI, GenerateContentResult, Content } from '@google/generative-ai';
import { GEMINI_MODEL_NAME } from '../constants';

// This file is a placeholder for more complex Gemini service logic if needed.
// Currently, GeminiChat.tsx handles direct API calls for better context integration.

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, history?: Content[]): Promise<GenerateContentResult> {
    const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    if (history && history.length > 0) {
      const chat = model.startChat({
        history: history,
      });
      return await chat.sendMessage(prompt);
    } else {
      return await model.generateContent(prompt);
    }
  }

  /**
   * Generate an image from a text prompt using Gemini API (GoogleGenerativeAI).
   * Returns a base64 image string or a URL, depending on the API response.
   */
  async generateImage(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });
    // Use result.response?.candidates for compatibility
    const candidates = result.response?.candidates || [];
    for (const candidate of candidates) {
      if (candidate.content && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            // Return as data URL
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
          if (part.fileData && part.fileData.fileUri) {
            // Return as file URL
            return part.fileData.fileUri;
          }
        }
      }
    }
    throw new Error('No image found in Gemini response.');
  }
}

