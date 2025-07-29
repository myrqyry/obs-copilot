import {
  obsConnectionSchema,
  streamerBotConnectionSchema,
  geminiApiKeySchema,
  chatInputSchema,
  gifSearchSchema,
} from '../src/lib/validations';
import { ZodError } from 'zod';

describe('Validation Schemas', () => {
  describe('obsConnectionSchema', () => {
    it('should validate a correct OBS WebSocket URL and optional password', () => {
      expect(obsConnectionSchema.parse({ obsWebSocketUrl: 'ws://localhost:4455' })).toEqual({
        obsWebSocketUrl: 'ws://localhost:4455',
      });
      expect(
        obsConnectionSchema.parse({ obsWebSocketUrl: 'ws://192.168.1.100:4455', obsPassword: 'test' })
      ).toEqual({
        obsWebSocketUrl: 'ws://192.168.1.100:4455',
        obsPassword: 'test',
      });
    });

    it('should throw an error for an invalid OBS WebSocket URL', () => {
      expect(() => obsConnectionSchema.parse({ obsWebSocketUrl: 'invalid-url' })).toThrow(ZodError);
      expect(() => obsConnectionSchema.parse({ obsWebSocketUrl: 'http://localhost:4455' })).toThrow(ZodError);
    });

    it('should throw an error if obsWebSocketUrl is missing', () => {
      expect(() => obsConnectionSchema.parse({})).toThrow(ZodError);
    });
  });

  describe('streamerBotConnectionSchema', () => {
    it('should validate a correct Streamer.bot address and port', () => {
      expect(
        streamerBotConnectionSchema.parse({ streamerBotAddress: 'localhost', streamerBotPort: '8080' })
      ).toEqual({
        streamerBotAddress: 'localhost',
        streamerBotPort: '8080',
      });
      expect(
        streamerBotConnectionSchema.parse({ streamerBotAddress: '192.168.1.100', streamerBotPort: '1234' })
      ).toEqual({
        streamerBotAddress: '192.168.1.100',
        streamerBotPort: '1234',
      });
    });

    it('should throw an error for an empty Streamer.bot address', () => {
      expect(() => streamerBotConnectionSchema.parse({ streamerBotAddress: '', streamerBotPort: '8080' })).toThrow(ZodError);
    });

    it('should throw an error for an empty Streamer.bot port', () => {
      expect(() => streamerBotConnectionSchema.parse({ streamerBotAddress: 'localhost', streamerBotPort: '' })).toThrow(ZodError);
    });

    it('should throw an error for a non-numeric Streamer.bot port', () => {
      expect(() => streamerBotConnectionSchema.parse({ streamerBotAddress: 'localhost', streamerBotPort: 'abc' })).toThrow(ZodError);
    });
  });

  describe('geminiApiKeySchema', () => {
    it('should validate a correct Gemini API key', () => {
      expect(geminiApiKeySchema.parse({ geminiApiKey: 'some_api_key_123' })).toEqual({
        geminiApiKey: 'some_api_key_123',
      });
    });

    it('should throw an error for an empty Gemini API key', () => {
      expect(() => geminiApiKeySchema.parse({ geminiApiKey: '' })).toThrow(ZodError);
    });
  });

  describe('chatInputSchema', () => {
    it('should validate a correct chat message', () => {
      expect(chatInputSchema.parse({ chatInputValue: 'Hello, world!' })).toEqual({
        chatInputValue: 'Hello, world!',
      });
    });

    it('should throw an error for an empty chat message', () => {
      expect(() => chatInputSchema.parse({ chatInputValue: '' })).toThrow(ZodError);
    });

    it('should throw an error for a chat message that is too long', () => {
      const longMessage = 'a'.repeat(501);
      expect(() => chatInputSchema.parse({ chatInputValue: longMessage })).toThrow(ZodError);
    });
  });

  describe('gifSearchSchema', () => {
    it('should validate a correct GIF search query', () => {
      expect(gifSearchSchema.parse({ gifQuery: 'funny cat' })).toEqual({
        gifQuery: 'funny cat',
      });
    });

    it('should throw an error for an empty GIF search query', () => {
      expect(() => gifSearchSchema.parse({ gifQuery: '' })).toThrow(ZodError);
    });

    it('should throw an error for a GIF search query that is too long', () => {
      const longQuery = 'a'.repeat(101);
      expect(() => gifSearchSchema.parse({ gifQuery: longQuery })).toThrow(ZodError);
    });
  });
});