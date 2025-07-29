export const iconfinder = {
    label: 'Iconfinder Search',
    baseUrl: 'https://api.iconfinder.com/v4/icons/search',
    paramMappings: { query: 'query', count: 'count', premium: 'premium', vector: 'vector' },
    authHeader: 'Authorization',
    apiKey: { envVars: ['ICONFINDER_API_KEY', 'VITE_ICONFINDER_API_KEY'], prefix: 'Bearer ' },
    requiresKey: true,
};
