const apiConfigs = {
  wallhaven: {
    label: 'Wallhaven',
    baseUrl: 'https://wallhaven.cc/api/v1/search',
    paramMappings: { q: 'q', categories: 'categories', purity: 'purity', sorting: 'sorting', order: 'order', page: 'page' },
    defaultParams: { categories: '111', purity: '100', sorting: 'relevance', order: 'desc' },
    requiresKey: false, // Wallhaven public API doesn't strictly require a key for basic search
    // apiKey: { queryParam: 'apikey', envVars: ['WALLHAVEN_API_KEY'] }, // Optional key
    responseDataPath: 'data', // Path to array, e.g., if response is { data: [...] }
    // transformResult: (item) => item, // Default: return item as is
  },
  pexels: {
    label: 'Pexels',
    baseUrl: 'https://api.pexels.com/v1/search',
    // Client sends 'query', Pexels API also expects 'query'.
    // Client sends 'per_page', Pexels API also expects 'per_page'.
    paramMappings: { query: 'query', per_page: 'per_page', orientation: 'orientation', page: 'page' },
    authHeader: 'Authorization',
    apiKey: { queryParam: 'key', envVars: ['PEXELS_API_KEY', 'VITE_PEXELS_API_KEY'] },
    requiresKey: true,
    responseDataPath: 'photos',
    // transformResult: (item) => item,
  },
  pixabay: {
    label: 'Pixabay',
    baseUrl: 'https://pixabay.com/api/',
    paramMappings: { q: 'q', image_type: 'image_type', orientation: 'orientation', per_page: 'per_page', page: 'page' },
    apiKey: { queryParam: 'key', envVars: ['PIXABAY_API_KEY', 'VITE_PIXABAY_API_KEY'], paramName: 'key' }, // Pixabay key is a regular param
    requiresKey: true,
    responseDataPath: 'hits',
    // transformResult: (item) => item,
  },
  deviantart: { // Note: DeviantArt's public search might be limited or deprecated. This is a best guess.
    label: 'DeviantArt',
    baseUrl: 'https://www.deviantart.com/api/v1/oauth2/browse/search', // This might require OAuth2 token
    paramMappings: { q: 'q', limit: 'limit', mature_content: 'mature_content' },
    apiKey: { queryParam: 'access_token', envVars: ['DEVIANTART_API_KEY', 'VITE_DEVIANTART_API_KEY'], paramName: 'access_token'},
    requiresKey: true, // Typically yes
    responseDataPath: 'results',
    // transformResult: (item) => item,
  },
  imgflip: { // For memes primarily, but can return GIFs
    label: 'Imgflip',
    baseUrl: 'https://api.imgflip.com/search', // This is likely for their meme search, not generic GIFs
    paramMappings: { q: 'q', limit: 'limit', page: 'page' },
    apiKey: { queryParam: 'api_key', envVars: ['IMGFLIP_API_KEY', 'VITE_IMGFLIP_API_KEY'], paramName: 'api_key' },
    requiresKey: false, // Some endpoints might work without a key but are rate-limited
    responseDataPath: 'data.memes', // Example, adjust if it's for GIFs specifically
    // transformResult: (item) => item,
  },
  imgur: { // Imgur gallery search
    label: 'Imgur',
    baseUrl: 'https://api.imgur.com/3/gallery/search',
    paramMappings: { q: 'q', limit: 'limit', page: 'page', q_type: 'q_type' /* e.g. 'gif' */ },
    authHeader: 'Authorization', // Uses 'Client-ID YOUR_CLIENT_ID'
    apiKey: { envVars: ['IMGUR_API_KEY', 'VITE_IMGUR_API_KEY'], prefix: 'Client-ID ' }, // Special prefix for Imgur
    requiresKey: true,
    responseDataPath: 'data',
    // transformResult: (item) => item,
  },
  artstation: {
    label: 'ArtStation',
    baseUrl: 'https://www.artstation.com/search/projects.json',
    paramMappings: { q: 'q', page: 'page', per_page: 'per_page' },
    requiresKey: false,
    userAgent: 'OBS-Copilot/1.0', // ArtStation might require a User-Agent
    responseDataPath: 'data',
    // transformResult: (item) => item,
  },
  iconfinder: { // For Iconfinder search (not SVG fetch)
    label: 'Iconfinder Search',
    baseUrl: 'https://api.iconfinder.com/v4/icons/search',
    paramMappings: { query: 'query', count: 'count', premium: 'premium', vector: 'vector' },
    authHeader: 'Authorization', // Bearer token
    apiKey: { envVars: ['ICONFINDER_API_KEY', 'VITE_ICONFINDER_API_KEY'], prefix: 'Bearer ' },
    requiresKey: true,
    // responseDataPath: 'icons', // Assuming results are in 'icons' array
    // transformResult: (item) => item, // Or map to a common structure
  },
  // Giphy is handled separately by its SDK usually, but if we proxy search:
  giphy: {
    label: 'Giphy',
    baseUrl: 'https://api.giphy.com/v1/gifs/search',
    paramMappings: { q: 'q', limit: 'limit', offset: 'offset', rating: 'rating', lang: 'lang' },
    apiKey: { queryParam: 'api_key', envVars: ['GIPHY_API_KEY', 'VITE_GIPHY_API_KEY'], paramName: 'api_key' },
    requiresKey: true,
    responseDataPath: 'data',
    // transformResult: (item) => item,
  }
};

module.exports = { apiConfigs };
