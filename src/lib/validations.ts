import { z } from 'zod';

/**
 * Zod schema for OBS WebSocket connection settings.
 */
export const obsConnectionSchema = z.object({
  obsWebSocketUrl: z
    .string()
    .regex(/^wss?:\/\/\S+$/, 'Invalid URL format. Must be a valid WebSocket URL (e.g., ws://localhost:4455 or wss://...).'),
  obsPassword: z.string().optional(),
});

/**
 * Zod schema for Streamer.bot connection settings.
 */
export const streamerBotConnectionSchema = z.object({
  streamerBotAddress: z.string().min(1, 'Address cannot be empty.'),
  streamerBotPort: z
    .string()
    .regex(/^\d+$/, 'Port must be a number.')
    .min(1, 'Port cannot be empty.'),
});

/**
 * Zod schema for Gemini API key.
 */
export const geminiApiKeySchema = z.object({
  geminiApiKey: z.string().min(1, 'Gemini API Key cannot be empty when override is enabled.'),
});

/**
 * Zod schema for chat input messages.
 */
export const chatInputSchema = z.object({
  chatInputValue: z
    .string()
    .min(1, 'Message cannot be empty.')
    .max(500, 'Message is too long (max 500 characters).'),
});

/**
 * Zod schema for GIF search queries.
 */
export const gifSearchSchema = z.object({
  gifQuery: z
    .string()
    .min(1, 'Search query cannot be empty.')
    .max(100, 'Search query is too long (max 100 characters).'),
});
