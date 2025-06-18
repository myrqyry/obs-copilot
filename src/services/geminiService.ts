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
}
