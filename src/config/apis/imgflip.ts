export const imgflip = {
  label: 'Imgflip',
  baseUrl: 'https://api.imgflip.com/search',
  paramMappings: { q: 'q', limit: 'limit', page: 'page' },
  apiKey: {
    queryParam: 'api_key',
    envVars: ['IMGFLIP_API_KEY', 'VITE_IMGFLIP_API_KEY'],
    paramName: 'api_key',
  },
  requiresKey: false,
  responseDataPath: 'data.memes',
};
