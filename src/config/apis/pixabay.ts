export const pixabay = {
  label: 'Pixabay',
  baseUrl: 'https://pixabay.com/api/',
  paramMappings: { q: 'q', image_type: 'image_type', orientation: 'orientation', per_page: 'per_page', page: 'page' },
  apiKey: { queryParam: 'key', envVars: ['PIXABAY_API_KEY', 'VITE_PIXABAY_API_KEY'], paramName: 'key' },
  requiresKey: true,
  responseDataPath: 'hits',
};
