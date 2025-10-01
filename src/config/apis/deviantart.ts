export const deviantart = {
  label: 'DeviantArt',
  baseUrl: 'https://www.deviantart.com/api/v1/oauth2/browse/search',
  paramMappings: { q: 'q', limit: 'limit', mature_content: 'mature_content' },
  apiKey: {
    queryParam: 'access_token',
    envVars: ['DEVIANTART_API_KEY', 'VITE_DEVIANTART_API_KEY'],
    paramName: 'access_token',
  },
  requiresKey: true,
  responseDataPath: 'results',
};
