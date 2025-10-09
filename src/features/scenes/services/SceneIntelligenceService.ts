import { AIService } from '@/types/ai';
import { StreamContext, SceneSuggestion } from '../types';

class SceneIntelligenceService {
  constructor(private geminiService: AIService) {}

  async suggestSceneTransition(
    currentScene: string,
    streamContext: StreamContext
  ): Promise<SceneSuggestion[]> {
    const prompt = `
    Current scene: ${currentScene}
    Stream context: ${JSON.stringify(streamContext)}
    Suggest 3 optimal scene transitions with timing and reasoning.
    `;

    const response = await this.geminiService.generateStructuredContent(
      prompt,
      {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sceneName: { type: 'string' },
                confidence: { type: 'number' },
                reasoning: { type: 'string' },
                optimalTiming: { type: 'number' }
              },
              required: ['sceneName', 'confidence', 'reasoning', 'optimalTiming'],
            }
          }
        },
        required: ['suggestions'],
      }
    );

    if (response && response.structuredData && Array.isArray(response.structuredData.suggestions)) {
        return response.structuredData.suggestions;
    }

    return [];
  }
}

export default SceneIntelligenceService;