// Mock import.meta.env for Jest
global.import_meta_env = {
  VITE_OBS_WEBSOCKET_URL: 'ws://localhost:4455',
  VITE_STREAMERBOT_WEBSOCKET_URL: 'ws://localhost:8080',
  VITE_STREAMERBOT_WEBSOCKET_PORT: '8080',
  VITE_STREAMERBOT_AUTH_TOKEN: 'mock-token',
  VITE_GIPHY_API_KEY: 'mock-giphy-key',
  VITE_UNSPLASH_ACCESS_KEY: 'mock-unsplash-key',
};

// Set process.env variables for proxy.mjs
process.env.PEXELS_API_KEY = 'a'.repeat(56); // 56 characters for Pexels API key
process.env.ICONFINDER_API_KEY = 'TEST_ICONFINDER_KEY';
// Add other API keys as needed for integration tests
// For example:
// process.env.GIPHY_API_KEY = 'mock-giphy-key';
// process.env.UNSPLASH_API_KEY = 'mock-unsplash-key';