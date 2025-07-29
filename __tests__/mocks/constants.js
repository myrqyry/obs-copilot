// Mock import.meta.env for Jest
export const DEFAULT_OBS_WEBSOCKET_URL = process.env.VITE_OBS_WEBSOCKET_URL || 'ws://localhost:4455';
export const DEFAULT_STREAMERBOT_WEBSOCKET_URL = process.env.VITE_STREAMERBOT_WEBSOCKET_URL || 'ws://localhost:8080';
export const DEFAULT_STREAMERBOT_WEBSOCKET_PORT = process.env.VITE_STREAMERBOT_WEBSOCKET_PORT || '8080';
export const DEFAULT_STREAMERBOT_AUTH_TOKEN = process.env.VITE_STREAMERBOT_AUTH_TOKEN || null;

// Giphy API
export const GIPHY_API_KEY = process.env.VITE_GIPHY_API_KEY;
export const GIPHY_API_BASE_URL = 'https://api.giphy.com/v1/gifs';

// Unsplash API
export const UNSPLASH_ACCESS_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY;
export const UNSPLASH_API_BASE_URL = 'https://api.unsplash.com/';

export const COMMON_RESOLUTIONS = []; // Mock as empty or simplified array
export const COMMON_FPS = []; // Mock as empty or simplified array
export const INITIAL_SYSTEM_PROMPT = 'mock system prompt';
export const catppuccinMochaColors = {}; // Mock as empty object
export const hexToHsl = jest.fn(); // Mock function