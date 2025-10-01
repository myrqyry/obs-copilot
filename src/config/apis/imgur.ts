export const imgur = {
  label: 'Imgur',
  baseUrl: 'https://api.imgur.com/3/gallery/search',
  paramMappings: { q: 'q', limit: 'limit', page: 'page', q_type: 'q_type' },
  authHeader: 'Authorization',
  apiKey: { envVars: ['IMGUR_API_KEY', 'VITE_IMGUR_API_KEY'], prefix: 'Client-ID ' },
  requiresKey: true,
  responseDataPath: 'data',
};
