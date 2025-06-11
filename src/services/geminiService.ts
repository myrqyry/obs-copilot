
import { GoogleGenAI, GenerateContentResponse, Content } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

// This file is a placeholder for more complex Gemini service logic if needed.
// Currently, GeminiChat.tsx handles direct API calls for better context integration.

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(prompt: string, history?: Content[]): Promise<GenerateContentResponse> {
    const modelService = this.ai.models;
    const result = await modelService.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: history ? [...history, { role: 'user', parts: [{ text: prompt }] }] : [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result;
  }
}
