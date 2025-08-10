export const giphy = {
  label: 'Giphy',
  baseUrl: 'https://api.giphy.com/v1/gifs/search',
  paramMappings: { q: 'q', limit: 'limit', offset: 'offset', rating: 'rating', lang: 'lang' },
  apiKey: {
    queryParam: 'api_key',
    envVars: ['GIPHY_API_KEY', 'VITE_GIPHY_API_KEY'],
    paramName: 'api_key',
  },
  requiresKey: true,
  responseDataPath: 'data',
  cacheable: true,
};
