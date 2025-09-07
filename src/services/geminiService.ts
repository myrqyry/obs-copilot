import { handleAppError } from '@/lib/errorUtils';
import { aiMiddleware } from './aiMiddleware';
import {
  GeminiGenerateContentResponse,
  GeminiGenerateContentConfig,
} from '@/types/gemini';
import { AIService } from '@/types/ai';
import { dataUrlToBlobUrl } from '@/lib/utils';
import { LiveConnectParameters } from '@google/genai';
import { GoogleGenAI, Content, Type } from '@google/genai';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { readFileSync } from 'fs';
import { Buffer } from 'buffer';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';
import { httpClient } from './httpClient';
import { MODEL_CONFIG } from '@/config/modelConfig';

// Initialize the Google GenAI client with a placeholder key
// The actual key will be passed dynamically from the components
let ai: GoogleGenAI;

// Function to initialize or reinitialize the client with a specific API key
export function initializeGeminiClient(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
}

// Initialize with environment variable as fallback
const initialApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (initialApiKey) {
  initializeGeminiClient(initialApiKey);
}

export type StreamEvent = {
    type: 'chunk' | 'usage' | 'error' | 'tool_call';
    data: any;
}

class GeminiService implements AIService {
  constructor() {
    // No-op
  }

  async generateContent(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      model = MODEL_CONFIG.chat,
      temperature = 0.7,
      maxOutputTokens = 1000,
      topP = 0.9,
      topK = 40,
      history = []
    } = options;

    try {
      const formattedHistory: Content[] = history.map(turn => ({
        role: turn.role,
        parts: turn.parts.map(part => ({ text: part.text }))
      }));

      const config: GeminiGenerateContentConfig = {
        temperature,
        maxOutputTokens,
        topP,
        topK,
      };

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: config,
      });

      const text = response.text || '';
      const candidates = response.candidates || [];
      const usageMetadata = response.usageMetadata || {};
      const toolCalls = response.functionCalls || [];

      return {
        text,
        candidates,
        usageMetadata,
        toolCalls,
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API content generation', error, `Model '${model}' not found or authentication failed.`));
    }
  }

  /**
   * Generate content using Gemini's streaming API via backend.
   * @param prompt The user's prompt.
   * @param onStreamEvent A callback function to handle streaming events.
   * @param options Additional options for the request.
   */
  async generateStreamingContent(
    prompt: string,
    onStreamEvent: (event: StreamEvent) => void,
    options: {
      model?: string;
      history?: Array<{role: string, parts: Array<{text: string}>}>;
    } = {}
  ): Promise<void> {
    const { model = MODEL_CONFIG.chat, history = [] } = options;

    try {
      const response = await httpClient.post('/gemini/stream', {
        prompt,
        model,
        history,
      }, {
        responseType: 'stream'
      });

      const reader = response.data.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      const processBuffer = () => {
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep the last partial event in buffer
          for (const eventStr of events) {
              if (eventStr.startsWith('data: ')) {
                  const jsonStr = eventStr.replace('data: ', '');
                  try {
                      const event = JSON.parse(jsonStr) as StreamEvent;
                      onStreamEvent(event);
                  } catch (e) {
                      console.error("Failed to parse stream event:", jsonStr);
                  }
              }
          }
      };

      const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
              if(buffer) { // process any remaining data
                  processBuffer();
              }
              return;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          await read();
      };

      await read();

    } catch (error: any) {
      handleAppError('Gemini API streaming content generation', error, `Streaming failed.`);
      onStreamEvent({ type: 'error', data: 'Streaming failed.' });
    }
  }


  async generateImage(
    prompt: string,
    options: {
      model?: string;
      numberOfImages?: number;
      outputMimeType?: string;
      aspectRatio?: string;
      personGeneration?: string;
      negativePrompt?: string;
      imageInput?: { data: string; mimeType: string };
    } = {}
  ): Promise<string[]> {
    const {
      model = MODEL_CONFIG.image,
      numberOfImages = 1,
      outputMimeType = 'image/png',
      aspectRatio = '1:1',
      personGeneration = 'allow_adult',
      negativePrompt,
      imageInput,
    } = options;

    try {
      if (model.startsWith('gemini')) {
        const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
        if (imageInput) {
          contents[0].parts.push({
            inlineData: {
              data: imageInput.data,
              mimeType: imageInput.mimeType,
            },
          });
        }

        const response = await ai.models.generateContent({
          model,
          contents,
        });

        const imageUrls = response.candidates?.[0]?.content?.parts
          ?.filter(part => part.inlineData)
          .map(part => {
            const data = part.inlineData?.data;
            const mimeType = part.inlineData?.mimeType;
            const dataUrl = `data:${mimeType};base64,${data}`;
            return dataUrlToBlobUrl(dataUrl);
          });

        if (imageUrls && imageUrls.length > 0) {
          return await Promise.all(imageUrls);
        }
      } else if (model.startsWith('imagen')) {
        const response = await ai.models.generateImages({
          model,
          prompt,
          config: {
            numberOfImages,
            outputMimeType,
            aspectRatio: aspectRatio as any,
            personGeneration: personGeneration as any,
            negativePrompt,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const imageUrls = response.generatedImages.map(image => {
            const mimeType = image.image?.mimeType || outputMimeType;
            const dataUrl = `data:${mimeType};base64,${Buffer.from(image.image!.imageBytes!).toString('base64')}`;
            return dataUrlToBlobUrl(dataUrl);
          });
          return await Promise.all(imageUrls);
        }
      }

      throw new Error('Image generation response did not contain expected image data.');
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API image generation', error, 'Image generation failed.'));
    }
  }

  async generateSpeech(
    prompt: string,
    options: {
      model?: string;
      voiceConfig?: any;
      multiSpeakerVoiceConfig?: any;
    } = {}
  ): Promise<string> {
    const {
      model = MODEL_CONFIG.speech,
      voiceConfig,
      multiSpeakerVoiceConfig,
    } = options;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig,
            multiSpeakerVoiceConfig,
          },
        },
      });

      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        const audioBuffer = Buffer.from(data, 'base64');
        const wavUrl = await pcm16ToWavUrl(audioBuffer, 24000, 1);
        return wavUrl;
      }

      throw new Error('Speech generation response did not contain expected audio data.');
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API speech generation', error, 'Speech generation failed.'));
    }
  }

  async generateVideo(
    prompt: string,
    options: {
      model?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      personGeneration?: string;
      numberOfVideos?: number;
    } = {}
  ): Promise<string[]> {
    const {
      model = MODEL_CONFIG.video,
      aspectRatio = '16:9',
      durationSeconds = 8,
      personGeneration = 'allow_adult',
      numberOfVideos = 1,
    } = options;

    try {
      // Generate videos using the Veo models
      const response = await ai.models.generateVideos({
        model,
        prompt,
        config: {
          aspectRatio: aspectRatio as any,
          durationSeconds,
          personGeneration: personGeneration as any,
          numberOfVideos,
        },
      });

      // Handle the async operation
      let operation = response;
      
      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      // Extract video URLs
      const videoUrls: string[] = [];
      if (operation.response?.generatedVideos) {
        for (const generatedVideo of operation.response.generatedVideos) {
          if (generatedVideo.video?.uri) {
            // Download the video file
            const videoResponse = await fetch(generatedVideo.video.uri);
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            videoUrls.push(videoUrl);
          }
        }
      }

      return videoUrls;
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API video generation', error, 'Video generation failed.'));
    }
  }

  async generateStructuredContent(
    prompt: string,
    schema: any,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<any> {
    const {
      model = MODEL_CONFIG.structured,
      temperature = 0.7,
      maxOutputTokens = 2000
    } = options;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature,
          maxOutputTokens,
          responseSchema: schema,
          responseMimeType: 'application/json',
        },
      });

      const structuredData = JSON.parse(response.text || '{}');
      const rawContent = response.text;
      const usage = response.usageMetadata || {};

      return {
        structuredData,
        rawContent,
        usage
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API structured content generation', error, 'Structured content generation failed or authentication failed.'));
    }
  }

  async generateWithLongContext(
    prompt: string,
    context: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<GeminiGenerateContentResponse> {
    const {
      model = MODEL_CONFIG.longContext,
      temperature = 0.7,
      maxOutputTokens = 4000
    } = options;

    try {
      const fullPrompt = `Context:\n${context}\n\nBased on the above context, please respond to this request:\n${prompt}`;

      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
          temperature,
          maxOutputTokens,
        },
      });

      const text = response.text || '';
      const candidates = response.candidates || [];
      const usageMetadata = response.usageMetadata || {};
      const toolCalls = response.functionCalls || [];

      return {
        text,
        candidates,
        usageMetadata,
        toolCalls,
      };
    } catch (error: any) {
      throw new Error(handleAppError('Gemini API long context generation', error, 'Long context generation failed or authentication failed.'));
    }
  }

  async liveConnect(options: LiveConnectParameters): Promise<any> {
    try {
      return await ai.live.connect(options);
    } catch (error: any) {
      throw new Error(handleAppError('Gemini Live API connection', error, 'Live API connection failed or authentication failed.'));
    }
  }
}

  // Widget-specific methods
  async generateWidgetConfigFromPrompt(
    description: string,
    options: { temperature?: number; maxOutputTokens?: number } = {}
  ): Promise<UniversalWidgetConfig> {
    const {
      temperature = 0.1, // Low temperature for consistent structured output
      maxOutputTokens = 2000
    } = options;

    try {
      // Read the system prompt
      const promptPath = './src/constants/prompts/widgetGenerationPrompt.md';
      const systemInstruction = readFileSync(promptPath, 'utf8');

      // Define response schema based on UniversalWidgetConfig
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique widget ID (generate if not provided)' },
          name: { type: Type.STRING, description: 'Widget display name' },
          controlType: {
            type: Type.STRING,
            enum: ['button', 'switch', 'slider', 'picker', 'stepper', 'color', 'text', 'multi', 'status', 'progress', 'meter', 'chart'],
            description: 'Widget control type'
          },
          actionType: { type: Type.STRING, description: 'OBS WebSocket action (e.g., SetInputVolume)' },
          targetType: {
            type: Type.STRING,
            enum: ['input', 'scene', 'source', 'filter', 'transition', 'global'],
            description: 'Target type for the action'
          },
          targetName: { type: Type.STRING, description: 'Specific target name (e.g., Mic)' },
          property: { type: Type.STRING, description: 'Property to modify (if applicable)' },
          valueMapping: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              step: { type: Type.NUMBER },
              unit: { type: Type.STRING }
            },
            description: 'Value constraints and scaling'
          },
          eventSubscriptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Events to subscribe for real-time updates'
          },
          visualConfig: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              size: { type: Type.STRING }
            },
            description: 'Visual styling options'
          },
          reactionConfig: {
            type: Type.OBJECT,
            properties: {
              onChange: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT }
              }
            },
            description: 'Reaction chain configurations'
          },
          validation: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            },
            description: 'Input validation rules'
          },
          performance: {
            type: Type.OBJECT,
            properties: {
              debounce: { type: Type.NUMBER }
            },
            description: 'Performance optimization settings'
          }
        },
        required: ['name', 'controlType', 'actionType', 'targetType'],
        description: 'Complete UniversalWidgetConfig object'
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate an OBS widget configuration based on this description: "${description}". Use the project mappings and ensure all required fields are present.`
          }]
        }],
        config: {
          systemInstruction,
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema
        },
      });

      if (!response.text) {
        throw new Error('No response generated from Gemini');
      }

      // Parse and validate the JSON response
      let config: UniversalWidgetConfig;
      try {
        config = JSON.parse(response.text);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      // Basic validation
      if (!config.name || !config.controlType || !config.actionType || !config.targetType) {
        throw new Error('Generated config missing required fields');
      }

      // Generate ID if not present
      if (!config.id) {
        config.id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      return config;
    } catch (error: any) {
      throw new Error(handleAppError('Gemini widget config generation', error, 'Failed to generate widget configuration from description.'));
    }
  }

  async createWidgetChatSession(): Promise<any> {
    try {
      // Create a chat session for iterative refinement
      const chat = ai.chats.create({ model: 'gemini-2.5-pro' });
      
      // Initialize with the system prompt
      const promptPath = './src/constants/prompts/widgetGenerationPrompt.md';
      const systemInstruction = readFileSync(promptPath, 'utf8');
      
      // Send initial system message to set context
      await chat.sendMessage({
        message: `System: ${systemInstruction}\n\nReady to help configure OBS widgets. Please describe your desired widget.`
      });

      return chat;
    } catch (error: any) {
      throw new Error(handleAppError('Gemini chat session creation', error, 'Failed to create chat session for widget configuration.'));
    }
  }

  // Method for follow-up refinements in chat session
  async refineWidgetConfig(chatSession: any, refinementPrompt: string): Promise<UniversalWidgetConfig> {
    try {
      const response = await chatSession.sendMessage({ message: refinementPrompt });
      
      if (!response.text) {
        throw new Error('No response from chat refinement');
      }

      let config: UniversalWidgetConfig;
      try {
        config = JSON.parse(response.text);
      } catch (parseError) {
        throw new Error(`Failed to parse refinement JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      // Validate required fields
      if (!config.name || !config.controlType || !config.actionType || !config.targetType) {
        throw new Error('Refined config missing required fields');
      }

      return config;
    } catch (error: any) {
      throw new Error(handleAppError('Gemini widget refinement', error, 'Failed to refine widget configuration.'));
    }
  }

export const geminiService = aiMiddleware(new GeminiService());