export const pexels = {
  label: 'Pexels',
  baseUrl: 'https://api.pexels.com/v1/search',
  paramMappings: { query: 'query', per_page: 'per_page', orientation: 'orientation', page: 'page' },
  authHeader: 'Authorization',
  apiKey: { queryParam: 'key', envVars: ['PEXELS_API_KEY', 'VITE_PEXELS_API_KEY'] },
  requiresKey: true,
  responseDataPath: 'photos',
};
