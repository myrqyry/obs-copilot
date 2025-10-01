// Mock the httpClient service
jest.mock('../httpClient', () => ({
  httpClient: {
    post: jest.fn(),
  },
}));


// Mock errorUtils for handleAppError
jest.mock('../../lib/errorUtils', () => ({
  handleAppError: jest.fn(() => 'Mocked error message'),
}));

// Mock lib/utils for dataUrlToBlobUrl
jest.mock('../../lib/utils', () => ({
  dataUrlToBlobUrl: jest.fn((url: string) => `blob:${url}`),
}));

// Mock constants and config
jest.mock('../../config/modelConfig', () => ({
  MODEL_CONFIG: {
    chat: 'gemini-2.5-flash',
    image: 'imagen-4.0-fast-generate-001',
    speech: 'gemini-2.5-flash-speech',
    video: 'veo-3.0-fast-generate-preview',
    structured: 'gemini-2.5-pro',
    longContext: 'gemini-2.5-pro-long',
  },
}));

// Mock Buffer from buffer package
jest.mock('buffer', () => ({
  Buffer: {
    from: jest.fn(() => ({ /* mock buffer */ })),
  },
}));

// Mock pcmToWavUrl from lib
jest.mock('../../lib/pcmToWavUrl', () => ({
  pcm16ToWavUrl: jest.fn(() => Promise.resolve('mock-wav-url')),
}));

import { geminiService } from '../geminiService';
import useUiStore from '../../store/uiStore';
import { handleAppError } from '../../lib/errorUtils';
import { httpClient } from '../httpClient';
import { MODEL_CONFIG } from '../../config/modelConfig';
import { dataUrlToBlobUrl } from '../../lib/utils';
import { pcm16ToWavUrl } from '../../lib/pcmToWavUrl';

describe('GeminiService', () => {
  const mockPost = jest.fn();
  let addErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    addErrorSpy = jest.spyOn(useUiStore.getState(), 'addError');
    httpClient.post = mockPost;
    (handleAppError as jest.Mock).mockReturnValue('Mocked error message');
    (dataUrlToBlobUrl as jest.Mock).mockImplementation((url: string) => `blob:${url}`);
    (pcm16ToWavUrl as jest.Mock).mockResolvedValue('mock-wav-url');
  });

  afterEach(() => {
    addErrorSpy.mockRestore();
  });

  describe('generateContent', () => {
    it('should generate content successfully with default options', async () => {
      const mockResponse = { candidates: [{ content: { parts: [{ text: 'Mock response' }] } }] };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await geminiService.generateContent('Test prompt');

      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-content', {
        prompt: 'Test prompt',
        model: MODEL_CONFIG.chat,
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
        topK: 40,
        history: [],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle custom options', async () => {
      const mockResponse = { candidates: [{ content: { parts: [{ text: 'Mock response' }] } }] };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      await geminiService.generateContent('Test prompt', {
        model: 'gemini-2.5-pro',
        temperature: 0.5,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 30,
        history: [{ role: 'user', parts: [{ text: 'Previous message' }] }],
      });

      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-content', {
        prompt: 'Test prompt',
        model: 'gemini-2.5-pro',
        temperature: 0.5,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 30,
        history: [{ role: 'user', parts: [{ text: 'Previous message' }] }],
      });
    });

    it('should handle 401/403 errors by adding to uiStore', async () => {
      const mockError = { response: { status: 401 } };
      mockPost.mockRejectedValueOnce(mockError);

      await expect(geminiService.generateContent('Test prompt')).rejects.toThrow('Mocked error message');
      expect(addErrorSpy).toHaveBeenCalledWith({
        message: 'Mocked error message',
        source: 'geminiService',
        level: 'critical',
        details: { model: MODEL_CONFIG.chat, error: mockError },
      });
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Network error');
      mockPost.mockRejectedValueOnce(mockError);

      await expect(geminiService.generateContent('Test prompt')).rejects.toThrow('Mocked error message');
      expect(addErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('generateStreamingContent', () => {
    it('should stream content successfully', async () => {
      const mockStreamEvent = { type: 'chunk', data: { text: 'Mock chunk' } };
      const mockResponseData = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(mockStreamEvent)}\n\n`));
          controller.close();
        },
      });
      mockPost.mockResolvedValueOnce({ data: mockResponseData });

      const streamEvents: any[] = [];
      const onStreamEvent = (event: any) => streamEvents.push(event);

      await (geminiService as any).generateStreamingContent('Test prompt', onStreamEvent);

      expect(mockPost).toHaveBeenCalledWith('/gemini/stream', {
        prompt: 'Test prompt',
        model: MODEL_CONFIG.chat,
        history: [],
      }, { responseType: 'stream' });
      expect(streamEvents).toEqual([mockStreamEvent]);
    });

    it('should handle streaming errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Stream error'));

      const streamEvents: any[] = [];
      const onStreamEvent = (event: any) => streamEvents.push(event);

      await (geminiService as any).generateStreamingContent('Test prompt', onStreamEvent);

      expect(streamEvents).toEqual([{ type: 'error', data: 'Streaming failed.' }]);
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      const mockImageUrls = ['data:image/png;base64,mock'];
      mockPost.mockResolvedValueOnce({ data: { imageUrls: mockImageUrls } });

      const result = await geminiService.generateImage('Test image prompt');

      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-image', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(['blob:data:image/png;base64,mock']);
    });

    it('should include image input in form data', async () => {
      mockPost.mockResolvedValueOnce({ data: { imageUrls: [] } });

      await geminiService.generateImage('Test prompt', {
        imageInput: { data: 'mock-data', mimeType: 'image/jpeg' },
      });

      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get('imageData')).toBe('mock-data');
      expect(formData.get('imageMimeType')).toBe('image/jpeg');
    });

    it('should handle auth errors', async () => {
      mockPost.mockRejectedValueOnce({ response: { status: 403 } });

      await expect(geminiService.generateImage('Test prompt')).rejects.toThrow('Mocked error message');
      expect(addErrorSpy).toHaveBeenCalled();
    });
  });

  describe('generateSpeech', () => {
    it('should generate speech successfully', async () => {
      const mockAudioData = 'mock-base64-audio';
      mockPost.mockResolvedValueOnce({ data: { audioData: mockAudioData } });

      const result = await geminiService.generateSpeech('Test speech prompt');

      expect(result).toBe('mock-wav-url');
      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-speech', {
        prompt: 'Test speech prompt',
        model: MODEL_CONFIG.speech,
        voiceConfig: undefined,
        multiSpeakerVoiceConfig: undefined,
      });
    });

    it('should throw if no audioData in response', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await expect(geminiService.generateSpeech('Test prompt')).rejects.toThrow('Speech generation response did not contain expected audio data.');
    });

    it('should handle errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Speech error'));

      await expect(geminiService.generateSpeech('Test prompt')).rejects.toThrow('Mocked error message');
    });
  });

  describe('generateVideo', () => {
    it('should generate video successfully', async () => {
      const mockVideoUrls = ['mock-video-url'];
      mockPost.mockResolvedValueOnce({ data: { videoUrls: mockVideoUrls } });

      const result = await geminiService.generateVideo('Test video prompt');

      expect(result).toEqual(mockVideoUrls);
      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-video', {
        prompt: 'Test video prompt',
        model: MODEL_CONFIG.video,
        aspectRatio: '16:9',
        durationSeconds: 8,
        personGeneration: 'allow_adult',
        numberOfVideos: 1,
      });
    });

    it('should handle errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Video error'));

      await expect(geminiService.generateVideo('Test prompt')).rejects.toThrow('Mocked error message');
    });
  });

  describe('generateStructuredContent', () => {
    it('should generate structured content successfully', async () => {
      const mockStructuredData = { key: 'value' };
      const mockSchema = { type: 'object', properties: { key: { type: 'string' } } };
      mockPost.mockResolvedValueOnce({
        data: { structuredData: mockStructuredData, rawContent: 'mock', usage: { tokens: 100 } },
      });

      const result = await geminiService.generateStructuredContent('Test prompt', mockSchema);

      expect(result).toEqual({
        structuredData: mockStructuredData,
        rawContent: 'mock',
        usage: { tokens: 100 },
      });
      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-structured', {
        prompt: 'Test prompt',
        model: MODEL_CONFIG.structured,
        temperature: 0.7,
        maxOutputTokens: 2000,
        schema: JSON.stringify(mockSchema),
      });
    });

    it('should handle errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Structured error'));

      await expect(geminiService.generateStructuredContent('Test prompt', {})).rejects.toThrow('Mocked error message');
    });
  });

  describe('generateWithLongContext', () => {
    it('should generate with long context successfully', async () => {
      const mockResponse = { candidates: [{ content: { parts: [{ text: 'Mock long response' }] } }] };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await geminiService.generateWithLongContext('Test prompt', 'Long context text');

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-long-context', {
        prompt: 'Test prompt',
        context: 'Long context text',
        model: MODEL_CONFIG.longContext,
        temperature: 0.7,
        maxOutputTokens: 4000,
      });
    });

    it('should handle auth errors', async () => {
      mockPost.mockRejectedValueOnce({ response: { status: 401 } });

      await expect(geminiService.generateWithLongContext('Test prompt', 'context')).rejects.toThrow('Mocked error message');
      expect(addErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
        details: { model: MODEL_CONFIG.longContext, contextLength: 7, error: expect.any(Object) },
      }));
    });
  });

  describe('generateWidgetConfigFromPrompt', () => {
    it('should generate widget config successfully', async () => {
      const mockConfig = { type: 'knob', id: 'mock-id' };
      mockPost.mockResolvedValueOnce({ data: mockConfig });

      const result = await (geminiService as any).generateWidgetConfigFromPrompt('Test widget description');

      expect(result).toEqual(mockConfig);
      expect(mockPost).toHaveBeenCalledWith('/gemini/generate-widget-config', {
        description: 'Test widget description',
        temperature: 0.1,
        maxOutputTokens: 2000,
      });
    });

    it('should add id if missing', async () => {
      const mockConfig = { type: 'knob' };
      mockPost.mockResolvedValueOnce({ data: mockConfig });

      const result = await (geminiService as any).generateWidgetConfigFromPrompt('Test description');

      expect(result.id).toMatch(/^widget_\d+_/);
      expect(result.type).toBe('knob');
    });

    it('should handle errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('Widget error'));

      await expect((geminiService as any).generateWidgetConfigFromPrompt('Test prompt')).rejects.toThrow('Mocked error message');
    });
  });

  describe('Unsupported methods', () => {
    it('should throw for liveConnect', async () => {
      await expect(geminiService.liveConnect({ model: 'gemini-2.5-flash', callbacks: { onmessage: jest.fn() } })).rejects.toThrow('Live API connection not supported in proxied mode');
    });

    it('should throw for createWidgetChatSession', async () => {
      await expect((geminiService as any).createWidgetChatSession()).rejects.toThrow('Widget chat sessions not supported in proxied mode');
    });

    it('should throw for refineWidgetConfig', async () => {
      await expect((geminiService as any).refineWidgetConfig({}, 'refinement')).rejects.toThrow('Widget refinement not supported in proxied mode');
    });
  });
});